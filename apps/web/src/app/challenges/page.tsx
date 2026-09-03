/**
 * Challenges Module — Challenge Index Page
 *
 * Shows all available challenges as cards with difficulty badges
 * and evaluator type indicators.
 */

import Link from 'next/link';
import Logo from '@web/components/common/Logo';
import Footer from '@web/components/common/Footer';
import { getAllChallengeMetas } from '@web/lib/challenges';
import './challenges.css';
import '../learn/learn.css';

const TYPE_LABELS: Record<string, string> = {
  statevector: 'State Match',
  probability: 'Probability Match',
  equivalence: 'Equivalence',
};

export const metadata = {
  title: 'Challenges — Qwearn',
  description: 'Test your quantum computing skills with interactive circuit challenges. Auto-evaluated against real quantum simulation.',
};

export default function ChallengesPage() {
  const challenges = getAllChallengeMetas();

  return (
    <>
      <nav className="nav">
        <Link href="/" className="nav-brand"><Logo size={28} /></Link>
        <div className="nav-links">
          <Link href="/learn" className="nav-link">Learn</Link>
          <Link href="/algorithms" className="nav-link">Algorithms</Link>
          <Link href="/challenges" className="nav-link nav-link-active">Challenges</Link>
          <Link href="/playground" className="nav-link">Playground</Link>
        </div>
      </nav>

      <main className="challenge-index">
        <div className="challenge-hero">
          <h1 className="challenge-hero-title">Quantum Challenges</h1>
          <p className="challenge-hero-desc">
            Put your skills to the test. Build circuits to achieve specific quantum states
            and get instant feedback from the simulator.
          </p>
        </div>

        <div className="challenge-grid">
          {challenges.map((ch, i) => (
            <Link
              key={ch.id}
              href={`/challenges/${ch.id}`}
              className="challenge-card"
            >
              <div className="challenge-card-header">
                <span className="challenge-card-number">Challenge {i + 1}</span>
                <span className="challenge-card-time">⏱ {ch.estimatedMinutes} min</span>
              </div>
              <span className={`algo-card-difficulty difficulty-${ch.difficulty}`}>
                {ch.difficulty}
              </span>
              <h2 className="challenge-card-title">{ch.title}</h2>
              <p className="challenge-card-desc">{ch.description}</p>
            </Link>
          ))}
        </div>
      </main>

      <Footer />
    </>
  );
}
