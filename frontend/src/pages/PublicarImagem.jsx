// src/pages/PublicarImagem.jsx
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
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

const PublicarImagem = () => {
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
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleFileSelect = (file) => {
    setArquivo(file);
    
    // Criar preview da imagem
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
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
        tipo: "visual",
        genero,
        conteudo: descricao.trim(),
      };

      // Dispatch da action com FormData
      const result = await dispatch(
        createPostWithUpload({ postData, file: arquivo })
      ).unwrap();

      console.log("✅ Post criado:", result);
      alert("Imagem publicada com sucesso!");
      
      // Limpar formulário
      setDescricao("");
      setGenero("");
      setArquivo(null);
      setPreviewUrl(null);
      
      // Navegar para o perfil do usuário
      if (username) navigate(`/user/${username}`);
      else navigate("/");
    } catch (err) {
      console.error("❌ Erro ao enviar imagem:", err);
      alert(err || "Não foi possível enviar a imagem. Tente novamente.");
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
            placeholder="Descreva sua imagem..."
          />
          <GeneroSelect tipo="visual" value={genero} onChange={setGenero} />
          
          {previewUrl && (
            <div className="preview-container" style={{ margin: "20px 0", textAlign: "center" }}>
              <img
                src={previewUrl}
                alt="Preview"
                style={{ maxWidth: "100%", maxHeight: "300px", borderRadius: "8px" }}
              />
              <p style={{ marginTop: "10px", fontSize: "14px", color: "#666" }}>
                {arquivo?.name}
              </p>
            </div>
          )}
          
          <UploadArea
            tipo="image"
            accept=".png,.jpg,.jpeg,.webp,.gif"
            textoPrincipal="Faça upload da imagem"
            textoSecundario="PNG / JPG / WEBP / GIF"
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

export default PublicarImagem;
