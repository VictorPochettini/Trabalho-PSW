import React, { useState } from "react";
import "../css/Login.module.css";
import botaoVolta from "../images/botaoVolta.png";
import logo from "../images/ArtBeat_Branco.png";
import olhoFechado from "../images/olhoFechadoRoxo.png";
import olhoAberto from "../images/olhoAbertoRoxo.png";

export default function Login() {
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const voltarPagina = () => {
    window.history.back();
  };

  const alternarSenha = () => {
    setMostrarSenha(!mostrarSenha);
  };

  return (
    <div className="loginPage">
      <a onClick={voltarPagina} style={{ cursor: "pointer" }}>
        <img src={botaoVolta} alt="voltar" />
      </a>

      <div style={{ textAlign: "center" }}>
        <img src={logo} alt="ART BEAT" className="logo" />
      </div>

      <div style={{ textAlign: "center" }}>
        <h1 className="fonteh1">Entrar Na Conta</h1>
      </div>
      <br />

      <form>
        <label className="fonte" htmlFor="usuario">
          Usuário:
        </label><br />
        <input
          className="input"
          type="text"
          id="usuario"
          name="username"
          required
        /><br></br>

        <label className="fonte" htmlFor="senha">
          Senha:
        </label><br></br>
        <div className="input-container">
          <input
            className="input"
            type={mostrarSenha ? "text" : "password"}
            id="senha"
            name="senha"
            required
          />
          <a onClick={alternarSenha} style={{ cursor: "pointer" }}>
            <img
              src={mostrarSenha ? olhoAberto : olhoFechado}
              alt="visualizar senha"
            />
          </a>
        </div>
        

        <div style={{ textAlign: "center" }}>
          <button type="submit" className="entrarbtn">
            Entrar
          </button>
        </div>
      </form>
    </div>
  );
}
