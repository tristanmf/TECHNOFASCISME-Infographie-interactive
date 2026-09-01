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
    { id: 'musk', label: 'Elon Musk', xPct: 0.24, yPct: 0.16, r: 28, color: '#c8102e', group: 'figure', kicker: 'Figure / Opérateur', body: "Plateforme, IA, satellites militaires, argent électoral : un cumul inédit. Parti du gouvernement en mai 2025, réconcilié avec Trump en septembre, il refinance le camp républicain pour les midterms 2026.", href: 'pages/figures.html' },
    { id: 'thiel', label: 'Peter Thiel', xPct: 0.5, yPct: 0.16, r: 26, color: '#c8102e', group: 'figure', kicker: 'Figure / Financeur', body: "Le nœud : Palantir, Anduril, Vance, Yarvin. Depuis 2025 il théorise en public que réguler la technologie est l'œuvre de l'Antéchrist.", href: 'pages/figures.html' },
    { id: 'andreessen', label: 'Andreessen', xPct: 0.74, yPct: 0.2, r: 22, color: '#c8102e', group: 'figure', kicker: 'Figure / Financeur', body: "a16z est devenu la machine politique de la tech : super PAC pro-IA (Leading the Future), premier donateur du cycle 2026, guerre contre les lois des États.", href: 'pages/figures.html' },
    { id: 'yarvin', label: 'C. Yarvin', xPct: 0.6, yPct: 0.42, r: 20, color: '#9d174d', group: 'figure', kicker: 'Figure / Théoricien', body: "Fournit le vocabulaire depuis 2007 : la Cathédrale, le PDG-monarque, RAGE. Interviewé par le New York Times en 2025.", href: 'pages/figures.html' },
    { id: 'vance', label: 'JD Vance', xPct: 0.38, yPct: 0.42, r: 20, color: '#7e22ce', group: 'figure', kicker: 'Figure / Politique', body: "Le relais institutionnel : financé par Thiel, se réclamant de Yarvin, vice-président et favori républicain pour 2028.", href: 'pages/figures.html' },
    { id: 'karp', label: 'A. Karp', xPct: 0.68, yPct: 0.62, r: 18, color: '#c8102e', group: 'figure', kicker: 'Figure / Opérateur', body: "PDG de Palantir. Défend une « République technologique » où la tech sert l'État et la guerre ; traite les labos d'IA prudents de « marxistes » (2026).", href: 'pages/figures.html' },
    { id: 'palantir', label: 'Palantir', xPct: 0.52, yPct: 0.68, r: 24, color: '#00d4ff', group: 'company', kicker: 'Entreprise / Données', body: "La colonne vertébrale : ICE, Army (10 Mds$), OTAN, IRS. 8,15 Mds$ de revenus attendus en 2026, capitalisation ~400 Mds$.", href: 'pages/infrastructure.html' },
    { id: 'x', label: 'X · Grok', xPct: 0.1, yPct: 0.4, r: 22, color: '#00d4ff', group: 'company', kicker: 'Entreprise / Plateforme + IA', body: "Réseau social et IA fusionnés (2025). Amplification des contenus de Musk, incident « MechaHitler », deepfakes sexualisés, première amende DSA.", href: 'pages/infrastructure.html' },
    { id: 'spacex', label: 'SpaceX\nStarlink', xPct: 0.2, yPct: 0.6, r: 20, color: '#00d4ff', group: 'company', kicker: 'Entreprise / Infrastructure', body: "Fusées, satellites, IA et réseau social dans une seule entité depuis février 2026. IPO à ~1 750 Mds$ en juin 2026. Contractant du Golden Dome.", href: 'pages/infrastructure.html' },
    { id: 'doge', label: 'DOGE', xPct: 0.32, yPct: 0.74, r: 20, color: '#f59e0b', group: 'institution', kicker: 'Institution / Dissoute', body: "Créé par décret le 20 janv. 2025, « n'existe plus » en nov. 2025. 214 Mds$ d'économies revendiquées, ~1,4 Md$ vérifiées, 135 Mds$ de coût estimé. L'accès aux données, lui, est resté.", href: 'pages/infrastructure.html' },
    { id: 'anduril', label: 'Anduril', xPct: 0.84, yPct: 0.7, r: 18, color: '#00d4ff', group: 'company', kicker: 'Entreprise / Défense', body: "Armes autonomes, tours frontalières, logiciel du Golden Dome. Valorisée 61 Mds$ en mai 2026, financée par Founders Fund et a16z.", href: 'pages/infrastructure.html' },
    { id: 'nrx', label: 'NRx / Dark\nEnlightenment', xPct: 0.82, yPct: 0.48, r: 20, color: '#7c3aed', group: 'ideology', kicker: 'Idéologie', body: "Le corpus anti-démocratique de référence : Yarvin, Land. Démocratie = échec ; État = entreprise ; élite technique = classe légitime.", href: 'pages/ideologies.html' },
    { id: 'eacc', label: 'e/acc', xPct: 0.92, yPct: 0.3, r: 16, color: '#0891b2', group: 'ideology', kicker: 'Idéologie', body: "Accélérer sans frein. Le principe de précaution comme « ennemi ». Manifeste d'Andreessen (2023).", href: 'pages/ideologies.html' },
    { id: 'trump', label: 'Admin Trump', xPct: 0.1, yPct: 0.86, r: 22, color: '#b45309', group: 'institution', kicker: 'Institution / Exécutif', body: "Le lieu où les proximités deviennent décrets : DOGE, base de données unifiée, préemption des lois IA, 75 Mds$ pour ICE, visa ban contre les régulateurs européens.", href: 'pages/democraties.html' },
    { id: 'ice', label: 'ICE', xPct: 0.34, yPct: 0.92, r: 18, color: '#f59e0b', group: 'institution', kicker: 'Institution / Police migratoire', body: "Agence de police la mieux dotée du pays (75 Mds$ sur 4 ans). Client de Palantir, Clearview, Mobile Fortify. 2 411 accords 287(g) avec des polices locales.", href: 'pages/infrastructure.html' },
    { id: 'cia', label: 'CIA', xPct: 0.5, yPct: 0.92, r: 16, color: '#374151', group: 'institution', kicker: 'Institution / Renseignement', body: "Premier client de Palantir via In-Q-Tel : l'arrimage originel entre la tech de Thiel et l'appareil de sécurité nationale.", href: 'pages/infrastructure.html' },
    { id: 'pentagon', label: 'Pentagone', xPct: 0.7, yPct: 0.9, r: 18, color: '#374151', group: 'institution', kicker: 'Institution / Défense', body: "Army EA 10 Mds$ (Palantir), Grok for Government (xAI), Golden Dome (Anduril, Palantir, SpaceX).", href: 'pages/infrastructure.html' },
    { id: 'clearview', label: 'Clearview', xPct: 0.88, yPct: 0.9, r: 16, color: '#00d4ff', group: 'company', kicker: 'Entreprise / Biométrie', body: "Base de 30+ milliards de visages scrappés. Amendes RGPD en Europe ; contrats ICE (9,2 M$) et CBP en 2025-2026.", href: 'pages/infrastructure.html' },
    { id: 'ue', label: 'UE / DSA', xPct: 0.06, yPct: 0.62, r: 18, color: '#22c55e', group: 'counter', kicker: 'Contre-pouvoir', body: "Le principal contre-pouvoir réglementaire : amende DSA contre X, enquête Grok, refus de Palantir par la Bundeswehr. Cible de l'offensive commerciale et diplomatique américaine.", href: 'pages/democraties.html' },
  ];

  const edges = [
    { from: 'musk', to: 'x', weight: 3, label: "propriétaire ; l'algorithme amplifie ses propres contenus" },
    { from: 'musk', to: 'spacex', weight: 3, label: "PDG ; fusion SpaceX–xAI (fév. 2026), IPO (juin 2026)" },
    { from: 'musk', to: 'doge', weight: 3, label: "direction de fait, janvier–mai 2025" },
    { from: 'musk', to: 'trump', weight: 3, label: "≈290 M$ en 2024 ; rupture juin 2025 ; réconciliation sept. 2025 ; ≥85 M$ pour 2026" },
    { from: 'musk', to: 'eacc', weight: 1, label: "affinité avec l'imaginaire accélérationniste" },
    { from: 'musk', to: 'ue', weight: 2, label: "« abolir l'UE » après l'amende DSA ; soutien à l'AfD et à Reform UK" },
    { from: 'x', to: 'ue', weight: 2, label: "première amende DSA, 120 M€ (déc. 2025) ; enquête étendue à Grok (janv. 2026)" },
    { from: 'spacex', to: 'x', weight: 2, label: "X absorbé par xAI (mars 2025), xAI par SpaceX (fév. 2026)" },
    { from: 'spacex', to: 'pentagon', weight: 2, label: "Starlink, Grok for Government (200 M$), intercepteurs du Golden Dome" },
    { from: 'thiel', to: 'palantir', weight: 3, label: "co-fondateur, premier actionnaire individuel (~3 %)" },
    { from: 'thiel', to: 'karp', weight: 2, label: "duo fondateur de Palantir depuis 2003" },
    { from: 'thiel', to: 'vance', weight: 3, label: "15 M$ pour le Sénat (2022) ; l'a poussé sur le ticket" },
    { from: 'thiel', to: 'yarvin', weight: 2, label: "investisseur d'Urbit ; Yarvin dit l'avoir « coaché »" },
    { from: 'thiel', to: 'nrx', weight: 2, label: "« liberté et démocratie ne sont plus compatibles » (2009)" },
    { from: 'thiel', to: 'anduril', weight: 2, label: "Founders Fund : 1 Md$ dans la levée de 2025" },
    { from: 'karp', to: 'palantir', weight: 3, label: "PDG depuis la fondation" },
    { from: 'palantir', to: 'ice', weight: 3, label: "ImmigrationOS, contrat ICM (>145 M$), outil ELITE sur les données Medicaid" },
    { from: 'palantir', to: 'cia', weight: 2, label: "In-Q-Tel, premier client (2005)" },
    { from: 'palantir', to: 'pentagon', weight: 3, label: "Army EA 10 Mds$ (2025), Maven, OTAN" },
    { from: 'palantir', to: 'doge', weight: 2, label: "« mega API » à l'IRS, base de données fédérale unifiée" },
    { from: 'palantir', to: 'ue', weight: 1, label: "1,5 Md£ au Royaume-Uni ; la Bundeswehr refuse Gotham" },
    { from: 'andreessen', to: 'nrx', weight: 1, label: "qualifie Yarvin d'« ami » ; Nick Land parmi ses « saints »" },
    { from: 'andreessen', to: 'eacc', weight: 2, label: "Manifeste techno-optimiste (2023)" },
    { from: 'andreessen', to: 'trump', weight: 2, label: "a16z premier donateur 2026 ; super PAC Leading the Future" },
    { from: 'yarvin', to: 'nrx', weight: 3, label: "fondateur du courant (2007)" },
    { from: 'vance', to: 'trump', weight: 3, label: "vice-président ; président des finances du parti" },
    { from: 'vance', to: 'nrx', weight: 2, label: "« Yarvin a influencé ma pensée » (2024)" },
    { from: 'vance', to: 'ue', weight: 1, label: "Munich (fév. 2025) : « la menace vient de l'intérieur »" },
    { from: 'anduril', to: 'pentagon', weight: 2, label: "Golden Dome, Arsenal-1, intercepteurs spatiaux (2026)" },
    { from: 'trump', to: 'doge', weight: 2, label: "créé par décret le 20 janv. 2025 ; dissous de fait en nov. 2025" },
    { from: 'trump', to: 'ice', weight: 3, label: "75 Mds$ (loi du 4 juil. 2025) ; 2 411 accords 287(g)" },
    { from: 'trump', to: 'ue', weight: 2, label: "visa ban contre Breton (déc. 2025) ; Section 301 contre DSA/DMA" },
    { from: 'clearview', to: 'ice', weight: 2, label: "contrat 9,2 M$ (sept. 2025), commandes 2026" },
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
    const linkLabels = { ideology: 'Ouvrir le chapitre Idéologies', figure: 'Ouvrir la fiche', company: 'Ouvrir le chapitre Infrastructure', institution: 'Ouvrir le chapitre lié', counter: 'Ouvrir le chapitre Démocraties' };
    detailLink.textContent = linkLabels[node.group] || 'Ouvrir la page liée';
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
