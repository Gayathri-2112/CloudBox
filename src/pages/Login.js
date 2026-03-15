import { useState } from "react";
import axios from "axios";

function Login(){

 const [email,setEmail] = useState("");
 const [password,setPassword] = useState("");

 const handleLogin = async () => {

   try{

     const res = await axios.post("http://localhost:8081/api/auth/login",{
       email,
       password
     });

     localStorage.setItem("token",res.data);

     alert("Login Successful");

   }catch(err){
     alert("Login Failed");
   }

 }

 return(

   <div className="container">

    <h2>User Login</h2>

    <input placeholder="Email" onChange={(e)=>setEmail(e.target.value)} />

    <br/>

    <input type="password" placeholder="Password" onChange={(e)=>setPassword(e.target.value)} />

    <br/>

    <button onClick={handleLogin}>Login</button>

   </div>

 )

}

export default Login;