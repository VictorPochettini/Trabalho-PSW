// src/components/MonetizationPopup.jsx
import React, { useState, useEffect } from 'react';

const MonetizationPopup = ({ show, onClose, username }) => {
  const [selectedAmount, setSelectedAmount] = useState(0);
  const [customAmount, setCustomAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('pix');

  useEffect(() => {
    if (!show) {
      // Reset form when closed
      setSelectedAmount(0);
      setCustomAmount('');
      setPaymentMethod('pix');
    }
  }, [show]);

  const handleAmountSelect = (amount) => {
    setSelectedAmount(amount);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (e) => {
    const value = e.target.value;
    setCustomAmount(value);
    setSelectedAmount(parseFloat(value) || 0);
  };

  const handleDonate = () => {
    if (selectedAmount >= 5) {
      alert(`Obrigado pela doação de R$ ${selectedAmount.toFixed(2)} para ${username} via ${paymentMethod}!`);
      onClose();
    } else {
      alert('Por favor, insira um valor de doação válido (mínimo R$ 5).');
    }
  };

  if (!show) return null;

  return (
    <div className="monetization-overlay active" onClick={(e) => e.target.classList.contains('monetization-overlay') && onClose()}>
      <div className="monetization-popup">
        <div className="monetization-header">
          <h3>Apoiar {username}</h3>
          <button className="close-monetization" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="monetization-content">
          <div className="user-info">
            <i className="fa-solid fa-circle-user fa-2x"></i>
            <span>{username}</span>
          </div>

          <p className="monetization-description">
            Selecione um valor para apoiar este artista ou digite um valor personalizado:
          </p>

          <div className="amount-options">
            {[5, 10, 20, 50].map((amount) => (
              <button
                key={amount}
                className={`amount-option ${selectedAmount === amount ? 'selected' : ''}`}
                onClick={() => handleAmountSelect(amount)}
              >
                R$ {amount}
              </button>
            ))}
          </div>

          <div className="custom-amount">
            <label htmlFor="custom-amount-input">Ou informe outro valor:</label>
            <div className="input-group">
              <span className="currency-symbol">R$</span>
              <input
                type="number"
                id="custom-amount-input"
                min="5"
                step="1"
                placeholder="5,00"
                value={customAmount}
                onChange={handleCustomAmountChange}
              />
            </div>
          </div>

          <div className="payment-method">
            <h4>Método de pagamento</h4>
            <div className="payment-options">
              <label className="payment-option">
                <input
                  type="radio"
                  name="payment-method"
                  value="pix"
                  checked={paymentMethod === 'pix'}
                  onChange={() => setPaymentMethod('pix')}
                />
                <span className="payment-label">PIX</span>
              </label>
              <label className="payment-option">
                <input
                  type="radio"
                  name="payment-method"
                  value="credit-card"
                  checked={paymentMethod === 'credit-card'}
                  onChange={() => setPaymentMethod('credit-card')}
                />
                <span className="payment-label">Cartão de Crédito</span>
              </label>
            </div>
          </div>

          <button className="btn-donate" onClick={handleDonate} disabled={selectedAmount < 5}>
            Doar Agora
          </button>
        </div>
      </div>
    </div>
  );
};

export default MonetizationPopup;