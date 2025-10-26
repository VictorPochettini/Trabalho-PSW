// src/components/PostCard.jsx
import React, { useEffect, useRef, useState } from 'react';
import '../index.css';

import { useDispatch, useSelector } from 'react-redux';
import {
  fetchMyRatingForPost,
  upsertRating,
  selectRatingState,
} from '../redux/ratingsSlice';

import { useNavigate } from 'react-router-dom';
import {
  fetchIsFollowing,
  followUser,
  unfollowUser,
  selectIsFollowing,
} from '../redux/followsSlice';

import { deletePost } from '../redux/postsSlice';

import { fetchUsuarios } from '../redux/usuariosSlice';

const PostCard = ({ 
  post, 
  onMonetizeClick, 
  onCommentClick, 
  onDeleteClick,
  onEditClick, 
  onSaveEdit, 
  onCancelEdit, 
  isEditing, 
  editText, 
  onEditTextChange,
  isOwnProfile = false
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [localEditText, setLocalEditText] = useState('');

  // 🎵 player custom (inalterado)
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [volume, setVolume] = useState(1);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { currentUser, usuarios: usuariosState } = useSelector((s) => s.user) || { currentUser: null, usuarios: [] };
  const usuarios = Array.isArray(usuariosState) ? usuariosState : [];
  const usuarioId = currentUser?.id;

  useEffect(() => {
    if (!usuarios.length) dispatch(fetchUsuarios());
  }, [dispatch, usuarios.length]);

  // autor
  const author = usuarios.find((u) => Number(u.id) === Number(post?.usuarioId)) || null;
  const authorName = author?.nome || author?.name || 'Usuário';
  const authorUsername = author?.username || post?.username || '';

  // rating
  const ratingState = useSelector(selectRatingState(post?.id));
  const myStars = ratingState.myStars || 0;
  useEffect(() => {
    if (!post?.id || !usuarioId) return;
    dispatch(fetchMyRatingForPost({ postId: post.id, usuarioId }));
  }, [dispatch, post?.id, usuarioId]);

  // seguidores
  const targetUserId = post?.usuarioId;
  const isFollowing = useSelector(selectIsFollowing(usuarioId, targetUserId));
  useEffect(() => {
    if (!usuarioId || !targetUserId || usuarioId === targetUserId) return;
    dispatch(fetchIsFollowing({ followerId: usuarioId, followingId: targetUserId }));
  }, [dispatch, usuarioId, targetUserId]);

  const handleFollowToggle = async () => {
    if (!usuarioId || !targetUserId || usuarioId === targetUserId) return;
    try {
      if (isFollowing) {
        await dispatch(unfollowUser({ followerId: usuarioId, followingId: targetUserId })).unwrap();
      } else {
        await dispatch(followUser({ followerId: usuarioId, followingId: targetUserId })).unwrap();
      }
    } catch (e) {
      console.error('follow toggle error', e);
    }
  };

  const handleStarClick = async (value) => {
    if (!usuarioId || submitting) return;
    const estrelas = Math.min(5, Math.max(1, Number(value)));
    try {
      setSubmitting(true);
      await dispatch(upsertRating({ postId: post.id, usuarioId, estrelas })).unwrap();
    } catch (err) {
      console.error('[PostCard] upsertRating error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // perfil → /user/username
  const goToProfile = () => {
    if (authorUsername) navigate(`/user/${authorUsername}`);
  };

  // player helpers
  const onLoadedMetadata = () => {
    const a = audioRef.current;
    if (!a) return;
    setDuration(a.duration || 0);
  };
  const onTimeUpdate = () => {
    const a = audioRef.current;
    if (!a) return;
    setCurrent(a.currentTime || 0);
  };
  const togglePlay = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      a.play();
      setIsPlaying(true);
    } else {
      a.pause();
      setIsPlaying(false);
    }
  };
  const seek = (e) => {
    const a = audioRef.current;
    if (!a) return;
    const v = Number(e.target.value);
    a.currentTime = v;
    setCurrent(v);
  };
  const changeVolume = (e) => {
    const a = audioRef.current;
    if (!a) return;
    const v = Number(e.target.value);
    a.volume = v;
    setVolume(v);
  };
  const fmt = (s) => {
    const t = Math.max(0, Math.floor(s));
    const mm = String(Math.floor(t / 60)).padStart(2, '0');
    const ss = String(t % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  };

  const { time, content, mediaType, mediaSrc, mediaAlt, id, texto } = post;
  const isText = mediaType === 'text';

  // ⚠️ NÃO reordena irmãos aqui. Apenas expõe um possível timestamp para uso no componente pai.
  const createdDataAttr =
    (post?.createdAt && String(post.createdAt)) ||
    (time && String(time)) ||
    '';

  // ✅ pode excluir se for admin OU dono do post
  const canDelete =
    !!currentUser &&
    (currentUser.admin === true ||
      Number(currentUser.id) === Number(post?.usuarioId));

  const handleDeletePost = async () => {
    if (!canDelete) return;
    const ok = window.confirm('Tem certeza que deseja excluir este post?');
    if (!ok) return;

    try {
      if (typeof onDeleteClick === 'function') {
        await onDeleteClick(post.id);
      } else {
        // Fallback: dispare uma action genérica para o seu postsSlice, se existir.
        // Ajuste para o seu thunk real, ex: deletePost(post.id)
        await dispatch(deletePost(post.id)).unwrap();
      }
    } catch (e) {
      console.error('[PostCard] delete error:', e);
    }
  };

  // Efeito para sincronizar o texto de edição
  useEffect(() => {
    if (isEditing) {
      setLocalEditText(editText);
    }
  }, [isEditing, editText]);

  const handleLocalEditChange = (e) => {
    setLocalEditText(e.target.value);
    onEditTextChange(e.target.value);
  };

  const handleSaveClick = () => {
    onSaveEdit(post.id);
  };

  const handleCancelClick = () => {
    onCancelEdit();
  };

  const handleEditClick = () => {
    onEditClick(post);
  };

  // ✅ pode editar se for dono do post
  const canEdit = !!currentUser && Number(currentUser.id) === Number(post?.usuarioId);

  return (
    <div className="post-container" data-created={createdDataAttr}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-6">
            <div className="card post-card elegant">
              <div className="card-body post-card-body">
                {/* Header */}
                <div className="post-header">
                  <div className="user-info">
                    <div className="user-avatar-container">
                      <div
                        className="user-avatar clickable avatar-elevated"
                        onClick={goToProfile}
                        title="Ver perfil"
                        role="button"
                        aria-label={`Abrir perfil de ${authorName}`}
                      >
                        <i className="fas fa-user text-white"></i>
                      </div>
                    </div>
                    <div className="user-details">
                      <strong
                        className="username clickable display-name"
                        onClick={goToProfile}
                        title={`Ver perfil de ${authorName}`}
                        role="button"
                      >
                        {authorName}
                      </strong>
                      <small className="post-time subtle">{time}</small>
                    </div>
                  </div>

                  <div className="post-actions">
                    {/* Botão Apoiar - SOMENTE se NÃO for o próprio perfil */}
                    {!isOwnProfile && (
                      <button
                        className="btn btn-sm support-button soft"
                        onClick={() => onMonetizeClick(authorUsername || authorName)}
                      >
                        <i className="fas fa-dollar-sign me-1"></i>Apoiar
                      </button>
                    )}
                    
                    {/* Botão Seguir - SOMENTE se NÃO for o próprio perfil */}
                    {!isOwnProfile && (
                      <button
                        className={`btn btn-sm follow-button ${isFollowing ? 'following' : 'notfollowing'} soft`}
                        onClick={handleFollowToggle}
                        disabled={!usuarioId || !targetUserId || usuarioId === targetUserId}
                        title={
                          !usuarioId
                            ? 'Faça login para seguir'
                            : usuarioId === targetUserId
                            ? 'Você não pode seguir a si mesmo'
                            : isFollowing
                            ? 'Deixar de seguir'
                            : 'Seguir'
                        }
                      >
                        {isFollowing ? 'Seguindo' : 'Seguir'}
                      </button>
                    )}

                    {/* ✅ Botões de Editar e Excluir (usando canEdit e canDelete) */}
                    {(canEdit || canDelete) && !isEditing && (
                      <div className="post-owner-actions">
                        {/* Botão Editar - apenas dono do post */}
                        {canEdit && (
                          <button
                            type="button"
                            className="btn btn-sm edit-button primary"
                            onClick={handleEditClick}
                            title="Editar post"
                            aria-label="Editar post"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                        )}
                        
                        {/* Botão Excluir - admin ou dono do post */}
                        {canDelete && (
                          <button
                            type="button"
                            className="btn btn-sm delete-button danger"
                            onClick={handleDeletePost}
                            title="Excluir post"
                            aria-label="Excluir post"
                          >
                            <i className="fas fa-trash-alt"></i>
                          </button>
                        )}
                      </div>
                    )}

                    {/* ✅ Botões de Salvar/Cancelar durante edição */}
                    {isEditing && (
                      <div className="edit-actions">
                        <button
                          type="button"
                          className="btn btn-sm save-button success"
                          onClick={handleSaveClick}
                          disabled={!localEditText.trim()}
                          title="Salvar edição"
                        >
                          <i className="fas fa-check"></i>
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm cancel-button secondary"
                          onClick={handleCancelClick}
                          title="Cancelar edição"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Conteúdo - Modo Normal */}
                {!isEditing && (
                  <div className={`post-content readable ${isText ? 'prewrap' : ''}`}>
                    <span className="quote-start">"</span>
                    {content}
                    <span className="quote-end">"</span>
                  </div>
                )}

                {/* Conteúdo - Modo Edição */}
                {isEditing && (
                  <div className="edit-mode">
                    <textarea
                      className="edit-textarea"
                      value={localEditText}
                      onChange={handleLocalEditChange}
                      rows="4"
                      placeholder="Edite seu post..."
                      autoFocus
                    />
                    <div className="edit-char-count">
                      {localEditText.length} caracteres
                    </div>
                  </div>
                )}

                {/* Mídia - Ocultar durante edição se for texto */}
                {!isEditing && (
                  <>
                    {mediaType === 'audio' && mediaSrc && (
                      <div className="media-container audio-modern newskin glass">
                        {/* ... player de audio existente ... */}
                      </div>
                    )}

                    {mediaType === 'image' && mediaSrc && (
                      <div className="media-container image-art refined">
                        <img src={mediaSrc} alt={mediaAlt || 'Imagem do post'} className="post-image art smooth" />
                      </div>
                    )}

                    {mediaType === 'text' && (
                      <div className="text-media">
                        <small className="text-muted">
                          <span className="prewrap">{texto}</span>
                        </small>
                      </div>
                    )}
                  </>
                )}

                {/* Footer - Ocultar durante edição */}
                {!isEditing && (
                  <div className="post-footer">
                    {/* ... rating e comentários existentes ... */}
                  </div>
                )}

                {/* Conteúdo */}
                <div className={`post-content readable ${isText ? 'prewrap' : ''}`}>
                  <span className="quote-start">"</span>
                  {content}
                  <span className="quote-end">"</span>
                </div>

                {/* Mídia */}
                {mediaType === 'audio' && mediaSrc && (
                  <div className="media-container audio-modern newskin glass">
                    <audio
                      ref={audioRef}
                      src={mediaSrc}
                      onLoadedMetadata={onLoadedMetadata}
                      onTimeUpdate={onTimeUpdate}
                      onEnded={() => setIsPlaying(false)}
                    />
                    <div className="audio-ui">
                      <button className="au-btn" onClick={togglePlay} aria-label={isPlaying ? 'Pausar' : 'Reproduzir'} type="button">
                        {isPlaying ? '❚❚' : '▶'}
                      </button>
                      <div className="au-times">
                        <span className="au-time">{fmt(current)}</span>
                      </div>
                      <input
                        className="au-seek"
                        type="range"
                        min="0"
                        max={Math.max(0, duration)}
                        step="1"
                        value={Math.min(current, duration || 0)}
                        onChange={seek}
                        aria-label="Linha do tempo"
                      />
                      <div className="au-times">
                        <span className="au-time">{fmt(duration)}</span>
                      </div>
                      <div className="au-vol">
                        <span className="au-vol-ico">{volume === 0 ? '🔇' : volume < 0.6 ? '🔉' : '🔊'}</span>
                        <input
                          className="au-vol-range"
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={volume}
                          onChange={changeVolume}
                          aria-label="Volume"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {mediaType === 'image' && mediaSrc && (
                  <div className="media-container image-art refined">
                    <img src={mediaSrc} alt={mediaAlt || 'Imagem do post'} className="post-image art smooth" />
                  </div>
                )}

                {mediaType === 'text' && (
                  <div className="text-media">
                    <small className="text-muted">
                      <span className="prewrap">{texto}</span>
                    </small>
                  </div>
                )}

                {/* Footer */}
                <div className="post-footer">
                  <div className="rating-section">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        className="star-button elegant-star"
                        onClick={() => handleStarClick(star)}
                        disabled={!usuarioId || submitting || ratingState.saving}
                        style={{ color: star <= myStars ? 'var(--star-on, #fbbf24)' : 'var(--star-off, #b8bec9)' }}
                        title={usuarioId ? `Dar ${star} estrela${star>1?'s':''}` : 'Faça login para avaliar'}
                        aria-label={`Avaliar com ${star} estrela${star>1?'s':''}`}
                        type="button"
                      >
                        ★
                      </button>
                    ))}
                    <small className="rating-text muted">{myStars > 0 ? `(${myStars}/5)` : 'Avaliar'}</small>
                  </div>

                  <button className="btn comment-button glossy" onClick={() => onCommentClick(id)}>
                    <i className="far fa-comment-dots"></i>
                    <span className="comentarioTexto"> Comentar</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div> 

      {/* 🎨 Repaginação visual (mesmo layout e tamanhos) */}
      <style>{`
        /* Paleta baseada em variáveis do site com fallbacks */
        :root {
          --accent: var(--roxo, #5e17eb);
          --accent-2: #7b3ff2;
          --surface: var(--surface, rgba(255,255,255,0.06));
          --surface-2: rgba(255,255,255,0.08);
          --border: rgba(255,255,255,0.10);
          --text: var(--text-color, #ffffff);
          --muted: rgba(255,255,255,0.7);
          --comment-btn-bg: var(--comment-btn-bg, var(--accent));
          --shadow: 0 12px 30px rgba(0,0,0,.28);
          --shadow-soft: 0 8px 24px rgba(0,0,0,.18);
          --star-on: #f5c542;
          --star-off: #bfc6d3;
        }

        .post-card.elegant {
          background: linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02));
          border: 1px solid var(--border);
          border-radius: 18px;
          box-shadow: var(--shadow-soft);
          transition: box-shadow .25s ease, border-color .25s ease, transform .25s ease;
          will-change: transform;
        }
        .post-card.elegant:hover {
          box-shadow: var(--shadow);
          border-color: rgba(255,255,255,0.16);
          transform: translateY(-1px);
        }

        .post-card-body { color: var(--text); }

        /* header */
        .user-avatar-container { display: grid; place-items: center; }
        .avatar-elevated {
          border-radius: 12px;
          background: linear-gradient(135deg, var(--accent), var(--accent-2));
          box-shadow: 0 6px 18px rgba(94,23,235,.45);
          transition: filter .25s ease, transform .2s ease, box-shadow .25s ease;
        }
        .avatar-elevated:hover {
          filter: brightness(1.03);
          transform: translateY(-1px);
          box-shadow: 0 10px 26px rgba(94,23,235,.55);
        }

        .display-name {
          letter-spacing: .2px;
          transition: color .2s ease, text-shadow .2s ease;
        }
        .display-name:hover {
          color: #fff;
          text-shadow: 0 2px 18px rgba(94,23,235, .35);
        }
        .subtle { opacity: .8; }

        /* ▶️ botão excluir */
        .delete-button.danger {
          margin-left: 8px;
          border: 1px solid rgba(255,255,255,.18);
          background: linear-gradient(180deg, rgba(255, 71, 87, .85), rgba(214, 48, 49, .85));
          color: #fff;
          box-shadow: 0 8px 20px rgba(214,48,49,.35);
          transition: transform .15s ease, box-shadow .25s ease, filter .2s ease, border-color .2s ease;
        }
        .delete-button.danger:hover {
          transform: translateY(-1px);
          box-shadow: 0 12px 26px rgba(214,48,49,.45);
          filter: brightness(1.03);
          border-color: rgba(255,255,255,.28);
        }

        .post-owner-actions {
          display: flex;
          gap: 8px;
          margin-left: 8px;
        }

        .edit-actions {
          display: flex;
          gap: 8px;
          margin-left: 8px;
        }

        .edit-button.primary {
          border: 1px solid rgba(255,255,255,.18);
          background: linear-gradient(180deg, rgba(59, 130, 246, .85), rgba(37, 99, 235, .85));
          color: #fff;
          box-shadow: 0 8px 20px rgba(37, 99, 235, .35);
          transition: transform .15s ease, box-shadow .25s ease, filter .2s ease, border-color .2s ease;
        }

        .edit-button.primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 12px 26px rgba(37, 99, 235, .45);
          filter: brightness(1.03);
          border-color: rgba(255,255,255,.28);
        }

        .save-button.success {
          border: 1px solid rgba(255,255,255,.18);
          background: linear-gradient(180deg, rgba(34, 197, 94, .85), rgba(22, 163, 74, .85));
          color: #fff;
          box-shadow: 0 8px 20px rgba(22, 163, 74, .35);
          transition: transform .15s ease, box-shadow .25s ease, filter .2s ease, border-color .2s ease;
        }

        .save-button.success:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 12px 26px rgba(22, 163, 74, .45);
          filter: brightness(1.03);
          border-color: rgba(255,255,255,.28);
        }

        .save-button.success:disabled {
          background: rgba(255,255,255,.2);
          cursor: not-allowed;
        }

        .cancel-button.secondary {
          border: 1px solid rgba(255,255,255,.18);
          background: linear-gradient(180deg, rgba(255,255,255,.12), rgba(255,255,255,.08));
          color: #fff;
          transition: transform .15s ease, box-shadow .25s ease, filter .2s ease, border-color .2s ease;
        }

        .cancel-button.secondary:hover {
          transform: translateY(-1px);
          background: linear-gradient(180deg, rgba(255,255,255,.16), rgba(255,255,255,.10));
          box-shadow: 0 8px 22px rgba(0,0,0,.25);
          border-color: rgba(255,255,255,.28);
        }

        .edit-mode {
          margin: 15px 0;
        }

        .edit-textarea {
          width: 100%;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 8px;
          color: white;
          padding: 12px;
          resize: vertical;
          font-family: inherit;
          font-size: inherit;
        }

        .edit-textarea:focus {
          outline: none;
          border-color: #5e17eb;
          box-shadow: 0 0 0 2px rgba(94, 23, 235, 0.2);
        }

        .edit-char-count {
          text-align: right;
          font-size: 0.8rem;
          color: rgba(255,255,255,0.6);
          margin-top: 5px;
        }

        .post-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        /* conteúdo */
        .post-content.readable {
          line-height: 1.6;
          color: var(--text);
          text-shadow: 0 1px 0 rgba(0,0,0,.08);
        }
        .quote-start, .quote-end {
          color: var(--muted);
          opacity: .9;
        }

        /* botões */
        .btn.soft {
          border: 1px solid rgba(255,255,255,.18);
          background: linear-gradient(180deg, rgba(255,255,255,.12), rgba(255,255,255,.08));
          color: #fff;
          backdrop-filter: blur(4px);
          transition: transform .15s ease, background .2s ease, box-shadow .25s ease, border-color .2s ease;
        }
        .btn.soft:hover {
          transform: translateY(-1px);
          background: linear-gradient(180deg, rgba(255,255,255,.16), rgba(255,255,255,.10));
          box-shadow: 0 8px 22px rgba(0,0,0,.25);
          border-color: rgba(255,255,255,.28);
        }
        .support-button.soft i { opacity: .95; }

        .follow-button.soft.notfollowing {
          background: linear-gradient(135deg, rgba(94,23,235,.85), rgba(123,63,242,.85));
          border: 1px solid rgba(255,255,255,.18);
        }
        .follow-button.soft.following {
          background: linear-gradient(135deg, rgba(52,199,89,.85), rgba(48,186,82,.85));
          border: 1px solid rgba(255,255,255,.18);
        }

        .comment-button.glossy {
          background: var(--comment-btn-bg);
          color: #fff;
          border: 1px solid rgba(255,255,255,.15);
          box-shadow: 0 10px 24px rgba(94,23,235,.30);
          transition: transform .15s ease, box-shadow .25s ease, filter .2s ease, border-color .2s ease;
        }
        .comment-button.glossy:hover {
          transform: translateY(-1px);
          box-shadow: 0 14px 30px rgba(94,23,235,.38);
          filter: brightness(1.03);
          border-color: rgba(255,255,255,.28);
        }

        /* estrelas */
        .elegant-star {
          font-size: 18px;
          line-height: 1;
          padding: 0 2px;
          background: transparent;
          border: none;
          text-shadow: 0 1px 0 rgba(0,0,0,.12);
          transition: transform .12s ease, filter .15s ease, text-shadow .15s ease;
        }
        .elegant-star:hover:not(:disabled) {
          transform: translateY(-1px) scale(1.03);
          filter: drop-shadow(0 2px 6px rgba(245,197,66,.45));
          text-shadow: 0 2px 12px rgba(245,197,66,.35);
        }
        .rating-text.muted { color: var(--muted); margin-left: 6px; }

        /* imagem refinada */
        .image-art.refined { position: relative; border-radius: 16px; overflow: hidden; }
        .post-image.art.smooth {
          display: block; width: 100%; height: auto; border-radius: 16px;
          filter: saturate(112%) contrast(106%);
          transition: filter .25s ease;
        }
        .image-art.refined:hover .post-image.art.smooth { filter: saturate(116%) contrast(108%); }
        .image-art.refined::before {
          content: ""; position: absolute; inset: 0; pointer-events: none;
          background:
            radial-gradient(120% 100% at 50% 50%, transparent 58%, rgba(0,0,0,.18) 100%);
          opacity: .75; transition: opacity .25s ease;
        }
        .image-art.refined:hover::before { opacity: .86; }
        .image-art.refined::after {
          content: ""; position: absolute; inset: -20%; pointer-events: none;
          background: linear-gradient(120deg,
            transparent 0%,
            rgba(255,255,255,.18) 42%,
            rgba(255,255,255,.26) 50%,
            rgba(255,255,255,.18) 58%,
            transparent 100%);
          transform: translateX(-62%) rotate(8deg); opacity: 0;
        }
        .image-art.refined:hover::after { animation: sheenPass .95s ease forwards; }
        @keyframes sheenPass {
          0% { transform: translateX(-62%) rotate(8deg); opacity: 0; }
          12% { opacity: .7; }
          100% { transform: translateX(62%) rotate(8deg); opacity: 0; }
        }

        /* player */
        .audio-modern.newskin.glass {
          background: var(--comment-btn-bg);
          border-radius: 16px;
          padding: 12px;
          border: 1px solid rgba(255,255,255,.16);
          box-shadow: 0 12px 26px rgba(0,0,0,.22);
          color: #fff;
          backdrop-filter: blur(4px) saturate(1.05);
        }
        .audio-modern.newskin.glass audio { display: none; }
        .audio-ui { display: grid; grid-template-columns: auto 56px 1fr 56px auto; align-items: center; gap: 10px; }
        .au-btn {
          width: 44px; height: 44px; border-radius: 12px;
          border: 1px solid rgba(255,255,255,.25);
          background: rgba(255,255,255,.12); color: #fff;
          font-weight: 700; font-size: 16px; display: grid; place-items: center;
          transition: transform .12s ease, background .2s ease, border-color .2s ease, box-shadow .25s ease;
        }
        .au-btn:hover { transform: translateY(-1px); background: rgba(255,255,255,.18); box-shadow: 0 8px 18px rgba(0,0,0,.22); }
        .au-times { display: flex; justify-content: center; min-width: 56px; }
        .au-time { font-variant-numeric: tabular-nums; opacity: .98; color: #fff; text-shadow: 0 1px 2px rgba(0,0,0,.22); }
        .au-seek {
          -webkit-appearance: none; appearance: none; width: 100%; height: 10px;
          background: rgba(255,255,255,.24); border-radius: 999px; outline: none;
        }
        .au-seek::-webkit-slider-thumb {
          -webkit-appearance: none; appearance: none; width: 18px; height: 18px; border-radius: 50%;
          background: #fff; border: 2px solid rgba(0,0,0,.15); box-shadow: 0 2px 6px rgba(0,0,0,.25);
          cursor: pointer; margin-top: -4px;
        }
        .au-vol { display: flex; align-items: center; gap: 8px; min-width: 120px; }
        .au-vol-ico { font-size: 16px; filter: drop-shadow(0 1px 2px rgba(0,0,0,.25)); }
        .au-vol-range {
          -webkit-appearance: none; appearance: none; width: 100px; height: 8px;
          background: rgba(255,255,255,.24); border-radius: 999px; outline: none;
        }
        .au-vol-range::-webkit-slider-thumb {
          -webkit-appearance: none; appearance: none; width: 14px; height: 14px; border-radius: 50%;
          background: #fff; border: 2px solid rgba(0,0,0,.15); box-shadow: 0 2px 6px rgba(0,0,0,.25); cursor: pointer; margin-top: -3px;
        }

        /* 📱 RESPONSIVIDADE DO PLAYER — sem alterar HTML */
        @media (max-width: 576px) {
          .audio-ui {
            grid-template-columns: 44px 1fr 56px;
            grid-template-areas:
              "play seek vol"
              "timeL seek timeR";
            align-items: center;
            gap: 8px;
          }
          .audio-ui > .au-btn { grid-area: play; }
          .audio-ui > .au-seek { grid-area: seek; height: 12px; }
          .audio-ui > .au-vol { grid-area: vol; justify-self: end; min-width: auto; }
          .audio-ui > .au-times:first-of-type { grid-area: timeL; justify-content: flex-start; }
          .audio-ui > .au-times:last-of-type { grid-area: timeR; justify-content: flex-end; }

          .au-time { font-size: 12px; opacity: .9; }
          .au-vol-range { width: 84px; height: 10px; }
          .au-seek::-webkit-slider-thumb { width: 20px; height: 20px; margin-top: -5px; }
          .au-vol-range::-webkit-slider-thumb { width: 16px; height: 16px; margin-top: -4px; }

          /* evita overflow horizontal em cards estreitos */
          .media-container.audio-modern.newskin.glass { padding: 10px; }
        }

        /* acessibilidade: menos movimento */
        @media (prefers-reduced-motion: reduce) {
          .post-card.elegant, .avatar-elevated, .btn.soft, .comment-button.glossy,
          .elegant-star, .image-art.refined::after { transition: none !important; animation: none !important; }
        }
          .prewrap {
  white-space: pre-wrap;      /* preserva \n */
  word-break: break-word;     /* evita overflow em palavras longas */
}

      `}</style>
    </div>
  );
};

export default PostCard;
