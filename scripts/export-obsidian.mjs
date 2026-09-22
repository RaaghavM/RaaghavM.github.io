import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const publicFolder = process.argv[2];
if (!publicFolder) {
  console.error('Usage: node scripts/export-obsidian.mjs /path/to/Obsidian/Public');
  process.exit(1);
}

async function markdownFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return markdownFiles(fullPath);
    return entry.isFile() && entry.name.endsWith('.md') ? [fullPath] : [];
  }));
  return nested.flat();
}

function clean(value = '') {
  return value.trim().replace(/^["']|["']$/g, '');
}

function slugify(value) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-');
}

function parseNote(markdown, file) {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return null;
  const metadata = {};
  match[1].split(/\r?\n/).forEach((line) => {
    const separator = line.indexOf(':');
    if (separator < 0) return;
    metadata[line.slice(0, separator).trim()] = clean(line.slice(separator + 1));
  });
  if (metadata.publish !== 'true') return null;
  const topics = (metadata.topics || '')
    .replace(/^\[|\]$/g, '')
    .split(',')
    .map((topic) => clean(topic))
    .filter(Boolean);
  const title = metadata.title || path.basename(file, '.md');
  const rawLinks = Array.from(match[2].matchAll(/\[\[([^\]|#]+)(?:[|#][^\]]*)?\]\]/g))
    .map((link) => clean(link[1]));
  return {
    id: metadata.slug || slugify(title),
    title,
    type: (metadata.type || 'Note') + (topics.length ? ' · ' + topics.join(' + ') : ''),
    topics,
    body: match[2].trim().split(/\r?\n\r?\n/)[0].replace(/\[\[([^\]]+)\]\]/g, '$1'),
    from: metadata.from || 'a previous question',
    toward: metadata.toward || 'another note',
    rawLinks
  };
}

const files = await markdownFiles(path.resolve(publicFolder));
const parsed = (await Promise.all(files.map(async (file) => parseNote(await readFile(file, 'utf8'), file))))
  .filter(Boolean);
const idsByReference = new Map();
parsed.forEach((note) => {
  idsByReference.set(note.id.toLowerCase(), note.id);
  idsByReference.set(note.title.toLowerCase(), note.id);
  idsByReference.set(slugify(note.title), note.id);
});
const linkKeys = new Set();
const links = [];
parsed.forEach((note) => {
  note.rawLinks.forEach((reference) => {
    const target = idsByReference.get(reference.toLowerCase()) || idsByReference.get(slugify(reference));
    if (!target || target === note.id) return;
    const key = [note.id, target].sort().join('::');
    if (linkKeys.has(key)) return;
    linkKeys.add(key);
    links.push({ source: note.id, target });
  });
});
const notes = parsed.map(({ rawLinks, ...note }) => note);
const output = path.resolve('data/notes.json');
await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, JSON.stringify({ notes, links }, null, 2) + '\n');
console.log('Exported ' + notes.length + ' public notes and ' + links.length + ' links to ' + output);
