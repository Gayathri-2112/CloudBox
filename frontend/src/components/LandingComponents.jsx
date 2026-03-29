import { Link } from "react-router-dom";
import CloudBoxLogo from "./CloudBoxLogo";

/* NAVBAR */
export function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" style={{ textDecoration: "none" }}>
          <CloudBoxLogo size={34} textSize={20} variant="color" />
        </Link>
        <ul className="nav-links">
          <li><a href="#features">Features</a></li>
          <li><a href="#how">How it works</a></li>
          <li><a href="#pricing">Pricing</a></li>
        </ul>
        <div className="nav-buttons">
          <Link to="/login"><button className="login">Sign in</button></Link>
          <Link to="/register"><button className="register">Get started</button></Link>
        </div>
      </div>
    </nav>
  );
}

/* HERO */
export function Hero() {
  return (
    <section className="hero">
      <div className="hero-orb hero-orb-1" />
      <div className="hero-orb hero-orb-2" />
      <div className="hero-content">
        <div className="hero-badge">
          <span className="hero-badge-dot" />
          Trusted by 10,000+ teams worldwide
        </div>
        <h1>The Secure Cloud<br /><span>Built for Teams</span></h1>
        <p>
          CloudBox delivers enterprise-grade encrypted storage, seamless file sharing,
          and real-time collaboration — without the complexity.
        </p>
        <div className="hero-actions">
          <Link to="/register">
            <button className="btn-primary">Start for free →</button>
          </Link>
          <Link to="/login">
            <button className="btn-secondary">Sign in</button>
          </Link>
        </div>
        <div className="hero-stats">
          <div className="stat">
            <div className="stat-number">10K+</div>
            <div className="stat-label">Active Users</div>
          </div>
          <div className="stat">
            <div className="stat-number">99.9%</div>
            <div className="stat-label">Uptime SLA</div>
          </div>
          <div className="stat">
            <div className="stat-number">256-bit</div>
            <div className="stat-label">Encryption</div>
          </div>
          <div className="stat">
            <div className="stat-number">50M+</div>
            <div className="stat-label">Files Stored</div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* TRUST BAR */
export function TrustBar() {
  const logos = ["Acme Corp", "Nexus Inc", "Orbit Labs", "Vertex Co", "Pulse AI"];
  return (
    <div className="trust-bar">
      <p>Trusted by teams at</p>
      <div className="trust-logos">
        {logos.map((l) => <span className="trust-logo" key={l}>{l}</span>)}
      </div>
    </div>
  );
}

/* FEATURES */
const featureData = [
  { icon: "🔒", title: "End-to-End Encryption", desc: "AES-256 encryption at rest and in transit. Only you hold the keys." },
  { icon: "⚡", title: "Lightning Fast Uploads", desc: "Optimized pipeline handles files of any size quickly and reliably." },
  { icon: "🤝", title: "Real-Time Collaboration", desc: "Share folders, leave inline comments, and co-edit without friction." },
  { icon: "📁", title: "Smart Organization", desc: "Nested folders, tags, and instant full-text search across all files." },
  { icon: "🌍", title: "Access Anywhere", desc: "Any device, any browser. Your files are always one click away." },
  { icon: "📊", title: "Full Audit Logs", desc: "Know exactly who accessed, modified, or shared every file and when." },
];

export function Features() {
  return (
    <section className="features" id="features">
      <div className="section-label">Features</div>
      <h2 className="section-title">Everything your team needs</h2>
      <p className="section-sub">
        Powerful tools built for individuals and teams who take their data seriously.
      </p>
      <div className="features-grid">
        {featureData.map((f) => (
          <div className="feature-card" key={f.title}>
            <div className="feature-icon">{f.icon}</div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* HOW IT WORKS */
export function HowItWorks() {
  return (
    <section className="how" id="how">
      <div className="section-label">How It Works</div>
      <h2 className="section-title">Up and running in seconds</h2>
      <p className="section-sub">No complicated setup. Sign up and start storing immediately.</p>
      <div className="steps">
        <div className="step">
          <div className="circle">1</div>
          <h3>Create your account</h3>
          <p>Sign up for free in seconds. No credit card required to get started.</p>
        </div>
        <div className="step">
          <div className="circle">2</div>
          <h3>Upload your files</h3>
          <p>Drag and drop files or entire folders. We handle encryption automatically.</p>
        </div>
        <div className="step">
          <div className="circle">3</div>
          <h3>Share &amp; collaborate</h3>
          <p>Invite teammates, set granular permissions, and work together seamlessly.</p>
        </div>
      </div>
    </section>
  );
}

/* WHY CHOOSE US */
const whyItems = [
  "AES-256 encrypted storage",
  "Role-based access control",
  "Expiring share links",
  "Real-time collaboration &amp; comments",
  "Full activity audit logs",
  "99.9% uptime SLA",
];

const whyVisual = [
  { icon: "🔐", title: "Zero-knowledge encryption", sub: "Your data, your keys" },
  { icon: "⚡", title: "Sub-second file access", sub: "Global CDN delivery" },
  { icon: "🛡️", title: "SOC 2 compliant", sub: "Enterprise-ready security" },
];

export function WhyChoose() {
  return (
    <section className="why">
      <div className="why-container">
        <div className="why-text">
          <div className="section-label">Why CloudBox</div>
          <h2 className="section-title">Security without compromise</h2>
          <p>
            CloudBox was built security-first — giving you enterprise-grade protection
            without the enterprise complexity or price tag.
          </p>
          <ul className="why-list">
            {whyItems.map((item) => (
              <li key={item}>
                <span className="why-check">✓</span>
                <span dangerouslySetInnerHTML={{ __html: item }} />
              </li>
            ))}
          </ul>
        </div>
        <div className="why-visual">
          {whyVisual.map((v) => (
            <div className="why-visual-row" key={v.title}>
              <span className="why-visual-icon">{v.icon}</span>
              <div className="why-visual-text">
                <strong>{v.title}</strong>
                <span>{v.sub}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* TESTIMONIALS */
const testimonials = [
  { text: "CloudBox replaced our old file server overnight. The permissions system is exactly what our team needed.", name: "Sarah M.", role: "Product Manager", initials: "SM" },
  { text: "Collaboration features are outstanding. We comment on files and track changes without leaving the platform.", name: "David R.", role: "Software Engineer", initials: "DR" },
  { text: "Even large video files upload in seconds. The encryption gives me genuine peace of mind.", name: "Aisha K.", role: "Content Creator", initials: "AK" },
  { text: "The admin dashboard gives full visibility into access. Perfect for our compliance requirements.", name: "James T.", role: "IT Administrator", initials: "JT" },
];

export function Testimonials() {
  return (
    <section className="testimonials">
      <div className="section-label">Testimonials</div>
      <h2 className="section-title">Loved by teams everywhere</h2>
      <p className="section-sub">Don't take our word for it — here's what our users say.</p>
      <div className="testimonial-grid">
        {testimonials.map((t) => (
          <div className="testimonial-card" key={t.name}>
            <div className="testimonial-stars">★★★★★</div>
            <p>"{t.text}"</p>
            <div className="testimonial-author">
              <div className="author-avatar">{t.initials}</div>
              <div>
                <div className="author-name">{t.name}</div>
                <div className="author-role">{t.role}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* PRICING */
const plans = [
  {
    name: "Free", storage: "15 GB", sub: "Forever free",
    features: ["15 GB storage", "Up to 3 users", "Basic file sharing", "Email support"],
    cta: "Get started", link: true,
  },
  {
    name: "Pro", storage: "100 GB", sub: "Best for professionals",
    features: ["100 GB storage", "Unlimited users", "Advanced sharing & permissions", "Collaboration & comments", "Priority support"],
    cta: "Upgrade to Pro", link: true, featured: true,
  },
  {
    name: "Enterprise", storage: "1 TB", sub: "For organizations",
    features: ["1 TB storage", "Unlimited users", "Admin dashboard", "Full audit logs", "SSO & compliance", "Dedicated support"],
    cta: "Contact sales", link: false,
  },
];

export function Pricing() {
  return (
    <section className="pricing" id="pricing">
      <div className="section-label">Pricing</div>
      <h2 className="section-title">Simple, transparent plans</h2>
      <p className="section-sub">Start free, upgrade when you need more. No hidden fees, ever.</p>
      <div className="pricing-grid">
        {plans.map((p) => (
          <div className={`pricing-card${p.featured ? " featured" : ""}`} key={p.name}>
            {p.featured && <div className="pricing-badge">Most Popular</div>}
            <h3>{p.name}</h3>
            <div className="price">{p.storage}</div>
            <div className="price-sub">{p.sub}</div>
            <div className="pricing-divider" />
            <ul className="pricing-features">
              {p.features.map((f) => <li key={f}>{f}</li>)}
            </ul>
            {p.link
              ? <Link to="/register"><button className="plan-btn">{p.cta}</button></Link>
              : <button className="plan-btn">{p.cta}</button>
            }
          </div>
        ))}
      </div>
    </section>
  );
}

/* CTA */
export function CTA() {
  return (
    <section className="cta-banner">
      <div className="cta-inner">
        <h2>Ready to take control of <span>your files?</span></h2>
        <p>Join thousands of teams who trust CloudBox with their most important data.</p>
        <div className="cta-actions">
          <Link to="/register">
            <button className="btn-primary">Start for free →</button>
          </Link>
          <Link to="/login">
            <button className="btn-secondary">Sign in</button>
          </Link>
        </div>
      </div>
    </section>
  );
}

/* FOOTER */
export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <CloudBoxLogo size={30} textSize={18} variant="white" style={{ marginBottom: 14 }} />
          <p>Secure, fast, and reliable cloud storage built for modern teams.</p>
          <div className="footer-social">
            <a className="social-btn" href="#" aria-label="Twitter">𝕏</a>
            <a className="social-btn" href="#" aria-label="GitHub">⌥</a>
            <a className="social-btn" href="#" aria-label="LinkedIn">in</a>
          </div>
        </div>
        <div className="footer-links">
          <h4>Product</h4>
          <ul>
            <li><a href="#features">Features</a></li>
            <li><a href="#pricing">Pricing</a></li>
            <li><a href="#">Security</a></li>
            <li><a href="#">Changelog</a></li>
          </ul>
        </div>
        <div className="footer-links">
          <h4>Company</h4>
          <ul>
            <li><a href="#">About</a></li>
            <li><a href="#">Blog</a></li>
            <li><a href="#">Careers</a></li>
            <li><a href="#">Press</a></li>
          </ul>
        </div>
        <div className="footer-links">
          <h4>Support</h4>
          <ul>
            <li><a href="#">Help Center</a></li>
            <li><a href="#">Contact</a></li>
            <li><a href="#">Privacy Policy</a></li>
            <li><a href="#">Terms of Service</a></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© 2026 CloudBox. All rights reserved.</p>
        <div className="footer-bottom-links">
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
          <a href="#">Cookies</a>
        </div>
      </div>
    </footer>
  );
}
