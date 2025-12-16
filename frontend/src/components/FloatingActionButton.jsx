import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

/**
 * Componente de botão de ação flutuante (FAB - Floating Action Button) que exibe um menu de opções de publicação.
 * 
 * Este componente exibe um botão flutuante que, quando clicado, expande para mostrar opções de publicação
 * (Música, Imagem, Texto). O menu fecha automaticamente ao clicar fora dele.
 * 
 * @component
 * @example
 * // Uso básico
 * <FloatingActionButton />
 * 
 * @returns {JSX.Element} Retorna o componente do botão de ação flutuante
 */
const FloatingActionButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const fabRef = useRef(null);

  /**
   * Alterna o estado de abertura/fechamento do menu de opções
   * @function
   * @returns {void}
   */
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  /**
   * Efeito que gerencia o fechamento do menu ao clicar fora dele
   * @effect
   * @listens mousedown
   * @returns {Function} Função de limpeza que remove o event listener
   */
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
          <Link to="/publicar/texto" className="fab-sub" title="Publicar Letra" onClick={() => setIsOpen(false)}>
            <i className="fas fa-feather"></i> Publicar Texto
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FloatingActionButton;