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
  const currentUser = useSelector((state) => state.user.currentUser);

  const [usuarios, setUsuarios] = useState([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(true);

  const [postsComUsuario, setPostsComUsuario] = useState([]);

  const [showMonetization, setShowMonetization] = useState(false);
  const [monetizationUsername, setMonetizationUsername] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [currentPostIdForComments, setCurrentPostIdForComments] = useState(null);

  const [editingPost, setEditingPost] = useState(null);
  const [editText, setEditText] = useState('');

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

      // 👇 ÚNICA ADIÇÃO: ordena do mais recente para o mais antigo
      const getDate = (p) => p?.data ?? p?.createdAt ?? p?.time;
      combinados.sort((a, b) => new Date(getDate(b)) - new Date(getDate(a)));

      setPostsComUsuario(combinados);
    }
  }, [loadingPosts, loadingUsuarios, posts, usuarios]);

  // Filtra posts para mostrar APENAS de pessoas que segue
  {/*useEffect(() => {
    if (postsComUsuario.length > 0 && currentUser) {
      const postsFiltrados = postsComUsuario.filter(post => {
        const key = `${Number(currentUser.id)}-${Number(post.usuarioId)}`;
        return followsByPair[key]?.isFollowing === true;
      });
      setPostsDosSeguidos(postsFiltrados);
    } else {
      setPostsDosSeguidos([]);
    }
  }, [postsComUsuario, currentUser, followsByPair]);*/}

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

  // Função para iniciar a edição
  const handleEditClick = (post) => {
    setEditingPost(post.id);
    setEditText(post.texto || post.content || '');
  };

  // Função para salvar a edição
  const handleSaveEdit = async (postId) => {
    if (!editText.trim()) return;

    try {
      // Atualiza o post via API
      await axios.put(`http://localhost:5000/posts/${postId}`, {
        conteudo: editText.trim(),
        titulo: editText.trim().substring(0, 100) // Limita o título
      });

      // Recarrega os posts
      dispatch(fetchPosts());
      setEditingPost(null);
      setEditText('');
    } catch (error) {
      console.error('Erro ao editar post:', error);
    }
  };

  // Função para cancelar edição
  const handleCancelEdit = () => {
    setEditingPost(null);
    setEditText('');
  };

  return (
    <>
      <Header />

      <div className="feed-content-wrapper">
        {postsComUsuario.map(post => {
          // 🔥 Define se é uma publicação do próprio usuário
          const isOwnProfile = currentUser && Number(currentUser.id) === Number(post.usuarioId);
          
          return (
            <PostCard
              key={post.id}
              post={post}
              onMonetizeClick={handleMonetizeClick}
              onCommentClick={handleCommentClick}
              onEditClick={handleEditClick} 
              onSaveEdit={handleSaveEdit} 
              onCancelEdit={handleCancelEdit} 
              isEditing={editingPost === post.id} 
              editText={editText} 
              onEditTextChange={setEditText}
              isOwnProfile={isOwnProfile} 
            />
          );
        })}
      </div>

      {/*<div className="feed-content-wrapper">
        {postsDosSeguidos.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px', 
            color: 'rgba(255,255,255,0.7)' 
          }}>
            <h3>Nenhuma publicação de pessoas que você segue</h3>
            <p>Comece a seguir alguns artistas para ver suas publicações aqui!</p>
            <p style={{ fontSize: '0.9rem', marginTop: '10px', color: 'rgba(255,255,255,0.5)' }}>
              Você está seguindo 0 pessoas
            </p>
          </div>
        ) : (
          postsDosSeguidos.map(post => (
            <PostCard
              key={post.id}
              post={post}
              onMonetizeClick={handleMonetizeClick}
              onCommentClick={handleCommentClick}
            />
          ))
        )}
      </div>*/}

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