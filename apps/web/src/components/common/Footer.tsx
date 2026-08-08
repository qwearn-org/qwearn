'use client';

import React from 'react';
import Link from 'next/link';
import Logo from './Logo';
import ErrorBiteLogo from './ErrorBiteLogo';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-container">
        <div className="footer-top">
          {/* Brand Info Block */}
          <div className="footer-brand">
            <Link href="/" className="footer-logo-link">
              <Logo size={28} />
            </Link>

            <div className="footer-attribution">
              <span>A product of</span>
              <a
                href="https://www.errorbite.in"
                target="_blank"
                rel="noopener noreferrer"
                className="errorbite-brand-link"
              >
                <ErrorBiteLogo size={16} />
                <span className="errorbite-text">ErrorBite</span>
              </a>
            </div>

            <p className="footer-desc">
              The high-fidelity interactive quantum computing workspace with specialized circuit builder and live Qiskit simulation engine.
            </p>

            <div className="footer-socials">
              <a
                href="https://github.com/qwearn-org/qwearn"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon"
                aria-label="GitHub"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                  <path d="M9 18c-4.51 2-5-2-7-2" />
                </svg>
              </a>
              <a
                href="https://linkedin.com/company/errorbite"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon"
                aria-label="LinkedIn"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                  <rect width="4" height="12" x="2" y="9" />
                  <circle cx="4" cy="4" r="2" />
                </svg>
              </a>
              <a
                href="https://twitter.com/errorbite"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon"
                aria-label="Twitter / X"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Nav Links Grid */}
          <div className="footer-nav-grid">
            <div className="footer-column">
              <h4>Product</h4>
              <ul>
                <li><Link href="/playground">Circuit Playground</Link></li>
                <li><Link href="/learn">Guided Lessons</Link></li>
                <li><Link href="/playground">Qiskit Code Generator</Link></li>
                <li><Link href="/playground">Bloch Sphere Visualizer</Link></li>
              </ul>
            </div>

            <div className="footer-column">
              <h4>Ecosystem</h4>
              <ul>
                <li>
                  <a href="https://www.errorbite.in" target="_blank" rel="noopener noreferrer">
                    ErrorBite HQ
                  </a>
                </li>
                <li>
                  <a href="https://www.pikujobs.com" target="_blank" rel="noopener noreferrer">
                    PikuJobs
                  </a>
                </li>
                <li>
                  <a href="https://github.com/qwearn-org/qwearn" target="_blank" rel="noopener noreferrer">
                    Open Source
                  </a>
                </li>
              </ul>
            </div>

            <div className="footer-column">
              <h4>Legal</h4>
              <ul>
                <li><a href="#">Privacy Policy</a></li>
                <li><a href="#">Terms of Service</a></li>
                <li><a href="#">License (MIT)</a></li>
              </ul>
            </div>

            <div className="footer-column">
              <h4>Support</h4>
              <ul>
                <li><a href="mailto:support@errorbite.com">Contact Us</a></li>
                <li><a href="https://github.com/qwearn-org/qwearn/issues" target="_blank" rel="noopener noreferrer">FAQ & Issues</a></li>
                <li><a href="mailto:support@errorbite.com">support@errorbite.com</a></li>
                <li className="partner-link">
                  <a href="mailto:support@errorbite.com" className="highlight-link">
                    ☆ Become a Partner
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer Bottom Bar */}
        <div className="footer-bottom">
          <div className="footer-copyright">
            <span>© {new Date().getFullYear()} qwearn. All rights reserved.</span>
            <span className="bullet-sep">•</span>
            <span className="copyright-attribution">
              A product of{' '}
              <a
                href="https://www.errorbite.in"
                target="_blank"
                rel="noopener noreferrer"
                className="errorbite-brand-link-inline"
              >
                <ErrorBiteLogo size={14} />
                <span className="errorbite-text">ErrorBite</span>
              </a>
            </span>
          </div>

          <div className="footer-made-by">
            Made with pure <span className="heart">♥</span> by qwearn Team
          </div>
        </div>
      </div>
    </footer>
  );
}
