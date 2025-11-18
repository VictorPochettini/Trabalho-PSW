import React from "react";
import { Link } from "react-router-dom";
import styles from "../css/Login.module.css"; // reutiliza .entrarbtn

/**
 * Botão-link com o estilo do "Entrar"
 * Uso: <CTAButtonLink to="/minha-rota">Ir para página</CTAButtonLink>
 */
export default function CTAButtonLink({ to, children }) {
  return (
    <Link to={to} className={styles.entrarbtn} role="button">
      {children}
    </Link>
  );
}
