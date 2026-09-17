'use client';

/**
 * Research Hub — Curated Quantum Computing Research Index Page
 *
 * Filterable, searchable collection of landmark papers, tutorials, and industry roadmaps.
 */

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Logo from '@web/components/common/Logo';
import Footer from '@web/components/common/Footer';
import {
  getAllResearchItems,
  getResearchCategories,
  getResearchTags,
  filterResearch,
} from '@web/lib/research';
import type { ResearchItem } from '@web/lib/lesson-types';
import './research.css';

const CATEGORY_LABELS: Record<string, string> = {
  all: '📚 All',
  paper: '📄 Papers',
  tutorial: '🎓 Tutorials',
  roadmap: '🗺️ Roadmaps',
};

export default function ResearchPage() {
  const allItems = getAllResearchItems();
  const categories = getResearchCategories();
  const allTags = getResearchTags();

  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagsExpanded, setTagsExpanded] = useState(false);

  const filteredItems = useMemo(
    () => filterResearch(allItems, query, activeCategory, selectedTags),
    [allItems, query, activeCategory, selectedTags]
  );

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setQuery('');
    setActiveCategory('all');
    setSelectedTags([]);
  };

  return (
    <>
      <nav className="nav">
        <Link href="/" className="nav-brand"><Logo size={28} /></Link>
        <div className="nav-links">
          <Link href="/learn" className="nav-link">Learn</Link>
          <Link href="/algorithms" className="nav-link">Algorithms</Link>
          <Link href="/challenges" className="nav-link">Challenges</Link>
          <Link href="/qml" className="nav-link">QML</Link>
          <Link href="/research" className="nav-link nav-link-active">Research</Link>
          <Link href="/playground" className="nav-link">Playground</Link>
        </div>
      </nav>

      <main className="research-index">
        <div className="research-hero">
          <h1 className="research-hero-title">Research Hub</h1>
          <p className="research-hero-desc">
            Curated collection of landmark quantum computing papers, interactive tutorials, and industry roadmaps. Your gateway to the cutting edge of quantum science.
          </p>
        </div>

        {/* Search Bar */}
        <div className="research-search-bar">
          <span className="research-search-icon">🔍</span>
          <input
            type="text"
            className="research-search-input"
            placeholder="Search papers, tutorials, roadmaps..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <span className="research-count">
            {filteredItems.length} / {allItems.length}
          </span>
        </div>

        {/* Category Tabs */}
        <div className="research-category-tabs">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`category-tab ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {CATEGORY_LABELS[cat] ?? cat}
            </button>
          ))}
          {(query || selectedTags.length > 0 || activeCategory !== 'all') && (
            <button className="category-tab" onClick={clearFilters}>
              ✕ Clear
            </button>
          )}
        </div>

        {/* Tag Pills */}
        <div className={`research-tags-row ${tagsExpanded ? 'expanded' : ''}`}>
          {allTags.map((tag) => (
            <button
              key={tag}
              className={`tag-pill ${selectedTags.includes(tag) ? 'selected' : ''}`}
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </button>
          ))}
          <button className="tags-toggle" onClick={() => setTagsExpanded(!tagsExpanded)}>
            {tagsExpanded ? '▲ Less' : '▼ More'}
          </button>
        </div>

        {/* Results Grid */}
        {filteredItems.length > 0 ? (
          <div className="research-grid">
            {filteredItems.map((item) => (
              <ResearchCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="research-empty">
            <div className="research-empty-icon">🔭</div>
            <h3>No results found</h3>
            <p>Try adjusting your search or filters.</p>
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}

function ResearchCard({ item }: { item: ResearchItem }) {
  const catClass = `cat-${item.category}`;
  const diffClass = item.difficulty ? `diff-${item.difficulty}` : '';

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="research-card"
    >
      <div className="research-card-header">
        <span className={`research-card-category ${catClass}`}>
          {item.category}
        </span>
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          {item.difficulty && (
            <span className={`difficulty-badge ${diffClass}`}>
              {item.difficulty}
            </span>
          )}
          {item.year && (
            <span className="research-card-year">{item.year}</span>
          )}
          {item.lastUpdated && (
            <span className="research-card-year">Updated {item.lastUpdated}</span>
          )}
        </div>
      </div>

      <h3 className="research-card-title">{item.title}</h3>

      {item.authors && item.authors.length > 0 && (
        <div className="research-card-authors">
          {item.authors.join(', ')}
        </div>
      )}

      {item.source && (
        <div className="research-card-source">{item.source}</div>
      )}

      {item.organization && (
        <div className="research-card-source">{item.organization}</div>
      )}

      <p className="research-card-desc">
        {item.abstract ?? item.description}
      </p>

      <div className="research-card-footer">
        <div className="research-card-tags">
          {item.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="research-tag-chip">{tag}</span>
          ))}
        </div>
        <span className="research-card-link">
          Open
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </span>
      </div>
    </a>
  );
}
