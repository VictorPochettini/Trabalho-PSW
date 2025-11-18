import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

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
