import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export async function login(email, password) {
  const res = await axios.post(`${API_URL}/auth/login`, { email, password });
  setToken(res.data.token);
  return res.data;
}

export async function register(name, email, password) {
  const res = await axios.post(`${API_URL}/auth/register`, { name, email, password });
  return res.data;
}

export function setToken(token) {
  localStorage.setItem('token', token);
}

export function getToken() {
  return localStorage.getItem('token');
}

export function removeToken() {
  localStorage.removeItem('token');
} 