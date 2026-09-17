/**
 * QML Module — Quantum Machine Learning Index Page
 */

import Link from 'next/link';
import Logo from '@web/components/common/Logo';
import Footer from '@web/components/common/Footer';
import { getAllQMLMetas } from '@web/lib/qml';
import './qml.css';
import '../learn/learn.css';

export const metadata = {
  title: 'Quantum Machine Learning — Qwearn',
  description: 'Interactive Quantum Machine Learning tutorials: Data Encoding, VQCs, Quantum Kernels, and Hybrid Neural Networks.',
};

export default function QMLIndexPage() {
  const topics = getAllQMLMetas();

  return (
    <>
      <nav className="nav">
        <Link href="/" className="nav-brand"><Logo size={28} /></Link>
        <div className="nav-links">
          <Link href="/learn" className="nav-link">Learn</Link>
          <Link href="/algorithms" className="nav-link">Algorithms</Link>
          <Link href="/challenges" className="nav-link">Challenges</Link>
          <Link href="/qml" className="nav-link nav-link-active">QML</Link>
          <Link href="/research" className="nav-link">Research</Link>
          <Link href="/playground" className="nav-link">Playground</Link>
        </div>
      </nav>

      <main className="qml-index">
        <div className="qml-hero">
          <h1 className="qml-hero-title">Quantum Machine Learning</h1>
          <p className="qml-hero-desc">
            Discover how quantum feature maps, variational circuits, and quantum kernel trick elevate classical machine learning algorithms into Hilbert space.
          </p>
        </div>

        <div className="qml-grid">
          {topics.map((topic, i) => (
            <Link
              key={topic.id}
              href={`/qml/${topic.id}`}
              className="qml-card"
            >
              <div className="qml-card-header">
                <span className="qml-card-number">Module {i + 1}</span>
                <span className="qml-card-time">⏱ {topic.estimatedMinutes} min</span>
              </div>
              <h2 className="qml-card-title">{topic.title}</h2>
              <p className="qml-card-subtitle">{topic.subtitle}</p>
              <div className="algo-card-complexity">
                <span className="algo-complexity-badge">
                  <span className="label">C:</span> {topic.complexity.classical}
                </span>
                <span className="algo-complexity-badge">
                  <span className="label">Q:</span> {topic.complexity.quantum}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </main>

      <Footer />
    </>
  );
}
