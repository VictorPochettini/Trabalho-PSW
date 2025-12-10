// src/pages/EdicaoDeConta.jsx - COM UPLOAD REAL DE FOTO
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateUser } from "../redux/usuariosSlice";
import { useNavigate } from "react-router-dom";
import avatarPadrao from "../images/avatarPadrao.png";

const EdicaoDeConta = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const currentUserState = useSelector((state) => state.user?.currentUser ?? null);
  const user = currentUserState?.user ?? null;
  const token = currentUserState?.token;

  const [nomeUsuario, setNomeUsuario] = useState("");
  const [bio, setBio] = useState("");
  const [generosMusicais, setGenerosMusicais] = useState("");
  const [estilosArte, setEstilosArte] = useState("");
  const [previewUrl, setPreviewUrl] = useState(avatarPadrao);
  
  // ✅ NOVOS ESTADOS para upload
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState(null);

  const API_URL = 'http://localhost:5000';

  useEffect(() => {
    if (!user) return;
    setNomeUsuario(user.username ?? user.nome ?? "");
    setBio(user.bio ?? "");
    
    if (Array.isArray(user.generosMusicais)) {
      setGenerosMusicais(user.generosMusicais.join(", "));
    } else {
      setGenerosMusicais(user.generosMusicais ?? "");
    }
    
    if (Array.isArray(user.estilosArte)) {
      setEstilosArte(user.estilosArte.join(", "));
    } else {
      setEstilosArte(user.estilosArte ?? "");
    }
    
    // ✅ Construir URL correta da foto
    if (user.fotoPerfil) {
      if (user.fotoPerfil.startsWith('data:')) {
        setPreviewUrl(user.fotoPerfil);
      } else if (user.fotoPerfil.startsWith('http')) {
        setPreviewUrl(user.fotoPerfil);
      } else {
        setPreviewUrl(`${API_URL}/${user.fotoPerfil}`);
      }
    } else {
      setPreviewUrl(avatarPadrao);
    }
  }, [user, API_URL]);

  // ✅ NOVO: handleFileChange com preview E armazenar arquivo
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    
    if (!file) return;
    
    // Validar tipo
    if (!file.type.startsWith("image/")) {
      alert('Por favor, selecione uma imagem válida (JPG, PNG, etc.)');
      return;
    }
    
    // Validar tamanho (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Imagem muito grande! Máximo 5MB');
      return;
    }
    
    // Armazenar arquivo para upload posterior
    setSelectedFile(file);
    
    // Preview imediato
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreviewUrl(event.target.result);
    };
    reader.readAsDataURL(file);
    
    console.log('📸 Arquivo selecionado:', file.name, 'Tamanho:', (file.size / 1024).toFixed(2) + 'KB');
  };

  // ✅ NOVO: Função para fazer upload da foto
  const uploadProfilePhoto = async () => {
    if (!selectedFile || !user || !token) return null;
    
    const userId = user._id || user.id;
    
    setUploadingPhoto(true);
    setPhotoError(null);
    
    try {
      const formData = new FormData();
      formData.append('profilePhoto', selectedFile);
      
      console.log('📤 Fazendo upload da foto de perfil...');
      
      const response = await fetch(`${API_URL}/usuarios/${userId}/profile-photo`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao fazer upload da foto');
      }
      
      const data = await response.json();
      console.log('✅ Foto enviada com sucesso:', data);
      
      return data.fotoPerfil; // Retorna o caminho da foto salva
      
    } catch (error) {
      console.error('❌ Erro ao fazer upload da foto:', error);
      setPhotoError(error.message);
      throw error;
    } finally {
      setUploadingPhoto(false);
    }
  };

  // ✅ ATUALIZADO: handleSubmit com upload de foto
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      return alert("Usuário não carregado.");
    }

    try {
      // 1️⃣ Se tem foto nova, fazer upload primeiro
      let fotoPerfilPath = user.fotoPerfil; // Mantém a foto atual
      
      if (selectedFile) {
        console.log('🔄 Fazendo upload da nova foto...');
        fotoPerfilPath = await uploadProfilePhoto();
      }

      // 2️⃣ Atualizar dados do usuário
      const dadosAtualizados = {
        username: nomeUsuario?.trim(),
        bio: bio ?? "",
        generosMusicais: generosMusicais ?? "",
        estilosArte: estilosArte ?? "",
        fotoPerfil: fotoPerfilPath, // ✅ Usa o caminho retornado pelo upload
      };

      console.log('💾 Salvando dados do usuário...', dadosAtualizados);
      
      await dispatch(updateUser(dadosAtualizados)).unwrap();
      
      alert('✅ Perfil atualizado com sucesso!');
      
      // Navegar para o perfil
      navigate(`/user/${dadosAtualizados.username}`);
      
    } catch (err) {
      console.error("❌ Erro ao atualizar perfil:", err);
      alert(err?.message || "Não foi possível salvar. Tente novamente.");
    }
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

        <div style={styles.avatarWrapper}>
          <div style={styles.avatarContainer}>
            <img
              id="fotoPerfil"
              src={previewUrl}
              alt="Foto de perfil"
              style={styles.fotoPerfil}
              onError={(e) => {
                console.log("❌ Erro ao carregar imagem:", previewUrl);
                e.target.src = avatarPadrao;
              }}
            />
            <label htmlFor="fileInput" style={styles.uploadBtn} title="Alterar foto">
              {uploadingPhoto ? '⏳' : '+'}
            </label>
            <input
              type="file"
              id="fileInput"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: "none" }}
              disabled={uploadingPhoto}
            />
          </div>
        </div>

        {/* ✅ NOVO: Feedback de upload */}
        {uploadingPhoto && (
          <p style={{ textAlign: 'center', color: '#fff', marginBottom: '10px' }}>
            📤 Enviando foto...
          </p>
        )}
        
        {photoError && (
          <p style={{ textAlign: 'center', color: '#ff6b6b', marginBottom: '10px' }}>
            ❌ {photoError}
          </p>
        )}
        
        {selectedFile && !uploadingPhoto && (
          <p style={{ textAlign: 'center', color: '#4ecdc4', marginBottom: '10px' }}>
            ✅ Nova foto selecionada: {selectedFile.name}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <label style={styles.label}>Nome de usuário:</label>
          <input
            id="nameUser"
            name="nomeUsuario"
            style={styles.input}
            type="text"
            value={nomeUsuario}
            onChange={(e) => setNomeUsuario(e.target.value)}
            required
          />

          <label style={styles.label}>Biografia:</label>
          <textarea
            id="bio"
            name="bio"
            style={styles.bio}
            rows="6"
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
              <option value="">— Selecione / Ou use o campo acima —</option>
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
              <option value="">— Selecione / Ou use o campo acima —</option>
              <option value="ilustracao-digital">Ilustração Digital</option>
              <option value="ilustracao-manual">Ilustração Manual</option>
              <option value="minimalismo">Minimalismo</option>
              <option value="arte-grafica">Arte Gráfica</option>
              <option value="surrealismo">Surrealismo</option>
              <option value="pop-art">Pop-art</option>
            </select>
          </div>

          <button 
            style={{
              ...styles.salvarBtn,
              opacity: uploadingPhoto ? 0.6 : 1,
              cursor: uploadingPhoto ? 'not-allowed' : 'pointer'
            }} 
            type="submit"
            disabled={uploadingPhoto}
          >
            {uploadingPhoto ? '⏳ Enviando...' : 'Salvar'}
          </button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  body: {
    background: "linear-gradient(135deg, #050225 0%, #1a0f3c 40%, #5e17eb 100%)",
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "40px 20px",
    position: "relative",
    overflow: "auto",
  },
  container: {
    background: "linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05))",
    backdropFilter: "blur(15px)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
    borderRadius: "20px",
    padding: "30px",
    maxWidth: "600px",
    width: "100%",
    maxHeight: "90vh",
    overflowY: "auto",
    position: "relative",
    zIndex: 1,
  },
  backButton: {
    background: "transparent",
    border: "none",
    color: "#fff",
    fontSize: "16px",
    cursor: "pointer",
    marginBottom: "20px",
    padding: "8px 12px",
    borderRadius: "8px",
    transition: "background 0.3s",
  },
  avatarWrapper: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "30px",
    width: "100%",
  },
  avatarContainer: {
    position: "relative",
    width: "150px",
    height: "150px",
    flexShrink: 0,
  },
  fotoPerfil: {
    width: "100%",
    height: "100%",
    borderRadius: "50%",
    objectFit: "cover",
    border: "3px solid #4713af",
    display: "block",
  },
  uploadBtn: {
    position: "absolute",
    bottom: "0",
    right: "0",
    background: "#4713af",
    borderRadius: "50%",
    width: "50px",
    height: "50px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontSize: "30px",
    cursor: "pointer",
    border: "none",
    transition: "0.3s",
  },
  label: {
    display: "block",
    color: "#ffffff",
    fontWeight: "500",
    textAlign: "left",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    paddingBottom: "15px",
    paddingTop: "10px",
  },
  input: {
    width: "100%",
    backgroundColor: "rgb(213, 213, 213)",
    borderRadius: "12px",
    border: "none",
    height: "40px",
    paddingLeft: "10px",
    outline: "none",
    fontFamily: "Verdana, Geneva, Tahoma, sans-serif",
    marginBottom: "10px",
  },
  bio: {
    width: "100%",
    backgroundColor: "rgb(213, 213, 213)",
    borderRadius: "12px",
    border: "none",
    minHeight: "100px",
    paddingLeft: "10px",
    paddingTop: "10px",
    outline: "none",
    fontFamily: "Verdana, Geneva, Tahoma, sans-serif",
    resize: "vertical",
    marginBottom: "10px",
  },
  generoContainer: {
    width: "100%",
    marginBottom: "15px",
  },
  generoSelect: {
    width: "100%",
    padding: "10px",
    borderRadius: "12px",
    border: "none",
    backgroundColor: "rgb(213, 213, 213)",
    fontSize: "15px",
    cursor: "pointer",
  },
  salvarBtn: {
    padding: "15px 20px",
    borderRadius: "40px",
    fontSize: "20px",
    fontWeight: "600",
    cursor: "pointer",
    border: "none",
    background: "#5e17eb",
    color: "white",
    transition: "all 0.4s ease",
    width: "100%",
    marginTop: "20px",
  },
};

export default EdicaoDeConta;