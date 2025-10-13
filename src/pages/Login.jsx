import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { login, clearError } from "../redux/usuariosSlice";
import { useNavigate } from "react-router-dom";
import styles from "../css/Login.module.css";
import botaoVolta from "../images/botaoVolta.png";
import logo from "../images/ArtBeat_Branco.png";
import olhoFechado from "../images/olhoFechadoRoxo.png";
import olhoAberto from "../images/olhoAbertoRoxo.png";

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const currentUser = useSelector(state => state.user.currentUser);
  const error = useSelector(state => state.user.error);
  const loading = useSelector(state => state.user.loading);


  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);

  // ✅ Redireciona para /feed assim que o usuário loga
  useEffect(() => {
    if (currentUser) {
      navigate("/feed");
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    document.body.classList.add(styles.loginBody);
    return () => document.body.classList.remove(styles.loginBody);
  }, []);

  const alternarSenha = () => setMostrarSenha(!mostrarSenha);
  const voltarPagina = () => window.history.back();

  const handleLogin = (e) => {
    e.preventDefault();
    dispatch(login({ username, password }));
  };

  return (
    <div className={styles.pagefe}>
      <div className={styles.loginPage}>
        <a className={styles.backButton} onClick={voltarPagina}>
          <img src={botaoVolta} alt="voltar" />
        </a>

        <div className={styles.container}>
          <div style={{ textAlign: "center" }}>
            <img src={logo} alt="ART BEAT" className={styles.logo} />
          </div>
          <div style={{ textAlign: "center" }}>
            <h1 className={styles.fonteh1}>Entrar Na Conta</h1>
          </div>

          <form className={styles.formContainer} onSubmit={handleLogin}>
            <div className={styles.formGroup}>
              <label className={styles.fonte}>Usuário:</label>
              <input
                className={styles.input}
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (error) dispatch(clearError());
                }}
                placeholder="Digite seu usuário"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.fonte}>Senha:</label>
              <div className={styles.inputContainer}>
                <input
                  className={styles.input}
                  type={mostrarSenha ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) dispatch(clearError());
                  }}
                  placeholder="Digite sua senha"
                  required
                />
                <img
                  src={mostrarSenha ? olhoAberto : olhoFechado}
                  alt="mostrar senha"
                  className={styles.eyeIcon}
                  onClick={alternarSenha}
                />
              </div>
            </div>

            {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}

            <div style={{ textAlign: "center" }}>
              <button type="submit" disabled={loading} className={styles.entrarbtn}>
                {loading ? "Entrando..." : "Entrar"}
              </button>

            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
