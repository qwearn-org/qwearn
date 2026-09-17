/**
 * Research Hub loader — imports curated research content from JSON files.
 *
 * Provides filtering and search utilities for the research index page.
 */

import type { ResearchItem } from './lesson-types';

import papersData from '../../../../content/research/papers.json';
import tutorialsData from '../../../../content/research/tutorials.json';
import roadmapsData from '../../../../content/research/roadmaps.json';

const ALL_ITEMS: ResearchItem[] = [
  ...(papersData as ResearchItem[]),
  ...(tutorialsData as ResearchItem[]),
  ...(roadmapsData as ResearchItem[]),
];

/** Get all research items sorted by year (newest first) then title. */
export function getAllResearchItems(): ResearchItem[] {
  return [...ALL_ITEMS].sort((a, b) => {
    // Roadmaps and tutorials without year go first
    const yearA = a.year ?? 9999;
    const yearB = b.year ?? 9999;
    if (yearB !== yearA) return yearB - yearA;
    return a.title.localeCompare(b.title);
  });
}

/** Get unique category list. */
export function getResearchCategories(): string[] {
  return ['all', 'paper', 'tutorial', 'roadmap'];
}

/** Get unique tags across all items, sorted alphabetically. */
export function getResearchTags(): string[] {
  const tagSet = new Set<string>();
  ALL_ITEMS.forEach((item) => item.tags.forEach((tag) => tagSet.add(tag)));
  return [...tagSet].sort();
}

/** Filter research items by query text, category, and selected tags. */
export function filterResearch(
  items: ResearchItem[],
  query: string,
  category: string,
  selectedTags: string[]
): ResearchItem[] {
  const q = query.toLowerCase().trim();

  return items.filter((item) => {
    // Category filter
    if (category !== 'all' && item.category !== category) return false;

    // Tag filter (AND logic — item must have all selected tags)
    if (selectedTags.length > 0) {
      const hasAllTags = selectedTags.every((tag) => item.tags.includes(tag));
      if (!hasAllTags) return false;
    }

    // Text search across title, description, authors, tags, source, organization
    if (q) {
      const searchable = [
        item.title,
        item.description,
        item.abstract ?? '',
        item.source ?? '',
        item.organization ?? '',
        ...(item.authors ?? []),
        ...item.tags,
      ]
        .join(' ')
        .toLowerCase();
      if (!searchable.includes(q)) return false;
    }

    return true;
  });
}
