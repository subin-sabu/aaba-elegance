import axios from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
  withCredentials: true, // for http-only cookies
  headers: {
    "Content-Type": "application/json"
  },
});

axiosInstance.interceptors.response.use(
  (res) => res,
  (err) => {
    const normalized = {
      status: err.response?.status || 500,
      message: err.response?.data?.message || err.message,
    }

    
    if (normalized.status == 401) {
      // if refresh token is invalid, then automatically try again. That logic can be added here
    }

    return Promise.reject(normalized)
  }
)

export default axiosInstance;