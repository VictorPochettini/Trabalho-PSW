// HEADER
import React, { useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import logo from '../images/ArtBeat_Branco.png';
import styles from '../css/Header.module.css';
import { useSelector, useDispatch } from "react-redux";

const HeaderForYou = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const currentUser = useSelector((state) => state.user.currentUser);

  const isActiveLink = (path) => {
    const currentPath = location.pathname.replace('/', '');
    const comparePath = path.replace('/', '');
    return (currentPath === '' && path === 'feed') || currentPath === comparePath;
  };

  const handleLogout = () => {
    try { localStorage.removeItem('token'); } catch (e) {}
    dispatch({ type: 'user/logout' });
    navigate('/login', { replace: true });
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <div className={`${styles.topo} container-fluid`}>
      <header className={styles.headerWrap}>
        <nav className={styles.navbar}>
          <div className={styles.navLeft}>
            <Link to="/feed" className={styles.brand}>
              <img src={logo} className={styles.logo} alt="logo art beat" />
              <span className={styles.brandText}>ArtBeat</span>
            </Link>
          </div>

          {/* Menu Hamburger para mobile */}
          <button 
            className={styles.menuToggle}
            onClick={toggleMenu}
            aria-label="Abrir menu"
            aria-expanded={isMenuOpen}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

          {/* Overlay para mobile */}
          {isMenuOpen && (
            <div className={styles.menuOverlay} onClick={closeMenu}></div>
          )}

          {/* Menu principal */}
          <ul className={`${styles.menu} ${isMenuOpen ? styles.menuOpen : ''}`}>
            <li>
              <Link 
                to="/feed" 
                className={`${styles.navLink} ${isActiveLink('feed') ? styles.enfase : ''}`}
                onClick={closeMenu}
                aria-current={isActiveLink('feed') ? 'page' : undefined}
              >
                <i className="fa-solid fa-house" aria-hidden="true"></i>
                <span>Feed</span>
              </Link>
            </li>
            <li>
              <Link 
                to="/populares" 
                className={`${styles.navLink} ${isActiveLink('populares') ? styles.enfase : ''}`}
                onClick={closeMenu}
                aria-current={isActiveLink('populares') ? 'page' : undefined}
              >
                <i className="fa-solid fa-fire" aria-hidden="true"></i>
                <span>Populares</span>
              </Link>
            </li>
            <li>
              <Link 
                to="/discover" 
                className={`${styles.navLink} ${isActiveLink('discover') ? styles.enfase : ''}`}
                onClick={closeMenu}
                aria-current={isActiveLink('discover') ? 'page' : undefined}
              >
                <i className="fa-solid fa-shuffle" aria-hidden="true"></i>
                <span>Aleatórios</span>
              </Link>
            </li>
            <li>
              <Link 
                to="/desafios" 
                className={`${styles.navLink} ${isActiveLink('desafios') ? styles.enfase : ''}`}
                onClick={closeMenu}
                aria-current={isActiveLink('desafios') ? 'page' : undefined}
              >
                <i className="fa-solid fa-trophy" aria-hidden="true"></i>
                <span>Desafios</span>
              </Link>
            </li>
          </ul>

          <div className={styles.rightBox}>
            <Link
              to={`/user/${currentUser?.username ?? ''}`}
              className={styles.profileBtn}
              title="Meu perfil"
            >
              <i className={`fa-solid fa-circle-user ${styles.perfilIcon}`} aria-hidden="true"></i>
              <span className={styles.profileName}>
                {currentUser?.username ?? 'Perfil'}
              </span>
            </Link>

            <button
              type="button"
              className={styles.logoutBtn}
              onClick={handleLogout}
            >
              <i className="fa-solid fa-right-from-bracket" aria-hidden="true"></i>
              <span className={styles.logoutText}>Sair</span>
            </button>
          </div>
        </nav>
      </header>
    </div>
  );
};

export default HeaderForYou;