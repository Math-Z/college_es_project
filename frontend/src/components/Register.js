import React, { useEffect, useState } from 'react';
import './Register.css'; // Importa o arquivo CSS

function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/classes');
        const data = await response.json();
        setClasses(data);
      } catch (error) {
        console.error('Error fetching classes:', error);
      }
    };

    const fetchSubjects = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/subjects');
        const data = await response.json();
        setSubjects(data);
      } catch (error) {
        console.error('Error fetching subjects:', error);
      }
    };

    Promise.all([fetchClasses(), fetchSubjects()]).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setSelectedClass('');
    setSelectedSubject('');
  }, [role]);

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username,
          password,
          role,
          class: role === 'student' ? selectedClass : undefined,
          subject: role === 'teacher' ? selectedSubject : undefined
        })
      });

      if (response.ok) {
        alert('Registro feito com sucesso!');
        setUsername('');
        setPassword('');
        setRole('');
        setSelectedClass('');
        setSelectedSubject('');
      } else {
        alert('Erro ao registrar. Verifique os dados.');
      }
    } catch (error) {
      console.error('Error during registration:', error);
      alert('Erro ao registrar. Tente novamente.');
    }
  };

  return (
    <div className="register-container">
      {loading ? (
        <p className="loading-message">Carregando...</p>
      ) : (
        <form className="register-form" onSubmit={handleRegister}>
          <h2 className="register-title">Registro</h2>
          <input
            type="text"
            placeholder="Nome"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="register-input"
          />
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="register-input"
          />
          <select value={role} onChange={(e) => setRole(e.target.value)} required className="register-select">
            <option value="" disabled>Selecionar Opção</option>
            <option value="student">Aluno</option>
            <option value="teacher">Professor</option>
            <option value="admin">Admin</option>
          </select>
          {role === 'student' && (
            <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} required className="register-select">
              <option value="" disabled>Turma</option>
              {classes.map((cls) => (
                <option key={cls._id} value={cls.turma}>{cls.turma}</option>
              ))}
            </select>
          )}
          {role === 'teacher' && (
            <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} required className="register-select">
              <option value="" disabled>Matéria Ensinada</option>
              {subjects.map((subject) => (
                <option key={subject._id} value={subject.nome}>{subject.nome}</option>
              ))}
            </select>
          )}
          <button type="submit" className="register-button">Registrar</button>
        </form>
      )}
    </div>
  );
}

export default Register;
