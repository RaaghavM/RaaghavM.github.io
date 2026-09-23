(() => {
  const modeTabs = Array.from(document.querySelectorAll('.notes-mode-tab'));
  const modePanels = Array.from(document.querySelectorAll('.notes-mode-panel'));
  const canvas = document.querySelector('#question-triangle');
  if (!modeTabs.length || !canvas) return;

  const ctx = canvas.getContext('2d');
  const questionText = document.querySelector('#question-space-question');
  const regionText = document.querySelector('#question-space-region');
  const questionCount = document.querySelector('#question-space-count');
  const announcer = document.querySelector('#question-space-announcer');
  const coordinateLabels = {
    brains: document.querySelector('[data-coordinate="brains"]'),
    classrooms: document.querySelector('[data-coordinate="classrooms"]'),
    markets: document.querySelector('[data-coordinate="markets"]')
  };

  let questions = [{
    id: 'fallback',
    question: 'How should intelligent systems decide what information is worth seeking next?',
    region: 'center',
    weights: [1 / 3, 1 / 3, 1 / 3]
  }];
  let cssWidth = 0;
  let cssHeight = 0;
  let vertices = [];
  let currentWeights = [1 / 3, 1 / 3, 1 / 3];
  let currentQuestionId = '';
  let announceTimer = 0;

  function activateMode(name, moveFocus) {
    modeTabs.forEach((button) => {
      const active = button.dataset.notesMode === name;
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', String(active));
      button.tabIndex = active ? 0 : -1;
      if (active && moveFocus) button.focus();
    });
    modePanels.forEach((panel) => {
      panel.hidden = panel.dataset.notesPanel !== name;
    });
    if (name === 'map') {
      requestAnimationFrame(() => dispatchEvent(new Event('resize')));
    } else {
      requestAnimationFrame(resizeTriangle);
    }
  }

  modeTabs.forEach((button, index) => {
    button.addEventListener('click', () => activateMode(button.dataset.notesMode, false));
    button.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      let nextIndex = index;
      if (event.key === 'ArrowLeft') nextIndex = (index - 1 + modeTabs.length) % modeTabs.length;
      if (event.key === 'ArrowRight') nextIndex = (index + 1) % modeTabs.length;
      if (event.key === 'Home') nextIndex = 0;
      if (event.key === 'End') nextIndex = modeTabs.length - 1;
      activateMode(modeTabs[nextIndex].dataset.notesMode, true);
    });
  });

  function colorWithAlpha(color, alpha) {
    const value = color.trim();
    if (/^#[0-9a-f]{6}$/i.test(value)) {
      const red = parseInt(value.slice(1, 3), 16);
      const green = parseInt(value.slice(3, 5), 16);
      const blue = parseInt(value.slice(5, 7), 16);
      return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
    }
    return value;
  }

  function siteColors() {
    const styles = getComputedStyle(document.documentElement);
    return {
      brains: styles.getPropertyValue('--blue').trim() || '#1e42d6',
      classrooms: styles.getPropertyValue('--orange').trim() || '#ff6748',
      markets: styles.getPropertyValue('--yellow').trim() || '#ffe36d'
    };
  }

  function pointFromWeights(weights) {
    return {
      x: weights[0] * vertices[0].x + weights[1] * vertices[1].x + weights[2] * vertices[2].x,
      y: weights[0] * vertices[0].y + weights[1] * vertices[1].y + weights[2] * vertices[2].y
    };
  }

  function weightsFromPoint(point) {
    const [a, b, c] = vertices;
    const denominator = (b.y - c.y) * (a.x - c.x) + (c.x - b.x) * (a.y - c.y);
    const brains = ((b.y - c.y) * (point.x - c.x) + (c.x - b.x) * (point.y - c.y)) / denominator;
    const classrooms = ((c.y - a.y) * (point.x - c.x) + (a.x - c.x) * (point.y - c.y)) / denominator;
    return [brains, classrooms, 1 - brains - classrooms];
  }

  function clampWeights(weights) {
    const clamped = weights.map((value) => Math.max(0, value));
    const total = clamped.reduce((sum, value) => sum + value, 0) || 1;
    return clamped.map((value) => value / total);
  }

  function nearestQuestion(weights) {
    return questions.reduce((closest, question) => {
      const distance = question.weights.reduce((sum, value, index) => {
        const difference = value - weights[index];
        return sum + difference * difference;
      }, 0);
      return distance < closest.distance ? { question, distance } : closest;
    }, { question: questions[0], distance: Infinity }).question;
  }

  function regionLabel(question) {
    const labels = {
      brains: 'Near the brains vertex',
      classrooms: 'Near the classrooms vertex',
      markets: 'Near the markets vertex',
      'brains-classrooms': 'Between brains and classrooms',
      'brains-markets': 'Between brains and markets',
      'classrooms-markets': 'Between classrooms and markets',
      center: 'At the intersection of all three'
    };
    return labels[question.region] || '';
  }

  function scheduleAnnouncement(question) {
    clearTimeout(announceTimer);
    announceTimer = setTimeout(() => {
      announcer.textContent = question.question;
    }, 650);
  }

  function updateSelection(weights, announce) {
    currentWeights = clampWeights(weights);
    const question = nearestQuestion(currentWeights);
    const percentages = currentWeights.map((weight) => Math.round(weight * 100));
    const difference = 100 - percentages.reduce((sum, value) => sum + value, 0);
    percentages[percentages.indexOf(Math.max(...percentages))] += difference;
    coordinateLabels.brains.textContent = `Brains ${percentages[0]}%`;
    coordinateLabels.classrooms.textContent = `Classrooms ${percentages[1]}%`;
    coordinateLabels.markets.textContent = `Markets ${percentages[2]}%`;
    if (question.id !== currentQuestionId) {
      currentQuestionId = question.id;
      questionText.textContent = question.question;
      if (regionText) regionText.textContent = regionLabel(question);
      if (announce) scheduleAnnouncement(question);
    }
    drawTriangle();
  }

  function trianglePath() {
    ctx.beginPath();
    ctx.moveTo(vertices[0].x, vertices[0].y);
    ctx.lineTo(vertices[1].x, vertices[1].y);
    ctx.lineTo(vertices[2].x, vertices[2].y);
    ctx.closePath();
  }

  function drawTriangle() {
    if (!cssWidth || !cssHeight || !vertices.length) return;
    const colors = siteColors();
    ctx.clearRect(0, 0, cssWidth, cssHeight);
    ctx.save();
    trianglePath();
    ctx.clip();
    ctx.fillStyle = '#171a24';
    ctx.fillRect(0, 0, cssWidth, cssHeight);
    [colors.brains, colors.classrooms, colors.markets].forEach((color, index) => {
      const vertex = vertices[index];
      const gradient = ctx.createRadialGradient(vertex.x, vertex.y, 0, vertex.x, vertex.y, cssWidth * .78);
      gradient.addColorStop(0, colorWithAlpha(color, .58));
      gradient.addColorStop(1, colorWithAlpha(color, 0));
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, cssWidth, cssHeight);
    });
    ctx.restore();

    ctx.strokeStyle = '#d6d8df';
    ctx.lineWidth = 1.2;
    trianglePath();
    ctx.stroke();

    const point = pointFromWeights(currentWeights);
    const colorList = [colors.brains, colors.classrooms, colors.markets];
    vertices.forEach((vertex, index) => {
      ctx.strokeStyle = colorWithAlpha(colorList[index], .22 + currentWeights[index] * .58);
      ctx.lineWidth = 1 + currentWeights[index] * 2.5;
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
      ctx.lineTo(vertex.x, vertex.y);
      ctx.stroke();
      ctx.fillStyle = colorList[index];
      ctx.beginPath();
      ctx.arc(vertex.x, vertex.y, 6, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#10121a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(point.x, point.y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = '500 12px "DM Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('brains', vertices[0].x, vertices[0].y - 18);
    ctx.textAlign = 'left';
    ctx.fillText('classrooms', vertices[1].x, vertices[1].y + 24);
    ctx.textAlign = 'right';
    ctx.fillText('markets', vertices[2].x, vertices[2].y + 24);
  }

  function resizeTriangle() {
    if (canvas.closest('[hidden]')) return;
    const rect = canvas.getBoundingClientRect();
    const pixelRatio = Math.min(devicePixelRatio || 1, 2);
    cssWidth = Math.max(280, rect.width);
    cssHeight = Math.max(260, rect.height);
    canvas.width = Math.round(cssWidth * pixelRatio);
    canvas.height = Math.round(cssHeight * pixelRatio);
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    const sidePadding = Math.max(38, cssWidth * .09);
    const topPadding = 48;
    const bottomPadding = 50;
    vertices = [
      { x: cssWidth / 2, y: topPadding },
      { x: sidePadding, y: cssHeight - bottomPadding },
      { x: cssWidth - sidePadding, y: cssHeight - bottomPadding }
    ];
    drawTriangle();
  }

  function updateFromPointer(event) {
    const rect = canvas.getBoundingClientRect();
    const point = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    updateSelection(clampWeights(weightsFromPoint(point)), true);
  }

  canvas.addEventListener('pointerdown', (event) => {
    canvas.setPointerCapture(event.pointerId);
    updateFromPointer(event);
  });
  canvas.addEventListener('pointermove', (event) => {
    if (event.pointerType === 'mouse' || canvas.hasPointerCapture(event.pointerId)) updateFromPointer(event);
  });
  canvas.addEventListener('pointerup', (event) => {
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
  });
  canvas.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'b', 'c', 'm'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'Home') return updateSelection([1 / 3, 1 / 3, 1 / 3], true);
    if (event.key === 'b') return updateSelection([1, 0, 0], true);
    if (event.key === 'c') return updateSelection([0, 1, 0], true);
    if (event.key === 'm') return updateSelection([0, 0, 1], true);
    const point = pointFromWeights(currentWeights);
    const step = 16;
    if (event.key === 'ArrowLeft') point.x -= step;
    if (event.key === 'ArrowRight') point.x += step;
    if (event.key === 'ArrowUp') point.y -= step;
    if (event.key === 'ArrowDown') point.y += step;
    updateSelection(clampWeights(weightsFromPoint(point)), true);
  });

  new ResizeObserver(resizeTriangle).observe(canvas);
  addEventListener('resize', resizeTriangle);
  resizeTriangle();
  updateSelection(currentWeights, false);

  fetch('./data/questions.json')
    .then((response) => {
      if (!response.ok) throw new Error('Question bank unavailable');
      return response.json();
    })
    .then((payload) => {
      if (Array.isArray(payload.questions) && payload.questions.length) questions = payload.questions;
      questionCount.textContent = `${questions.length} questions`;
      currentQuestionId = '';
      updateSelection(currentWeights, false);
    })
    .catch(() => {
      questionCount.textContent = 'Question space';
    });
})();
