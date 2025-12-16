/**
 * @fileoverview Componente de popup para exibição e gerenciamento de comentários e avaliações
 * @module CommentsPopup
 * @description 
 * Este componente fornece uma interface para visualizar e adicionar comentários,
 * além de permitir a avaliação por estrelas (1-5) de uma postagem.
 * Integra-se com Redux para gerenciamento de estado e persistência de dados.
 */

import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchCommentsByPost,
  createComment,
  selectCommentsState,
  clearCommentsOfPost,
  deleteComment,
  updateComment,
} from "../redux/commentsSlice";
import {
  fetchMyRatingForPost,
  fetchPostRating,
  upsertRating,
  removeRating,
  selectRatingState,
} from "../redux/ratingsSlice";
import { fetchUsuarios } from "../redux/usuariosSlice";

/**
 * Componente de estrela para avaliação
 * @component
 * @param {Object} props - Propriedades do componente
 * @param {boolean} props.filled - Indica se a estrela deve ser exibida preenchida
 * @param {Function} props.onClick - Função chamada quando a estrela é clicada
 * @param {boolean} [props.disabled] - Indica se a estrela está desabilitada
 * @returns {JSX.Element} Componente de estrela de avaliação
 * 
 * @example
 * <Star
 *   filled={rating >= 3}
 *   onClick={() => handleRating(3)}
 *   disabled={isSubmitting}
 * />
 */
const Star = ({ filled, onClick, disabled }) => (
  <button
    type="button"
    aria-label="star"
    onClick={onClick}
    disabled={disabled}
    className={`star-btn ${filled ? "filled" : ""}`}
  >
    {filled ? "★" : "☆"}
  </button>
);

/**
 * Componente de popup para exibição e gerenciamento de comentários e avaliações
 * 
 * @component
 * @param {Object} props - Propriedades do componente
 * @param {boolean} props.show - Controla a visibilidade do popup
 * @param {Function} props.onClose - Função chamada quando o popup é fechado
 * @param {string} props.postId - ID da postagem associada aos comentários
 * @returns {JSX.Element} Componente de popup de comentários
 * 
 * @example
 * // Exemplo de uso
 * <CommentsPopup
 *   show={showComments}
 *   onClose={() => setShowComments(false)}
 *   postId="12345"
 * />
 * 
 * @description
 * Este componente gerencia:
 * - Exibição de comentários existentes
 * - Criação de novos comentários
 * - Edição e exclusão de comentários próprios
 * - Sistema de avaliação por estrelas (1-5)
 * - Cálculo e exibição da média de avaliações
 * - Sincronização com o Redux para gerenciamento de estado
 */
const CommentsPopup = ({ show, onClose, postId }) => {
  const dispatch = useDispatch();
  const commentsListRef = useRef(null);

  const currentUserState = useSelector((s) => s.user?.currentUser);
  const currentUser = currentUserState?.user ?? null;
  const usuarioId = currentUser?._id ?? currentUser?.id ?? null;

  const usuarios = useSelector((s) => s.user?.usuarios || []);

  const commentsState = useSelector((state) => selectCommentsState(postId)(state)) || { items: [], loading: false, error: null };
  const comments = commentsState.items || [];
  const ratingState = useSelector((state) => selectRatingState(postId)(state)) || {};

  const [newCommentText, setNewCommentText] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editText, setEditText] = useState("");

  const canComment = Boolean(usuarioId);

  /**
   * Efeito para gerenciar o overflow do body e carregar usuários
   * @effect
   * @listens show, usuarios.length
   */
  useEffect(() => {
    if (!show) {
      document.body.style.overflow = "";
      return;
    }
    document.body.style.overflow = "hidden";
    if (!Array.isArray(usuarios) || usuarios.length === 0) {
      dispatch(fetchUsuarios());
    }
  }, [show, usuarios.length, dispatch]);

  /**
   * Efeito para carregar comentários e avaliações quando o popup é aberto
   * @effect
   * @listens show, postId, usuarioId
   */
  useEffect(() => {
    if (!show || !postId) return;

    dispatch(fetchCommentsByPost(postId));

    // ✅ CORREÇÃO: Buscar avaliação do usuário quando popup abre
    if (usuarioId) {
      dispatch(fetchMyRatingForPost({ postId, usuarioId }));
    } else {
      dispatch(fetchPostRating(postId));
    }

    return () => {
      dispatch(clearCommentsOfPost(postId));
    };
  }, [show, postId, usuarioId, dispatch]);

  /**
   * Efeito para rolar para o topo da lista de comentários quando novos são carregados
   * @effect
   * @listens show, comments.length
   */
  useEffect(() => {
    if (show && comments.length > 0 && commentsListRef.current) {
      commentsListRef.current.scrollTop = 0;
    }
  }, [show, comments.length]);

  /**
   * Efeito para lidar com a tecla ESC para fechar o popup ou cancelar edição
   * @effect
   * @listens show, editingCommentId, onClose
   */
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && show) {
        if (editingCommentId) {
          handleCancelEdit();
        } else {
          onClose();
        }
      }
    };
    if (show) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [show, editingCommentId, onClose]);

  /**
   * Adiciona um novo comentário
   * @async
   * @function handleAddComment
   * @param {Event} e - Evento de submissão do formulário
   * @returns {Promise<void>}
   */
  const handleAddComment = async (e) => {
    e.preventDefault();
    const texto = newCommentText.trim();
    if (!texto || !canComment) return;
    try {
      await dispatch(createComment({ postId, texto })).unwrap();
      setNewCommentText("");
      await dispatch(fetchCommentsByPost(postId));
      
      if (commentsListRef.current) {
        setTimeout(() => {
          commentsListRef.current.scrollTop = 0;
        }, 100);
      }
    } catch (err) {
      console.error("[CommentsPopup] create comment error:", err);
      alert("Não foi possível enviar o comentário. Tente novamente.");
    }
  };

  /**
   * Atualiza a avaliação por estrelas do usuário
   * @async
   * @function handleSetStars
   * @param {number} value - Valor da avaliação (1-5)
   * @returns {Promise<void>}
   */
  const handleSetStars = async (value) => {
    if (!usuarioId || ratingState.saving) return;

    const v = Math.min(5, Math.max(1, Number(value)));
    
    try {
      // Salvar avaliação
      await dispatch(upsertRating({ postId, usuarioId, estrelas: v })).unwrap();
      
      // ✅ Recarregar avaliação do usuário para garantir sincronização
      await dispatch(fetchMyRatingForPost({ postId, usuarioId })).unwrap();
    } catch (err) {
      console.error("[CommentsPopup] rating error:", err);
      alert("Não foi possível registrar sua avaliação. Tente novamente.");
    }
  };

  const myStars = ratingState.myStars || 0;
  const ratingAvg = ratingState.postAvg || 0;
  const ratingCount = ratingState.postCount || 0;

  /**
   * Resolve o nome de usuário a partir do ID
   * @function resolveUserLabel
   * @param {string} uid - ID do usuário
   * @returns {string} Nome de exibição do usuário ou ID formatado
   */
  const resolveUserLabel = (uid) => {
    const user =
      usuarios.find((u) => {
        const candidate = u?._id ?? u?.id;
        return String(candidate) === String(uid);
      }) || null;
    if (!user) return `Usuário #${uid}`;
    return user.username || user.nome || `Usuário #${uid}`;
  };

  /**
   * Formata uma data para um formato relativo (ex: "há 2 min")
   * @function timeago
   * @param {string} iso - Data em formato ISO
   * @returns {string} String formatada com o tempo decorrido
   */
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

  /**
   * Verifica se o usuário atual pode excluir um comentário
   * @function canDeleteComment
   * @param {Object} comment - Objeto do comentário
   * @returns {boolean} Verdadeiro se o usuário pode excluir o comentário
   */
  const canDeleteComment = (comment) =>
    !!currentUser &&
    (currentUser.admin === true ||
      currentUser.role === "admin" ||
      String(currentUser._id ?? currentUser.id) === String(comment?.usuarioId));

  /**
   * Verifica se o usuário atual pode editar um comentário
   * @function canEditComment
   * @param {Object} comment - Objeto do comentário
   * @returns {boolean} Verdadeiro se o usuário pode editar o comentário
   */
  const canEditComment = (comment) =>
    !!currentUser &&
    String(currentUser._id ?? currentUser.id) === String(comment?.usuarioId);

  /**
   * Inicia a edição de um comentário
   * @function handleEditComment
   * @param {Object} comment - Comentário a ser editado
   */
  const handleEditComment = (comment) => {
    setEditingCommentId(comment.id || comment._id);
    setEditText(comment.texto);
  };

  /**
   * Salva as alterações de um comentário em edição
   * @async
   * @function handleSaveEdit
   * @param {string} commentId - ID do comentário a ser atualizado
   * @returns {Promise<void>}
   */
  const handleSaveEdit = async (commentId) => {
    const texto = editText.trim();
    if (!texto) return;

    try {
      await dispatch(updateComment({ 
        commentId, 
        texto 
      })).unwrap();
      
      setEditingCommentId(null);
      setEditText("");
      dispatch(fetchCommentsByPost(postId));
    } catch (err) {
      console.error("[CommentsPopup] update comment error:", err);
      alert("Não foi possível editar o comentário. Tente novamente.");
    }
  };

  /**
   * Cancela a edição de um comentário
   * @function handleCancelEdit
   */
  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditText("");
  };

  /**
   * Exclui um comentário após confirmação
   * @async
   * @function handleDeleteComment
   * @param {Object} comment - Comentário a ser excluído
   * @returns {Promise<void>}
   */
  const handleDeleteComment = async (comment) => {
    if (!canDeleteComment(comment)) return;
    const ok = window.confirm("Excluir este comentário?");
    if (!ok) return;

    const commentId = comment._id || comment.id;

    try {
      await dispatch(deleteComment(commentId)).unwrap();
      dispatch(fetchCommentsByPost(postId));
    } catch (e) {
      console.error("[CommentsPopup] delete comment error:", e);
      alert("Não foi possível excluir o comentário. Tente novamente.");
    }
  };

  if (!show) return null;

  return (
    <div
      className="comments-overlay"
      onClick={(e) => e.target.classList.contains("comments-overlay") && onClose()}
      role="presentation"
      aria-hidden={!show}
    >
      <div
        className="comments-popup"
        role="dialog"
        aria-modal="true"
        aria-label="Comentários e avaliações"
      >
        {/* Header */}
        <div className="comments-header">
          <h3>Comentários e Avaliações</h3>
          <button className="close-comments" onClick={onClose} aria-label="Fechar">
            <span aria-hidden>✕</span>
          </button>
        </div>

        <div className="comments-content-wrapper">
          {/* Seção de Avaliação */}
          <div className="rating-section">
            <div className="rating-user">
              <div className="rating-label">
                <i className="fas fa-star rating-icon" aria-hidden="true"></i>
                <span>Sua avaliação:</span>
              </div>
              <div className="stars" role="group" aria-label="Avaliação por estrelas">
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
                <small className="rating-hint">Faça login para avaliar</small>
              )}
              {ratingState.saving && (
                <small className="rating-hint">Salvando...</small>
              )}
            </div>

            <div className="rating-stats">
              <div className="stat-item">
                <span className="stat-label">Média:</span>
                <strong className="stat-value">{Number(ratingAvg || 0).toFixed(1)}</strong>
                <i className="fas fa-star stat-icon" aria-hidden="true"></i>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <span className="stat-label">Avaliações:</span>
                <strong className="stat-value">{ratingCount || 0}</strong>
              </div>
            </div>

            {ratingState.error && (
              <div className="rating-error" role="alert">
                {ratingState.error}
              </div>
            )}
          </div>

          {/* Lista de Comentários */}
          <div className="comments-list-wrapper">
            <div className="comments-list" ref={commentsListRef} aria-live="polite">
              {commentsState.loading && comments.length === 0 && (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Carregando comentários...</p>
                </div>
              )}

              {!commentsState.loading && comments.length === 0 && (
                <div className="empty-state">
                  <i className="fas fa-comments empty-icon" aria-hidden="true"></i>
                  <p>Nenhum comentário ainda.</p>
                  <p className="empty-hint">Seja o primeiro a comentar!</p>
                </div>
              )}

              {comments.length > 0 &&
                comments.map((c) => {
                  const cid = c._id || c.id;
                  const isEditing = String(editingCommentId) === String(cid);
                  const commentUser = resolveUserLabel(c.usuarioId);

                  return (
                    <div key={cid} className="comment-item">
                      <div className="comment-header-row">
                        <span className="comment-user">{commentUser}</span>
                        <div className="comment-meta-actions">
                          <span className="comment-time">{timeago(c.createdAt)}</span>
                          {canEditComment(c) && !isEditing && (
                            <button
                              className="comment-edit-btn"
                              onClick={() => handleEditComment(c)}
                              aria-label="Editar comentário"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                          )}
                          {canDeleteComment(c) && !isEditing && (
                            <button
                              className="comment-delete-btn"
                              onClick={() => handleDeleteComment(c)}
                              aria-label="Excluir comentário"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          )}
                        </div>
                      </div>

                      {!isEditing ? (
                        <p className="comment-text prewrap">{c.texto}</p>
                      ) : (
                        <div className="comment-edit-mode">
                          <textarea
                            className="edit-textarea"
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            placeholder="Edite seu comentário..."
                            rows={3}
                          />
                          <div className="edit-actions">
                            <button
                              className="btn-cancel-edit"
                              onClick={handleCancelEdit}
                            >
                              <i className="fas fa-times"></i>
                              Cancelar
                            </button>
                            <button
                              className="btn-save-edit"
                              onClick={() => handleSaveEdit(cid)}
                              disabled={!editText.trim()}
                            >
                              <i className="fas fa-check"></i>
                              Salvar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Formulário de Novo Comentário */}
          {canComment && (
            <div className="comment-form-wrapper">
              <div className="form-header">
                <i className="fas fa-comment form-icon" aria-hidden="true"></i>
                <span>Adicionar comentário</span>
              </div>
              <form onSubmit={handleAddComment}>
                <textarea
                  className="comment-textarea"
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder="Escreva seu comentário..."
                  rows={3}
                  disabled={!canComment}
                  maxLength={500}
                />
                <div className="form-actions">
                  <span className="char-count">
                    {newCommentText.length}/500
                  </span>
                  <button
                    type="submit"
                    className="btn-submit-comment"
                    disabled={!newCommentText.trim() || !canComment}
                  >
                    <i className="fas fa-paper-plane"></i>
                    Enviar
                  </button>
                </div>
              </form>
            </div>
          )}

          {!canComment && (
            <div className="login-prompt">
              <i className="fas fa-lock login-icon" aria-hidden="true"></i>
              <p>Faça login para comentar</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        /* Overlay */
        .comments-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 1rem;
          animation: fadeIn 0.2s ease-in-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        /* Popup Container */
        .comments-popup {
          background: linear-gradient(135deg, rgba(26, 26, 46, 0.98), rgba(20, 20, 36, 0.98));
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          max-width: 600px;
          width: 100%;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 24px 64px rgba(0, 0, 0, 0.5);
          animation: slideUp 0.3s ease-out;
        }

        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        /* Header */
        .comments-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          flex-shrink: 0;
        }

        .comments-header h3 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
          background: linear-gradient(135deg, #6a5ae0, #8b7ee8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .close-comments {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #fff;
          font-size: 1.25rem;
          transition: all 0.2s ease;
        }

        .close-comments:hover {
          background: rgba(255, 255, 255, 0.12);
          transform: scale(1.05);
        }

        /* Content Wrapper */
        .comments-content-wrapper {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          padding: 1.5rem;
          overflow-y: auto;
          flex: 1;
          min-height: 0;
        }

        /* Custom Scrollbar */
        .comments-content-wrapper::-webkit-scrollbar {
          width: 8px;
        }

        .comments-content-wrapper::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.03);
          border-radius: 4px;
        }

        .comments-content-wrapper::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.15);
          border-radius: 4px;
          transition: background 0.2s;
        }

        .comments-content-wrapper::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.25);
        }

        /* Rating Section */
        .rating-section {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          flex-shrink: 0;
        }

        .rating-user {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .rating-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #fff;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .rating-icon {
          color: #f5c542;
          font-size: 1rem;
        }

        .stars {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }

        .star-btn {
          background: none;
          border: none;
          color: #f5c542;
          font-size: 1.75rem;
          cursor: pointer;
          transition: all 0.2s ease;
          padding: 0;
          line-height: 1;
        }

        .star-btn:not(.filled) {
          color: rgba(245, 197, 66, 0.3);
        }

        .star-btn:not(:disabled):hover {
          transform: scale(1.15);
          filter: drop-shadow(0 0 8px rgba(245, 197, 66, 0.6));
        }

        .star-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .rating-hint {
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.8rem;
          margin-top: 0.25rem;
        }

        /* Rating Stats */
        .rating-stats {
          display: flex;
          align-items: center;
          justify-content: space-around;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 8px;
        }

        .stat-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .stat-label {
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.85rem;
        }

        .stat-value {
          color: #fff;
          font-size: 1rem;
          font-weight: 600;
        }

        .stat-icon {
          color: #f5c542;
          font-size: 0.9rem;
        }

        .stat-divider {
          width: 1px;
          height: 24px;
          background: rgba(255, 255, 255, 0.1);
        }

        .rating-error {
          color: #ff4757;
          font-size: 0.85rem;
          padding: 0.5rem;
          background: rgba(255, 71, 87, 0.1);
          border-radius: 6px;
          border: 1px solid rgba(255, 71, 87, 0.2);
        }

        /* Comments List Wrapper */
        .comments-list-wrapper {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          padding: 1.25rem;
          flex: 1;
          min-height: 0;
          display: flex;
          flex-direction: column;
        }

        /* Comments List */
        .comments-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          overflow-y: auto;
          max-height: 400px;
          padding-right: 0.5rem;
        }

        .comments-list::-webkit-scrollbar {
          width: 6px;
        }

        .comments-list::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.03);
          border-radius: 3px;
        }

        .comments-list::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.15);
          border-radius: 3px;
        }

        /* Loading & Empty States */
        .loading-state,
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          color: rgba(255, 255, 255, 0.6);
          text-align: center;
        }

        .spinner {
          width: 32px;
          height: 32px;
          border: 3px solid rgba(106, 90, 224, 0.3);
          border-top-color: #6a5ae0;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin-bottom: 1rem;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .empty-icon {
          font-size: 3rem;
          color: rgba(255, 255, 255, 0.3);
          margin-bottom: 0.75rem;
        }

        .empty-hint {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.4);
          margin-top: 0.25rem;
        }

        /* Comment Item */
        .comment-item {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 10px;
          padding: 1rem;
          transition: all 0.2s ease;
        }

        .comment-item:hover {
          background: rgba(255, 255, 255, 0.04);
          border-color: rgba(255, 255, 255, 0.08);
        }

        .comment-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .comment-user {
          font-weight: 600;
          color: #6a5ae0;
          font-size: 0.9rem;
        }

        .comment-meta-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .comment-time {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.4);
        }

        .comment-edit-btn,
        .comment-delete-btn {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.5);
          cursor: pointer;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          transition: all 0.2s ease;
          font-size: 0.9rem;
        }

        .comment-edit-btn:hover {
          color: #6a5ae0;
          background: rgba(106, 90, 224, 0.1);
        }

        .comment-delete-btn:hover {
          color: #ff4757;
          background: rgba(255, 71, 87, 0.1);
        }

        .comment-text {
          margin: 0;
          color: #ffffff;
          font-size: 0.95rem;
          line-height: 1.5;
        }

        .prewrap {
          white-space: pre-wrap;
          word-break: break-word;
        }

        /* Edit Mode */
        .comment-edit-mode {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .edit-textarea {
          width: 100%;
          min-height: 80px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          padding: 0.75rem;
          color: #fff;
          font-family: inherit;
          font-size: 0.95rem;
          resize: vertical;
          transition: all 0.2s ease;
        }

        .edit-textarea:focus {
          outline: none;
          border-color: #6a5ae0;
          box-shadow: 0 0 0 3px rgba(106, 90, 224, 0.15);
          background: rgba(255, 255, 255, 0.06);
        }

        .edit-actions {
          display: flex;
          gap: 0.5rem;
          justify-content: flex-end;
        }

        .btn-save-edit,
        .btn-cancel-edit {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .btn-save-edit {
          background: linear-gradient(135deg, #10b981, #059669);
          color: #fff;
        }

        .btn-save-edit:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
        }

        .btn-save-edit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-cancel-edit {
          background: rgba(255, 255, 255, 0.08);
          color: #fff;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .btn-cancel-edit:hover {
          background: rgba(255, 255, 255, 0.12);
        }

        /* Comment Form */
        .comment-form-wrapper {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          flex-shrink: 0;
        }

        .form-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #fff;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .form-icon {
          color: #6a5ae0;
          font-size: 1rem;
        }

        .comment-textarea {
          width: 100%;
          min-height: 80px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          padding: 0.75rem;
          color: #fff;
          font-family: inherit;
          font-size: 0.95rem;
          resize: vertical;
          transition: all 0.2s ease;
        }

        .comment-textarea::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }

        .comment-textarea:focus {
          outline: none;
          border-color: #6a5ae0;
          box-shadow: 0 0 0 3px rgba(106, 90, 224, 0.15);
          background: rgba(255, 255, 255, 0.06);
        }

        .comment-textarea:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .form-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }

        .char-count {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.5);
        }

        .btn-submit-comment {
          padding: 0.65rem 1.25rem;
          background: linear-gradient(135deg, #6a5ae0, #8b7ee8);
          color: #fff;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .btn-submit-comment:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(106, 90, 224, 0.4);
        }

        .btn-submit-comment:focus-visible {
          box-shadow: 0 0 0 3px rgba(106, 90, 224, 0.3);
          outline: none;
        }

        .btn-submit-comment:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        /* Login Prompt */
        .login-prompt {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          padding: 1.5rem;
          text-align: center;
          color: rgba(255, 255, 255, 0.6);
        }

        .login-icon {
          font-size: 2rem;
          color: rgba(255, 255, 255, 0.3);
          margin-bottom: 0.75rem;
        }

        /* Responsividade */
        @media (max-width: 640px) {
          .comments-overlay {
            padding: 0.75rem;
          }

          .comments-popup {
            max-width: 100%;
            border-radius: 12px;
          }

          .comments-header {
            padding: 0.875rem 1rem;
          }

          .comments-header h3 {
            font-size: 1rem;
          }

          .comments-content-wrapper {
            padding: 1rem;
            gap: 1rem;
          }

          .rating-section,
          .comments-list-wrapper,
          .comment-form-wrapper {
            padding: 0.875rem;
          }

          .comments-list {
            max-height: 280px;
          }

          .form-actions {
            flex-direction: column;
            align-items: stretch;
          }

          .btn-submit-comment {
            width: 100%;
          }

          .char-count {
            text-align: center;
          }
        }

        @media (max-width: 420px) {
          .star-btn {
            font-size: 1.5rem;
          }

          .rating-stats {
            flex-direction: column;
            align-items: stretch;
            gap: 0.5rem;
          }

          .stat-divider {
            display: none;
          }

          .comment-meta-actions {
            flex-direction: column;
            align-items: flex-end;
          }
        }
      `}</style>
    </div>
  );
};

export default CommentsPopup;