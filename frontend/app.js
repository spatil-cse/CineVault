
// =============================================
// CineVault — Frontend App Logic v2.0
// Dhurandhar Edition — Full Feature Set
// =============================================

const API = 'http://localhost:8080/api';
// =============================================
// YOUTUBE VIDEO BACKGROUND
// =============================================
// =============================================
// HERO BACKGROUND — 5-MOVIE TRAILER LOOP
// Plays 24/7 on loop: Dhurandhar → Baahubali 2
//   → RRR → Kantara → KGF Chapter 2 → repeat
// =============================================
const HERO_TRAILERS = [
  { id: 'BKOVzHcjEIo', title: 'Dhurandhar',                  start: 5  },
  { id: 'G62HrubdD6o', title: 'Baahubali 2: The Conclusion',  start: 5  },
  { id: 'f_vbAtFSEc0', title: 'RRR',                          start: 5  },
  { id: '8mrVmf239GU', title: 'Kantara',                      start: 5  },
  { id: 'JKa05nyUmuQ', title: 'KGF: Chapter 2',               start: 5  },
  { id: 'GDpFdyah5P8', title: 'Vikram',                       start: 5  },
  { id: 'MfCfDmF7NVo', title: 'Leo',                          start: 5  },
];
let _heroIdx = 0;

// Update the hero badge to show which movie is playing
function updateHeroBadge(title) {
  const badge = document.querySelector('.hero-badge');
  if (badge) {
    badge.style.opacity = '0';
    badge.style.transition = 'opacity 0.5s';
    setTimeout(() => {
      badge.textContent = '▶ Now Playing: ' + title;
      badge.style.opacity = '1';
    }, 500);
  }
}

let ytPlayer;
window.onYouTubeIframeAPIReady = function() {
  const first = HERO_TRAILERS[0];
  updateHeroBadge(first.title);
  ytPlayer = new YT.Player('ytPlayer', {
    videoId: first.id,
    playerVars: {
      autoplay: 1, mute: 1, loop: 0,
      controls: 0, showinfo: 0, rel: 0,
      iv_load_policy: 3, modestbranding: 1,
      playsinline: 1, disablekb: 1, fs: 0,
      start: first.start
    },
    events: {
      onReady: (e) => { e.target.playVideo(); },
      onStateChange: (e) => {
        // Trailer ended — advance to next in the 5-movie loop
        if (e.data === YT.PlayerState.ENDED) {
          _heroIdx = (_heroIdx + 1) % HERO_TRAILERS.length;
          const next = HERO_TRAILERS[_heroIdx];
          updateHeroBadge(next.title);
          e.target.loadVideoById({ videoId: next.id, startSeconds: next.start });
          e.target.playVideo();
        }
        // Auto-resume if paused unexpectedly (tab visibility, browser throttle)
        if (e.data === YT.PlayerState.PAUSED) {
          setTimeout(() => { try { e.target.playVideo(); } catch(_){} }, 400);
        }
      },
      onError: () => {
        // Skip broken video and continue the loop
        _heroIdx = (_heroIdx + 1) % HERO_TRAILERS.length;
        const next = HERO_TRAILERS[_heroIdx];
        updateHeroBadge(next.title);
        try { ytPlayer.loadVideoById({ videoId: next.id, startSeconds: next.start }); } catch(_){}
      }
    }
  });
};

// Resume playback when user returns to the tab
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && ytPlayer && typeof ytPlayer.getPlayerState === 'function') {
    try {
      const state = ytPlayer.getPlayerState();
      // -1=unstarted, 2=paused, 5=cued — all need a nudge
      if (state === -1 || state === 2 || state === 5) ytPlayer.playVideo();
    } catch(_) {}
  }
});

// =============================================
// VIDEO MUTE TOGGLE
// =============================================
let videoMuted = true;
function toggleVideoMute() {
  if (!ytPlayer) return;
  if (videoMuted) {
    ytPlayer.unMute(); ytPlayer.setVolume(40);
    document.getElementById('muteIcon').textContent = '🔊';
    videoMuted = false;
  } else {
    ytPlayer.mute();
    document.getElementById('muteIcon').textContent = '🔇';
    videoMuted = true;
  }
}


let currentUser   = null;
let currentMovie  = null;
let selectedSeats = [];
let selectedDate  = null;
let selectedTime  = null;
let allMovies     = [];
let activeGenre   = 'All';
let lastBooking   = null;

// =============================================
// INIT
// =============================================
document.addEventListener('DOMContentLoaded', () => {
  checkSession();
  loadMovies();
  createParticles();
  createHeroRain();
  initScrollEffects();
  // Ensure search always works — bind via addEventListener as belt-and-suspenders
  const si = document.getElementById('searchInput');
  if (si) {
    si.addEventListener('input', filterMovies);
    si.addEventListener('keyup', filterMovies);
  }
});

// =============================================
// PARTICLES & RAIN EFFECTS
// =============================================
function createParticles() {
  const container = document.getElementById('particles');
  for (let i = 0; i < 20; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.cssText = `
      left: ${Math.random() * 100}%;
      width: ${Math.random() * 2 + 1}px;
      height: ${Math.random() * 2 + 1}px;
      animation-duration: ${Math.random() * 10 + 8}s;
      animation-delay: ${Math.random() * 10}s;
    `;
    container.appendChild(p);
  }
}

function createHeroRain() {
  const container = document.getElementById('heroRain');
  for (let i = 0; i < 60; i++) {
    const drop = document.createElement('div');
    drop.className = 'rain-drop';
    const height = Math.random() * 80 + 40;
    drop.style.cssText = `
      left: ${Math.random() * 100}%;
      height: ${height}px;
      animation-duration: ${Math.random() * 1.5 + 0.8}s;
      animation-delay: ${Math.random() * 3}s;
      opacity: ${Math.random() * 0.4 + 0.1};
    `;
    container.appendChild(drop);
  }
}

function initScrollEffects() {
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  });
}

function toggleMobileMenu() {
  const links = document.getElementById('navLinks');
  links.style.display = links.style.display === 'flex' ? 'none' : 'flex';
}

// =============================================
// SESSION
// =============================================
function checkSession() {
  const saved = localStorage.getItem('cinevault_user');
  if (saved) {
    currentUser = JSON.parse(saved);
    updateNavForUser();
  }
}

function updateNavForUser() {
  const links   = document.getElementById('navLinks');
  const info    = document.getElementById('userInfo');
  const welcome = document.getElementById('welcomeText');
  const adminBtn = document.getElementById('adminBtn');

  if (currentUser) {
    links.style.display = 'none';
    info.style.display  = 'flex';
    welcome.textContent = `⚔ ${currentUser.name}`;
    // Show admin btn for admins
    if (currentUser.email === 'admin@cinevault.com' || currentUser.role === 'ADMIN') {
      adminBtn.style.display = 'inline-flex';
    }
  } else {
    links.style.display = 'flex';
    info.style.display  = 'none';
    if(adminBtn) adminBtn.style.display = 'none';
  }
}

function logout() {
  currentUser = null;
  localStorage.removeItem('cinevault_user');
  updateNavForUser();
  showToast('Logged out. See you at the movies! 🎬');
}

// =============================================
// AUTH
// =============================================
function showAuthModal(tab) {
  document.getElementById('authModal').style.display = 'flex';
  switchAuthTab(tab);
}

function switchAuthTab(tab) {
  document.getElementById('loginForm').style.display    = tab === 'login'    ? 'block' : 'none';
  document.getElementById('registerForm').style.display = tab === 'register' ? 'block' : 'none';
  document.getElementById('loginTab').classList.toggle('active', tab === 'login');
  document.getElementById('registerTab').classList.toggle('active', tab === 'register');
}

async function login() {
  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const errEl    = document.getElementById('loginError');
  if (!email || !password) { errEl.textContent = 'Please fill all fields.'; return; }
  errEl.textContent = '';

  try {
    const res  = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) { errEl.textContent = data.message || 'Login failed'; return; }
    currentUser = data;
    localStorage.setItem('cinevault_user', JSON.stringify(data));
    updateNavForUser();
    closeModal('authModal');
    showToast(`Welcome back, ${data.name}! ⚔`);
  } catch(e) {
    // Demo login
    if (email === 'admin@cinevault.com' && password === 'admin123') {
      currentUser = { id: 1, name: 'Admin', email, role: 'ADMIN', token: 'demo' };
    } else {
      currentUser = { id: 2, name: email.split('@')[0], email, role: 'USER', token: 'demo' };
    }
    localStorage.setItem('cinevault_user', JSON.stringify(currentUser));
    updateNavForUser();
    closeModal('authModal');
    showToast(`Welcome, ${currentUser.name}! ⚔`);
  }
}

async function register() {
  const name     = document.getElementById('regName').value.trim();
  const email    = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  const errEl    = document.getElementById('registerError');
  if (!name || !email || !password) { errEl.textContent = 'Please fill all fields.'; return; }
  if (password.length < 6) { errEl.textContent = 'Password must be at least 6 characters.'; return; }
  errEl.textContent = '';

  try {
    const res  = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if (!res.ok) { errEl.textContent = data.message || 'Registration failed'; return; }
    currentUser = data;
    localStorage.setItem('cinevault_user', JSON.stringify(data));
    updateNavForUser(); closeModal('authModal');
    showToast(`Welcome to CineVault, ${data.name}! 🎉`);
  } catch(e) {
    currentUser = { id: Date.now(), name, email, role: 'USER', token: 'demo' };
    localStorage.setItem('cinevault_user', JSON.stringify(currentUser));
    updateNavForUser(); closeModal('authModal');
    showToast(`Welcome to CineVault, ${name}! 🎉`);
  }
}

// =============================================
// LOAD MOVIES
// =============================================
async function loadMovies() {
  try {
    const res    = await fetch(`${API}/movies`);
    const movies = await res.json();
    allMovies = movies.length ? movies : INDIAN_MOVIES;
  } catch(e) {
    allMovies = INDIAN_MOVIES;
  }
  // Ensure all movies have poster URLs assigned
  allMovies.forEach((m) => {
    // posterUrl loaded dynamically via loadPoster()
  });
  renderMovies(allMovies);
}

// =============================================
// SEARCH & FILTER
// =============================================
function filterMovies() {
  const searchEl = document.getElementById('searchInput');
  const langEl   = document.getElementById('langSelect');
  if (!searchEl || !langEl || !allMovies.length) return;
  const query    = searchEl.value.toLowerCase().trim();
  const lang     = langEl.value;
  let filtered   = [...allMovies];

  if (activeGenre !== 'All') {
    filtered = filtered.filter(m => m.genre === activeGenre);
  }
  if (lang !== 'All') {
    filtered = filtered.filter(m => m.language === lang || (m.languages && m.languages.includes(lang)));
  }
  if (query) {
    filtered = filtered.filter(m =>
      m.title.toLowerCase().includes(query) ||
      (m.genre || '').toLowerCase().includes(query) ||
      (m.director || '').toLowerCase().includes(query) ||
      (m.cast || '').toLowerCase().includes(query) ||
      (m.description || '').toLowerCase().includes(query)
    );
  }
  sortAndRender(filtered);
}

function filterByGenre(genre, el) {
  activeGenre = genre;
  document.querySelectorAll('.genre-pill').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  filterMovies();
}

function clearSearch() {
  document.getElementById('searchInput').value = '';
  filterMovies();
}

function sortMovies() { filterMovies(); }

function sortAndRender(movies) {
  const sort = document.getElementById('sortSelect').value;
  const sorted = [...movies];
  if (sort === 'rating') sorted.sort((a,b) => parseFloat(b.rating||0) - parseFloat(a.rating||0));
  else if (sort === 'name') sorted.sort((a,b) => a.title.localeCompare(b.title));
  else if (sort === 'duration') sorted.sort((a,b) => (b.duration||0) - (a.duration||0));
  renderMovies(sorted);
}

// =============================================
// RENDER MOVIES
// =============================================
function renderMovies(movies) {
  const grid   = document.getElementById('moviesGrid');
  const count  = document.getElementById('resultsCount');
  count.textContent = `${movies.length} movie${movies.length !== 1 ? 's' : ''} found`;

  if (!movies.length) {
    grid.innerHTML = `
      <div class="loading-state">
        <div style="font-size:3rem;margin-bottom:16px">🎬</div>
        <p>No movies found. Try a different search.</p>
      </div>`;
    return;
  }

  grid.innerHTML = movies.map((m, i) => `
    <div class="movie-card" style="animation-delay:${Math.min(i*0.04,1.5)}s" data-movie-id="${m.id}" onclick="openBookingById(${m.id})">
      <img src="" alt="${m.title}" class="movie-poster" data-movie-id="${m.id}"
           style="display:none"
           onerror="handlePosterError(this, ${m.id}, '${(m.title||'').replace(/'/g,'')}', ${m.year||2023});"/>
      <div class="movie-poster-placeholder">
        ${getPosterEmoji(m.genre)}
      </div>
      <div class="movie-card-body">
        <span class="movie-genre-tag">${m.genre || 'Film'}</span>
        <h3>${m.title}</h3>
        <div class="movie-lang-tag">${m.language || 'Hindi'} ${m.year ? '• ' + m.year : ''}</div>
        <div class="movie-meta">
          <span class="movie-duration">⏱ ${m.duration || 120}m</span>
          <span class="rating-badge">★ ${m.rating || '8.0'}</span>
        </div>
        <div class="card-actions">
          ${MOVIE_TRAILERS[m.id] ? `<button class="trailer-btn" onclick="event.stopPropagation();playTrailer(${m.id})">▶ Trailer</button>` : ''}
          <button class="book-btn">Book Tickets</button>
        </div>
      </div>
    </div>
  `).join('');

  // Load posters dynamically via OMDB for all rendered cards
  document.querySelectorAll('.movie-poster[data-movie-id]').forEach(img => {
    loadPoster(img, parseInt(img.dataset.movieId));
  });
}

function escapeJson(obj) {
  return JSON.stringify(obj).replace(/'/g, "&#39;").replace(/"/g, "&quot;");
}

// Look up movie by id and open booking — avoids inline JSON in onclick attrs
function openBookingById(id) {
  const movie = allMovies.find(m => m.id === id);
  if (movie) openBooking(movie);
}

// =============================================
// TRAILER PLAYER
// =============================================
let _trailerPlayer = null;
let _trailerReady   = false;

function playTrailer(movieId) {
  const videoId = MOVIE_TRAILERS[movieId];
  if (!videoId) return;
  const movie = allMovies.find(m => m.id === movieId);
  const title = movie ? movie.title : 'Trailer';

  // Build or show modal
  let overlay = document.getElementById('trailerModal');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'trailerModal';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.92);z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;';
    overlay.innerHTML = `
      <div style="width:min(860px,96vw);position:relative;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <h2 id="trailerTitle" style="color:#fff;font-family:Cinzel,serif;font-size:1.1rem;letter-spacing:.05em;margin:0;"></h2>
          <button onclick="closeTrailerModal()" style="background:none;border:none;color:#fff;font-size:1.8rem;cursor:pointer;line-height:1;">✕</button>
        </div>
        <div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:12px;box-shadow:0 0 60px rgba(200,150,0,0.3);">
          <iframe id="trailerIframe" width="100%" height="100%"
            style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;border-radius:12px;"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen></iframe>
        </div>
        <p style="color:rgba(255,255,255,0.5);font-size:.75rem;text-align:center;margin-top:10px;">Press ESC or ✕ to close</p>
      </div>`;
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeTrailerModal(); });
    document.body.appendChild(overlay);
    // ESC key closes modal
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeTrailerModal(); });
  }

  document.getElementById('trailerTitle').textContent = '▶ ' + title;
  document.getElementById('trailerIframe').src =
    `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&showinfo=0`;
  overlay.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeTrailerModal() {
  const overlay = document.getElementById('trailerModal');
  if (!overlay) return;
  overlay.style.display = 'none';
  // Stop video by clearing src
  const iframe = document.getElementById('trailerIframe');
  if (iframe) iframe.src = '';
  document.body.style.overflow = '';
}

function getPosterEmoji(genre) {
  const map = {
    'Action': '⚔', 'Drama': '🎭', 'Thriller': '🔥', 'Romance': '💕',
    'Comedy': '😂', 'Sci-Fi': '🚀', 'Horror': '👻', 'Fantasy': '🧙',
    'Historical': '🏰', 'Biographical': '📽', 'Crime': '🕵', 'Musical': '🎵'
  };
  return map[genre] || '🎬';
}

// =============================================
// BOOKING MODAL
// =============================================
function openBooking(movie) {
  if (!currentUser) {
    showToast('Please login to book tickets ⚔');
    showAuthModal('login'); return;
  }
  currentMovie  = movie;
  selectedSeats = [];
  selectedDate  = null;
  selectedTime  = null;

  document.getElementById('modalTitle').textContent    = movie.title;
  document.getElementById('modalDuration').textContent = `${movie.duration || 120} min`;
  document.getElementById('modalRating').textContent   = `★ ${movie.rating || '8.0'}`;
  document.getElementById('modalDirector').textContent = movie.director || 'N/A';
  document.getElementById('modalGenreTag').textContent = movie.genre || 'Drama';
  document.getElementById('modalLangTag').textContent  = movie.language || 'Hindi';
  document.getElementById('modalDesc').textContent     = movie.description || 'An epic cinematic experience.';
  document.getElementById('summaryMovie').textContent  = movie.title;
  document.getElementById('ticketPriceDisplay').textContent = movie.ticketPrice || 250;

  const poster = document.getElementById('modalPoster');
  const placeholder = document.getElementById('modalPosterPlaceholder');
  // Always use dynamic OMDB poster loading
  poster.src = '';
  poster.style.display = 'none';
  placeholder.style.display = 'flex';
  placeholder.textContent = getPosterEmoji(movie.genre);
  poster.setAttribute('data-movie-id', movie.id);
  loadPoster(poster, movie.id);

  renderDatePills();
  renderTimePills();
  updateSummary();
  document.getElementById('bookingModal').style.display = 'flex';
}

function renderDatePills() {
  const container = document.getElementById('datePills');
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const today = new Date();

  container.innerHTML = Array.from({length: 7}, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const label = i === 0 ? 'Today' : i === 1 ? 'Tomorrow'
      : `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
    const val = d.toISOString().split('T')[0];
    return `<button class="pill ${i === 0 ? 'active' : ''}" onclick="selectDate('${val}', this)">${label}</button>`;
  }).join('');
  selectedDate = today.toISOString().split('T')[0];
  loadSeatMap();
}

function renderTimePills() {
  const times = ['09:30 AM','12:30 PM','03:30 PM','06:30 PM','09:30 PM'];
  const container = document.getElementById('timePills');
  container.innerHTML = times.map((t, i) =>
    `<button class="pill ${i === 0 ? 'active' : ''}" onclick="selectTime('${t}', this)">${t}</button>`
  ).join('');
  selectedTime = times[0];
}

function selectDate(date, el) {
  selectedDate = date;
  document.querySelectorAll('#datePills .pill').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  selectedSeats = [];
  loadSeatMap(); updateSummary();
}

function selectTime(time, el) {
  selectedTime = time;
  document.querySelectorAll('#timePills .pill').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  selectedSeats = [];
  loadSeatMap(); updateSummary();
}

// =============================================
// SEAT MAP
// =============================================
async function loadSeatMap() {
  if (!currentMovie || !selectedDate || !selectedTime) return;
  let bookedSeats = [];
  try {
    const res = await fetch(`${API}/bookings/seats?movieId=${currentMovie.id}&date=${selectedDate}&time=${encodeURIComponent(selectedTime)}`);
    bookedSeats = await res.json();
  } catch(e) {
    bookedSeats = DEMO_BOOKED_SEATS.slice(0, Math.floor(Math.random() * 15) + 5);
  }
  renderSeatGrid(bookedSeats);
}

function renderSeatGrid(bookedSeats) {
  const grid    = document.getElementById('seatGrid');
  const rows    = ['A','B','C','D','E','F','G','H'];
  const cols    = 10;
  const booked  = new Set(bookedSeats);
  const premium = new Set(['A1','A2','A3','A4','A5','A6','A7','A8','A9','A10']);

  grid.innerHTML = rows.flatMap(row =>
    Array.from({length: cols}, (_, c) => {
      const id = `${row}${c+1}`;
      const isBooked  = booked.has(id);
      const isPremium = premium.has(id);
      return `<div class="seat ${isBooked ? 'booked' : ''} ${isPremium ? 'premium' : ''}"
        id="seat-${id}" title="${id}${isPremium ? ' (Premium)' : ''}"
        onclick="${isBooked ? '' : `toggleSeat('${id}', this)`}">${id}</div>`;
    })
  ).join('');
}

function toggleSeat(seatId, el) {
  if (el.classList.contains('selected')) {
    el.classList.remove('selected');
    selectedSeats = selectedSeats.filter(s => s !== seatId);
  } else {
    el.classList.add('selected');
    selectedSeats.push(seatId);
  }
  updateSummary();
}

function updateSummary() {
  const price = parseInt(currentMovie?.ticketPrice || 250);
  document.getElementById('selectedSeatsText').textContent =
    selectedSeats.length ? selectedSeats.join(', ') : 'None';
  document.getElementById('totalPrice').textContent =
    `₹${(selectedSeats.length * price).toLocaleString('en-IN')}`;
}

// =============================================
// CONFIRM BOOKING
// =============================================
async function confirmBooking() {
  if (!selectedSeats.length) { showToast('Please select at least one seat ⚔'); return; }
  if (!selectedDate)         { showToast('Please select a date'); return; }
  if (!selectedTime)         { showToast('Please select a showtime'); return; }

  const price   = parseInt(currentMovie?.ticketPrice || 250);
  const total   = selectedSeats.length * price;
  const bookingId = 'CV' + Date.now().toString().slice(-8).toUpperCase();

  const payload = {
    userId: currentUser.id, movieId: currentMovie.id,
    date: selectedDate, time: selectedTime,
    seats: selectedSeats, total,
    bookingId
  };

  lastBooking = {
    ...payload,
    movieTitle: currentMovie.title,
    movieGenre: currentMovie.genre,
    movieLanguage: currentMovie.language,
    userName: currentUser.name,
    userEmail: currentUser.email,
    duration: currentMovie.duration,
    director: currentMovie.director,
  };

  try {
    const res = await fetch(`${API}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentUser.token}`
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('API error');
  } catch(e) {
    // Demo success
  }

  // Save locally for demo
  const stored = JSON.parse(localStorage.getItem('cinevault_bookings') || '[]');
  stored.unshift(lastBooking);
  localStorage.setItem('cinevault_bookings', JSON.stringify(stored));

  closeModal('bookingModal');

  // Show ticket
  setTimeout(() => showTicketModal(lastBooking), 300);
}

// =============================================
// TICKET MODAL
// =============================================
function showTicketModal(booking) {
  const content = document.getElementById('ticketContent');
  const barcode = generateBarcode(booking.bookingId || 'CV12345678');

  content.innerHTML = `
    <div class="ticket-logo">⚔ CINEVAULT</div>
    <div class="ticket-movie-name">${booking.movieTitle}</div>
    <div style="font-family:'Rajdhani',sans-serif;font-size:.8rem;color:var(--muted);margin-bottom:12px;letter-spacing:1px">
      ${booking.movieGenre || ''} • ${booking.movieLanguage || 'Hindi'}
    </div>
    <hr class="ticket-divider"/>
    <div class="ticket-grid">
      <div class="ticket-field"><label>Date</label><span>${formatDate(booking.date)}</span></div>
      <div class="ticket-field"><label>Showtime</label><span>${booking.time}</span></div>
      <div class="ticket-field"><label>Booked By</label><span>${booking.userName}</span></div>
      <div class="ticket-field"><label>Duration</label><span>${booking.duration || 120} min</span></div>
    </div>
    <hr class="ticket-divider"/>
    <div style="font-family:'Rajdhani',sans-serif;font-size:.75rem;color:var(--muted);margin-bottom:6px;letter-spacing:1.5px;text-transform:uppercase">Selected Seats</div>
    <div class="ticket-seats">${booking.seats.join('  •  ')}</div>
    <div class="ticket-total">₹${booking.total.toLocaleString('en-IN')}</div>
    <hr class="ticket-divider"/>
    <div class="ticket-barcode">
      ${barcode}<br/>
      BOOKING ID: ${booking.bookingId || 'CV12345678'}
    </div>
  `;
  document.getElementById('ticketModal').style.display = 'flex';
}

function generateBarcode(id) {
  let bars = '';
  for (let i = 0; i < id.length; i++) {
    const code = id.charCodeAt(i);
    bars += (code % 3 === 0 ? '█' : code % 3 === 1 ? '▌' : '▎');
  }
  return bars.repeat(3);
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
}

// =============================================
// PDF TICKET GENERATION
// =============================================
function downloadPDFTicket() {
  if (!lastBooking) { showToast('No booking to download'); return; }
  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [90, 180] });

    // Background
    doc.setFillColor(8, 6, 8);
    doc.rect(0, 0, 90, 180, 'F');

    // Red gradient top
    doc.setFillColor(139, 26, 26);
    doc.rect(0, 0, 90, 40, 'F');

    // Header
    doc.setTextColor(201, 168, 76);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('⚔ CINEVAULT', 45, 14, { align: 'center' });

    doc.setTextColor(245, 237, 232);
    doc.setFontSize(12);
    doc.text(lastBooking.movieTitle.toUpperCase(), 45, 24, { align: 'center', maxWidth: 80 });

    doc.setTextColor(192, 57, 43);
    doc.setFontSize(7);
    doc.text(`${lastBooking.movieGenre || ''} • ${lastBooking.movieLanguage || 'Hindi'}`, 45, 32, { align: 'center' });

    // White section
    doc.setFillColor(19, 10, 14);
    doc.roundedRect(6, 44, 78, 90, 3, 3, 'F');
    doc.setDrawColor(139, 26, 26);
    doc.setLineWidth(0.3);
    doc.roundedRect(6, 44, 78, 90, 3, 3, 'S');

    const fields = [
      ['Date', formatDate(lastBooking.date)],
      ['Showtime', lastBooking.time],
      ['Booked By', lastBooking.userName],
      ['Duration', `${lastBooking.duration || 120} min`],
      ['Seats', lastBooking.seats.join(', ')],
    ];
    doc.setFontSize(7);
    let y = 52;
    fields.forEach(([label, value]) => {
      doc.setTextColor(122, 96, 96);
      doc.setFont('helvetica', 'normal');
      doc.text(label.toUpperCase(), 12, y);

      doc.setTextColor(245, 237, 232);
      doc.setFont('helvetica', 'bold');
      const display = doc.splitTextToSize(value, 45);
      doc.text(display, 45, y);
      y += (display.length > 1 ? 9 : 7);
    });

    // Total
    doc.setFillColor(139, 26, 26);
    doc.rect(6, 136, 78, 16, 'F');
    doc.setTextColor(245, 237, 232);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('TOTAL AMOUNT', 45, 142, { align: 'center' });
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(201, 168, 76);
    doc.text(`Rs. ${lastBooking.total.toLocaleString('en-IN')}`, 45, 150, { align: 'center' });

    // Barcode area
    doc.setFillColor(19, 10, 14);
    doc.roundedRect(6, 156, 78, 20, 3, 3, 'F');
    doc.setTextColor(122, 96, 96);
    doc.setFontSize(6);
    doc.text('BOOKING ID', 45, 163, { align: 'center' });
    doc.setTextColor(192, 57, 43);
    doc.setFontSize(8);
    doc.text(lastBooking.bookingId || 'CV12345678', 45, 170, { align: 'center' });
    doc.setFontSize(5);
    doc.setTextColor(70, 50, 50);
    doc.text('This ticket is valid for the booked show only. CineVault 2026', 45, 176, { align: 'center' });

    doc.save(`CineVault_${lastBooking.movieTitle.replace(/\s/g,'_')}_${lastBooking.bookingId || 'ticket'}.pdf`);
    showToast('🎟 PDF ticket downloaded!');
  } catch(e) {
    showToast('PDF generation error. Please try again.');
    console.error(e);
  }
}

// =============================================
// MY BOOKINGS
// =============================================
async function showMyBookings() {
  document.getElementById('bookingsModal').style.display = 'flex';
  const list = document.getElementById('bookingsList');
  list.innerHTML = '<p style="color:var(--muted);text-align:center;padding:40px">Loading...</p>';

  let bookings = [];
  try {
    const res = await fetch(`${API}/bookings/user/${currentUser.id}`, {
      headers: { 'Authorization': `Bearer ${currentUser.token}` }
    });
    bookings = await res.json();
  } catch(e) {
    const stored = JSON.parse(localStorage.getItem('cinevault_bookings') || '[]');
    bookings = stored.filter(b => b.userEmail === currentUser.email);
    if (!bookings.length) bookings = DEMO_BOOKINGS;
  }
  renderBookings(bookings);
}

function renderBookings(bookings) {
  const list = document.getElementById('bookingsList');
  if (!bookings.length) {
    list.innerHTML = '<p style="color:var(--muted);text-align:center;padding:60px">No bookings yet. Go watch a movie! 🎬</p>';
    return;
  }
  list.innerHTML = bookings.map(b => `
    <div class="booking-item">
      <div class="booking-item-header">
        <h4>${b.movieTitle || 'Movie'}</h4>
        <span class="booking-amount">₹${(b.total||0).toLocaleString('en-IN')}</span>
      </div>
      <div class="booking-item-meta">
        <span>📅 <strong>${b.date ? formatDate(b.date) : b.date}</strong></span>
        <span>⏰ <strong>${b.time}</strong></span>
        <span>💺 <strong>${Array.isArray(b.seats) ? b.seats.join(', ') : b.seats}</strong></span>
      </div>
      <div class="booking-item-actions">
        <span class="booking-id-tag">${b.bookingId || 'ID: —'}</span>
        <button class="btn-pdf" onclick="downloadBookingPDFById('${b.bookingId}')">
          ⬇ PDF Ticket
        </button>
      </div>
    </div>
  `).join('');
}

function downloadBookingPDF(booking) {
  lastBooking = booking;
  downloadPDFTicket();
}

function downloadBookingPDFById(bookingId) {
  const stored = JSON.parse(localStorage.getItem('cinevault_bookings') || '[]');
  const booking = stored.find(b => b.bookingId === bookingId)
    || DEMO_BOOKINGS.find(b => b.bookingId === bookingId);
  if (booking) { lastBooking = booking; downloadPDFTicket(); }
  else showToast('Booking not found');
}

// =============================================
// ADMIN DASHBOARD
// =============================================
function showAdminPanel() {
  document.getElementById('adminModal').style.display = 'flex';
  switchAdminTab('stats', document.querySelector('.admin-tab'));
}

function switchAdminTab(tab, el) {
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
  if(el) el.classList.add('active');
  const content = document.getElementById('adminContent');

  if (tab === 'stats') {
    const bookings = JSON.parse(localStorage.getItem('cinevault_bookings') || '[]');
    const totalRev = bookings.reduce((a,b) => a + (b.total || 0), 0);
    content.innerHTML = `
      <div class="admin-stat-grid">
        <div class="admin-stat-card">
          <span class="admin-stat-num">${allMovies.length}</span>
          <span class="admin-stat-label">Total Movies</span>
        </div>
        <div class="admin-stat-card">
          <span class="admin-stat-num">${bookings.length}</span>
          <span class="admin-stat-label">Total Bookings</span>
        </div>
        <div class="admin-stat-card">
          <span class="admin-stat-num">₹${(totalRev/1000).toFixed(1)}K</span>
          <span class="admin-stat-label">Revenue</span>
        </div>
        <div class="admin-stat-card">
          <span class="admin-stat-num">${getUniqueGenres().length}</span>
          <span class="admin-stat-label">Genres</span>
        </div>
      </div>
      <h3 style="font-family:'Cinzel',serif;color:var(--text);margin-bottom:16px;font-size:1rem;letter-spacing:1px">Recent Bookings</h3>
      ${bookings.length ? `
        <table class="admin-table">
          <thead><tr><th>Movie</th><th>Seats</th><th>Date</th><th>Amount</th></tr></thead>
          <tbody>
            ${bookings.slice(0, 10).map(b => `
              <tr>
                <td>${b.movieTitle || '—'}</td>
                <td>${Array.isArray(b.seats) ? b.seats.join(', ') : b.seats || '—'}</td>
                <td>${b.date || '—'}</td>
                <td style="color:var(--blood);font-weight:700">₹${(b.total||0).toLocaleString('en-IN')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>` : '<p style="color:var(--muted)">No bookings yet</p>'}
    `;
  } else if (tab === 'movies') {
    content.innerHTML = `
      <table class="admin-table">
        <thead><tr><th>#</th><th>Title</th><th>Genre</th><th>Language</th><th>Rating</th><th>Price</th></tr></thead>
        <tbody>
          ${allMovies.map((m,i) => `
            <tr>
              <td style="color:var(--muted)">${i+1}</td>
              <td style="color:var(--text);font-weight:600">${m.title}</td>
              <td>${m.genre || '—'}</td>
              <td>${m.language || 'Hindi'}</td>
              <td><span class="rating-badge">★${m.rating||'8.0'}</span></td>
              <td style="color:var(--blood)">₹${m.ticketPrice||250}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } else if (tab === 'bookings') {
    const bookings = JSON.parse(localStorage.getItem('cinevault_bookings') || '[]');
    content.innerHTML = !bookings.length
      ? '<p style="color:var(--muted);padding:40px 0">No bookings found.</p>'
      : `<table class="admin-table">
          <thead><tr><th>ID</th><th>Movie</th><th>User</th><th>Seats</th><th>Date</th><th>Total</th></tr></thead>
          <tbody>
            ${bookings.map(b => `
              <tr>
                <td style="color:var(--muted);font-size:0.75rem">${b.bookingId || '—'}</td>
                <td style="color:var(--text);font-weight:600">${b.movieTitle || '—'}</td>
                <td>${b.userName || '—'}</td>
                <td>${Array.isArray(b.seats) ? b.seats.join(', ') : b.seats || '—'}</td>
                <td>${b.date || '—'}</td>
                <td style="color:var(--blood);font-weight:700">₹${(b.total||0).toLocaleString('en-IN')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>`;
  } else if (tab === 'add') {
    content.innerHTML = `
      <div style="max-width:500px">
        <h3 style="font-family:'Cinzel',serif;color:var(--text);margin-bottom:24px;font-size:1rem;letter-spacing:1px">Add New Movie</h3>
        <div class="form-group"><label class="form-label">Movie Title</label>
          <input class="form-input" id="newTitle" placeholder="Enter movie title"/></div>
        <div class="form-group"><label class="form-label">Genre</label>
          <select class="form-input" id="newGenre">
            <option>Action</option><option>Drama</option><option>Thriller</option>
            <option>Romance</option><option>Comedy</option><option>Historical</option>
            <option>Biographical</option><option>Crime</option><option>Horror</option>
          </select></div>
        <div class="form-group"><label class="form-label">Language</label>
          <select class="form-input" id="newLang">
            <option>Hindi</option><option>Tamil</option><option>Telugu</option>
            <option>Malayalam</option><option>Kannada</option><option>Bengali</option>
          </select></div>
        <div class="form-group"><label class="form-label">Duration (minutes)</label>
          <input class="form-input" type="number" id="newDuration" placeholder="120"/></div>
        <div class="form-group"><label class="form-label">Rating (0-10)</label>
          <input class="form-input" type="number" step="0.1" id="newRating" placeholder="8.0"/></div>
        <div class="form-group"><label class="form-label">Ticket Price (₹)</label>
          <input class="form-input" type="number" id="newPrice" placeholder="250"/></div>
        <div class="form-group"><label class="form-label">Poster URL (optional)</label>
          <input class="form-input" id="newPoster" placeholder="https://..."/></div>
        <div class="form-group"><label class="form-label">Description</label>
          <textarea class="form-input" id="newDesc" placeholder="Movie description..." rows="3" style="resize:vertical"></textarea></div>
        <button class="btn-confirm" onclick="addMovieAdmin()" style="margin-top:8px">Add Movie</button>
      </div>
    `;
  }
}

function getUniqueGenres() {
  return [...new Set(allMovies.map(m => m.genre).filter(Boolean))];
}

async function addMovieAdmin() {
  const movie = {
    id: Date.now(),
    title:       document.getElementById('newTitle').value.trim(),
    genre:       document.getElementById('newGenre').value,
    language:    document.getElementById('newLang').value,
    duration:    parseInt(document.getElementById('newDuration').value) || 120,
    rating:      document.getElementById('newRating').value || '8.0',
    ticketPrice: parseInt(document.getElementById('newPrice').value) || 250,
    posterUrl:   document.getElementById('newPoster').value.trim(),
    description: document.getElementById('newDesc').value.trim(),
    active: true,
    year: new Date().getFullYear()
  };
  if (!movie.title) { showToast('Please enter a movie title'); return; }
  try {
    const res = await fetch(`${API}/movies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${currentUser?.token}` },
      body: JSON.stringify(movie)
    });
    if (!res.ok) throw new Error();
  } catch(e) { /* demo */ }
  allMovies.unshift(movie);
  renderMovies(allMovies);
  showToast(`✅ "${movie.title}" added successfully!`);
  closeModal('adminModal');
}

// =============================================
// UTILITIES
// =============================================
function closeModal(id) {
  document.getElementById(id).style.display = 'none';
}
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3500);
}
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) e.target.style.display = 'none';
});

// =============================================
// 100+ INDIAN MOVIES DATABASE
// =============================================
// =============================================
// MOVIE TRAILERS — Official YouTube IDs
// =============================================
const MOVIE_TRAILERS = {
  2:  'jQsE85cI384',  // KGF: Chapter 2 — Official Kannada Trailer
  3:  'f_vbAtFSEc0',  // RRR — Official Hindi Trailer
  42: 'G62HrubdD6o',  // Baahubali 2: The Conclusion — Official Hindi Trailer
  91: '8mrVmf239GU',  // Kantara — Official Trailer (Hombale Films)
};

const INDIAN_MOVIES = [
  // ACTION / BLOCKBUSTERS
  { id:1,  title:'Dhurandhar',            genre:'Action',      language:'Hindi',    duration:155, rating:'9.0', year:2026, ticketPrice:350, director:'Aditya Dhar',    description:'An epic revenge saga set against a backdrop of blood and fire.' },
  { id:2,  title:'KGF: Chapter 2',         genre:'Action',      language:'Kannada',  duration:168, rating:'8.4', year:2022, ticketPrice:300, director:'Prashanth Neel',  description:'Rocky\'s empire expands as new enemies rise.' },
  { id:3,  title:'RRR',                    genre:'Action',      language:'Telugu',   duration:187, rating:'8.0', year:2022, ticketPrice:300, director:'S.S. Rajamouli', description:'Two legendary freedom fighters team up for justice.' },
  { id:4,  title:'Pathaan',                genre:'Action',      language:'Hindi',    duration:146, rating:'7.5', year:2023, ticketPrice:250, director:'Siddharth Anand', description:'A spy returns to save India from a global threat.' },
  { id:5,  title:'Jawan',                  genre:'Action',      language:'Hindi',    duration:169, rating:'7.8', year:2023, ticketPrice:280, director:'Atlee',           description:'A prison warden hatches a series of heists.' },
  { id:6,  title:'Animal',                 genre:'Action',      language:'Hindi',    duration:201, rating:'7.6', year:2023, ticketPrice:280, director:'Sandeep Vanga',   description:'A son\'s obsessive love for his father turns violent.' },
  { id:7,  title:'War',                    genre:'Action',      language:'Hindi',    duration:154, rating:'7.3', year:2019, ticketPrice:250, director:'Siddharth Anand', description:'India\'s most deadly assassin goes rogue.' },
  { id:8,  title:'Kalki 2898 AD',          genre:'Sci-Fi',      language:'Telugu',   duration:180, rating:'7.1', year:2024, ticketPrice:350, director:'Nag Ashwin',      description:'A sci-fi epic set in a dystopian future India.' },
  { id:9,  title:'Pushpa: The Rise',        genre:'Action',      language:'Telugu',   duration:179, rating:'7.6', year:2021, ticketPrice:250, director:'Sukumar',        description:'A laborer rises to become a sandalwood smuggler.' },
  
  // THRILLERS
  
  { id:12, title:'Article 370',            genre:'Thriller',    language:'Hindi',    duration:161, rating:'8.0', year:2024, ticketPrice:280, director:'Aditya Suhas Jambhale', description:'The untold story behind a historic decision.' },
  { id:13, title:'Sam Bahadur',            genre:'Biographical',language:'Hindi',    duration:148, rating:'8.2', year:2023, ticketPrice:250, director:'Meghna Gulzar',   description:'The extraordinary life of Field Marshal Sam Manekshaw.' },
  { id:14, title:'12th Fail',              genre:'Drama',       language:'Hindi',    duration:147, rating:'9.0', year:2023, ticketPrice:200, director:'Vidhu Vinod Chopra', description:'A true story of grit against all odds.' },
  { id:15, title:'Talaash',                genre:'Thriller',    language:'Hindi',    duration:139, rating:'7.8', year:2012, ticketPrice:200, director:'Reema Kagti',     description:'A detective searches for answers in Mumbai\'s underworld.' },
  { id:16, title:'Andhadhun',              genre:'Thriller',    language:'Hindi',    duration:139, rating:'8.2', year:2018, ticketPrice:200, director:'Sriram Raghavan', description:'A blind pianist witnesses a murder and enters a web of lies.' },
  { id:17, title:'Badla',                  genre:'Thriller',    language:'Hindi',    duration:118, rating:'7.9', year:2019, ticketPrice:200, director:'Sujoy Ghosh',     description:'A woman accused of murder hires a brilliant lawyer.' },
  { id:18, title:'Kahaani',                genre:'Thriller',    language:'Hindi',    duration:122, rating:'8.1', year:2012, ticketPrice:200, director:'Sujoy Ghosh',     description:'A pregnant woman searches for her missing husband in Kolkata.' },
  { id:19, title:'Vikram',                 genre:'Action',      language:'Tamil',    duration:174, rating:'8.4', year:2022, ticketPrice:300, director:'Lokesh Kanagaraj', description:'A black op agent unravels a deadly conspiracy.' },
  { id:20, title:'Leo',                    genre:'Action',      language:'Tamil',    duration:164, rating:'7.0', year:2023, ticketPrice:280, director:'Lokesh Kanagaraj', description:'A quiet man with a hidden past.' },

  // DRAMA
  { id:21, title:'The Kashmir Files',      genre:'Drama',       language:'Hindi',    duration:170, rating:'8.3', year:2022, ticketPrice:220, director:'Vivek Agnihotri',  description:'The untold story of Kashmiri Pandit exodus.' },
  { id:22, title:'Gangubai Kathiawadi',    genre:'Drama',       language:'Hindi',    duration:152, rating:'7.8', year:2022, ticketPrice:250, director:'Sanjay Leela Bhansali', description:'A girl from a humble background rises to become the matriarch of Kamathipura.' },
  { id:23, title:'Rocketry: The Nambi Effect', genre:'Biographical', language:'Hindi', duration:157, rating:'8.5', year:2022, ticketPrice:220, director:'R. Madhavan',   description:'The life story of ISRO scientist Nambi Narayanan.' },
  { id:24, title:'Swades',                 genre:'Drama',       language:'Hindi',    duration:189, rating:'8.2', year:2004, ticketPrice:200, director:'Ashutosh Gowariker', description:'An NRI returns to India and discovers his roots.' },
  { id:25, title:'Mughal-E-Azam',          genre:'Historical',  language:'Hindi',    duration:177, rating:'8.2', year:1960, ticketPrice:200, director:'K. Asif',         description:'An epic historical romance between a prince and a court dancer.' },
  { id:26, title:'Sholay',                 genre:'Action',      language:'Hindi',    duration:204, rating:'8.2', year:1975, ticketPrice:200, director:'Ramesh Sippy',     description:'Two criminals are hired to capture a ruthless dacoit.' },
  { id:27, title:'Dil Chahta Hai',         genre:'Drama',       language:'Hindi',    duration:183, rating:'8.1', year:2001, ticketPrice:200, director:'Farhan Akhtar',    description:'Three best friends navigate love and life after college.' },
  { id:28, title:'Zindagi Na Milegi Dobara', genre:'Drama',     language:'Hindi',    duration:153, rating:'8.2', year:2011, ticketPrice:200, director:'Zoya Akhtar',     description:'Three friends on a road trip confront their fears.' },
  { id:29, title:'Taare Zameen Par',       genre:'Drama',       language:'Hindi',    duration:165, rating:'8.4', year:2007, ticketPrice:200, director:'Aamir Khan',       description:'A dyslexic child finds a teacher who understands him.' },
  { id:30, title:'3 Idiots',               genre:'Comedy',      language:'Hindi',    duration:170, rating:'8.4', year:2009, ticketPrice:220, director:'Rajkumar Hirani',  description:'Two friends search for their long-lost friend.' },

  // ROMANCE
  { id:31, title:'Dilwale Dulhania Le Jayenge', genre:'Romance', language:'Hindi',   duration:190, rating:'8.1', year:1995, ticketPrice:200, director:'Aditya Chopra',   description:'A love story that spans across cultures and countries.' },
  { id:32, title:'Kabir Singh',            genre:'Romance',     language:'Hindi',    duration:173, rating:'7.1', year:2019, ticketPrice:220, director:'Sandeep Vanga',   description:'A brilliant but rebellious surgeon falls for a college junior.' },
  { id:33, title:'Kal Ho Naa Ho',          genre:'Romance',     language:'Hindi',    duration:186, rating:'8.0', year:2003, ticketPrice:200, director:'Nikhil Advani',   description:'A terminally ill man helps a struggling woman find love.' },
  { id:34, title:'Ae Dil Hai Mushkil',     genre:'Romance',     language:'Hindi',    duration:158, rating:'7.0', year:2016, ticketPrice:220, director:'Karan Johar',     description:'An intense story of unrequited love.' },
  { id:35, title:'Jab We Met',             genre:'Romance',     language:'Hindi',    duration:138, rating:'7.9', year:2007, ticketPrice:200, director:'Imtiaz Ali',      description:'A heartbroken man meets an irrepressible girl on a train.' },
  { id:36, title:'Tamasha',                genre:'Romance',     language:'Hindi',    duration:143, rating:'7.7', year:2015, ticketPrice:220, director:'Imtiaz Ali',      description:'A young couple lose each other only to meet years later.' },
  { id:37, title:'Rockstar',               genre:'Drama',       language:'Hindi',    duration:159, rating:'7.9', year:2011, ticketPrice:220, director:'Imtiaz Ali',      description:'A young musician searches for pain to find greatness.' },
  { id:38, title:'Bajrangi Bhaijaan',      genre:'Drama',       language:'Hindi',    duration:163, rating:'8.1', year:2015, ticketPrice:250, director:'Kabir Khan',      description:'A man helps a mute Pakistani girl return home.' },
  { id:39, title:'PK',                     genre:'Comedy',      language:'Hindi',    duration:153, rating:'8.1', year:2014, ticketPrice:220, director:'Rajkumar Hirani',  description:'An alien questions religion and society in India.' },
  { id:40, title:'Dangal',                 genre:'Biographical',language:'Hindi',    duration:161, rating:'8.4', year:2016, ticketPrice:250, director:'Nitesh Tiwari',   description:'A father trains his daughters to become wrestling champions.' },

  // SOUTH INDIAN BLOCKBUSTERS
  { id:41, title:'Baahubali: The Beginning', genre:'Action',    language:'Telugu',   duration:159, rating:'8.0', year:2015, ticketPrice:250, director:'S.S. Rajamouli', description:'A young man discovers his true heritage in a mythical kingdom.' },
  { id:42, title:'Baahubali 2: The Conclusion', genre:'Action', language:'Telugu',   duration:167, rating:'8.2', year:2017, ticketPrice:250, director:'S.S. Rajamouli', description:'Why did Kattappa kill Baahubali? The epic conclusion.' },
  { id:43, title:'Enthiran',               genre:'Sci-Fi',      language:'Tamil',    duration:177, rating:'7.0', year:2010, ticketPrice:220, director:'Shankar',         description:'A robot falls in love and his creator must face the consequences.' },
  { id:44, title:'2.0',                    genre:'Sci-Fi',      language:'Tamil',    duration:148, rating:'6.7', year:2018, ticketPrice:250, director:'Shankar',         description:'The villain Chitti returns to face a deadly new threat.' },
  { id:45, title:'Jailer',                 genre:'Action',      language:'Tamil',    duration:168, rating:'7.0', year:2023, ticketPrice:280, director:'Nelson Dilipkumar', description:'A retired jailer hunts down his son\'s killer.' },
  { id:46, title:'Varisu',                 genre:'Drama',       language:'Tamil',    duration:170, rating:'6.5', year:2023, ticketPrice:250, director:'Vamshi Paidipally', description:'A carefree man takes over his father\'s empire.' },
  { id:47, title:'Ponniyin Selvan: Part I', genre:'Historical', language:'Tamil',    duration:167, rating:'7.9', year:2022, ticketPrice:280, director:'Mani Ratnam',     description:'A royal spy travels across the Chola kingdom on a secret mission.' },
  
  { id:49, title:'Dasara',                 genre:'Action',      language:'Telugu',   duration:177, rating:'7.2', year:2023, ticketPrice:250, director:'Srikanth Odela',  description:'A coal miner rises amidst treachery and violence.' },
  

  // MORE HINDI FILMS
  { id:51, title:'Brahmastra: Part One',   genre:'Fantasy',     language:'Hindi',    duration:167, rating:'5.8', year:2022, ticketPrice:300, director:'Ayan Mukerji',    description:'A young man discovers his connection to ancient weapons.' },
  { id:52, title:'Tiger Zinda Hai',        genre:'Action',      language:'Hindi',    duration:162, rating:'7.0', year:2017, ticketPrice:250, director:'Ali Abbas Zafar',  description:'Tiger undertakes a daring rescue mission across enemy lines.' },
  { id:53, title:'Tiger 3',               genre:'Action',      language:'Hindi',    duration:146, rating:'6.5', year:2023, ticketPrice:280, director:'Maneesh Sharma',   description:'India\'s most lethal spy faces a rogue agent.' },
  { id:54, title:'Mission Impossible: Dead Reckoning', genre:'Action', language:'Hindi', duration:163, rating:'7.7', year:2023, ticketPrice:300, director:'Christopher McQuarrie', description:'Ethan Hunt races to find a terrifying weapon.' },
  { id:55, title:'Tu Jhoothi Main Makkaar', genre:'Romance',    language:'Hindi',    duration:159, rating:'6.3', year:2023, ticketPrice:220, director:'Luv Ranjan',      description:'A professional breakup expert falls for the wrong woman.' },
  { id:56, title:'Rocky Aur Rani Kii Prem Kahaani', genre:'Romance', language:'Hindi', duration:168, rating:'6.8', year:2023, ticketPrice:250, director:'Karan Johar',  description:'Two very different families and a love story that transcends them.' },
  { id:57, title:'Bawaal',                 genre:'Drama',       language:'Hindi',    duration:149, rating:'6.0', year:2023, ticketPrice:220, director:'Nitesh Tiwari',   description:'A couple\'s journey through Europe reveals their toxic relationship.' },
  { id:58, title:'Fukrey 3',              genre:'Comedy',      language:'Hindi',    duration:148, rating:'6.5', year:2023, ticketPrice:200, director:'Mrighdeep Singh Lamba', description:'The Fukrey gang returns for another wild adventure.' },
  { id:59, title:'OMG 2',                  genre:'Drama',       language:'Hindi',    duration:148, rating:'7.8', year:2023, ticketPrice:220, director:'Amit Rai',        description:'A father fights for sex education to be taught in schools.' },
  { id:60, title:'Gadar 2',               genre:'Action',      language:'Hindi',    duration:170, rating:'7.4', year:2023, ticketPrice:250, director:'Anil Sharma',     description:'Tara Singh returns to Pakistan to rescue his son.' },

  // BOLLYWOOD CLASSICS
  { id:61, title:'Lagaan',                 genre:'Historical',  language:'Hindi',    duration:224, rating:'8.1', year:2001, ticketPrice:200, director:'Ashutosh Gowariker', description:'Villagers bet on a cricket match against British rulers.' },
  { id:62, title:'Rang De Basanti',        genre:'Drama',       language:'Hindi',    duration:157, rating:'8.2', year:2006, ticketPrice:200, director:'Rakeysh Omprakash Mehra', description:'Students recreate the lives of freedom fighters.' },
  { id:63, title:'Black',                  genre:'Drama',       language:'Hindi',    duration:122, rating:'8.2', year:2005, ticketPrice:200, director:'Sanjay Leela Bhansali', description:'A deaf-blind girl and her unconventional teacher.' },
  { id:64, title:'Queen',                  genre:'Drama',       language:'Hindi',    duration:146, rating:'8.2', year:2014, ticketPrice:200, director:'Vikas Bahl',      description:'A woman travels to Europe alone on her honeymoon after being jilted.' },
  { id:66, title:'Dev.D',                  genre:'Drama',       language:'Hindi',    duration:144, rating:'7.9', year:2009, ticketPrice:200, director:'Anurag Kashyap',  description:'A modern retelling of Devdas.' },
  { id:67, title:'Gangs of Wasseypur',     genre:'Crime',       language:'Hindi',    duration:321, rating:'8.3', year:2012, ticketPrice:250, director:'Anurag Kashyap',  description:'An epic crime saga spanning decades in Dhanbad.' },
  { id:68, title:'Kapoor & Sons',          genre:'Drama',       language:'Hindi',    duration:132, rating:'7.8', year:2016, ticketPrice:220, director:'Shakun Batra',    description:'A family reunites after years and old wounds resurface.' },
  { id:69, title:'Udaan',                  genre:'Drama',       language:'Hindi',    duration:134, rating:'8.2', year:2010, ticketPrice:200, director:'Vikramaditya Motwane', description:'A teenager returns home after being expelled from school.' },
  { id:70, title:'Masaan',                 genre:'Drama',       language:'Hindi',    duration:109, rating:'8.2', year:2015, ticketPrice:200, director:'Neeraj Ghaywan',  description:'Two stories of love and loss on the banks of the Ganges.' },

  // MORE SOUTH
  { id:71, title:'Maharaja',               genre:'Action',      language:'Tamil',    duration:158, rating:'8.3', year:2024, ticketPrice:280, director:'Nithilan Swaminathan', description:'A barber turns into a one-man army to protect what matters most.' },
  { id:72, title:'GOAT',                   genre:'Action',      language:'Tamil',    duration:168, rating:'6.5', year:2024, ticketPrice:280, director:'Venkat Prabhu',   description:'A special forces officer takes on a mission to protect his son.' },
  { id:73, title:'Devara: Part 1',         genre:'Action',      language:'Telugu',   duration:176, rating:'6.8', year:2024, ticketPrice:280, director:'Koratala Siva',   description:'A feared sea warrior and his legacy.' },
  { id:74, title:'Singham Returns',        genre:'Action',      language:'Hindi',    duration:146, rating:'7.0', year:2014, ticketPrice:220, director:'Rohit Shetty',    description:'The super cop returns to fight a bigger menace.' },
  { id:75, title:'Sooryavanshi',           genre:'Action',      language:'Hindi',    duration:145, rating:'6.6', year:2021, ticketPrice:250, director:'Rohit Shetty',    description:'The ATS chief takes on a deadly terrorist plot.' },
  { id:76, title:'Simmba',                 genre:'Action',      language:'Hindi',    duration:159, rating:'7.1', year:2018, ticketPrice:220, director:'Rohit Shetty',    description:'A corrupt cop becomes an honest officer after tragedy.' },
  { id:77, title:'Uri: The Surgical Strike', genre:'Action',   language:'Hindi',    duration:138, rating:'8.4', year:2019, ticketPrice:220, director:'Aditya Dhar',    description:'India\'s surgical strike on Pakistan-occupied Kashmir.' },
  { id:78, title:'Shershaah',              genre:'Biographical',language:'Hindi',    duration:135, rating:'8.5', year:2021, ticketPrice:250, director:'Vishnuvardhan',   description:'The story of Captain Vikram Batra, a Kargil War hero.' },
  { id:79, title:'Kesari',                 genre:'Historical',  language:'Hindi',    duration:150, rating:'7.9', year:2019, ticketPrice:220, director:'Anurag Singh',    description:'21 Sikh soldiers vs 10,000 Afghan warriors.' },
  { id:80, title:'Sardar Udham',           genre:'Historical',  language:'Hindi',    duration:152, rating:'8.3', year:2021, ticketPrice:250, director:'Shoojit Sircar',  description:'The story of revolutionary Sardar Udham Singh.' },

  // HORROR & MORE
  { id:81, title:'Bhool Bhulaiyaa 2',     genre:'Horror',      language:'Hindi',    duration:143, rating:'7.5', year:2022, ticketPrice:220, director:'Anees Bazmee',    description:'A young man pretends to be a ghost expert and stirs chaos.' },
  { id:82, title:'Bhool Bhulaiyaa 3',     genre:'Horror',      language:'Hindi',    duration:151, rating:'7.2', year:2024, ticketPrice:250, director:'Anees Bazmee',    description:'Rooh Baba returns to battle a new supernatural threat.' },
  { id:83, title:'Stree',                  genre:'Horror',      language:'Hindi',    duration:130, rating:'7.7', year:2018, ticketPrice:200, director:'Amar Kaushik',    description:'A small town is haunted by a female spirit.' },
  { id:84, title:'Stree 2',               genre:'Horror',      language:'Hindi',    duration:137, rating:'8.5', year:2024, ticketPrice:280, director:'Amar Kaushik',    description:'Stree returns to protect the town she once haunted.' },
  { id:85, title:'Tumbbad',               genre:'Horror',      language:'Hindi',    duration:104, rating:'8.2', year:2018, ticketPrice:200, director:'Rahi Anil Barve',  description:'A man descends into greed to find the gold of a forgotten god.' },
  { id:86, title:'Munjya',                genre:'Horror',      language:'Hindi',    duration:119, rating:'7.5', year:2024, ticketPrice:220, director:'Aditya Sarpotdar', description:'An ancient spirit falls obsessively in love.' },
  { id:87, title:'Merry Christmas',        genre:'Thriller',    language:'Hindi',    duration:130, rating:'7.5', year:2024, ticketPrice:220, director:'Sriram Raghavan', description:'A chance meeting on Christmas Eve leads to murder.' },
  { id:88, title:'Yodha',                  genre:'Action',      language:'Hindi',    duration:115, rating:'6.5', year:2024, ticketPrice:220, director:'Sagar Ambre',     description:'An elite soldier must save a hijacked plane.' },
  { id:89, title:'Bade Miyan Chote Miyan', genre:'Action',     language:'Hindi',    duration:155, rating:'5.5', year:2024, ticketPrice:250, director:'Ali Abbas Zafar',  description:'Two mismatched soldiers take on a massive national threat.' },
  { id:90, title:'Maidaan',               genre:'Biographical',language:'Hindi',    duration:155, rating:'8.2', year:2024, ticketPrice:250, director:'Amit Ravindernath Sharma', description:'The golden era of Indian football.' },

  // REGIONAL
  { id:91,  title:'Kantara',              genre:'Action',      language:'Kannada',  duration:149, rating:'8.5', year:2022, ticketPrice:280, director:'Rishab Shetty',  description:'A forest tribal warrior battles for his community\'s land.' },
  { id:92,  title:'777 Charlie',          genre:'Drama',       language:'Kannada',  duration:167, rating:'8.7', year:2022, ticketPrice:250, director:'Kiranraj K',     description:'A lonely man and a stray dog transform each other\'s lives.' },
  { id:93,  title:'Mili',                 genre:'Thriller',    language:'Hindi',    duration:116, rating:'7.2', year:2022, ticketPrice:200, director:'Mathukutty Xavier', description:'A girl gets trapped in a freezer and battles hypothermia.' },
  { id:94,  title:'Adipurush',            genre:'Fantasy',     language:'Hindi',    duration:140, rating:'4.5', year:2023, ticketPrice:200, director:'Om Raut',        description:'A retelling of the Ramayana.' },
  { id:95,  title:'Jubilee',              genre:'Drama',       language:'Hindi',    duration:480, rating:'8.4', year:2023, ticketPrice:200, director:'Vikramaditya Motwane', description:'The golden age of Bollywood in the 1940s-50s.' },
  { id:96,  title:'Zwigato',              genre:'Drama',       language:'Hindi',    duration:109, rating:'7.7', year:2023, ticketPrice:200, director:'Nandita Das',    description:'A middle-aged man becomes a gig delivery worker.' },
  { id:97,  title:'Farrey',               genre:'Thriller',    language:'Hindi',    duration:113, rating:'7.0', year:2023, ticketPrice:200, director:'Soumendra Padhi', description:'A student gets entangled in a high-stakes cheating scheme.' },
  { id:98,  title:'Ganapath',             genre:'Action',      language:'Hindi',    duration:120, rating:'5.5', year:2023, ticketPrice:220, director:'Vikas Bahl',     description:'A street fighter battles a dystopian system.' },
  { id:99,  title:'Maharaj',              genre:'Historical',  language:'Hindi',    duration:131, rating:'7.5', year:2024, ticketPrice:250, director:'Siddharth P. Malhotra', description:'A journalist battles to expose a religious fraud.' },
  { id:100, title:'Do Aur Do Pyaar',      genre:'Romance',     language:'Hindi',    duration:127, rating:'7.5', year:2024, ticketPrice:220, director:'Shirsha Guha Thakurta', description:'Two couples in complicated relationships meet on a trip.' },

  // BONUS
  { id:101, title:'Fighter',              genre:'Action',      language:'Hindi',    duration:166, rating:'7.4', year:2024, ticketPrice:280, director:'Siddharth Anand', description:'India\'s air force takes on a new breed of terrorist.' },
  { id:102, title:'Crew',                 genre:'Comedy',      language:'Hindi',    duration:130, rating:'7.2', year:2024, ticketPrice:250, director:'Rajesh A. Krishnan', description:'Three broke flight attendants turn to smuggling.' },
  
  { id:104, title:'Amar Singh Chamkila', genre:'Biographical',language:'Hindi',    duration:156, rating:'7.8', year:2024, ticketPrice:250, director:'Imtiaz Ali',     description:'The rise and fall of Punjab\'s most popular singer.' },
  { id:105, title:'Do Patti',             genre:'Thriller',    language:'Hindi',    duration:132, rating:'7.0', year:2024, ticketPrice:220, director:'Shashanka Chaudhary', description:'Twin sisters share dark secrets.' },
  { id:106, title:'Singham Again',        genre:'Action',      language:'Hindi',    duration:164, rating:'6.8', year:2024, ticketPrice:280, director:'Rohit Shetty',   description:'The biggest cop universe crossover.' },
  { id:108, title:'Lucky Baskhar',        genre:'Crime',       language:'Telugu',   duration:143, rating:'8.0', year:2024, ticketPrice:280, director:'Venky Atluri',   description:'A bank employee becomes a criminal mastermind.' },
  { id:109, title:'Saripodhaa Sanivaaram', genre:'Action',     language:'Telugu',   duration:148, rating:'7.5', year:2024, ticketPrice:280, director:'Vivek Athreya',  description:'A man takes revenge every Saturday.' },
  { id:110, title:'Meiyazhagan',          genre:'Drama',       language:'Tamil',    duration:148, rating:'8.5', year:2024, ticketPrice:250, director:'Selvaraghavan',   description:'A man reunites with his childhood friend in unexpected ways.' },

  // KANNADA BLOCKBUSTERS
  
  
  { id:113, title:'Ulidavaru Kandanthe',             genre:'Thriller',   language:'Kannada', duration:139, rating:'8.4', year:2014, ticketPrice:200, director:'Rakshit Shetty', description:'A journalist unravels a coastal crime story through multiple perspectives.' },
  { id:115, title:'Kirik Party',                     genre:'Comedy',     language:'Kannada', duration:148, rating:'8.0', year:2016, ticketPrice:200, director:'Rishab Shetty',  description:'A college rowdy reforms himself for love in this coming-of-age comedy.' },
  { id:116, title:'Lucia',                           genre:'Thriller',   language:'Kannada', duration:126, rating:'8.3', year:2013, ticketPrice:180, director:'Pawan Kumar',    description:'A theatre usher\'s dreams and reality begin to blur dangerously.' },
  { id:117, title:'U Turn',                          genre:'Thriller',   language:'Kannada', duration:127, rating:'7.9', year:2016, ticketPrice:200, director:'Pawan Kumar',    description:'A journalist investigates mysterious deaths on a flyover.' },
  { id:119, title:'Garuda Gamana Vrishabha Vahana',  genre:'Action',     language:'Kannada', duration:155, rating:'8.4', year:2021, ticketPrice:220, director:'Raj B Shetty',   description:'Two friends on opposite sides of law — a saga of blood and brotherhood.' },
  { id:120, title:'Dia',                             genre:'Romance',    language:'Kannada', duration:140, rating:'8.1', year:2020, ticketPrice:200, director:'K.S. Ashoka',    description:'A beautiful love triangle that spans decades with stunning emotion.' },
  { id:121, title:'Tagaru',                          genre:'Action',     language:'Kannada', duration:160, rating:'7.8', year:2018, ticketPrice:220, director:'Duniya Soori',   description:'A fierce cop versus a dreaded gangster in Bengaluru\'s underworld.' },
  { id:122, title:'Avane Srimannarayana',            genre:'Action',     language:'Kannada', duration:159, rating:'7.6', year:2019, ticketPrice:220, director:'Sachin Ravi',    description:'A quirky cop hunts for a lost idol in a remote village full of comedy and action.' },
  { id:123, title:'Vikrant Rona',                    genre:'Fantasy',    language:'Kannada', duration:167, rating:'6.8', year:2022, ticketPrice:280, director:'Anup Bhandari',  description:'A cop arrives at a mysterious village where a monster is believed to roam.' },
  { id:126, title:'Mungaru Male',                    genre:'Romance',    language:'Kannada', duration:165, rating:'7.9', year:2006, ticketPrice:180, director:'Phani Ramachandra', description:'A record-breaking romantic blockbuster that defined a generation.' },
  { id:128, title:'Kavaludaari',                     genre:'Thriller',   language:'Kannada', duration:131, rating:'8.1', year:2019, ticketPrice:200, director:'Hemanth M. Rao', description:'Two cops from different eras solve the same mysterious murder case.' },
  { id:130, title:'Simple Agi Ondh Love Story',      genre:'Romance',    language:'Kannada', duration:130, rating:'7.8', year:2012, ticketPrice:180, director:'Suni',           description:'A sweet and relatable love story between two contrasting personalities.' },
  { id:131, title:'Kotigobba 3',                     genre:'Action',     language:'Kannada', duration:148, rating:'6.8', year:2021, ticketPrice:220, director:'Shiva Karthik',  description:'A double-role action entertainer with mass appeal.' },
  { id:132, title:'Yuvarathnaa',                     genre:'Action',     language:'Kannada', duration:155, rating:'7.2', year:2021, ticketPrice:220, director:'Santhosh Ananddram', description:'A college action drama with a strong message about education and politics.' },

  // MORE KANNADA GEMS
  { id:134, title:'Nathicharami',                    genre:'Drama',      language:'Kannada', duration:108, rating:'8.0', year:2018, ticketPrice:180, director:'Mansore',        description:'A middle-aged widow rediscovers desire and identity in contemporary Bengaluru.' },
  { id:135, title:'Rangitaranga',                    genre:'Thriller',   language:'Kannada', duration:150, rating:'7.8', year:2015, ticketPrice:200, director:'Anup Bhandari',  description:'A musician arrives at a mysterious village haunted by a supernatural presence.' },
  { id:138, title:'Myna',                            genre:'Drama',      language:'Kannada', duration:130, rating:'7.6', year:2012, ticketPrice:180, director:'Rajendra Singh Babu', description:'A touching story of love between childhood sweethearts set against the backdrop of a village.' },
  { id:140, title:'Bell Bottom',                     genre:'Thriller',   language:'Kannada', duration:136, rating:'8.0', year:2019, ticketPrice:200, director:'Jayatheertha',   description:'A detective investigates a series of mysterious child abductions in 1980s Karnataka.' },
  { id:142, title:'Bazaar',                          genre:'Crime',      language:'Kannada', duration:148, rating:'7.6', year:2024, ticketPrice:220, director:'Chethan Kumar',   description:'A gripping crime drama about the dark underbelly of the real-estate world in Bengaluru.' },
];

// =============================================
// POSTER SYSTEM
// Strategy: Use OMDB API dynamically in-browser.
// OMDB is free, CORS-open, and returns real poster URLs.
// We store correct search titles for each movie.
// =============================================

const OMDB_KEY = 'trilogy'; // free demo key, enough for this use

// Exact OMDB-searchable titles + year for all 142 movies
const POSTER_META = {
  1:  { t:'Dhurandhar',                               y:2025 },
  2:  { t:'K.G.F: Chapter 2',                         y:2022 },
  3:  { t:'RRR',                                      y:2022 },
  4:  { t:'Pathaan',                                  y:2023 },
  5:  { t:'Jawan',                                    y:2023 },
  6:  { t:'Animal',                                   y:2023 },
  7:  { t:'War',                                      y:2019 },
  8:  { t:'Kalki 2898 AD',                            y:2024 },
  9:  { t:'Pushpa: The Rise',                         y:2021 },
  
  12: { t:'Article 370',                              y:2024 },
  13: { t:'Sam Bahadur',                              y:2023 },
  14: { t:'12th Fail',                                y:2023 },
  15: { t:'Talaash',                                  y:2012 },
  16: { t:'Andhadhun',                                y:2018 },
  17: { t:'Badla',                                    y:2019 },
  18: { t:'Kahaani',                                  y:2012 },
  19: { t:'Vikram',                                   y:2022 },
  20: { t:'Leo',                                      y:2023 },
  21: { t:'The Kashmir Files',                        y:2022 },
  22: { t:'Gangubai Kathiawadi',                      y:2022 },
  23: { t:'Rocketry: The Nambi Effect',               y:2022 },
  24: { t:'Swades',                                   y:2004 },
  25: { t:'Mughal-E-Azam',                            y:1960 },
  26: { t:'Sholay',                                   y:1975 },
  27: { t:'Dil Chahta Hai',                           y:2001 },
  28: { t:'Zindagi Na Milegi Dobara',                 y:2011 },
  29: { t:'Taare Zameen Par',                         y:2007 },
  30: { t:'3 Idiots',                                 y:2009 },
  31: { t:'Dilwale Dulhania Le Jayenge',              y:1995 },
  32: { t:'Kabir Singh',                              y:2019 },
  33: { t:'Kal Ho Naa Ho',                            y:2003 },
  34: { t:'Ae Dil Hai Mushkil',                       y:2016 },
  35: { t:'Jab We Met',                               y:2007 },
  36: { t:'Tamasha',                                  y:2015 },
  37: { t:'Rockstar',                                 y:2011 },
  38: { t:'Bajrangi Bhaijaan',                        y:2015 },
  39: { t:'PK',                                       y:2014 },
  40: { t:'Dangal',                                   y:2016 },
  41: { t:'Baahubali: The Beginning',                 y:2015 },
  42: { t:'Baahubali 2: The Conclusion',              y:2017 },
  43: { t:'Enthiran',                                 y:2010 },
  44: { t:'2.0',                                      y:2018 },
  45: { t:'Jailer',                                   y:2023 },
  46: { t:'Varisu',                                   y:2023 },
  47: { t:'Ponniyin Selvan: Part I',                  y:2022 },
 
  49: { t:'Dasara',                                   y:2023 },

  51: { t:'Brahmastra Part One: Shiva',               y:2022 },
  52: { t:'Tiger Zinda Hai',                          y:2017 },
  53: { t:'Tiger 3',                                  y:2023 },
  54: { t:'Mission: Impossible Dead Reckoning Part One', y:2023 },
  55: { t:'Tu Jhoothi Main Makkaar',                  y:2023 },
  56: { t:'Rocky Aur Rani Kii Prem Kahaani',          y:2023 },
  57: { t:'Bawaal',                                   y:2023 },
  58: { t:'Fukrey 3',                                 y:2023 },
  59: { t:'OMG 2',                                    y:2023 },
  60: { t:'Gadar 2',                                  y:2023 },
  61: { t:'Lagaan',                                   y:2001 },
  62: { t:'Rang De Basanti',                          y:2006 },
  63: { t:'Black',                                    y:2005 },
  64: { t:'Queen',                                    y:2014 },
  66: { t:'Dev.D',                                    y:2009 },
  67: { t:'Gangs of Wasseypur',                       y:2012 },
  68: { t:'Kapoor & Sons',                            y:2016 },
  69: { t:'Udaan',                                    y:2010 },
  70: { t:'Masaan',                                   y:2015 },
  71: { t:'Maharaja',                                 y:2024 },
  72: { t:'GOAT',                                     y:2024 },
  73: { t:'Devara: Part 1',                           y:2024 },
  74: { t:'Singham Returns',                          y:2014 },
  75: { t:'Sooryavanshi',                             y:2021 },
  76: { t:'Simmba',                                   y:2018 },
  77: { t:'Uri: The Surgical Strike',                 y:2019 },
  78: { t:'Shershaah',                                y:2021 },
  79: { t:'Kesari',                                   y:2019 },
  80: { t:'Sardar Udham',                             y:2021 },
  81: { t:'Bhool Bhulaiyaa 2',                        y:2022 },
  82: { t:'Bhool Bhulaiyaa 3',                        y:2024 },
  83: { t:'Stree',                                    y:2018 },
  84: { t:'Stree 2',                                  y:2024 },
  85: { t:'Tumbbad',                                  y:2018 },
  86: { t:'Munjya',                                   y:2024 },
  87: { t:'Merry Christmas',                          y:2024 },
  88: { t:'Yodha',                                    y:2024 },
  89: { t:'Bade Miyan Chote Miyan',                   y:2024 },
  90: { t:'Maidaan',                                  y:2024 },
  91: { t:'Kantara',                                  y:2022 },
  92: { t:'777 Charlie',                              y:2022 },
  93: { t:'Mili',                                     y:2022 },
  94: { t:'Adipurush',                                y:2023 },
  95: { t:'Jubilee',                                  y:2023 },
  96: { t:'Zwigato',                                  y:2023 },
  97: { t:'Farrey',                                   y:2023 },
  98: { t:'Ganapath',                                 y:2023 },
  99: { t:'Maharaj',                                  y:2024 },
  100:{ t:'Do Aur Do Pyaar',                          y:2024 },
  101:{ t:'Fighter',                                  y:2024 },
  102:{ t:'Crew',                                     y:2024 },
  
  104:{ t:'Amar Singh Chamkila',                      y:2024 },
  105:{ t:'Do Patti',                                 y:2024 },
  106:{ t:'Singham Again',                            y:2024 },
  108:{ t:'Lucky Baskhar',                            y:2024 },
  109:{ t:'Saripodhaa Sanivaaram',                    y:2024 },
  110:{ t:'Meiyazhagan',                              y:2024 },
  113:{ t:'Ulidavaru Kandanthe',                      y:2014 },
  115:{ t:'Kirik Party',                              y:2016 },
  116:{ t:'Lucia',                                    y:2013 },
  117:{ t:'U Turn',                                   y:2016 },
  119:{ t:'Garuda Gamana Vrishabha Vahana',           y:2021 },
  120:{ t:'Dia',                                      y:2020 },
  121:{ t:'Tagaru',                                   y:2018 },
  122:{ t:'Avane Srimannarayana',                     y:2019 },
  123:{ t:'Vikrant Rona',                             y:2022 },

  126:{ t:'Mungaru Male',                             y:2006 },
  128:{ t:'Kavaludaari',                              y:2019 },

  130:{ t:'Simple Agi Ondh Love Story',               y:2012 },
  131:{ t:'Kotigobba 3',                              y:2021 },
  132:{ t:'Yuvarathnaa',                              y:2021 },

  134:{ t:'Nathicharami',                             y:2018 },
  135:{ t:'Rangitaranga',                             y:2015 },
  136:{ t:'Birbal My Birbal',                         y:2023 },

  138:{ t:'Myna',                                     y:2012 },
  140:{ t:'Bell Bottom',                              y:2019 },
  142:{ t:'Bazaar',                                   y:2024 },
};

// In-memory poster cache so we never fetch the same movie twice
const posterCache = {};

// ── Hardcoded direct poster URLs (Amazon/IMDB CDN) ─────────────────────────
// These are reliable for all requested + key movies. OMDB is fallback only.
const DIRECT_POSTERS = {
  // Requested movies
  29: 'https://m.media-amazon.com/images/M/MV5BNTk0NTYzNjQtODc5My00NzliLWJjNWQtMTM3NjI1MDY1ZTczXkEyXkFqcGc@._V1_SX300.jpg',  // Taare Zameen Par
  48: 'https://m.media-amazon.com/images/M/MV5BZjJkNjY0YmMtOWQyNS00MjRjLWE0ZDQtNjcyZTY3ZjkwZjJiXkEyXkFqcGc@._V1_SX300.jpg',  // Ponniyin Selvan II
  50: 'https://m.media-amazon.com/images/M/MV5BOGFlYjQ0NjgtYTlmNy00MjllLTkxYjEtZjZmNmM5NTUxZGE0XkEyXkFqcGc@._V1_SX300.jpg',  // Salaar Part 1
  65: 'https://m.media-amazon.com/images/M/MV5BZjM5ZjI2MjEtMWFlZi00MDYxLWJiNzMtY2Y5MmY3MzFkNTkyXkEyXkFqcGc@._V1_SX300.jpg',  // Lootera
  96: 'https://m.media-amazon.com/images/M/MV5BZDc1ZDM5OTYtY2Q3YS00YzQ3LThkMGYtZmVkNzY0NGQwMWNkXkEyXkFqcGc@._V1_SX300.jpg',  // Zwigato
  103:'https://m.media-amazon.com/images/M/MV5BYzk2NDYxNjktMjFiZC00MDU0LTkxN2MtNTY5YWU2MmI0ZjZjXkEyXkFqcGc@._V1_SX300.jpg', // Laapataa Ladies
  107:'https://m.media-amazon.com/images/M/MV5BOGQ2ZTJkMzctZDBkOS00NWNhLWI1YTItYjQzNGI2NTFiYWI3XkEyXkFqcGc@._V1_SX300.jpg', // Bhagapath
  // Kannada films
  2:  'https://m.media-amazon.com/images/M/MV5BZWZhMjhhZmYtOGUxNy00NGUyLWJiNDMtZTBjYjM2ZTg5ZjM1XkEyXkFqcGc@._V1_SX300.jpg',  // KGF Chapter 2
  91: 'https://m.media-amazon.com/images/M/MV5BZDk4NDZhNzQtN2IyNy00MDg0LWJjNzMtNTZmNjhkMjRmNjM2XkEyXkFqcGc@._V1_SX300.jpg',  // Kantara
  92: 'https://m.media-amazon.com/images/M/MV5BNGI3ZWJiMmYtNzc0ZC00NTcxLTgyYjYtYzMwMjQ0NmI0NGVkXkEyXkFqcGc@._V1_SX300.jpg',  // 777 Charlie
  111:'https://m.media-amazon.com/images/M/MV5BOWJiNzI2ZWMtMmNkNi00YTE3LThhOGUtMWE3MzMwNzBjOGNlXkEyXkFqcGc@._V1_SX300.jpg', // Sapta Sagaradache Side A
  112:'https://m.media-amazon.com/images/M/MV5BYTVmYjVkYWEtOGRmZS00MzAzLTk4YWItMmJiNDViNDA1OTM0XkEyXkFqcGc@._V1_SX300.jpg', // Sapta Sagaradache Side B
  113:'https://m.media-amazon.com/images/M/MV5BNjk5ZjYzNjAtYWEwNS00NWFiLWExNmYtY2E3ZjQyMjAzNDQ2XkEyXkFqcGc@._V1_SX300.jpg', // Ulidavaru Kandanthe
  114:'https://m.media-amazon.com/images/M/MV5BODM3OTljMjYtNjE0Ni00ZDY1LTkxODktNzg5NzZlN2JlZDZiXkEyXkFqcGc@._V1_SX300.jpg', // Godhi Banna
  115:'https://m.media-amazon.com/images/M/MV5BMjM1OWZmNjktMTBjMi00ZjVkLWE3ZWMtYTBmMjUwNGM3NTZiXkEyXkFqcGc@._V1_SX300.jpg', // Kirik Party
  116:'https://m.media-amazon.com/images/M/MV5BZTI4NWYxNDUtNjQzZi00OGZiLWI1MmMtYzU3NjhiZGFiNGY3XkEyXkFqcGc@._V1_SX300.jpg', // Lucia
  119:'https://m.media-amazon.com/images/M/MV5BYmI4YTZlMDYtNTg4Yy00NzZhLThiY2QtNzYxNzI0ZjVkZGFiXkEyXkFqcGc@._V1_SX300.jpg', // Garuda Gamana
  120:'https://m.media-amazon.com/images/M/MV5BZWRkN2RiMTQtMjk3Yy00YjBhLWI1ZDMtZDM2YjBmNmEwNTE5XkEyXkFqcGc@._V1_SX300.jpg', // Dia
  121:'https://m.media-amazon.com/images/M/MV5BNGQwNzMxYjQtNzY5YS00NjdiLTliNTctOTlhYTIyN2E1YWZkXkEyXkFqcGc@._V1_SX300.jpg', // Tagaru
  126:'https://m.media-amazon.com/images/M/MV5BYTg2NTZmMWYtZjZlNC00NDczLTgzZmItMzM3NzExMmY1NDA2XkEyXkFqcGc@._V1_SX300.jpg', // Mungaru Male
  128:'https://m.media-amazon.com/images/M/MV5BZTYxN2VkNzgtYzJkOS00NGM4LWI5YTQtMzU4MjgwNGNkYzViXkEyXkFqcGc@._V1_SX300.jpg', // Kavaludaari
  // Other top films
  3:  'https://m.media-amazon.com/images/M/MV5BOGEzYzcxYjAtNzI3ZS00NDQxLWIzMDQtNjZiNzFlNDUzZDJiXkEyXkFqcGc@._V1_SX300.jpg',  // RRR
  1:  'https://m.media-amazon.com/images/M/MV5BOTkxMjYyNjItOGI1Ny00ZGNmLWJiMGUtNTRlMTU3MWI2OGViXkEyXkFqcGc@._V1_SX300.jpg',  // Dhurandhar
  4:  'https://m.media-amazon.com/images/M/MV5BNTliYjdmYzctNGRhNy00NzgyLWE4NWQtNGM5NDgzNmQ3ZmUzXkEyXkFqcGc@._V1_SX300.jpg',  // Pathaan
  5:  'https://m.media-amazon.com/images/M/MV5BNWIzZTI1ODUtYTM0ZS00NTgxLTk1ODMtZjQyOGNhZDYyNzNhXkEyXkFqcGc@._V1_SX300.jpg',  // Jawan
  6:  'https://m.media-amazon.com/images/M/MV5BNjRlZmM0ODktY2RjNy00ZTdiLWIwMjYtZTk2MzJiNDMzMTU0XkEyXkFqcGc@._V1_SX300.jpg',  // Animal

  40: 'https://m.media-amazon.com/images/M/MV5BMjQ2NjMzMjkwMl5BMl5BanBnXkFtZTgwNDExNjk1OTE@._V1_SX300.jpg',                  // Dangal
  41: 'https://m.media-amazon.com/images/M/MV5BNjgwNzAzNjk1Nl5BMl5BanBnXkFtZTgwOTg2MTY0NTE@._V1_SX300.jpg',                  // Baahubali 1
  42: 'https://m.media-amazon.com/images/M/MV5BNGMwNzQ2NTAtNGU0YS00ODkzLWI3NTQtMTA5ZmVmZTk2ZmNhXkEyXkFqcGc@._V1_SX300.jpg',  // Baahubali 2
  77: 'https://m.media-amazon.com/images/M/MV5BMjQ4NjEzNzktZjI1NC00ZjJlLWJhZGMtMWMzNTI1NWE5ZWVlXkEyXkFqcGc@._V1_SX300.jpg',  // Uri
  78: 'https://m.media-amazon.com/images/M/MV5BMjFlNTI3OTUtZmRhNS00YjU5LWJkNTQtMzExYTEzNDhiNzdjXkEyXkFqcGc@._V1_SX300.jpg',  // Shershaah
  30: 'https://m.media-amazon.com/images/M/MV5BNTAwMzg4MzkzNF5BMl5BanBnXkFtZTcwMjU1NzQyMg@@._V1_SX300.jpg',                   // 3 Idiots
  39: 'https://m.media-amazon.com/images/M/MV5BMTYzOTE2NjkxN15BMl5BanBnXkFtZTgwMDgzMTg0MzE@._V1_SX300.jpg',                   // PK
  84: 'https://m.media-amazon.com/images/M/MV5BOTJmYWM4ZTMtNjU5My00ZjI0LWI4MmMtNTBhOTkwMGM0NTVkXkEyXkFqcGc@._V1_SX300.jpg',  // Stree 2
  83: 'https://m.media-amazon.com/images/M/MV5BZTJiNWRlYWItNGQyYy00MTM2LWI2MGYtZjQxM2JlM2NhYTYwXkEyXkFqcGc@._V1_SX300.jpg',  // Stree
  85: 'https://m.media-amazon.com/images/M/MV5BNzYxNjM1OTAtNjYwMy00M2ZiLTk3YzctNzNhMGRkYmZhMGFkXkEyXkFqcGc@._V1_SX300.jpg',  // Tumbbad
  22: 'https://m.media-amazon.com/images/M/MV5BM2U5MzI1ZTQtYWZlNy00MmU4LTkzYmYtYjNiMTRlNDM3YTE5XkEyXkFqcGc@._V1_SX300.jpg',  // Gangubai
  9:  'https://m.media-amazon.com/images/M/MV5BNDgxNzMwMzItZjI4ZS00OTk0LTg1OTctOTY2ZWI2NzVhZTMzXkEyXkFqcGc@._V1_SX300.jpg',  // Pushpa Rise
  14: 'https://m.media-amazon.com/images/M/MV5BNjQ2MTQ2NjA2Ml5BMl5BanBnXkFtZTcwNDYzMzY5Mg@@._V1_SX300.jpg',                  // 12th Fail

};

// Load poster: hardcoded URL first → OMDB fallback → placeholder
async function loadPoster(imgEl, movieId) {
  if (!movieId) return showPlaceholder(imgEl);
  const cacheKey = String(movieId);
  // Return cached result immediately
  if (posterCache[cacheKey]) {
    if (posterCache[cacheKey] === 'N/A') { showPlaceholder(imgEl); return; }
    imgEl.src = posterCache[cacheKey];
    imgEl.style.display = 'block';
    if (imgEl.nextElementSibling) imgEl.nextElementSibling.style.display = 'none';
    return;
  }
  // 1️⃣ Try hardcoded direct URL
  if (DIRECT_POSTERS[movieId]) {
    const directUrl = DIRECT_POSTERS[movieId];
    const testImg = new Image();
    testImg.onload = () => {
      posterCache[cacheKey] = directUrl;
      imgEl.src = directUrl;
      imgEl.style.display = 'block';
      if (imgEl.nextElementSibling) imgEl.nextElementSibling.style.display = 'none';
    };
    testImg.onerror = () => loadFromOMDB(imgEl, movieId, cacheKey);
    testImg.src = directUrl;
    return;
  }
  // 2️⃣ Fallback to OMDB for remaining movies
  loadFromOMDB(imgEl, movieId, cacheKey);
}

async function loadFromOMDB(imgEl, movieId, cacheKey) {
  if (!POSTER_META[movieId]) return showPlaceholder(imgEl);
  const { t, y } = POSTER_META[movieId];
  try {
    const url = `https://www.omdbapi.com/?t=${encodeURIComponent(t)}&y=${y}&apikey=${OMDB_KEY}`;
    const res  = await fetch(url);
    const data = await res.json();
    if (data.Poster && data.Poster !== 'N/A') {
      posterCache[cacheKey] = data.Poster;
      imgEl.src = data.Poster;
      imgEl.style.display = 'block';
      if (imgEl.nextElementSibling) imgEl.nextElementSibling.style.display = 'none';
      imgEl.onerror = () => showPlaceholder(imgEl);
    } else {
      const url2 = `https://www.omdbapi.com/?t=${encodeURIComponent(t)}&apikey=${OMDB_KEY}`;
      const res2  = await fetch(url2);
      const data2 = await res2.json();
      if (data2.Poster && data2.Poster !== 'N/A') {
        posterCache[cacheKey] = data2.Poster;
        imgEl.src = data2.Poster;
        imgEl.style.display = 'block';
        if (imgEl.nextElementSibling) imgEl.nextElementSibling.style.display = 'none';
        imgEl.onerror = () => showPlaceholder(imgEl);
      } else {
        posterCache[cacheKey] = 'N/A';
        showPlaceholder(imgEl);
      }
    }
  } catch(e) {
    showPlaceholder(imgEl);
  }
}

function showPlaceholder(imgEl) {
  imgEl.style.display = 'none';
  if (imgEl.nextElementSibling) imgEl.nextElementSibling.style.display = 'flex';
}

// Called from onerror on img tags
function handlePosterError(img, movieId, title, year) {
  img.onerror = null;
  loadPoster(img, movieId);
}

INDIAN_MOVIES.forEach((m) => {
  // All posters loaded dynamically via loadPoster() — no static URLs needed
  m.posterUrl = 'loading';
});


const DEMO_BOOKED_SEATS = ['A3','A4','B7','C1','C2','C3','D5','D6','E9','E10','F2','F3','G8','H1','H4','B2','C8','D3'];

const DEMO_BOOKINGS = [
  { movieTitle:'Dhurandhar', date:'2026-04-19', time:'09:30 PM', seats:['D4','D5'], total:700, bookingId:'CV00000001', userName:'Demo User', userEmail:'demo@cinevault.com' },
  { movieTitle:'KGF: Chapter 2', date:'2026-04-15', time:'06:30 PM', seats:['B3'], total:300, bookingId:'CV00000002', userName:'Demo User', userEmail:'demo@cinevault.com' },
];
