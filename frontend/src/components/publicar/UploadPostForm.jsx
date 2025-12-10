// src/components/publicar/UploadPostForm.jsx
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createPostWithUpload, createPost } from "../../redux/postsSlice";
import { useNavigate } from "react-router-dom";

import DescricaoInput from "./DescricaoInput";
import GeneroSelect from "./GeneroSelect";
import UploadArea from "./UploadArea";
import EnviarButton from "./EnviarButton";

/**
 * UploadPostForm
 * props: { tipo: "musica" | "imagem" | "texto" }
 *
 * Atualizado para usar Redux Toolkit com createPostWithUpload
 */
const UploadPostForm = ({ tipo = "texto" }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const currentUserState = useSelector((s) => s.user?.currentUser);
  const currentUser = currentUserState?.user ?? null;
  
  // Estados do Redux
  const uploading = useSelector((state) => state.posts.uploading);
  const loading = useSelector((state) => state.posts.loading);
  const error = useSelector((state) => state.posts.error);

  const [descricao, setDescricao] = useState("");
  const [genero, setGenero] = useState("");
  const [arquivo, setArquivo] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleFileSelect = (file) => {
    setArquivo(file || null);
    
    // Criar preview para imagens
    if (file && tipo === "imagem") {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleSubmit = async () => {
    if (!currentUser) {
      alert("Você precisa estar logado para publicar.");
      return;
    }

    if (!descricao.trim()) {
      alert("Por favor, adicione uma descrição.");
      return;
    }

    if ((tipo === "musica" || tipo === "imagem") && !arquivo) {
      alert("Selecione um arquivo para enviar.");
      return;
    }

    if (!genero) {
      alert("Selecione um gênero/estilo.");
      return;
    }

    try {
      if (tipo === "texto") {
        // Para texto, usar createPost (sem arquivo)
        const postData = {
          titulo: descricao.split(" ").slice(0, 5).join(" ") || "Novo Post",
          conteudo: descricao,
          tipo: "texto",
          genero: genero,
        };
        
        await dispatch(createPost(postData)).unwrap();
      } else {
        // Para imagem/música, usar createPostWithUpload
        const postData = {
          titulo: descricao.split(" ").slice(0, 5).join(" ") || "Novo Post",
          conteudo: descricao,
          tipo: tipo === "musica" ? "musica" : "visual",
          genero: genero,
        };
        
        await dispatch(createPostWithUpload({ postData, file: arquivo })).unwrap();
      }
      
      alert("Post enviado com sucesso!");
      
      // Limpar formulário
      setDescricao("");
      setGenero("");
      setArquivo(null);
      setPreviewUrl(null);
      
      navigate("/feed");
    } catch (err) {
      console.error("Erro ao enviar post:", err);
      alert(err || "Erro ao enviar post. Tente novamente.");
    }
  };

  const getPlaceholder = () => {
    switch (tipo) {
      case "musica":
        return "Escreva sobre sua música...";
      case "imagem":
        return "Descreva sua imagem...";
      case "texto":
        return "Escreva a letra da sua música ou seu texto...";
      default:
        return "Escreva sobre sua arte...";
    }
  };

  const getAccept = () => {
    if (tipo === "musica") return ".mp3,.wav,.ogg,.m4a";
    if (tipo === "imagem") return ".jpg,.jpeg,.png,.gif,.webp";
    return "";
  };

  const getUploadText = () => {
    if (tipo === "musica") return "Faça upload do arquivo de áudio";
    if (tipo === "imagem") return "Faça upload da imagem";
    return "";
  };

  const getUploadSecondaryText = () => {
    if (tipo === "musica") return ".mp3, .wav, .ogg ou .m4a";
    if (tipo === "imagem") return ".jpg, .jpeg, .png, .gif ou .webp";
    return "";
  };

  const isSending = tipo === "texto" ? loading : uploading;

  return (
    <div className="container-publicar">
      <DescricaoInput
        placeholder={getPlaceholder()}
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
      />

      <GeneroSelect
        tipo={tipo === "musica" ? "musica" : tipo === "texto" ? "texto" : "arte"}
        value={genero}
        onChange={(val) => setGenero(val)}
      />

      {tipo === "imagem" && previewUrl && (
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

      {tipo === "musica" && arquivo && (
        <div className="arquivo-info" style={{ margin: "20px 0", padding: "10px", background: "#f5f5f5", borderRadius: "8px" }}>
          <p style={{ margin: 0, fontSize: "14px" }}>
            <strong>Arquivo selecionado:</strong> {arquivo.name}
          </p>
          <p style={{ margin: "5px 0 0 0", fontSize: "12px", color: "#666" }}>
            Tamanho: {(arquivo.size / (1024 * 1024)).toFixed(2)} MB
          </p>
        </div>
      )}

      {(tipo === "musica" || tipo === "imagem") && (
        <UploadArea
          tipo={tipo === "musica" ? "audio" : "imagem"}
          accept={getAccept()}
          textoPrincipal={getUploadText()}
          textoSecundario={getUploadSecondaryText()}
          onFileSelect={handleFileSelect}
        />
      )}

      {error && (
        <div style={{ color: "red", margin: "10px 0", textAlign: "center" }}>
          {error}
        </div>
      )}

      <EnviarButton onClick={handleSubmit} loading={isSending} disabled={isSending} />
    </div>
  );
};

export default UploadPostForm;
