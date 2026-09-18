import Link from 'next/link';
import Logo from '@web/components/common/Logo';
import Footer from '@web/components/common/Footer';

export default function Home() {
  return (
    <div className="landing">
      {/* Navigation */}
      <nav className="nav">
        <Link href="/" className="nav-brand">
          <Logo size={32} />
        </Link>
        <div className="nav-links">
          <Link href="/learn" className="nav-link">Learn</Link>
          <Link href="/algorithms" className="nav-link">Algorithms</Link>
          <Link href="/challenges" className="nav-link">Challenges</Link>
          <Link href="/qml" className="nav-link">QML</Link>
          <Link href="/research" className="nav-link">Research</Link>
          <Link href="/progress" className="nav-link">Progress</Link>
          <Link href="/playground" className="nav-link nav-link-active">Playground</Link>
        </div>
      </nav>

      {/* Futuristic Hero Section */}
      <main className="hero">
        <div className="hero-telemetry-tag">
          <span className="status-pulse-dot"></span>
          <span>SYSTEM_ONLINE // QISKIT_AER_SIMULATOR_ENGINE</span>
        </div>

        <h1 className="hero-title">
          Learn Quantum Computing
          <br />
          <span className="hero-accent">By Building Circuits</span>
        </h1>

        <p className="hero-desc">
          The open-source interactive workspace for quantum mechanics. Construct drag-and-drop circuits, generate real Qiskit Python code live, and visualize 3D Bloch spheres & statevectors in real-time.
        </p>

        <div className="hero-actions">
          <Link href="/playground" className="btn-primary-futuristic">
            Open Circuit Playground →
          </Link>

          <Link href="/learn" className="btn-secondary-futuristic">
            Explore Gate Lessons
          </Link>
        </div>

        {/* Live Interactive Circuit Teaser Preview */}
        <div className="hero-preview-box">
          <div className="preview-header">
            <div className="preview-dots">
              <span className="dot red"></span>
              <span className="dot yellow"></span>
              <span className="dot green"></span>
            </div>
            <span className="preview-title">QISKIT_AER_LIVE_PREVIEW.PY</span>
            <span className="preview-badge">|Ψ⟩ Bell State</span>
          </div>

          <div className="preview-body">
            <div className="preview-code">
              <span className="code-comment"># Generate Bell State |Φ+⟩ = (|00⟩ + |11⟩) / √2</span><br />
              <span className="code-keyword">from</span> qiskit <span className="code-keyword">import</span> QuantumCircuit<br />
              <span className="code-var">qc</span> = QuantumCircuit(<span className="code-num">2</span>)<br />
              <span className="code-var">qc</span>.h(<span className="code-num">0</span>) <span className="code-comment"># Hadamard gate</span><br />
              <span className="code-var">qc</span>.cx(<span className="code-num">0</span>, <span className="code-num">1</span>) <span className="code-comment"># Entangle q0 & q1</span><br />
              <span className="code-var">qc</span>.save_statevector()
            </div>

            <div className="preview-result">
              <span className="result-header">MEASUREMENT PROBABILITIES</span>
              <div className="prob-bar-row">
                <span className="prob-label">|00⟩</span>
                <div className="prob-bar-container">
                  <div className="prob-bar-fill" style={{ width: '50%' }}></div>
                </div>
                <span className="prob-val">50.0%</span>
              </div>
              <div className="prob-bar-row">
                <span className="prob-label">|11⟩</span>
                <div className="prob-bar-container">
                  <div className="prob-bar-fill" style={{ width: '50%' }}></div>
                </div>
                <span className="prob-val">50.0%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Modules Grid */}
        <div className="landing-section-header">
          <h2>Quantum Learning Ecosystem</h2>
          <span className="landing-section-code">// COMPLETE_VERTICAL_STACK</span>
        </div>

        <div className="features-grid">
          {[
            { code: 'MOD_01', icon: '⚡', title: 'Circuit Playground', desc: 'Drag-and-drop gate canvas with real-time Qiskit Python code generation and Aer simulator execution.' },
            { code: 'MOD_02', icon: '📘', title: 'Learn Gate Theory', desc: '7 interactive gate lessons (X, Y, Z, H, Phase, CNOT, Toffoli) with math proofs, animations, and quizzes.' },
            { code: 'MOD_03', icon: '🔮', title: 'Quantum Algorithms', desc: 'Step-through animations for Grover Search, Quantum Teleportation, Deutsch-Jozsa, and Shor factorization.' },
            { code: 'MOD_04', icon: '🏆', title: 'Quantum Challenges', desc: 'Interactive circuit fidelity challenges evaluated against exact statevectors and probability metrics.' },
            { code: 'MOD_05', icon: '🧠', title: 'Quantum Machine Learning', desc: 'Variational Quantum Circuits (VQC), quantum feature mapping, quantum kernels, and hybrid neural nets.' },
            { code: 'MOD_06', icon: '🌐', title: '3D Bloch Sphere & Research', desc: 'Hardware-accelerated 3D Three.js WebGL Bloch spheres, landmark research papers, and industry roadmaps.' },
          ].map((f) => (
            <div key={f.title} className="futuristic-feature-card">
              <div className="feature-card-header">
                <span className="feature-code-tag">{f.code}</span>
                <span className="feature-icon-box">{f.icon}</span>
              </div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Stats Strip */}
        <div className="landing-stats-strip">
          <div className="landing-stat-item">
            <span className="stat-num">7+</span>
            <span className="stat-name">Gate Lessons</span>
          </div>
          <div className="landing-stat-item">
            <span className="stat-num">10+</span>
            <span className="stat-name">Quantum Algorithms</span>
          </div>
          <div className="landing-stat-item">
            <span className="stat-num">3D</span>
            <span className="stat-name">Three.js Visualizer</span>
          </div>
          <div className="landing-stat-item">
            <span className="stat-num">100%</span>
            <span className="stat-name">Open Source</span>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
