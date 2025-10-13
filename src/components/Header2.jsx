import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import logo from '../images/ArtBeat_Branco.png';
import styles from '../css/Header.module.css';
import user from '../redux/usuariosSlice';

const HeaderForYou = () => {
  const location = useLocation();

  const isActiveLink = (path) => {
    const currentPath = location.pathname.replace('/', '');
    const comparePath = path.replace('/', '');
    return (currentPath === '' && path === 'feed') || currentPath === comparePath;
  };

  return (
    <div className={`${styles.topo} container-fluid`}>
      <header className="w-100">
        <nav className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center">
            <img src={logo} className={styles.logo} alt="logo art beat" />
          </div>
          <ul className={`${styles.menu} mb-0`}>
            <li>
              <Link to="/feed" className={isActiveLink('feed') ? styles.enfase : ''}>Feed</Link>
            </li>
            <li>
              <Link to="/populares" className={isActiveLink('populares') ? styles.enfase : ''}>Populares</Link>
            </li>
            <li>
              <Link to="/discover" className={isActiveLink('discover') ? styles.enfase : ''}>Aleatórios</Link>
            </li>
            <li>
              <Link to="/Ldesafios" className={isActiveLink('desafios') ? styles.enfase : ''}>Desafios</Link>
            </li>
            <li>
              <Link to="/user/juanm">
                <i className={`fa-solid fa-circle-user fa-xl ${styles.perfilIcon}`}></i>
              </Link>
            </li>
          </ul>
        </nav>
      </header>
    </div>
  );
};

export default HeaderForYou;
