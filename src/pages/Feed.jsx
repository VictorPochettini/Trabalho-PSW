import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import { fetchPosts } from '../redux/postsSlice';

import Header from '../components/Header2';
import PostCard from '../components/PostCard';
import MonetizationPopup from '../components/MonetizationPopup';
import CommentsPopup from '../components/CommentsPopup';
import FloatingActionButton from '../components/FloatingActionButton';

const Feed = () => {
  const dispatch = useDispatch();

  const posts = useSelector((state) => state.posts.lista);
  const loadingPosts = useSelector((state) => state.posts.loading);
  const errorPosts = useSelector((state) => state.posts.error);

  const [usuarios, setUsuarios] = useState([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(true);

  const [postsComUsuario, setPostsComUsuario] = useState([]);

  const [showMonetization, setShowMonetization] = useState(false);
  const [monetizationUsername, setMonetizationUsername] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [currentPostIdForComments, setCurrentPostIdForComments] = useState(null);

  // Busca posts e usuários
  useEffect(() => {
    dispatch(fetchPosts());

    axios.get('http://localhost:5000/usuarios')
      .then(res => setUsuarios(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoadingUsuarios(false));
  }, [dispatch]);

  // Combina posts com usuários após tudo carregar
  useEffect(() => {
    if (!loadingPosts && !loadingUsuarios && usuarios.length > 0) {
      const combinados = posts.map(post => {
        const usuario = usuarios.find(u => Number(u.id) === Number(post.usuarioId));
        return {
          ...post,
          id: post.id,
          content: post.titulo,
          texto: post.conteudo,
          username: usuario ? usuario.nome : '@desconhecido',
          mediaType: post.tipo === 'musica' ? 'audio' : post.tipo === 'visual' ? 'image' : 'text',
          mediaSrc: post.tipo === 'musica' || post.tipo === 'visual' ? `/media/${post.conteudo}` : null,
          mediaAlt: post.tipo === 'visual' ? post.titulo : null,
          time: new Date(post.data).toLocaleString()
        };
      });
      setPostsComUsuario(combinados);
    }
  }, [loadingPosts, loadingUsuarios, posts, usuarios]);

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

  if (loadingPosts || loadingUsuarios) return <p>Carregando...</p>;
  if (errorPosts) return <p>{errorPosts}</p>;

  return (
    <>
      <Header />
      <div className="feed-content-wrapper">
        {postsComUsuario.map(post => (
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

export default Feed;
