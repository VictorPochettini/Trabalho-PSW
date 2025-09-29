import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

const FloatingActionButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const fabRef = useRef(null);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  // Fechar o menu ao clicar fora dele
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (fabRef.current && !fabRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="floating-actions">
      <div 
        className={`fab-container ${isOpen ? 'active' : ''}`} 
        ref={fabRef}
      >
        <button 
          className={`fab-main ${isOpen ? 'open' : ''}`} 
          onClick={toggleMenu}
          aria-label={isOpen ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={isOpen}
        >
          <i className="fas fa-plus"></i>
        </button>

        <div className={`fab-menu ${isOpen ? 'open' : ''}`}>
          <Link to="/publicar/musica" className="fab-sub" title="Publicar Música" onClick={() => setIsOpen(false)}>
            <i className="fas fa-music"></i> Publicar Música
          </Link>
          <Link to="/publicar/imagem" className="fab-sub" title="Publicar Arte" onClick={() => setIsOpen(false)}>
            <i className="fas fa-image"></i> Publicar Imagem
          </Link>
          <Link to="/publicar/letra" className="fab-sub" title="Publicar Letra" onClick={() => setIsOpen(false)}>
            <i className="fas fa-feather"></i> Publicar Letra
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FloatingActionButton;