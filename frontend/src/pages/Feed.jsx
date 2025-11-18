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
  const [postsDosSeguidos, setPostsDosSeguidos] = useState([]);
  const [seguindoIds, setSeguindoIds] = useState([]); 
  const [loadingSeguindo, setLoadingSeguindo] = useState(true);

  const [showMonetization, setShowMonetization] = useState(false);
  const [monetizationUsername, setMonetizationUsername] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [currentPostIdForComments, setCurrentPostIdForComments] = useState(null);


  // ✅ 1. BUSCA SEGUIDORES DA API (com persistência no localStorage)
  useEffect(() => {
    const fetchSeguindo = async () => {
      if (currentUser && currentUser.id) {
        try {
          setLoadingSeguindo(true);
          console.log('Buscando seguidores para usuário:', currentUser.id);
          
          const response = await axios.get(`http://localhost:5000/seguidores?followerId=${currentUser.id}`);
          console.log('Resposta da API seguidores:', response.data);
          
          const idsSeguindo = response.data.map(item => Number(item.followingId));
          console.log('IDs que estou seguindo:', idsSeguindo);
          
          setSeguindoIds(idsSeguindo);
          localStorage.setItem(`seguindoIds_${currentUser.id}`, JSON.stringify(idsSeguindo));
        } catch (error) {
          console.error('Erro ao buscar seguindo:', error);
          const saved = localStorage.getItem(`seguindoIds_${currentUser.id}`);
          if (saved) {
            const parsedSaved = JSON.parse(saved);
            console.log('Usando dados salvos do localStorage:', parsedSaved);
            setSeguindoIds(parsedSaved);
          } else {
            setSeguindoIds([]);
          }
        } finally {
          setLoadingSeguindo(false);
        }
      } else {
        console.log('Nenhum usuário logado ou ID inválido');
        setSeguindoIds([]);
        setLoadingSeguindo(false);
      }
    };

    fetchSeguindo();
  }, [currentUser]);

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
          usuarioId: Number(post.usuarioId),
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

  // ✅ 4. FILTRA POSTS DOS SEGUIDORES + PRÓPRIAS PUBLICAÇÕES
  useEffect(() => {
    if (postsComUsuario.length > 0 && seguindoIds.length > 0) {
      console.log('Filtrando posts...');
      console.log('Posts disponíveis:', postsComUsuario.length);
      console.log('IDs que sigo:', seguindoIds);
      
      const postsFiltrados = postsComUsuario.filter(post => {
        const usuarioId = Number(post.usuarioId);
        const inclui = seguindoIds.includes(usuarioId);
        console.log(`Post ${post.id} - Usuário ${usuarioId} - Incluído: ${inclui}`);
        return inclui;
      });
      
      console.log('Posts filtrados (seguidores):', postsFiltrados.length);
      setPostsDosSeguidos(postsFiltrados);
    } else {
      console.log('Sem posts para filtrar ou sem seguidores');
      setPostsDosSeguidos([]);
    }
  }, [postsComUsuario, seguindoIds]);

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
        {/* ✅ AGORA MOSTRA APENAS POSTS DOS SEGUIDORES */}
        {postsDosSeguidos.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px', 
            color: 'rgba(255,255,255,0.7)' 
          }}>
            <h3>Nenhuma publicação de pessoas que você segue</h3>
            <p>Comece a seguir alguns artistas para ver suas publicações aqui!</p>
            <p style={{ fontSize: '0.9rem', marginTop: '10px', color: 'rgba(255,255,255,0.5)' }}>
              {currentUser ? `Você está seguindo ${seguindoIds.length} pessoas` : 'Faça login para seguir pessoas'}
            </p>
            {currentUser && (
              <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px' }}>
                <p style={{ margin: '0', fontSize: '0.9rem' }}>
                  <strong>IDs que você segue:</strong> {seguindoIds.join(', ') || 'Nenhum'}
                </p>
              </div>
            )}
          </div>
        ) : (
          postsDosSeguidos.map(post => {
            
            return (
              <PostCard
                key={post.id}
                post={post}
                onMonetizeClick={handleMonetizeClick}
                onCommentClick={handleCommentClick}
              />
            );
          })
        )}
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
      <style jsx>{`
        .no-login-message,
        .no-posts-message {
          text-align: center;
          padding: 60px 20px;
          color: rgba(255, 255, 255, 0.7);
          max-width: 500px;
          margin: 0 auto;
        }

        .no-login-message h3,
        .no-posts-message h3 {
          margin-bottom: 15px;
          color: rgba(255, 255, 255, 0.9);
        }

        .follow-stats {
          margin-top: 20px;
          padding: 15px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .follow-stats p {
          margin: 0;
          color: rgba(255, 255, 255, 0.8);
        }

        .follow-stats strong {
          color: #5e17eb;
        }
      `}</style>
    </>
  );
};

export default Feed;