// src/pages/FeedPage.jsx
import React, { useState } from 'react';
import Header from '../components/Header';
import PostCard from '../components/PostCard';
import MonetizationPopup from '../components/MonetizationPopup';
import CommentsPopup from '../components/CommentsPopup';
import FloatingActionButton from '../components/FloatingActionButton';
import audioPop from '../audios/audioPop.mpeg';
import capaImage from '../images/capa.png';

const FeedPage = () => {
  const [showMonetization, setShowMonetization] = useState(false);
  const [monetizationUsername, setMonetizationUsername] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [currentPostIdForComments, setCurrentPostIdForComments] = useState(null);

  const handleMonetizeClick = (username) => {
    setMonetizationUsername(username);
    setShowMonetization(true);
    document.body.style.overflow = 'hidden';
  };

  const handleCloseMonetization = () => {
    setShowMonetization(false);
    document.body.style.overflow = '';
  };

  const handleCommentClick = (postId) => {
    setCurrentPostIdForComments(postId);
    setShowComments(true);
    document.body.style.overflow = 'hidden';
  };

  const handleCloseComments = () => {
    setShowComments(false);
    setCurrentPostIdForComments(null);
    document.body.style.overflow = '';
  };

  const posts = [
    {
      id: 1,
      username: '@musiclover2024',
      time: 'Há 2 horas',
      content: 'Acabei de lançar minha nova música! O que vocês acham dessa batida? 🎵',
      mediaType: 'audio',
      mediaSrc: audioPop,
    },
    {
      id: 2,
      username: '@artistavisual',
      time: 'Há 4 horas',
      content: 'Nova arte digital inspirada em sons urbanos! 🎨 Feedback é sempre bem-vindo!',
      mediaType: 'image',
      mediaSrc: capaImage,
      mediaAlt: 'Arte Digital',
    },
    {
      id: 3,
      username: '@poetaurbano',
      time: 'Há 1 dia',
      content: `"Entre as batidas do coração e o ritmo da cidade, nascem versos que ecoam verdade. Cada palavra, uma nota; cada verso, uma melodia..." ✍️`,
      mediaType: 'text',
    },
  ];

  return (
    <>
      <Header />
      <div className="feed-content-wrapper">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onMonetizeClick={handleMonetizeClick}
            onCommentClick={handleCommentClick}
          />
        ))}
      </div>

      <MonetizationPopup
        show={showMonetization}
        onClose={handleCloseMonetization}
        username={monetizationUsername}
      />

      <CommentsPopup
        show={showComments}
        onClose={handleCloseComments}
        postId={currentPostIdForComments}
      />

      <FloatingActionButton />
    </>
  );
};

export default FeedPage;