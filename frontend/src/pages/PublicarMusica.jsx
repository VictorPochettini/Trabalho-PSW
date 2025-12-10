// src/pages/PublicarMusica.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { createPostWithUpload } from "../redux/postsSlice";
import PublicarLayout from "../components/layout/PublicarLayout";
import DescricaoInput from "../components/publicar/DescricaoInput";
import GeneroSelect from "../components/publicar/GeneroSelect";
import UploadArea from "../components/publicar/UploadArea";
import EnviarButton from "../components/publicar/EnviarButton";
import botaoVolta from "../images/botaoVolta.png";
import "../css/publicar.css";
import styles from "../css/Login.module.css";

const BackButton = () => {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      className={styles.backButton}
      onClick={() => navigate(-1)}
    >
      <img src={botaoVolta} alt="Voltar" />
    </button>
  );
};

const PublicarMusica = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const currentUserState = useSelector((s) => s.user?.currentUser);
  const currentUser = currentUserState?.user ?? currentUserState ?? null;
  const userId = currentUser?._id ?? currentUser?.id ?? null;
  const username = currentUser?.username ?? currentUser?.nome ?? "";
  
  // Estados do Redux
  const uploading = useSelector((state) => state.posts.uploading);
  const error = useSelector((state) => state.posts.error);

  const [descricao, setDescricao] = useState("");
  const [genero, setGenero] = useState("");
  const [arquivo, setArquivo] = useState(null);

  const handleFileSelect = (file) => {
    setArquivo(file);
  };

  const handleEnviar = async () => {
    if (!descricao || !genero || !arquivo) {
      alert("Preencha todos os campos e selecione um arquivo!");
      return;
    }
    if (!userId) {
      alert("Faça login para publicar.");
      return;
    }

    try {
      // Preparar dados do post
      const postData = {
        titulo: descricao.trim(),
        tipo: "musica",
        genero,
        conteudo: descricao.trim(),
      };

      // Dispatch da action com FormData
      const result = await dispatch(
        createPostWithUpload({ postData, file: arquivo })
      ).unwrap();

      console.log("✅ Post criado:", result);
      alert("Post enviado com sucesso!");
      
      // Limpar formulário
      setDescricao("");
      setGenero("");
      setArquivo(null);
      
      // Navegar para o perfil do usuário
      if (username) navigate(`/user/${username}`);
      else navigate("/");
    } catch (err) {
      console.error("❌ Erro ao enviar post:", err);
      alert(err || "Erro ao enviar o post. Tente novamente.");
    }
  };

  return (
    <>
      <BackButton />
      <PublicarLayout>
        <div className="container-publicar">
          <DescricaoInput
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Escreva sobre sua música..."
          />
          <GeneroSelect tipo="musica" value={genero} onChange={setGenero} />
          
          {arquivo && (
            <div className="arquivo-info" style={{ margin: "20px 0", padding: "10px", background: "#f5f5f5", borderRadius: "8px" }}>
              <p style={{ margin: 0, fontSize: "14px" }}>
                <strong>Arquivo selecionado:</strong> {arquivo.name}
              </p>
              <p style={{ margin: "5px 0 0 0", fontSize: "12px", color: "#666" }}>
                Tamanho: {(arquivo.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          )}
          
          <UploadArea
            tipo="audio"
            accept=".mp3,.wav,.ogg,.m4a"
            textoPrincipal="Faça upload do arquivo de áudio"
            textoSecundario=".mp3, .wav, .ogg ou .m4a"
            onFileSelect={handleFileSelect}
          />
          
          {error && (
            <div style={{ color: "red", margin: "10px 0", textAlign: "center" }}>
              {error}
            </div>
          )}
          
          <EnviarButton onClick={handleEnviar} loading={uploading} disabled={uploading} />
        </div>
      </PublicarLayout>
    </>
  );
};

export default PublicarMusica;
