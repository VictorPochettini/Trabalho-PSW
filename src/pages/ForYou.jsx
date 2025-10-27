// src/pages/ForYou.jsx (versão otimizada)
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import axios from 'axios';

import HeaderForYou from "../components/Header2";
import MonetizationPopup from "../components/MonetizationPopup";

import { fetchPosts } from "../redux/postsSlice";
import {
  followUser,
  unfollowUser,
  fetchFollowCounts,
} from "../redux/followsSlice";

const ForYou = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redux state
  const posts = useSelector((s) => s.posts.lista || []);
  const loadingPosts = useSelector((s) => s.posts.loading);
  const currentUser = useSelector((s) => s.user.currentUser);
  const followsByPair = useSelector((s) => s.follows?.byPair || {});
  const followsCounts = useSelector((s) => s.follows?.counts || {});

  // Local state (como no Feed)
  const [usuarios, setUsuarios] = useState([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(true);
  const [artistsData, setArtistsData] = useState([]);

  // UI state
  const [showMonetization, setShowMonetization] = useState(false);
  const [monetizationUsername, setMonetizationUsername] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [sortBy, setSortBy] = useState("rating");
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Busca otimizada de usuários (como no Feed)
  useEffect(() => {
    dispatch(fetchPosts());
    
    axios.get('http://localhost:5000/usuarios')
      .then(res => setUsuarios(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoadingUsuarios(false));
  }, [dispatch]);

  // Combinação de dados (inspirado no Feed)
  useEffect(() => {
    if (!loadingUsuarios && usuarios.length > 0 && !loadingPosts) {
      const artists = usuarios.map(usuario => {
        const userPosts = posts.filter(p => Number(p.usuarioId) === Number(usuario.id));
        const rating = ratingUserAvg(usuario.id);
        const catKey = inferCategoria(usuario.id);
        
        return {
          id: usuario.id,
          name: usuario.nome || usuario.username,
          username: usuario.username,
          category: catKey === "musica" ? "Música" : 
                   catKey === "letra" ? "Letra" : 
                   catKey === "arte" ? "Arte" : "Outros",
          categoryKey: catKey,
          followers: followerCountFromRedux(usuario.id),
          works: userPosts.length,
          rating: rating,
          userData: usuario // Mantém dados completos do usuário
        };
      });
      
      setArtistsData(artists);
    }
  }, [loadingUsuarios, usuarios, posts, loadingPosts, followsCounts]);

  // Helpers (mantidos do original)
  const inferCategoria = (userId) => {
    const myPosts = posts.filter((p) => Number(p.usuarioId) === Number(userId));
    if (myPosts.length === 0) return "outros";

    const counts = { musica: 0, letra: 0, texto: 0, visual: 0 };
    myPosts.forEach((p) => {
      const t = String(p.tipo || "").toLowerCase();
      if (t in counts) counts[t] += 1;
    });

    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return entries[0]?.[0] || "outros";
  };

  const ratingUserAvg = (userId) => {
    const myPosts = posts.filter((p) => Number(p.usuarioId) === Number(userId));
    const ratings = myPosts
      .map((p) => Number(p.ratingAvg || 0))
      .filter((v) => !Number.isNaN(v));
    if (!ratings.length) return 0;
    const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    return Math.round(avg * 10) / 10;
  };

  const followerCountFromRedux = (userId) =>
    Number(followsCounts[Number(userId)]?.followersCount || 0);

  // Lógica de filtros e busca (mantida)
  const highRatedArtists = useMemo(() => {
    return artistsData.filter(artist => artist.rating > 4);
  }, [artistsData]);

  const handleSearch = (term) => {
    setSearchTerm(term);
    setIsSearching(!!term.trim());
  };

  const filteredAndSorted = useMemo(() => {
    let list = isSearching ? artistsData : highRatedArtists;
    
    if (activeFilter !== "all") {
      list = list.filter((a) => a.categoryKey === activeFilter);
    }
    
    if (isSearching && activeFilter === "all") {
      const term = searchTerm.toLowerCase();
      list = list.filter((a) =>
        a.name.toLowerCase().includes(term) ||
        a.username.toLowerCase().includes(term)
      );
    }

    const sorted = [...list];
    if (sortBy === "rating") {
      sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === "followers") {
      sorted.sort((a, b) => (b.followers || 0) - (a.followers || 0));
    } else if (sortBy === "newest") {
      sorted.sort((a, b) => Number(b.id) - Number(a.id));
    }
    return sorted;
  }, [artistsData, highRatedArtists, activeFilter, sortBy, searchTerm, isSearching]);

  // Navegação para perfil (como no Feed)
  const handleProfileClick = (username, e) => {
    if (e) e.stopPropagation();
    navigate(`/user/${username}`);
  };

  // Sistema de follow (mantido)
  const isFollowingUser = (targetId) => {
    if (!currentUser?.id || !targetId) return false;
    const k = `${Number(currentUser.id)}-${Number(targetId)}`;
    return Boolean(followsByPair[k]?.isFollowing);
  };

  const handleFollowClick = async (targetId, e) => {
    e.stopPropagation();
    if (!currentUser?.id || !targetId || Number(currentUser.id) === Number(targetId)) return;
    try {
      const following = isFollowingUser(targetId);
      if (following) {
        await dispatch(unfollowUser({ followerId: currentUser.id, followingId: targetId })).unwrap();
      } else {
        await dispatch(followUser({ followerId: currentUser.id, followingId: targetId })).unwrap();
      }
      dispatch(fetchFollowCounts({ userId: targetId }));
    } catch (e) {
      console.error("follow/unfollow error", e);
    }
  };

  // Monetização 
  const handleMonetizeClick = (uname, e) => {
    e.stopPropagation();
    setMonetizationUsername(uname);
    setShowMonetization(true);
    document.body.style.overflow = "hidden";
  };

  const handleCloseMonetization = () => {
    setShowMonetization(false);
    document.body.style.overflow = "";
  };

  const renderStars = (rating) => {
    const r = Math.max(0, Math.min(5, Number(rating) || 0));
    const full = "★".repeat(Math.floor(r));
    const empty = "☆".repeat(5 - Math.floor(r));
    return `${full}${empty}`;
  };

  const loading = loadingUsuarios || loadingPosts;

  return (
    <>
      <HeaderForYou />

      <div className="fy-container">
        <h1 className="fy-title">Artistas em Destaque</h1>
        <p className="fy-subtitle">
          {isSearching 
            ? `Resultados da pesquisa por "${searchTerm}"` 
            : "Descubra os artistas mais populares e bem avaliados da plataforma (rating acima de 4.0)"}
        </p>

        {/* Barra de Pesquisa - Estilo Original */}
        <div className="fy-search-container">
          <div className="fy-search-box">
            <i className="fas fa-search fy-search-icon"></i>
            <input
              type="text"
              className="fy-search-input"
              placeholder="Pesquisar artistas por nome ou usuário..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
            />
            {searchTerm && (
              <button
                className="fy-search-clear"
                onClick={() => handleSearch("")}
              >
                <i className="fas fa-times"></i>
              </button>
            )}
          </div>
          
          {isSearching && (
            <div className="fy-search-results-info">
              <span>
                {filteredAndSorted.length} resultado(s) encontrado(s) para "{searchTerm}"
              </span>
              <button
                className="fy-search-clear-btn"
                onClick={() => handleSearch("")}
              >
                Limpar pesquisa
              </button>
            </div>
          )}
        </div>

        <div className="fy-filters">
          <div className="fy-filter-buttons">
            <button
              className={`fy-filter-btn ${activeFilter === "all" ? "active" : ""}`}
              onClick={() => setActiveFilter("all")}
            >
              Todos
            </button>
            <button
              className={`fy-filter-btn ${activeFilter === "musica" ? "active" : ""}`}
              onClick={() => {
                setActiveFilter("musica");
                if (isSearching) handleSearch("");
              }}
            >
              Música
            </button>
            <button
              className={`fy-filter-btn ${activeFilter === "letra" ? "active" : ""}`}
              onClick={() => {
                setActiveFilter("letra");
                if (isSearching) handleSearch("");
              }}
            >
              Letra
            </button>
            <button
              className={`fy-filter-btn ${activeFilter === "arte" ? "active" : ""}`}
              onClick={() => {
                setActiveFilter("arte");
                if (isSearching) handleSearch("");
              }}
            >
              Arte
            </button>
          </div>

          <div className="fy-sort">
            <label htmlFor="sort-by">Ordenar por:</label>
            <select
              id="sort-by"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="rating">Maior Avaliação</option>
              <option value="followers">Mais Seguidos</option>
              <option value="newest">Mais Recentes</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="fy-loading">Carregando…</div>
        ) : (
          <>
            {filteredAndSorted.length === 0 ? (
              <div className="fy-no-results">
                <i className="fas fa-search fa-3x mb-3"></i>
                <h4>
                  {isSearching 
                    ? `Nenhum artista encontrado para "${searchTerm}"`
                    : "Nenhum artista com rating acima de 4.0"
                  }
                </h4>
                <p>
                  {isSearching
                    ? "Tente outros termos de pesquisa."
                    : "No momento não há artistas que atendam aos critérios de qualidade."
                  }
                </p>
              </div>
            ) : (
              <div className="fy-grid">
                {filteredAndSorted.map((artist) => {
                  const following = isFollowingUser(artist.id);
                  const isLowRated = artist.rating <= 4;
                  
                  return (
                    <div 
                      key={artist.id} 
                      className="fy-card"
                    >
                      <div className="fy-card-header">
                        <div 
                          className="fy-avatar clickable"
                          onClick={(e) => handleProfileClick(artist.username, e)}
                          title={`Ver perfil de ${artist.name}`}
                        >
                          <i className="fas fa-user" />
                        </div>
                      </div>

                      <div className="fy-card-info">
                        <h3 
                          className="fy-name clickable"
                          onClick={(e) => handleProfileClick(artist.username, e)}
                          title={`Ver perfil de ${artist.name}`}
                          style={{ cursor: 'pointer' }}
                        >
                          {artist.name}
                        </h3>
                        
                        <span className="fy-category">{artist.category}</span>

                        <div className="fy-stats">
                          <div className="fy-stat">
                            <div className="fy-stat-value">
                              {Number(artist.followers || 0).toLocaleString("pt-BR")}
                            </div>
                            <div className="fy-stat-label">Seguidores</div>
                          </div>
                          <div className="fy-stat">
                            <div className="fy-stat-value">{artist.works}</div>
                            <div className="fy-stat-label">Obras</div>
                          </div>
                        </div>

                        <div className="fy-rating">
                          <div className="fy-stars">{renderStars(artist.rating)}</div>
                          <span className="fy-rating-value">
                            {Number(artist.rating || 0).toFixed(1)}
                          </span>
                        </div>

                        <div className="fy-actions">
                          <button
                            className={`fy-btn-follow ${following ? "is-following" : ""}`}
                            onClick={(e) => handleFollowClick(artist.id, e)}
                            disabled={!currentUser || Number(currentUser?.id) === Number(artist.id)}
                            title={
                              !currentUser
                                ? "Faça login para seguir"
                                : Number(currentUser?.id) === Number(artist.id)
                                ? "Você não pode seguir a si mesmo"
                                : following
                                ? "Deixar de seguir"
                                : "Seguir"
                            }
                          >
                            {following ? "Seguindo" : "Seguir"}
                          </button>

                          <button
                            className="fy-btn-monetize"
                            onClick={(e) => handleMonetizeClick(artist.username, e)}
                            title="Apoiar"
                          >
                            <i className="fa-solid fa-hand-holding-usd"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      <MonetizationPopup
        show={showMonetization}
        onClose={handleCloseMonetization}
        username={monetizationUsername}
      />

      {/* --- ESTILOS INLINE CORRIGIDOS --- */}
      <style jsx>{`
        :root {
          --accent: #5e17eb;
          --accent-2: #7b3ff2;
          --accent-3: #3726a5;
          --surface-glass: rgba(18, 20, 38, 0.50);
          --surface-border: rgba(255, 255, 255, 0.18);
          --surface-hover-border: rgba(255, 255, 255, 0.26);
          --text-strong: #f7f8ff;
          --text-soft: rgba(255,255,255,.9);
          --muted: rgba(255,255,255,.75);
          --shadow-1: 0 12px 26px rgba(0,0,0,.28);
          --shadow-2: 0 16px 36px rgba(0,0,0,.34);
          --ok: #34c759;
          --ok-2: #2fb151;
          --gold: #f5c542;
          --gold-2: #e7b418;
        }

        .fy-container {
          max-width: 1100px;
          margin: 0 auto;
          padding: 48px 20px 60px;
        }

        .fy-title {
          margin: 0 0 6px;
          font-weight: 800;
          letter-spacing: .2px;
          font-size: clamp(26px, 2.4vw, 34px);
          background: linear-gradient(90deg, #ffffff, #d6d9ff 40%, #bfc6ff 70%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-shadow: 0 2px 18px rgba(0,0,0,.35);
        }

        .fy-subtitle {
          margin: 0 0 22px;
          color: var(--text-soft);
          text-shadow: 0 1px 10px rgba(0,0,0,.28);
        }

        /* Barra de Pesquisa - Estilo Original */
        .fy-search-container {
          max-width: 600px;
          margin: 0 auto 30px;
        }

        .fy-search-box {
          position: relative;
          display: flex;
          align-items: center;
          background: var(--surface-glass);
          border: 1px solid var(--surface-border);
          border-radius: 16px;
          padding: 12px 20px;
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;
          box-shadow: var(--shadow-1);
        }

        .fy-search-box:focus-within {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(94, 23, 235, 0.1), var(--shadow-2);
        }

        .fy-search-icon {
          color: var(--muted);
          margin-right: 12px;
          font-size: 1.1rem;
        }

        .fy-search-input {
          flex: 1;
          border: none;
          background: transparent;
          color: var(--text-strong);
          font-size: 1rem;
          outline: none;
        }

        .fy-search-input::placeholder {
          color: var(--muted);
        }

        .fy-search-clear {
          background: none;
          border: none;
          color: var(--muted);
          cursor: pointer;
          padding: 4px;
          border-radius: 50%;
          transition: all 0.2s ease;
        }

        .fy-search-clear:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--text-strong);
        }

        .fy-search-results-info {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 10px;
          color: var(--text-soft);
        }

        .fy-search-clear-btn {
          background: var(--surface-glass);
          border: 1px solid var(--surface-border);
          color: var(--text-strong);
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .fy-search-clear-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: var(--surface-hover-border);
        }

        .fy-filters {
          display: grid;
          grid-template-columns: 1fr auto;
          align-items: center;
          gap: 14px;
          margin-bottom: 22px;
        }

        .fy-filter-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .fy-filter-btn {
          border: 1px solid var(--surface-border);
          color: #fff;
          background: linear-gradient(180deg, rgba(255,255,255,.16), rgba(255,255,255,.10));
          padding: 10px 18px;
          border-radius: 999px;
          font-weight: 700;
          letter-spacing: .2px;
          backdrop-filter: blur(8px);
          transition: transform .15s ease, border-color .2s ease, box-shadow .25s ease, background .25s ease;
        }

        .fy-filter-btn:hover {
          transform: translateY(-1px);
          border-color: var(--surface-hover-border);
          background: linear-gradient(180deg, rgba(255,255,255,.2), rgba(255,255,255,.12));
          box-shadow: 0 10px 24px rgba(0,0,0,.22);
        }

        .fy-filter-btn.active {
          background: linear-gradient(135deg, var(--accent), var(--accent-2));
          border-color: rgba(255,255,255,.26);
          box-shadow: 0 12px 26px rgba(94,23,235,.36);
        }

        .fy-sort {
          display: flex;
          align-items: center;
          gap: 10px;
          color: var(--text-soft);
          font-weight: 700;
        }

        .fy-sort select {
          background: var(--surface-glass);
          color: #fff;
          border: 1px solid var(--surface-border);
          border-radius: 12px;
          padding: 8px 12px;
          outline: none;
          box-shadow: var(--shadow-1);
        }

        .fy-loading {
          color: var(--text-soft);
        }

        .fy-no-results {
          background: var(--surface-glass);
          border: 1px solid var(--surface-border);
          border-radius: 16px;
          padding: 40px 20px;
          backdrop-filter: blur(10px);
          text-align: center;
          color: var(--text-soft);
        }

        .fy-no-results i {
          color: var(--muted);
        }

        .fy-no-results h4 {
          color: var(--text-strong);
          margin-bottom: 10px;
        }

        .fy-grid {
          display: grid;
          grid-template-columns: repeat( auto-fit, minmax(260px, 1fr) );
          gap: 18px;
        }

        .fy-card {
          background: var(--surface-glass);
          color: var(--text-strong);
          border: 1px solid var(--surface-border);
          border-radius: 18px;
          box-shadow: var(--shadow-1);
          backdrop-filter: blur(10px) saturate(1.08);
          padding: 18px 16px;
          transition: transform .18s ease, box-shadow .25s ease, border-color .22s ease;
        }

        .fy-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-2);
          border-color: var(--surface-hover-border);
        }

        .fy-card-header {
          display: grid;
          place-items: center;
          margin-bottom: 10px;
        }

        .fy-avatar {
          width: 84px;
          height: 84px;
          display: grid;
          place-items: center;
          color: #fff;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--accent), var(--accent-2));
          box-shadow: 0 10px 24px rgba(94,23,235,.35);
          font-size: 34px;
          border: 3px solid rgba(255,255,255,.75);
          text-shadow: 0 2px 10px rgba(0,0,0,.25);
          cursor: pointer;
          transition: transform 0.2s ease;
        }

        .fy-avatar:hover {
          transform: scale(1.05);
        }

        .fy-card-info {
          text-align: center;
        }

        .fy-name {
          font-weight: 800;
          font-size: 1.1rem;
          margin-bottom: 2px;
          color: #fff;
          text-shadow: 0 1px 10px rgba(0,0,0,.25);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: color 0.2s ease;
        }

        .fy-name:hover {
          color: var(--accent-2);
        }

        .rating-badge {
          font-size: 0.7rem;
          background: rgba(245, 197, 66, 0.2);
          color: var(--gold);
          padding: 2px 6px;
          border-radius: 8px;
          font-weight: 600;
        }

        .fy-category {
          display: inline-block;
          font-size: .9rem;
          color: var(--muted);
          margin-bottom: 10px;
        }

        .fy-stats {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
          margin: 10px 0 12px;
        }

        .fy-stat {
          background: rgba(255,255,255,.08);
          border: 1px solid var(--surface-border);
          border-radius: 14px;
          padding: 10px 8px;
          backdrop-filter: blur(6px);
        }

        .fy-stat-value {
          font-weight: 800;
          font-size: 1.05rem;
          color: #fff;
        }

        .fy-stat-label {
          font-size: .8rem;
          color: var(--muted);
        }

        .fy-rating {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255,255,255,.08);
          border: 1px solid var(--surface-border);
          border-radius: 999px;
          padding: 8px 12px;
          margin-bottom: 12px;
        }

        .fy-stars {
          font-size: 1rem;
          letter-spacing: 1px;
          color: #fff;
          text-shadow: 0 1px 10px rgba(0,0,0,.25);
        }

        .fy-rating-value {
          font-weight: 700;
          color: var(--gold);
          text-shadow: 0 1px 10px rgba(0,0,0,.25);
        }

        .fy-actions {
          display: grid;
          grid-template-columns: 1fr 44px;
          gap: 10px;
          align-items: center;
        }

        .fy-btn-follow {
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,.18);
          color: #fff;
          font-weight: 800;
          letter-spacing: .2px;
          padding: 10px 12px;
          background: linear-gradient(135deg, var(--accent), var(--accent-2));
          box-shadow: 0 12px 26px rgba(94,23,235,.3);
          transition: transform .12s ease, filter .2s ease, box-shadow .25s ease, border-color .2s ease;
          cursor: pointer;
        }

        .fy-btn-follow:hover {
          transform: translateY(-1px);
          filter: brightness(1.05);
          border-color: rgba(255,255,255,.26);
          box-shadow: 0 16px 32px rgba(94,23,235,.38);
        }

        .fy-btn-follow.is-following {
          background: linear-gradient(135deg, var(--ok), var(--ok-2));
          box-shadow: 0 12px 26px rgba(52,199,89,.28);
        }

        .fy-btn-monetize {
          width: 44px;
          height: 44px;
          display: grid;
          place-items: center;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,.22);
          background: linear-gradient(135deg, var(--gold), var(--gold-2));
          color: #1a1a1a;
          font-size: 18px;
          box-shadow: 0 10px 22px rgba(0,0,0,.24);
          transition: transform .12s ease, filter .2s ease, box-shadow .25s ease, border-color .2s ease;
          cursor: pointer;
        }

        .fy-btn-monetize:hover {
          transform: translateY(-1px);
          filter: brightness(1.05);
          border-color: rgba(255,255,255,.28);
          box-shadow: 0 14px 32px rgba(0,0,0,.28);
        }

        @media (max-width: 640px) {
          .fy-filters {
            grid-template-columns: 1fr;
            gap: 12px;
          }
          
          .fy-search-container {
            margin: 0 auto 20px;
          }
          
          .fy-search-results-info {
            flex-direction: column;
            text-align: center;
          }
        }
      `}</style>
    </>
  );
};

export default ForYou;