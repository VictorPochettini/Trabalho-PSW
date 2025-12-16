// src/pages/PublicarImagem.jsx
/**
 * @fileoverview Página de Publicação de Imagem.
 * @module PublicarImagem
 */
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

/**
 * @function BackButton
 * @description Componente de botão que utiliza `useNavigate` para retornar à página anterior no histórico.
 * @returns {JSX.Element} O botão de voltar.
 */
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

/**
 * @function PublicarImagem
 * @description Página principal para o upload e publicação de uma imagem na plataforma.
 * Gerencia os estados do formulário, a lógica de upload via Redux e a navegação.
 * @returns {JSX.Element} O componente da página PublicarImagem.
 */
const PublicarImagem = () => {
  /** @type {function} Hook do Redux para despachar ações. */
  const dispatch = useDispatch();
  /** @type {function} Hook para navegação programática. */
  const navigate = useNavigate();

  /** @type {object | null} Estado do usuário logado (pode ser o objeto de usuário completo ou nulo). */
  const currentUserState = useSelector((s) => s.user?.currentUser);
  /** @type {object | null} Dados consolidados do usuário logado. */
  const currentUser = currentUserState?.user ?? currentUserState ?? null;
  /** @type {string | null} ID do usuário para a criação do post. */
  const userId = currentUser?._id ?? currentUser?.id ?? null;
  /** @type {string} Nome de usuário para navegação pós-publicação. */
  const username = currentUser?.username ?? currentUser?.nome ?? "";
  
  // Estados do Redux
  /** @type {boolean} Indica se o upload está em progresso. */
  const uploading = useSelector((state) => state.posts.uploading);
  /** @type {string | null} Mensagem de erro do upload, se houver. */
  const error = useSelector((state) => state.posts.error);

  /** @type {[string, function(string): void]} Estado para a descrição/título da imagem. */
  const [descricao, setDescricao] = useState("");
  /** @type {[string, function(string): void]} Estado para o gênero/categoria da arte. */
  const [genero, setGenero] = useState("");
  /** @type {[File | null, function(File | null): void]} Estado para o objeto File selecionado. */
  const [arquivo, setArquivo] = useState(null);
  /** @type {[string | null, function(string | null): void]} Estado para a URL de preview da imagem. */
  const [previewUrl, setPreviewUrl] = useState(null);

  /**
   * @function handleFileSelect
   * @description Lida com a seleção de um arquivo de imagem, atualizando os estados de arquivo e preview.
   * @param {File | null} file O arquivo de imagem selecionado.
   */
  const handleFileSelect = (file) => {
    setArquivo(file);
    
    // Criar preview da imagem
    if (file) {
      const reader = new FileReader();
      /** @type {function} Callback chamado quando o arquivo é lido. */
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  };

  /**
   * @async
   * @function handleEnviar
   * @description Lida com o envio do formulário, validando os dados e despachando a action de upload.
   */
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
      /** @type {object} Dados textuais do post a serem enviados. */
      const postData = {
        titulo: descricao.trim(),
        tipo: "visual",
        genero,
        conteudo: descricao.trim(),
      };

      // Dispatch da action com FormData
      /** @type {object} Resultado da action de criação de post. */
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