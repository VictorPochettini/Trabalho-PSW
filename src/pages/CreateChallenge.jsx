// src/pages/CreateChallenge.jsx
import React, { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import HeaderForYou from "../components/Header2";
import { createDesafio } from "../redux/desafiosSlice";

export default function CreateChallenge() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const currentUser = useSelector((s) => s.user?.currentUser);

  // --- form state ---
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [dataInicio, setDataInicio] = useState(() => new Date().toISOString().slice(0, 10));
  const [dataFim, setDataFim] = useState("");
  const [status, setStatus] = useState("rascunho"); // rascunho | publicado

  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  const valido = useMemo(() => {
    if (!titulo.trim() || !descricao.trim()) return false;
    if (!dataInicio || !dataFim) return false;
    const di = new Date(dataInicio).getTime();
    const df = new Date(dataFim).getTime();
    if (isNaN(di) || isNaN(df)) return false;
    if (df <= di) return false;
    return true;
  }, [titulo, descricao, dataInicio, dataFim]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");

    if (!currentUser?.id) {
      setErro("Faça login para criar um desafio.");
      return;
    }
    if (!valido) {
      setErro("Preencha todos os campos obrigatórios e verifique as datas.");
      return;
    }

    const payload = {
      // identidade
      id: undefined,               // json-server cria
      tipo: "comunidade",
      status,                      // rascunho/publicado
      criadorId: Number(currentUser.id),

      // conteúdo
      titulo: titulo.trim(),
      descricao: descricao.trim(),

      // datas
      dataInicio,
      dataFim,

      // metadados
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      setSalvando(true);
      const created = await dispatch(createDesafio(payload)).unwrap();
      navigate(`/desafios/${created.id}`);
    } catch (err) {
      console.error(err);
      setErro("Não foi possível criar o desafio. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  };

  if (!currentUser) {
    return (
      <>
        <HeaderForYou />
        <div className="fy-container">
          <div className="content-shell">
            <div className="empty-login">
              <h2>Entre para criar um desafio</h2>
              <p>Você precisa estar logado para publicar desafios da comunidade.</p>
              <Link className="btn-primary-like" to="/login">Ir para login</Link>
            </div>
          </div>
        </div>
        <style>{styles}</style>
      </>
    );
  }

  return (
    <>
      <HeaderForYou />

      <div className="fy-container">
        <h1 className="fy-title">Criar Desafio da Comunidade</h1>
        <p className="fy-subtitle">Defina o tema, o período e publique agora ou salve como rascunho.</p>

        <div className="content-shell">
          <form onSubmit={handleSubmit} className="ch-form">
            {/* título */}
            <div className="form-row">
              <label htmlFor="titulo">Título <span className="req">*</span></label>
              <input
                id="titulo"
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex.: Desafio Semanal - Natureza"
                maxLength={100}
                required
              />
              <div className="help">{titulo.length}/100</div>
            </div>

            {/* descrição */}
            <div className="form-row">
              <label htmlFor="descricao">Descrição <span className="req">*</span></label>
              <textarea
                id="descricao"
                rows={4}
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Conte sobre o tema, regras e critérios. Ex.: Poste música/letra/arte com o tema natureza."
                required
              />
            </div>

            {/* período */}
            <div className="form-row grid-2">
              <div>
                <label htmlFor="dataInicio">Início <span className="req">*</span></label>
                <input
                  id="dataInicio"
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="dataFim">Fim <span className="req">*</span></label>
                <input
                  id="dataFim"
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* status */}
            <div className="form-row">
              <label>Status</label>
              <div className="pill-group">
                <button
                  type="button"
                  className={`pill ${status === "rascunho" ? "active" : ""}`}
                  onClick={() => setStatus("rascunho")}
                >
                  Rascunho
                </button>
                <button
                  type="button"
                  className={`pill ${status === "publicado" ? "active" : ""}`}
                  onClick={() => setStatus("publicado")}
                >
                  Publicar agora
                </button>
              </div>
              <div className="help">Você pode publicar agora ou salvar e publicar depois.</div>
            </div>

            {/* erros */}
            {!!erro && <div className="error">{erro}</div>}

            {/* ações */}
            <div className="actions">
              <Link to="/desafios" className="btn-ghost">Cancelar</Link>
              <button
                type="submit"
                className="btn-primary-like"
                disabled={!valido || salvando}
                title={!valido ? "Preencha os campos obrigatórios e verifique as datas" : "Criar desafio"}
              >
                {salvando ? "Criando..." : "Criar desafio"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* estilos inline (coerentes com Challenges/ForYou) */}
      <style>{styles}</style>
    </>
  );
}

const styles = `
:root{
  --accent:#5e17eb; --accent-2:#7b3ff2;
  --surface-border: rgba(255,255,255,0.20);
  --surface-hover-border: rgba(255,255,255,0.28);
  --text-strong:#f7f8ff; --text-soft:rgba(255,255,255,.9); --muted:rgba(255,255,255,.75);
  --shadow-1:0 10px 24px rgba(0,0,0,.20); --shadow-2:0 18px 40px rgba(0,0,0,.28);
}
.fy-container{
  max-width:1100px; margin:0 auto; padding:28px 20px 60px;
  color:var(--text-strong); background:transparent;
}
.fy-title{
  margin:8px 0 6px; font-weight:800; letter-spacing:.2px;
  font-size:clamp(26px,2.4vw,34px);
  background:linear-gradient(90deg,#fff,#e9eaff 50%,#d4d9ff 85%);
  -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
  text-shadow:0 2px 16px rgba(0,0,0,.25);
}
.fy-subtitle{ margin:0 0 18px; color:var(--text-soft); text-shadow:0 1px 10px rgba(0,0,0,.20); }

/* casca glass branca */
.content-shell{
  background: linear-gradient(180deg, rgba(255,255,255,.18), rgba(255,255,255,.10));
  border:1px solid rgba(255,255,255,.22);
  border-radius: 28px;
  backdrop-filter: blur(18px) saturate(1.15);
  -webkit-backdrop-filter: blur(18px) saturate(1.15);
  box-shadow: var(--shadow-1), inset 0 1px 0 rgba(255,255,255,.22);
  padding: 18px 16px 20px;
}

/* formulário */
.ch-form{ display:grid; gap:18px; }
.form-row{ display:grid; gap:8px; }
.form-row.grid-2{ grid-template-columns: 1fr 1fr; gap:16px; }
label{ font-weight:800; }
.req{ color:#ffd966; margin-left:6px; }

input[type="text"], input[type="url"], input[type="date"], textarea, select{
  width:100%;
  background: rgba(255,255,255,.14);
  border:1px solid rgba(255,255,255,.28);
  border-radius: 16px;
  padding: 12px 14px;
  color:#fff;
  outline:none;
  transition: border-color .2s ease, box-shadow .25s ease, background .25s ease;
  box-shadow: 0 8px 18px rgba(0,0,0,.14);
}
textarea{ resize: vertical; }
input:focus, textarea:focus, select:focus{
  border-color: rgba(255,255,255,.38);
  box-shadow: 0 10px 24px rgba(0,0,0,.20);
  background: rgba(255,255,255,.18);
}
.help{ font-size:.85rem; color:var(--muted); }

.pill-group{ display:flex; gap:10px; flex-wrap:wrap; }
.pill{
  border:1px solid rgba(255,255,255,.26);
  color:#fff; background: linear-gradient(180deg, rgba(255,255,255,.18), rgba(255,255,255,.10));
  padding: 10px 16px; border-radius: 999px; font-weight: 800; letter-spacing: .2px;
  transition: transform .12s ease, border-color .2s ease, box-shadow .25s ease, background .25s ease;
}
.pill:hover{ transform: translateY(-1px); border-color: var(--surface-hover-border); background: linear-gradient(180deg, rgba(255,255,255,.24), rgba(255,255,255,.12)); box-shadow: 0 12px 26px rgba(0,0,0,.20); }
.pill.active{
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
  border-color: rgba(255,255,255,.30);
  box-shadow: 0 12px 26px rgba(94,23,235,.32);
}

.error{
  background: rgba(255, 68, 68, .14);
  border: 1px solid rgba(255, 68, 68, .28);
  color: #fff;
  padding: 10px 12px;
  border-radius: 14px;
}

/* ações */
.actions{ display:flex; gap:10px; justify-content:flex-end; }
.btn-ghost{
  border-radius:14px; border:1px solid rgba(255,255,255,.28); color:#fff;
  font-weight:800; padding:10px 12px; background: transparent;
  transition: transform .12s ease, border-color .2s ease, box-shadow .25s ease;
}
.btn-ghost:hover{ transform:translateY(-1px); border-color: rgba(255,255,255,.34); box-shadow: 0 12px 24px rgba(0,0,0,.18); }

.btn-primary-like{
  border-radius:14px; border:1px solid rgba(255,255,255,.28); color:#fff;
  font-weight:800; padding:10px 14px;
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
  box-shadow: 0 12px 26px rgba(94,23,235,.30);
  transition: transform .12s ease, filter .2s ease, box-shadow .25s ease, border-color .2s ease;
  cursor: pointer;
}
.btn-primary-like:disabled{ opacity:.55; cursor:not-allowed; }
.btn-primary-like:hover{ transform: translateY(-1px); filter: brightness(1.05); border-color: rgba(255,255,255,.34); box-shadow: 0 16px 32px rgba(94,23,235,.36); }

/* estado sem login */
.empty-login{ text-align:center; padding:36px 20px; }
.empty-login h2{ margin: 0 0 6px; }
.empty-login p{ margin: 0 0 14px; color: var(--text-soft); }

@media (max-width: 640px){
  .form-row.grid-2{ grid-template-columns:1fr; }
}
`;
