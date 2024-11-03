// src/components/Class.js

import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { listStudents, listScores } from '../services/api';
import './Class.css'; // Importando o CSS

function Class() {
  const location = useLocation();
  const { classInfo, subject } = location.state || {}; 
  const [filteredStudents, setFilteredStudents] = useState([]); 
  const [filteredScores, setFilteredScores] = useState([]);

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
                  <span key={i} className="score-item">
                    {score !== null ? score : 'Sem nota'}
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p>Não há alunos cadastrados para esta turma.</p>
      )}
    </div>
  );
}

export default Class;
