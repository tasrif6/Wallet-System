import axios from "axios";

const API_URL = `${(
  import.meta.env.VITE_API_URL || "http://localhost:8000"
).replace(/\/$/, "")}/api`;
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
    const detail = error.response?.data?.detail;
    let message;
    if (Array.isArray(detail)) {
      message = detail
        .map((d) => String(d.msg).replace(/^Value error, /, ""))
        .join(", ");    } else if (detail && typeof detail === "object") {
      message = detail.message;
    } else {
      message = detail;
    }
    const err = new Error(
      message ||
        error.response?.data?.message ||
        error.message ||
        "Request failed"
    );
    err.code = detail && typeof detail === "object" ? detail.code : undefined;
    err.status = error.response?.status;
    throw err;
  }
}

export const auth = {
  login: (data) => api("/auth/login", { method: "POST", body: data }),
  forgot_password: (data) =>
    api("/auth/forgot-password", { method: "POST", body: data }),
  verify_reset_code: (data) =>
    api("/auth/verify-reset-code", { method: "POST", body: data }),
  reset_password: (data) =>
    api("/auth/reset-password", { method: "POST", body: data }),
  register: (data) => api("/auth/register", { method: "POST", body: data }),
  me: () => api("/auth/me"),
};
