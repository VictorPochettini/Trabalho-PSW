// src/pages/Feed.jsx
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { fetchPosts } from "../redux/postsSlice";
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

  // novo formato: currentUserState = { user, token }
  const currentUserState = useSelector((state) => state.user?.currentUser);
  const currentUser = currentUserState?.user ?? null;
  const viewerId = currentUser?._id ?? currentUser?.id ?? null;

  // usuários agora via Redux
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

  // busca quem o viewer está seguindo (endpoint existente no seu backend)
  useEffect(() => {
    const fetchSeguindo = async () => {
      if (viewerId) {
        try {
          setLoadingSeguindo(true);
          // endpoint que você já usava; mantém comportamento
          const res = await axios.get(`http://localhost:5000/seguidores?followerId=${viewerId}`);
          const ids = Array.isArray(res.data) ? res.data.map((item) => Number(item.followingId)) : [];
          setSeguindoIds(ids);
          try {
            localStorage.setItem(`seguindoIds_${viewerId}`, JSON.stringify(ids));
          } catch (e) { /* ignore storage errors */ }
        } catch (err) {
          console.error("Erro ao buscar seguindo:", err);
          // fallback para localStorage se houver
          try {
            const saved = localStorage.getItem(`seguindoIds_${viewerId}`);
            if (saved) setSeguindoIds(JSON.parse(saved));
            else setSeguindoIds([]);
          } catch (e) {
            setSeguindoIds([]);
          }
        } finally {
          setLoadingSeguindo(false);
        }
      } else {
        // sem usuário logado
        setSeguindoIds([]);
        setLoadingSeguindo(false);
      }
    };

    fetchSeguindo();
  }, [viewerId]);

  // carregar posts e usuários via redux
  useEffect(() => {
    dispatch(fetchPosts());
    dispatch(fetchUsuarios());
  }, [dispatch]);

  // combinar posts com dados do usuário (apenas quando ambos carregarem)
  useEffect(() => {
    if (!loadingPosts && !loadingUsuarios && usuarios.length >= 0) {
      const combinados = (posts || []).map((post) => {
        const usuario = usuarios.find((u) => {
      const uid = u?._id ?? u?.id;
      return String(uid) === String(post.usuarioId);
       });
        return {
          ...post,
          id: post.id,
          content: post.titulo ?? post.content ?? "",
          texto: post.conteudo ?? post.texto ?? "",
          username: usuario ? (usuario.nome || usuario.username) : "@desconhecido",
          usuarioId: Number(post.usuarioId),
          mediaType:
            post.tipo === "musica" ? "audio" : post.tipo === "visual" ? "image" : "text",
          mediaSrc: (post.tipo === "musica" || post.tipo === "visual") ? `/media/${post.conteudo}` : null,
          mediaAlt: post.tipo === "visual" ? post.titulo : null,
          time: post.data ? new Date(post.data).toLocaleString() : (post.createdAt ? new Date(post.createdAt).toLocaleString() : "")
        };
      });

      // ordenar do mais recente para o mais antigo (mantendo seu comportamento anterior)
      const getDate = (p) => p?.data ?? p?.createdAt ?? p?.time;
      combinados.sort((a, b) => new Date(getDate(b)) - new Date(getDate(a)));

      setPostsComUsuario(combinados);
    }
  }, [loadingPosts, loadingUsuarios, posts, usuarios]);

  // filtrar posts apenas dos seguidos (ou também os próprios posts, se desejar)
  useEffect(() => {
    if (postsComUsuario.length > 0 && seguindoIds.length > 0) {
      const filtrados = postsComUsuario.filter((post) => {
        const uid = Number(post.usuarioId);
        // inclui publicações de quem você segue e também as próprias publicações
        return seguindoIds.includes(uid) || (viewerId && (uid === Number(viewerId)));
      });
      setPostsDosSeguidos(filtrados);
    } else {
      // se não segue ninguém, deixar vazio (mensagem de vazio será exibida)
      setPostsDosSeguidos([]);
    }
  }, [postsComUsuario, seguindoIds, viewerId]);

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

  if (loadingPosts || loadingUsuarios || loadingSeguindo) return <p>Carregando...</p>;
  if (errorPosts) return <p>{errorPosts}</p>;

  return (
    <>
      <Header />

      <div className="feed-content-wrapper">
        {postsDosSeguidos.length === 0 ? (
          <div style={{
            textAlign: "center",
            padding: "40px",
            color: "rgba(255,255,255,0.7)"
          }}>
            <h3>Nenhuma publicação de pessoas que você segue</h3>
            <p>Comece a seguir alguns artistas para ver suas publicações aqui!</p>
            <p style={{ fontSize: "0.9rem", marginTop: "10px", color: "rgba(255,255,255,0.5)" }}>
              {currentUser ? `Você está seguindo ${seguindoIds.length} pessoas` : "Faça login para seguir pessoas"}
            </p>
            {currentUser && (
              <div style={{ marginTop: "20px", padding: "15px", background: "rgba(255,255,255,0.05)", borderRadius: "10px" }}>
                <p style={{ margin: 0, fontSize: "0.9rem" }}>
                  <strong>IDs que você segue:</strong> {seguindoIds.join(", ") || "Nenhum"}
                </p>
              </div>
            )}
          </div>
        ) : (
          postsDosSeguidos.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onMonetizeClick={handleMonetizeClick}
              onCommentClick={handleCommentClick}
            />
          ))
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
