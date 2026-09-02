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
function animateCounter(el, target, suffix = '', duration = 1500, decimals = null) {
  const start = performance.now();
  const dec = decimals !== null ? decimals : (target % 1 !== 0 ? 1 : 0);
  const fmt = (v) => v.toLocaleString('fr-FR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  const update = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    const value = ease * target;
    el.textContent = fmt(value) + suffix;
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
      const decimals = el.dataset.decimals != null ? parseInt(el.dataset.decimals, 10) : null;
      if (!isNaN(target)) animateCounter(el, target, suffix, 1500, decimals);
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
  const container = canvas.parentElement;
  let W;
  let H;
  let dpr = 1;
  let hoveredId = null;
  let hoveredEdge = null;
  let selectedId = null;
  let activeType = 'all';
  let tourStep = -1;
  const detailKicker = document.getElementById('network-detail-kicker');
  const detailTitle = document.getElementById('network-detail-title');
  const detailBody = document.getElementById('network-detail-body');
  const detailLinks = document.getElementById('network-detail-links');
  const detailLink = document.getElementById('network-detail-link');
  const detailPanel = document.querySelector('.network-detail');

  // Natures de relation : couleur + style de trait
  const EDGE_TYPES = {
    argent:     { label: 'Argent & capital',  color: '#e8203e', dash: [] },
    contrat:    { label: 'Contrats publics',  color: '#00d4ff', dash: [] },
    politique:  { label: 'Pouvoir politique', color: '#f59e0b', dash: [] },
    idees:      { label: 'Idées',             color: '#a855f7', dash: [6, 5] },
    regulation: { label: 'Régulation',        color: '#22c55e', dash: [2, 4] },
  };

  const nodes = [
    { id: 'musk', label: 'Elon Musk', short: 'Musk', xPct: 0.24, yPct: 0.16, color: '#c8102e', group: 'figure', kicker: 'Figure / Opérateur', body: "Plateforme, IA, satellites militaires, argent électoral : un cumul inédit. Parti du gouvernement en mai 2025, réconcilié avec Trump en septembre, il refinance le camp républicain pour les midterms 2026.", href: 'pages/figures.html' },
    { id: 'thiel', label: 'Peter Thiel', short: 'Thiel', xPct: 0.5, yPct: 0.16, color: '#c8102e', group: 'figure', kicker: 'Figure / Financeur', body: "Le nœud : Palantir, Anduril, Vance, Yarvin. Depuis 2025 il théorise en public que réguler la technologie est l'œuvre de l'Antéchrist.", href: 'pages/figures.html' },
    { id: 'andreessen', label: 'Andreessen', short: 'a16z', xPct: 0.74, yPct: 0.2, color: '#c8102e', group: 'figure', kicker: 'Figure / Financeur', body: "a16z est devenu la machine politique de la tech : super PAC pro-IA (Leading the Future), premier donateur du cycle 2026, guerre contre les lois des États.", href: 'pages/figures.html' },
    { id: 'yarvin', label: 'C. Yarvin', short: 'Yarvin', xPct: 0.6, yPct: 0.42, color: '#9d174d', group: 'figure', kicker: 'Figure / Théoricien', body: "Fournit le vocabulaire depuis 2007 : la Cathédrale, le PDG-monarque, RAGE. Interviewé par le New York Times en 2025.", href: 'pages/figures.html' },
    { id: 'vance', label: 'JD Vance', short: 'Vance', xPct: 0.38, yPct: 0.42, color: '#7e22ce', group: 'figure', kicker: 'Figure / Politique', body: "Le relais institutionnel : financé par Thiel, se réclamant de Yarvin, vice-président et favori républicain pour 2028.", href: 'pages/figures.html' },
    { id: 'karp', label: 'A. Karp', short: 'Karp', xPct: 0.68, yPct: 0.62, color: '#c8102e', group: 'figure', kicker: 'Figure / Opérateur', body: "PDG de Palantir. Défend une « République technologique » où la tech sert l'État et la guerre ; traite les labos d'IA prudents de « marxistes » (2026).", href: 'pages/figures.html' },
    { id: 'palantir', label: 'Palantir', short: 'Palantir', xPct: 0.52, yPct: 0.68, color: '#00d4ff', group: 'company', kicker: 'Entreprise / Données', body: "La colonne vertébrale : ICE, Army (10 Mds$), OTAN, IRS. 8,15 Mds$ de revenus attendus en 2026, capitalisation ~400 Mds$.", href: 'pages/infrastructure.html' },
    { id: 'x', label: 'X · Grok', short: 'X', xPct: 0.1, yPct: 0.4, color: '#00d4ff', group: 'company', kicker: 'Entreprise / Plateforme + IA', body: "Réseau social et IA fusionnés (2025). Amplification des contenus de Musk, incident « MechaHitler », deepfakes sexualisés, première amende DSA.", href: 'pages/infrastructure.html' },
    { id: 'spacex', label: 'SpaceX\nStarlink', short: 'SpaceX', xPct: 0.2, yPct: 0.6, color: '#00d4ff', group: 'company', kicker: 'Entreprise / Infrastructure', body: "Fusées, satellites, IA et réseau social dans une seule entité depuis février 2026. IPO à ~1 750 Mds$ en juin 2026. Contractant du Golden Dome.", href: 'pages/infrastructure.html' },
    { id: 'doge', label: 'DOGE', short: 'DOGE', xPct: 0.32, yPct: 0.74, color: '#f59e0b', group: 'institution', kicker: 'Institution / Dissoute', body: "Créé par décret le 20 janv. 2025, « n'existe plus » en nov. 2025. 214 Mds$ d'économies revendiquées, ~1,4 Md$ vérifiées, 135 Mds$ de coût estimé. L'accès aux données, lui, est resté.", href: 'pages/infrastructure.html' },
    { id: 'anduril', label: 'Anduril', short: 'Anduril', xPct: 0.84, yPct: 0.7, color: '#00d4ff', group: 'company', kicker: 'Entreprise / Défense', body: "Armes autonomes, tours frontalières, logiciel du Golden Dome. Valorisée 61 Mds$ en mai 2026, financée par Founders Fund et a16z.", href: 'pages/infrastructure.html' },
    { id: 'nrx', label: 'NRx / Dark\nEnlightenment', short: 'NRx', xPct: 0.82, yPct: 0.48, color: '#7c3aed', group: 'ideology', kicker: 'Idéologie', body: "Le corpus anti-démocratique de référence : Yarvin, Land. Démocratie = échec ; État = entreprise ; élite technique = classe légitime.", href: 'pages/ideologies.html' },
    { id: 'eacc', label: 'e/acc', short: 'e/acc', xPct: 0.92, yPct: 0.3, color: '#0891b2', group: 'ideology', kicker: 'Idéologie', body: "Accélérer sans frein. Le principe de précaution comme « ennemi ». Manifeste d'Andreessen (2023).", href: 'pages/ideologies.html' },
    { id: 'trump', label: 'Admin Trump', short: 'Trump', xPct: 0.1, yPct: 0.86, color: '#b45309', group: 'institution', kicker: 'Institution / Exécutif', body: "Le lieu où les proximités deviennent décrets : DOGE, base de données unifiée, préemption des lois IA, 75 Mds$ pour ICE, visa ban contre les régulateurs européens.", href: 'pages/democraties.html' },
    { id: 'ice', label: 'ICE', short: 'ICE', xPct: 0.34, yPct: 0.92, color: '#f59e0b', group: 'institution', kicker: 'Institution / Police migratoire', body: "Agence de police la mieux dotée du pays (75 Mds$ sur 4 ans). Client de Palantir, Clearview, Mobile Fortify. 2 411 accords 287(g) avec des polices locales.", href: 'pages/infrastructure.html' },
    { id: 'cia', label: 'CIA', short: 'CIA', xPct: 0.5, yPct: 0.92, color: '#374151', group: 'institution', kicker: 'Institution / Renseignement', body: "Premier client de Palantir via In-Q-Tel : l'arrimage originel entre la tech de Thiel et l'appareil de sécurité nationale.", href: 'pages/infrastructure.html' },
    { id: 'pentagon', label: 'Pentagone', short: 'Pentagone', xPct: 0.7, yPct: 0.9, color: '#374151', group: 'institution', kicker: 'Institution / Défense', body: "Army EA 10 Mds$ (Palantir), Grok for Government (xAI), Golden Dome (Anduril, Palantir, SpaceX).", href: 'pages/infrastructure.html' },
    { id: 'clearview', label: 'Clearview', short: 'Clearview', xPct: 0.88, yPct: 0.9, color: '#00d4ff', group: 'company', kicker: 'Entreprise / Biométrie', body: "Base de 30+ milliards de visages scrappés. Amendes RGPD en Europe ; contrats ICE (9,2 M$) et CBP en 2025-2026.", href: 'pages/infrastructure.html' },
    { id: 'ue', label: 'UE / DSA', short: 'UE', xPct: 0.06, yPct: 0.62, color: '#22c55e', group: 'counter', kicker: 'Contre-pouvoir', body: "Le principal contre-pouvoir réglementaire : amende DSA contre X, enquête Grok, refus de Palantir par la Bundeswehr. Cible de l'offensive commerciale et diplomatique américaine.", href: 'pages/democraties.html' },
  ];

  const edges = [
    { from: 'musk', to: 'x', type: 'argent', weight: 3, label: "propriétaire ; l'algorithme amplifie ses propres contenus" },
    { from: 'musk', to: 'spacex', type: 'argent', weight: 3, label: "PDG ; fusion SpaceX–xAI (fév. 2026), IPO (juin 2026)" },
    { from: 'musk', to: 'doge', type: 'politique', weight: 3, label: "direction de fait, janvier–mai 2025" },
    { from: 'musk', to: 'trump', type: 'argent', weight: 3, label: "≈290 M$ en 2024 ; rupture juin 2025 ; réconciliation sept. 2025 ; ≥85 M$ pour 2026" },
    { from: 'musk', to: 'eacc', type: 'idees', weight: 1, label: "affinité avec l'imaginaire accélérationniste" },
    { from: 'musk', to: 'ue', type: 'politique', weight: 2, label: "« abolir l'UE » après l'amende DSA ; soutien à l'AfD et à Reform UK" },
    { from: 'x', to: 'ue', type: 'regulation', weight: 2, label: "première amende DSA, 120 M€ (déc. 2025) ; enquête étendue à Grok (janv. 2026)" },
    { from: 'spacex', to: 'x', type: 'argent', weight: 2, label: "X absorbé par xAI (mars 2025), xAI par SpaceX (fév. 2026)" },
    { from: 'spacex', to: 'pentagon', type: 'contrat', weight: 2, label: "Starlink, Grok for Government (200 M$), intercepteurs du Golden Dome" },
    { from: 'thiel', to: 'palantir', type: 'argent', weight: 3, label: "co-fondateur, premier actionnaire individuel (~3 %)" },
    { from: 'thiel', to: 'karp', type: 'argent', weight: 2, label: "duo fondateur de Palantir depuis 2003" },
    { from: 'thiel', to: 'vance', type: 'argent', weight: 3, label: "15 M$ pour le Sénat (2022) ; l'a poussé sur le ticket" },
    { from: 'thiel', to: 'yarvin', type: 'argent', weight: 2, label: "investisseur d'Urbit ; Yarvin dit l'avoir « coaché »" },
    { from: 'thiel', to: 'nrx', type: 'idees', weight: 2, label: "« liberté et démocratie ne sont plus compatibles » (2009)" },
    { from: 'thiel', to: 'anduril', type: 'argent', weight: 2, label: "Founders Fund : 1 Md$ dans la levée de 2025" },
    { from: 'karp', to: 'palantir', type: 'argent', weight: 3, label: "PDG depuis la fondation" },
    { from: 'palantir', to: 'ice', type: 'contrat', weight: 3, label: "ImmigrationOS, contrat ICM (>145 M$), outil ELITE sur les données Medicaid" },
    { from: 'palantir', to: 'cia', type: 'contrat', weight: 2, label: "In-Q-Tel, premier client (2005)" },
    { from: 'palantir', to: 'pentagon', type: 'contrat', weight: 3, label: "Army EA 10 Mds$ (2025), Maven, OTAN" },
    { from: 'palantir', to: 'doge', type: 'contrat', weight: 2, label: "« mega API » à l'IRS, base de données fédérale unifiée" },
    { from: 'palantir', to: 'ue', type: 'regulation', weight: 1, label: "1,5 Md£ au Royaume-Uni ; la Bundeswehr refuse Gotham" },
    { from: 'andreessen', to: 'nrx', type: 'idees', weight: 1, label: "qualifie Yarvin d'« ami » ; Nick Land parmi ses « saints »" },
    { from: 'andreessen', to: 'eacc', type: 'idees', weight: 2, label: "Manifeste techno-optimiste (2023)" },
    { from: 'andreessen', to: 'trump', type: 'argent', weight: 2, label: "a16z premier donateur 2026 ; super PAC Leading the Future" },
    { from: 'yarvin', to: 'nrx', type: 'idees', weight: 3, label: "fondateur du courant (2007)" },
    { from: 'vance', to: 'trump', type: 'politique', weight: 3, label: "vice-président ; président des finances du parti" },
    { from: 'vance', to: 'nrx', type: 'idees', weight: 2, label: "« Yarvin a influencé ma pensée » (2024)" },
    { from: 'vance', to: 'ue', type: 'politique', weight: 1, label: "Munich (fév. 2025) : « la menace vient de l'intérieur »" },
    { from: 'anduril', to: 'pentagon', type: 'contrat', weight: 2, label: "Golden Dome, Arsenal-1, intercepteurs spatiaux (2026)" },
    { from: 'trump', to: 'doge', type: 'politique', weight: 2, label: "créé par décret le 20 janv. 2025 ; dissous de fait en nov. 2025" },
    { from: 'trump', to: 'ice', type: 'politique', weight: 3, label: "75 Mds$ (loi du 4 juil. 2025) ; 2 411 accords 287(g)" },
    { from: 'trump', to: 'ue', type: 'politique', weight: 2, label: "visa ban contre Breton (déc. 2025) ; Section 301 contre DSA/DMA" },
    { from: 'clearview', to: 'ice', type: 'contrat', weight: 2, label: "contrat 9,2 M$ (sept. 2025), commandes 2026" },
  ];

  // Parcours guidé : la boucle argent → pouvoir → contrats → argent
  const TOUR = [
    {
      kicker: 'Étape 1 · Argent',
      title: "Financer les candidats",
      body: "Tout commence par des chèques. Thiel donne 15 M$ à Vance pour le Sénat (2022). Musk met ≈290 M$ dans la campagne Trump (2024). a16z devient le premier donateur du cycle 2026.",
      nodes: ['thiel', 'vance', 'musk', 'trump', 'andreessen'],
      edges: [['thiel', 'vance'], ['musk', 'trump'], ['andreessen', 'trump']],
      href: 'pages/figures.html',
    },
    {
      kicker: 'Étape 2 · Pouvoir',
      title: "Entrer dans l'État",
      body: "L'argent devient des postes et des décrets : Vance vice-président, Musk à la tête du DOGE, 75 Mds$ pour ICE, préemption des lois IA des États par décret.",
      nodes: ['vance', 'trump', 'musk', 'doge', 'ice'],
      edges: [['vance', 'trump'], ['musk', 'doge'], ['trump', 'doge'], ['trump', 'ice']],
      href: 'pages/democraties.html',
    },
    {
      kicker: 'Étape 3 · Contrats',
      title: "Transformer les décrets en contrats",
      body: "Les décisions publiques se traduisent en commandes pour les entreprises des financeurs : Palantir (Army 10 Mds$, ImmigrationOS, IRS), Anduril et SpaceX (Golden Dome, Grok for Government).",
      nodes: ['ice', 'doge', 'pentagon', 'palantir', 'anduril', 'spacex', 'clearview'],
      edges: [['palantir', 'ice'], ['palantir', 'doge'], ['palantir', 'pentagon'], ['anduril', 'pentagon'], ['spacex', 'pentagon'], ['clearview', 'ice']],
      href: 'pages/infrastructure.html',
    },
    {
      kicker: 'Étape 4 · La boucle',
      title: "Le retour aux financeurs",
      body: "Ces contrats enrichissent ceux qui ont financé le pouvoir : Thiel, premier actionnaire de Palantir et premier investisseur d'Anduril ; Musk, dont SpaceX vaut ~1 750 Mds$. Argent → pouvoir → contrats → argent : la boucle est fermée.",
      nodes: ['thiel', 'palantir', 'anduril', 'karp', 'musk', 'spacex'],
      edges: [['thiel', 'palantir'], ['thiel', 'anduril'], ['karp', 'palantir'], ['musk', 'spacex']],
      href: 'pages/figures.html',
    },
    {
      kicker: 'Étape 5 · Idées',
      title: "Ce qui légitime la boucle",
      body: "Un corpus explique pourquoi c'est bien ainsi : la démocratie est un obstacle (Yarvin, NRx), la régulation est l'ennemi (Andreessen, e/acc). Vance cite Yarvin ; Thiel prêche l'Antéchrist régulateur.",
      nodes: ['yarvin', 'nrx', 'thiel', 'vance', 'andreessen', 'eacc', 'musk'],
      edges: [['yarvin', 'nrx'], ['thiel', 'nrx'], ['vance', 'nrx'], ['andreessen', 'nrx'], ['andreessen', 'eacc'], ['musk', 'eacc']],
      href: 'pages/ideologies.html',
    },
    {
      kicker: 'Étape 6 · Contre-pouvoir',
      title: "Le seul régulateur qui sanctionne",
      body: "L'Union européenne inflige à X la première amende DSA (120 M€), enquête sur Grok, refuse Palantir dans la Bundeswehr. En retour : Musk veut « abolir l'UE », Washington interdit de visa Thierry Breton.",
      nodes: ['ue', 'x', 'musk', 'trump', 'vance', 'palantir'],
      edges: [['x', 'ue'], ['musk', 'ue'], ['trump', 'ue'], ['vance', 'ue'], ['palantir', 'ue']],
      href: 'pages/democraties.html',
    },
  ];

  // Taille des nœuds selon le nombre de connexions (centralité)
  const degree = {};
  edges.forEach((e) => { degree[e.from] = (degree[e.from] || 0) + 1; degree[e.to] = (degree[e.to] || 0) + 1; });
  nodes.forEach((n) => { n.r = Math.min(30, 13 + (degree[n.id] || 0) * 2.2); });

  // Info-bulle sur les liens
  const tip = document.createElement('div');
  tip.id = 'net-tip';
  container.appendChild(tip);

  function layoutNodes() {
    dpr = window.devicePixelRatio || 1;
    W = container.clientWidth;
    H = container.clientHeight || 500;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const scale = W < 560 ? 0.72 : 1;
    nodes.forEach((node) => {
      node.x = node.xPct * W;
      node.y = node.yPct * H;
      node.rr = node.r * scale;
    });
  }

  const isSmall = () => W < 560;
  const getNodeById = (id) => nodes.find((node) => node.id === id);
  const getRelatedEdges = (nodeId) => edges.filter((edge) => edge.from === nodeId || edge.to === nodeId);
  const edgeVisible = (edge) => activeType === 'all' || edge.type === activeType;
  const edgeKey = (a, b) => [a, b].sort().join(':');

  function getNodeAt(x, y) {
    return nodes.find((node) => Math.hypot(node.x - x, node.y - y) < node.rr + 8);
  }

  function distToSegment(px, py, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay;
    const l2 = dx * dx + dy * dy;
    let t = l2 ? ((px - ax) * dx + (py - ay) * dy) / l2 : 0;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
  }

  function getEdgeAt(x, y) {
    let best = null, bestD = 7;
    edges.forEach((edge) => {
      if (!edgeVisible(edge)) return;
      const a = getNodeById(edge.from), b = getNodeById(edge.to);
      const d = distToSegment(x, y, a.x, a.y, b.x, b.y);
      if (d < bestD) { bestD = d; best = edge; }
    });
    return best;
  }

  // ── Panneau latéral ──
  function renderLinks(list, focusId) {
    if (!detailLinks) return;
    detailLinks.innerHTML = list
      .sort((a, b) => b.weight - a.weight)
      .map((edge) => {
        const otherId = focusId ? (edge.from === focusId ? edge.to : edge.from) : null;
        const t = EDGE_TYPES[edge.type];
        const who = focusId
          ? getNodeById(otherId).label.replace('\n', ' ')
          : `${getNodeById(edge.from).label.replace('\n', ' ')} — ${getNodeById(edge.to).label.replace('\n', ' ')}`;
        return `<div class="network-link-item"><strong><i class="net-dot" style="background:${t.color}"></i>${who} <em class="net-type" style="color:${t.color}">${t.label}</em></strong><span>${edge.label}</span></div>`;
      })
      .join('');
  }

  function updateDetail(nodeId) {
    const node = getNodeById(nodeId);
    if (!node || !detailTitle || !detailBody || !detailLink || !detailKicker) return;
    detailKicker.textContent = node.kicker;
    detailTitle.textContent = node.label.replace('\n', ' ');
    detailBody.textContent = node.body;
    detailLink.setAttribute('href', node.href);
    const linkLabels = { ideology: 'Ouvrir le chapitre Idéologies', figure: 'Ouvrir la fiche', company: 'Ouvrir le chapitre Infrastructure', institution: 'Ouvrir le chapitre lié', counter: 'Ouvrir le chapitre Démocraties' };
    detailLink.textContent = linkLabels[node.group] || 'Ouvrir la page liée';
    renderLinks(getRelatedEdges(nodeId).filter(edgeVisible), nodeId);
  }

  function showIdle() {
    if (!detailTitle) return;
    detailKicker.textContent = 'Lecture guidée';
    detailTitle.textContent = 'Comment lire cette carte';
    detailBody.textContent = "La couleur d'un lien dit sa nature : argent, contrat, pouvoir, idée, régulation. Touchez un nœud pour ses connexions, ou lancez le parcours en six étapes.";
    detailLink.setAttribute('href', 'pages/figures.html');
    detailLink.textContent = 'Ouvrir les fiches';
    if (detailLinks) detailLinks.innerHTML = '';
  }

  // ── Parcours guidé ──
  const tourStart = document.getElementById('net-tour-start');
  const tourPrev = document.getElementById('net-tour-prev');
  const tourNext = document.getElementById('net-tour-next');
  const tourExit = document.getElementById('net-tour-exit');
  const tourStepEl = document.getElementById('net-tour-step');
  const tourBox = document.getElementById('net-tour');

  function setTour(i) {
    tourStep = i;
    selectedId = null;
    if (tourBox) tourBox.classList.toggle('running', i >= 0);
    if (i < 0) { showIdle(); draw(); return; }
    const step = TOUR[i];
    if (tourStepEl) tourStepEl.textContent = `${i + 1} / ${TOUR.length}`;
    if (tourPrev) tourPrev.disabled = i === 0;
    if (tourNext) tourNext.textContent = i === TOUR.length - 1 ? 'Terminer' : 'Suivant →';
    detailKicker.textContent = step.kicker;
    detailTitle.textContent = step.title;
    detailBody.textContent = step.body;
    detailLink.setAttribute('href', step.href);
    detailLink.textContent = 'Approfondir';
    const keys = new Set(step.edges.map(([a, b]) => edgeKey(a, b)));
    renderLinks(edges.filter((e) => keys.has(edgeKey(e.from, e.to))), null);
    draw();
  }

  tourStart?.addEventListener('click', () => { activeType = 'all'; syncChips(); setTour(0); scrollToPanel(); });
  tourPrev?.addEventListener('click', () => setTour(Math.max(0, tourStep - 1)));
  tourNext?.addEventListener('click', () => (tourStep >= TOUR.length - 1 ? setTour(-1) : setTour(tourStep + 1)));
  tourExit?.addEventListener('click', () => setTour(-1));

  // ── Filtres par nature de relation ──
  const chips = document.querySelectorAll('[data-edge-filter]');
  function syncChips() {
    chips.forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.edgeFilter === activeType)));
  }
  chips.forEach((chip) => chip.addEventListener('click', () => {
    activeType = chip.dataset.edgeFilter;
    syncChips();
    if (tourStep >= 0) setTour(-1);
    if (selectedId) updateDetail(selectedId);
    draw();
  }));

  function scrollToPanel() {
    if (!detailPanel || window.innerWidth >= 900) return;
    detailPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ── Dessin ──
  function draw() {
    ctx.clearRect(0, 0, W, H);
    const step = tourStep >= 0 ? TOUR[tourStep] : null;
    const focusEdges = step
      ? new Set(step.edges.map(([a, b]) => edgeKey(a, b)))
      : selectedId ? new Set(getRelatedEdges(selectedId).map((e) => edgeKey(e.from, e.to))) : null;
    const focusNodes = step
      ? new Set(step.nodes)
      : selectedId ? new Set([selectedId, ...getRelatedEdges(selectedId).flatMap((e) => [e.from, e.to])]) : null;

    // liens
    edges.forEach((edge) => {
      const visible = edgeVisible(edge);
      const from = getNodeById(edge.from);
      const to = getNodeById(edge.to);
      const t = EDGE_TYPES[edge.type];
      const isFocus = focusEdges ? focusEdges.has(edgeKey(edge.from, edge.to)) : false;
      const isHover = hoveredEdge === edge;
      let alpha;
      if (!visible) alpha = 0.05;
      else if (focusEdges) alpha = isFocus ? 0.95 : 0.08;
      else alpha = 0.55;
      if (isHover) alpha = 1;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.setLineDash(t.dash);
      ctx.strokeStyle = t.color;
      ctx.globalAlpha = alpha;
      ctx.lineWidth = (isFocus || isHover) ? edge.weight + 1.5 : Math.max(1, edge.weight * 0.8);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    });

    // nœuds
    nodes.forEach((node) => {
      const isSelected = node.id === selectedId;
      const inFocus = focusNodes ? focusNodes.has(node.id) : true;
      const hasVisibleEdge = activeType === 'all' || getRelatedEdges(node.id).some(edgeVisible);
      const isHovered = node.id === hoveredId;
      const emphasis = !hasVisibleEdge ? 0.25 : inFocus ? 1 : 0.3;
      const glowRadius = node.rr * (isSelected ? 3.2 : 2.2);
      const grad = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, glowRadius);
      grad.addColorStop(0, `${node.color}${isSelected ? '66' : '2e'}`);
      grad.addColorStop(1, `${node.color}00`);
      ctx.globalAlpha = emphasis;
      ctx.beginPath();
      ctx.arc(node.x, node.y, glowRadius, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(node.x, node.y, node.rr + (isSelected ? 2 : 0), 0, Math.PI * 2);
      ctx.fillStyle = '#0d0d12';
      ctx.fill();
      ctx.fillStyle = `${node.color}2a`;
      ctx.fill();
      ctx.strokeStyle = isSelected || isHovered ? '#f4f0ff' : node.color;
      ctx.lineWidth = isSelected ? 2.5 : 1.5;
      ctx.stroke();

      const label = isSmall() ? node.short : node.label;
      const lines = label.split('\n');
      const fs = Math.max(isSmall() ? 8 : 9, node.rr * (isSmall() ? 0.5 : 0.45));
      ctx.fillStyle = '#e8e6f0';
      ctx.font = `600 ${fs}px 'JetBrains Mono', monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (lines.length === 1) {
        ctx.fillText(lines[0], node.x, node.y);
      } else {
        ctx.fillText(lines[0], node.x, node.y - fs * 0.6);
        ctx.fillText(lines[1], node.x, node.y + fs * 0.6);
      }
      ctx.globalAlpha = 1;
    });
  }

  function getPointerXY(e) {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function showTip(edge, x, y) {
    const t = EDGE_TYPES[edge.type];
    tip.innerHTML = `<span style="color:${t.color}">${t.label}</span> · ${getNodeById(edge.from).label.replace('\n', ' ')} — ${getNodeById(edge.to).label.replace('\n', ' ')}<br>${edge.label}`;
    tip.style.left = Math.min(x + 14, W - 250) + 'px';
    tip.style.top = (y + 14) + 'px';
    tip.classList.add('visible');
  }
  const hideTip = () => tip.classList.remove('visible');

  canvas.addEventListener('mousemove', (e) => {
    const { x, y } = getPointerXY(e);
    const n = getNodeAt(x, y);
    hoveredId = n ? n.id : null;
    hoveredEdge = n ? null : getEdgeAt(x, y);
    canvas.style.cursor = n || hoveredEdge ? 'pointer' : 'default';
    if (hoveredEdge) showTip(hoveredEdge, x, y); else hideTip();
    draw();
  });

  canvas.addEventListener('mouseleave', () => {
    hoveredId = null;
    hoveredEdge = null;
    hideTip();
    canvas.style.cursor = 'default';
    draw();
  });

  function selectAt(x, y) {
    const n = getNodeAt(x, y);
    if (n) {
      if (tourStep >= 0) { tourStep = -1; tourBox?.classList.remove('running'); }
      selectedId = n.id === selectedId ? null : n.id;
      if (selectedId) { updateDetail(selectedId); scrollToPanel(); } else showIdle();
      draw();
      return;
    }
    const edge = getEdgeAt(x, y);
    if (edge) {
      if (tourStep >= 0) { tourStep = -1; tourBox?.classList.remove('running'); }
      selectedId = null;
      detailKicker.textContent = EDGE_TYPES[edge.type].label;
      detailTitle.textContent = `${getNodeById(edge.from).label.replace('\n', ' ')} ↔ ${getNodeById(edge.to).label.replace('\n', ' ')}`;
      detailBody.textContent = edge.label.charAt(0).toUpperCase() + edge.label.slice(1) + '.';
      detailLink.setAttribute('href', getNodeById(edge.from).href);
      detailLink.textContent = 'Approfondir';
      if (detailLinks) detailLinks.innerHTML = '';
      hoveredEdge = edge;
      draw();
      scrollToPanel();
    }
  }

  canvas.addEventListener('click', (e) => { const { x, y } = getPointerXY(e); selectAt(x, y); });

  canvas.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    if (!getNodeAt(x, y) && !getEdgeAt(x, y)) return; // laisser défiler la page
    e.preventDefault();
    selectAt(x, y);
  }, { passive: false });

  window.addEventListener('resize', () => { layoutNodes(); draw(); });

  layoutNodes();
  syncChips();
  showIdle();
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
    def: 'Structure créée par décret le 20 janv. 2025 et dirigée de fait par Musk jusqu\'en mai 2025 : accès aux systèmes fédéraux, licenciements massifs. Dissoute de fait en nov. 2025. Bilan : 214 Mds$ d\'économies revendiquées, ~1,4 Md$ vérifiées, 135 Mds$ de coût estimé.'
  },
  broligarchie: {
    label: 'Broligarchie',
    def: 'Mot-valise (bro + oligarchie) popularisé par la journaliste Carole Cadwalladr en janv. 2025 : la petite fraternité de milliardaires tech alignés sur Trump. La recherche parle désormais de « souveraineté oligarchique ».'
  },
  dsa: {
    label: 'DSA — Digital Services Act',
    def: 'Règlement européen (2022) imposant aux grandes plateformes transparence, modération et accès des chercheurs. Première amende : 120 M€ contre X (déc. 2025). Cible principale de l\'offensive américaine contre la régulation numérique.'
  },
  golden_dome: {
    label: 'Golden Dome',
    def: 'Bouclier antimissile spatial annoncé en 2025 (175 Mds$ officiels, jusqu\'à 3 600 Mds$ selon l\'AEI). Logiciel de commandement confié à Anduril et Palantir ; SpaceX parmi les contractants des intercepteurs spatiaux (2026).'
  },
  immigrationos: {
    label: 'ImmigrationOS',
    def: 'Système commandé par ICE à Palantir en avril 2025 (30 M$) : croiser des dizaines de bases fédérales pour cibler les personnes à expulser et suivre les « auto-déportations ». Intégré depuis au contrat ICM (>145 M$).'
  },
  s287g: {
    label: '287(g)',
    def: 'Article de loi permettant à ICE de déléguer des pouvoirs de police migratoire à des polices locales. 1 372 accords en janv. 2026 ; 2 411 dans 39 États au 31 août 2026.'
  },
  ltf: {
    label: 'Leading the Future',
    def: 'Super PAC lancé en août 2025 par a16z, Greg Brockman (OpenAI), Joe Lonsdale et d\'autres, doté de plus de 100 M$ : battre les élus favorables à la régulation de l\'IA, imposer un cadre fédéral unique.'
  },
  mobile_fortify: {
    label: 'Mobile Fortify',
    def: 'Application de reconnaissance faciale de terrain déployée par ICE en 2025 : un agent photographie un visage, l\'app le compare à des centaines de millions d\'images et aux données croisées par Palantir.'
  },
  antechrist: {
    label: 'L\'Antéchrist selon Thiel',
    def: 'Thème des conférences de Peter Thiel (San Francisco 2025, Rome 2026) : l\'Antéchrist serait un gouvernement mondial qui, au nom des peurs (IA, climat, nucléaire), régulerait la technologie. Réguler, c\'est donc pactiser avec le mal.'
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
    def: 'Concept de Balaji Srinivasan (2022) : rassembler en ligne des individus partageant des valeurs, puis acquérir des territoires pour créer de nouveaux États hors des démocraties existantes. Conférence à Singapour (oct. 2025) ; sa « Network School » a été expulsée de Malaisie en 2026.'
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
    def: 'Entreprise de données fondée en 2003 par Peter Thiel et Alex Karp, financée par In-Q-Tel (CIA). Contrats ICE, US Army (10 Mds$), OTAN, IRS. 8,15 Mds$ de revenus attendus en 2026, capitalisation ~400 Mds$.'
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
  initFilterChips();
  initHTimeline();
});

// ── Filtres par chips (figures, secteurs…) ──────────────────────
function initFilterChips() {
  const bars = document.querySelectorAll('.filter-bar[data-filter-scope]');
  bars.forEach((bar) => {
    const scope = bar.dataset.filterScope;
    const chips = bar.querySelectorAll('.filter-chip[data-filter]');
    const targets = document.querySelectorAll(`[data-filter-target="${scope}"]`);
    if (!chips.length || !targets.length) return;

    function apply(value) {
      chips.forEach((chip) => chip.setAttribute('aria-pressed', String(chip.dataset.filter === value)));
      targets.forEach((el) => {
        const tags = (el.dataset.tags || '').split(/\s+/);
        const show = value === 'all' || tags.includes(value);
        el.classList.toggle('is-hidden', !show);
      });
    }

    chips.forEach((chip) => chip.addEventListener('click', () => apply(chip.dataset.filter)));
    apply('all');
  });
}

// ── Frise horizontale (boutons + clavier) ───────────────────────
function initHTimeline() {
  document.querySelectorAll('.tl-h-wrap').forEach((wrap) => {
    const track = wrap.querySelector('.tl-h');
    if (!track) return;
    const step = () => {
      const first = track.querySelector('.evt');
      return first ? first.getBoundingClientRect().width + 16 : 320;
    };
    wrap.querySelector('[data-dir="prev"]')?.addEventListener('click', () => {
      track.scrollBy({ left: -step() * 2, behavior: 'smooth' });
    });
    wrap.querySelector('[data-dir="next"]')?.addEventListener('click', () => {
      track.scrollBy({ left: step() * 2, behavior: 'smooth' });
    });
    track.setAttribute('tabindex', '0');
    track.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); track.scrollBy({ left: step(), behavior: 'smooth' }); }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); track.scrollBy({ left: -step(), behavior: 'smooth' }); }
    });
  });
}

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
  const bars = document.querySelectorAll('.risk-bar-fill[data-width], .kpi-bar[data-width]');
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
