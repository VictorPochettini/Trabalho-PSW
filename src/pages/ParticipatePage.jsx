// src/pages/ParticipatePage.jsx
import React, { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams, Link } from "react-router-dom";
import HeaderForYou from "../components/Header2";

import { selectDesafioById } from "../redux/desafiosSlice";
import { createParticipacao, selectParticipacoesByDesafio } from "../redux/participacoesSlice";

export function ParticipatePage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const currentUser = useSelector((s) => s.user?.currentUser);
  const desafio = useSelector(selectDesafioById(id));
  const participacoes = useSelector(selectParticipacoesByDesafio(id));
  const meusPosts = useSelector((s) => s.posts.lista || []).filter(
    (p) => String(p.usuarioId) === String(currentUser?.id)
  );

  const [postId, setPostId] = useState("");

  const jaParticipouComPost = useMemo(
    () =>
      new Set(
        participacoes
          .filter((p) => String(p.usuarioId) === String(currentUser?.id))
          .map((p) => String(p.postId))
      ),
    [participacoes, currentUser?.id]
  );

  const tiposPermitidos =
    desafio?.tiposPermitidos && desafio.tiposPermitidos.length
      ? desafio.tiposPermitidos
      : ["musica", "visual", "texto"]; // fallback

  const postsElegiveis = meusPosts.filter(
    (p) => tiposPermitidos.includes(String(p.tipo)) && !jaParticipouComPost.has(String(p.id))
  );

  async function onSubmit(e) {
    e.preventDefault();
    if (!currentUser?.id || !postId) return;
    const novo = {
      id: `${id}-${currentUser.id}-${postId}`,
      desafioId: id,
      usuarioId: currentUser.id,
      postId: Number(postId),
      createdAt: new Date().toISOString(),
    };
    await dispatch(createParticipacao(novo));
    navigate(`/desafios/${id}`);
  }

  // ESTADOS: precisa login / carregando desafio
  if (!currentUser) {
    return (
      <>
        <HeaderForYou />
        <div className="fy-container">
          <div className="content-shell">
            <div className="empty-state">
              <h2>Faça login para participar</h2>
              <p>Entre na sua conta para inscrever um post neste desafio.</p>
              <Link className="btn-primary-like" to="/login">Ir para login</Link>
            </div>
          </div>
        </div>
        <style>{styles}</style>
      </>
    );
  }

  if (!desafio) {
    return (
      <>
        <HeaderForYou />
        <div className="fy-container">
          <div className="content-shell">
            <div className="loading">Carregando desafio…</div>
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
        <h1 className="fy-title">Participar — {desafio.titulo}</h1>
        <p className="fy-subtitle">
          Selecione um dos seus posts elegíveis para inscrevê-lo neste desafio.
        </p>

        <div className="content-shell">
          {/* META DO DESAFIO */}
          <div className="ch-meta">
            {desafio.dataInicio && (
              <div className="meta-item">
                <i className="fa-regular fa-calendar"></i>
                <span>Início: {new Date(desafio.dataInicio).toLocaleDateString()}</span>
              </div>
            )}
            {desafio.dataFim && (
              <div className="meta-item">
                <i className="fa-regular fa-hourglass-half"></i>
                <span>Fim: {new Date(desafio.dataFim).toLocaleDateString()}</span>
              </div>
            )}
            {!!tiposPermitidos?.length && (
              <div className="meta-item">
                <i className="fa-regular fa-circle-check"></i>
                <span>
                  Tipos permitidos:{" "}
                  <b>{tiposPermitidos.map((t) => t[0].toUpperCase() + t.slice(1)).join(", ")}</b>
                </span>
              </div>
            )}
          </div>

          {/* FORM */}
          <form onSubmit={onSubmit} className="pp-form">
            <div className="form-row">
              <label htmlFor="postId">
                Escolha um dos seus posts elegíveis <span className="req">*</span>
              </label>

              <div className="select-wrap">
                <i className="fa-solid fa-music left-icon" aria-hidden />
                <select
                  id="postId"
                  className="nice-select"
                  value={postId}
                  onChange={(e) => setPostId(e.target.value)}
                >
                  <option value="">— selecione —</option>
                  {postsElegiveis.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.tipo}] {p.titulo} — {new Date(p.data).toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              {postsElegiveis.length === 0 && (
                <div className="hint">
                  Você não possui posts elegíveis ainda — crie um novo post do tipo permitido
                  e volte aqui para inscrever.
                </div>
              )}
            </div>

            <div className="actions">
              <button
                type="button"
                className="btn-ghost"
                onClick={() => navigate(`/desafios/${id}`)}
              >
                Voltar
              </button>
              <button
                className="btn-primary-like"
                disabled={!postId || postsElegiveis.length === 0}
              >
                Enviar
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* estilos inline */}
      <style>{styles}</style>
    </>
  );
}

const styles = `
:root{
  --accent:#5e17eb; --accent-2:#7b3ff2;
  --surface-border: rgba(255,255,255,0.22);
  --surface-hover-border: rgba(255,255,255,0.30);
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

/* casca glass */
.content-shell{
  background: linear-gradient(180deg, rgba(255,255,255,.18), rgba(255,255,255,.10));
  border:1px solid var(--surface-border);
  border-radius: 28px;
  backdrop-filter: blur(18px) saturate(1.15);
  -webkit-backdrop-filter: blur(18px) saturate(1.15);
  box-shadow: var(--shadow-1), inset 0 1px 0 rgba(255,255,255,.22);
  padding: 18px 16px 20px;
}

/* meta header */
.ch-meta{ display:flex; gap:14px; flex-wrap:wrap; color:var(--muted); margin-bottom: 14px; }
.meta-item{ display:flex; align-items:center; gap:8px; }

/* formulário */
.pp-form{ display:grid; gap:18px; }
.form-row{ display:grid; gap:8px; }
label{ font-weight:800; }
.req{ color:#ffd966; margin-left:6px; }
.hint{ color:var(--text-soft); font-size:.95rem; }

.select-wrap{
  position:relative;
  background: rgba(255,255,255,.14);
  border:1px solid rgba(255,255,255,.28);
  border-radius: 16px;
  padding: 0;
  box-shadow: 0 8px 18px rgba(0,0,0,.14);
  overflow:hidden;
}
.left-icon{
  position:absolute; left:12px; top:50%; transform:translateY(-50%);
  opacity:.85;
}
.nice-select{
  width:100%;
  appearance:none;
  background: transparent;
  color:#fff;
  border:none;
  outline:none;
  padding: 12px 14px 12px 38px; /* espaço pro ícone */
  font-size: 1rem;
}
.nice-select option{ color:#111; } /* opções no dropdown nativo */

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

/* estados */
.empty-state{ text-align:center; padding:36px 20px; }
.loading{ color: var(--text-soft); text-align:center; padding: 24px 0; }

@media (max-width: 640px){
  .ch-meta{ gap:10px; }
}
`;
