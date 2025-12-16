import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

/**
 * @fileoverview Guard de rota (ProtectedRoute).
 * @module ProtectedRoute
 * @description
 * Componente que renderiza `children` apenas quando há usuário autenticado no Redux.
 * Caso contrário, redireciona para `/login`.
 */

/**
 * @typedef {object} ProtectedRouteProps
 * @property {React.ReactNode} children Os elementos filhos (as rotas/componentes protegidos) que serão renderizados se o usuário estiver autenticado.
 */

/**
 * Componente de Proteção de Rota (Guard).
 *
 * Ele verifica o estado de autenticação do usuário através do Redux.
 * Se o usuário NÃO estiver logado (`!currentUser`), ele redireciona o usuário para a página de login (`/login`)
 * usando o componente `Maps` do `react-router-dom`.
 * Se o usuário estiver logado, ele renderiza os componentes filhos (`children`).
 *
 * @param {ProtectedRouteProps} props As propriedades do componente.
 * @returns {JSX.Element} O componente filho ou um redirecionamento (`<Navigate>`).
 */

export default function ProtectedRoute({ children }) {
  // Usa o Redux para verificar se há um usuário logado
  const currentUser = useSelector(state => state.user.currentUser);

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
