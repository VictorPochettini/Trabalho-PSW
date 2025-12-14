import React, { useEffect, useRef, useState } from 'react';
import '../index.css';

import { useDispatch, useSelector } from 'react-redux';
import {
  fetchMyRatingForPost,
  fetchPostRating,
  upsertRating,
  removeRating,
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

/**
 * @typedef {object} Post
 * @property {string} _id O ID único do post (preferencialmente do MongoDB).
 * @property {string} [id] ID alternativo para o post.
 * @property {string} [authorName] Nome de exibição do autor.
 * @property {string} [authorUsername] Nome de usuário (@username) do autor.
 * @property {string} [usuarioId] O ID do usuário autor do post.
 * @property {string} [userId] ID de usuário alternativo.
 * @property {string} [authorPhoto] URL ou caminho da foto de perfil do autor.
 * @property {string} [time] Timestamp do post formatado.
 * @property {string} [createdAt] Timestamp de criação (ISO string).
 * @property {string} content Conteúdo principal do post (ex: citação).
 * @property {('text'|'texto'|'audio'|'image')} mediaType Tipo de mídia do post.
 * @property {string} [mediaSrc] URL da fonte da mídia (áudio ou imagem).
 * @property {string} [mediaAlt] Texto alternativo para a mídia.
 * @property {string} [texto] Conteúdo adicional, como letra completa para posts de texto/música.
 * @property {('texto'|'letra'|'audio'|'image')} [tipo] Tipo de post (usado na lógica de edição).
 */

/**
 * Componente de cartão (Card) para exibição e interação com posts.
 * Ele gerencia a avaliação do usuário, o seguimento do autor e as interações de edição/exclusão.
 *
 * @param {object} props As propriedades do componente.
 * @param {Post} props.post O objeto de dados do post a ser exibido.
 * @param {function(string): void} [props.onMonetizeClick] Callback chamado ao clicar no botão "Apoiar". Recebe o username/name do autor.
 * @param {function(string): void} [props.onCommentClick] Callback chamado ao clicar no botão "Comentar". Recebe o postId.
 * @param {function(string): Promise<void>} [props.onDeleteClick] Callback chamado ao excluir o post. Se fornecido, ele é usado no lugar da ação Redux `deletePost`.
 * @param {function(Post): void} [props.onEditClick] Callback chamado ao clicar no botão "Editar". Recebe o objeto Post.
 * @param {function(string): void} [props.onSaveEdit] Callback chamado ao salvar a edição. Recebe o postId.
 * @param {function(): void} [props.onCancelEdit] Callback chamado ao cancelar a edição.
 * @param {boolean} [props.isEditing=false] Indica se o post está atualmente no modo de edição.
 * @param {string} [props.editText] O texto atual (corpo) da edição.
 * @param {string} [props.editTitle] O título atual da edição (para posts de texto/letra).
 * @param {function(string): void} [props.onEditTextChange] Handler para a mudança do texto do corpo da edição.
 * @param {function(string): void} [props.onEditTitleChange] Handler para a mudança do texto do título da edição.
 * @param {boolean} [props.isOwnProfile=false] Indica se o cartão está sendo exibido no perfil do próprio usuário logado (usado para esconder Follow/Support).
 * @returns {JSX.Element} O cartão do post renderizado.
 */

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
  editTitle,
  onEditTextChange,
  onEditTitleChange,
  isOwnProfile = false
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [lastStarClickTime, setLastStarClickTime] = useState(0);

  // player custom
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [volume, setVolume] = useState(1);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  // --- Dados do usuário logado
  const currentUserState = useSelector((s) => s.user?.currentUser);
  const currentUser = currentUserState?.user ?? null;
  const currentUserId = currentUser?._id || currentUser?.id || null;

  // --- ID do post (sempre usa _id do MongoDB)
  const postId = post?._id || post?.id;

  // --- Dados do autor vêm do post prop
  const authorName = post?.authorName || post?.username || 'Usuário';
  const authorUsername = post?.authorUsername || post?.username?.replace('@', '') || '';

  // NOVO: Pegar foto de perfil do autor
  const authorPhoto = post?.authorPhoto || post?.fotoPerfil || null;
  const API_URL = 'http://localhost:5000';
  
  const getAuthorPhotoUrl = () => {
    if (!authorPhoto) return null;
    if (authorPhoto.startsWith('data:')) return authorPhoto;
    if (authorPhoto.startsWith('http')) return authorPhoto;
    return `${API_URL}/${authorPhoto}`;
  };

  // rating - usa postId consistente
  const ratingState = useSelector(selectRatingState(postId));

  // Buscar avaliação do usuário e média do post quando o componente monta
  useEffect(() => {
    if (!postId) return;

    if (currentUserId) {
      dispatch(fetchMyRatingForPost({ postId, usuarioId: currentUserId }));
    } else {
      dispatch(fetchPostRating(postId));
    }
  }, [dispatch, postId, currentUserId]);

  // seguidores
  const targetUserId = post?.usuarioId || post?.userId;
  const isFollowing = useSelector(selectIsFollowing(currentUserId, targetUserId));
  
  useEffect(() => {
    if (!currentUserId || !targetUserId || String(currentUserId) === String(targetUserId)) return;
    dispatch(fetchIsFollowing({ followerId: currentUserId, followingId: targetUserId }));
  }, [dispatch, currentUserId, targetUserId]);

  const handleFollowToggle = async () => {
    if (!currentUserId || !targetUserId || String(currentUserId) === String(targetUserId)) return;
    try {
      if (isFollowing) {
        await dispatch(unfollowUser({ followerId: currentUserId, followingId: targetUserId })).unwrap();
      } else {
        await dispatch(followUser({ followerId: currentUserId, followingId: targetUserId })).unwrap();
      }
    } catch (e) {
      console.error('follow toggle error', e);
    }
  };

    const handleStarClick = async (value) => {
    if (!currentUserId || submitting) return;

    const currentTime = new Date().getTime();
    const isDoubleClick = currentTime - lastStarClickTime < 300;

    if (isDoubleClick && ratingState?.myStars > 0) {
      // REMOVER AVALIAÇÃO (duplo clique)
      try {
        setSubmitting(true);
        await dispatch(removeRating({ postId, usuarioId: currentUserId })).unwrap();
        
        // CRÍTICO: Recarregar dados após remover
        await dispatch(fetchMyRatingForPost({ postId, usuarioId: currentUserId })).unwrap();
        
        console.log('✅ [PostCard] Avaliação removida e recarregada');
      } catch (err) {
        console.error('[PostCard] removeRating error:', err);
        alert('Não foi possível remover a avaliação. Tente novamente.');
      } finally {
        setSubmitting(false);
      }
    } else {
      // ADICIONAR/ATUALIZAR AVALIAÇÃO (clique simples)
      const estrelas = Math.min(5, Math.max(1, Number(value)));
      try {
        setSubmitting(true);
        await dispatch(upsertRating({ postId, usuarioId: currentUserId, estrelas })).unwrap();
        
        // CRÍTICO: Recarregar dados após avaliar
        await dispatch(fetchMyRatingForPost({ postId, usuarioId: currentUserId })).unwrap();
        
        console.log('✅ [PostCard] Avaliação salva e recarregada');
      } catch (err) {
        console.error('[PostCard] upsertRating error:', err);
        alert('Não foi possível salvar a avaliação. Tente novamente.');
      } finally {
        setSubmitting(false);
      }
    }

    setLastStarClickTime(currentTime);
  };


  // perfil → /user/username
  const goToProfile = () => {
    if (authorUsername) navigate(`/user/${authorUsername}`);
    else if (authorName) navigate(`/user/${authorName}`);
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

  const { time, content, mediaType, mediaSrc, mediaAlt, texto } = post;
  const isText = mediaType === 'text' || mediaType === 'texto';

  const createdDataAttr =
    (post?.createdAt && String(post.createdAt)) ||
    (time && String(time)) ||
    '';

  const canDelete = !!currentUser && (
    currentUser.role === 'admin' ||
    currentUser.admin === true ||
    String(currentUserId) === String(targetUserId)
  );

  const handleDeletePost = async () => {
    if (!canDelete) return;
    const ok = window.confirm('Tem certeza que deseja excluir este post?');
    if (!ok) return;

    try {
      if (typeof onDeleteClick === 'function') {
        await onDeleteClick(postId);
      } else {
        await dispatch(deletePost(postId)).unwrap();
      }
    } catch (e) {
      console.error('[PostCard] delete error:', e);
    }
  };

  // CORREÇÃO: Gerenciar texto de edição localmente + título separado
  const [localEditText, setLocalEditText] = useState('');
  const [localEditTitle, setLocalEditTitle] = useState('');

  useEffect(() => {
    if (isEditing) {
      setLocalEditText(editText || '');
      setLocalEditTitle(editTitle || '');
    }
  }, [isEditing, editText, editTitle]);

  const handleLocalEditChange = (e) => {
    const newValue = e.target.value;
    setLocalEditText(newValue);
    if (typeof onEditTextChange === 'function') {
      onEditTextChange(newValue);
    }
  };

  const handleLocalTitleChange = (e) => {
    const newValue = e.target.value;
    setLocalEditTitle(newValue);
    if (typeof onEditTitleChange === 'function') {
      onEditTitleChange(newValue);
    }
  };

  const handleSaveClick = () => {
    // Validação diferenciada para posts de texto
    const isTextPost = post.tipo === 'texto' || post.tipo === 'letra';
    
    if (isTextPost) {
      if (!localEditTitle.trim() || !localEditText.trim()) {
        alert('Título e letra não podem estar vazios!');
        return;
      }
    } else {
      if (!localEditText.trim()) {
        alert('O campo não pode estar vazio!');
        return;
      }
    }
    
    if (typeof onSaveEdit === 'function') {
      onSaveEdit(postId);
    }
  };

  const handleCancelClick = () => {
    setLocalEditText(''); // Limpa o estado local
    if (typeof onCancelEdit === 'function') {
      onCancelEdit();
    }
  };

  const handleEditClick = () => {
    if (typeof onEditClick === 'function') {
      onEditClick(post);
    }
  };

  const canEdit = !!currentUser && String(currentUserId) === String(targetUserId);

  const myStars = ratingState?.myStars || 0;
  const ratingAvg = ratingState?.postAvg || 0;
  const ratingCount = ratingState?.postCount || 0;

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
                        {/* MUDANÇA: Usar foto de perfil do autor */}
                        {getAuthorPhotoUrl() ? (
                          <img 
                            src={getAuthorPhotoUrl()} 
                            alt={authorName}
                            className="avatar-image"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <i className="fas fa-user text-white avatar-fallback" style={{ display: getAuthorPhotoUrl() ? 'none' : 'flex' }}></i>
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
                    {/* Botão Apoiar - esconde se for próprio post OU próprio perfil */}
                    {!isOwnProfile && (String(currentUserId) !== String(targetUserId)) && (
                      <button
                        className="btn btn-sm support-button soft"
                        onClick={() => onMonetizeClick(authorUsername || authorName)}
                      >
                        <i className="fas fa-dollar-sign me-1"></i>Apoiar
                      </button>
                    )}

                    {/* Botão Seguir - esconde se for próprio post OU próprio perfil */}
                    {!isOwnProfile && (String(currentUserId) !== String(targetUserId)) && (
                      <button
                        className={`btn btn-sm follow-button ${isFollowing ? 'following' : 'notfollowing'} soft`}
                        onClick={handleFollowToggle}
                        disabled={!currentUserId || !targetUserId}
                        title={
                          !currentUserId
                            ? 'Faça login para seguir'
                            : isFollowing
                                ? 'Deixar de seguir'
                                : 'Seguir'
                        }
                      >
                        {isFollowing ? 'Seguindo' : 'Seguir'}
                      </button>
                    )}

                    {!isEditing && (
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

                    {/* Botões de Salvar/Cancelar durante edição */}
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

                {/* Conteúdo Único */}
                {!isEditing ? (
                  <>
                    {/* Modo Normal */}
                    <div className={`post-content readable ${isText ? 'prewrap' : ''}`}>
                      <span className="quote-start">"</span>
                      {content}
                      <span className="quote-end">"</span>
                    </div>

                    {/* PLAYER DE ÁUDIO REDESENHADO */}
                    {mediaType === 'audio' && mediaSrc && (
                      <div className="audio-player-container">
                        <audio
                          ref={audioRef}
                          src={mediaSrc}
                          onLoadedMetadata={onLoadedMetadata}
                          onTimeUpdate={onTimeUpdate}
                          onEnded={() => setIsPlaying(false)}
                        />
                        
                        {/* Botão Play/Pause Grande */}
                        <div className="audio-main-controls">
                          <button 
                            className="play-button-large" 
                            onClick={togglePlay} 
                            aria-label={isPlaying ? 'Pausar' : 'Reproduzir'}
                            type="button"
                          >
                            <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'}`}></i>
                          </button>
                          
                          <div className="audio-progress-area">
                            <div className="audio-times-top">
                              <span className="time-current">{fmt(current)}</span>
                              <span className="time-duration">{fmt(duration)}</span>
                            </div>
                            
                            <div className="progress-bar-wrapper">
                              <input
                                className="progress-bar"
                                type="range"
                                min="0"
                                max={Math.max(0, duration)}
                                step="0.1"
                                value={Math.min(current, duration || 0)}
                                onChange={seek}
                                aria-label="Progresso da música"
                              />
                              <div 
                                className="progress-fill" 
                                style={{ width: `${duration > 0 ? (current / duration) * 100 : 0}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Controle de Volume */}
                        <div className="audio-volume-control">
                          <button 
                            className="volume-icon"
                            onClick={() => {
                              const newVolume = volume === 0 ? 1 : 0;
                              changeVolume({ target: { value: newVolume } });
                            }}
                            aria-label={volume === 0 ? 'Ativar som' : 'Mutar'}
                            type="button"
                          >
                            <i className={`fas ${volume === 0 ? 'fa-volume-mute' : volume < 0.5 ? 'fa-volume-down' : 'fa-volume-up'}`}></i>
                          </button>
                          <input
                            className="volume-slider"
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={volume}
                            onChange={changeVolume}
                            aria-label="Volume"
                          />
                          <span className="volume-percentage">{Math.round(volume * 100)}%</span>
                        </div>
                      </div>
                    )}

                    {mediaType === 'image' && mediaSrc && (
                      <div className="media-container image-art refined">
                        <img src={mediaSrc} alt={mediaAlt || 'Imagem do post'} className="post-image art smooth" />
                      </div>
                    )}

                    {isText && (
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
                            disabled={!currentUserId || submitting || ratingState?.saving}
                            style={{ color: star <= myStars ? 'var(--star-on, #fbbf24)' : 'var(--star-off, #b8bec9)' }}
                            title={currentUserId ? `Clique para dar ${star} estrela${star>1?'s':''}, double click para remover` : 'Faça login para avaliar'}
                            aria-label={`Avaliar com ${star} estrela${star>1?'s':''}`}
                            type="button"
                          >
                            ★
                          </button>
                        ))}
                        <small className="rating-text muted">
                          {myStars > 0 ? `(${myStars}/5)` : 'Avaliar'}
                          {ratingCount > 0 && (
                            <span style={{ marginLeft: '8px', opacity: 0.7 }}>
                              Média: {ratingAvg.toFixed(1)} ({ratingCount})
                            </span>
                          )}
                        </small>
                      </div>

                      <button className="btn comment-button glossy" onClick={() => onCommentClick(postId)}>
                        <i className="far fa-comment-dots"></i>
                        <span className="comentarioTexto"> Comentar</span>
                      </button>
                    </div>
                  </>
                ) : (
                  /* Modo Edição */
                  <div className="edit-mode">
                    {/* NOVO: Campo de Título para posts de texto */}
                    {(post.tipo === 'texto' || post.tipo === 'letra') && (
                      <>
                        <label className="edit-label">Título</label>
                        <input
                          type="text"
                          className="edit-input"
                          value={localEditTitle}
                          onChange={handleLocalTitleChange}
                          placeholder="Digite o título..."
                          maxLength={120}
                          autoFocus
                        />
                        <div className="edit-char-count">
                          {localEditTitle.length}/120 caracteres
                        </div>
                        
                        <label className="edit-label" style={{ marginTop: '15px' }}>Letra completa</label>
                      </>
                    )}
                    
                    <textarea
                      className="edit-textarea"
                      value={localEditText}
                      onChange={handleLocalEditChange}
                      rows={post.tipo === 'texto' || post.tipo === 'letra' ? "8" : "4"}
                      placeholder={
                        post.tipo === 'texto' || post.tipo === 'letra'
                          ? "Escreva a letra completa..."
                          : "Edite seu post..."
                      }
                      autoFocus={!(post.tipo === 'texto' || post.tipo === 'letra')}
                    />
                    <div className="edit-char-count">
                      {localEditText.length} caracteres
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 🎨 Estilos */}
      <style>{`
        :root {
          --accent: var(--roxo, #5e17eb);
          --accent-2: #7b3ff2;
          --surface: var(--surface, rgba(255,255,255,0.06));
          --surface-2: rgba(255,255,255,0.08);
          --border: rgba(255,255,255,0.10);
          --text: var(--text-color, #rgba(0,0,0,.08));
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

        .user-avatar-container { display: grid; place-items: center; }
        
        /* ✅ AVATAR COM FOTO */
        .avatar-elevated {
          border-radius: 50%;
          background: linear-gradient(135deg, var(--accent), var(--accent-2));
          box-shadow: 0 6px 18px rgba(94,23,235,.45);
          transition: filter .25s ease, transform .2s ease, box-shadow .25s ease;
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          position: relative;
        }
        
        .avatar-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
        }
        
        .avatar-fallback {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
        }
        
        .avatar-elevated:hover {
          filter: brightness(1.03);
          transform: translateY(-1px) scale(1.05);
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

        /* ✅ PLAYER DE ÁUDIO REDESENHADO - MODERNO E RESPONSIVO */
        .audio-player-container {
          background: linear-gradient(135deg, rgba(94, 23, 235, 0.15), rgba(123, 63, 242, 0.08));
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 20px;
          padding: 24px;
          margin: 16px 0;
          backdrop-filter: blur(10px);
          box-shadow: 0 8px 32px rgba(94, 23, 235, 0.2);
        }
        
        .audio-main-controls {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 16px;
        }
        
        .play-button-large {
          width: 48px;
          height: 48px;
          min-width: 48px;
          border-radius: 50%;
          background: linear-gradient(135deg, #5e17eb, #7b3ff2);
          border: none;
          color: white;
          font-size: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 8px 24px rgba(94, 23, 235, 0.4);
          transition: all 0.3s ease;
        }
        
        .play-button-large:hover {
          transform: scale(1.05);
          box-shadow: 0 12px 32px rgba(94, 23, 235, 0.6);
        }
        
        .play-button-large:active {
          transform: scale(0.95);
        }
        
        .play-button-large i {
          margin-left: 2px;
        }
        
        .play-button-large .fa-pause {
          margin-left: 0;
        }
        
        .audio-progress-area {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .audio-times-top {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.8);
          font-weight: 500;
        }
        
        .progress-bar-wrapper {
          position: relative;
          height: 8px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          overflow: hidden;
        }
        
        .progress-fill {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          background: linear-gradient(90deg, #5e17eb, #7b3ff2);
          border-radius: 10px;
          transition: width 0.1s linear;
          pointer-events: none;
        }
        
        .progress-bar {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          cursor: pointer;
          z-index: 2;
        }
        
        .progress-bar::-webkit-slider-thumb {
          width: 16px;
          height: 16px;
          background: white;
          border-radius: 50%;
          cursor: pointer;
          opacity: 0;
          transition: opacity 0.2s;
        }
        
        .progress-bar-wrapper:hover .progress-bar::-webkit-slider-thumb {
          opacity: 1;
        }
        
        .audio-volume-control {
          display: flex;
          align-items: center;
          gap: 12px;
          padding-top: 8px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .volume-icon {
          width: 36px;
          height: 36px;
          min-width: 36px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          border: none;
          color: white;
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .volume-icon:hover {
          background: rgba(255, 255, 255, 0.15);
          transform: scale(1.05);
        }
        
        .volume-slider {
          flex: 1;
          height: 6px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.1);
          outline: none;
          -webkit-appearance: none;
          appearance: none;
        }
        
        .volume-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 14px;
          height: 14px;
          background: white;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }
        
        .volume-slider::-moz-range-thumb {
          width: 14px;
          height: 14px;
          background: white;
          border-radius: 50%;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }
        
        .volume-percentage {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.8);
          font-weight: 500;
          min-width: 40px;
          text-align: right;
        }
        
        /* ✅ RESPONSIVIDADE DO PLAYER */
        @media (max-width: 576px) {
          .audio-player-container {
            padding: 16px;
          }
          
          .audio-main-controls {
            gap: 12px;
          }
          
          .play-button-large {
            width: 56px;
            height: 56px;
            min-width: 56px;
            font-size: 20px;
          }
          
          .audio-times-top {
            font-size: 11px;
          }
          
          .volume-icon {
            width: 32px;
            height: 32px;
            min-width: 32px;
            font-size: 14px;
          }
          
          .volume-percentage {
            font-size: 11px;
            min-width: 35px;
          }
        }

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
          opacity: 0.5;
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

        .edit-label {
          display: block;
          color: rgba(255,255,255,0.9);
          font-weight: 600;
          margin-bottom: 8px;
          font-size: 0.95rem;
        }

        .edit-input {
          width: 100%;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 8px;
          color: white;
          padding: 12px;
          font-family: inherit;
          font-size: inherit;
          margin-bottom: 5px;
        }

        .edit-input:focus {
          outline: none;
          border-color: #5e17eb;
          box-shadow: 0 0 0 2px rgba(94, 23, 235, 0.2);
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
          min-height: 100px;
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

        .post-content.readable {
          line-height: 1.6;
          color: var(--text);
          text-shadow: 0 1px 0 rgba(0,0,0,.08);
        }
        .quote-start, .quote-end {
          color: var(--muted);
          opacity: .9;
        }

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

        @media (prefers-reduced-motion: reduce) {
          .post-card.elegant, .avatar-elevated, .btn.soft, .comment-button.glossy,
          .elegant-star, .image-art.refined::after { transition: none !important; animation: none !important; }
        }
        
        .prewrap {
          white-space: pre-wrap;
          word-break: break-word;
        }
      `}</style>
    </div>
  );
};

export default PostCard;