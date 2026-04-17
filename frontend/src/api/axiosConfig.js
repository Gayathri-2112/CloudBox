import axios from "axios";
import { clearSession, getValidatedSession } from "../services/sessionService";
import {
  markBackendAvailable,
  markBackendUnavailable,
} from "../utils/backendStatus";
import { isBackendUnavailableError } from "../utils/requestErrors";

const API = axios.create({
  baseURL: "http://localhost:8080/api",
  timeout: 10000,
});

API.interceptors.request.use((config) => {
  const session = getValidatedSession();

  if (session) {
    config.headers.Authorization = `Bearer ${session.token}`;
  }

  return config;

});

API.interceptors.response.use(
  (response) => {
    markBackendAvailable();
    return response;
  },
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      clearSession();
    }

    if (isBackendUnavailableError(error)) {
      markBackendUnavailable(error);
    } else {
      markBackendAvailable();
    }

    return Promise.reject(error);
  }
);


export default API;
