// src/pages/CreateChallengePage.jsx
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import HeaderForYou from "../components/Header2";
import { createDesafio } from "../redux/desafiosSlice";

export default function CreateChallengePage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const currentUserState = useSelector((s) => s.user?.currentUser);
  const currentUser = currentUserState?.user ?? null;
  const currentUserId = currentUser ? (currentUser._id || currentUser.id) : null;
  const currentUserRole = currentUser ? (currentUser.role ?? currentUser.tipo ?? null) : null;
  
  const isAdmin = currentUserRole === "admin" || currentUserRole === "ADMIN";

  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    dataInicio: "",
    dataFim: "",
    tiposAceitos: [], // ✅ Renomeado para clareza
    tipo: "comunidade",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTipoToggle = (tipo) => {
    setFormData(prev => ({
      ...prev,
      tiposAceitos: prev.tiposAceitos.includes(tipo)
        ? prev.tiposAceitos.filter(t => t !== tipo)
        : [...prev.tiposAceitos, tipo]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUserId) {
      alert("Você precisa estar logado para criar um desafio");
      return;
    }

    if (!formData.titulo.trim()) {
      alert("Título é obrigatório");
      return;
    }

    if (!formData.descricao.trim()) {
      alert("Descrição é obrigatória");
      return;
    }

    if (formData.tiposAceitos.length === 0) {
      alert("Selecione pelo menos um tipo de conteúdo");
      return;
    }

    setLoading(true);

    // ✅ Criar payload com tipoAceito (e tiposPermitidos para compatibilidade)
    const payload = {
      titulo: formData.titulo,
      descricao: formData.descricao,
      dataInicio: formData.dataInicio,
      dataFim: formData.dataFim,
      tipoAceito: formData.tiposAceitos,        // ✅ Campo principal
      tiposPermitidos: formData.tiposAceitos,   // ✅ Compatibilidade
      tipo: formData.tipo,
      status: "publicado",
      criadorId: currentUserId,
      createdAt: new Date().toISOString(),
    };

    console.log('📤 Criando desafio com payload:', payload);
    console.log('📤 tipoAceito:', payload.tipoAceito);
    console.log('📤 tiposPermitidos:', payload.tiposPermitidos);
    console.log('📤 Ambos são arrays?', 
      Array.isArray(payload.tipoAceito) && 
      Array.isArray(payload.tiposPermitidos)
    );

    try {
      const result = await dispatch(createDesafio(payload)).unwrap();
      console.log(`✅ Desafio ${formData.tipo} criado com sucesso`);
      console.log('✅ Resultado:', result);
      navigate(`/desafios/${result._id || result.id}`);
    } catch (error) {
      console.error("❌ Erro ao criar desafio:", error);
      alert("Não foi possível criar o desafio. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <>
        <HeaderForYou />
        <div className="cc-container">
          <div className="cc-shell">
            <h2>Faça login para criar desafios</h2>
            <button onClick={() => navigate("/login")} className="cc-btn primary">
              Ir para Login
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <HeaderForYou />
      <div className="cc-container">
        <div className="cc-shell">
          <h1 className="cc-title">Criar Novo Desafio</h1>
          <p className="cc-subtitle">
            {isAdmin 
              ? "Crie um desafio oficial ou da comunidade" 
              : "Crie um desafio criativo para a comunidade"}
          </p>

          <form className="cc-form" onSubmit={handleSubmit}>
            {/* ✅ ADMIN: Seletor de tipo de desafio */}
            {isAdmin && (
              <div className="cc-field">
                <label htmlFor="tipo">Tipo de Desafio *</label>
                <div className="cc-tipo-selector">
                  <button
                    type="button"
                    className={`cc-tipo-option ${formData.tipo === "oficial" ? 'active oficial' : ''}`}
                    onClick={() => setFormData(prev => ({ ...prev, tipo: "oficial" }))}
                  >
                    <i className="fas fa-star"></i>
                    <div>
                      <strong>Oficial</strong>
                      <span>Desafio patrocinado pela plataforma</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    className={`cc-tipo-option ${formData.tipo === "comunidade" ? 'active comunidade' : ''}`}
                    onClick={() => setFormData(prev => ({ ...prev, tipo: "comunidade" }))}
                  >
                    <i className="fas fa-users"></i>
                    <div>
                      <strong>Comunidade</strong>
                      <span>Desafio criado pela comunidade</span>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Título */}
            <div className="cc-field">
              <label htmlFor="titulo">Título *</label>
              <input
                type="text"
                id="titulo"
                name="titulo"
                value={formData.titulo}
                onChange={handleChange}
                placeholder="Ex: Desafio de Arte Digital de Natal"
                maxLength={100}
                required
              />
            </div>

            {/* Descrição */}
            <div className="cc-field">
              <label htmlFor="descricao">Descrição *</label>
              <textarea
                id="descricao"
                name="descricao"
                value={formData.descricao}
                onChange={handleChange}
                placeholder="Descreva as regras e objetivos do desafio..."
                rows={5}
                maxLength={500}
                required
              />
              <small>{formData.descricao.length}/500 caracteres</small>
            </div>

            {/* Datas */}
            <div className="cc-row">
              <div className="cc-field">
                <label htmlFor="dataInicio">Data de Início</label>
                <input
                  type="date"
                  id="dataInicio"
                  name="dataInicio"
                  value={formData.dataInicio}
                  onChange={handleChange}
                />
              </div>

              <div className="cc-field">
                <label htmlFor="dataFim">Data de Fim</label>
                <input
                  type="date"
                  id="dataFim"
                  name="dataFim"
                  value={formData.dataFim}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* ✅ Tipos Aceitos */}
            <div className="cc-field">
              <label>Tipos de Conteúdo Aceitos *</label>
              <div className="cc-tipos">
                {["musica", "visual", "texto"].map(tipo => (
                  <button
                    key={tipo}
                    type="button"
                    className={`cc-tipo-btn ${formData.tiposAceitos.includes(tipo) ? 'active' : ''}`}
                    onClick={() => handleTipoToggle(tipo)}
                  >
                    <i className={`fas fa-${tipo === 'musica' ? 'music' : tipo === 'visual' ? 'image' : 'file-alt'}`}></i>
                    <span>{tipo.charAt(0).toUpperCase() + tipo.slice(1)}</span>
                  </button>
                ))}
              </div>
              <small className="cc-hint">
                {formData.tiposAceitos.length === 0 
                  ? "Selecione pelo menos um tipo" 
                  : `${formData.tiposAceitos.length} tipo(s) selecionado(s): ${formData.tiposAceitos.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(", ")}`
                }
              </small>
            </div>

            {/* Botões de Ação */}
            <div className="cc-actions">
              <button
                type="button"
                className="cc-btn secondary"
                onClick={() => navigate("/desafios")}
                disabled={loading}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="cc-btn primary"
                disabled={loading}
              >
                <i className="fa-solid fa-check"></i>
                <span>{loading ? "Criando..." : "Criar Desafio"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <style>{`
        :root {
          --accent: #5e17eb;
          --accent-2: #7b3ff2;
          --success: #22c55e;
          --oficial: #6366f1;
          --oficial-2: #4f46e5;
          --comunidade: #a855f7;
          --comunidade-2: #9333ea;
          --text-strong: #f7f8ff;
          --text-soft: rgba(255,255,255,.9);
          --surface: rgba(255,255,255,.16);
        }

        .cc-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 28px 20px 60px;
          color: var(--text-strong);
        }

        .cc-shell {
          background: linear-gradient(180deg, rgba(255,255,255,.18), rgba(255,255,255,.10));
          border: 1px solid rgba(255,255,255,.22);
          border-radius: 28px;
          backdrop-filter: blur(18px) saturate(1.15);
          box-shadow: 0 10px 24px rgba(0,0,0,.20);
          padding: 32px 28px;
        }

        .cc-title {
          margin: 0 0 8px;
          font-weight: 800;
          font-size: clamp(24px, 2.5vw, 32px);
          background: linear-gradient(90deg, #fff, #e9eaff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .cc-subtitle {
          margin: 0 0 32px;
          color: var(--text-soft);
        }

        .cc-form {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .cc-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .cc-field label {
          font-weight: 700;
          color: var(--text-strong);
          font-size: 0.95rem;
        }

        .cc-field input,
        .cc-field textarea {
          background: rgba(255,255,255,.12);
          border: 1px solid rgba(255,255,255,.26);
          border-radius: 14px;
          padding: 12px 16px;
          color: #fff;
          font-size: 1rem;
          outline: none;
          transition: all .2s ease;
        }

        .cc-field input:focus,
        .cc-field textarea:focus {
          border-color: rgba(255,255,255,.38);
          background: rgba(255,255,255,.16);
          box-shadow: 0 8px 20px rgba(0,0,0,.15);
        }

        .cc-field textarea {
          resize: vertical;
          font-family: inherit;
        }

        .cc-field small {
          color: rgba(255,255,255,.7);
          font-size: 0.85rem;
          text-align: right;
        }

        .cc-hint {
          color: rgba(255,255,255,.8);
          font-size: 0.9rem;
          text-align: left;
          margin-top: 4px;
        }

        .cc-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .cc-tipo-selector {
          display: grid;
          gap: 12px;
        }

        .cc-tipo-option {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 20px;
          border-radius: 16px;
          border: 2px solid rgba(255,255,255,.22);
          background: linear-gradient(180deg, rgba(255,255,255,.14), rgba(255,255,255,.08));
          color: #fff;
          cursor: pointer;
          transition: all .2s ease;
          text-align: left;
        }

        .cc-tipo-option i {
          font-size: 24px;
          opacity: 0.8;
        }

        .cc-tipo-option div {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .cc-tipo-option strong {
          font-size: 1.05rem;
          font-weight: 700;
        }

        .cc-tipo-option span {
          font-size: 0.9rem;
          color: rgba(255,255,255,.75);
        }

        .cc-tipo-option:hover {
          border-color: rgba(255,255,255,.35);
          background: linear-gradient(180deg, rgba(255,255,255,.20), rgba(255,255,255,.12));
          transform: translateY(-1px);
        }

        .cc-tipo-option.active.oficial {
          background: linear-gradient(135deg, var(--oficial), var(--oficial-2));
          border-color: rgba(99,102,241,.5);
          box-shadow: 0 8px 20px rgba(99,102,241,.32);
        }

        .cc-tipo-option.active.comunidade {
          background: linear-gradient(135deg, var(--comunidade), var(--comunidade-2));
          border-color: rgba(168,85,247,.5);
          box-shadow: 0 8px 20px rgba(168,85,247,.32);
        }

        .cc-tipos {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .cc-tipo-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,.22);
          background: linear-gradient(180deg, rgba(255,255,255,.18), rgba(255,255,255,.10));
          color: #fff;
          font-weight: 700;
          cursor: pointer;
          transition: all .2s ease;
        }

        .cc-tipo-btn:hover {
          border-color: rgba(255,255,255,.30);
          background: linear-gradient(180deg, rgba(255,255,255,.24), rgba(255,255,255,.12));
          transform: translateY(-1px);
        }

        .cc-tipo-btn.active {
          background: linear-gradient(135deg, var(--accent), var(--accent-2));
          border-color: rgba(255,255,255,.28);
          box-shadow: 0 8px 20px rgba(94,23,235,.32);
        }

        .cc-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 16px;
          flex-wrap: wrap;
        }

        .cc-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,.28);
          font-weight: 800;
          letter-spacing: .2px;
          cursor: pointer;
          transition: all .2s ease;
        }

        .cc-btn.primary {
          background: linear-gradient(135deg, var(--success), #16a34a);
          color: #fff;
          box-shadow: 0 12px 26px rgba(34,197,94,.28);
        }

        .cc-btn.primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 16px 32px rgba(34,197,94,.36);
          filter: brightness(1.05);
        }

        .cc-btn.secondary {
          background: rgba(255,255,255,.12);
          color: #fff;
        }

        .cc-btn.secondary:hover:not(:disabled) {
          background: rgba(255,255,255,.18);
          transform: translateY(-1px);
        }

        .cc-btn:disabled {
          opacity: .5;
          cursor: not-allowed;
        }

        @media (max-width: 640px) {
          .cc-shell {
            padding: 24px 20px;
          }

          .cc-row {
            grid-template-columns: 1fr;
          }

          .cc-actions {
            flex-direction: column-reverse;
          }

          .cc-btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </>
  );
}