// ═══════════════════════════════════════════════════════════
 

// ═══════════════════════════════════════════════════════════
// MAPA
// ═══════════════════════════════════════════════════════════
let map, markers = [], activeRoute = null, activeCategory = 'all';

function initMap() {
  map = L.map('map', {
    center: [4.6260, -74.0820],
    zoom: 13,
    zoomControl: false,
    attributionControl: false,
  });

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
  }).addTo(map);

  L.control.zoom({ position: 'bottomright' }).addTo(map);

  // Etiquetas de zona
  addZoneLabels();

  // Marcadores
  renderMarkers(LUGARES);
}

function addZoneLabels() {
  const zones = [
    { name: 'Chapinero', lat: 4.6420, lng: -74.0650 },
    { name: 'Usaquén',   lat: 4.7050, lng: -74.0310 },
    { name: 'Kennedy',   lat: 4.6270, lng: -74.1450 },
    { name: 'La Candelaria', lat: 4.5960, lng: -74.0730 },
  ];
  zones.forEach(z => {
    const icon = L.divIcon({
      className: '',
      html: `<div class="zone-label-icon">${z.name.toUpperCase()}</div>`,
      iconSize: [120, 20],
      iconAnchor: [60, 10],
    });
    L.marker([z.lat, z.lng], { icon, interactive: false, zIndexOffset: -1000 }).addTo(map);
  });
}

function createMarkerIcon(lugar) {
  const color = CAT_COLORS[lugar.categoria] || '#999';
  const icon  = CAT_ICONS[lugar.categoria] || '📍';
  const size  = 36;
  return L.divIcon({
    className: '',
    html: `
      <div class="custom-marker" style="
        width:${size}px; height:${size}px;
        background:${color};
        transform: rotate(-45deg);
      ">
        <div class="custom-marker-inner">${icon}</div>
      </div>`,
    iconSize:   [size, size],
    iconAnchor: [size/2, size],
    popupAnchor:[0, -size],
  });
}

function renderMarkers(list) {
  // Limpiar
  markers.forEach(m => map.removeLayer(m.marker));
  markers = [];

  list.forEach(lugar => {
    const m = L.marker([lugar.lat, lugar.lng], { icon: createMarkerIcon(lugar) });
    m.bindTooltip(lugar.nombre, {
      className: 'map-tooltip',
      direction: 'top',
      offset: [0, -38],
    });
    m.on('click', () => openPanel(lugar));
    m.addTo(map);
    markers.push({ lugar, marker: m });
  });
}

// ═══════════════════════════════════════════════════════════
// PANEL LATERAL
// ═══════════════════════════════════════════════════════════
function openPanel(lugar) {
  const color = CAT_COLORS[lugar.categoria] || '#999';
  const icon  = CAT_ICONS[lugar.categoria]  || '📍';

  document.getElementById('panel-img').src = lugar.imagen;
  document.getElementById('panel-img').alt = lugar.nombre;

  const badge = document.getElementById('panel-cat-badge');
  badge.textContent = icon + ' ' + lugar.categoria.toUpperCase();
  badge.style.color       = color;
  badge.style.borderColor = color;
  badge.style.background  = hexToRgba(color, 0.15);

  document.getElementById('panel-zone').textContent = lugar.zona.toUpperCase() + ' ·  BOGOTÁ';
  document.getElementById('panel-name').textContent = lugar.nombre;
  document.getElementById('panel-desc').textContent = lugar.desc;
  document.getElementById('panel-special').textContent = lugar.especial;

  // Info grid
  const grid = document.getElementById('panel-info-grid');
  grid.innerHTML = [
    ['Horarios', lugar.horarios],
    ['Acceso',   lugar.acceso],
    ['Precio',   lugar.precio],
    ['Contacto', lugar.telefono],
  ].map(([l,v]) => `
    <div class="info-item">
      <div class="info-item-label">${l}</div>
      <div class="info-item-value">${v}</div>
    </div>
  `).join('');

  // Tags
  const tagsEl = document.getElementById('panel-tags');
  tagsEl.innerHTML = lugar.tags.map(t => `<span class="tag">${t}</span>`).join('');

  // CTAs
  document.getElementById('panel-gmaps').href = lugar.gmaps;
  document.getElementById('panel-web').href   = lugar.web;

  document.getElementById('side-panel').classList.add('open');
  document.getElementById('overlay').classList.add('visible');
}

function closePanel() {
  document.getElementById('side-panel').classList.remove('open');
  document.getElementById('overlay').classList.remove('visible');
}

// ═══════════════════════════════════════════════════════════
// FILTROS
// ═══════════════════════════════════════════════════════════
function filterCat(cat, btn) {
  activeCategory = cat;
  activeRoute    = null;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.route-btn').forEach(b => b.classList.remove('active'));
  applyFilters();
}

function activateRoute(route, btn) {
  if (activeRoute === route) {
    activeRoute = null;
    btn.classList.remove('active');
  } else {
    activeRoute = route;
    document.querySelectorAll('.route-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    // Quitar filtro de categoría al seleccionar ruta
    activeCategory = 'all';
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('.filter-btn[data-cat="all"]').classList.add('active');
  }
  applyFilters();
}

function filterSearch(q) {
  const term = q.toLowerCase().trim();
  const filtered = LUGARES.filter(l =>
    !term ||
    l.nombre.toLowerCase().includes(term) ||
    l.zona.toLowerCase().includes(term) ||
    l.tags.some(t => t.toLowerCase().includes(term))
  );
  renderMarkers(filtered);
}

function applyFilters() {
  let filtered = LUGARES;
  if (activeCategory !== 'all') {
    filtered = filtered.filter(l => l.categoria === activeCategory);
  }
  if (activeRoute) {
    filtered = filtered.filter(l => l.rutas.includes(activeRoute));
  }
  renderMarkers(filtered);

  // Zoom a resultados
  if (filtered.length > 0 && filtered.length < LUGARES.length) {
    const bounds = L.latLngBounds(filtered.map(l => [l.lat, l.lng]));
    map.fitBounds(bounds.pad(0.3));
  }
}

// ═══════════════════════════════════════════════════════════
// NAVEGACIÓN
// ═══════════════════════════════════════════════════════════
function setView(view) {
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
  // Aquí se expandirán las vistas en iteraciones futuras
}

// ═══════════════════════════════════════════════════════════
// UTILIDADES
// ═══════════════════════════════════════════════════════════
function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ═══════════════════════════════════════════════════════════
// INICIALIZACIÓN
// ═══════════════════════════════════════════════════════════
window.addEventListener('DOMContentLoaded', () => {
  // Barra de carga animada
  const bar = document.getElementById('loading-bar');
  setTimeout(() => { bar.style.width = '60%'; }, 100);
  setTimeout(() => { bar.style.width = '90%'; }, 600);

  initMap();

  setTimeout(() => {
    bar.style.width = '100%';
    setTimeout(() => {
      document.getElementById('loading-screen').classList.add('hidden');
      document.getElementById('app').classList.add('visible');
    }, 400);
  }, 1200);
});
