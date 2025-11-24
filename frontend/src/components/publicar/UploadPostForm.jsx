// src/components/publicar/UploadPostForm.jsx
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addPost } from "../redux/postsSlice"; // ajuste se seu export for diferente
import { useNavigate } from "react-router-dom";

import DescricaoInput from "./DescricaoInput";
import GeneroSelect from "./GeneroSelect";
import UploadArea from "./UploadArea";
import EnviarButton from "./EnviarButton";

/**
 * UploadPostForm
 * props: { tipo: "musica" | "imagem" | "texto" }
 *
 * Observações:
 *  - O estado atual do usuário agora está em state.user.currentUser = { user, token }.
 *    Por isso pegamos currentUserState e extraímos o objeto real.
 *  - Se quiser enviar arquivo real para servidor, descomente o bloco FormData e ajuste endpoint.
 */
const UploadPostForm = ({ tipo = "texto" }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // novo modelo: currentUserState = { user, token }
  const currentUserState = useSelector((s) => s.user?.currentUser);
  const currentUser = currentUserState?.user ?? null;

  const [descricao, setDescricao] = useState("");
  const [genero, setGenero] = useState("");
  const [arquivo, setArquivo] = useState(null);
  const [sending, setSending] = useState(false);

  const handleFileSelect = (file) => {
    setArquivo(file || null);
  };

  const handleSubmit = async () => {
    if (!currentUser) {
      alert("Você precisa estar logado para publicar.");
      return;
    }

    if ((tipo === "musica" || tipo === "imagem") && !arquivo) {
      alert("Selecione um arquivo para enviar.");
      return;
    }

    setSending(true);

    try {
      const novoPost = {
        usuarioId: currentUser.id,
        titulo: descricao.split(" ").slice(0, 5).join(" ") || "Novo Post",
        conteudo:
          tipo === "musica" || tipo === "imagem" ? (arquivo ? arquivo.name : "") : descricao,
        tipo: tipo === "musica" ? "musica" : tipo === "imagem" ? "visual" : "texto",
        genero: genero || "geral",
        data: new Date().toISOString(),
      };

      // Se você precisar enviar arquivo real para backend:
      // const form = new FormData();
      // form.append("file", arquivo);
      // form.append("meta", JSON.stringify(novoPost));
      // await api.post("/upload", form, { headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${currentUserState?.token}` } });

      await dispatch(addPost(novoPost)).unwrap();
      alert("Post enviado com sucesso!");
      navigate("/feed");
    } catch (err) {
      console.error("Erro ao enviar post:", err);
      alert("Erro ao enviar post. Tente novamente.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="container-publicar">
      <DescricaoInput
        placeholder={tipo === "texto" ? "Escreva a letra da sua música..." : "Escreva sobre sua arte..."}
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
      />

      <GeneroSelect
        tipo={tipo === "musica" ? "musica" : tipo === "texto" ? "texto" : "arte"}
        value={genero}
        onChange={(val) => setGenero(val)}
      />

      {(tipo === "musica" || tipo === "imagem") && (
        <UploadArea
          tipo={tipo === "musica" ? "audio" : "imagem"}
          accept={tipo === "musica" ? ".mp3,.wav" : ".jpg,.jpeg,.png"}
          textoPrincipal={tipo === "musica" ? "Faça upload do arquivo de áudio" : "Faça upload da imagem"}
          textoSecundario={tipo === "musica" ? ".mp3 ou .wav" : ".jpg, .jpeg ou .png"}
          onFileSelect={handleFileSelect}
        />
      )}

      <EnviarButton onClick={handleSubmit} loading={sending} disabled={sending} />
    </div>
  );
};

export default UploadPostForm;
