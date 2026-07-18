import type { Metadata } from 'next';
import './playground.css';

export const metadata: Metadata = {
  title: 'Circuit Playground — Qwearn',
  description:
    'Build quantum circuits with drag-and-drop, see real Qiskit code, and run on a simulator. Interactive quantum computing learning.',
};

export default function PlaygroundLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
