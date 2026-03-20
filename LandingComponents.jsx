import { Link } from "react-router-dom";

/* NAVBAR*/

export function Navbar() {
  return (
    <div>

      <nav className="navbar">

        <h2 className="logo">CloudBox</h2>

        <div className="nav-buttons">

          <Link to="/login">
            <button className="login">Login</button>
          </Link>

          <Link to="/register">
            <button className="register">Register</button>
          </Link>

        </div>

      </nav>

    </div>
  );
}


/* HERO*/

export function Hero() {
  return (
    <section className="hero">

      <div className="hero-text">

        <h1>Secure <span>Cloud Storage</span></h1>

        <p>
          Upload, manage and access your files anytime anywhere.
        </p>

        <Link to="/register">
          <button>Get Started</button>
        </Link>

      </div>

      <img src="https://www.hkcert.org/f/guideline/218189/930p523/hkcert-Cloud%20Storage%20Security%20banner-1860x1046.jpg" />

    </section>
  );
}


/* FEATURES*/

export function Features() {
  return (
    <section className="features">

      <h2>Powerful Features</h2>

      <div className="features-list">

        <div className="feature-item">
          <img src="https://img.icons8.com/color/96/cloud-storage.png" />
          <div>
            <h3>Secure Cloud Storage</h3>
            <p>Store your files safely with encrypted cloud storage.</p>
          </div>
        </div>

        <div className="feature-item">
          <img src="https://img.icons8.com/color/96/upload.png" />
          <div>
            <h3>Easy File Upload</h3>
            <p>Upload files quickly and manage them effortlessly.</p>
          </div>
        </div>

        <div className="feature-item">
          <img src="https://img.icons8.com/color/96/share.png" />
          <div>
            <h3>Instant Sharing</h3>
            <p>Share files with your team in seconds.</p>
          </div>
        </div>

      </div>

    </section>
  );
}


/*HOW IT WORKS*/

export function HowItWorks() {
  return (
    <section className="how">

      <h2>How CloudBox Works</h2>

      <div className="steps">

        <div className="step">
          <div className="circle">1</div>
          <h3>Upload Files</h3>
          <p>Upload files securely to your cloud storage.</p>
        </div>

        <div className="step">
          <div className="circle">2</div>
          <h3>Organize Files</h3>
          <p>Create folders and manage files easily.</p>
        </div>

        <div className="step">
          <div className="circle">3</div>
          <h3>Share Securely</h3>
          <p>Share files with teammates anytime.</p>
        </div>

      </div>

    </section>
  );
}

/*WHY CHOOSE US*/

export function WhyChoose() {
  return (
    <section className="why">

      <div className="why-container">

        <div className="why-text">
          <h2>Why Choose CloudBox</h2>

          <p>
            CloudBox provides secure and reliable cloud storage
            designed for individuals and teams.
          </p>

          <ul>
            <li>Secure encrypted storage</li>
            <li>Easy file management</li>
            <li>Fast file sharing</li>
            <li>Access anywhere anytime</li>
          </ul>

        </div>

        <div className="why-image">
          <img src="https://img.icons8.com/color/480/cloud-storage.png"/>
        </div>

      </div>

    </section>
  );
}


/* CALL TO ACTION */

export function CTA() {
  return (

    <section className="hero">

      <div className="hero-text">

        <h1>Start Using <span>CloudBox</span> Today</h1>

        <p>
          Securely store, manage and share your files anytime.
        </p>

        <Link to="/register">
          <button>Get Started</button>
        </Link>

      </div>

      <img src="https://img.icons8.com/color/480/cloud.png"/>

    </section>

  );
}

export function Testimonials() {
  return (
    <section className="testimonials">

      <h2>What Our Users Say</h2>

      <div className="testimonial-container">

        <div className="testimonial">
          <p>
            "CloudBox helps me manage files securely
            and access them from anywhere."
          </p>
          <span>- Sarah M.</span>
        </div>

        <div className="testimonial">
          <p>
            "The file sharing feature makes collaboration
            extremely easy for our team."
          </p>
          <span>- David R.</span>
        </div>

      </div>

    </section>
  );
}

/* FOOTER */

export function Footer() {
  return (
    <footer className="footer">
      <p>© 2026 CloudBox. All rights reserved.</p>
    </footer>
  );
}

/* PRICING */

export function Pricing() {
  return (

    <section className="pricing">

      <h2>Storage Plans</h2>

      <div className="pricing-grid">

        <div className="pricing-card">
          <h3>Free</h3>
          <h2>5 GB</h2>
          <p>Basic storage for personal use.</p>
          <button className="plan-btn">Get Started</button>
        </div>

        <div className="pricing-card">
          <h3>Pro</h3>
          <h2>100 GB</h2>
          <p>Best for professionals and teams.</p>
          <button className="plan-btn">Upgrade</button>
        </div>

        <div className="pricing-card">
          <h3>Enterprise</h3>
          <h2>1 TB</h2>
          <p>Advanced storage for organizations.</p>
          <button className="plan-btn">Contact Us</button>
        </div>

      </div>

    </section>

  );
}