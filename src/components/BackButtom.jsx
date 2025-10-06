import { useNavigate } from 'react-router-dom';
import botaoVolta from '../images/para/botaoVolta.png';
import styles from './SeuStyles.module.css';

const BackButton = () => {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      className={styles.backButton}
      onClick={() => navigate(-1)} // volta uma página
    >
      <img src={botaoVolta} alt="Voltar" />
    </button>
  );
};

export default BackButton;
