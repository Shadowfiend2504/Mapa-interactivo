document.addEventListener('DOMContentLoaded', () => {
  const places = Array.isArray(LUGARES) ? [...LUGARES] : [];
  const listEl = document.getElementById('places-list');
  const searchEl = document.getElementById('places-search');
  const resultsCountEl = document.getElementById('places-results-count');
  const metricTotalEl = document.getElementById('metric-total');
  const metricZonesEl = document.getElementById('metric-zones');
  const metricCategoriesEl = document.getElementById('metric-categories');
  const chipButtons = Array.from(document.querySelectorAll('.filter-chip'));

  let activeCategory = 'all';
  let searchTerm = '';

  const sortedPlaces = [...places].sort((a, b) => {
    const zoneCompare = (a.zona || '').localeCompare(b.zona || '', 'es');
    if (zoneCompare !== 0) {
      return zoneCompare;
    }
    return (a.nombre || '').localeCompare(b.nombre || '', 'es');
  });

  const uniqueZones = new Set(sortedPlaces.map(place => place.zona).filter(Boolean));
  const uniqueCategories = new Set(sortedPlaces.map(place => place.categoria).filter(Boolean));

  if (metricTotalEl) metricTotalEl.textContent = sortedPlaces.length;
  if (metricZonesEl) metricZonesEl.textContent = uniqueZones.size;
  if (metricCategoriesEl) metricCategoriesEl.textContent = uniqueCategories.size;

  function matchesSearch(place) {
    if (!searchTerm) {
      return true;
    }

    const haystack = [
      place.nombre,
      place.zona,
      place.categoria,
      place.desc,
      place.especial,
      place.publico,
      place.direccion,
      ...(place.tags || []),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return haystack.includes(searchTerm);
  }

  function filterPlaces() {
    return sortedPlaces.filter(place => {
      const categoryMatch = activeCategory === 'all' || place.categoria === activeCategory;
      return categoryMatch && matchesSearch(place);
    });
  }

  function renderPlaceCard(place) {
    const color = (typeof CAT_COLORS !== 'undefined' && CAT_COLORS[place.categoria]) || '#c9a84c';
    const icon = (typeof CAT_ICONS !== 'undefined' && CAT_ICONS[place.categoria]) || '📍';
    const tags = Array.isArray(place.tags) ? place.tags : [];

    return `
      <article class="place-card">
        <div class="place-card-header">
          <div>
            <div class="place-card-title">${place.nombre || 'Lugar sin nombre'}</div>
            <div class="place-card-zone">${place.zona || 'Zona no definida'} · ${place.publico || 'Público general'}</div>
          </div>
          <span class="place-badge" style="color:${color}; border-color:${color}; background:${hexToRgba(color, 0.12)}">${icon} ${place.categoria || 'sin categoría'}</span>
        </div>

        <div class="place-card-desc">${place.desc || ''}</div>
        <div class="place-highlight">${place.especial || ''}</div>

        <div class="place-card-meta">
          <div class="meta-item">
            <span class="meta-label">Horarios</span>
            <div class="meta-value">${place.horarios || 'No disponible'}</div>
          </div>
          <div class="meta-item">
            <span class="meta-label">Acceso</span>
            <div class="meta-value">${place.acceso || 'No disponible'}</div>
          </div>
          <div class="meta-item">
            <span class="meta-label">Precio</span>
            <div class="meta-value">${place.precio || 'No disponible'}</div>
          </div>
          <div class="meta-item">
            <span class="meta-label">Contacto</span>
            <div class="meta-value">${place.telefono || 'No disponible'}</div>
          </div>
          ${place.direccion ? `
            <div class="meta-item" style="grid-column: 1 / -1;">
              <span class="meta-label">Dirección</span>
              <div class="meta-value">${place.direccion}</div>
            </div>
          ` : ''}
        </div>

        <div class="place-card-footer">
          <div class="place-tags">
            ${tags.map(tag => `<span class="place-tag">${tag}</span>`).join('')}
          </div>
          <div class="place-card-actions">
            ${place.gmaps ? `<a class="mini-link" href="${place.gmaps}" target="_blank" rel="noopener noreferrer">Google Maps</a>` : ''}
            ${place.web ? `<a class="mini-link" href="${place.web}" target="_blank" rel="noopener noreferrer">Sitio web</a>` : ''}
          </div>
        </div>
      </article>
    `;
  }

  function render() {
    const visiblePlaces = filterPlaces();

    if (resultsCountEl) {
      resultsCountEl.textContent = `${visiblePlaces.length} resultado${visiblePlaces.length === 1 ? '' : 's'}`;
    }

    if (!listEl) {
      return;
    }

    if (!visiblePlaces.length) {
      listEl.innerHTML = '<div class="empty-state">No se encontraron lugares con ese filtro.</div>';
      return;
    }

    listEl.innerHTML = visiblePlaces.map(renderPlaceCard).join('');
  }

  function updateActiveChips() {
    chipButtons.forEach(button => {
      button.classList.toggle('active', button.dataset.cat === activeCategory);
    });
  }

  if (searchEl) {
    searchEl.addEventListener('input', event => {
      searchTerm = event.target.value.trim().toLowerCase();
      render();
    });
  }

  chipButtons.forEach(button => {
    button.addEventListener('click', () => {
      activeCategory = button.dataset.cat || 'all';
      updateActiveChips();
      render();
    });
  });

  render();
});

function hexToRgba(hex, alpha) {
  const normalizedHex = String(hex || '#c9a84c').replace('#', '');
  const red = parseInt(normalizedHex.slice(0, 2), 16);
  const green = parseInt(normalizedHex.slice(2, 4), 16);
  const blue = parseInt(normalizedHex.slice(4, 6), 16);
  return `rgba(${red},${green},${blue},${alpha})`;
}