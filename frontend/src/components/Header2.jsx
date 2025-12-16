// src/components/HeaderForYou.jsx

/**
 * @fileoverview Cabeçalho responsivo (HeaderForYou) com navegação e ações do usuário.
 * @module HeaderForYou
 * @description
 * Exibe links principais, menu hambúrguer (mobile), acesso ao perfil e ação de logout.
 * Integra com Redux para obter usuário atual e sincronizar `fotoPerfil`.
 */

import React, { useState, useEffect } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import logo from "../images/ArtBeat_Branco.png";
import { useSelector, useDispatch } from "react-redux";
import { logout, fetchUsuarios } from "../redux/usuariosSlice";

/**
 * Cabeçalho responsivo usado nas páginas autenticadas (versão "ForYou").
 *
 * @component
 * @returns {JSX.Element} Elemento React do cabeçalho.
 */
const HeaderForYou = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  const [currentFoto, setCurrentFoto] = useState(null);

  // currentUserState = { user, token }
  const currentUserState = useSelector((s) => s.user?.currentUser);
  const user = currentUserState?.user ?? null;
  const usuarios = useSelector((s) => s.user?.usuarios || []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => (document.body.style.overflow = "");
  }, [open]);

  // ✅ Carregar lista de usuários
  useEffect(() => {
    if (user && usuarios.length === 0) {
      dispatch(fetchUsuarios());
    }
  }, [user, usuarios.length, dispatch]);

  // ✅ Sincronizar foto
  useEffect(() => {
    if (!user) {
      setCurrentFoto(null);
      return;
    }

    if (user.fotoPerfil) {
      setCurrentFoto(user.fotoPerfil);
    }

    if (usuarios.length > 0) {
      const userId = String(user._id || user.id);
      const usuarioAtualizado = usuarios.find(u => String(u._id || u.id) === userId);
      
      if (usuarioAtualizado?.fotoPerfil) {
        setCurrentFoto(usuarioAtualizado.fotoPerfil);
      }
    }
  }, [user, usuarios]);

  // ✅ Polling para pegar foto nova
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      dispatch(fetchUsuarios());
    }, 30000);
    return () => clearInterval(interval);
  }, [user, dispatch]);

  /**
   * Alterna o menu mobile.
   * @function toggle
   * @returns {void}
   */
  const toggle = () => setOpen((v) => !v);

  /**
   * Fecha o menu mobile.
   * @function close
   * @returns {void}
   */
  const close = () => setOpen(false);

  /**
   * Verifica se um link deve ser marcado como ativo (classe `hf-active`).
   *
   * @param {string} path - Caminho/slug da rota a comparar (ex: `feed`, `populares`).
   * @returns {boolean} `true` quando a rota atual corresponde ao caminho informado.
   */
  const isActive = (path) => {
    const cur = location.pathname.replace(/^\//, "");
    const p = path.replace(/^\//, "");
    return (cur === "" && path === "feed") || cur === p;
  };

  /**
   * Realiza logout do usuário, limpando estado Redux e dados persistidos no `localStorage`.
   * Em seguida, redireciona para a rota de login.
   *
   * @function handleLogout
   * @returns {void}
   */
  const handleLogout = () => {
    dispatch(logout());
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("userData");
    } catch (e) {}
    navigate("/login", { replace: true });
  };

  return (
    <div className="hf-top">
      <header className="hf-header">
        <nav className="hf-nav" aria-label="Navegação principal">
          <div className="hf-left">
            <Link to="/feed" className="hf-brand" onClick={close}>
              <img src={logo} alt="ArtBeat" className="hf-logo" />
              <span className="hf-brandText">ArtBeat</span>
            </Link>
          </div>

          <button
            className={`hf-hamb ${open ? "hf-open" : ""}`}
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            aria-expanded={open}
            onClick={toggle}
          >
            <span />
            <span />
            <span />
          </button>

          <div
            className={`hf-overlay ${open ? "hf-show" : ""}`}
            onClick={close}
            aria-hidden={!open}
          />

          <ul className={`hf-menu ${open ? "hf-openMenu" : ""}`} role="menubar">
            <li><Link to="/feed" className={`hf-link ${isActive("feed") ? "hf-active" : ""}`} onClick={close}> <i className="fa-solid fa-house" /> <span>Feed</span></Link></li>
            <li><Link to="/populares" className={`hf-link ${isActive("populares") ? "hf-active" : ""}`} onClick={close}> <i className="fa-solid fa-fire" /> <span>Populares</span></Link></li>
            <li><Link to="/discover" className={`hf-link ${isActive("discover") ? "hf-active" : ""}`} onClick={close}> <i className="fa-solid fa-shuffle" /> <span>Aleatórios</span></Link></li>
            <li><Link to="/desafios" className={`hf-link ${isActive("desafios") ? "hf-active" : ""}`} onClick={close}> <i className="fa-solid fa-trophy" /> <span>Desafios</span></Link></li>
          </ul>

          <div className="hf-right">
            <Link
              to={user ? `/user/${user.username}` : "/login"}
              className="hf-profile"
              onClick={close}
              title="Meu perfil"
            >
              {currentFoto ? (
                <img 
                  src={currentFoto} 
                  alt={`${user?.username} foto`} 
                  className="hf-avatar"
                />
              ) : (
                <i className="fa-solid fa-circle-user hf-avatarIcon" aria-hidden="true" />
              )}
              <span className="hf-username">{user?.username ?? "Perfil"}</span>
            </Link>

            <button className="hf-logout" onClick={handleLogout} aria-label="Sair">
              <i className="fa-solid fa-right-from-bracket" />
              <span className="hf-logoutText">Sair</span>
            </button>
          </div>
        </nav>
      </header>

      <style>{`
        :root{
          --accent1:#6a5ae0;
          --accent2:#8c7ff2;
          --text:#ffffff;
          --muted: rgba(255,255,255,0.78);
        }

        .hf-top{ width:100%; background:transparent; }
        .hf-header{ display:flex; justify-content:center; border-bottom: 1px solid rgba(255,255,255,0.03); }
        .hf-nav{ width:100%; max-width:1200px; display:flex; align-items:center; gap:16px; padding:10px 16px; box-sizing:border-box; }

        .hf-left{ display:flex; align-items:center; }
        .hf-brand{ display:flex; align-items:center; gap:10px; text-decoration:none; }
        .hf-logo{ height:36px; width:auto; display:block; }
        .hf-brandText{ color:white; font-weight:800; letter-spacing:0.4px; font-size:1.05rem; }

        .hf-menu{ display:flex; gap:12px; list-style:none; margin:0; padding:0; align-items:center; flex:1; }
        .hf-menu li{ display:flex; }
        .hf-link{ display:inline-flex; align-items:center; gap:8px; padding:8px 10px; color:var(--muted); text-decoration:none; border-radius:8px; font-weight:600; transition: background .12s ease, color .12s; }
        .hf-link:hover, .hf-link:focus{ background: rgba(255, 255, 255, 0.03); color:white; outline:none; }
        .hf-active{ color:white; background: linear-gradient(90deg, rgba(106,90,224,0.12), rgba(140,127,242,0.08)); box-shadow: 0 6px 18px rgba(106,90,224,0.06); }

        .hf-right{ display:flex; align-items:center; gap:10px; }
        .hf-profile{ display:inline-flex; align-items:center; gap:8px; text-decoration:none; color:white; padding:6px 8px; border-radius:8px; transition: background .12s ease; }
        .hf-profile:hover{ background: rgba(255,255,255,0.03); }
        
        .hf-avatar{ 
          width:36px; 
          height:36px; 
          border-radius:50%; 
          object-fit:cover; 
          border: 2px solid rgba(255,255,255,0.2);
        }
        .hf-avatarIcon{ 
          font-size:36px; 
          color:var(--text);
        }
        
        .hf-username{ font-weight:700; font-size:0.95rem; }

        .hf-logout{ display:inline-flex; align-items:center; gap:8px; background: linear-gradient(135deg,var(--accent1),var(--accent2)); color:#fff; border:none; padding:8px 10px; border-radius:10px; cursor:pointer; font-weight:700; transition: transform .12s ease, filter .15s ease; }
        .hf-logout:hover{ transform: translateY(-1px); filter: brightness(1.05); }
        .hf-logoutText{ display:inline-block; }

        .hf-hamb{ display:none; background:transparent; border:none; width:44px; height:40px; padding:6px; cursor:pointer; align-items:center; justify-content:center; }
        .hf-hamb span{ display:block; height:2px; background:var(--text); margin:5px 0; border-radius:2px; transition: transform .2s ease, opacity .18s ease; }
        .hf-hamb.hf-open span:nth-child(1){ transform: translateY(7px) rotate(45deg); }
        .hf-hamb.hf-open span:nth-child(2){ opacity:0; transform: scaleX(0); }
        .hf-hamb.hf-open span:nth-child(3){ transform: translateY(-7px) rotate(-45deg); }

        .hf-overlay{ display:none; }
        .hf-overlay.hf-show{ display:block; position:fixed; inset:0; background: rgba(0,0,0,0.45); z-index:999; }

        @media (max-width: 820px){
          .hf-hamb{ display:flex; }
          .hf-menu{ position: fixed; top:0; right:0; height:100vh; width: min(92%, 320px); background: linear-gradient(180deg, rgba(8,8,12,0.96), rgba(14,14,20,0.98)); flex-direction:column; padding:72px 16px 20px; gap:12px; transform: translateX(110%); transition: transform .28s ease; z-index:1000; align-items:stretch; }
          .hf-menu.hf-openMenu{ transform: translateX(0); }
          .hf-menu li{ width:100%; }
          .hf-link{ width:100%; padding:12px 14px; font-size:1rem; border-radius:10px; }
          .hf-right .hf-username{ display:none; }
          .hf-logoutText{ display:none; }
        }

        .hf-link i{ width:18px; text-align:center; }
        .hf-link span{ line-height:1; }

        .hf-link:focus-visible, .hf-hamb:focus-visible, .hf-logout:focus-visible, .hf-profile:focus-visible{ outline: 3px solid rgba(138,120,242,0.14); outline-offset:2px; }

      `}</style>
    </div>
  );
};

export default HeaderForYou;