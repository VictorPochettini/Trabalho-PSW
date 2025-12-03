// src/pages/Feed.jsx
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
// 1. IMPORTAR updatePost AQUI
import { fetchPosts, updatePost } from "../redux/postsSlice"; 
import { fetchUsuarios } from "../redux/usuariosSlice";

import Header from "../components/Header2";
import PostCard from "../components/PostCard";
import MonetizationPopup from "../components/MonetizationPopup";
import CommentsPopup from "../components/CommentsPopup";
import FloatingActionButton from "../components/FloatingActionButton";

const Feed = () => {
  const dispatch = useDispatch();

  const posts = useSelector((state) => state.posts.lista || []);
  const loadingPosts = useSelector((state) => state.posts.loading);
  const errorPosts = useSelector((state) => state.posts.error);

  const currentUserState = useSelector((state) => state.user?.currentUser);
  const currentUser = currentUserState?.user ?? null;
  const viewerId = currentUser?._id ?? currentUser?.id ?? null;

  const usuarios = useSelector((state) => state.user.usuarios || []);
  const loadingUsuarios = useSelector((state) => state.user.loading);

  const [postsComUsuario, setPostsComUsuario] = useState([]);
  const [postsDosSeguidos, setPostsDosSeguidos] = useState([]);
  const [seguindoIds, setSeguindoIds] = useState([]); 
  const [loadingSeguindo, setLoadingSeguindo] = useState(true);

  const [showMonetization, setShowMonetization] = useState(false);
  const [monetizationUsername, setMonetizationUsername] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [currentPostIdForComments, setCurrentPostIdForComments] = useState(null);

  // 2. ESTADOS DE EDIÇÃO (Faltavam aqui)
  const [editingPost, setEditingPost] = useState(null);
  const [editText, setEditText] = useState('');

  // --- Funções de Seguir (Inalteradas) ---
  useEffect(() => {
    const fetchSeguindo = async () => {
      if (viewerId) {
        try {
          setLoadingSeguindo(true);
          const res = await axios.get(`http://localhost:5000/seguidores?followerId=${viewerId}`);
          const ids = Array.isArray(res.data) 
            ? res.data.map((item) => String(item.followingId))
            : [];
          setSeguindoIds(ids);
          try {
            localStorage.setItem(`seguindoIds_${viewerId}`, JSON.stringify(ids));
          } catch (e) { console.warn(e); }
        } catch (err) {
          console.error("❌ Erro ao buscar seguindo:", err);
          try {
            const saved = localStorage.getItem(`seguindoIds_${viewerId}`);
            if (saved) setSeguindoIds(JSON.parse(saved));
            else setSeguindoIds([]);
          } catch (e) { setSeguindoIds([]); }
        } finally {
          setLoadingSeguindo(false);
        }
      } else {
        setSeguindoIds([]);
        setLoadingSeguindo(false);
      }
    };
    fetchSeguindo();
  }, [viewerId]);

  useEffect(() => {
    dispatch(fetchPosts());
    dispatch(fetchUsuarios());
  }, [dispatch]);

  // --- Combinação de Posts (Inalterada) ---
  useEffect(() => {
    if (!loadingPosts && !loadingUsuarios && usuarios.length >= 0) {
      const combinados = (posts || []).map((post) => {
        const usuario = usuarios.find((u) => {
          const uid = u?._id ?? u?.id;
          const postUserId = post.usuarioId ?? post.userId;
          return String(uid) === String(postUserId);
        });
        
        return {
          ...post,
          id: post._id ?? post.id,
          content: post.titulo ?? post.content ?? "",
          texto: post.conteudo ?? post.texto ?? "",
          username: usuario ? (usuario.nome || usuario.username) : "@desconhecido",
          usuarioId: String(post.usuarioId ?? post.userId),
          mediaType:
            post.tipo === "musica" ? "audio" : post.tipo === "visual" ? "image" : "text",
          mediaSrc: (post.tipo === "musica" || post.tipo === "visual") ? `/media/${post.conteudo}` : null,
          mediaAlt: post.tipo === "visual" ? post.titulo : null,
          time: post.data ? new Date(post.data).toLocaleString() : (post.createdAt ? new Date(post.createdAt).toLocaleString() : "")
        };
      });

      const getDate = (p) => p?.data ?? p?.createdAt ?? p?.time;
      combinados.sort((a, b) => new Date(getDate(b)) - new Date(getDate(a)));
      setPostsComUsuario(combinados);
    }
  }, [loadingPosts, loadingUsuarios, posts, usuarios]);

  // --- Filtro de Feed (Inalterado) ---
  useEffect(() => {
    if (postsComUsuario.length > 0) {
      const viewerIdString = String(viewerId);
      const filtrados = postsComUsuario.filter((post) => {
        const postUserId = String(post.usuarioId);
        const isSeguindo = seguindoIds.includes(postUserId);
        const isProprioPost = viewerId && (postUserId === viewerIdString);
        return isSeguindo || isProprioPost;
      });
      setPostsDosSeguidos(filtrados);
    } else {
      setPostsDosSeguidos([]);
    }
  }, [postsComUsuario, seguindoIds, viewerId]);

  // --- Handlers de UI ---
  const handleMonetizeClick = (username) => {
    setMonetizationUsername(username);
    setShowMonetization(true);
    document.body.style.overflow = "hidden";
  };

  const handleCloseMonetization = () => {
    setShowMonetization(false);
    document.body.style.overflow = "";
  };

  const handleCommentClick = (postId) => {
    setCurrentPostIdForComments(postId);
    setShowComments(true);
    document.body.style.overflow = "hidden";
  };

  const handleCloseComments = () => {
    setShowComments(false);
    setCurrentPostIdForComments(null);
    document.body.style.overflow = "";
  };

  // 3. IMPLEMENTAÇÃO DA LÓGICA DE EDIÇÃO (Copiada do UserProfile e adaptada)
  const handleEditClick = (post) => {
    const postId = post._id || post.id;
    setEditingPost(postId);
    
    let textToEdit = '';
    
    // Lógica para pegar o texto correto baseado no tipo
    if (post.tipo === 'texto' || post.tipo === 'letra') {
      textToEdit = post.texto || post.conteudo || post.content || '';
    } else if (post.tipo === 'musica' || post.tipo === 'visual') {
      textToEdit = post.titulo || post.content || '';
    } else {
      textToEdit = post.content || post.texto || post.titulo || '';
    }
    
    setEditText(textToEdit);
  };

  const handleSaveEdit = async (postId) => {
    if (!editText.trim()) {
      alert('O texto não pode estar vazio!');
      return;
    }

    try {
      // Procura no array geral de posts (do Redux) para garantir dados frescos
      const postToUpdate = posts.find(p => String(p._id || p.id) === String(postId));
      
      if (!postToUpdate) {
        alert('Post não encontrado');
        return;
      }

      let updateData = {};
      
      if (postToUpdate.tipo === 'texto' || postToUpdate.tipo === 'letra') {
        updateData = {
          conteudo: editText.trim(),
          titulo: editText.trim().substring(0, 100),
        };
      } else if (postToUpdate.tipo === 'musica' || postToUpdate.tipo === 'visual') {
        updateData = {
          titulo: editText.trim(),
        };
      } else {
        updateData = {
          conteudo: editText.trim(),
          titulo: editText.trim().substring(0, 100),
        };
      }

      await dispatch(updatePost({ 
        id: postId, 
        data: updateData 
      })).unwrap();

      setEditingPost(null);
      setEditText('');
      
    } catch (error) {
      console.error('❌ Erro ao editar post:', error);
      alert('Erro ao salvar a edição.');
    }
  };

  const handleCancelEdit = () => {
    setEditingPost(null);
    setEditText('');
  };


  if (loadingPosts || loadingUsuarios || loadingSeguindo) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', color: 'white' }}>
        <p>Carregando feed...</p>
      </div>
    );
  }
  
  if (errorPosts) return <p>{errorPosts}</p>;

  return (
    <>
      <Header />

      <div className="feed-content-wrapper">
        {postsDosSeguidos.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "rgba(255,255,255,0.7)" }}>
            <h3>Nenhuma publicação de pessoas que você segue</h3>
            <p>Comece a seguir alguns artistas para ver suas publicações aqui!</p>
            <p style={{ fontSize: "0.9rem", marginTop: "10px", color: "rgba(255,255,255,0.5)" }}>
              {currentUser ? `Você está seguindo ${seguindoIds.length} pessoas` : "Faça login para seguir pessoas"}
            </p>
          </div>
        ) : (
          postsDosSeguidos.map((post) => {
            const currentPostId = post._id || post.id;
            return (
              <PostCard
                key={currentPostId}
                post={post}
                onMonetizeClick={handleMonetizeClick}
                onCommentClick={handleCommentClick}
                // 4. PASSAR AS PROPS DE EDIÇÃO PARA O POSTCARD
                onEditClick={handleEditClick}
                onSaveEdit={handleSaveEdit}
                onCancelEdit={handleCancelEdit}
                isEditing={editingPost === currentPostId}
                editText={editText}
                onEditTextChange={setEditText}
                // O PostCard já calcula se pode editar checando os IDs, 
                // mas podemos reforçar passando o ID correto se necessário
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
        .feed-content-wrapper {
          max-width: 1800px;
          margin: 0 auto;
          padding: 20px;
        }
        /* ... resto dos estilos iguais ... */
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
        .follow-stats p { margin: 0; color: rgba(255, 255, 255, 0.8); }
        .follow-stats strong { color: #5e17eb; }
      `}</style>
    </>
  );
};

export default Feed;