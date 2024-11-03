// src/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000', // URL do backend Flask
});

// Funções de registro e login
export const registerUser = (data) => api.post('/register', data);
export const loginUser = (data) => api.post('/login', data);

// Funções para listar classes, disciplinas, alunos e notas
export const listClasses = () => api.get('/api/classes');
export const listSubjects = () => api.get('/api/subjects');
export const listScores = () => api.get('/api/scores');
export const listStudents = () => api.get('/api/students');

export default api;
