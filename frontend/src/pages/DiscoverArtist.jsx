// src/pages/DiscoverArtist.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Header from '../components/Header2';
import { fetchUsuarios } from '../redux/usuariosSlice';
import { fetchPosts } from '../redux/postsSlice';

import {
  fetchIsFollowing,
  followUser,
  unfollowUser,
  selectIsFollowing,
} from '../redux/followsSlice';

import { useNavigate } from 'react-router-dom';

const DiscoverArtist = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redux state: novo formato currentUser = { user, token }
  const usuarios = useSelector((s) => s.user?.usuarios ?? []);
  const currentUserState = useSelector((s) => s.user?.currentUser ?? null);
  const posts = useSelector((s) => s.posts?.lista ?? []);
  const loadingPosts = useSelector((s) => s.posts?.loading ?? false);

  // extrai objeto user real (ou null)
  const currentUser = currentUserState?.user ?? null;

  // Página local
  const [currentArtist, setCurrentArtist] = useState(null);
  const [isRouletteSpinning, setIsRouletteSpinning] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(null);

  // Carregar base se necessário
  useEffect(() => {
    if (!Array.isArray(usuarios) || usuarios.length === 0) dispatch(fetchUsuarios());
    if (!Array.isArray(posts) || posts.length === 0) dispatch(fetchPosts());
  }, [dispatch, usuarios.length, posts.length]);

  // função utilitária para obter id canônico (string) do usuário/post
  const canonicalId = (obj) => {
    if (!obj) return null;
    return String(obj.id ?? obj._id ?? '');
  };

  // Agrupa artistas por categoria (tipo de post)
  const artistsByCategory = useMemo(() => {
    // pega autores que têm posts em cada tipo
    const map = { musica: new Map(), texto: new Map(), visual: new Map() };

    for (const p of posts) {
      const tipo = p?.tipo;
      if (!['musica', 'texto', 'visual'].includes(tipo)) continue;

      // encontra author comparando ids com tolerância a id/_id e tipos
      const author = usuarios.find((u) => {
        const uid = canonicalId(u);
        const puid = String(p.usuarioId ?? p.usuario_id ?? p.userId ?? '');
        return uid && puid && uid === puid;
      });
      if (!author) continue;

      const key = canonicalId(author);
      if (!map[tipo].has(key)) {
        map[tipo].set(key, {
          ...author,
          postCount: 1,
        });
      } else {
        const prev = map[tipo].get(key);
        map[tipo].set(key, { ...prev, postCount: (prev.postCount || 0) + 1 });
      }
    }

    // transforma Map -> array
    return {
      musica: Array.from(map.musica.values()),
      texto: Array.from(map.texto.values()),
      visual: Array.from(map.visual.values()),
    };
  }, [posts, usuarios]);

  const pickRandom = (arr) => {
    if (!arr || arr.length === 0) return null;
    const i = Math.floor(Math.random() * arr.length);
    return arr[i];
  };

  const getRandomArtist = (category) => {
    setCurrentCategory(category);
    setIsRouletteSpinning(true);
    setCurrentArtist(null);

    // roletinha
    setTimeout(() => {
      const list = artistsByCategory[category] || [];
      const chosen = pickRandom(list);
      setCurrentArtist(chosen || null);
      setIsRouletteSpinning(false);
    }, 900);
  };

  // follow logic (usando followsSlice)
  const viewerId = canonicalId(currentUser);
  const targetId = canonicalId(currentArtist);

  // selectIsFollowing deve receber ids canônicos (dependendo de sua implementação)
  const isFollowing = useSelector(selectIsFollowing(viewerId, targetId));

  // ao mudar o artista atual, consulta se sigo
  useEffect(() => {
    if (!viewerId || !targetId || viewerId === targetId) return;
    dispatch(fetchIsFollowing({ followerId: viewerId, followingId: targetId }));
  }, [dispatch, viewerId, targetId]);

  const toggleFollow = async () => {
    if (!viewerId || !targetId || viewerId === targetId) return;
    try {
      if (isFollowing) {
        await dispatch(unfollowUser({ followerId: viewerId, followingId: targetId })).unwrap();
      } else {
        await dispatch(followUser({ followerId: viewerId, followingId: targetId })).unwrap();
      }
    } catch (e) {
      console.error('follow toggle error', e);
    }
  };

  const goToProfile = () => {
    if (currentArtist?.username) navigate(`/user/${currentArtist.username}`);
  };

  // ✅ Helper para obter URL da foto de perfil do artista
  const getArtistPhotoUrl = (artist) => {
    if (!artist?.fotoPerfil) return null;
    
    const foto = artist.fotoPerfil;
    
    // Se já é uma URL completa, retorna direto
    if (foto.startsWith('http://') || foto.startsWith('https://') || foto.startsWith('data:')) {
      return foto;
    }
    
    // Se é caminho relativo, adiciona base URL
    const API_URL = import.meta?.env?.VITE_API_URL ||
      (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL) ||
      'http://localhost:5000';
    
    return `${API_URL}/${foto.replace(/^\//, '')}`;
  };

  // Fallback SVG bonitinho se não houver foto
  const getFallbackAvatarSvg = () => {
    const svg = encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="300" height="300">
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#6a5ae0"/>
            <stop offset="100%" stop-color="#8c7ff2"/>
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" rx="150" ry="150" fill="url(#g)"/>
        <g fill="#ffffff">
          <circle cx="150" cy="120" r="60"/>
          <path d="M60 260c0-50 40-90 90-90s90 40 90 90" />
        </g>
      </svg>
    `);
    return `data:image/svg+xml;utf8,${svg}`;
  };

  // bio simples derivada (se quiser, pode trocar p/ campo real no futuro)
  const derivedBio = (u) => {
    if (!u) return '';
    const count = currentCategory
      ? (artistsByCategory[currentCategory]?.find(a => canonicalId(a) === canonicalId(u))?.postCount || 0)
      : 0;

    const bios = {
      musica: `Artista com ${count} publicação${count === 1 ? '' : 's'} recente${count === 1 ? '' : 's'}.`,
      texto: `Artista com ${count} publicação${count === 1 ? '' : 's'} recente${count === 1 ? '' : 's'}.`,
      visual: `Artista com ${count} publicação${count === 1 ? '' : 's'} recente${count === 1 ? '' : 's'}.`,
    };
    return bios[currentCategory] || 'Criador(a) na comunidade.';
  };

  const isEmptyState =
    !loadingPosts &&
    (!artistsByCategory.musica.length &&
      !artistsByCategory.texto.length &&
      !artistsByCategory.visual.length);

  return (
    <>
      <Header />

      <div className="container mt-5 pt-4">
        <div className="row justify-content-center">
          <div className="col-12 text-center">
            <h1 className="display-5 fw-bold gradient-text mb-4">
              Descubra um Artista
            </h1>

            <div className="d-flex flex-wrap gap-3 justify-content-center mb-5">
              <button
                className="btn cat-btn px-4 py-3"
                onClick={() => getRandomArtist('musica')}
                disabled={artistsByCategory.musica.length === 0}
                title={artistsByCategory.musica.length ? 'Sortear artista de Música' : 'Sem artistas nessa categoria'}
              >
                <i className="fa-solid fa-music me-2"></i> Música
              </button>
              <button
                className="btn cat-btn px-4 py-3"
                onClick={() => getRandomArtist('texto')}
                disabled={artistsByCategory.texto.length === 0}
                title={artistsByCategory.texto.length ? 'Sortear artista de Texto' : 'Sem artistas nessa categoria'}
              >
                <i className="fa-solid fa-pen-nib me-2"></i> Texto
              </button>
              <button
                className="btn cat-btn px-4 py-3"
                onClick={() => getRandomArtist('visual')}
                disabled={artistsByCategory.visual.length === 0}
                title={artistsByCategory.visual.length ? 'Sortear artista Visual' : 'Sem artistas nessa categoria'}
              >
                <i className="fas fa-image me-2"></i> Visual
              </button>
            </div>

            {isRouletteSpinning && (
              <div className="roulette mb-4">
                🎲 Sorteando artista...
              </div>
            )}

            {!isRouletteSpinning && isEmptyState && (
              <div className="empty-card mx-auto p-4">
                <p className="mb-0">Ainda não há artistas com publicações. Tente novamente mais tarde.</p>
              </div>
            )}

            {currentArtist && (
              <div className="artist-card mx-auto p-4">
                <div className="artist-avatar-wrap" role="button" title="Ver perfil" onClick={goToProfile}>
                  <img
                    src={getArtistPhotoUrl(currentArtist) || getFallbackAvatarSvg()}
                    alt={currentArtist.nome || currentArtist.username}
                    className="artist-img"
                    onError={(e) => {
                      // Se a foto falhar, usa o fallback SVG
                      e.target.src = getFallbackAvatarSvg();
                    }}
                  />
                </div>

                <h2
                  className="artist-name mb-1 clickable"
                  onClick={goToProfile}
                  title="Abrir perfil"
                >
                  {currentArtist.nome || currentArtist.username}
                </h2>
                <div className="artist-username">@{currentArtist.username}</div>

                <p className="artist-bio mb-3">{derivedBio(currentArtist)}</p>

                <div className="d-flex gap-2 justify-content-center">
                  <button
                    className={`btn follow-btn px-4 ${isFollowing ? 'following' : 'notfollowing'}`}
                    onClick={toggleFollow}
                    disabled={!viewerId || viewerId === targetId}
                    title={!viewerId ? 'Faça login para seguir' : (viewerId === targetId ? 'Este é você' : (isFollowing ? 'Deixar de seguir' : 'Seguir'))}
                  >
                    {isFollowing ? 'Seguindo' : 'Seguir'}
                  </button>

                  <button
                    className="btn profile-btn px-4"
                    onClick={goToProfile}
                  >
                    Ver perfil
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* estilo alinhado ao tema "vidro" do site */}
      <style>{`
        .gradient-text {
          background: linear-gradient(90deg, #c9d1ff, #ffffff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-shadow: 0 6px 24px rgba(0,0,0,.18);
        }

        .cat-btn {
          border-radius: 40px;
          background: linear-gradient(135deg, rgba(94,23,235,.9), rgba(29,20,124,.9));
          color: white;
          font-weight: 600;
          border: 1px solid rgba(255,255,255,.14);
          box-shadow: 0 8px 22px rgba(0,0,0,.22);
          transition: transform .2s ease, filter .2s ease, box-shadow .25s ease;
        }
        .cat-btn:hover { transform: translateY(-1px); filter: brightness(1.03); box-shadow: 0 12px 28px rgba(0,0,0,.26); }
        .cat-btn:disabled { opacity: .55; filter: grayscale(.2); cursor: not-allowed; }

        .artist-card {
          background: linear-gradient(180deg, rgba(255,255,255,.10), rgba(255,255,255,.06));
          border: 1px solid rgba(255,255,255,.16);
          backdrop-filter: blur(10px) saturate(1.05);
          -webkit-backdrop-filter: blur(10px) saturate(1.05);
          border-radius: 20px;
          width: 100%;
          max-width: 380px;
          text-align: center;
          padding: 25px;
          box-shadow: 0 14px 30px rgba(0,0,0,.22);
          animation: fadeIn .5s ease forwards;
          color: #fff;
        }

        .artist-avatar-wrap {
          width: 120px; height: 120px; margin: 0 auto 12px; position: relative;
          border-radius: 999px; padding: 4px;
          background: linear-gradient(135deg, rgba(106,90,224,.55), rgba(140,127,242,.45));
          box-shadow: 0 10px 24px rgba(106,90,224,.28);
        }
        .artist-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
          border: 3px solid rgba(255,255,255,.8);
          display: block;
        }

        .artist-name {
          font-size: 1.4rem;
          font-weight: 700;
          color: #fff;
          text-shadow: 0 2px 12px rgba(0,0,0,.25);
        }
        .artist-username { color: rgba(255,255,255,.85); margin-bottom: 6px; }

        .artist-bio {
          color: rgba(255,255,255,.85);
          font-size: .96rem;
        }

        .follow-btn, .profile-btn {
          border-radius: 30px;
          border: 1px solid rgba(255,255,255,.18);
          color: #fff;
          font-weight: 600;
          transition: transform .15s ease, background .2s ease, box-shadow .25s ease, border-color .2s ease;
        }
        .follow-btn.notfollowing {
          background: linear-gradient(135deg, rgba(94,23,235,.9), rgba(123,63,242,.9));
        }
        .follow-btn.following {
          background: linear-gradient(135deg, rgba(52,199,89,.92), rgba(48,186,82,.92));
        }
        .follow-btn:hover, .profile-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 10px 24px rgba(0,0,0,.25);
          border-color: rgba(255,255,255,.28);
        }
        .profile-btn {
          background: linear-gradient(135deg, rgba(255,255,255,.18), rgba(255,255,255,.12));
        }

        .roulette {
          font-size: 1.1rem;
          font-weight: 700;
          color: #fff;
          animation: blink .3s infinite alternate;
          text-shadow: 0 1px 10px rgba(0,0,0,.22);
        }

        .empty-card {
          background: rgba(255,255,255,.08);
          border: 1px solid rgba(255,255,255,.14);
          border-radius: 16px;
          color: #fff;
          backdrop-filter: blur(6px);
          max-width: 520px;
        }

        .clickable { cursor: pointer; }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes blink { from { opacity: .6; } to { opacity: 1; } }

        @media (prefers-reduced-motion: reduce) {
          .cat-btn, .artist-card, .follow-btn, .profile-btn { transition: none !important; }
          .roulette { animation: none !important; }
        }
      `}</style>
    </>
  );
};

export default DiscoverArtist;