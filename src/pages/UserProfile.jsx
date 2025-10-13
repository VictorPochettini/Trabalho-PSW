// src/pages/UserProfile.jsx
import React, { useState, useRef, useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { fetchUsuarios } from "../redux/usuariosSlice";
import FloatingActionButton from "../components/FloatingActionButton";
import "../css/UserProfile.css";

const UserProfile = () => {
  const { username } = useParams(); // pega o username da URL
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // ✅ Ajuste: usa 'usuarios' em vez de 'users'
  const usuarios = useSelector((state) => state.user.usuarios || []);
  const posts = useSelector((state) => state.posts.lista || []);
  const currentUser = useSelector((state) => state.user.currentUser);

  // 🔹 busca usuários caso o estado esteja vazio
  useEffect(() => {
    if (!usuarios.length) {
      dispatch(fetchUsuarios());
    }
  }, [dispatch, usuarios.length]);

  // 🔹 memoriza user e userPosts para evitar rerenders
  const user = useMemo(
    () => usuarios.find((u) => u.username === username),
    [usuarios, username]
  );

  const userPosts = useMemo(
    () => posts.filter((p) => p.usuarioId === user?.id),
    [posts, user?.id]
  );

  // 🔹 define o estado inicial
  const [userData, setUserData] = useState({
    name: user?.nome || "",
    username: user ? "@" + user.username : "",
    followers: user?.followers || 0,
    following: user?.following || 0,
    profilePhoto: user?.fotoPerfil || null,
    posts: userPosts,
  });

  // 🔹 atualiza posts quando mudar
  useEffect(() => {
    if (user) {
      setUserData((prev) => ({
        ...prev,
        name: user.nome,
        username: "@" + user.username,
        posts: userPosts,
      }));
    }
  }, [user, userPosts]);

  const fileInputRef = useRef(null);

  const handlePhotoChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUserData((prev) => ({
          ...prev,
          profilePhoto: e.target.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleEditProfile = () => {
    navigate("/edit-profile");
  };

  // 🔹 se usuário não existir
  if (!user) {
    return (
      <div className="container-fluid text-center py-5">
        <h2>Usuário "{username}" não encontrado 😢</h2>
        <button className="btn btn-primary mt-3" onClick={() => navigate(-1)}>
          Voltar
        </button>
      </div>
    );
  }

  // 🔹 renderiza posts
  const renderPosts = () => {
    if (!userPosts.length) {
      return (
        <div className="card text-center text-muted py-5">
          <i className="fas fa-images display-4 mb-3"></i>
          <p className="mb-0">Nenhuma publicação ainda.</p>
        </div>
      );
    }

    return userPosts.map((post) => (
      <div className="card mb-3" key={post.id}>
        <div className="card-body">
          {post.titulo && <h5 className="post-title">{post.titulo}</h5>}
          {post.tipo === "texto" && (
            <p className="post-content">{post.conteudo}</p>
          )}
          {post.tipo === "visual" && (
            <img
              src={`/media/${post.conteudo}`}
              className="post-image img-fluid rounded mb-2"
              alt="Post visual"
            />
          )}
          {post.tipo === "musica" && (
            <audio controls className="post-audio w-100 mb-2">
              <source src={`/media/${post.conteudo}`} type="audio/mpeg" />
            </audio>
          )}
          <div className="post-date">
            Publicado em: {new Date(post.data).toLocaleString("pt-BR")}
          </div>
        </div>
      </div>
    ));
  };

  return (
    <>
      <div className="container-fluid">
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-6">
            <div className="profile-container">
              <div className="profile-header position-relative">
                {/* Mostra lápis apenas se for o próprio usuário */}
                {user.username === currentUser?.username && (
                  <button className="lapis" onClick={handleEditProfile}>
                    <i
                      className="fa-solid fa-pencil fa-lg"
                      style={{ color: "#ffffff" }}
                    ></i>
                  </button>
                )}

                <div
                  className="profile-picture-container"
                  onClick={triggerFileInput}
                  style={{ cursor: "pointer" }}
                >
                  {userData.profilePhoto ? (
                    <img
                      src={userData.profilePhoto}
                      alt="Foto de perfil"
                      className="profile-picture rounded-circle"
                    />
                  ) : (
                    <i className="fas fa-user-circle profile-icon"></i>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="file-input"
                    accept="image/*"
                    onChange={handlePhotoChange}
                  />
                </div>

                <h1 className="profile-name">{userData.name}</h1>
                <div className="profile-username">{userData.username}</div>

                <div className="profile-stats">
                  <div className="stat">
                    <div className="stat-number">{userData.followers}</div>
                    <div className="stat-label">Seguidores</div>
                  </div>
                  <div className="stat">
                    <div className="stat-number">{userData.following}</div>
                    <div className="stat-label">Seguindo</div>
                  </div>
                </div>
              </div>

              <div className="posts-container">{renderPosts()}</div>
            </div>
          </div>
        </div>
      </div>

      <FloatingActionButton />
    </>
  );
};

export default UserProfile;
