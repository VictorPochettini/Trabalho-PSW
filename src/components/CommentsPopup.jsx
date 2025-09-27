// src/components/CommentsPopup.jsx
import React, { useState, useEffect } from 'react';

const CommentsPopup = ({ show, onClose, postId }) => {
  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState('');

  useEffect(() => {
    if (show) {
      // Simula o carregamento de comentários para o postId
      // Em um app real, você faria uma chamada API aqui
      setComments([
        { id: 1, author: 'usuário123', text: 'Gostei muito dessa música! Parabéns pelo trabalho.', time: 'Há 2 horas' },
        { id: 2, author: 'OutroUser', text: 'Arte incrível, adorei as cores!', time: 'Há 1 hora' },
      ]);
    } else {
      setComments([]); // Limpa comentários ao fechar
      setNewCommentText('');
    }
  }, [show, postId]);

  const handleAddComment = (e) => {
    e.preventDefault();
    if (newCommentText.trim()) {
      const newComment = {
        id: comments.length + 1,
        author: 'Você', // Ou o nome do usuário logado
        text: newCommentText.trim(),
        time: 'Agora',
      };
      setComments((prevComments) => [newComment, ...prevComments]);
      setNewCommentText('');
      // Em um app real, você enviaria este comentário para o backend
    }
  };

  if (!show) return null;

  return (
    <div className="comments-overlay active" onClick={(e) => e.target.classList.contains('comments-overlay') && onClose()}>
      <div className="comments-popup">
        <div className="comments-header">
          <h3>Comentários</h3>
          <button className="close-comments" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="comments-content">
          <div className="comment-list">
            {comments.length === 0 ? (
              <p className="text-center text-muted mt-3">Nenhum comentário ainda. Seja o primeiro!</p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="comment-item">
                  <div className="comment-author">
                    <i className="fa-solid fa-circle-user"></i>
                    <span>{comment.author}</span>
                  </div>
                  <p>{comment.text}</p>
                  <span className="comment-time">{comment.time}</span>
                </div>
              ))
            )}
          </div>
          <form className="comment-form" onSubmit={handleAddComment}>
            <textarea
              placeholder="Adicione um comentário..."
              rows="3"
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
            ></textarea>
            <button type="submit" className="btn-comment">
              Comentar
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CommentsPopup;