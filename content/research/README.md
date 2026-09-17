# content/research — Curated Research Hub Content

This directory contains curated quantum computing research items for the Qwearn Research Hub.

## Structure

```
content/research/
├── papers.json      # Landmark quantum computing papers (arXiv/DOI links)
├── tutorials.json   # Educational tutorials and textbooks
├── roadmaps.json    # Industry quantum computing roadmaps
└── README.md
```

## Item Schema

All items share a common structure:

```json
{
  "id": "unique-slug",
  "title": "Human-readable title",
  "category": "paper" | "tutorial" | "roadmap",
  "tags": ["tag1", "tag2"],
  "description": "1-2 sentence summary",
  "url": "https://external-link",
  "difficulty": "beginner" | "intermediate" | "advanced"
}
```

### Paper-specific fields
- `authors: string[]` — List of authors
- `year: number` — Publication year

### Tutorial-specific fields
- `source: string` — Publisher/platform (e.g. "IBM Quantum", "Xanadu")

### Roadmap-specific fields
- `organization: string` — Company name
- `lastUpdated: string` — Year of last update

## Adding New Items

1. Add a new entry to the appropriate JSON file
2. Ensure the `id` is unique across all files
3. Include at least 2-3 descriptive tags
4. Run `npx next build` to verify the loader picks it up
