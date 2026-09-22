# Raaghav Malik — personal site

The source for [raaghavm.github.io](https://raaghavm.github.io/), a small static site about work across brains, classrooms, and markets.

## Edit the site

- Main text and project descriptions: `index.html`
- Colors and layout: `styles.css`
- Interactions and the note map: `app.js`
- Published Obsidian notes: `data/notes.json`

Changes committed to the `main` branch are published by GitHub Pages.

## Connect an Obsidian folder

Keep notes that are safe to publish in a dedicated `Public/` folder. Add frontmatter like this:

```yaml
---
title: What is one more observation worth?
type: question
topics: [brains, markets]
publish: true
from: zebrafish hunting
toward: expert attention
---
```

Only notes marked `publish: true` are exported. Wikilinks such as `[[Another note]]` become edges in the interactive map.

Run from this repository:

```bash
node scripts/export-obsidian.mjs "/path/to/your/vault/Public"
```

Then commit the updated `data/notes.json` file. This keeps the rest of the vault private.
