/* ============================================================
   TECHNOFASCISME — Main JS
   Modals, Nav, Network viz, interactions
   ============================================================ */

// ── Nav active state ────────────────────────────────────────────
(function() {
  const links = document.querySelectorAll('.nav-links a');
  const current = window.location.pathname.split('/').pop() || 'index.html';
  links.forEach(link => {
    const href = link.getAttribute('href');
    if (href === current || (current === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  // Mobile menu
  const btn = document.querySelector('.nav-mobile-btn');
  const navLinks = document.querySelector('.nav-links');
  if (btn && navLinks) {
    btn.addEventListener('click', () => {
      navLinks.classList.toggle('mobile-open');
    });
    document.addEventListener('click', (e) => {
      if (!btn.contains(e.target) && !navLinks.contains(e.target)) {
        navLinks.classList.remove('mobile-open');
      }
    });
  }
})();

// ── Modal system ────────────────────────────────────────────────
window.ModalSystem = {
  open(id) {
    const backdrop = document.getElementById('modal-' + id);
    if (!backdrop) return;
    backdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) this.close(id);
    });
    backdrop.querySelector('.modal-close')?.addEventListener('click', () => this.close(id));
    document.addEventListener('keydown', this._escHandler = (e) => {
      if (e.key === 'Escape') this.close(id);
    });
  },
  close(id) {
    const backdrop = document.getElementById('modal-' + id);
    if (!backdrop) return;
    backdrop.classList.remove('open');
    document.body.style.overflow = '';
    document.removeEventListener('keydown', this._escHandler);
  }
};

// ── Counter animation ───────────────────────────────────────────
function animateCounter(el, target, suffix = '', duration = 1500) {
  const start = performance.now();
  const isFloat = target % 1 !== 0;
  const update = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    const value = ease * target;
    el.textContent = (isFloat ? value.toFixed(1) : Math.floor(value)) + suffix;
    if (progress < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

// Observe stat cards
const statObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target;
      const target = parseFloat(el.dataset.target);
      const suffix = el.dataset.suffix || '';
      if (!isNaN(target)) animateCounter(el, target, suffix);
      statObserver.unobserve(el);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('[data-target]').forEach(el => statObserver.observe(el));

// ── Network visualization (canvas) ─────────────────────────────
function initNetworkCanvas(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let W, H, animId;
  let isDragging = false;
  let dragNode = null;
  let dragOffX = 0, dragOffY = 0;

  // Nodes
  const nodes = [
    { id: 'musk',    label: 'Elon Musk',     x: 0, y: 0, r: 28, color: '#c8102e', group: 'figure' },
    { id: 'thiel',   label: 'Peter Thiel',   x: 0, y: 0, r: 26, color: '#c8102e', group: 'figure' },
    { id: 'andreessen', label: 'Andreessen', x: 0, y: 0, r: 22, color: '#c8102e', group: 'figure' },
    { id: 'yarvin',  label: 'C. Yarvin',     x: 0, y: 0, r: 20, color: '#9d174d', group: 'figure' },
    { id: 'vance',   label: 'JD Vance',      x: 0, y: 0, r: 20, color: '#7e22ce', group: 'figure' },
    { id: 'palantir',label: 'Palantir',      x: 0, y: 0, r: 24, color: '#00d4ff', group: 'company' },
    { id: 'x',       label: 'X / Twitter',   x: 0, y: 0, r: 22, color: '#00d4ff', group: 'company' },
    { id: 'doge',    label: 'DOGE',          x: 0, y: 0, r: 22, color: '#f59e0b', group: 'institution' },
    { id: 'anduril', label: 'Anduril',       x: 0, y: 0, r: 18, color: '#00d4ff', group: 'company' },
    { id: 'nrx',     label: 'NRx / Dark\nEnlightenment', x: 0, y: 0, r: 20, color: '#7c3aed', group: 'ideology' },
    { id: 'cia',     label: 'CIA / NSA',     x: 0, y: 0, r: 18, color: '#374151', group: 'institution' },
    { id: 'pentagon',label: 'Pentagon',      x: 0, y: 0, r: 18, color: '#374151', group: 'institution' },
    { id: 'xai',     label: 'xAI / Grok',   x: 0, y: 0, r: 18, color: '#c8102e', group: 'company' },
    { id: 'eacc',    label: 'e/acc',         x: 0, y: 0, r: 16, color: '#0891b2', group: 'ideology' },
    { id: 'trump',   label: 'Admin Trump',   x: 0, y: 0, r: 22, color: '#b45309', group: 'institution' },
    { id: 'clearview', label: 'Clearview AI', x: 0, y: 0, r: 16, color: '#00d4ff', group: 'company' },
  ];

  const edges = [
    { from: 'musk', to: 'x', weight: 3 },
    { from: 'musk', to: 'doge', weight: 3 },
    { from: 'musk', to: 'xai', weight: 2 },
    { from: 'musk', to: 'trump', weight: 3 },
    { from: 'musk', to: 'eacc', weight: 2 },
    { from: 'musk', to: 'nrx', weight: 1 },
    { from: 'thiel', to: 'palantir', weight: 3 },
    { from: 'thiel', to: 'vance', weight: 3 },
    { from: 'thiel', to: 'yarvin', weight: 2 },
    { from: 'thiel', to: 'nrx', weight: 2 },
    { from: 'thiel', to: 'anduril', weight: 1 },
    { from: 'palantir', to: 'cia', weight: 2 },
    { from: 'palantir', to: 'pentagon', weight: 2 },
    { from: 'palantir', to: 'doge', weight: 2 },
    { from: 'andreessen', to: 'nrx', weight: 1 },
    { from: 'andreessen', to: 'eacc', weight: 2 },
    { from: 'andreessen', to: 'yarvin', weight: 1 },
    { from: 'yarvin', to: 'nrx', weight: 3 },
    { from: 'vance', to: 'trump', weight: 3 },
    { from: 'vance', to: 'nrx', weight: 2 },
    { from: 'anduril', to: 'pentagon', weight: 2 },
    { from: 'trump', to: 'doge', weight: 2 },
    { from: 'clearview', to: 'cia', weight: 1 },
    { from: 'xai', to: 'eacc', weight: 1 },
  ];

  // Position nodes in a force-directed-ish layout
  function setInitialPositions() {
    W = canvas.width = canvas.parentElement.clientWidth;
    H = canvas.height = canvas.parentElement.clientHeight || 480;
    const cx = W / 2, cy = H / 2;
    const groupCenters = {
      figure:      { x: cx,       y: cy },
      company:     { x: cx + 180, y: cy - 80 },
      institution: { x: cx - 150, y: cy + 120 },
      ideology:    { x: cx + 60,  y: cy + 160 },
    };
    nodes.forEach((n, i) => {
      if (n.x === 0 && n.y === 0) {
        const gc = groupCenters[n.group] || { x: cx, y: cy };
        const angle = (i / nodes.length) * Math.PI * 2;
        const radius = 80 + Math.random() * 60;
        n.x = gc.x + Math.cos(angle) * radius;
        n.y = gc.y + Math.sin(angle) * radius;
      }
    });
  }

  // Physics
  const vx = nodes.map(() => 0);
  const vy = nodes.map(() => 0);
  let tick = 0;

  function applyForces() {
    const k = 60; // repulsion
    nodes.forEach((a, i) => {
      if (dragNode === a) return;
      let fx = 0, fy = 0;
      // Repulsion
      nodes.forEach((b, j) => {
        if (i === j) return;
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.sqrt(dx*dx + dy*dy) || 1;
        const force = k * k / dist;
        fx += dx / dist * force;
        fy += dy / dist * force;
      });
      // Attraction along edges
      edges.forEach(e => {
        let other = null;
        if (e.from === a.id) other = nodes.find(n => n.id === e.to);
        if (e.to === a.id) other = nodes.find(n => n.id === e.from);
        if (!other) return;
        const dx = a.x - other.x, dy = a.y - other.y;
        const dist = Math.sqrt(dx*dx + dy*dy) || 1;
        const idealDist = 150 / e.weight;
        const force = (dist - idealDist) * 0.008;
        fx -= dx * force;
        fy -= dy * force;
      });
      // Center pull
      fx += (W/2 - a.x) * 0.002;
      fy += (H/2 - a.y) * 0.002;

      vx[i] = (vx[i] + fx * 0.1) * 0.85;
      vy[i] = (vy[i] + fy * 0.1) * 0.85;
      a.x += vx[i];
      a.y += vy[i];
      // Bounds
      a.x = Math.max(a.r + 40, Math.min(W - a.r - 40, a.x));
      a.y = Math.max(a.r + 40, Math.min(H - a.r - 40, a.y));
    });
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Edges
    edges.forEach(e => {
      const from = nodes.find(n => n.id === e.from);
      const to   = nodes.find(n => n.id === e.to);
      if (!from || !to) return;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.strokeStyle = `rgba(58, 58, 85, ${0.3 + e.weight * 0.15})`;
      ctx.lineWidth = e.weight;
      ctx.stroke();
      // Pulse on edge
      if (tick % 120 < 40) {
        const t = (tick % 120) / 40;
        const px = from.x + (to.x - from.x) * t;
        const py = from.y + (to.y - from.y) * t;
        ctx.beginPath();
        ctx.arc(px, py, 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 212, 255, 0.6)';
        ctx.fill();
      }
    });

    // Nodes
    nodes.forEach(n => {
      // Glow
      const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 2.5);
      grad.addColorStop(0, n.color + '40');
      grad.addColorStop(1, n.color + '00');
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r * 2.5, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Node circle
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fillStyle = n.color + '22';
      ctx.strokeStyle = n.color;
      ctx.lineWidth = 1.5;
      ctx.fill();
      ctx.stroke();

      // Label
      const lines = n.label.split('\n');
      ctx.fillStyle = '#e8e6f0';
      ctx.font = `600 ${Math.max(9, n.r * 0.45)}px 'JetBrains Mono', monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (lines.length === 1) {
        ctx.fillText(n.label, n.x, n.y);
      } else {
        ctx.fillText(lines[0], n.x, n.y - 7);
        ctx.fillText(lines[1], n.x, n.y + 7);
      }
    });

    tick++;
  }

  function loop() {
    if (tick < 200) applyForces(); // settle, then stabilize
    draw();
    animId = requestAnimationFrame(loop);
  }

  // Drag
  function getNode(x, y) {
    return nodes.find(n => {
      const dx = n.x - x, dy = n.y - y;
      return Math.sqrt(dx*dx + dy*dy) < n.r + 6;
    });
  }

  function getXY(e) {
    const rect = canvas.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return { x: src.clientX - rect.left, y: src.clientY - rect.top };
  }

  canvas.addEventListener('mousedown', e => {
    const { x, y } = getXY(e);
    dragNode = getNode(x, y);
    if (dragNode) { dragOffX = x - dragNode.x; dragOffY = y - dragNode.y; }
  });

  canvas.addEventListener('mousemove', e => {
    const { x, y } = getXY(e);
    if (dragNode) { dragNode.x = x - dragOffX; dragNode.y = y - dragOffY; }
    canvas.style.cursor = getNode(x, y) ? 'pointer' : 'grab';
  });

  canvas.addEventListener('mouseup', () => { dragNode = null; });
  canvas.addEventListener('mouseleave', () => { dragNode = null; });

  canvas.addEventListener('touchstart', e => {
    const { x, y } = getXY(e);
    dragNode = getNode(x, y);
    if (dragNode) { dragOffX = x - dragNode.x; dragOffY = y - dragNode.y; }
    e.preventDefault();
  }, { passive: false });

  canvas.addEventListener('touchmove', e => {
    const { x, y } = getXY(e);
    if (dragNode) { dragNode.x = x - dragOffX; dragNode.y = y - dragOffY; }
    e.preventDefault();
  }, { passive: false });

  canvas.addEventListener('touchend', () => { dragNode = null; });

  // Resize
  window.addEventListener('resize', () => {
    cancelAnimationFrame(animId);
    setInitialPositions();
    tick = 0;
    loop();
  });

  setInitialPositions();
  loop();
}

// ── Init network on hub page if present ────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initNetworkCanvas('network-canvas');
});
