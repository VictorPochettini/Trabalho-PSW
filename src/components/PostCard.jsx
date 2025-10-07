import React, { useState } from 'react';
import '../index.css';

const PostCard = ({ post, onMonetizeClick, onCommentClick }) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [rating, setRating] = useState(0);

  const handleFollowToggle = () => {
    setIsFollowing(!isFollowing);
  };

  const handleStarClick = (selectedRating) => {
    setRating(selectedRating);
  };

  const { username, time, content, mediaType, mediaSrc, mediaAlt } = post;

  return (
    <div className="post-container">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-6">
            <div className="card post-card">
              <div className="card-body post-card-body">
                {/* Header do Post */}
                <div className="post-header">
                  <div className="user-info">
                    <div className="user-avatar-container">
                      <div className="user-avatar">
                        <i className="fas fa-user text-white"></i>
                      </div>
                    </div>
                    <div className="user-details">
                      <strong className="username">{username}</strong>
                      <small className="post-time">{time}</small>
                    </div>
                  </div>
                  
                  <div className="post-actions">
                    <button
                      className="btn btn-sm support-button"
                      onClick={() => onMonetizeClick(username)}
                    >
                      <i className="fas fa-dollar-sign me-1"></i>Apoiar
                    </button>
                    <button
                      className={`btn btn-sm follow-button ${isFollowing ? 'following' : 'notfollowing'}`}
                      onClick={handleFollowToggle}
                    >
                      {isFollowing ? 'Seguindo' : 'Seguir'}
                    </button>
                  </div>
                </div>

                {/* Conteúdo do Post */}
                <div className="post-content">
                  <span className="quote-start">"</span>
                  {content}
                  <span className="quote-end">"</span>
                </div>

                {/* Mídia */}
                {mediaType === 'audio' && (
                  <div className="media-container">
                    <audio controls className="audio-player">
                      <source src={mediaSrc} type="audio/mpeg" />
                      Seu navegador não suporta áudio.
                    </audio>
                  </div>
                )}

                {mediaType === 'image' && (
                  <div className="media-container">
                    <img 
                      src={mediaSrc} 
                      alt={mediaAlt || 'Imagem do post'} 
                      className="post-image"
                    />
                  </div>
                )}

                {mediaType === 'text' && (
                  <div className="text-media">
                    <small className="text-muted">
                      <i className="fas fa-font me-2"></i>
                      Conteúdo em texto
                    </small>
                  </div>
                )}

                {/* Ações do Post */}
                <div className="post-footer">
                  <div className="rating-section">
                    {[1, 2, 3, 4, 5].map((starValue) => (
                      <button
                        key={starValue}
                        className="star-button"
                        onClick={() => handleStarClick(starValue)}
                        style={{
                          color: starValue <= rating ? '#fbbf24' : '#b8bec9'
                        }}
                      >
                        ★
                      </button>
                    ))}
                    <small className="rating-text">
                      {rating > 0 ? `(${rating}/5)` : 'Avaliar'}
                    </small>
                  </div>

                  <button
                    className="btn comment-button"
                    onClick={() => onCommentClick(post.id)}
                  >
                    <i className="far fa-comment-dots"></i>
                    <span className="comentarioTexto"> Comentar</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostCard;