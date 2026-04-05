import API from "../api/axiosConfig";
import { jwtDecode } from "jwt-decode";

// ✅ REGISTER
export const registerUser = (data) => {
  return API.post("/auth/register", data);
};

// ✅ LOGIN
export const loginUser = async (data) => {
  const response = await API.post("/auth/login", data);

  // ✅ FIXED
  const token = response.data;

  console.log("Received token:", response); // Debugging log
  localStorage.setItem("token", token);

  const decoded = jwtDecode(token);

  localStorage.setItem("role", decoded.role);
  localStorage.setItem("email", decoded.sub);

  return decoded;
};

// ✅ LOGOUT
export const logoutUser = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("email");
};