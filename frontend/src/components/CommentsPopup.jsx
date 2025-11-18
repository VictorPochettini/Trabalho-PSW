import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchCommentsByPost,
  createComment,
  selectCommentsState,
  clearCommentsOfPost,
  deleteComment,
} from "../redux/commentsSlice";
import {
  fetchMyRatingForPost,
  fetchPostRating,
  upsertRating,
  removeRating,
  selectRatingState,
} from "../redux/ratingsSlice";
import { fetchUsuarios } from "../redux/usuariosSlice";

const Star = ({ filled, onClick, disabled }) => (
  <button
    type="button"
    aria-label="star"
    onClick={onClick}
    disabled={disabled}
    className={`star-btn ${filled ? "filled" : ""}`}
    style={{
      background: "transparent",
      border: "none",
      fontSize: 22,
      cursor: disabled ? "default" : "pointer",
      padding: 0,
      lineHeight: 1,
    }}
  >
    {filled ? "★" : "☆"}
  </button>
);

const CommentsPopup = ({ show, onClose, postId }) => {
  const dispatch = useDispatch();

  const { currentUser, usuarios: usuariosState } =
    useSelector((s) => s.user) || { currentUser: null, usuarios: [] };

  const usuarios = Array.isArray(usuariosState) ? usuariosState : [];

  const comments = useSelector(selectCommentsState(postId));
  const ratingState = useSelector(selectRatingState(postId));

  const [newCommentText, setNewCommentText] = useState("");
  const [lastStarClickTime, setLastStarClickTime] = useState(0);

  const usuarioId = currentUser?.id;
  const canComment = Boolean(usuarioId);

  // 🔎 garante que temos a lista de usuários quando o popup abrir
  useEffect(() => {
    if (!show) return;
    if (!usuarios.length) {
      dispatch(fetchUsuarios());
    }
  }, [show, usuarios.length, dispatch]);

  // Carregar comentários + avaliações quando o popup abre
  useEffect(() => {
    if (!show || !postId) return;
    
    dispatch(fetchCommentsByPost(postId));
    
    if (usuarioId) {
      // Se usuário logado, busca avaliação pessoal + média do post
      dispatch(fetchMyRatingForPost({ postId, usuarioId }));
    } else {
      // Se não logado, busca apenas a média do post
      dispatch(fetchPostRating(postId));
    }
    
    return () => {
      dispatch(clearCommentsOfPost(postId));
    };
  }, [show, postId, usuarioId, dispatch]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    const texto = newCommentText.trim();
    if (!texto || !canComment) return;
    await dispatch(createComment({ postId, usuarioId, texto }));
    setNewCommentText("");
  };

  const handleSetStars = async (value) => {
    if (!usuarioId) return;
    
    const currentTime = new Date().getTime();
    const isDoubleClick = currentTime - lastStarClickTime < 300; // 300ms para double click
    
    if (isDoubleClick && ratingState.myStars > 0) {
      // Double click: remove avaliação
      await dispatch(removeRating({ postId, usuarioId }));
    } else {
      // Single click: avalia normalmente
      const v = Math.min(5, Math.max(1, Number(value)));
      await dispatch(upsertRating({ postId, usuarioId, estrelas: v }));
    }
    
    setLastStarClickTime(currentTime);
  };

  const myStars = ratingState.myStars || 0;
  const ratingAvg = ratingState.postAvg || 0;
  const ratingCount = ratingState.postCount || 0;

  const resolveUserLabel = (uid) => {
    const user =
      usuarios.find((u) => Number(u.id) === Number(uid)) || null;
    if (!user) return `Usuário #${uid}`;
    return user.username || user.nome || `Usuário #${uid}`;
  };

  const timeago = (iso) => {
    if (!iso) return "";
    const diff = Date.now() - new Date(iso).getTime();
    const sec = Math.floor(diff / 1000);
    if (sec < 60) return "agora";
    const min = Math.floor(sec / 60);
    if (min < 60) return `há ${min} min`;
    const h = Math.floor(min / 60);
    if (h < 24) return `há ${h} h`;
    const d = Math.floor(h / 24);
    return `há ${d} d`;
  };

  // ✅ regra de permissão: admin OU autor do comentário
  const canDeleteComment = (comment) =>
    !!currentUser &&
    (currentUser.admin === true ||
      Number(currentUser.id) === Number(comment?.usuarioId));

  const handleDeleteComment = async (comment) => {
    if (!canDeleteComment(comment)) return;
    const ok = window.confirm("Excluir este comentário?");
    if (!ok) return;

    try {
      if (typeof deleteComment === "function") {
        await dispatch(deleteComment(comment.id));      } else {
        dispatch({ type: "comments/deleteRequested", payload: { id: comment.id, postId } });
      }
    } catch (e) {
      console.error("[CommentsPopup] delete comment error:", e);
    }
  };

  if (!show) return null;

  return (
    <div
      className="comments-overlay active"
      onClick={(e) =>
        e.target.classList.contains("comments-overlay") && onClose()
      }
    >
      <div className="comments-popup">
        <div className="comments-header">
          <h3>Comentários</h3>
          <button className="close-comments" onClick={onClose}>
            <i className="fas fa-times" />
          </button>
        </div>

        {/* Seção de Avaliação */}
        <div className="rating-area">
          <div className="rating-row">
            <div className="my-rating">
              <span className="label">Sua avaliação:</span>
              <div className="stars">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    filled={n <= myStars}
                    onClick={() => handleSetStars(n)}
                    disabled={!usuarioId || ratingState.saving}
                  />
                ))}
              </div>
              {!usuarioId && (
                <small className="muted">Faça login para avaliar</small>
              )}
              {usuarioId && (
                <small className="muted" style={{ display: 'block', marginTop: '4px' }}>
                  Double click para remover
                </small>
              )}
            </div>
            <div className="post-rating">
              <span className="label">Média do post:</span>
              <strong>{Number(ratingAvg || 0).toFixed(2)}</strong>
              <small className="muted">({ratingCount || 0})</small>
            </div>
          </div>
          {ratingState.error && (
            <div className="alert alert-danger mt-2">
              {ratingState.error}
            </div>
          )}
        </div>

        <div className="comments-content">
          {/* Lista de comentários */}
          <div className="comment-list">
            {comments.length === 0 ? (
              <p className="text-center text-muted mt-3">
                Nenhum comentário ainda. Seja o primeiro!
              </p>
            ) : (
              comments.items.map((c) => (
                <div key={c.id} className="comment-item">
                  <div className="comment-top">
                    <div className="comment-author">
                      <i className="fa-solid fa-circle-user" />
                      <span>{resolveUserLabel(c.usuarioId)}</span>
                      <span className="comment-time">{timeago(c.createdAt)}</span>
                    </div>

                    {/* 🔥 botão excluir só para admin/autor */}
                    {canDeleteComment(c) && (
                      <button
                        type="button"
                        className="comment-delete-btn"
                        title="Excluir comentário"
                        aria-label="Excluir comentário"
                        onClick={() => handleDeleteComment(c)}
                      >
                        <i className="fas fa-trash-alt" />
                      </button>
                    )}
                  </div>

                  <p className="comment-text"><span className="prewrap">{c.texto}</span></p>
                </div>
              ))
            )}
          </div>

          {/* Formulário */}
          <form className="comment-form" onSubmit={handleAddComment}>
            <textarea
              placeholder={
                canComment
                  ? "Adicione um comentário..."
                  : "Faça login para comentar"
              }
              rows="3"
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              disabled={!canComment}
            />
            <button type="submit" className="btn-comment" disabled={!canComment}>
              Comentar
            </button>
          </form>
        </div>
      </div>

      {/* estilos mínimos (apenas o necessário) */}
      <style>{`
      /* garante contraste e preserva \n */
.comments-popup { color: #000000ff; } 
.comment-item .comment-text {
  margin: 6px 0 4px;
  color: #000000ff;              
}
.prewrap {
  white-space: pre-wrap;       
  word-break: break-word;    
}

        .rating-area{ padding: 8px 16px; border-bottom: 1px solid rgba(255,255,255,0.08); }
        .rating-row{ display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; }
        .label{ margin-right:8px; opacity:0.9; }
        .stars{ display:inline-flex; gap:4px; vertical-align:middle; }
        .star-btn{ transition: transform .1s ease; }
        .star-btn:not(:disabled):hover{ transform: scale(1.08); }
        .star-btn.filled{ filter: drop-shadow(0 0 2px rgba(255,255,0,.25)); }
        .muted{ opacity:.7; margin-left:6px; }

        .comment-item{ padding:10px 12px; border-bottom:1px solid rgba(255,255,255,.08); }
        .comment-top{ display:flex; align-items:center; justify-content:space-between; gap:10px; }
        .comment-author{ display:flex; align-items:center; gap:8px; opacity:.95; }
        .comment-time{ font-size:12px; opacity:.7; }
        .comment-text{ margin:6px 0 0; color:#fff; }
        .prewrap{ white-space:pre-wrap; word-break:break-word; }

        .comment-delete-btn{
          background: linear-gradient(180deg, rgba(255,71,87,.92), rgba(214,48,49,.92));
          color:#fff; border:1px solid rgba(255,255,255,.18);
          border-radius:10px; padding:6px 10px; line-height:1;
          box-shadow: 0 6px 16px rgba(214,48,49,.35);
          transition: transform .15s ease, box-shadow .25s ease, filter .2s ease, border-color .2s ease;
        }
        .comment-delete-btn:hover{
          transform: translateY(-1px);
          box-shadow: 0 10px 22px rgba(214,48,49,.45);
          filter: brightness(1.03);
          border-color: rgba(255,255,255,.28);
        }
      `}</style>
    </div>
  );
};

export default CommentsPopup;