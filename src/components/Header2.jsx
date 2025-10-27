//HEADER
import React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import logo from '../images/ArtBeat_Branco.png';
import styles from '../css/Header.module.css';
import { useSelector, useDispatch } from "react-redux";

const HeaderForYou = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const currentUser = useSelector((state) => state.user.currentUser);

  const isActiveLink = (path) => {
    const currentPath = location.pathname.replace('/', '');
    const comparePath = path.replace('/', '');
    return (currentPath === '' && path === 'feed') || currentPath === comparePath;
  };

  const handleLogout = () => {
    // Se você ainda usa token em algum fluxo, também removemos
    try { localStorage.removeItem('token'); } catch (e) {}
    dispatch({ type: 'user/logout' });
    navigate('/login', { replace: true });
  };

  return (
    <div className={`${styles.topo} container-fluid`}>
      <header className={styles.headerWrap}>
        <nav className={styles.navbar}>
          <Link to="/feed" className={styles.brand}>
            <img src={logo} className={styles.logo} alt="logo art beat" />
            <span className={styles.brandText}>ArtBeat</span>
          </Link>

          <ul className={styles.menu}>
            <li>
              <Link to="/feed" className={`${styles.navLink} ${isActiveLink('feed') ? styles.enfase : ''}`} aria-current={isActiveLink('feed') ? 'page' : undefined}>Feed</Link>
            </li>
            <li>
              <Link to="/populares" className={`${styles.navLink} ${isActiveLink('populares') ? styles.enfase : ''}`} aria-current={isActiveLink('populares') ? 'page' : undefined}>Populares</Link>
            </li>
            <li>
              <Link to="/discover" className={`${styles.navLink} ${isActiveLink('discover') ? styles.enfase : ''}`} aria-current={isActiveLink('discover') ? 'page' : undefined}>Aleatórios</Link>
            </li>
            <li>
              <Link to="/desafios" className={`${styles.navLink} ${isActiveLink('desafios') ? styles.enfase : ''}`} aria-current={isActiveLink('desafios') ? 'page' : undefined}>Desafios</Link>
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
