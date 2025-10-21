// src/pages/ForYou.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import HeaderForYou from "../components/Header2";
import MonetizationPopup from "../components/MonetizationPopup";

import { fetchUsuarios } from "../redux/usuariosSlice";
import { fetchPosts } from "../redux/postsSlice";
import {
  followUser,
  unfollowUser,
  fetchFollowCounts,
} from "../redux/followsSlice";

const ForYou = () => {
  const dispatch = useDispatch();

  // Redux state
  const usuarios = useSelector((s) => s.user.usuarios || []);
  const posts = useSelector((s) => s.posts.lista || []);
  const loadingUsuarios = useSelector((s) => s.user.loading);
  const loadingPosts = useSelector((s) => s.posts.loading);
  const currentUser = useSelector((s) => s.user.currentUser);
  const followsByPair = useSelector((s) => s.follows?.byPair || {});
  const followsCounts = useSelector((s) => s.follows?.counts || {}); // <- contagens por usuário

  // UI state
  const [showMonetization, setShowMonetization] = useState(false);
  const [monetizationUsername, setMonetizationUsername] = useState("");
  const [activeFilter, setActiveFilter] = useState("all"); // all | musica | letra | arte
  const [sortBy, setSortBy] = useState("rating"); // rating | followers | newest

  // Carrega dados básicos
  useEffect(() => {
    if (!usuarios.length) dispatch(fetchUsuarios());
  }, [dispatch, usuarios.length]);

  useEffect(() => {
    if (!posts.length) dispatch(fetchPosts());
  }, [dispatch, posts.length]);

  // Quando tudo estiver pronto, disparamos contagens de seguidores/seguindo por usuário (apenas 1x por id)
  const ready = !loadingUsuarios && !loadingPosts && usuarios.length > 0;
  const countedIdsRef = useRef(new Set());
  useEffect(() => {
    if (!ready) return;
    usuarios.forEach((u) => {
      const uid = Number(u.id);
      if (!uid) return;
      if (countedIdsRef.current.has(uid)) return; // evita duplicata
      countedIdsRef.current.add(uid);
      dispatch(fetchFollowCounts({ userId: uid }));
    });
  }, [dispatch, ready, usuarios]);

  // Helpers
  const inferCategoria = (userId) => {
    const myPosts = posts.filter((p) => Number(p.usuarioId) === Number(userId));
    if (myPosts.length === 0) return "outros";

    const counts = { musica: 0, letra: 0, texto: 0, visual: 0 };
    myPosts.forEach((p) => {
      const t = String(p.tipo || "").toLowerCase();
      if (t in counts) counts[t] += 1;
    });

    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const top = entries[0]?.[0] || "outros";
    if (top === "musica") return "musica";
    if (top === "visual") return "arte";
    if (top === "letra" || top === "texto") return "letra";
    return "outros";
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

  // --- AQUI: seguidores pelo banco de seguidores (followsSlice.counts) ---
  const followerCountFromRedux = (userId) =>
    Number(followsCounts[Number(userId)]?.followersCount || 0);

  const artists = useMemo(() => {
    return usuarios.map((u) => {
      const catKey = inferCategoria(u.id); // musica | letra | arte | outros
      const category =
        catKey === "musica"
          ? "Música"
          : catKey === "letra"
          ? "Letra"
          : catKey === "arte"
          ? "Arte"
          : "Outros";

      return {
        id: u.id,
        name: u.nome || u.username,
        username: u.username,
        category,
        categoryKey: catKey,
        followers: followerCountFromRedux(u.id), // <- vindo da coleção seguidores
        works: posts.filter((p) => Number(p.usuarioId) === Number(u.id)).length,
        rating: ratingUserAvg(u.id),
      };
    });
  }, [usuarios, posts, followsCounts]);

  const filteredAndSorted = useMemo(() => {
    let list = artists;
    if (activeFilter !== "all") {
      list = list.filter((a) => a.categoryKey === activeFilter);
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
  }, [artists, activeFilter, sortBy]);

  const isFollowingUser = (targetId) => {
    if (!currentUser?.id || !targetId) return false;
    const k = `${Number(currentUser.id)}-${Number(targetId)}`;
    return Boolean(followsByPair[k]?.isFollowing);
    // Obs: se quiser pré-checar todos, pode disparar fetchIsFollowing em outro efeito.
  };

  const handleFollowClick = async (targetId) => {
    if (!currentUser?.id || !targetId || Number(currentUser.id) === Number(targetId)) return;
    try {
      const following = isFollowingUser(targetId);
      if (following) {
        await dispatch(unfollowUser({ followerId: currentUser.id, followingId: targetId })).unwrap();
      } else {
        await dispatch(followUser({ followerId: currentUser.id, followingId: targetId })).unwrap();
      }
      // não precisa manualmente atualizar contagens: seu thunk já patcha as contagens
      // mas como aqui buscamos do mapa counts, refrescamos só este usuário:
      dispatch(fetchFollowCounts({ userId: targetId }));
    } catch (e) {
      console.error("follow/unfollow error", e);
    }
  };

  // Monetização
  const handleMonetizeClick = (uname) => {
    setMonetizationUsername(uname);
    setShowMonetization(true);
    document.body.style.overflow = "hidden";
  };
  const handleCloseMonetization = () => {
    setShowMonetization(false);
    document.body.style.overflow = "";
  };

  // Render stars
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
          Descubra os artistas mais populares e bem avaliados da plataforma
        </p>

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
              onClick={() => setActiveFilter("musica")}
            >
              Música
            </button>
            <button
              className={`fy-filter-btn ${activeFilter === "letra" ? "active" : ""}`}
              onClick={() => setActiveFilter("letra")}
            >
              Letra
            </button>
            <button
              className={`fy-filter-btn ${activeFilter === "arte" ? "active" : ""}`}
              onClick={() => setActiveFilter("arte")}
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
          <div className="fy-grid">
            {filteredAndSorted.map((artist) => {
              const following = isFollowingUser(artist.id);
              return (
                <div key={artist.id} className="fy-card">
                  <div className="fy-card-header">
                    {/* Avatar padrão (ícone com fundo roxo) */}
                    <div className="fy-avatar">
                      <i className="fas fa-user" />
                    </div>
                  </div>

                  <div className="fy-card-info">
                    <h3 className="fy-name">{artist.name}</h3>
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
                        onClick={() => handleFollowClick(artist.id)}
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
                        onClick={() => handleMonetizeClick(artist.username)}
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
      </div>

      <MonetizationPopup
        show={showMonetization}
        onClose={handleCloseMonetization}
        username={monetizationUsername}
      />

      {/* --- ESTILOS INLINE (Glass + Contraste) --- */}
      <style>{`
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
          width: 84px; height: 84px;
          display: grid; place-items: center; color: #fff;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--accent), var(--accent-2));
          box-shadow: 0 10px 24px rgba(94,23,235,.35);
          font-size: 34px;
          border: 3px solid rgba(255,255,255,.75);
          text-shadow: 0 2px 10px rgba(0,0,0,.25);
        }

        .fy-card-info { text-align: center; }

        .fy-name {
          font-weight: 800;
          font-size: 1.1rem;
          margin-bottom: 2px;
          color: #fff;
          text-shadow: 0 1px 10px rgba(0,0,0,.25);
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
        }
      `}</style>
    </>
  );
};

export default ForYou;
