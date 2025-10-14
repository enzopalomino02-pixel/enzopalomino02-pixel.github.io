// Utilidad: año en footer
document.getElementById('year').textContent = new Date().getFullYear();

// Inicialización temprana del modal de PIN y elementos de Eventos
const eventsGrid = document.getElementById('events-grid');
const pinBackdrop = document.getElementById('pin-backdrop');
const pinInput = document.getElementById('pin-input');
const pinCancel = document.getElementById('pin-cancel');
const pinSubmit = document.getElementById('pin-submit');
let selectedSlug = null;
if (pinBackdrop) pinBackdrop.hidden = true;
// Contador de cargas de eventos (debe estar inicializado antes de cualquier llamada)
let eventsLoadId = 0;

// Navegación por pestañas
const tabs = Array.from(document.querySelectorAll('.tab'));
const sections = Array.from(document.querySelectorAll('.section'));
let suppressModalUntil = 0; // evita aperturas accidentales del modal al cambiar de pestaña

function showSection(id) {
  sections.forEach(sec => {
    const active = sec.id === id;
    sec.hidden = !active;
  });
  tabs.forEach(tab => {
    const active = tab.dataset.target === id;
    tab.setAttribute('aria-selected', String(active));
  });
  // Al mostrar la pestaña "Eventos", aseguramos que el modal esté cerrado
  if (id === 'eventos') {
    selectedSlug = null;
    if (pinBackdrop) pinBackdrop.hidden = true;
    // Recarga la lista de eventos cada vez que se entra a la pestaña
    loadEvents();
  }
}

tabs.forEach(tab => {
  tab.addEventListener('click', (e) => {
    e.preventDefault();
    const id = tab.dataset.target;
    history.replaceState(null, '', `#${id}`);
    if (id === 'eventos') {
      // Ventana para evitar que algún clic fantasma dispare el modal
      suppressModalUntil = Date.now() + 800;
      // Asegura modal cerrado al cambiar a Eventos
      selectedSlug = null;
      if (pinBackdrop) pinBackdrop.hidden = true;
    }
    showSection(id);
  });
});

// Estado inicial de la sección (por defecto: portfolio)
const initial = (location.hash || '#portfolio').replace('#', '');
showSection(initial);

// Carrusel de Portfolio
const track = document.getElementById('carousel-track');
const prevBtn = document.querySelector('.control.prev');
const nextBtn = document.querySelector('.control.next');

// Slider del portfolio: por defecto usa Picsum, pero intentará cargar assets locales
let photos = [
  'https://picsum.photos/id/1015/1200/800',
  'https://picsum.photos/id/1025/1200/800',
  'https://picsum.photos/id/1035/1200/800',
  'https://picsum.photos/id/1040/1200/800',
  'https://picsum.photos/id/1062/1200/800',
  'https://picsum.photos/id/1074/1200/800',
  'https://picsum.photos/id/1084/1200/800',
  'https://picsum.photos/id/110/1200/800',
];

let current = 0;
let photoEls = [];
let ghostLeftEls = [];
let ghostRightEls = [];

// Offset circular: coloca siempre fotos a ambos lados del actual
function circularOffset(i, currentIndex, len) {
  let offset = i - currentIndex;
  const half = len / 2;
  if (offset > half) offset -= len;
  if (offset < -half) offset += len;
  return offset;
}

function createCarousel() {
  track.innerHTML = '';
  photoEls = photos.map(src => {
    const img = document.createElement('img');
    img.src = src;
    img.alt = 'Foto del portfolio';
    img.className = 'photo';
    track.appendChild(img);
    return img;
  });
  // Clones (fantasmas) a izquierda y derecha para efecto infinito
  ghostLeftEls = photos.map(src => {
    const img = document.createElement('img');
    img.src = src;
    img.alt = 'Foto del portfolio';
    img.className = 'photo ghost-left';
    track.appendChild(img);
    return img;
  });
  ghostRightEls = photos.map(src => {
    const img = document.createElement('img');
    img.src = src;
    img.alt = 'Foto del portfolio';
    img.className = 'photo ghost-right';
    track.appendChild(img);
    return img;
  });
  renderCarousel();
}

function renderCarousel(deltaDrag = 0) {
  const baseShift = Math.min(140, Math.max(90, window.innerWidth * 0.12));
  const len = photos.length;
  const applyTo = (el, offset) => {
    const depth = Math.abs(offset % len);
    const dx = offset * baseShift + (deltaDrag * 0.2);
    const scale = Math.max(0.7, 1 - Math.abs(offset) * 0.08);
    const dy = Math.abs(offset) * 10;
    const blur = Math.abs(offset) > 0 ? Math.min(2.5, Math.abs(offset) * 0.6) : 0;
    const opacity = Math.max(0.35, 1 - Math.abs(offset) * 0.12);
    const z = 100 - Math.abs(offset);

    el.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(${scale})`;
    el.style.filter = `blur(${blur}px) saturate(${Math.abs(offset) ? 0.9 : 1}) brightness(${Math.abs(offset) ? 0.9 : 1})`;
    el.style.opacity = String(opacity);
    el.style.zIndex = String(z);
  };

  // Principales (ring actual)
  photoEls.forEach((el, i) => {
    const offset = circularOffset(i, current, len);
    applyTo(el, offset);
  });
  // Fantasmas izquierda (tile -1)
  ghostLeftEls.forEach((el, i) => {
    const offset = (i - current) - len;
    applyTo(el, offset);
  });
  // Fantasmas derecha (tile +1)
  ghostRightEls.forEach((el, i) => {
    const offset = (i - current) + len;
    applyTo(el, offset);
  });
}

function go(delta) {
  current = (current + delta + photos.length) % photos.length;
  renderCarousel();
}

prevBtn.addEventListener('click', () => go(-1));
nextBtn.addEventListener('click', () => go(1));

// Soporte de teclado
window.addEventListener('keydown', (e) => {
  if (document.getElementById('portfolio').hidden) return;
  if (e.key === 'ArrowLeft') go(-1);
  if (e.key === 'ArrowRight') go(1);
});

// Drag básico (desktop y mobile)
let dragStartX = null;
let dragging = false;
function onPointerDown(e) { dragStartX = e.clientX ?? e.touches?.[0]?.clientX; dragging = true; }
function onPointerMove(e) {
  if (!dragging || dragStartX == null) return;
  const x = e.clientX ?? e.touches?.[0]?.clientX;
  const delta = x - dragStartX;
  // Desplazamiento visual ligero mientras se arrastra (aplicado a todas las capas)
  renderCarousel(delta);
}
function onPointerUp(e) {
  if (!dragging || dragStartX == null) return;
  const x = e.clientX ?? e.changedTouches?.[0]?.clientX;
  const delta = x - dragStartX;
  if (delta > 40) go(-1);
  else if (delta < -40) go(1);
  else renderCarousel();
  dragging = false; dragStartX = null;
}

const carousel = document.querySelector('.carousel');
carousel.addEventListener('mousedown', onPointerDown);
carousel.addEventListener('mousemove', onPointerMove);
carousel.addEventListener('mouseup', onPointerUp);
carousel.addEventListener('mouseleave', onPointerUp);
carousel.addEventListener('touchstart', onPointerDown, { passive: true });
carousel.addEventListener('touchmove', onPointerMove, { passive: true });
carousel.addEventListener('touchend', onPointerUp);

window.addEventListener('resize', renderCarousel);

createCarousel();
// Autoplay infinito con pausa al interactuar o cambiar de pestaña
let autoplayTimer = null;
const AUTOPLAY_MS = 4000;
function startAutoplay() {
  stopAutoplay();
  autoplayTimer = setInterval(() => {
    if (document.getElementById('portfolio').hidden) return; // sólo cuando está visible
    go(1);
  }, AUTOPLAY_MS);
}
function stopAutoplay() {
  if (autoplayTimer) { clearInterval(autoplayTimer); autoplayTimer = null; }
}
startAutoplay();
document.addEventListener('visibilitychange', () => {
  if (document.hidden) stopAutoplay();
  else startAutoplay();
});
carousel.addEventListener('mouseenter', stopAutoplay);
carousel.addEventListener('mouseleave', startAutoplay);
// Intento de carga de fotos locales para el slider
async function listPortfolioAssets() {
  const dirUrl = `assets/portfolio/`;
  try {
    const res = await fetch(`${dirUrl}?v=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return [];
    const html = await res.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const anchors = Array.from(doc.querySelectorAll('a'));
    const exts = ['.jpg','.jpeg','.png','.webp','.gif','.JPG','.JPEG','.PNG','.WEBP','.GIF'];
    const names = anchors
      .map(a => a.getAttribute('href'))
      .filter(h => h && !h.startsWith('?') && !h.includes('../'))
      .map(h => h.split('/').pop())
      .filter(name => exts.some(ext => name.endsWith(ext)));
    names.sort((a,b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
    return names.map(n => `${dirUrl}${n}`);
  } catch {
    return [];
  }
}

listPortfolioAssets().then(list => {
  if (Array.isArray(list) && list.length) {
    photos = list;
    createCarousel();
    startAutoplay();
  }
}).catch(() => {});

// ------------------------------
// Eventos con PIN por carpeta
// ------------------------------

// Mapa de PINs (demo). En producción se debe validar en backend.
const pinMap = {
  'cumple-50': '5050',
  'fiesta-15': '1515',
  'Bautismo de Helena': '0080',
  '3 Años de Enzo': '1234',
};

// Raíces candidatas para las carpetas de eventos dentro de assets
const EVENT_ROOT_CANDIDATES = [
  'assets/eventos',
  'assets/Eventos',
  'assets/eventFolder',
  'assets/events',
  'assets/Events',
  'assets', // fallback
];
let EVENT_BASE = 'assets';
async function detectEventBase() {
  for (const base of EVENT_ROOT_CANDIDATES) {
    try {
      const r = await fetch(`${base}/`, { cache: 'no-store' });
      if (r.ok) { EVENT_BASE = base; return base; }
    } catch {}
  }
  return EVENT_BASE;
}

function openPinModal(slug) {
  selectedSlug = slug;
  pinInput.value = '';
  pinBackdrop.hidden = false;
  pinInput.focus();
}
function closePinModal() {
  pinBackdrop.hidden = true;
  selectedSlug = null;
}
pinCancel?.addEventListener('click', closePinModal);
pinBackdrop?.addEventListener('click', (e) => { if (e.target === pinBackdrop) closePinModal(); });
pinInput?.addEventListener('keydown', (e) => { if (e.key === 'Enter') pinSubmit.click(); });

pinSubmit?.addEventListener('click', () => {
  if (!selectedSlug) return;
  const pin = pinInput.value.trim();
  const ok = pin && pinMap[selectedSlug] === pin;
  if (!ok) {
    pinInput.setCustomValidity('PIN incorrecto');
    pinInput.reportValidity();
    setTimeout(() => pinInput.setCustomValidity(''), 2000);
    return;
  }
  // Marca acceso en localStorage y abre la galería del evento
  const targetSlug = selectedSlug; // guarda antes de cerrar el modal
  localStorage.setItem(`eventAccess_${targetSlug}`, 'true');
  sessionStorage.setItem(`eventAccess_${targetSlug}`, 'true');
  closePinModal();
  const url = `events.html?slug=${encodeURIComponent(targetSlug)}&access=1&v=${Date.now()}`;
  location.href = url;
});
async function loadEvents() {
  if (!eventsGrid) return;
  const myLoadId = ++eventsLoadId;
  try {
    const res = await fetch(`events.json?v=${Date.now()}`, { cache: 'no-store' });
    const data = await res.json();
    let list = Array.isArray(data.events) ? data.events : [];
    // Limpia tempranamente para evitar parpadeo, la última carga reemplazará el contenido
    eventsGrid.innerHTML = '';
    // Helpers para portada por evento
    const exts = ['.jpg','.jpeg','.png','.webp','.gif','.JPG','.JPEG','.PNG','.WEBP','.GIF'];
    const isHttp = (u) => /^https?:\/\//i.test(u);
    const toTitle = (sl) => sl.replace(/[-_]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    async function listEventDirs() {
      await detectEventBase();
      try {
        const r = await fetch(`${EVENT_BASE}/`, { cache: 'no-store' });
        if (!r.ok) return [];
        const html = await r.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const anchors = Array.from(doc.querySelectorAll('a[href]'));
        const raw = anchors
          .map(a => a.getAttribute('href') || '')
          .filter(h => h && !h.startsWith('?') && !h.includes('../') && /\/$/.test(h));
        const originals = raw.map(h => decodeURIComponent(h)
          .replace(/\/$/, '')
          .replace(/^\.\//, '')
          .trim()
        );
        // Dedupe por nombre normalizado, preservando el original para mostrar
        const map = new Map();
        for (const name of originals) {
          const key = name.toLowerCase();
          if (key === 'portfolio' || key === 'readme.txt') continue;
          if (!map.has(key)) map.set(key, name);
        }
        return Array.from(map.values());
      } catch { return []; }
    }
    async function listEventAssets(dirSlug) {
      try {
        const dirUrl = `${EVENT_BASE}/${encodeURIComponent(dirSlug)}/`;
        const r = await fetch(`${dirUrl}?v=${Date.now()}`, { cache: 'no-store' });
        if (!r.ok) return [];
        const html = await r.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const anchors = Array.from(doc.querySelectorAll('a'));
        const names = anchors
          .map(a => a.getAttribute('href'))
          .filter(h => h && !h.startsWith('?') && !h.includes('../'))
          .map(h => h.split('/').pop())
          .filter(name => exts.some(ext => name.endsWith(ext)));
        names.sort((a,b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
        return names;
      } catch { return []; }
    }
    async function resolveCover(ev) {
      if (ev.cover) {
        return isHttp(ev.cover) ? ev.cover : `${EVENT_BASE}/${ev.slug}/${ev.cover}`;
      }
      const names = (Array.isArray(ev.images) && ev.images.length) ? ev.images : await listEventAssets(ev.slug);
      const preferred = names.find(n => /cover|portada|front|capa|portada/i.test(n)) || names[0];
      return preferred ? `${EVENT_BASE}/${ev.slug}/${preferred}` : null;
    }

    // Descubrir automáticamente carpetas en assets y agregarlas si no están en el JSON
    try {
      const discovered = await listEventDirs();
      const known = new Set(list.map(e => (e.slug || '').toLowerCase()));
      for (const dirName of discovered) {
        if (dirName.toLowerCase() === 'portfolio') continue; // seguridad extra
        if (!known.has(dirName.toLowerCase())) {
          const names = await listEventAssets(dirName);
          if (!names.length) continue;
          // Usa el nombre original de la carpeta como título visible
          list.push({ slug: dirName, title: dirName, date: new Date().toISOString().slice(0,10), images: names });
        }
      }
    } catch {}

    if (list.length === 0) {
      if (myLoadId !== eventsLoadId) return; // otra carga más nueva
      eventsGrid.innerHTML = '<p class="hint">No hay eventos disponibles todavía.</p>';
      return;
    }

    // Construye en un fragmento y reemplaza de una sola vez para evitar duplicados por cargas concurrentes
    const fragment = document.createDocumentFragment();
    for (const ev of list) {
      const displayTitle = ev.title || ev.slug;
      const card = document.createElement('button');
      card.className = 'event-card';
      card.setAttribute('type', 'button');
      const coverWrap = document.createElement('div');
      coverWrap.className = 'cover-wrap';
      const coverImg = document.createElement('img');
      coverImg.className = 'cover';
      coverImg.alt = displayTitle;
      coverWrap.appendChild(coverImg);
      const titleEl = document.createElement('h3');
      titleEl.textContent = displayTitle;
      const dateEl = document.createElement('div');
      dateEl.className = 'meta';
      const d = ev.date ? new Date(ev.date) : null;
      const validDate = d && !isNaN(d.getTime());
      dateEl.textContent = validDate ? d.toLocaleDateString('es-AR') : '';
      if (!validDate) dateEl.style.display = 'none';
      const countEl = document.createElement('div');
      countEl.className = 'meta';
      countEl.textContent = (ev.images && ev.images.length) ? `${ev.images.length} fotos` : 'Galería automática';
      card.appendChild(coverWrap);
      card.appendChild(titleEl);
      card.appendChild(dateEl);
      card.appendChild(countEl);

      try {
        const src = await resolveCover(ev);
        if (src) {
          coverImg.src = src;
          coverImg.onerror = () => {
            coverImg.src = `https://picsum.photos/seed/${encodeURIComponent(ev.slug)}/600/360`;
          };
        }
      } catch {}

      card.addEventListener('click', () => {
        if (Date.now() < suppressModalUntil) return;
        // Si no hay PIN configurado para el slug, abrimos directo la galería
        if (!pinMap[ev.slug]) {
          localStorage.setItem(`eventAccess_${ev.slug}`, 'true');
          sessionStorage.setItem(`eventAccess_${ev.slug}`, 'true');
          const url = `events.html?slug=${encodeURIComponent(ev.slug)}&access=1&v=${Date.now()}`;
          location.href = url;
        } else {
          openPinModal(ev.slug);
        }
      });
      fragment.appendChild(card);
    }
    // Si hubo otra carga más reciente, aborta esta inserción
    if (myLoadId !== eventsLoadId) return;
    eventsGrid.replaceChildren(fragment);
  } catch (e) {
    eventsGrid.innerHTML = '<p class="hint">No se pudo cargar la lista de eventos.</p>';
    console.error('Error cargando eventos:', e);
  }
}

loadEvents();

// Aparición al hacer scroll para elementos con clase .reveal
(function setupReveal() {
  const items = Array.from(document.querySelectorAll('.reveal'));
  if (!items.length) return;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  items.forEach(el => obs.observe(el));
})();