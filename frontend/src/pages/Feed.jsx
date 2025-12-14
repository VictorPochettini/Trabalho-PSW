// src/pages/Feed.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { fetchPosts, updatePost } from "../redux/postsSlice"; 
import { fetchUsuarios } from "../redux/usuariosSlice";

import Header from "../components/Header2";
import PostCard from "../components/PostCard";
import MonetizationPopup from "../components/MonetizationPopup";
import CommentsPopup from "../components/CommentsPopup";
import FloatingActionButton from "../components/FloatingActionButton";

/**
 * @typedef {object} Usuario
 * @property {string} [_id] ID do MongoDB do usuário.
 * @property {string} [id] ID alternativo do usuário.
 * @property {string} [username] Nome de usuário.
 * @property {string} [nome] Nome de exibição.
 * @property {string} [fotoPerfil] Caminho/URL da foto de perfil.
 */

/**
 * @typedef {object} CurrentUserState
 * @property {Usuario | null} [user] O objeto do usuário logado.
 * @property {string | null} [token] O token de autenticação JWT.
 */

/**
 * @typedef {object} Post
 * @property {string} [_id] ID do MongoDB do post.
 * @property {string} [id] ID alternativo do post.
 * @property {string} [usuarioId] ID do autor do post.
 * @property {string} [userId] ID do autor do post (alternativo).
 * @property {('texto' | 'musica' | 'visual' | 'letra')} tipo Tipo do post.
 * @property {string} [titulo] Título do post.
 * @property {string} [conteudo] Conteúdo principal (texto ou letra).
 * @property {string} [texto] Conteúdo principal (alternativo).
 * @property {string} [content] Conteúdo principal (alternativo).
 * @property {string} [mediaPath] Caminho do arquivo de mídia no servidor.
 * @property {string} [data] Data de criação.
 * @property {string} [createdAt] Data de criação (alternativo).
 */

/**
 * @typedef {object} CombinedPost Extensão de Post com dados do autor processados para exibição.
 * @augments Post
 * @property {string} id ID principal do post.
 * @property {string} content Conteúdo do post (prioritário).
 * @property {string} texto Conteúdo do post (alternativo).
 * @property {string} usuarioId ID do autor (padronizado para string).
 * @property {string} authorName Nome de exibição do autor.
 * @property {string} authorUsername Username do autor.
 * @property {string | null} authorPhoto Caminho/URL da foto de perfil do autor.
 * @property {('audio' | 'image' | 'text')} mediaType Tipo de mídia padronizado.
 * @property {string | null} mediaSrc URL completa da mídia.
 * @property {string | null} mediaAlt Texto alternativo para mídia visual.
 * @property {string} time Data/hora formatada.
 */

/**
 * @typedef {object} UpdatePostPayload
 * @property {string} id ID do post a ser atualizado.
 * @property {object} data Os campos do post a serem modificados (ex: { titulo: string, conteudo: string }).
 */


/**
 * Componente principal da página Feed.
 * * Exibe um feed personalizado contendo posts dos usuários seguidos
 * e posts do próprio usuário logado. Gerencia o carregamento de dados,
 * filtros, e as interações de edição, comentários e monetização.
 *
 * @returns {JSX.Element} A interface completa do Feed.
 */
const Feed = () => {
  const dispatch = useDispatch();

  /** @type {Post[]} Lista de todos os posts carregados. */
  const posts = useSelector((state) => state.posts.lista || []);
  const loadingPosts = useSelector((state) => state.posts.loading);
  const errorPosts = useSelector((state) => state.posts.error);

  /** @type {CurrentUserState | undefined} Estado completo do usuário logado no Redux. */
  const currentUserState = useSelector((state) => state.user?.currentUser);
  /** @type {Usuario | null} Objeto do usuário logado. */
  const currentUser = currentUserState?.user ?? null;
  /** @type {string | null} ID do usuário logado. */
  const viewerId = currentUser?._id ?? currentUser?.id ?? null;

  /** @type {Usuario[]} Lista de todos os usuários carregados. */
  const usuarios = useSelector((state) => state.user.usuarios || []);
  const loadingUsuarios = useSelector((state) => state.user.loading);

  // --- Estados Derivados
  /** @type {CombinedPost[]} Posts combinados com dados de autor. */
  const [postsComUsuario, setPostsComUsuario] = useState([]);
  /** @type {CombinedPost[]} Posts filtrados: apenas de usuários seguidos ou próprios. */
  const [postsDosSeguidos, setPostsDosSeguidos] = useState([]);
  /** @type {string[]} IDs dos usuários que o usuário logado está seguindo. */
  const [seguindoIds, setSeguindoIds] = useState([]); 
  const [loadingSeguindo, setLoadingSeguindo] = useState(true);

  // --- Estados de Pop-up
  const [showMonetization, setShowMonetization] = useState(false);
  const [monetizationUsername, setMonetizationUsername] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [currentPostIdForComments, setCurrentPostIdForComments] = useState(null);

  // --- Estados de Edição de Post
  /** @type {string | null} ID do post atualmente em modo de edição. */
  const [editingPost, setEditingPost] = useState(null);
  /** @type {string} Conteúdo/texto sendo editado. */
  const [editText, setEditText] = useState('');
  /** @type {string} Título sendo editado (para posts de texto). */
  const [editTitle, setEditTitle] = useState('');

  /** @type {boolean} Estado para refresh manual em andamento. */
  const [isRefreshing, setIsRefreshing] = useState(false);

  /**
   * @private
   * Função para acionar a recarga manual do feed (posts e usuários).
   * @type {() => Promise<void>}
   */
  const handleRefreshFeed = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        dispatch(fetchPosts()).unwrap(),
        dispatch(fetchUsuarios()).unwrap()
      ]);
      console.log('✅ Feed atualizado manualmente');
    } catch (error) {
      console.error('❌ Erro ao atualizar feed:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [dispatch]);

  // --- Funções de Seguir ---
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
  }, [viewerId]); // ✅ Só executa quando viewerId muda

  // ✅ OTIMIZADO: Carrega posts apenas uma vez na montagem
  useEffect(() => {
    console.log('🔄 Feed - Carregando posts e usuários (apenas uma vez)');
    dispatch(fetchPosts());
    dispatch(fetchUsuarios());
  }, []); // ✅ Array vazio = executa apenas na montagem do componente

  // --- Combinação de Posts com foto de perfil ---
  useEffect(() => {
    if (!loadingPosts && !loadingUsuarios && usuarios.length >= 0) {
      const API_URL = import.meta?.env?.VITE_API_URL ||
        (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL) ||
        'http://localhost:5000';
      
      const combinados = (posts || []).map((post) => {
        const usuario = usuarios.find((u) => {
          const uid = u?._id ?? u?.id;
          const postUserId = post.usuarioId ?? post.userId;
          return String(uid) === String(postUserId);
        });
        
        // ✅ CORREÇÃO: Construir mediaSrc corretamente
        let mediaSrc = null;
        if (post.tipo === "musica" || post.tipo === "visual") {
          if (post.mediaPath) {
            const normalizedPath = post.mediaPath.replace(/\\/g, '/');
            mediaSrc = `${API_URL}/${normalizedPath}`;
          }
        }
        
        return {
          ...post,
          id: post._id ?? post.id,
          content: post.titulo ?? post.content ?? "",
          texto: post.conteudo ?? post.texto ?? "",
          username: usuario ? (usuario.nome || usuario.username) : "@desconhecido",
          // ✅ ADICIONADO: Foto de perfil do autor
          authorName: usuario ? (usuario.nome || usuario.username) : "@desconhecido",
          authorUsername: usuario?.username || "",
          authorPhoto: usuario?.fotoPerfil || null,
          usuarioId: String(post.usuarioId ?? post.userId),
          mediaType:
            post.tipo === "musica" ? "audio" : post.tipo === "visual" ? "image" : "text",
          mediaSrc: mediaSrc,
          mediaAlt: post.tipo === "visual" ? post.titulo : null,
          time: post.data ? new Date(post.data).toLocaleString() : 
            (post.createdAt ? new Date(post.createdAt).toLocaleString() : "")
        };
      });

      const getDate = (p) => p?.data ?? p?.createdAt ?? p?.time;
      combinados.sort((a, b) => new Date(getDate(b)) - new Date(getDate(a)));
      setPostsComUsuario(combinados);
      
      console.log('📊 Feed - Posts processados:', combinados.length);
    }
  }, [loadingPosts, loadingUsuarios, posts, usuarios]);

  // --- Filtro de Feed ---
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
      console.log('📊 Feed - Posts filtrados:', filtrados.length, 'de', postsComUsuario.length);
    } else {
      setPostsDosSeguidos([]);
    }
  }, [postsComUsuario, seguindoIds, viewerId]);

  /**
   * @private
   * Abre o pop-up de monetização para um usuário específico.
   * @param {string} username O nome de usuário para quem a monetização é solicitada.
   */
  const handleMonetizeClick = (username) => {
    setMonetizationUsername(username);
    setShowMonetization(true);
    document.body.style.overflow = "hidden";
  };

  /** @private Fecha o pop-up de monetização. */
  const handleCloseMonetization = () => {
    setShowMonetization(false);
    document.body.style.overflow = "";
  };

    /**
   * @private
   * Abre o pop-up de comentários para um post específico.
   * @param {string} postId O ID do post.
   */
  const handleCommentClick = (postId) => {
    setCurrentPostIdForComments(postId);
    setShowComments(true);
    document.body.style.overflow = "hidden";
  };

  /** @private Fecha o pop-up de comentários. */
  const handleCloseComments = () => {
    setShowComments(false);
    setCurrentPostIdForComments(null);
    document.body.style.overflow = "";
  };

  /**
   * @private
   * Inicia o modo de edição para um post.
   * Preenche os estados `editText` e `editTitle` com o conteúdo atual do post.
   * @param {CombinedPost} post O objeto de post a ser editado.
   */
  const handleEditClick = (post) => {
    const postId = post._id || post.id;
    setEditingPost(postId);
    
    let textToEdit = '';
    let titleToEdit = '';
    
    if (post.tipo === 'texto' || post.tipo === 'letra') {
      // Para posts de texto: pegar título e conteúdo separadamente
      titleToEdit = post.titulo || '';
      textToEdit = post.texto || post.conteudo || post.content || '';
    } else if (post.tipo === 'musica' || post.tipo === 'visual') {
      // Para posts de mídia: apenas o título
      textToEdit = post.titulo || post.content || '';
    } else {
      // Fallback
      textToEdit = post.content || post.texto || post.titulo || '';
    }
    
    setEditText(textToEdit);
    setEditTitle(titleToEdit);
  };

  /**
   * @private
   * Salva a edição de um post específico enviando os dados atualizados para o Redux/API.
   * @async
   * @param {string} postId O ID do post a ser salvo.
   */
  const handleSaveEdit = async (postId) => {
    const postToUpdate = posts.find(p => String(p._id || p.id) === String(postId));
    
    if (!postToUpdate) {
      alert('Post não encontrado');
      return;
    }

    // Validação específica para posts de texto
    if (postToUpdate.tipo === 'texto' || postToUpdate.tipo === 'letra') {
      if (!editTitle.trim() || !editText.trim()) {
        alert('Título e letra não podem estar vazios!');
        return;
      }
    } else {
      if (!editText.trim()) {
        alert('O texto não pode estar vazio!');
        return;
      }
    }

    try {
      let updateData = {};
      
      if (postToUpdate.tipo === 'texto' || postToUpdate.tipo === 'letra') {
        // Para posts de texto: atualizar título e conteúdo separadamente
        updateData = {
          titulo: editTitle.trim(),
          conteudo: editText.trim(),
        };
      } else if (postToUpdate.tipo === 'musica' || postToUpdate.tipo === 'visual') {
        // Para posts de mídia: apenas o título
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
      setEditTitle('');
      
      console.log('✅ Post editado com sucesso');
      
    } catch (error) {
      console.error('❌ Erro ao editar post:', error);
      alert('Erro ao salvar a edição.');
    }
  };

  const handleCancelEdit = () => {
    setEditingPost(null);
    setEditText('');
    setEditTitle('');
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
        {/* ✅ NOVO: Botão de Refresh Manual */}
        <div className="feed-header">
          <button 
            className="refresh-button"
            onClick={handleRefreshFeed}
            disabled={isRefreshing}
            title="Atualizar feed"
          >
            <i className={`fas fa-sync-alt ${isRefreshing ? 'spinning' : ''}`}></i>
            <span>{isRefreshing ? 'Atualizando...' : 'Atualizar'}</span>
          </button>
        </div>

        {postsDosSeguidos.length === 0 ? (
          <div className="empty-feed-message">
            <i className="fas fa-rss fa-3x"></i>
            <h3>Nenhuma publicação de pessoas que você segue</h3>
            <p>Comece a seguir alguns artistas para ver suas publicações aqui!</p>
            <div className="follow-stats">
              <p>
                {currentUser 
                  ? `Você está seguindo ${seguindoIds.length} ${seguindoIds.length === 1 ? 'pessoa' : 'pessoas'}` 
                  : "Faça login para seguir pessoas"}
              </p>
            </div>
          </div>
        ) : (
          <div className="posts-container">
            {postsDosSeguidos.map((post) => {
              const currentPostId = post._id || post.id;
              return (
                <PostCard
                  key={currentPostId}
                  post={post}
                  onMonetizeClick={handleMonetizeClick}
                  onCommentClick={handleCommentClick}
                  onEditClick={handleEditClick}
                  onSaveEdit={handleSaveEdit}
                  onCancelEdit={handleCancelEdit}
                  isEditing={editingPost === currentPostId}
                  editText={editText}
                  editTitle={editTitle}
                  onEditTextChange={setEditText}
                  onEditTitleChange={setEditTitle}
                />
              );
            })}
          </div>
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
          padding: clamp(16px, 3vw, 20px);
        }

        /* ✅ Header do Feed com Botão de Refresh */
        .feed-header {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          margin-bottom: clamp(16px, 3vw, 24px);
          padding: 0 clamp(8px, 2vw, 16px);
        }

        .refresh-button {
          display: inline-flex;
          align-items: center;
          gap: clamp(6px, 1.5vw, 8px);
          padding: clamp(8px, 1.8vw, 10px) clamp(14px, 2.5vw, 18px);
          background: linear-gradient(135deg, rgba(94, 23, 235, 0.85), rgba(123, 63, 242, 0.85));
          border: 1px solid rgba(255, 255, 255, 0.22);
          border-radius: clamp(12px, 2.5vw, 14px);
          color: white;
          font-weight: 700;
          font-size: clamp(0.8rem, 1.8vw, 0.9rem);
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 8px 20px rgba(94, 23, 235, 0.3);
          backdrop-filter: blur(10px);
        }

        .refresh-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 12px 26px rgba(94, 23, 235, 0.4);
          border-color: rgba(255, 255, 255, 0.3);
        }

        .refresh-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .refresh-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .refresh-button i {
          font-size: clamp(0.9rem, 2vw, 1rem);
        }

        .refresh-button i.spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Posts Container */
        .posts-container {
          display: flex;
          flex-direction: column;
          gap: clamp(16px, 3vw, 20px);
        }

        /* Empty Feed Message */
        .empty-feed-message {
          text-align: center;
          padding: clamp(40px, 8vw, 60px) clamp(16px, 3vw, 20px);
          color: rgba(255, 255, 255, 0.7);
          max-width: 600px;
          margin: 0 auto;
        }

        .empty-feed-message i {
          color: rgba(94, 23, 235, 0.5);
          margin-bottom: clamp(16px, 3vw, 24px);
        }

        .empty-feed-message h3 {
          margin-bottom: clamp(12px, 2.5vw, 16px);
          color: rgba(255, 255, 255, 0.9);
          font-size: clamp(1.1rem, 2.5vw, 1.3rem);
          font-weight: 700;
        }

        .empty-feed-message p {
          font-size: clamp(0.9rem, 2vw, 1rem);
          line-height: 1.5;
          margin-bottom: clamp(16px, 3vw, 20px);
        }

        .follow-stats {
          margin-top: clamp(16px, 3vw, 20px);
          padding: clamp(12px, 2.5vw, 16px);
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.04));
          border-radius: clamp(10px, 2vw, 14px);
          border: 1px solid rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(10px);
        }

        .follow-stats p { 
          margin: 0; 
          color: rgba(255, 255, 255, 0.85);
          font-size: clamp(0.85rem, 1.8vw, 0.95rem);
          font-weight: 600;
        }

        .follow-stats strong { 
          color: #7b3ff2;
          font-weight: 800;
        }

        /* ===== RESPONSIVIDADE ===== */

        /* Tablets */
        @media (max-width: 768px) {
          .feed-content-wrapper {
            padding: 16px 12px;
          }

          .feed-header {
            margin-bottom: 16px;
          }
        }

        /* Mobile */
        @media (max-width: 640px) {
          .feed-content-wrapper {
            padding: 14px 10px;
          }

          .feed-header {
            margin-bottom: 14px;
            padding: 0 8px;
          }

          .refresh-button {
            padding: 8px 12px;
            font-size: 0.8rem;
          }

          .refresh-button span {
            display: none;
          }

          .refresh-button i {
            font-size: 1rem;
            margin: 0;
          }

          .posts-container {
            gap: 14px;
          }

          .empty-feed-message {
            padding: 40px 16px;
          }

          .empty-feed-message i {
            font-size: 2rem !important;
          }

          .empty-feed-message h3 {
            font-size: 1.1rem;
          }

          .empty-feed-message p {
            font-size: 0.9rem;
          }
        }

        /* Mobile 21:9 */
        @media (max-width: 450px) and (min-aspect-ratio: 9/19) {
          .feed-content-wrapper {
            padding: 12px 8px;
          }

          .feed-header {
            margin-bottom: 12px;
          }

          .refresh-button {
            padding: 7px 10px;
          }

          .posts-container {
            gap: 12px;
          }

          .empty-feed-message {
            padding: 32px 12px;
          }

          .follow-stats {
            padding: 10px;
          }
        }

        /* Mobile 21:9 Muito Estreito */
        @media (max-width: 360px) and (min-aspect-ratio: 9/19) {
          .feed-content-wrapper {
            padding: 10px 8px;
          }

          .refresh-button {
            padding: 6px 9px;
          }

          .empty-feed-message {
            padding: 28px 10px;
          }
        }
      `}</style>
    </>
  );
};

export default Feed;