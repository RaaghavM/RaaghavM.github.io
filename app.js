const fallbackNotes = [
  {
    id: 'observation-worth',
    title: 'What is one more observation worth?',
    type: 'Question · brains + markets',
    topics: ['brains', 'markets'],
    body: 'An animal can look again, a model can request more context, and a teacher can ask an expert. In each case, information has a cost. I’m interested in when the next observation changes the decision enough to be worth paying for.',
    from: 'zebrafish hunting',
    toward: 'expert attention'
  },
  {
    id: 'place-fields',
    title: 'Why might place fields be Gaussian?',
    type: 'Question · brains',
    topics: ['brains'],
    body: 'Gaussian tuning is often treated as an observed fact to reproduce. An optimal-control view asks the question in reverse: under what navigation problem would this response shape be useful?',
    from: 'neuromorphic navigation',
    toward: 'normative models'
  },
  {
    id: 'queue-chatbot',
    title: 'The queue behind the chatbot',
    type: 'Note · learning + markets',
    topics: ['learning', 'markets'],
    body: 'When an educational assistant cannot answer, the problem does not disappear—it becomes a routing problem. Who receives the question, how long can it wait, and what counts as an equitable allocation of expertise?',
    from: 'teacher interviews',
    toward: 'network design'
  },
  {
    id: 'arithmetic-algorithm',
    title: 'Arithmetic as an algorithm',
    type: 'Note · learning',
    topics: ['learning'],
    body: 'A student who programs multi-digit addition has to make place value, carrying, and iteration explicit. The algorithm becomes an object they can inspect rather than a recipe they can only repeat.',
    from: 'classroom pilots',
    toward: 'constructionist learning'
  },
  {
    id: 'sentence-distance',
    title: 'A distance between sentences',
    type: 'Question · brains + language',
    topics: ['brains', 'language'],
    body: 'If syntactic objects live in a compositional algebra, what would it mean for two of them to be near each other? Entropy gradients may offer one bridge from formal derivation to neural search.',
    from: 'linguistic Merge',
    toward: 'hippocampal search'
  }
];

const fallbackLinks = [
  { source: 'observation-worth', target: 'place-fields' },
  { source: 'observation-worth', target: 'queue-chatbot' },
  { source: 'place-fields', target: 'sentence-distance' },
  { source: 'queue-chatbot', target: 'arithmetic-algorithm' }
];

const projects = Array.from(document.querySelectorAll('.project'));
const filterButtons = Array.from(document.querySelectorAll('.filter-button'));

function filterProjects(thread) {
  document.documentElement.style.setProperty(
    '--active',
    thread === 'learning' ? '#ff6748' : thread === 'markets' ? '#b59100' : '#1e42d6'
  );
  filterButtons.forEach(function (button) {
    const selected = button.dataset.thread === thread;
    button.classList.toggle('active', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
  projects.forEach(function (project) {
    const match = thread === 'all' || project.dataset.tags.split(' ').includes(thread);
    project.hidden = !match;
    project.classList.toggle('highlighted', thread !== 'all' && match);
  });
}

filterButtons.forEach(function (button) {
  button.addEventListener('click', function () { filterProjects(button.dataset.thread); });
});

document.querySelectorAll('.expand').forEach(function (button) {
  button.addEventListener('click', function (event) {
    event.stopPropagation();
    const project = button.closest('.project');
    const details = project.querySelector('.project-details');
    const willOpen = details.hidden;
    details.hidden = !willOpen;
    button.setAttribute('aria-expanded', String(willOpen));
    button.setAttribute('aria-label', (willOpen ? 'Hide' : 'Show') + ' more about ' + project.querySelector('h3').textContent);
  });
});

let notes = fallbackNotes;
let links = fallbackLinks;
let activeNoteId = notes[0].id;
let graphNodes = [];
let graphAlpha = 1;
let animationFrame = 0;
let hoveredNodeId = null;

const noteList = document.querySelector('#note-list');
const noteView = document.querySelector('#note-view');
const graphCount = document.querySelector('#graph-count');
const canvas = document.querySelector('#note-graph');
const ctx = canvas.getContext('2d');

function addTextElement(parent, tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  element.textContent = text;
  parent.appendChild(element);
  return element;
}

function showNoteById(id) {
  const note = notes.find(function (item) { return item.id === id; });
  if (!note) return;
  activeNoteId = id;
  Array.from(noteList.children).forEach(function (item) {
    item.classList.toggle('active', item.dataset.noteId === id);
  });
  noteView.replaceChildren();
  addTextElement(noteView, 'p', 'note-type', note.type || 'Note');
  addTextElement(noteView, 'h3', '', note.title);
  addTextElement(noteView, 'p', '', note.body || '');
  const route = document.createElement('div');
  route.className = 'note-route';
  addTextElement(route, 'span', '', 'came from');
  route.append(document.createTextNode(' ' + (note.from || 'a previous question') + ' '));
  addTextElement(route, 'span', '', 'leads toward');
  route.append(document.createTextNode(' ' + (note.toward || 'another note')));
  noteView.appendChild(route);
  drawGraph();
}

function renderNoteList() {
  noteList.replaceChildren();
  notes.forEach(function (note, index) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'note-item' + (note.id === activeNoteId ? ' active' : '');
    button.dataset.noteId = note.id;
    button.setAttribute('role', 'listitem');
    addTextElement(button, 'span', 'note-num', String(index + 1).padStart(2, '0'));
    addTextElement(button, 'span', '', note.title);
    button.addEventListener('click', function () { showNoteById(note.id); });
    noteList.appendChild(button);
  });
  graphCount.textContent = notes.length + (notes.length === 1 ? ' note' : ' notes');
}

function colorFor(note) {
  const topics = note.topics || [];
  if (topics.includes('learning')) return '#ff6748';
  if (topics.includes('markets')) return '#ffe36d';
  if (topics.includes('brains')) return '#5f7cff';
  return '#f7f7f2';
}

function resizeGraph() {
  const rect = canvas.getBoundingClientRect();
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.max(1, Math.round(rect.width * ratio));
  canvas.height = Math.max(1, Math.round(rect.height * ratio));
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  graphAlpha = Math.max(graphAlpha, .35);
  animateGraph();
}

function resetGraph() {
  const width = canvas.clientWidth || 400;
  const height = canvas.clientHeight || 330;
  graphNodes = notes.map(function (note, index) {
    const angle = (index / Math.max(notes.length, 1)) * Math.PI * 2 - Math.PI / 2;
    const ring = Math.min(width, height) * .28;
    return {
      id: note.id,
      note: note,
      x: width / 2 + Math.cos(angle) * ring,
      y: height / 2 + Math.sin(angle) * ring,
      vx: 0,
      vy: 0
    };
  });
  graphAlpha = 1;
  animateGraph();
}

function simulateGraph() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const byId = new Map(graphNodes.map(function (node) { return [node.id, node]; }));

  for (let i = 0; i < graphNodes.length; i += 1) {
    const a = graphNodes[i];
    for (let j = i + 1; j < graphNodes.length; j += 1) {
      const b = graphNodes[j];
      let dx = b.x - a.x;
      let dy = b.y - a.y;
      const distanceSquared = Math.max(dx * dx + dy * dy, 80);
      const force = 900 / distanceSquared * graphAlpha;
      const distance = Math.sqrt(distanceSquared);
      dx /= distance;
      dy /= distance;
      a.vx -= dx * force;
      a.vy -= dy * force;
      b.vx += dx * force;
      b.vy += dy * force;
    }
  }

  links.forEach(function (link) {
    const source = byId.get(link.source);
    const target = byId.get(link.target);
    if (!source || !target) return;
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const distance = Math.max(Math.hypot(dx, dy), 1);
    const force = (distance - 105) * .0035 * graphAlpha;
    source.vx += dx / distance * force;
    source.vy += dy / distance * force;
    target.vx -= dx / distance * force;
    target.vy -= dy / distance * force;
  });

  graphNodes.forEach(function (node) {
    node.vx += (width / 2 - node.x) * .0009 * graphAlpha;
    node.vy += (height / 2 - node.y) * .0009 * graphAlpha;
    node.vx *= .88;
    node.vy *= .88;
    node.x = Math.max(24, Math.min(width - 24, node.x + node.vx));
    node.y = Math.max(24, Math.min(height - 24, node.y + node.vy));
  });

  graphAlpha *= .975;
}

function drawGraph() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  ctx.clearRect(0, 0, width, height);
  const byId = new Map(graphNodes.map(function (node) { return [node.id, node]; }));

  links.forEach(function (link) {
    const source = byId.get(link.source);
    const target = byId.get(link.target);
    if (!source || !target) return;
    ctx.strokeStyle = '#4c5160';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(source.x, source.y);
    ctx.lineTo(target.x, target.y);
    ctx.stroke();
  });

  graphNodes.forEach(function (node) {
    const active = node.id === activeNoteId;
    const hovered = node.id === hoveredNodeId;
    ctx.fillStyle = colorFor(node.note);
    ctx.beginPath();
    ctx.arc(node.x, node.y, active ? 9 : hovered ? 8 : 6, 0, Math.PI * 2);
    ctx.fill();
    if (active) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(node.x, node.y, 14, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = active || hovered ? '#ffffff' : '#b7bbc7';
    ctx.font = (active ? '500 ' : '400 ') + '11px "DM Mono", monospace';
    ctx.textAlign = node.x > width * .62 ? 'right' : 'left';
    const label = node.note.title.length > 31 ? node.note.title.slice(0, 29) + '…' : node.note.title;
    ctx.fillText(label, node.x + (node.x > width * .62 ? -12 : 12), node.y + 4);
  });
}

function animateGraph() {
  if (animationFrame) return;
  function frame() {
    animationFrame = 0;
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (graphAlpha > .01 && !reducedMotion) simulateGraph();
    drawGraph();
    if (reducedMotion) graphAlpha = 0;
    if (graphAlpha > .01) animationFrame = requestAnimationFrame(frame);
  }
  animationFrame = requestAnimationFrame(frame);
}

function nodeAtPointer(event) {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  let closest = null;
  let closestDistance = 18;
  graphNodes.forEach(function (node) {
    const distance = Math.hypot(node.x - x, node.y - y);
    if (distance < closestDistance) {
      closest = node;
      closestDistance = distance;
    }
  });
  return closest;
}

canvas.addEventListener('pointermove', function (event) {
  const node = nodeAtPointer(event);
  hoveredNodeId = node ? node.id : null;
  canvas.style.cursor = node ? 'pointer' : 'crosshair';
  drawGraph();
});
canvas.addEventListener('pointerleave', function () {
  hoveredNodeId = null;
  drawGraph();
});
canvas.addEventListener('click', function (event) {
  const node = nodeAtPointer(event);
  if (node) showNoteById(node.id);
});

function applyNotePayload(payload) {
  const nextNotes = Array.isArray(payload) ? payload : payload && payload.notes;
  const nextLinks = Array.isArray(payload && payload.links) ? payload.links : [];
  if (!Array.isArray(nextNotes) || !nextNotes.length) return;
  notes = nextNotes.map(function (note, index) {
    return Object.assign({}, note, {
      id: note.id || 'note-' + index,
      topics: Array.isArray(note.topics) ? note.topics : []
    });
  });
  links = nextLinks;
  activeNoteId = notes[0].id;
  renderNoteList();
  showNoteById(activeNoteId);
  resetGraph();
}

renderNoteList();
showNoteById(activeNoteId);
resizeGraph();
resetGraph();
addEventListener('resize', resizeGraph);

fetch('./data/notes.json')
  .then(function (response) {
    if (!response.ok) throw new Error('No published notes file');
    return response.json();
  })
  .then(applyNotePayload)
  .catch(function () {
    /* The built-in notes remain visible until an Obsidian export replaces them. */
  });

document.querySelector('#footer-wander').addEventListener('click', function () {
  const targets = ['projects', 'notes', 'papers', 'about'];
  const target = targets[Math.floor(Math.random() * targets.length)];
  document.querySelector('#' + target).scrollIntoView({
    behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
  });
});


(() => {
  const domainTabs = Array.from(document.querySelectorAll('.why-tab'));
  const domainPanels = Array.from(document.querySelectorAll('.why-content'));
  if (!domainTabs.length) return;
  function activateDomainReason(name, moveFocus) {
    domainTabs.forEach(function (button) {
      const active = button.dataset.why === name;
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', String(active));
      button.tabIndex = active ? 0 : -1;
      if (active && moveFocus) button.focus();
    });
    domainPanels.forEach(function (panel) {
      panel.hidden = panel.dataset.why !== name;
    });
  }
  domainTabs.forEach(function (button, index) {
    button.addEventListener('click', function () {
      activateDomainReason(button.dataset.why, false);
    });
    button.addEventListener('keydown', function (event) {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      let nextIndex = index;
      if (event.key === 'ArrowLeft') nextIndex = (index - 1 + domainTabs.length) % domainTabs.length;
      if (event.key === 'ArrowRight') nextIndex = (index + 1) % domainTabs.length;
      if (event.key === 'Home') nextIndex = 0;
      if (event.key === 'End') nextIndex = domainTabs.length - 1;
      activateDomainReason(domainTabs[nextIndex].dataset.why, true);
    });
  });
})();
