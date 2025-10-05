import React, { useState, useEffect } from 'react';
import HeaderForYou from '../components/Header2';
import MonetizationPopup from '../components/MonetizationPopup';
import '../css/ForYou.css';

const ForYou = () => {
  // Estados para monetização
  const [showMonetization, setShowMonetization] = useState(false);
  const [monetizationUsername, setMonetizationUsername] = useState('');

  // Estados dos artistas
  const [artistsData, setArtistsData] = useState([
    {
      id: 1,
      name: "Ana Silva",
      username: "@aninha_music",
      category: "Música",
      followers: 12500,
      works: 42,
      rating: 4.9,
      avatar: "🎤",
      isFollowing: false
    },
    {
      id: 2,
      name: "Carlos Mendes",
      username: "@carlos_letras",
      category: "Letra",
      followers: 8900,
      works: 28,
      rating: 4.8,
      avatar: "✍️",
      isFollowing: false
    },
    {
      id: 3,
      name: "Beatriz Santos",
      username: "@bea_arts",
      category: "Arte",
      followers: 15600,
      works: 35,
      rating: 4.7,
      avatar: "🎨",
      isFollowing: false
    },
    {
      id: 4,
      name: "João Costa",
      username: "@joao_guitar",
      category: "Música",
      followers: 7200,
      works: 19,
      rating: 4.6,
      avatar: "🎸",
      isFollowing: false
    },
    {
      id: 5,
      name: "Marina Oliveira",
      username: "@marina_poetisa",
      category: "Letra",
      followers: 10300,
      works: 31,
      rating: 4.9,
      avatar: "📝",
      isFollowing: false
    },
    {
      id: 6,
      name: "Ricardo Alves",
      username: "@ricardo_arts",
      category: "Arte",
      followers: 6800,
      works: 24,
      rating: 4.5,
      avatar: "🖌️",
      isFollowing: false
    },
    {
      id: 7,
      name: "Fernanda Lima",
      username: "@fe_piano",
      category: "Música",
      followers: 14200,
      works: 38,
      rating: 4.8,
      avatar: "🎹",
      isFollowing: false
    },
    {
      id: 8,
      name: "Pedro Martins",
      username: "@pedro_escritor",
      category: "Letra",
      followers: 9500,
      works: 27,
      rating: 4.7,
      avatar: "📖",
      isFollowing: false
    }
  ]);

  const [filteredArtists, setFilteredArtists] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortBy, setSortBy] = useState('rating');

  // Handlers para monetização
  const handleMonetizeClick = (username) => {
    setMonetizationUsername(username);
    setShowMonetization(true);
    document.body.style.overflow = 'hidden';
  };

  const handleCloseMonetization = () => {
    setShowMonetization(false);
    document.body.style.overflow = '';
  };

  // Funções para artistas
  const normalizeCategory = (category) => {
    return category.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  };

  const filterArtists = (category) => {
    if (category === 'all') {
      return artistsData;
    }
    return artistsData.filter(artist => 
      normalizeCategory(artist.category) === category
    );
  };

  const sortArtists = (artists, criteria) => {
    const sorted = [...artists];
    switch(criteria) {
      case 'rating':
        return sorted.sort((a, b) => b.rating - a.rating);
      case 'followers':
        return sorted.sort((a, b) => b.followers - a.followers);
      case 'newest':
        return sorted.sort((a, b) => b.id - a.id);
      default:
        return sorted;
    }
  };

  // Aplicar filtros e ordenação
  useEffect(() => {
    const filtered = filterArtists(activeFilter);
    const sorted = sortArtists(filtered, sortBy);
    setFilteredArtists(sorted);
  }, [activeFilter, sortBy, artistsData]);

  // Handler para filtrar
  const handleFilterClick = (filter) => {
    setActiveFilter(filter);
  };

  // Handler para ordenar
  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };

  // Handler para botão seguir
  const handleFollowClick = (artistId) => {
    setArtistsData(prevArtists => 
      prevArtists.map(artist => 
        artist.id === artistId 
          ? { 
              ...artist, 
              isFollowing: !artist.isFollowing,
              followers: artist.isFollowing ? artist.followers - 1 : artist.followers + 1
            } 
          : artist
      )
    );
  };

  // Renderizar estrelas de avaliação
  const renderStars = (rating) => {
    const fullStars = '★'.repeat(Math.floor(rating));
    const emptyStars = '☆'.repeat(5 - Math.floor(rating));
    return fullStars + emptyStars;
  };

  return (
    <>
      <HeaderForYou />
      
      {/* Conteúdo Principal */}
      <div className="container">
        <h1 className="page-title">Artistas em Destaque</h1>
        <p className="page-subtitle">
          Descubra os artistas mais populares e bem avaliados da plataforma
        </p>
        
        {/* Filtros */}
        <div className="filters">
          <div className="filter-buttons">
            <button 
              className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
              onClick={() => handleFilterClick('all')}
            >
              Todos
            </button>
            <button 
              className={`filter-btn ${activeFilter === 'musica' ? 'active' : ''}`}
              onClick={() => handleFilterClick('musica')}
            >
              Música
            </button>
            <button 
              className={`filter-btn ${activeFilter === 'letra' ? 'active' : ''}`}
              onClick={() => handleFilterClick('letra')}
            >
              Letra
            </button>
            <button 
              className={`filter-btn ${activeFilter === 'arte' ? 'active' : ''}`}
              onClick={() => handleFilterClick('arte')}
            >
              Arte
            </button>
          </div>
          
          <div className="sort-select">
            <label htmlFor="sort-by">Ordenar por:</label>
            <select id="sort-by" value={sortBy} onChange={handleSortChange}>
              <option value="rating">Maior Avaliação</option>
              <option value="followers">Mais Seguidos</option>
              <option value="newest">Mais Recentes</option>
            </select>
          </div>
        </div>
        
        {/* Grid de Artistas */}
        <div className="artists-grid">
          {filteredArtists.map(artist => (
            <div key={artist.id} className="artist-card" data-category={normalizeCategory(artist.category)}>
              <div className="artist-header">
                <div className="artist-avatar">{artist.avatar}</div>
              </div>
              
              <div className="artist-info">
                <h3 className="artist-name">{artist.name}</h3>
                <span className="artist-category">{artist.category}</span>
                
                <div className="artist-stats">
                  <div className="stat">
                    <div className="stat-value">{artist.followers.toLocaleString()}</div>
                    <div className="stat-label">Seguidores</div>
                  </div>
                  <div className="stat">
                    <div className="stat-value">{artist.works}</div>
                    <div className="stat-label">Obras</div>
                  </div>
                </div>
                
                <div className="artist-rating">
                  <div className="rating-stars">{renderStars(artist.rating)}</div>
                  <span className="rating-value">{artist.rating}</span>
                </div>
                
                <div className="artist-actions">
                  <button 
                    className={`btn-follow ${artist.isFollowing ? 'seguindo' : ''}`}
                    onClick={() => handleFollowClick(artist.id)}
                  >
                    {artist.isFollowing ? 'Seguindo' : 'Seguir'}
                  </button>
                  <button 
                    className="btn-monetize"
                    onClick={() => handleMonetizeClick(artist.username)}
                  >
                    <i className="fa-solid fa-sack-dollar"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pop-up de Monetização */}
      <MonetizationPopup
        show={showMonetization}
        onClose={handleCloseMonetization}
        username={monetizationUsername}
      />
    </>
  );
};

export default ForYou;