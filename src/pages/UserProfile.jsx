// src/pages/UserProfile.jsx
import React, { useState, useRef, useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import botaoVolta from "../images/botaoVolta.png";
import styles from "../css/Login.module.css";
import { fetchUsuarios } from "../redux/usuariosSlice";
import { fetchPosts } from "../redux/postsSlice";
import { fetchFollowCounts, selectFollowCounts, fetchFollowersList, fetchFollowingList } from '../redux/followsSlice';

import PostCard from "../components/PostCard";
import FloatingActionButton from "../components/FloatingActionButton";
import MonetizationPopup from "../components/MonetizationPopup";
import CommentsPopup from "../components/CommentsPopup";

const BackButton = () => {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      className={styles.backButton}
      onClick={() => navigate(-1)}
    >
      <img src={botaoVolta} alt="Voltar" />
    </button>
  );
};

const UserProfile = () => {
  // ---------- hooks no topo ----------
  const { username } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  

  const usuarios = useSelector((state) => state.user.usuarios || []);
  const posts = useSelector((state) => state.posts.lista || []);
  const currentUser = useSelector((state) => state.user.currentUser);
  const isOwnProfile = currentUser?.username === username;

  // loading flags para “ready”
  const usersLoading = useSelector((s) => s.user.loading);
  const postsLoading = useSelector((s) => s.posts.loading);
  const ready = !usersLoading && !postsLoading;

  const [profilePhoto, setProfilePhoto] = useState(null);
  const fileInputRef = useRef(null);

  // Popups (iguais ao Feed) — DEVEM vir antes de qualquer return condicional
  const [showMonetization, setShowMonetization] = useState(false);
  const [monetizationUsername, setMonetizationUsername] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [currentPostIdForComments, setCurrentPostIdForComments] = useState(null);

  // NOVOS ESTADOS para popups de seguidores/seguindo
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [followersList, setFollowersList] = useState([]);
  const [followingList, setFollowingList] = useState([]);

  // Buscas iniciais (protegido contra StrictMode em dev)
  const didInitRef = useRef(false);
  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;
    if (!usuarios.length) dispatch(fetchUsuarios());
    if (!posts.length) dispatch(fetchPosts());
  }, [dispatch, usuarios.length, posts.length]);

  // ---------- derivação com memo, só quando “ready” ----------
  const user = useMemo(() => {
    if (!ready) return null;
    return usuarios.find((u) => u.username === username) || null;
  }, [ready, usuarios, username]);

  // dispara contagem de seguidores/seguindo quando soubermos o user.id (sem duplicar)
  const lastCountUserIdRef = useRef(null);
  useEffect(() => {
    if (!ready || !user?.id) return;
    if (lastCountUserIdRef.current === user.id) return;
    lastCountUserIdRef.current = user.id;
    dispatch(fetchFollowCounts({ userId: user.id }));
  }, [dispatch, ready, user?.id]);

  // lê as contagens do Redux (usa seu selector)
  const followCounts = useSelector((state) =>
    selectFollowCounts(user?.id || 0)(state)
  );
  const followersCount = followCounts.followersCount || 0;
  const followingCount = followCounts.followingCount || 0;

  // foto de perfil (preview local) – mantém seu comportamento original
  useEffect(() => {
    if (user?.fotoPerfil) setProfilePhoto(user.fotoPerfil);
  }, [user?.fotoPerfil]);

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setProfilePhoto(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  // Fechar popups ao trocar de perfil + cleanup overflow
  useEffect(() => {
    setShowMonetization(false);
    setMonetizationUsername("");
    setShowComments(false);
    setCurrentPostIdForComments(null);
    document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [username]);

  const handleEditProfile = () => navigate("/edit-profile");

  // mapear posts do usuário → formato do PostCard (se user for null, vira lista vazia)
  const userPostsRaw = user
    ? posts.filter((p) => Number(p.usuarioId) === Number(user.id))
    : [];
  const userPosts = userPostsRaw
    .map((p) => {
      const isTexto = p.tipo === "texto" || p.tipo === "letra";
      const isMusica = p.tipo === "musica";
      const isImagem = p.tipo === "visual";

      const content = p.titulo
        ? isTexto && p.conteudo
          ? `${p.conteudo}`
          : p.titulo
        : isTexto
        ? p.conteudo || ""
        : "";

      return {
        ...p,
        time: new Date(p.data).toLocaleString("pt-BR"),
        content,
        mediaType: isMusica ? "audio" : isImagem ? "image" : isTexto ? "text" : undefined,
        mediaSrc: isMusica || isImagem ? `/media/${p.conteudo}` : undefined,
        mediaAlt: p.titulo || "Mídia do post",
        texto: isTexto ? (p.texto ?? p.conteudo ?? "") : undefined,
      };
    })
    // 👇 ÚNICA ADIÇÃO: ordenar do mais recente para o mais antigo (usa p.data / createdAt / time)
    .slice()
    .sort(
      (a, b) =>
        new Date(b.data ?? b.createdAt ?? b.time) -
        new Date(a.data ?? a.createdAt ?? a.time)
    );

  // Handlers dos popups (iguais ao Feed)
  const handleMonetizeClick = (uname) => {
    setMonetizationUsername(uname || username);
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

  // NOVAS FUNÇÕES para seguidores/seguindo
  const handleShowFollowers = async () => {
    if (!user?.id) return;
    
    try {
      const result = await dispatch(fetchFollowersList(user.id)).unwrap();
      setFollowersList(result.followers);
      setShowFollowers(true);
      document.body.style.overflow = "hidden";
    } catch (error) {
      console.error("Erro ao carregar seguidores:", error);
      setFollowersList([]);
      setShowFollowers(true);
    }
  };

  const handleShowFollowing = async () => {
    if (!user?.id) return;
    
    try {
      const result = await dispatch(fetchFollowingList(user.id)).unwrap();
      setFollowingList(result.following);
      setShowFollowing(true);
      document.body.style.overflow = "hidden";
    } catch (error) {
      console.error("Erro ao carregar seguindo:", error);
      setFollowingList([]);
      setShowFollowing(true);
    }
  };

  const handleCloseFollowers = () => {
    setShowFollowers(false);
    document.body.style.overflow = "";
  };

  const handleCloseFollowing = () => {
    setShowFollowing(false);
    document.body.style.overflow = "";
  };

  return (
    <><BackButton/>
      <div className="container-fluid">
        <div className="row justify-content-center">
          <div className="col-12">
            {/* key força remount ao trocar de username */}
            <div className="profile-container profile-shell glass-header" key={`profile-${username}`}>
              {/* Se não houver usuário, só mostra aviso quando “ready” estiver true */}
              {(ready && usuarios.length > 0 && !user) ? (
                <div className="container-fluid text-center py-5">
                  <h2>Usuário "{username}" não encontrado 😢</h2>
                  <button className="btn btn-primary mt-3" onClick={() => navigate(-1)}>
                    Voltar
                  </button>
                </div>
              ) : (
                <>
                  {/* Header / capa do perfil */}
                  <div className="profile-header position-relative profile-header-glass banner-narrow">
                    {user?.username === currentUser?.username && (
                      <button className="lapis" onClick={handleEditProfile} title="Editar perfil">
                        <i className="fa-solid fa-pencil fa-lg" style={{ color: "#ffffff" }} />
                      </button>
                    )}

                    <div className="profile-picture-container avatar-wrap">
                      {profilePhoto ? (
                        <img
                          src={profilePhoto}
                          alt="Foto de perfil"
                          className="profile-picture rounded-circle avatar-photo"
                        />
                      ) : (
                        <div className="avatar-fallback rounded-circle">
                          <i className="fas fa-user" />
                        </div>
                      )}
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="file-input"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        style={{ display: "none" }}
                      />
                    </div>

                    <h1 className="profile-name">{user?.nome || user?.username}</h1>
                    <div className="profile-username subtle-username">@{user?.username}</div>

                    <div className="profile-stats">
                      <div className="stat clickable-stat" onClick={handleShowFollowers}>
                        <div className="stat-number">{followersCount}</div>
                        <div className="stat-label">Seguidores</div>
                      </div>
                      <div className="stat clickable-stat" onClick={handleShowFollowing}>
                        <div className="stat-number">{followingCount}</div>
                        <div className="stat-label">Seguindo</div>
                      </div>
                    </div>
                  </div>

                  {/* Feed de posts com PostCard real */}
                  <div className="posts-container posts-feed">
                    {userPosts.length === 0 ? (
                      <div className="card text-center text-muted py-5 empty-card">
                        <i className="fas fa-images display-4 mb-3"></i>
                        <p className="mb-0">Nenhuma publicação ainda.</p>
                      </div>
                    ) : (
                      userPosts.map((p) => (
                        <div key={p.id} className="mb-3">
                          <PostCard
                            post={p}
                            onMonetizeClick={handleMonetizeClick}
                            onCommentClick={handleCommentClick}
                            isOwnProfile={isOwnProfile} //referente tirar botoes apoiar e seguir no proprio perfil
                          />
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Popups iguais ao Feed*/}
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

      {/* Popup de Seguidores */}
      {showFollowers && (
        <div className="custom-popup-overlay" onClick={handleCloseFollowers}>
          <div className="custom-popup-content" onClick={(e) => e.stopPropagation()}>
            <div className="popup-header">
              <h3>Seguidores</h3>
              <button className="popup-close-btn" onClick={handleCloseFollowers}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="popup-body">
              {followersList.length === 0 ? (
                <div className="empty-list-message">
                  <i className="fas fa-users" style={{fontSize: '3rem', opacity: 0.5, marginBottom: '1rem'}}></i>
                  <p>Nenhum seguidor ainda</p>
                </div>
              ) : (
                <div className="users-list">
                  {followersList.map((follower) => (
                    <div key={follower.id} className="user-list-item">
                      <div className="user-avatar-small">
                        {follower.fotoPerfil ? (
                          <img src={follower.fotoPerfil} alt={follower.nome} />
                        ) : (
                          <i className="fas fa-user"></i>
                        )}
                      </div>
                      <div className="user-info-small">
                        <div className="user-name">{follower.nome}</div>
                        <div className="user-username">@{follower.username}</div>
                      </div>
                      <button 
                        className="btn btn-sm view-profile-btn"
                        onClick={() => {
                          handleCloseFollowers();
                          navigate(`/user/${follower.username}`);
                        }}
                      >
                        Ver Perfil
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Popup de Seguindo */}
      {showFollowing && (
        <div className="custom-popup-overlay" onClick={handleCloseFollowing}>
          <div className="custom-popup-content" onClick={(e) => e.stopPropagation()}>
            <div className="popup-header">
              <h3>Seguindo</h3>
              <button className="popup-close-btn" onClick={handleCloseFollowing}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="popup-body">
              {followingList.length === 0 ? (
                <div className="empty-list-message">
                  <i className="fas fa-user-plus" style={{fontSize: '3rem', opacity: 0.5, marginBottom: '1rem'}}></i>
                  <p>Não está seguindo ninguém ainda</p>
                </div>
              ) : (
                <div className="users-list">
                  {followingList.map((following) => (
                    <div key={following.id} className="user-list-item">
                      <div className="user-avatar-small">
                        {following.fotoPerfil ? (
                          <img src={following.fotoPerfil} alt={following.nome} />
                        ) : (
                          <i className="fas fa-user"></i>
                        )}
                      </div>
                      <div className="user-info-small">
                        <div className="user-name">{following.nome}</div>
                        <div className="user-username">@{following.username}</div>
                      </div>
                      <button 
                        className="btn btn-sm view-profile-btn"
                        onClick={() => {
                          handleCloseFollowing();
                          navigate(`/user/${following.username}`);
                        }}
                      >
                        Ver Perfil
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .lapis{
          border: none;
          background: none;
          padding-left: 16px;
        }
        .banner-narrow {
          max-width: clamp(640px, 88vw, 840px);
          width: 100%;
          margin: 0 auto;
          padding-left: 16px;
          padding-right: 16px;
        }

        .glass-header .profile-header-glass {
          position: relative;
          background: rgba(255,255,255,.10);
          border: 1px solid rgba(255,255,255,.14);
          border-radius: 20px;
          padding: 24px 16px 16px;
          box-shadow: 0 12px 26px rgba(0,0,0,.18);
          backdrop-filter: blur(10px) saturate(1.05);
        }
        .avatar-wrap {
          width: 112px; height: 112px; margin: 0 auto 12px; position: relative;
          border-radius: 999px; padding: 4px;
          background: linear-gradient(135deg, rgba(106,90,224,.55), rgba(140,127,242,.45));
          box-shadow: 0 10px 24px rgba(106,90,224,.28);
        }
        .avatar-photo {
          width: 100%; height: 100%; object-fit: cover; display: block;
          border: 3px solid rgba(255,255,255,.75);
        }
        .avatar-fallback {
          width: 100%; height: 100%; display: grid; place-items: center; color: #fff;
          background: linear-gradient(135deg, var(--roxo, #6a5ae0), #8c7ff2);
          font-size: 42px; box-shadow: inset 0 0 30px rgba(0,0,0,.18);
          border: 3px solid rgba(255,255,255,.75);
        }
        .profile-name {
          text-align: center; margin: 10px 0 2px;
          color: var(--text-color, #f3f5ff);
          text-shadow: 0 2px 14px rgba(0,0,0,.25);
        }
        .subtle-username {
          text-align: center; color: rgba(255,255,255,.85);
          font-weight: 500; letter-spacing: .2px; margin-bottom: 10px;
          text-shadow: 0 1px 10px rgba(0,0,0,.22);
        }
        .profile-stats {
          display: grid; grid-auto-flow: column; justify-content: center; gap: 24px;
          margin: 8px 0 2px;
        }
        .stat { text-align: center; }
        .stat-number {
          font-size: 20px; font-weight: 700; color: #fff;
          text-shadow: 0 2px 12px rgba(0,0,0,.25);
        }
        .stat-label { color: rgba(255,255,255,.8); font-size: 13px; }

        .empty-card {
          background: rgba(255,255,255,.08);
          border: 1px solid rgba(255,255,255,.14);
          border-radius: 16px;
          backdrop-filter: blur(6px);
        }

        .clickable-stat {
          cursor: pointer;
          transition: all 0.2s ease;
          padding: 8px 12px;
          border-radius: 12px;
        }

        .clickable-stat:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: translateY(-2px);
        }

        /* Estilos para os popups customizados */
        .custom-popup-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 20px;
        }

        .custom-popup-content {
          background: linear-gradient(135deg, rgba(30, 30, 40, 0.95), rgba(40, 40, 60, 0.95));
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 20px;
          width: 100%;
          max-width: 500px;
          max-height: 80vh;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(20px);
        }

        .popup-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .popup-header h3 {
          margin: 0;
          color: white;
          font-weight: 600;
        }

        .popup-close-btn {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .popup-close-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: scale(1.1);
        }

        .popup-body {
          padding: 20px;
          max-height: 60vh;
          overflow-y: auto;
        }

        .empty-list-message {
          text-align: center;
          color: rgba(255, 255, 255, 0.7);
          padding: 40px 20px;
        }

        .users-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .user-list-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.2s ease;
        }

        .user-list-item:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: translateX(4px);
        }

        .user-avatar-small {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--roxo, #6a5ae0), #8c7ff2);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 18px;
          overflow: hidden;
        }

        .user-avatar-small img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .user-info-small {
          flex: 1;
        }

        .user-name {
          color: white;
          font-weight: 600;
          margin-bottom: 2px;
        }

        .user-username {
          color: rgba(255, 255, 255, 0.7);
          font-size: 12px;
        }

        .view-profile-btn {
          background: rgba(106, 90, 224, 0.3);
          border: 1px solid rgba(106, 90, 224, 0.5);
          color: white;
          border-radius: 20px;
          padding: 6px 12px;
          font-size: 12px;
          transition: all 0.2s ease;
        }

        .view-profile-btn:hover {
          background: rgba(106, 90, 224, 0.5);
          transform: translateY(-1px);
        }

        /* Scrollbar customizada */
        .popup-body::-webkit-scrollbar {
          width: 6px;
        }

        .popup-body::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }

        .popup-body::-webkit-scrollbar-thumb {
          background: rgba(106, 90, 224, 0.5);
          border-radius: 3px;
        }

        .popup-body::-webkit-scrollbar-thumb:hover {
          background: rgba(106, 90, 224, 0.7);
        }
        
      `}</style>
    </>
  );
};

export default UserProfile;
