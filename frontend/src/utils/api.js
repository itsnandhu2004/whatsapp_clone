import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// Auth
export const registerUser = (data) => api.post("/users/register", data);
export const loginUser = (data) => api.post("/users/login", data);
export const logoutUser = () => api.post("/users/logout");
export const getMe = () => api.get("/users/me");
export const getAllUsers = () => api.get("/users");
export const updateProfile = (data) => api.put("/users/me", data);
export const blockUser = (userId) => api.put(`/users/block/${userId}`);
export const unblockUser = (userId) => api.put(`/users/unblock/${userId}`);
export const archiveChat = (userId) => api.put(`/users/archive/${userId}`);
export const unarchiveChat = (userId) => api.put(`/users/unarchive/${userId}`);
export const uploadAvatar = (formData) =>
  api.put("/users/avatar", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

// Messages
export const sendMessage = (data) => {
  if (data instanceof FormData) {
    return api.post("/messages", data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  }
  return api.post("/messages", data);
};
export const getMessages = (userId) => api.get(`/messages/${userId}`);
export const getConversations = () => api.get("/messages/conversations");
export const markAsRead = (userId) => api.put(`/messages/read/${userId}`);
export const deleteMessage = (messageId, type) => api.delete(`/messages/${messageId}`, { data: { type } });
export const editMessage = (messageId, content) => api.put(`/messages/${messageId}`, { content });
export const clearChat = (userId) => api.delete(`/messages/chat/${userId}`);
export const reactToMessage = (messageId, emoji) => api.put(`/messages/${messageId}/react`, { emoji });

// Status
export const getStatuses = () => api.get("/status");
export const createStatus = (data) => {
  if (data instanceof FormData) {
    return api.post("/status", data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  }
  return api.post("/status", data);
};
export const viewStatus = (statusId) => api.put(`/status/${statusId}/view`);
export const deleteStatus = (statusId) => api.delete(`/status/${statusId}`);

// Calls
export const logCall = (data) => api.post("/calls", data);
export const getCallHistory = () => api.get("/calls");

export default api;
