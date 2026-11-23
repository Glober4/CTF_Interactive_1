// Handles to the three panels for future game logic.
const panels = {
  left: document.querySelector('#panel-left .panel-body'),
  center: document.querySelector('#panel-center .panel-body'),
  right: document.querySelector('#panel-right .panel-body'),
};

/* =========================================================
 * Logs (left panel)
 * ======================================================= */
const MAX_LOG_ENTRIES = 200;
const logList = document.createElement('ul');
logList.className = 'log-list';
panels.left.appendChild(logList);

/**
 * Append a line to the log panel.
 * @param {string} message
 * @param {'info'|'warn'|'error'} level
 */
function log(message, level = 'info') {
  const time = new Date().toLocaleTimeString([], { hour12: false });

  const li = document.createElement('li');
  li.className = `log-entry log-${level}`;

  const timeEl = document.createElement('span');
  timeEl.className = 'log-time';
  timeEl.textContent = `[${time}]`;

  const msgEl = document.createElement('span');
  msgEl.className = 'log-msg';
  msgEl.textContent = message;

  li.append(timeEl, msgEl);
  logList.appendChild(li);

  // Cap history so the DOM doesn't grow forever.
  while (logList.children.length > MAX_LOG_ENTRIES) {
    logList.firstChild.remove();
  }

  // Auto-scroll to newest entry.
  panels.left.scrollTop = panels.left.scrollHeight;
}

/* =========================================================
 * Map (center panel)
 * ======================================================= */
const SVG_NS = 'http://www.w3.org/2000/svg';

// The map is a grid of square cells. Everything on it snaps to a cell.
const GRID = { cols: 15, rows: 9, cell: 80 };
const MAP_W = GRID.cols * GRID.cell;
const MAP_H = GRID.rows * GRID.cell;

const cellCenter = (col, row) => ({ x: col * GRID.cell + GRID.cell / 2, y: row * GRID.cell + GRID.cell / 2 });
const cellKey = (col, row) => `${col},${row}`;
const NODE_RADIUS = 46;
const XHTML_NS = 'http://www.w3.org/1999/xhtml';

const map = {
  nodes: [
    { id: 'attacker-base', type: 'attacker', label: 'Attacker Base', icon: '⚔', col: 1,  row: 4 },
    { id: 'origin',        type: 'origin',   label: 'Origin',        icon: '◎', col: 7,  row: 4 },
    { id: 'flag',          type: 'flag',     label: 'Flag',          icon: '⚑', col: 13, row: 4 },
  ],
  // Links are network connections between nodes.
  links: [
    { from: 'attacker-base', to: 'origin' },
    { from: 'origin',        to: 'flag' },
  ],
  // Items placed by either side: { id, name, short, cat, icon, side, col, row }
  placed: [],
};

// Cells that already hold something (core nodes or placed items).
const occupied = new Set(map.nodes.map(n => cellKey(n.col, n.row)));

// Cells a network link passes through (excluding the node cells at either end).
// Walks along each link in small steps and records every cell it touches.
function computeLineCells({ nodes, links }) {
  const byId = Object.fromEntries(nodes.map(n => [n.id, n]));
  const cells = new Set();
  for (const { from, to } of links) {
    const a = cellCenter(byId[from].col, byId[from].row);
    const b = cellCenter(byId[to].col, byId[to].row);
    const steps = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / (GRID.cell / 8));
    for (let i = 0; i <= steps; i++) {
      const x = a.x + (b.x - a.x) * (i / steps);
      const y = a.y + (b.y - a.y) * (i / steps);
      cells.add(cellKey(Math.floor(x / GRID.cell), Math.floor(y / GRID.cell)));
    }
  }
  for (const n of nodes) cells.delete(cellKey(n.col, n.row));
  return cells;
}
const lineCells = computeLineCells(map);

// Why a cell can't take this item, or null if it can.
function placementError(item, col, row) {
  const key = cellKey(col, row);
  if (occupied.has(key)) return 'That cell is already occupied';
  const rule = item.placement || 'any';
  if (rule === 'line' && !lineCells.has(key)) return `${item.name} acts on network traffic: place it on a network line`;
  if (rule === 'off' && lineCells.has(key)) return `${item.name} doesn't sit on the network: place it off the network lines`;
  return null;
}

function svgEl(tag, attrs = {}) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

let svg, defenseLayer, ghost, allowedLayer;

function renderMap(container, { nodes, links }) {
  svg = svgEl('svg', { class: 'map', viewBox: `0 0 ${MAP_W} ${MAP_H}`, preserveAspectRatio: 'xMidYMid meet' });
  const byId = Object.fromEntries(nodes.map(n => [n.id, { ...n, ...cellCenter(n.col, n.row) }]));

  // Grid lines
  const gridLayer = svgEl('g', { class: 'map-grid' });
  for (let c = 0; c <= GRID.cols; c++) {
    gridLayer.appendChild(svgEl('line', { x1: c * GRID.cell, y1: 0, x2: c * GRID.cell, y2: MAP_H }));
  }
  for (let r = 0; r <= GRID.rows; r++) {
    gridLayer.appendChild(svgEl('line', { x1: 0, y1: r * GRID.cell, x2: MAP_W, y2: r * GRID.cell }));
  }

  // Links sit underneath the nodes.
  const linkLayer = svgEl('g', { class: 'map-links' });
  for (const { from, to } of links) {
    const a = byId[from], b = byId[to];
    linkLayer.appendChild(svgEl('line', {
      class: 'map-link', x1: a.x, y1: a.y, x2: b.x, y2: b.y,
      'data-from': from, 'data-to': to,
    }));
  }

  const nodeLayer = svgEl('g', { class: 'map-nodes' });
  for (const n of Object.values(byId)) {
    const g = svgEl('g', { class: `map-node node-${n.type}`, transform: `translate(${n.x} ${n.y})`, 'data-id': n.id });
    // Core nodes are bigger than a placed item (which is GRID.cell - 12 = 68 wide).
    g.appendChild(svgEl('circle', { r: NODE_RADIUS }));

    const icon = svgEl('text', { class: 'node-icon' });
    icon.textContent = n.icon;

    const label = svgEl('text', { y: NODE_RADIUS + 24 });
    label.textContent = n.label;

    g.append(icon, label);
    nodeLayer.appendChild(g);
  }

  defenseLayer = svgEl('g', { class: 'map-defenses' });

  // Preview square that follows the cursor while placing.
  ghost = svgEl('g', { class: 'placement-ghost', visibility: 'hidden' });

  // Highlights the cells the current item may go in (only shown while placing).
  allowedLayer = svgEl('g', { class: 'map-allowed' });

  svg.append(gridLayer, allowedLayer, linkLayer, nodeLayer, defenseLayer, ghost);
  container.replaceChildren(svg);
}

// Fills a <g> with a cell-sized tile: square, Tabler icon and short label.
function buildTile(g, item) {
  const fo = svgEl('foreignObject', { x: 6, y: 6, width: GRID.cell - 12, height: GRID.cell - 12 });
  const box = document.createElementNS(XHTML_NS, 'div');
  box.className = 'tile-content';
  const icon = document.createElementNS(XHTML_NS, 'i');
  icon.className = `ti ti-${item.icon}`;
  const label = document.createElementNS(XHTML_NS, 'span');
  label.textContent = item.short;
  box.append(icon, label);
  fo.appendChild(box);

  g.replaceChildren(svgEl('rect', { x: 6, y: 6, width: GRID.cell - 12, height: GRID.cell - 12, rx: 8 }), fo);
}

function drawPlaced(d) {
  const g = svgEl('g', {
    class: `map-item side-${d.side} cat-${d.cat}`,
    transform: `translate(${d.col * GRID.cell} ${d.row * GRID.cell})`,
  });
  buildTile(g, d);
  const title = svgEl('title');
  title.textContent = `${d.name} (${d.side})`;
  g.prepend(title);
  defenseLayer.appendChild(g);
}

/* =========================================================
 * Money
 * ======================================================= */
// Each side has its own wallet.
const TESTING_INFINITE_MONEY = true;
const STARTING_MONEY = 500;
const wallets = {
  defender: TESTING_INFINITE_MONEY ? Infinity : STARTING_MONEY,
  attacker: TESTING_INFINITE_MONEY ? Infinity : STARTING_MONEY,
};
const moneyEl = document.getElementById('money');

function renderMoney() {
  const money = wallets[currentView];
  moneyEl.textContent = Number.isFinite(money) ? money.toLocaleString() : '∞';
}
const canAfford = (side, cost) => wallets[side] >= cost;
function spend(side, cost) {
  wallets[side] -= cost; // Infinity - n stays Infinity
  renderMoney();
}

/* =========================================================
 * Shops & views (right panel)
 * ======================================================= */
let currentView = 'defender';

function el(tag, className, text) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text !== undefined) e.textContent = text;
  return e;
}

function renderShop(side) {
  const container = document.getElementById(`shop-${side}`);
  const itemsById = new Map();
  const groups = new Map(); // cat -> items, in catalogue order
  for (const item of SHOPS[side].items) {
    if (!groups.has(item.cat)) groups.set(item.cat, []);
    groups.get(item.cat).push(item);
    itemsById.set(item.id, item);
  }

  for (const [cat, items] of groups) {
    const section = el('section', `shop-group cat-${cat}`);
    const title = el('h3', 'shop-group-title');
    title.append(el('i', `ti ti-${CATEGORIES[cat].icon}`), ` ${CATEGORIES[cat].label}`);
    const grid = el('div', 'shop-grid');

    for (const item of items) {
      const card = el('div', 'shop-item');
      card.dataset.id = item.id;

      const head = el('div', 'shop-item-head');
      head.append(el('i', `shop-item-icon ti ti-${item.icon}`), el('div', 'shop-item-name', item.name));
      card.append(head, el('div', 'shop-item-desc', item.desc));
      if (item.placement) {
        const p = PLACEMENT[item.placement];
        const badge = el('div', `shop-item-placement placement-${item.placement}`);
        badge.append(el('i', `ti ti-${p.icon}`), ` ${p.label}`);
        card.append(badge);
      }
      if (item.hits) {
        const hits = el('div', 'shop-item-hits');
        hits.append(el('i', 'ti ti-target-arrow'), ` ${item.hits}`);
        card.append(hits);
      }

      const footer = el('div', 'shop-item-footer');
      const cost = el('span', 'shop-item-cost');
      cost.append(el('i', 'ti ti-coin'), ` $${item.cost}`);
      const buy = el('button', 'shop-buy');
      buy.type = 'button';
      buy.append(el('i', 'ti ti-shopping-cart'), ' Buy');
      footer.append(cost, buy);
      card.append(footer);

      grid.append(card);
    }
    section.append(title, grid);
    container.append(section);
  }

  container.addEventListener('click', e => {
    const btn = e.target.closest('.shop-buy');
    if (!btn) return;
    const card = btn.closest('.shop-item');
    // Clicking Buy on the item already being placed cancels it.
    if (placing && placing.el === card) {
      cancelPlacing();
      return;
    }
    startPlacing(card, side, itemsById.get(card.dataset.id));
  });
}

function setView(side) {
  if (placing) cancelPlacing();
  currentView = side;
  document.body.dataset.view = side;
  for (const s of Object.keys(SHOPS)) {
    document.getElementById(`shop-${s}`).hidden = s !== side;
  }
  document.querySelectorAll('.view-tab').forEach(t => {
    const active = t.dataset.view === side;
    t.classList.toggle('active', active);
    t.setAttribute('aria-selected', active);
  });
  const title = document.getElementById('shop-title');
  title.replaceChildren(el('i', `ti ti-${SHOPS[side].icon}`), ` ${SHOPS[side].title}`);
  renderMoney();
}

document.querySelector('.view-toggle').addEventListener('click', e => {
  const tab = e.target.closest('.view-tab');
  if (tab && tab.dataset.view !== currentView) {
    setView(tab.dataset.view);
    log(`Switched to ${tab.dataset.view} view`);
  }
});

/* =========================================================
 * Shop → placement
 * ======================================================= */
let placing = null; // { el, side, ...catalogue item } while a purchase is being placed

function startPlacing(cardEl, side, catalogueItem) {
  const item = { el: cardEl, side, ...catalogueItem };
  if (!canAfford(side, item.cost)) {
    log(`Not enough money for ${item.name} ($${item.cost})`, 'warn');
    return;
  }
  stopPlacing();
  placing = item;
  cardEl.classList.add('selected');
  svg.classList.add('placing');
  ghost.setAttribute('class', `placement-ghost side-${side} cat-${item.cat}`);
  buildTile(ghost, item);
  showAllowedCells(item);
  const where = { line: 'a cell on a network line', off: 'a free cell off the network lines' }[item.placement] || 'any free cell';
  log(`Placing ${item.name}: click ${where} (Esc or right-click to cancel)`);
}

function showAllowedCells(item) {
  allowedLayer.replaceChildren();
  allowedLayer.setAttribute('class', `map-allowed side-${item.side} cat-${item.cat}`);
  for (let col = 0; col < GRID.cols; col++) {
    for (let row = 0; row < GRID.rows; row++) {
      if (placementError(item, col, row)) continue;
      allowedLayer.appendChild(svgEl('rect', {
        x: col * GRID.cell + 2, y: row * GRID.cell + 2, width: GRID.cell - 4, height: GRID.cell - 4, rx: 6,
      }));
    }
  }
}

function stopPlacing() {
  if (!placing) return;
  placing.el.classList.remove('selected');
  placing = null;
  svg.classList.remove('placing');
  ghost.setAttribute('visibility', 'hidden');
  allowedLayer.replaceChildren();
}

function cancelPlacing() {
  if (!placing) return;
  stopPlacing();
  log('Placement cancelled');
}

// Convert a mouse event to a grid cell, or null if outside the map.
function eventToCell(e) {
  const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(svg.getScreenCTM().inverse());
  const col = Math.floor(pt.x / GRID.cell);
  const row = Math.floor(pt.y / GRID.cell);
  if (col < 0 || row < 0 || col >= GRID.cols || row >= GRID.rows) return null;
  return { col, row };
}

function onMapMove(e) {
  if (!placing) return;
  const cell = eventToCell(e);
  if (!cell) {
    ghost.setAttribute('visibility', 'hidden');
    return;
  }
  ghost.setAttribute('visibility', 'visible');
  ghost.setAttribute('transform', `translate(${cell.col * GRID.cell} ${cell.row * GRID.cell})`);
  ghost.classList.toggle('invalid', !!placementError(placing, cell.col, cell.row));
}

function onMapClick(e) {
  if (!placing) return;
  const cell = eventToCell(e);
  if (!cell) return;

  const key = cellKey(cell.col, cell.row);
  const error = placementError(placing, cell.col, cell.row);
  if (error) {
    log(error, 'warn');
    return;
  }
  if (!canAfford(placing.side, placing.cost)) {
    log(`Not enough money for ${placing.name}`, 'warn');
    stopPlacing();
    return;
  }

  spend(placing.side, placing.cost);
  const { id, name, short, cat, icon, side, cost, placement } = placing;
  const d = { id, name, short, cat, icon, side, placement, ...cell };
  map.placed.push(d);
  occupied.add(key);
  drawPlaced(d);
  log(`[${side}] Placed ${name} at (${cell.col}, ${cell.row}) for $${cost}`);
  stopPlacing();
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') cancelPlacing();
});

/* =========================================================
 * Boot
 * ======================================================= */
renderMap(panels.center, map);
Object.keys(SHOPS).forEach(renderShop);
setView('defender');

svg.addEventListener('mousemove', onMapMove);
svg.addEventListener('mouseleave', () => ghost.setAttribute('visibility', 'hidden'));
svg.addEventListener('click', onMapClick);
svg.addEventListener('contextmenu', e => {
  if (!placing) return;
  e.preventDefault();
  cancelPlacing();
});

log('Map loaded: Attacker Base ↔ Origin ↔ Flag');
if (TESTING_INFINITE_MONEY) log('Testing mode: infinite money enabled', 'warn');

const HEARTBEAT_MS = 5000;
setInterval(() => log('UI side logs are working'), HEARTBEAT_MS);
