import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

/**
 * Componente de Efeito para Redirecionamento Condicional.
 *
 * Este componente verifica o estado de autenticação do usuário através do Redux.
 * Se um usuário for encontrado (`currentUser !== null`), ele imediatamente
 * redireciona o usuário para a rota `/feed`.
 *
 * É ideal para ser usado em rotas que só devem ser acessíveis a usuários deslogados,
 * como as páginas de Login e Registro.
 *
 * @returns {null} O componente não renderiza nada na UI, sua função é apenas o efeito colateral (redirecionamento).
 */

const RedirectIfLoggedIn = () => {
  const currentUser = useSelector(state => state.user.currentUser);
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser !== null) {
      navigate('/feed', { replace: true }); // redireciona para /feed
    }
  }, [currentUser, navigate]); // executa sempre que currentUser mudar

  return null; // esse componente não precisa renderizar nada
};

export default RedirectIfLoggedIn;
