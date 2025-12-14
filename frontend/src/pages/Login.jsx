// src/components/Login.jsx
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { login, clearError } from "../redux/usuariosSlice.js"; // ajustado para userSlice
import { useNavigate, Link } from "react-router-dom";
import styles from "../css/Login.module.css";
import botaoVolta from "../images/botaoVolta.png";
import logo from "../images/ArtBeat_Branco.png";
import olhoFechado from "../images/olhoFechadoRoxo.png";
import olhoAberto from "../images/olhoAbertoRoxo.png";

/**
 * @typedef {object} UserSliceState
 * @property {object | null} currentUser Objeto contendo os dados do usuário logado e token (se houver).
 * @property {string | null} error Mensagem de erro de login vinda do Redux.
 * @property {boolean} loading Indica se a requisição de login está em andamento.
 */

/**
 * @typedef {object} LoginPayload
 * @property {string} username Nome de usuário.
 * @property {string} password Senha.
 */

/**
 * Componente de interface de Login.
 *
 * Gerencia a autenticação do usuário, permitindo a inserção de credenciais
 * (usuário e senha) e despachando a ação de login para o Redux.
 * Redireciona para '/feed' em caso de sucesso.
 *
 * @returns {JSX.Element} O formulário de login e interface associada.
 */
export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // --- Redux State ---
  /** @type {object | null} Objeto do usuário logado do Redux. */
  const currentUser = useSelector((state) => state.user.currentUser);
  /** @type {string | null} Mensagem de erro de login do Redux. */
  const error = useSelector((state) => state.user.error);
  /** @type {boolean} Status de carregamento do Redux. */
  const loading = useSelector((state) => state.user.loading);

  // --- Local State ---
  /** @type {[string, React.Dispatch<React.SetStateAction<string>>]} Nome de usuário digitado. */
  const [username, setUsername] = useState("");
  /** @type {[string, React.Dispatch<React.SetStateAction<string>>]} Senha digitada. */
  const [password, setPassword] = useState("");
  /** @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} Estado para alternar a visibilidade da senha. */
  const [mostrarSenha, setMostrarSenha] = useState(false);

  // Redireciona para /feed assim que o usuário loga
  useEffect(() => {
    if (currentUser) {
      navigate("/feed");
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    document.body.classList.add(styles.loginBody);
    return () => document.body.classList.remove(styles.loginBody);
  }, []);

  /**
   * @private
   * Alterna o estado de visibilidade da senha.
   */
  const alternarSenha = () => setMostrarSenha((s) => !s);

  /**
   * @private
   * Função para retornar à página anterior (não utilizada no JSX atual, mas definida).
   */
  const voltarPagina = () => window.history.back();

  /**
   * @private
   * Função de manipulação do envio do formulário de login.
   * Despacha a ação de login (`login`) com o nome de usuário (tratado) e senha.
   * @param {React.FormEvent} e O evento de submissão do formulário.
   */
  const handleLogin = (e) => {
    e.preventDefault();
    /** @type {LoginPayload} */
    const payload = { username: username.trim(), password };
    dispatch(login(payload));
  };

  return (
    <div className={styles.pagefe}>
      <div className={styles.loginPage}>
        <Link to="/" className={styles.backButton} aria-label="Voltar">
          <img src={botaoVolta} alt="voltar" />
        </Link>

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
                autoComplete="username"
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
                  autoComplete="current-password"
                />
                <img
                  src={mostrarSenha ? olhoAberto : olhoFechado}
                  alt="mostrar senha"
                  className={styles.eyeIcon}
                  onClick={alternarSenha}
                  style={{ cursor: "pointer" }}
                />
              </div>
            </div>

            {error && (
              <p style={{ color: "red", textAlign: "center" }}>{error}</p>
            )}

            <div style={{ textAlign: "center" }}>
              <button
                type="submit"
                disabled={loading}
                className={styles.entrarbtn}
              >
                {loading ? "Entrando..." : "Entrar"}
              </button>
            </div>

            <div style={{ textAlign: "center", marginTop: 8 }}>
              <Link
                to="/cadastro"
                className={styles.entrarbtn}
                role="button"
                style={{
                  textDecoration: "none",
                  opacity: 0.5,
                  fontSize: "0.9rem",
                  padding: "20px 50px",
                  width: "auto",
                  minWidth: "unset",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  lineHeight: 1.05,
                }}
              >
                Criar conta
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
