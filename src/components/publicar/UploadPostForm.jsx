import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addPost } from "../../redux/postsSlice";
import { useNavigate } from "react-router-dom";

import DescricaoInput from "./DescricaoInput";
import GeneroSelect from "./GeneroSelect";
import UploadArea from "./UploadArea";
import EnviarButton from "./EnviarButton";

const UploadPostForm = ({ tipo }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const currentUser = useSelector((state) => state.user.currentUser);

  const [descricao, setDescricao] = useState("");
  const [genero, setGenero] = useState("");
  const [arquivo, setArquivo] = useState(null);

  const handleFileChange = (e) => {
    setArquivo(e.target.files[0]);
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

    const novoPost = {
      usuarioId: currentUser.id,
      titulo: descricao.split(" ").slice(0, 5).join(" ") || "Novo Post",
      conteudo:
        tipo === "musica" || tipo === "imagem" ? arquivo.name : descricao,
      tipo: tipo === "musica" ? "musica" : tipo === "imagem" ? "visual" : "texto",
      genero: genero || "geral",
      data: new Date().toISOString(),
    };

    try {
      await dispatch(addPost(novoPost)).unwrap();
      alert("Post enviado com sucesso!");
      navigate("/feed");
    } catch (err) {
      console.error(err);
      alert("Erro ao enviar post.");
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
            tipo={tipo === "musica" ? "musica" : "arte"}
            value={genero}
            onChange={(e) => setGenero(e.target.value)}
        />


      {(tipo === "musica" || tipo === "imagem") && (
        <UploadArea
          tipo={tipo === "musica" ? "audio" : "imagem"}
          accept={tipo === "musica" ? ".mp3,.wav" : ".jpg,.png"}
          textoPrincipal={
            tipo === "musica"
              ? "Faça upload do arquivo de áudio"
              : "Faça upload da imagem"
          }
          textoSecundario={tipo === "musica" ? ".mp3 ou .wav" : ".jpg ou .png"}
          onChange={handleFileChange}
        />
      )}

      <EnviarButton onClick={handleSubmit} />
    </div>
  );
};

export default UploadPostForm;
