// src/components/layout/PublicarLayout.jsx
import React from "react";

/**
 * Layout simples para páginas de publicar.
 * Mantive o wrapper minimalista para aplicar estilos globais de "publicar".
 */
const PublicarLayout = ({ children }) => {
  return <div className="publicar-page">{children}</div>;
};

export default PublicarLayout;
