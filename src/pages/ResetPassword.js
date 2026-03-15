import { useState } from "react";
import axios from "axios";

function ResetPassword(){

 const [email,setEmail] = useState("");
 const [newPassword,setNewPassword] = useState("");

 const handleReset = async () => {

   try{

     await axios.post("http://localhost:8081/api/auth/reset-password",{
       email,
       newPassword
     });

     alert("Password updated successfully");

   }catch(err){
     alert("Reset failed");
   }

 }

 return(

   <div className="container">

     <h2>Reset Password</h2>

     <input
       placeholder="Enter Email"
       onChange={(e)=>setEmail(e.target.value)}
     />

     <input
       type="password"
       placeholder="Enter New Password"
       onChange={(e)=>setNewPassword(e.target.value)}
     />

     <button onClick={handleReset}>Reset Password</button>

     <div className="link">
       <a href="/">Back to Login</a>
     </div>

   </div>

 )

}

export default ResetPassword;