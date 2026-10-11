import axios from "axios";

const API_URL = "http://localhost:8000/api";
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export async function api(path, options = {}) {
  const { body, method = "GET", ...config } = options;

  try {
    const response = await axiosInstance.request({
      ...config,
      url: path,
      method,
      data: body ?? config.data,
    });

    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message ||
        "Request failed"
    );
  }
}

export const auth = {
  login: (data) => api("/auth/login", { method: "POST", body: data }),
  forgot_password: (data) =>
    api("/auth/forgot-password", { method: "POST", body: data }),
  reset_password: (data) => api("/auth/reset-password", {method: "POST", body: data}),
  register: (data) => api("/auth/register", { method: "POST", body: data }),
  me: () => api("/auth/me"),
};
