import React, { useState, useEffect } from 'react';
import HeaderForYou from '../components/Header2';
import MonetizationPopup from '../components/MonetizationPopup';
import styles from '../css/ForYou.module.css';

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
      
      <div className={styles.container}>
        <h1 className={styles.pageTitle}>Artistas em Destaque</h1>
        <p className={styles.pageSubtitle}>
          Descubra os artistas mais populares e bem avaliados da plataforma
        </p>
        
        <div className={styles.filters}>
          <div className={styles.filterButtons}>
            <button 
              className={`${styles.filterBtn} ${activeFilter === 'all' ? styles.active : ''}`}
              onClick={() => handleFilterClick('all')}
            >
              Todos
            </button>
            <button 
              className={`${styles.filterBtn} ${activeFilter === 'musica' ? styles.active : ''}`}
              onClick={() => handleFilterClick('musica')}
            >
              Música
            </button>
            <button 
              className={`${styles.filterBtn} ${activeFilter === 'letra' ? styles.active : ''}`}
              onClick={() => handleFilterClick('letra')}
            >
              Letra
            </button>
            <button 
              className={`${styles.filterBtn} ${activeFilter === 'arte' ? styles.active : ''}`}
              onClick={() => handleFilterClick('arte')}
            >
              Arte
            </button>
          </div>
          
          <div className={styles.sortSelect}>
            <label htmlFor="sort-by">Ordenar por:</label>
            <select id="sort-by" value={sortBy} onChange={handleSortChange}>
              <option value="rating">Maior Avaliação</option>
              <option value="followers">Mais Seguidos</option>
              <option value="newest">Mais Recentes</option>
            </select>
          </div>
        </div>
        
        <div className={styles.artistsGrid}>
          {filteredArtists.map(artist => (
            <div key={artist.id} className={styles.artistCard} data-category={normalizeCategory(artist.category)}>
              <div className={styles.artistHeader}>
                <div className={styles.artistAvatar}>{artist.avatar}</div>
              </div>
              
              <div className={styles.artistInfo}>
                <h3 className={styles.artistName}>{artist.name}</h3>
                <span className={styles.artistCategory}>{artist.category}</span>
                
                <div className={styles.artistStats}>
                  <div className={styles.stat}>
                    <div className={styles.statValue}>{artist.followers.toLocaleString()}</div>
                    <div className={styles.statLabel}>Seguidores</div>
                  </div>
                  <div className={styles.stat}>
                    <div className={styles.statValue}>{artist.works}</div>
                    <div className={styles.statLabel}>Obras</div>
                  </div>
                </div>
                
                <div className={styles.artistRating}>
                  <div className={styles.ratingStars}>{renderStars(artist.rating)}</div>
                  <span className={styles.ratingValue}>{artist.rating}</span>
                </div>
                
                <div className={styles.artistActions}>
                  <button 
                    className={`${styles.btnFollow} ${artist.isFollowing ? styles.seguindo : ''}`}
                    onClick={() => handleFollowClick(artist.id)}
                  >
                    {artist.isFollowing ? 'Seguindo' : 'Seguir'}
                  </button>
                  <button 
                    className={styles.btnMonetize}
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

      <MonetizationPopup
        show={showMonetization}
        onClose={handleCloseMonetization}
        username={monetizationUsername}
      />
    </>
  );
};

export default ForYou;
