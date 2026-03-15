import { useState } from "react";
import axios from "axios";

function Register(){

 const [name,setName] = useState("");
 const [email,setEmail] = useState("");
 const [password,setPassword] = useState("");

 const handleRegister = async () => {

   try{

     await axios.post("http://localhost:8081/api/auth/register",{
       name,
       email,
       password
     });

     alert("User Registered Successfully");

   }catch(err){
     alert("Registration Failed");
   }

 }

 return(

   <div className="container">

    <h2>User Register</h2>

    <input placeholder="Name" onChange={(e)=>setName(e.target.value)} />

    <br/>

    <input placeholder="Email" onChange={(e)=>setEmail(e.target.value)} />

    <br/>

    <input type="password" placeholder="Password" onChange={(e)=>setPassword(e.target.value)} />

    <br/>

    <button onClick={handleRegister}>Register</button>

   </div>

 )

}

export default Register;