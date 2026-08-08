import Link from 'next/link';
import Logo from '@web/components/common/Logo';
import Footer from '@web/components/common/Footer';

export default function Home() {
  return (
    <div className="landing">
      <nav className="nav">
        <Link href="/" className="nav-brand">
          <Logo size={32} />
        </Link>
        <div className="nav-links">
          <Link href="/learn" className="nav-link">
            Learn
          </Link>
          <Link href="/playground" className="nav-link">
            Circuit Playground
          </Link>
        </div>
      </nav>

      <main className="hero">
        <div className="hero-badge">Open Source Quantum Learning</div>
        <h1 className="hero-title">
          Learn Quantum Computing
          <br />
          <span className="hero-accent">By Building Circuits</span>
        </h1>
        <p className="hero-desc">
          Drag-and-drop circuit builder with real Qiskit code generation
          and live quantum simulation. From &ldquo;what is a qubit?&rdquo; to
          Grover&apos;s algorithm.
        </p>
        <div className="hero-actions">
          <Link href="/playground" className="btn-primary">
            Open Circuit Playground →
          </Link>
        </div>

        <div className="features">
          {[
            { icon: '🔧', title: 'Build Circuits', desc: 'Drag-and-drop quantum gate builder' },
            { icon: '💻', title: 'Real Code', desc: 'See actual Qiskit Python code generated live' },
            { icon: '📊', title: 'Live Results', desc: 'Probabilities, statevectors, and Bloch spheres' },
            { icon: '🎓', title: 'Guided Learning', desc: 'Interactive lessons from basics to algorithms' },
          ].map((f) => (
            <div key={f.title} className="feature-card">
              <span className="feature-icon">{f.icon}</span>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}

