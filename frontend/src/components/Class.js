import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { listStudents, listScores, updateScores } from '../services/api';
import Modal from './Modal'; // Importe o modal
import './Class.css'; // Importando o CSS

function Class() {
  const location = useLocation();
  const { classInfo, subject } = location.state || {};
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [filteredScores, setFilteredScores] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    const fetchStudentsAndScores = async () => {
      try {
        const studentsResponse = await listStudents();
        const students = studentsResponse.data;
        const filtered = students.filter(student => student.class === classInfo.turma);
        setFilteredStudents(filtered);

        const scoresResponse = await listScores();
        const scoresData = scoresResponse.data;
        const studentIds = filtered.map(student => student._id);

        const filteredScores = scoresData
          .filter(score => studentIds.includes(score.student))
          .map(score => ({
            studentId: score.student,
            subjectScore: score.scores[subject] || [null, null, null, null]
          }));

        setFilteredScores(filteredScores);
      } catch (error) {
        console.error('Erro ao buscar alunos ou scores:', error);
      }
    };

    fetchStudentsAndScores();

  }, [classInfo.turma, subject]);

  if (!classInfo) {
    return <div>Turma não encontrada.</div>;
  }

  const getStudentScores = (studentId) => {
    const score = filteredScores.find(score => score.studentId === studentId);
    return score ? score.subjectScore : [null, null, null, null];
  };

  const handleEditScores = (student) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  const handleSaveScores = async (studentId, newScores) => {
    try {
      await updateScores(studentId, { scores: { [subject]: newScores } });
      setFilteredScores(prevScores => 
        prevScores.map(score =>
          score.studentId === studentId ? { ...score, subjectScore: newScores } : score
        )
      );
    } catch (error) {
      console.error('Erro ao atualizar as notas:', error);
    }
  };

  return (
    <div className="class-container">
      <h1>Detalhes da Turma: {classInfo.turma}</h1>
      <h2>Matéria: {subject}</h2>
      <h3>Alunos e Notas:</h3>
      {filteredStudents.length > 0 ? (
        <ul>
          {filteredStudents.map((student, index) => (
            <li key={index}>
              {student.username}
              <div className="scores-container">
                {getStudentScores(student._id).map((score, i) => (
                  <label key={i} className="score-item">
                    {score !== null ? score : 'Sem nota'}
                  </label>
                ))}
                <button className="edit-button" onClick={() => handleEditScores(student)}>
                  Editar
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p>Não há alunos cadastrados para esta turma.</p>
      )}

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        student={selectedStudent} 
        initialScores={selectedStudent ? getStudentScores(selectedStudent._id) : []}
        onSave={handleSaveScores}
      />
    </div>
  );
}

export default Class;
