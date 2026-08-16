/**
 * Algorithms Module — Algorithm Index Page
 *
 * Shows all available quantum algorithms as cards with
 * difficulty badges, complexity info, and application tags.
 */

import Link from 'next/link';
import Logo from '@web/components/common/Logo';
import { getAllAlgorithmMetas } from '@web/lib/algorithms';
import './algorithms.css';
import '../learn/learn.css';

export const metadata = {
  title: 'Algorithms — Qwearn',
  description: 'Interactive quantum algorithm tutorials with step-through circuit execution. Learn Grover\'s, Deutsch-Jozsa, and more.',
};

export default function AlgorithmsPage() {
  const algorithms = getAllAlgorithmMetas();

  return (
    <>
      <nav className="nav">
        <Link href="/" className="nav-brand"><Logo size={28} /></Link>
        <div className="nav-links">
          <Link href="/learn" className="nav-link">Learn</Link>
          <Link href="/algorithms" className="nav-link nav-link-active">Algorithms</Link>
          <Link href="/playground" className="nav-link">Circuit Playground</Link>
        </div>
      </nav>

      <main className="algo-index">
        <div className="algo-hero">
          <h1 className="algo-hero-title">Quantum Algorithms</h1>
          <p className="algo-hero-desc">
            Explore famous quantum algorithms with interactive step-through animations.
            Watch how quantum states evolve gate by gate.
          </p>
        </div>

        <div className="algo-grid">
          {algorithms.map((algo, i) => (
            <Link
              key={algo.id}
              href={`/algorithms/${algo.id}`}
              className="algo-card"
            >
              <div className="algo-card-header">
                <span className="algo-card-number">Algorithm {i + 1}</span>
                <span className="algo-card-time">⏱ {algo.estimatedMinutes} min</span>
              </div>
              <span className={`algo-card-difficulty difficulty-${algo.difficulty}`}>
                {algo.difficulty}
              </span>
              <h2 className="algo-card-title">{algo.title}</h2>
              <p className="algo-card-subtitle">{algo.subtitle}</p>
              <div className="algo-card-complexity">
                <span className="algo-complexity-badge">
                  <span className="label">C:</span> {algo.complexity.classical}
                </span>
                <span className="algo-complexity-badge">
                  <span className="label">Q:</span> {algo.complexity.quantum}
                </span>
              </div>
              <div className="algo-card-apps">
                {algo.applications.slice(0, 2).map((app, j) => (
                  <span key={j} className="algo-app-tag">{app}</span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
