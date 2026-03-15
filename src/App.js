import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./styles/style.css";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminDashboard from "./pages/AdminDashboard";

function App(){

 return(

   <BrowserRouter>

     <Routes>

       <Route path="/" element={<Login/>} />

       <Route path="/register" element={<Register/>} />

       <Route path="/admin" element={<AdminDashboard/>} />

     </Routes>

   </BrowserRouter>

 )

}

export default App;