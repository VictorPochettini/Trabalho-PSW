// src/components/MonetizationPopup.jsx

/**
 * @fileoverview Popup de monetização/doação (simulada) para apoiar um artista.
 * @module MonetizationPopup
 * @description
 * Exibe um modal para o usuário selecionar um valor (pré-definido ou personalizado)
 * e um método de pagamento (ex: PIX / cartão). Também trata:
 * - Bloqueio de scroll do `body` enquanto o modal está aberto
 * - Fechamento via tecla ESC
 * - Validação de valor mínimo
 */

import React, { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

/**
 * Popup de monetização/doação para apoiar um usuário.
 *
 * @component
 * @param {object} props - Propriedades do componente.
 * @param {boolean} props.show - Controla a visibilidade do popup.
 * @param {Function} props.onClose - Callback chamado ao fechar o popup.
 * @param {string} props.username - Username/nome exibido do recebedor da doação.
 * @returns {JSX.Element|null} Modal renderizado quando `show=true`, caso contrário `null`.
 */
const MonetizationPopup = ({ show, onClose, username }) => {
  const navigate = useNavigate();
  const currentUserState = useSelector((s) => s.user?.currentUser);
  const currentUser = currentUserState?.user ?? null;
  const viewerId = currentUser?._id ?? currentUser?.id ?? null;

  const [selectedAmount, setSelectedAmount] = useState(0);
  const [customAmount, setCustomAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!show) {
      setSelectedAmount(0);
      setCustomAmount("");
      setPaymentMethod("pix");
      setError("");
      document.body.style.overflow = "";
    } else {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [show]);

  const onKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape") onClose?.();
    },
    [onClose]
  );

  useEffect(() => {
    if (!show) return;
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [show, onKeyDown]);

  /**
   * Seleciona um valor pré-definido para doação.
   * @param {number} amount - Valor selecionado.
   * @returns {void}
   */
  const handleAmountSelect = (amount) => {
    setSelectedAmount(amount);
    setCustomAmount("");
    setError("");
  };

  /**
   * Atualiza o valor customizado digitado e reflete em `selectedAmount`.
   * @param {React.ChangeEvent<HTMLInputElement>} e - Evento de change do input.
   * @returns {void}
   */
  const handleCustomAmountChange = (e) => {
    const raw = e.target.value;
    const normalized = String(raw).replace(",", ".").replace(/[^\d.]/g, "");
    setCustomAmount(raw);
    const parsed = parseFloat(normalized);
    setSelectedAmount(Number.isFinite(parsed) ? parsed : 0);
    setError("");
  };

  const minAmount = 5;

  /**
   * Processa a doação (fluxo simulado).
   * Se não houver usuário logado, oferece redirecionamento para login.
   * Valida valor mínimo antes de confirmar.
   * @returns {void}
   */
  const handleDonate = () => {
    setError("");
    const amount = Number(selectedAmount) || 0;
    if (!viewerId) {
      const go = confirm("Você precisa estar logado para doar. Ir para a tela de login?");
      if (go) navigate("/login");
      return;
    }
    if (!amount || amount < minAmount) {
      setError(`Insira um valor válido (mínimo R$ ${minAmount}).`);
      return;
    }
    try {
      alert(`Obrigado pela doação de R$ ${amount.toFixed(2)} para ${username} via ${paymentMethod}!`);
      onClose?.();
    } catch (err) {
      console.error("Erro ao processar doação (simulada):", err);
      setError("Não foi possível processar a doação. Tente novamente.");
    }
  };

  if (!show) return null;

  return (
    <div
      className="monetization-overlay"
      onClick={(e) => e.target.classList.contains("monetization-overlay") && onClose()}
      role="presentation"
      aria-hidden={!show}
    >
      <div
        className="monetization-popup"
        role="dialog"
        aria-modal="true"
        aria-label={`Apoiar ${username}`}
      >
        <div className="monetization-header">
          <h3>Apoiar {username}</h3>
          <button className="close-monetization" onClick={onClose} aria-label="Fechar">
            <span aria-hidden>✕</span>
          </button>
        </div>

        <div className="monetization-content">
          <div className="user-info">
            <i className="fa-solid fa-circle-user fa-2x" aria-hidden="true" />
            <div>
              <div className="recipient-name">{username}</div>
              <div className="recipient-sub">Apoie financeiramente este artista</div>
            </div>
          </div>

          <p className="monetization-description">
            Selecione um valor para apoiar ou informe um valor personalizado.
          </p>

          <div className="amount-options" role="radiogroup" aria-label="Valores de doação">
            {[5, 10, 20, 50].map((amount) => (
              <button
                key={amount}
                type="button"
                className={`amount-option ${Number(selectedAmount) === amount ? "selected" : ""}`}
                onClick={() => handleAmountSelect(amount)}
                aria-pressed={Number(selectedAmount) === amount}
              >
                <span className="amount-currency">R$</span>
                <strong className="amount-value">{amount}</strong>
              </button>
            ))}
          </div>

          <div className="custom-amount">
            <label htmlFor="custom-amount-input">Outro valor (mín R$ {minAmount}):</label>
            <div className="input-group">
              <span className="currency-symbol">R$</span>
              <input
                type="text"
                id="custom-amount-input"
                inputMode="decimal"
                pattern="^[0-9]+([.,][0-9]{1,2})?$"
                placeholder="5,00"
                value={customAmount}
                onChange={handleCustomAmountChange}
                aria-label="Valor personalizado"
                autoComplete="off"
              />
            </div>
          </div>

          <div className="payment-method" role="radiogroup" aria-label="Método de pagamento">
            <h4>Método de pagamento</h4>

            {/* deixamos nowrap para ficarem na mesma linha; em telas pequenas, permitimos scroll horizontal */}
            <div className="payment-options" role="list">
              <label className="payment-option" role="listitem">
                <input
                  type="radio"
                  name="payment-method"
                  value="pix"
                  checked={paymentMethod === "pix"}
                  onChange={() => setPaymentMethod("pix")}
                />
                <span className="payment-label">PIX</span>
              </label>

              <label className="payment-option" role="listitem">
                <input
                  type="radio"
                  name="payment-method"
                  value="credit-card"
                  checked={paymentMethod === "credit-card"}
                  onChange={() => setPaymentMethod("credit-card")}
                />
                <span className="payment-label">Cartão de Crédito</span>
              </label>
            </div>
          </div>

          {error && (
            <div className="monetization-error" role="alert" aria-live="assertive">
              {error}
            </div>
          )}

          <div className="actions-row">
            <button
              className="btn-donate"
              onClick={handleDonate}
              disabled={!viewerId || Number(selectedAmount) < minAmount}
              title={
                !viewerId
                  ? "Faça login para doar"
                  : Number(selectedAmount) < minAmount
                  ? `Valor mínimo R$ ${minAmount}`
                  : "Doar agora"
              }
            >
              {viewerId ? "Doar Agora" : "Entrar para doar"}
            </button>

            <button className="btn-cancel" onClick={onClose}>
              Cancelar
            </button>
          </div>
        </div>
      </div>

      <style>{`
        :root{
          --bg-0: #161622;
          --bg-1: #1e1e28;
          --accent-1: #6a5ae0;
          --accent-2: #8c7ff2;
          --surface: rgba(255,255,255,0.06);
          --glass-border: rgba(255,255,255,0.12);
          --muted: rgba(255,255,255,0.75);
          --danger-bg: rgba(255,80,80,0.06);
        }

        /* overlay */
        .monetization-overlay{
          position: fixed;
          inset: 0;
          display:flex;
          align-items:center;
          justify-content:center;
          background: rgba(0,0,0,0.5);
          z-index: 9999;
          padding:1.25rem;
          -webkit-overflow-scrolling: touch;
        }

        /* glassmorph popup */
        .monetization-popup{
          width: 100%;
          max-width: 520px;
          max-height: calc(100vh - 2.5rem);
          background: linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.02));
          border-radius: 14px;
          box-shadow: 0 12px 40px rgba(0,0,0,0.6);
          overflow: hidden;
          display:flex;
          flex-direction:column;
          backdrop-filter: blur(8px) saturate(120%);
          border: 1px solid var(--glass-border);
        }

        .monetization-header{
          display:flex;
          align-items:center;
          justify-content:space-between;
          padding: 0.9rem 1rem;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          gap:0.75rem;
          background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01));
        }
        .monetization-header h3{
          margin:0;
          font-size: 1rem;
          color: #fff;
          font-weight: 700;
        }
        .close-monetization{
          background:transparent;
          border:none;
          color:#fff;
          font-size:1.125rem;
          cursor:pointer;
          padding:6px;
          border-radius:8px;
        }
        .close-monetization:focus-visible{ box-shadow: 0 0 0 4px rgba(138,120,242,0.18); outline: none; }

        .monetization-content{
          padding: 1rem;
          color: #fff;
          overflow:auto;
          -webkit-overflow-scrolling: touch;
        }

        .user-info{ display:flex; gap:0.75rem; align-items:center; margin-bottom:0.6rem; }
        .recipient-name{ font-weight:700; font-size:0.95rem; }
        .recipient-sub{ font-size:0.8rem; color: var(--muted); margin-top:2px; }

        .monetization-description{ margin:0.45rem 0 0.85rem; color: var(--muted); font-size:0.92rem; }

        /* Amount options: ensure currency not overlapping and centered inline */
        .amount-options{
          display:flex;
          gap:0.6rem;
          flex-wrap:wrap;
          margin-bottom:0.85rem;
        }
        .amount-option{
          min-width: 92px;
          padding:0.6rem 0.9rem;
          border-radius: 12px;
          border:1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.03);
          color:#fff;
          cursor:pointer;
          display:flex;
          align-items:center;
          justify-content:center;
          gap:0.5rem;
          transition: transform .12s ease, box-shadow .18s ease, background .12s ease;
          font-size: 0.98rem;
          line-height:1;
          white-space:nowrap; /* evita quebra e sobreposição */
        }
        .amount-option .amount-currency {
          display:inline-block;
          font-size:0.82rem;
          opacity:0.95;
          margin-right:2px;
        }
        .amount-option .amount-value {
          font-weight:800;
          font-size:1.05rem;
          line-height:1;
        }

        .amount-option:hover{ background: rgba(138,120,242,0.10); transform: translateY(-3px); }
        .amount-option:focus-visible{ box-shadow: 0 0 0 4px rgba(106,90,224,0.16); outline: none; }

        .amount-option.selected{
          background: linear-gradient(135deg,var(--accent-1),var(--accent-2));
          box-shadow: 0 12px 30px rgba(106,90,224,0.18);
          border-color: rgba(255, 255, 255, 0.12);
        }

        .custom-amount{ margin: 0.9rem 0; }
        .custom-amount label{ font-size:0.88rem; color:var(--muted); }
        .input-group{
          display:flex;
          align-items:center;
          gap:0.5rem;
          margin-top:0.45rem;
          background: rgba(255,255,255,0.02);
          padding:4px;
          border-radius:10px;
          border: 1px solid rgba(255,255,255,0.04);
          backdrop-filter: blur(6px);
        }
        .currency-symbol{
          color: rgba(255,255,255,0.95);
          padding:0.45rem 0.6rem;
          background: transparent;
          border-radius:8px;
          font-size:0.95rem;
          margin-left:-10px;
        }
        .input-group input{
          flex:1;
          border-radius:8px;
          padding:0.6rem 0.75rem;
          border:none;
          background: transparent;
          color:#fff;
          outline: none;
          font-size:0.95rem;
        }
        .input-group input::placeholder{ color: rgba(255,255,255,0.35); }
        .input-group input:focus-visible{ box-shadow: 0 0 0 4px rgba(138,120,242,0.12); outline: none; }

        .payment-method h4{ margin:0.8rem 0 0.45rem; color:#fff; font-size:0.95rem; }
        /* força ficar em uma linha; em telas pequenas permite scroll horizontal (UX better than quebra) */
        .payment-options{
          display:flex;
          gap:0.9rem;
          align-items:center;
          flex-wrap: nowrap;
          overflow-x:auto;
          padding-bottom:6px;
        }
        .payment-options::-webkit-scrollbar{ height:8px; }
        .payment-options::-webkit-scrollbar-thumb{ background: rgba(255,255,255,0.06); border-radius:8px; }

        .payment-option{
          display:inline-flex;
          align-items:center;
          gap:0.5rem;
          color:#fff;
          cursor:pointer;
          user-select:none;
          font-size:0.95rem;
          padding:0.4rem 0.6rem;
          border-radius:8px;
          border:1px solid rgba(255,255,255,0.03);
          background: rgba(255,255,255,0.015);
          white-space:nowrap;
        }
        .payment-option input{ width:18px; height:18px; accent-color: var(--accent-1); }

        .monetization-error{
          color:#ffd4d4;
          background: var(--danger-bg);
          padding:0.6rem 0.75rem;
          border-radius:0.6rem;
          margin-top:0.6rem;
          font-size:0.9rem;
        }

        .actions-row{
          display:flex;
          gap:0.65rem;
          justify-content:flex-end;
          margin-top:1rem;
          align-items:center;
        }
        .btn-donate{
          padding:0.7rem 1rem;
          border-radius:0.75rem;
          border:none;
          background: linear-gradient(135deg,var(--accent-1),var(--accent-2));
          color:#fff;
          font-weight:700;
          cursor:pointer;
          font-size:0.95rem;
          min-width:120px;
        }
        .btn-donate[disabled]{ opacity:.6; cursor:not-allowed; filter:grayscale(.2); transform:none; }

        .btn-cancel{
          padding:0.6rem 0.9rem;
          border-radius:0.75rem;
          border:1px solid rgba(255,255,255,0.06);
          background: transparent;
          color:#fff;
          cursor:pointer;
          font-size:0.95rem;
        }

        /* responsividade */
        @media (max-width:420px){
          .monetization-popup{ max-width:100%; border-radius:10px; max-height: calc(100vh - 1.5rem); }
          .amount-option{ min-width: 78px; padding:0.5rem 0.7rem; }
          .btn-donate{ min-width:100px; font-size:0.92rem; }
          .monetization-header h3{ font-size:0.98rem; }
        }
      `}</style>
    </div>
  );
};

export default MonetizationPopup;
