import React, { useEffect, useMemo, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import HeaderForYou from "../components/Header2";
import MonetizationPopup from "../components/MonetizationPopup";

import { fetchPosts } from "../redux/postsSlice";
import { fetchUsuarios } from "../redux/usuariosSlice";
import {
  followUser,
  unfollowUser,
  fetchFollowCounts
} from "../redux/followsSlice";

const ForYou = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // --- Redux State ---
  const posts = useSelector((s) => s.posts.lista || []);
  const usuarios = useSelector((s) => s.user.usuarios || []);
  const loadingUsuarios = useSelector((s) => s.user.loading);
  const currentUserState = useSelector((s) => s.user.currentUser);
  const currentUser = currentUserState?.user ?? null;
  const viewerId = currentUser?._id ?? currentUser?.id ?? null;

  // Contagens vindas do Redux (Fonte da Verdade do Servidor)
  const followsCounts = useSelector((s) => s.follows?.counts || {});

  // Estado Local
  const [myFollowingIds, setMyFollowingIds] = useState(new Set());
  const [localFollowerCounts, setLocalFollowerCounts] = useState({});
  const [artistsData, setArtistsData] = useState([]);
  
  // UI State
  const [showMonetization, setShowMonetization] = useState(false);
  const [monetizationUsername, setMonetizationUsername] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [sortBy, setSortBy] = useState("rating");
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // ✅ CORREÇÃO 1: Ref para evitar requisições duplicadas para o mesmo ID
  const countsRequested = useRef(new Set());

  // 1. Carregar Dados Iniciais (Posts, Usuários)
  useEffect(() => {
    dispatch(fetchPosts());
    dispatch(fetchUsuarios());
  }, [dispatch]);

  // 2. Atualização periódica para pegar novas avaliações (agora o backend retorna ratings)
  useEffect(() => {
    // Polling leve a cada 60 segundos
    const interval = setInterval(() => {
      dispatch(fetchPosts());
    }, 60000); // 1 minuto

    return () => clearInterval(interval);
  }, [dispatch]);

  // 3. Sincroniza lista de "Quem eu sigo"
  useEffect(() => {
    const fetchMyFollowing = async () => {
      if (!viewerId) return;
      try {
        const res = await axios.get(`http://localhost:5000/follows/following/${viewerId}`);
        const ids = res.data.following.map(u => String(u._id || u.id));
        setMyFollowingIds(new Set(ids));
      } catch (error) {
        console.error("Erro ao buscar lista de seguindo:", error);
      }
    };
    fetchMyFollowing();
  }, [viewerId]);

  // 4. Buscar contagens de seguidores para os usuários listados
  useEffect(() => {
    if (!usuarios.length) return;

    usuarios.forEach(u => {
      const uid = String(u._id || u.id);
      
      // Se não temos a contagem no Redux E ainda não pedimos ao servidor
      if (followsCounts[uid] === undefined && !countsRequested.current.has(uid)) {
        // Marca como pedido para não pedir de novo no próximo render
        countsRequested.current.add(uid);
        // Dispara a busca
        dispatch(fetchFollowCounts({ userId: uid }));
      }
    });
  }, [usuarios, followsCounts, dispatch]);

  // 5. Processar Artistas e Montar Dados
  useEffect(() => {
    // Não bloqueamos se loadingUsuarios for true, pois queremos atualizações progressivas
    
    // Helper para média de estrelas
    const calculateRatingFromPosts = (userPosts) => {
      if (!userPosts?.length) return 0;
      const ratings = userPosts.map(p => Number(p.ratingAvg || 0)).filter(r => r > 0);
      return ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
    };

    const processed = usuarios.map((usuario) => {
      const uid = String(usuario._id || usuario.id);
      const userPosts = posts.filter((p) => String(p.usuarioId || p.userId) === uid);

      // Rating
      let finalRating = Number(usuario.ratingAvgRecebida || 0);
      if (finalRating === 0) finalRating = calculateRatingFromPosts(userPosts);

      // Categoria
      const counts = { musica: 0, visual: 0, texto: 0 };
      userPosts.forEach(p => {
        const t = (p.tipo || "").toLowerCase();
        if (t === "musica") counts.musica++;
        else if (t === "visual" || t === "arte") counts.visual++;
        else counts.texto++;
      });
      
      let catKey = "outros";
      if (counts.musica >= counts.visual && counts.musica >= counts.texto && counts.musica > 0) catKey = "musica";
      else if (counts.visual >= counts.musica && counts.visual >= counts.texto && counts.visual > 0) catKey = "visual";
      else if (counts.texto > 0) catKey = "texto";

      // ✅ Lógica de Prioridade de Contagem:
      // 1. Local (Otimista - clicou agora)
      // 2. Redux (Veio do servidor via fetchFollowCounts)
      // 3. Objeto Usuário (Fallback, geralmente desatualizado)
      // 4. Zero
      let followers = 0;
      
      if (localFollowerCounts[uid] !== undefined) {
        followers = localFollowerCounts[uid];
      } else if (followsCounts[uid]?.followersCount !== undefined) {
        followers = followsCounts[uid].followersCount;
      } else {
        followers = usuario.followersCount || 0;
      }

      return {
        id: uid,
        name: usuario.nome || usuario.username || "Artista",
        username: usuario.username,
        fotoPerfil: usuario.fotoPerfil,
        categoryKey: catKey,
        category: catKey === "musica" ? "Música" : catKey === "visual" ? "Arte Visual" : catKey === "texto" ? "Texto/Letra" : "Variados",
        followers: Number(followers),
        works: userPosts.length,
        rating: finalRating
      };
    });

    setArtistsData(processed);
  }, [usuarios, posts, followsCounts, localFollowerCounts]);

  // --- Handlers ---

  const handleFollowClick = async (targetId, currentCount, e) => {
    e.stopPropagation();
    if (!viewerId) return alert("Faça login para seguir.");
    
    const targetIdString = String(targetId);
    if (String(viewerId) === targetIdString) return;

    const isFollowing = myFollowingIds.has(targetIdString);

    // Atualização Visual Imediata (Botão)
    setMyFollowingIds(prev => {
      const newSet = new Set(prev);
      if (isFollowing) newSet.delete(targetIdString);
      else newSet.add(targetIdString);
      return newSet;
    });

    // Atualização Visual Imediata (Número)
    setLocalFollowerCounts(prev => ({
      ...prev,
      [targetIdString]: (prev[targetIdString] ?? currentCount) + (isFollowing ? -1 : 1)
    }));

    try {
      if (isFollowing) {
        await dispatch(unfollowUser({ followerId: viewerId, followingId: targetId })).unwrap();
      } else {
        await dispatch(followUser({ followerId: viewerId, followingId: targetId })).unwrap();
      }
      
      // ✅ Sincroniza com o servidor para garantir o número real final
      dispatch(fetchFollowCounts({ userId: targetId }));
      
    } catch (err) {
      console.error("Erro follow:", err);
      // Reverter em caso de erro
      setMyFollowingIds(prev => {
        const newSet = new Set(prev);
        if (isFollowing) newSet.add(targetIdString);
        else newSet.delete(targetIdString);
        return newSet;
      });
      setLocalFollowerCounts(prev => ({
        ...prev,
        [targetIdString]: (prev[targetIdString] ?? currentCount) // volta ao valor original
      }));
    }
  };

  const renderStars = (rating) => {
    const r = Math.max(0, Math.min(5, Number(rating) || 0));
    return <span style={{color: '#f5c542'}}>{"★".repeat(Math.floor(r))}{r % 1 >= 0.5 ? "½" : ""}{"☆".repeat(5 - Math.ceil(r))}</span>;
  };

  const filteredList = useMemo(() => {
    let list = isSearching ? artistsData : artistsData.filter(a => a.rating >= 0);
    
    if (activeFilter !== "all") {
      list = list.filter(a => a.categoryKey === activeFilter);
    }
    
    if (isSearching && searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter(a => 
        a.name.toLowerCase().includes(term) || 
        (a.username || "").toLowerCase().includes(term)
      );
    }
    
    return list.sort((a, b) => {
      if (sortBy === "rating") return b.rating - a.rating;
      if (sortBy === "followers") return b.followers - a.followers;
      if (sortBy === "works") return b.works - a.works;
      return 0;
    });
  }, [artistsData, activeFilter, searchTerm, isSearching, sortBy]);

  if (loadingUsuarios && !artistsData.length) {
    return <div style={{color:'#fff', padding: 50, textAlign:'center'}}>Carregando artistas...</div>;
  }

  return (
    <>
      <HeaderForYou />
      <div className="fy-container">
        <h1 className="fy-title">Artistas em Destaque</h1>
        
        <div className="fy-search-container">
          <input 
            type="text" 
            className="fy-search-input" 
            placeholder="Buscar..." 
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setIsSearching(!!e.target.value); }}
            style={{padding: '12px', width: '100%', borderRadius: '12px', border: 'none', background: 'rgba(255,255,255,0.1)', color: 'white'}}
          />
        </div>
        
        <div className="fy-filters" style={{marginBottom: '30px', display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'space-between', alignItems: 'center'}}>
           <div style={{display: 'flex', gap: '8px'}}>
             {['all', 'musica', 'texto', 'visual'].map(f => (
               <button 
                key={f} 
                onClick={() => setActiveFilter(f)} 
                style={{
                  padding: '8px 16px', 
                  borderRadius: 20, 
                  border: '1px solid rgba(255,255,255,0.2)', 
                  background: activeFilter === f ? '#5e17eb' : 'rgba(255,255,255,0.05)', 
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: activeFilter === f ? 'bold' : 'normal'
                }}
               >
                 {f === 'all' ? 'Todos' : f.charAt(0).toUpperCase() + f.slice(1)}
               </button>
             ))}
           </div>
           
           <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
             <span style={{color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem'}}>Ordenar:</span>
             <select 
              value={sortBy} 
              onChange={e => setSortBy(e.target.value)} 
              style={{
                borderRadius: 8, 
                padding: '8px', 
                background: 'rgba(0,0,0,0.3)', 
                color: 'white', 
                border: '1px solid rgba(255,255,255,0.2)',
                cursor: 'pointer'
              }}
             >
               <option value="rating">Avaliação</option>
               <option value="followers">Seguidores</option>
               <option value="works">Obras</option>
             </select>
           </div>
        </div>

        <div className="fy-grid">
          {filteredList.map((artist) => {
            const isFollowing = myFollowingIds.has(String(artist.id));
            const isMe = String(viewerId) === String(artist.id);

            return (
              <div key={artist.id} className="fy-card" onClick={() => navigate(`/user/${artist.username}`)}>
                <div className="fy-card-header">
                  <div className="fy-avatar">
                    {artist.fotoPerfil ? <img src={artist.fotoPerfil} alt={artist.name} /> : <i className="fas fa-user"></i>}
                  </div>
                </div>
                <div className="fy-card-info">
                  <h3 className="fy-name">{artist.name}</h3>
                  <span className="fy-category">{artist.category}</span>
                  
                  <div className="fy-stats">
                    <div className="fy-stat">
                      <div className="fy-stat-value">{artist.followers}</div>
                      <div className="fy-stat-label">Seguidores</div>
                    </div>
                    <div className="fy-stat">
                      <div className="fy-stat-value">{artist.works}</div>
                      <div className="fy-stat-label">Obras</div>
                    </div>
                  </div>
                  
                  <div className="fy-rating">
                    <div className="fy-stars">{renderStars(artist.rating)}</div>
                    <span className="fy-rating-value">{artist.rating.toFixed(1)}</span>
                  </div>
                  
                  <div className="fy-actions">
                    {!isMe && (
                      <button
                        className={`fy-btn-follow ${isFollowing ? "is-following" : ""}`}
                        // ✅ Passamos artist.followers para manter a referência correta na atualização otimista
                        onClick={(e) => handleFollowClick(artist.id, artist.followers, e)}
                      >
                        {isFollowing ? "Seguindo" : "Seguir"}
                      </button>
                    )}
                    
                    {!isMe && (
                      <button 
                        className="fy-btn-monetize" 
                        onClick={(e) => { e.stopPropagation(); setMonetizationUsername(artist.username); setShowMonetization(true); }}
                      >
                        <i className="fas fa-dollar-sign"></i>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <MonetizationPopup
        show={showMonetization}
        onClose={() => setShowMonetization(false)}
        username={monetizationUsername}
      />
      
      <style jsx>{`
        /* Mesmos estilos anteriores para consistência */
        :root {
          --accent: #5e17eb; --accent-2: #7b3ff2;
          --surface-glass: rgba(18, 20, 38, 0.50);
          --surface-border: rgba(255, 255, 255, 0.18);
          --text-strong: #f7f8ff; --text-soft: rgba(255,255,255,.9); --muted: rgba(255,255,255,.75);
          --ok: #34c759; --gold: #f5c542;
        }

        .fy-container { max-width: 1100px; margin: 0 auto; padding: 48px 20px 60px; }
        .fy-title{ margin:0 0 6px; font-weight:800; font-size:clamp(26px,2.4vw,34px); background:linear-gradient(90deg,#ffffff,#d6d9ff 40%,#bfc6ff 70%); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
        .fy-subtitle{ margin:0 0 22px; color:var(--text-soft); }

        .fy-search-container{ max-width:600px; margin:0 auto 30px; }
        .fy-search-box{ display:flex; align-items:center; background:var(--surface-glass); border:1px solid var(--surface-border); border-radius:16px; padding:12px 20px; backdrop-filter: blur(10px); }
        .fy-search-input{ flex:1; border:none; background:transparent; color:var(--text-strong); font-size:1rem; outline:none; margin: 0 10px; }
        .fy-search-clear, .fy-search-icon { color: var(--muted); background: none; border: none; cursor: pointer;}

        .fy-filters{ display:grid; grid-template-columns:1fr auto; gap:14px; margin-bottom:22px; }
        .fy-filter-buttons{ display:flex; flex-wrap:wrap; gap:10px; }
        .fy-filter-btn{ border:1px solid var(--surface-border); color:#fff; background: rgba(255,255,255,.1); padding:8px 16px; border-radius:99px; transition:all .2s; cursor: pointer; }
        .fy-filter-btn:hover, .fy-filter-btn.active{ background: var(--accent); border-color: var(--accent); transform: translateY(-1px); }
        
        .fy-sort select{ background:var(--surface-glass); color:#fff; border:1px solid var(--surface-border); border-radius:12px; padding:8px 12px; margin-left: 8px; cursor: pointer; }

        .fy-grid{ display:grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap:18px; }
        .fy-card{ background:var(--surface-glass); color:var(--text-strong); border:1px solid var(--surface-border); border-radius:18px; padding:18px 16px; backdrop-filter: blur(10px); transition: transform .2s; cursor: pointer; }
        .fy-card:hover{ transform: translateY(-4px); box-shadow: 0 12px 26px rgba(0,0,0,.28); border-color: rgba(255,255,255,0.3); }

        .fy-card-header{ display:flex; justify-content:center; margin-bottom:12px; }
        .fy-avatar{ width:80px; height:80px; border-radius:50%; background:linear-gradient(135deg, var(--accent), var(--accent-2)); display:flex; align-items:center; justify-content:center; font-size:32px; color:#fff; overflow: hidden; border: 3px solid rgba(255,255,255,0.8); }
        .fy-avatar img { width: 100%; height: 100%; object-fit: cover; }

        .fy-name{ text-align:center; font-size:1.2rem; font-weight:700; margin-bottom:4px; }
        .fy-category{ display:block; text-align:center; color:var(--muted); font-size:0.9rem; margin-bottom:12px; }

        .fy-stats{ display:flex; justify-content:center; gap:12px; margin-bottom:12px; }
        .fy-stat{ text-align:center; background:rgba(255,255,255,0.05); padding:8px 12px; border-radius:10px; min-width: 80px; }
        .fy-stat-value{ font-weight:700; font-size:1.1rem; }
        .fy-stat-label{ font-size:0.75rem; color:var(--muted); }

        .fy-rating{ display:flex; justify-content:center; align-items:center; gap:8px; margin-bottom:16px; background:rgba(255,255,255,0.05); padding:6px 12px; border-radius:20px; width: fit-content; margin-left: auto; margin-right: auto; }
        .fy-rating-value{ font-weight:bold; color: var(--gold); }

        .fy-actions{ display:flex; justify-content:center; gap:10px; }
        .fy-btn-follow{ background:var(--accent); color:white; border:none; padding:8px 20px; border-radius:10px; font-weight:600; cursor:pointer; transition: background .2s; }
        .fy-btn-follow.is-following{ background:var(--ok); }
        .fy-btn-monetize{ background:var(--gold); color:#000; border:none; width:38px; height:38px; border-radius:10px; display:flex; align-items:center; justify-content:center; cursor:pointer; }
        
        .no-results-msg { grid-column: 1 / -1; text-align: center; color: var(--muted); padding: 40px; font-size: 1.1rem; }

        @media (max-width: 600px) {
          .fy-filters { grid-template-columns: 1fr; }
        }
      `}</style>
    </>
  );
};

export default ForYou;