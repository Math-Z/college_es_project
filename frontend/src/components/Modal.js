import React, { useState, useEffect } from 'react';
import './Modal.css'; // Altere o nome do CSS para o novo

function Modal({ isOpen, onClose, student, initialScores, onSave }) {
  const [scores, setScores] = useState(initialScores);
  const [error, setError] = useState(''); // Estado para armazenar mensagem de erro

  useEffect(() => {
    setScores(initialScores);
    setError(''); // Reseta a mensagem de erro ao abrir o modal
  }, [initialScores]);

  const handleInputChange = (index, value) => {
    const numericValue = parseFloat(value.replace(',', '.')); // Permite números com vírgula

    // Verifica se o valor é um número e se está dentro do intervalo permitido
    if (isNaN(numericValue) || numericValue < 0 || numericValue > 10) {
      setError('As notas devem ser um número entre 0 e 10.');
    } else {
      setError(''); // Limpa a mensagem de erro se o valor é válido
    }

    const newScores = [...scores];
    newScores[index] = numericValue >= 0 && numericValue <= 10 ? numericValue : null; // Apenas atualiza se o valor estiver no intervalo
    setScores(newScores);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (scores.some(score => score === null)) {
      setError('Por favor, preencha todas as notas com valores válidos.'); // Mensagem de erro se houver notas inválidas
      return;
    }
    onSave(student._id, scores);
    onClose(); // Fecha o modal após salvar
  };

  if (!isOpen) return null;

  return (
    <div className="modal-scores-overlay">
      <div className="modal-scores-content">
        <h2 className="modal-scores-title">Editar Notas de {student.username}</h2>
        <form onSubmit={handleSubmit}>
          {scores.map((score, index) => (
            <div key={index}>
              <label className="modal-scores-label">
                Nota {index + 1}:
                <input
                  type="number"
                  className="modal-scores-input"
                  value={score !== null ? score : ''}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  min="0"
                  max="10" // Supondo que as notas vão de 0 a 10
                  step="0.1" // Permite a entrada de números decimais
                  required
                />
              </label>
            </div>
          ))}
          {error && <div className="modal-scores-error">{error}</div>} {/* Exibe mensagem de erro, se houver */}
          <button type="submit" className="modal-scores-button">Salvar</button>
          <button type="button" className="modal-scores-button" onClick={onClose}>Cancelar</button>
        </form>
      </div>
    </div>
  );
}

export default Modal;
