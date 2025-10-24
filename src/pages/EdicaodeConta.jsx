import { useDispatch, useSelector } from "react-redux";
import { updateUser } from "../redux/usuariosSlice";
import { useNavigate } from "react-router-dom";
import React, { useEffect, useState } from 'react';

const EdicaoDeConta = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentUser } = useSelector((state) => state.user);

  const [nomeUsuario, setNomeUsuario] = useState(currentUser.username);
  const [bio, setBio] = useState(currentUser.bio);
  const [generosMusicais, setGenerosMusicais] = useState(currentUser.generosMusicais || []);
  const [estilosArte, setEstilosArte] = useState(currentUser.estilosArte || []);
  const [previewUrl, setPreviewUrl] = useState(currentUser.fotoPerfil);

    const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const dadosAtualizados = {
      username: nomeUsuario,
      bio,
      generosMusicais,
      estilosArte,
      fotoPerfil: previewUrl,
    };

    await dispatch(updateUser(dadosAtualizados));
    navigate(`/user/${nomeUsuario}`);
  };
  return (
    <div style={styles.body}>
      <div style={styles.container}>
        <button 
          onClick={() => navigate(-1)} 
          style={styles.backButton}
          aria-label="Voltar"
        >
          ← Voltar
        </button>

        <center>
          <div style={styles.avatarContainer}>
            <img 
              id="fotoPerfil" 
              src={previewUrl} 
              alt="Foto de perfil" 
              style={styles.fotoPerfil}
            />
            <label htmlFor="fileInput" style={styles.uploadBtn}>
              +
            </label>
            <input 
              type="file" 
              id="fileInput" 
              accept="image/*" 
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </div>
        </center>

        <form onSubmit={handleSubmit}>
          <label style={styles.label}>Nome de usuário:</label>
          <input 
            id="nameUser" 
            name="nomeUsuario" 
            style={styles.input} 
            type="text"
            value={nomeUsuario}
            onChange={(e) => setNomeUsuario(e.target.value)}
          />

          <label style={styles.label}>Biografia:</label>
          <textarea 
            id="bio" 
            name="bio" 
            style={styles.bio} 
            rows="10" 
            cols="50"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />

          <label style={styles.label}>Gêneros Musicais de Interesse:</label>
          <div style={styles.generoContainer}>
            <select 
              style={styles.generoSelect}
              value={generosMusicais}
              onChange={(e) => setGenerosMusicais(e.target.value)}
            >
              <option value="" disabled>Gêneros Musicais</option>
              <option value="blues">Blues</option>
              <option value="classica">Clássica</option>
              <option value="country">Country</option>
              <option value="eletronica">Música Eletrônica</option>
              <option value="folk">Folk</option>
              <option value="funk">Funk</option>
              <option value="gospel">Gospel</option>
              <option value="hiphop">Hip-Hop / Rap</option>
              <option value="jazz">Jazz</option>
              <option value="metal">Metal</option>
              <option value="musica-latina">Música Latina</option>
              <option value="new-age">New Age</option>
              <option value="pop">Pop</option>
              <option value="punk">Punk</option>
              <option value="reggae">Reggae</option>
              <option value="reggaeton">Reggaeton</option>
              <option value="rnb">R&B</option>
              <option value="rock">Rock</option>
              <option value="soul">Soul</option>
            </select>
          </div>

          <label style={styles.label}>Estilos de Artes de Interesse:</label>
          <div style={styles.generoContainer}>
            <select 
              style={styles.generoSelect}
              value={estilosArte}
              onChange={(e) => setEstilosArte(e.target.value)}
            >
              <option value="" disabled>Estilo de Arte</option>
              <option value="ilustracao-digital">Ilustração Digital</option>
              <option value="ilustracao-manual">Ilustração Manual</option>
              <option value="minimalismo">Minimalismo</option>
              <option value="arte-grafica">Arte Gráfica</option>
              <option value="surrealismo">Surrealismo</option>
              <option value="pop-art">Pop-art</option>
            </select>
          </div>

          <button style={styles.salvarBtn} type="submit">
            Salvar
          </button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  body: {
    background: 'linear-gradient(135deg, #050225 0%, #1a0f3c 40%, #5e17eb 100%)',
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '40px 20px',
    position: 'relative',
    overflow: 'auto',
  },
  container: {
    background: 'linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05))',
    backdropFilter: 'blur(15px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
    borderRadius: '20px',
    padding: '30px',
    maxWidth: '600px',
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
    position: 'relative',
    zIndex: 1,
  },
  backButton: {
    background: 'transparent',
    border: 'none',
    color: '#fff',
    fontSize: '16px',
    cursor: 'pointer',
    marginBottom: '20px',
    padding: '8px 12px',
    borderRadius: '8px',
    transition: 'background 0.3s',
  },
    avatarContainer: {
    position: 'relative',
    display: 'block',
    width: '150px',
    height: '150px',
    marginBottom: '30px',
    margin: '0 auto 30px auto',
  },
  fotoPerfil: {
    width: '150px',
    height: '150px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '3px solid #4713af',
  },
  uploadBtn: {
    position: 'absolute',
    bottom: '0',
    right: '0',
    background: '#4713af',
    borderRadius: '50%',
    width: '50px',
    height: '50px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '30px',
    cursor: 'pointer',
    border: 'none',
    transition: '0.3s',
  },
  label: {
    display: 'block',
    color: '#ffffff',
    fontWeight: '500',
    textAlign: 'left',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    paddingBottom: '15px',
    paddingTop: '10px',
  },
  input: {
    width: '100%',
    backgroundColor: 'rgb(213, 213, 213)',
    borderRadius: '12px',
    border: 'none',
    height: '40px',
    paddingLeft: '10px',
    outline: 'none',
    fontFamily: 'Verdana, Geneva, Tahoma, sans-serif',
    marginBottom: '10px',
  },
  bio: {
    width: '100%',
    backgroundColor: 'rgb(213, 213, 213)',
    borderRadius: '12px',
    border: 'none',
    minHeight: '100px',
    paddingLeft: '10px',
    paddingTop: '10px',
    outline: 'none',
    fontFamily: 'Verdana, Geneva, Tahoma, sans-serif',
    resize: 'vertical',
    marginBottom: '10px',
  },
  generoContainer: {
    width: '100%',
    marginBottom: '15px',
  },
  generoSelect: {
    width: '100%',
    padding: '10px',
    borderRadius: '12px',
    border: 'none',
    backgroundColor: 'rgb(213, 213, 213)',
    fontSize: '15px',
    cursor: 'pointer',
  },
  salvarBtn: {
    padding: '15px 20px',
    borderRadius: '40px',
    fontSize: '20px',
    fontWeight: '600',
    cursor: 'pointer',
    border: 'none',
    background: '#5e17eb',
    color: 'white',
    transition: 'all 0.4s ease',
    width: '100%',
    marginTop: '20px',
  },
};

export default EdicaoDeConta;