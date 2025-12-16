// src/pages/PublicarMusica.jsx
/**
 * @fileoverview Página de Publicação de Música (Post com upload de áudio).
 * @module PublicarMusica
 */
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
 * @function PublicarMusica
 * @description Página principal para o upload e publicação de um arquivo de áudio (música) na plataforma.
 * Gerencia os estados do formulário, a lógica de upload via Redux e a navegação.
 * @returns {JSX.Element} O componente da página PublicarMusica.
 */
const PublicarMusica = () => {
  /** @type {function} Hook do Redux para despachar ações. */
  const dispatch = useDispatch();
  /** @type {function} Hook para navegação programática. */
  const navigate = useNavigate();

  /** @type {object | null} Estado do usuário logado do Redux. */
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

  /** @type {[string, function(string): void]} Estado para a descrição/título da música. */
  const [descricao, setDescricao] = useState("");
  /** @type {[string, function(string): void]} Estado para o gênero musical. */
  const [genero, setGenero] = useState("");
  /** @type {[File | null, function(File | null): void]} Estado para o objeto File (arquivo de áudio) selecionado. */
  const [arquivo, setArquivo] = useState(null);

  /**
   * @function handleFileSelect
   * @description Lida com a seleção de um arquivo de áudio, atualizando o estado do arquivo.
   * @param {File | null} file O arquivo de áudio selecionado.
   */
  const handleFileSelect = (file) => {
    setArquivo(file);
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
        tipo: "musica",
        genero,
        conteudo: descricao.trim(),
      };

      // Dispatch da action com FormData
      /** @type {object} Resultado da action de criação de post. */
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