const $ = (id) => document.getElementById(id);

const EMPTY_FC = { type: 'FeatureCollection', features: [] };
const D = window.LOCAL_MAP_DATA || { businessCentres: EMPTY_FC, railNetwork: EMPTY_FC };

const setStatus = (text, isError = false) => {
  const el = $('status');
  el.textContent = text;
  el.className = 'status' + (isError ? ' error' : '');
};

const fmt = (n) => n.toLocaleString('en-US');

// ---------- Map + base layers ----------
const map = L.map('map', { zoomControl: true, minZoom: 5, maxZoom: 18 }).setView([-18.7, 32.3], 7);

const baseLayers = {
  light: L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    subdomains: 'abcd',
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
  }),
  streets: L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  })
};

let activeBaseKey = 'light';
baseLayers[activeBaseKey].addTo(map);
baseLayers[activeBaseKey].on('tileerror', () => {
  // If the current basemap fails to load tiles (e.g. blocked/offline), fall back once.
  if (activeBaseKey === 'streets') return;
  setStatus('Streets tiles unavailable — switched to the light basemap', true);
  switchBase('light');
});

function switchBase(key) {
  if (key === activeBaseKey || !baseLayers[key]) return;
  map.removeLayer(baseLayers[activeBaseKey]);
  activeBaseKey = key;
  baseLayers[activeBaseKey].addTo(map);
  document.querySelectorAll('.base-option').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.base === key);
  });
}

// ---------- Data layers ----------
const hasClusterPlugin = typeof L.markerClusterGroup === 'function';
const centresLayer = hasClusterPlugin
  ? L.markerClusterGroup({ maxClusterRadius: 42, spiderfyOnMaxZoom: true, showCoverageOnHover: false })
  : L.layerGroup();
const railLayer = L.layerGroup();
const extentLayer = L.layerGroup();

const layers = { centres: centresLayer, rail: railLayer, extent: extentLayer };
Object.values(layers).forEach((l) => l.addTo(map));

function popupHtml(title, rows) {
  const body = rows
    .filter((r) => r[1] !== undefined && r[1] !== null && r[1] !== '')
    .map((r) => `<div class="popup-meta"><b>${r[0]}:</b> ${r[1]}</div>`)
    .join('');
  return `<div class="popup-title">${title}</div>${body}`;
}

let centresCount = 0;
let railCount = 0;
let railLengthKm = 0;
let combinedBounds = null;

function extendBounds(latlngBounds) {
  if (!latlngBounds || !latlngBounds.isValid()) return;
  combinedBounds = combinedBounds ? combinedBounds.extend(latlngBounds) : L.latLngBounds(latlngBounds.getSouthWest(), latlngBounds.getNorthEast());
}

try {
  const centresGeo = L.geoJSON(D.businessCentres, {
    pointToLayer: (feature, latlng) =>
      L.circleMarker(latlng, {
        radius: 4,
        weight: 1,
        color: '#3a2159',
        fillColor: '#8f65c9',
        fillOpacity: 0.9
      }),
    onEachFeature: (feature, layer) => {
      const p = feature.properties || {};
      const [lon, lat] = feature.geometry.coordinates;
      layer.bindPopup(
        popupHtml('Business centre', [
          ['ID', p.id],
          ['Coordinates', `${lat.toFixed(4)}, ${lon.toFixed(4)}`]
        ])
      );
    }
  });
  centresLayer.addLayer(centresGeo);
  centresCount = D.businessCentres.features.length;
  extendBounds(centresGeo.getBounds());
} catch (err) {
  console.error('Business centres failed to load', err);
}

try {
  const railGeo = L.geoJSON(D.railNetwork, {
    style: { color: '#384454', weight: 2.5, opacity: 0.9 },
    onEachFeature: (feature, layer) => {
      const p = feature.properties || {};
      layer.bindPopup(
        popupHtml('Rail line', [
          ['Line', p.id || p.line],
          ['Length', p.length_km ? `${p.length_km.toFixed(1)} km` : undefined]
        ])
      );
      layer.on({
        mouseover: (e) => e.target.setStyle({ weight: 4, color: '#e26d3d' }),
        mouseout: (e) => railGeo.resetStyle(e.target)
      });
    }
  });
  railLayer.addLayer(railGeo);
  railCount = D.railNetwork.features.length;
  railLengthKm = D.railNetwork.features.reduce((sum, f) => sum + (f.properties?.length_km || 0), 0);
  extendBounds(railGeo.getBounds());
} catch (err) {
  console.error('Rail network failed to load', err);
}

// Data-coverage extent, derived from the actual loaded features (not a guess).
if (combinedBounds) {
  L.rectangle(combinedBounds.pad(0.03), {
    color: '#1f5b4a',
    weight: 2,
    fill: false,
    dashArray: '6 5'
  }).addTo(extentLayer);
}

function updateCounts() {
  $('centres-count').textContent = centresCount ? fmt(centresCount) : '—';
  $('rail-count').textContent = railCount ? fmt(railCount) : '—';
  $('stat-centres').textContent = centresCount ? fmt(centresCount) : '—';
  $('stat-rail').textContent = railCount ? fmt(railCount) : '—';
  $('stat-length').textContent = railLengthKm ? `${fmt(Math.round(railLengthKm))} km` : '—';
}
updateCounts();

if (combinedBounds && combinedBounds.isValid()) {
  map.fitBounds(combinedBounds.pad(0.06));
}

if (centresCount || railCount) {
  setStatus(`Loaded ${fmt(centresCount)} business centres and ${fmt(railCount)} rail lines`);
} else {
  setStatus('No local data found — check data/local-layers.js', true);
}

// ---------- Layer toggles ----------
Object.entries({ 'centres-toggle': 'centres', 'rail-toggle': 'rail', 'extent-toggle': 'extent' }).forEach(
  ([id, key]) => {
    const el = $(id);
    if (!el) return;
    el.onchange = (e) => (e.target.checked ? map.addLayer(layers[key]) : map.removeLayer(layers[key]));
  }
);

// ---------- Base layer switch ----------
document.querySelectorAll('.base-option').forEach((btn) => {
  btn.addEventListener('click', () => switchBase(btn.dataset.base));
});

// ---------- Fit to data ----------
const fitBtn = $('fit-data');
if (fitBtn) {
  fitBtn.addEventListener('click', () => {
    if (combinedBounds && combinedBounds.isValid()) map.fitBounds(combinedBounds.pad(0.06));
  });
}
