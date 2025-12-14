// src/pages/DiscoverArtistPublic.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import NavbarAL from '../components/NavbarAL';
import { fetchUsuarios } from '../redux/usuariosSlice';
import { fetchPosts } from '../redux/postsSlice';
import { useNavigate } from 'react-router-dom';
import FooterAL from '../components/FooterAL';
import '../css/InitialPage.css';

/**
 * @typedef {object} Usuario
 * @property {string} _id ID do MongoDB do usuário.
 * @property {string} [id] ID alternativo.
 * @property {string} username Nome de usuário.
 * @property {string} [nome] Nome de exibição.
 * @property {string} [bio] Biografia.
 * @property {string} [fotoUrl] URL da foto de perfil.
 */

/**
 * @typedef {object} Post
 * @property {string} _id ID do MongoDB do post.
 * @property {string} [tipo] Categoria do post ('musica', 'texto', 'visual').
 * @property {string} [usuarioId] ID do autor (usuário) do post.
 * @property {string} [userId] ID alternativo do autor.
 * // ... outras propriedades de post
 */

/**
 * @typedef {object} ArtistWithCount
 * @property {number} postCount Número de posts recentes do artista na categoria.
 * @augments Usuario
 */

/**
 * Página pública para descoberta aleatória de artistas por categoria.
 *
 * O componente carrega a lista de usuários e posts (através do Redux) e,
 * em seguida, permite que o usuário gire uma "roleta" para encontrar um
 * artista aleatório em uma das categorias de conteúdo (Música, Texto, Visual).
 * Como é uma página pública, as interações de "Seguir" redirecionam para o login.
 *
 * @returns {JSX.Element} A página de descoberta de artistas.
 */

const ArtistPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redux State Selectors
  /** @type {Usuario[]} */
  const { usuarios = [] } = useSelector((s) => s.user) || {};
  /** @type {{lista: Post[], loading: boolean}} */
  const { lista: posts = [], loading: loadingPosts } = useSelector((s) => s.posts) || {};

  // Estado local para a roleta
  /** @type {[ArtistWithCount | null, React.Dispatch<React.SetStateAction<ArtistWithCount | null>>]} */
  const [currentArtist, setCurrentArtist] = useState(null);
  const [isRouletteSpinning, setIsRouletteSpinning] = useState(false);
  /** @type {['musica'|'texto'|'visual'|null, React.Dispatch<React.SetStateAction<'musica'|'texto'|'visual'|null>>]} */
  const [currentCategory, setCurrentCategory] = useState(null);

  // Carrega base: Busca usuários e posts se o Redux estiver vazio.
  useEffect(() => {
    if (!Array.isArray(usuarios) || usuarios.length === 0) dispatch(fetchUsuarios());
    if (!Array.isArray(posts) || posts.length === 0) dispatch(fetchPosts());
  }, [dispatch]);

  // Agrupa artistas por categoria
  /**
   * Agrupa e conta posts de artistas por categoria.
   * A computação é memorizada (useMemo) e re-executada apenas quando 'posts' ou 'usuarios' mudam.
   * @type {{musica: ArtistWithCount[], texto: ArtistWithCount[], visual: ArtistWithCount[]}}
   */
  const artistsByCategory = useMemo(() => {
    const map = { musica: new Map(), texto: new Map(), visual: new Map() };

    for (const p of posts) {
      const tipo = p?.tipo;
      if (!['musica', 'texto', 'visual'].includes(tipo)) continue;

      // ✅ CORREÇÃO: Usar _id ou id (MongoDB usa _id)
      const author = usuarios.find((u) => {
        const uid = String(u._id || u.id);
        const puid = String(p.usuarioId || p.userId);
        return uid === puid;
      });
      if (!author) continue;

      const key = String(author._id || author.id);
      if (!map[tipo].has(key)) {
        map[tipo].set(key, { ...author, postCount: 1 });
      } else {
        const prev = map[tipo].get(key);
        map[tipo].set(key, { ...prev, postCount: (prev.postCount || 0) + 1 });
      }
    }

    return {
      musica: Array.from(map.musica.values()),
      texto: Array.from(map.texto.values()),
      visual: Array.from(map.visual.values()),
    };
  }, [posts, usuarios]);

  /**
   * @private
   * Seleciona um elemento aleatório de um array.
   * @param {Array<any>} arr O array de entrada.
   * @returns {any | null} Um elemento aleatório ou null se o array estiver vazio.
   */
  const pickRandom = (arr) => (!arr || arr.length === 0) ? null : arr[Math.floor(Math.random() * arr.length)];

  /**
   * Inicia o processo de "roleta" para escolher um artista aleatório na categoria.
   * Atualiza o estado para mostrar o spinner e, após um timeout (900ms), revela o artista escolhido.
   * @param {'musica'|'texto'|'visual'} category A categoria a ser sorteada.
   * @returns {void}
   */
  const getRandomArtist = (category) => {
    setCurrentCategory(category);
    setIsRouletteSpinning(true);
    setCurrentArtist(null);
    setTimeout(() => {
      const list = artistsByCategory[category] || [];
      const chosen = pickRandom(list);
      setCurrentArtist(chosen || null);
      setIsRouletteSpinning(false);
    }, 900);
  };

  /**
   * Navega para a página de perfil do artista atualmente selecionado.
   * @private
   * @returns {void}
   */
  const goToProfile = () => {
    if (currentArtist?.username) navigate(`/user/${currentArtist.username}`);
  };

  /**
   * Gera um fallback SVG para a imagem do perfil do artista.
   * @private
   * @returns {string} URL de dados do SVG codificado.
   */
  const avatarUrl = () => {
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
          <path d="M60 260c0-50 40-90 90-90s90 40 90 90"/>
        </g>
      </svg>
    `);
    return `data:image/svg+xml;utf8,${svg}`;
  };

  /**
   * Gera uma biografia simplificada e derivada do artista, baseada na contagem de posts na categoria atual.
   * @private
   * @param {Usuario | ArtistWithCount | null} u O objeto usuário.
   * @returns {string} A string da biografia.
   */
  const derivedBio = (u) => {
    if (!u) return '';
    const count = currentCategory
      ? (artistsByCategory[currentCategory]?.find(a => String(a._id || a.id) === String(u._id || u.id))?.postCount || 0)
      : 0;
    return `Artista com ${count} publicação${count === 1 ? '' : 's'} recente${count === 1 ? '' : 's'}.`;
  };

  const isEmptyState =
    !loadingPosts &&
    (!artistsByCategory.musica.length &&
      !artistsByCategory.texto.length &&
      !artistsByCategory.visual.length);

  /**
   * Handler de clique no botão "Seguir" (para a versão deslogada).
   * Redireciona o usuário para a página de login.
   * @private
   * @returns {void}
   */
  const handleFollowClick = () => navigate('/login');

  return (
    <>
    <div className="artistas-page">
      <NavbarAL />
      <section className="hero-artistas py-5">
      <div className="container mt-5 pt-4">
        <div className="row justify-content-center">
          <div className="col-12 text-center">
            <h1 className="display-5 fw-bold gradient-text mb-4">Descubra um Artista</h1>

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

            {isRouletteSpinning && <div className="roulette mb-4">🎲 Sorteando artista...</div>}

            {!isRouletteSpinning && isEmptyState && (
              <div className="empty-card mx-auto p-4">
                <p className="mb-0">Ainda não há artistas com publicações. Tente novamente mais tarde.</p>
              </div>
            )}

            {currentArtist && (
              <div className="artist-card mx-auto p-4">
                <div className="artist-avatar-wrap" role="button" title="Ver perfil" onClick={goToProfile}>
                  <img
                    src={avatarUrl()}
                    alt={currentArtist.nome || currentArtist.username}
                    className="artist-img"
                  />
                </div>

                <h2 className="artist-name mb-1 clickable" onClick={goToProfile} title="Abrir perfil">
                  {currentArtist.nome || currentArtist.username}
                </h2>
                <div className="artist-username">@{currentArtist.username}</div>

                <p className="artist-bio mb-3">{derivedBio(currentArtist)}</p>

                <div className="d-flex gap-2 justify-content-center">
                  <button
                    className="btn follow-btn px-4 notfollowing"
                    onClick={handleFollowClick}
                    title="Faça login para seguir"
                  >
                    Seguir
                  </button>
                  <button className="btn profile-btn px-4" onClick={goToProfile}>
                    Ver perfil
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      </section>
      <FooterAL></FooterAL>
      </div>

      {/* estilos (mantendo o design do seu componente logado) */}
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
        .artist-bio { color: rgba(255,255,255,.85); font-size: .96rem; }

        .follow-btn, .profile-btn {
          border-radius: 30px;
          border: 1px solid rgba(255,255,255,.18);
          color: #fff;
          font-weight: 600;
          transition: transform .15s ease, background .2s ease, box-shadow .25s ease, border-color .2s ease;
        }
        .follow-btn.notfollowing { background: linear-gradient(135deg, rgba(94,23,235,.9), rgba(123,63,242,.9)); }
        .follow-btn:hover, .profile-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 10px 24px rgba(0,0,0,.25);
          border-color: rgba(255,255,255,.28);
        }
        .profile-btn { background: linear-gradient(135deg, rgba(255,255,255,.18), rgba(255,255,255,.12)); }

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

        @keyframes fadeIn { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes blink { from { opacity: .6; } to { opacity: 1; } }

        @media (prefers-reduced-motion: reduce) {
          .cat-btn, .artist-card, .follow-btn, .profile-btn { transition: none !important; }
          .roulette { animation: none !important; }
        }
      `}</style>
    </>
  );
};

export default ArtistPage;
