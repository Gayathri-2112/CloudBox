import { Link } from "react-router-dom";

export default function CTA(){

return(

<section className="cta">

<h2>
Start storing your files today
</h2>

<p>
Free 5GB storage for every new account
</p>

<Link to="/register" className="btn-primary">
Create Account
</Link>

</section>

)

}