import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API,
  withCredentials: true,
});

export default api;

// Public URL helper for posters/thumbnails served from storage
export const fileUrl = (path) => (path ? `${API}/files/${path}` : "");
