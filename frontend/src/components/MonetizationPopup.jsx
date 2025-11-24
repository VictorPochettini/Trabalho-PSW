// src/components/MonetizationPopup.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

/**
 * MonetizationPopup — adaptado ao novo formato de store (currentUser = { user, token })
 * - mostra opção de doação
 * - desabilita doação se não logado (botão leva ao /login)
 * - valida valores (mínimo R$5)
 * - acessibilidade: fecha com ESC, overlay clicável
 * - reseta estado ao fechar
 *
 * Props:
 *  - show (bool)
 *  - onClose (fn)
 *  - username (string) — nome de exibição do destinatário
 */
const MonetizationPopup = ({ show, onClose, username }) => {
  const navigate = useNavigate();

  // novo formato: currentUserState = { user, token }
  const currentUserState = useSelector((s) => s.user?.currentUser);
  const currentUser = currentUserState?.user ?? null;
  const viewerId = currentUser?._id ?? currentUser?.id ?? null;

  const [selectedAmount, setSelectedAmount] = useState(0);
  const [customAmount, setCustomAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!show) {
      // reset quando popup é fechado
      setSelectedAmount(0);
      setCustomAmount("");
      setPaymentMethod("pix");
      setError("");
    }
  }, [show]);

  // Fecha com ESC
  const onKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape") {
        onClose?.();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!show) return;
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [show, onKeyDown]);

  const handleAmountSelect = (amount) => {
    setSelectedAmount(amount);
    setCustomAmount("");
    setError("");
  };

  const handleCustomAmountChange = (e) => {
    // aceita tanto ponto quanto vírgula para decimais
    const raw = e.target.value;
    const normalized = String(raw).replace(",", ".");
    setCustomAmount(raw);
    const parsed = parseFloat(normalized);
    setSelectedAmount(Number.isFinite(parsed) ? parsed : 0);
    setError("");
  };

  const minAmount = 5;

  const handleDonate = () => {
    setError("");
    const amount = Number(selectedAmount) || 0;
    if (!viewerId) {
      // se não logado, leva para login — preserve intenção do usuário (opcional)
      const go = confirm("Você precisa estar logado para doar. Ir para a tela de login?");
      if (go) navigate("/login");
      return;
    }

    if (!amount || amount < minAmount) {
      setError(`Insira um valor válido (mínimo R$ ${minAmount}).`);
      return;
    }

    // Simulação de doação (no projeto real, chiamar API)
    // Aqui apenas confirma e fecha
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
      className="monetization-overlay active"
      onClick={(e) => e.target.classList.contains("monetization-overlay") && onClose()}
      role="presentation"
      aria-hidden={!show}
    >
      <div className="monetization-popup" role="dialog" aria-modal="true" aria-label={`Apoiar ${username}`}>
        <div className="monetization-header">
          <h3>Apoiar {username}</h3>
          <button className="close-monetization" onClick={onClose} aria-label="Fechar">
            <i className="fas fa-times" />
          </button>
        </div>

        <div className="monetization-content">
          <div className="user-info">
            <i className="fa-solid fa-circle-user fa-2x" aria-hidden="true" />
            <span className="recipient-name">{username}</span>
          </div>

          <p className="monetization-description">
            Selecione um valor para apoiar este artista ou digite um valor personalizado:
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
                R$ {amount}
              </button>
            ))}
          </div>

          <div className="custom-amount">
            <label htmlFor="custom-amount-input">Ou informe outro valor (mín R$ {minAmount}):</label>
            <div className="input-group">
              <span className="currency-symbol">R$</span>
              <input
                type="text"
                id="custom-amount-input"
                inputMode="decimal"
                placeholder="5,00"
                value={customAmount}
                onChange={handleCustomAmountChange}
                aria-label="Valor personalizado"
              />
            </div>
          </div>

          <div className="payment-method" role="radiogroup" aria-label="Método de pagamento">
            <h4>Método de pagamento</h4>
            <div className="payment-options">
              <label className="payment-option">
                <input
                  type="radio"
                  name="payment-method"
                  value="pix"
                  checked={paymentMethod === "pix"}
                  onChange={() => setPaymentMethod("pix")}
                />
                <span className="payment-label">PIX</span>
              </label>
              <label className="payment-option">
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

          {error && <div className="monetization-error" role="alert">{error}</div>}

          <div className="actions-row">
            <button
              className="btn-donate"
              onClick={handleDonate}
              disabled={!viewerId || Number(selectedAmount) < minAmount}
              title={!viewerId ? "Faça login para doar" : Number(selectedAmount) < minAmount ? `Valor mínimo R$ ${minAmount}` : "Doar agora"}
            >
              {viewerId ? "Doar Agora" : "Entrar para doar"}
            </button>

            <button className="btn-cancel" onClick={onClose}>Cancelar</button>
          </div>
        </div>
      </div>

      <style>{`
        .monetization-overlay {
          position: fixed; inset: 0; display:flex; align-items:center; justify-content:center;
          background: rgba(0,0,0,0.6); z-index: 9999; padding:20px;
        }
        .monetization-popup {
          width: 100%; max-width: 720px; background: linear-gradient(180deg, rgba(30,30,40,0.98), rgba(22,22,34,0.98));
          border-radius: 14px; box-shadow: 0 20px 60px rgba(0,0,0,0.6); overflow: hidden;
        }
        .monetization-header { display:flex; align-items:center; justify-content:space-between; padding:16px 18px; border-bottom: 1px solid rgba(255,255,255,0.04); }
        .monetization-header h3 { margin:0; color:#fff; font-size:1.1rem; }
        .close-monetization { background:transparent; border:none; color:#fff; font-size:16px; cursor:pointer; }

        .monetization-content { padding:18px; color:#fff; }
        .user-info { display:flex; align-items:center; gap:12px; margin-bottom:12px; }
        .recipient-name { font-weight:700; }

        .monetization-description { margin:8px 0 14px; color: rgba(255,255,255,0.9); }

        .amount-options { display:flex; gap:10px; flex-wrap:wrap; margin-bottom:12px; }
        .amount-option {
          border-radius: 12px; padding:10px 14px; border:1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.03); color:#fff; cursor:pointer; transition: transform .12s ease, box-shadow .18s ease;
        }
        .amount-option.selected { background: linear-gradient(135deg,#6a5ae0,#8c7ff2); box-shadow: 0 10px 26px rgba(106,90,224,0.22); border-color: rgba(255,255,255,0.12); }

        .custom-amount { margin: 12px 0; }
        .input-group { display:flex; align-items:center; gap:8px; margin-top:6px; }
        .currency-symbol { color: rgba(255,255,255,0.85); padding:6px 8px; background: rgba(255,255,255,0.03); border-radius:8px; }
        .input-group input {
          flex:1; border-radius:10px; padding:10px 12px; border:1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.02); color:#fff; outline:none;
        }

        .payment-method h4 { margin:8px 0 6px; color:#fff; font-size:0.95rem; }
        .payment-options { display:flex; gap:12px; align-items:center; flex-wrap:wrap; margin-bottom:10px; }
        .payment-option { display:flex; align-items:center; gap:8px; color:#fff; cursor:pointer; }
        .payment-option input { width:16px; height:16px; }

        .monetization-error { color:#ffd4d4; background: rgba(255,80,80,0.06); padding:8px 10px; border-radius:8px; margin-top:8px; }

        .actions-row { display:flex; gap:10px; justify-content:flex-end; margin-top:14px; }
        .btn-donate {
          padding:10px 16px; border-radius:12px; border:none; background: linear-gradient(135deg,#6a5ae0,#8c7ff2);
          color:#fff; font-weight:700; cursor:pointer;
        }
        .btn-donate[disabled] { opacity:.6; cursor:not-allowed; filter:grayscale(.2); }
        .btn-cancel {
          padding:10px 14px; border-radius:12px; border:1px solid rgba(255,255,255,0.06); background: transparent; color:#fff; cursor:pointer;
        }

        @media (max-width:520px) {
          .monetization-popup { padding:0; }
          .monetization-header, .monetization-content { padding:12px; }
        }
      `}</style>
    </div>
  );
};

export default MonetizationPopup;
