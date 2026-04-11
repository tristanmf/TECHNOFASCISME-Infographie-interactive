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
      const isOpen = navLinks.classList.toggle('mobile-open');
      btn.setAttribute('aria-expanded', String(isOpen));
    });
    document.addEventListener('click', (e) => {
      if (!btn.contains(e.target) && !navLinks.contains(e.target)) {
        navLinks.classList.remove('mobile-open');
        btn.setAttribute('aria-expanded', 'false');
      }
    });
  }
})();

// ── Keyboard support for interactive cards ──────────────────────
document.querySelectorAll('[role="button"][onclick]').forEach(el => {
  el.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    el.click();
  });
});

// ── Modal system ────────────────────────────────────────────────
window.ModalSystem = {
  open(id) {
    const backdrop = document.getElementById('modal-' + id);
    if (!backdrop) return;
    backdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
    if (!backdrop.dataset.bound) {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) this.close(id);
      });
      backdrop.querySelector('.modal-close')?.addEventListener('click', () => this.close(id));
      backdrop.dataset.bound = 'true';
    }
    if (this._escHandler) {
      document.removeEventListener('keydown', this._escHandler);
    }
    this._escHandler = (e) => {
      if (e.key === 'Escape') this.close(id);
    };
    document.addEventListener('keydown', this._escHandler);
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
  let W;
  let H;
  let hoveredId = null;
  let selectedId = 'thiel';
  const detailKicker = document.getElementById('network-detail-kicker');
  const detailTitle = document.getElementById('network-detail-title');
  const detailBody = document.getElementById('network-detail-body');
  const detailLinks = document.getElementById('network-detail-links');
  const detailLink = document.getElementById('network-detail-link');

  const nodes = [
    { id: 'musk', label: 'Elon Musk', xPct: 0.25, yPct: 0.22, r: 28, color: '#c8102e', group: 'figure', kicker: 'Figure / Plateformes', body: "Point de jonction entre réseau social, IA, contrats publics et influence électorale.", href: 'pages/figures.html' },
    { id: 'thiel', label: 'Peter Thiel', xPct: 0.49, yPct: 0.18, r: 26, color: '#c8102e', group: 'figure', kicker: 'Figure / Capital-risque', body: "Nœud majeur entre capital-risque, surveillance, financement politique et diffusion d'idées néo-réactionnaires.", href: 'pages/figures.html' },
    { id: 'andreessen', label: 'Andreessen', xPct: 0.72, yPct: 0.24, r: 22, color: '#c8102e', group: 'figure', kicker: 'Figure / Doctrine', body: "Voix centrale d'un techno-optimisme offensif, opposé aux freins démocratiques et réglementaires.", href: 'pages/figures.html' },
    { id: 'yarvin', label: 'C. Yarvin', xPct: 0.58, yPct: 0.42, r: 20, color: '#9d174d', group: 'figure', kicker: 'Figure / Théorie', body: "Source doctrinale majeure pour penser l'État comme entreprise et la démocratie comme obstacle.", href: 'pages/figures.html' },
    { id: 'vance', label: 'JD Vance', xPct: 0.39, yPct: 0.44, r: 20, color: '#7e22ce', group: 'figure', kicker: 'Relais institutionnel', body: "Lien entre des idées issues de la droite tech et leur traduction dans l'appareil politique américain.", href: 'pages/figures.html' },
    { id: 'palantir', label: 'Palantir', xPct: 0.5, yPct: 0.66, r: 24, color: '#00d4ff', group: 'company', kicker: 'Entreprise / Données', body: "Cas d'étude central où des infrastructures privées deviennent des instruments de sécurité et de gouvernement.", href: 'pages/infrastructure.html' },
    { id: 'x', label: 'X / Twitter', xPct: 0.14, yPct: 0.44, r: 22, color: '#00d4ff', group: 'company', kicker: 'Entreprise / Plateforme', body: "Espace d'amplification politique, de hiérarchisation algorithmique et de conflictualité informationnelle.", href: 'pages/infrastructure.html' },
    { id: 'doge', label: 'DOGE', xPct: 0.24, yPct: 0.7, r: 22, color: '#f59e0b', group: 'institution', kicker: 'Institution / Brouillage', body: "Structure emblématique du brouillage entre expertise privée, accès aux systèmes fédéraux et démantèlement administratif.", href: 'pages/infrastructure.html' },
    { id: 'anduril', label: 'Anduril', xPct: 0.72, yPct: 0.63, r: 18, color: '#00d4ff', group: 'company', kicker: 'Entreprise / Défense', body: "Incarnation de la privatisation de capacités militaires, sécuritaires et frontalières.", href: 'pages/infrastructure.html' },
    { id: 'nrx', label: 'NRx / Dark\nEnlightenment', xPct: 0.77, yPct: 0.47, r: 20, color: '#7c3aed', group: 'ideology', kicker: 'Idéologie', body: "Corpus doctrinal anti-démocratique structurant pour une partie de l'écosystème étudié.", href: 'pages/ideologies.html' },
    { id: 'cia', label: 'CIA / NSA', xPct: 0.39, yPct: 0.84, r: 18, color: '#374151', group: 'institution', kicker: 'Institution / Renseignement', body: "Représente ici l'arrimage ancien entre certaines entreprises tech et les appareils de sécurité nationale.", href: 'pages/infrastructure.html' },
    { id: 'pentagon', label: 'Pentagon', xPct: 0.64, yPct: 0.84, r: 18, color: '#374151', group: 'institution', kicker: 'Institution / Défense', body: "Lieu d'agrégation entre innovations privées, contrats militaires et souveraineté technique.", href: 'pages/infrastructure.html' },
    { id: 'xai', label: 'xAI / Grok', xPct: 0.1, yPct: 0.63, r: 18, color: '#c8102e', group: 'company', kicker: 'Entreprise / IA', body: "Montre l'imbrication entre plateformes, IA générative et personnalisation idéologique de l'écosystème Musk.", href: 'pages/infrastructure.html' },
    { id: 'eacc', label: 'e/acc', xPct: 0.9, yPct: 0.28, r: 16, color: '#0891b2', group: 'ideology', kicker: 'Idéologie', body: "Version militante d'une accélération technologique assumée, hostile au principe de précaution.", href: 'pages/ideologies.html' },
    { id: 'trump', label: 'Admin Trump', xPct: 0.1, yPct: 0.84, r: 22, color: '#b45309', group: 'institution', kicker: 'Institution / Exécutif', body: "Pôle de traduction politique et administrative de nombreuses proximités étudiées ici.", href: 'pages/democraties.html' },
    { id: 'clearview', label: 'Clearview AI', xPct: 0.58, yPct: 0.95, r: 16, color: '#00d4ff', group: 'company', kicker: 'Entreprise / Biométrie', body: "Exemple d'une entreprise qui pousse à l'extrême la logique d'identification biométrique à grande échelle.", href: 'pages/infrastructure.html' },
  ];

  const edges = [
    { from: 'musk', to: 'x', weight: 3, label: "contrôle de plateforme et hiérarchisation de l'espace public" },
    { from: 'musk', to: 'doge', weight: 3, label: "intervention directe dans l'appareil d'État" },
    { from: 'musk', to: 'xai', weight: 2, label: "chaîne intégrée entre plateforme et IA" },
    { from: 'musk', to: 'trump', weight: 3, label: "alliance politique et influence sur l'exécutif" },
    { from: 'musk', to: 'eacc', weight: 2, label: "affinité avec l'imaginaire accélérationniste" },
    { from: 'musk', to: 'nrx', weight: 1, label: "porosité avec des références anti-démocratiques" },
    { from: 'thiel', to: 'palantir', weight: 3, label: "ancrage industriel dans la surveillance et la donnée" },
    { from: 'thiel', to: 'vance', weight: 3, label: "financement et mise à l'agenda politique" },
    { from: 'thiel', to: 'yarvin', weight: 2, label: "soutien à un répertoire doctrinal commun" },
    { from: 'thiel', to: 'nrx', weight: 2, label: "circulation directe avec la néo-réaction" },
    { from: 'thiel', to: 'anduril', weight: 1, label: "proximité avec l'écosystème defense-tech" },
    { from: 'palantir', to: 'cia', weight: 2, label: "histoire commune avec le renseignement américain" },
    { from: 'palantir', to: 'pentagon', weight: 2, label: "intégration dans la défense et la sécurité" },
    { from: 'palantir', to: 'doge', weight: 2, label: "continuité entre outils de donnée et fonctions d'État" },
    { from: 'andreessen', to: 'nrx', weight: 1, label: "tolérance intellectuelle envers le répertoire néo-réactionnaire" },
    { from: 'andreessen', to: 'eacc', weight: 2, label: "légitimation publique de l'accélération sans frein" },
    { from: 'andreessen', to: 'yarvin', weight: 1, label: "proximité avec certains milieux doctrinaux" },
    { from: 'yarvin', to: 'nrx', weight: 3, label: "source théorique principale du courant" },
    { from: 'vance', to: 'trump', weight: 3, label: "traduction politique et gouvernementale" },
    { from: 'vance', to: 'nrx', weight: 2, label: "référence revendiquée ou reconnue à certaines idées" },
    { from: 'anduril', to: 'pentagon', weight: 2, label: "externalisation de capacités militaires à des start-ups" },
    { from: 'trump', to: 'doge', weight: 2, label: "couverture institutionnelle de la réorganisation administrative" },
    { from: 'clearview', to: 'cia', weight: 1, label: "convergence entre biométrie privée et logiques sécuritaires" },
    { from: 'xai', to: 'eacc', weight: 1, label: "proximité avec un récit d'accélération IA" },
  ];

  function layoutNodes() {
    W = canvas.width = canvas.parentElement.clientWidth;
    H = canvas.height = canvas.parentElement.clientHeight || 500;
    nodes.forEach((node) => {
      node.x = node.xPct * W;
      node.y = node.yPct * H;
    });
  }

  function getNodeById(id) {
    return nodes.find((node) => node.id === id);
  }

  function getRelatedEdges(nodeId) {
    return edges.filter((edge) => edge.from === nodeId || edge.to === nodeId);
  }

  function getNodeAt(x, y) {
    return nodes.find((node) => {
      const dx = node.x - x;
      const dy = node.y - y;
      return Math.sqrt(dx * dx + dy * dy) < node.r + 8;
    });
  }

  function updateDetail(nodeId) {
    const node = getNodeById(nodeId);
    if (!node || !detailTitle || !detailBody || !detailLinks || !detailLink || !detailKicker) return;
    const relatedEdges = getRelatedEdges(nodeId);
    detailKicker.textContent = node.kicker;
    detailTitle.textContent = node.label.replace('\n', ' ');
    detailBody.textContent = node.body;
    detailLink.setAttribute('href', node.href);
    detailLink.textContent = `Ouvrir ${node.group === 'ideology' ? 'la page des idées' : 'la page liée'}`;
    detailLinks.innerHTML = relatedEdges
      .sort((a, b) => b.weight - a.weight)
      .map((edge) => {
        const otherId = edge.from === nodeId ? edge.to : edge.from;
        const other = getNodeById(otherId);
        return `<div class="network-link-item"><strong>${other.label.replace('\n', ' ')}</strong><span>${edge.label}</span></div>`;
      })
      .join('');
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const selectedEdges = selectedId ? getRelatedEdges(selectedId) : [];
    const selectedEdgeKeys = new Set(selectedEdges.map((edge) => `${edge.from}:${edge.to}`));
    const selectedNeighbors = new Set(
      selectedEdges.flatMap((edge) => [edge.from, edge.to])
    );

    edges.forEach((edge) => {
      const from = getNodeById(edge.from);
      const to = getNodeById(edge.to);
      const isActive = selectedEdgeKeys.has(`${edge.from}:${edge.to}`);
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.strokeStyle = isActive ? 'rgba(0, 212, 255, 0.9)' : 'rgba(58, 58, 85, 0.35)';
      ctx.lineWidth = isActive ? edge.weight + 1 : edge.weight;
      ctx.stroke();
    });

    nodes.forEach((node) => {
      const isSelected = node.id === selectedId;
      const isNeighbor = selectedNeighbors.has(node.id);
      const isHovered = node.id === hoveredId;
      const emphasis = isSelected ? 1 : isNeighbor || !selectedId ? 0.85 : 0.35;
      const glowRadius = node.r * (isSelected ? 3.4 : 2.4);
      const grad = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, glowRadius);
      grad.addColorStop(0, `${node.color}${isSelected ? '66' : '33'}`);
      grad.addColorStop(1, `${node.color}00`);
      ctx.beginPath();
      ctx.arc(node.x, node.y, glowRadius, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.globalAlpha = emphasis;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(node.x, node.y, node.r + (isSelected ? 2 : 0), 0, Math.PI * 2);
      ctx.fillStyle = `${node.color}22`;
      ctx.strokeStyle = isSelected ? '#f4f0ff' : node.color;
      ctx.lineWidth = isSelected ? 2.5 : 1.5;
      ctx.fill();
      ctx.stroke();

      const lines = node.label.split('\n');
      ctx.fillStyle = '#e8e6f0';
      ctx.font = `600 ${Math.max(9, node.r * 0.45)}px 'JetBrains Mono', monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.globalAlpha = isHovered || isSelected || isNeighbor || !selectedId ? 1 : 0.55;
      if (lines.length === 1) {
        ctx.fillText(node.label, node.x, node.y);
      } else {
        ctx.fillText(lines[0], node.x, node.y - 7);
        ctx.fillText(lines[1], node.x, node.y + 7);
      }
      ctx.globalAlpha = 1;
    });
  }

  function getPointerXY(e) {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  canvas.addEventListener('mousemove', (e) => {
    const { x, y } = getPointerXY(e);
    const target = getNodeAt(x, y);
    hoveredId = target ? target.id : null;
    canvas.style.cursor = target ? 'pointer' : 'default';
    draw();
  });

  canvas.addEventListener('mouseleave', () => {
    hoveredId = null;
    canvas.style.cursor = 'default';
    draw();
  });

  canvas.addEventListener('click', (e) => {
    const { x, y } = getPointerXY(e);
    const target = getNodeAt(x, y);
    if (!target) return;
    selectedId = target.id;
    updateDetail(selectedId);
    draw();
  });

  // Touch support for mobile
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    const target = getNodeAt(x, y);
    if (!target) return;
    selectedId = target.id;
    updateDetail(selectedId);
    draw();
  }, { passive: false });

  window.addEventListener('resize', () => {
    layoutNodes();
    draw();
  });

  layoutNodes();
  updateDetail(selectedId);
  draw();
}

// ── Glossary data ───────────────────────────────────────────────
const GLOSSARY = {
  nrx: {
    label: 'NRx — Néo-Réactionnaire',
    def: 'Courant fondé par Curtis Yarvin (alias Mencius Moldbug) : la démocratie libérale comme échec systémique, l\'État géré comme une entreprise avec un PDG souverain. Source doctrinale centrale de l\'écosystème étudié ici.'
  },
  eacc: {
    label: 'e/acc — Effective Accelerationism',
    def: 'Doctrine prônant l\'accélération technologique sans entraves réglementaires. Popularisée par Marc Andreessen en 2023. Le principe de précaution y est présenté comme un "ennemi de l\'humanité".'
  },
  doge: {
    label: 'DOGE — Dept. of Government Efficiency',
    def: 'Structure para-gouvernementale dirigée par Musk depuis janvier 2025. Accès controversé aux systèmes fédéraux, licenciements massifs de fonctionnaires, logique de démantèlement administratif sans base légale claire.'
  },
  cathedral: {
    label: 'La Cathédrale',
    def: 'Concept de Yarvin désignant l\'alliance informelle entre grands médias, universités et bureaucratie — ce qu\'il présente comme le "vrai pouvoir" dissimulé derrière la façade démocratique. Équivalent de "deep state" pour les milieux NRx.'
  },
  dark_enlightenment: {
    label: 'Dark Enlightenment',
    def: 'Terme de Nick Land pour le corpus néo-réactionnaire : refus de l\'égalitarisme, hiérarchies "naturelles", rejet de la démocratie comme décélérateur de l\'évolution. A influencé e/acc et certains cercles d\'extrême droite violente.'
  },
  network_state: {
    label: 'Network State',
    def: 'Concept de Balaji Srinivasan (2022) : rassembler en ligne des individus partageant des valeurs, puis acquérir des territoires physiques pour créer de nouveaux États souverains, hors démocraties existantes.'
  },
  rage: {
    label: 'RAGE — Retire All Government Employees',
    def: 'Plan de démantèlement intégral de la fonction publique théorisé par Yarvin. Repris quasi à l\'identique par le DOGE de Musk dès 2025 : licenciements massifs, mise en congé d\'experts indépendants.'
  },
  longtermisme: {
    label: 'Longtermisme',
    def: 'Variante de l\'Effective Altruism : les intérêts des générations futures (potentiellement en nombre infini) priment sur les souffrances présentes. Peut justifier des décisions radicales "pour le bien futur" au détriment des droits actuels.'
  },
  neocameralisme: {
    label: 'Néocaméralisme',
    def: 'Doctrine de Yarvin : l\'État géré comme une entreprise privée. Les citoyens deviennent actionnaires, le dirigeant un PDG à pouvoirs absolus. Les contre-pouvoirs traditionnels sont remplacés par la "discipline du marché".'
  },
  palantir: {
    label: 'Palantir Technologies',
    def: 'Entreprise de données fondée en 2002 par Peter Thiel avec la CIA (via In-Q-Tel). Contrats avec NSA, FBI, ICE, Pentagon. 970M$ de contrats fédéraux en 2025, +1700% en bourse en 3 ans.'
  },
  clearview: {
    label: 'Clearview AI',
    def: 'Start-up de reconnaissance faciale ayant constitué une base de milliards de visages scrappés sur internet sans consentement. Plus de 100M€ d\'amendes RGPD en Europe. Utilisée par des forces de l\'ordre dans plusieurs pays.'
  },
  anduril: {
    label: 'Anduril Industries',
    def: 'Start-up de défense fondée par Palmer Luckey (ex-Oculus), financée par Peter Thiel. Drones autonomes, surveillance frontalière par IA, systèmes d\'armes. Exemple de privatisation de capacités militaires régaliennes.'
  },
  ea: {
    label: 'EA — Effective Altruism',
    def: 'Mouvement philosophique né à Oxford cherchant à "faire le bien de manière optimale" via des métriques quantitatives. Dans ses formes longtermistes, peut justifier des sacrifices présents pour des bénéfices futurs très incertains.'
  }
};

// ── Glossary popover engine ─────────────────────────────────────
function initGlossary() {
  const terms = document.querySelectorAll('.gl-term[data-term]');
  if (!terms.length) return;

  const popover = document.createElement('div');
  popover.id = 'gl-popover';
  popover.setAttribute('role', 'tooltip');
  popover.setAttribute('aria-live', 'polite');
  document.body.appendChild(popover);

  let activeEl = null;
  let hideTimer = null;

  function positionPopover(el) {
    const rect = el.getBoundingClientRect();
    const popW = 300;
    const viewW = window.innerWidth;
    let left = rect.left + rect.width / 2 - popW / 2;
    if (left < 10) left = 10;
    if (left + popW > viewW - 10) left = viewW - popW - 10;
    const top = rect.bottom + 10;
    popover.style.left = left + 'px';
    popover.style.top = top + 'px';
  }

  function showPopover(el) {
    clearTimeout(hideTimer);
    const entry = GLOSSARY[el.dataset.term];
    if (!entry) return;
    popover.innerHTML = `<div class="gl-label">${entry.label}</div><div class="gl-def">${entry.def}</div>`;
    positionPopover(el);
    popover.classList.add('visible');
    activeEl = el;
    el.setAttribute('aria-expanded', 'true');
  }

  function hidePopover() {
    hideTimer = setTimeout(() => {
      popover.classList.remove('visible');
      if (activeEl) {
        activeEl.setAttribute('aria-expanded', 'false');
        activeEl = null;
      }
    }, 120);
  }

  terms.forEach(el => {
    el.setAttribute('aria-expanded', 'false');
    el.setAttribute('aria-haspopup', 'true');
    el.addEventListener('mouseenter', () => showPopover(el));
    el.addEventListener('mouseleave', hidePopover);
    el.addEventListener('focus', () => showPopover(el));
    el.addEventListener('blur', hidePopover);
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      activeEl === el && popover.classList.contains('visible')
        ? hidePopover()
        : showPopover(el);
    });
  });

  // Keep popover open when hovering it
  popover.addEventListener('mouseenter', () => clearTimeout(hideTimer));
  popover.addEventListener('mouseleave', hidePopover);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hidePopover();
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.gl-term') && !e.target.closest('#gl-popover')) {
      hidePopover();
    }
  });

  window.addEventListener('scroll', () => {
    if (activeEl && popover.classList.contains('visible')) {
      positionPopover(activeEl);
    }
  }, { passive: true });
}

// ── Init network on hub page if present ────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initNetworkCanvas('network-canvas');
  initScrollProgress();
  initBackToTop();
  initRiskBars();
  initGlossary();
});

// ── Scroll progress bar ─────────────────────────────────────────
function initScrollProgress() {
  const bar = document.createElement('div');
  bar.id = 'scroll-progress';
  bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);

  window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    const total = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = total > 0 ? (scrolled / total * 100) + '%' : '0%';
  }, { passive: true });
}

// ── Floating back-to-top button ─────────────────────────────────
function initBackToTop() {
  const btn = document.createElement('button');
  btn.id = 'back-to-top';
  btn.setAttribute('aria-label', 'Retour en haut de page');
  btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M8 13V3M4 7l4-4 4 4"/></svg>`;
  document.body.appendChild(btn);

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// ── Risk bar animation (democraties.html) ───────────────────────
function initRiskBars() {
  const bars = document.querySelectorAll('.risk-bar-fill[data-width]');
  if (!bars.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.width = entry.target.dataset.width + '%';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });

  bars.forEach(bar => observer.observe(bar));
}
