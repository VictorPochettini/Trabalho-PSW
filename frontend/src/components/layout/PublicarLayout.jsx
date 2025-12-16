/**
 * @fileoverview Layout base para páginas de publicação.
 * @module PublicarLayout
 * @description
 * Fornece um wrapper consistente para páginas de criação/edição de conteúdo.
 * Aplica a classe CSS `publicar-page` para estilização específica.
 */

import React from "react";

/**
 * Layout base para páginas de publicação (ex: criar/editar post).
 *
 * @component
 * @param {Object} props - As propriedades do componente.
 * @param {React.ReactNode} props.children - Conteúdo a ser renderizado dentro do layout.
 * @returns {JSX.Element} Elemento React que envolve o conteúdo com a classe `publicar-page`.
 */
const PublicarLayout = ({ children }) => {
  return <div className="publicar-page">{children}</div>;
};

export default PublicarLayout;
