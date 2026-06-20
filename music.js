const tracks = [
  { title: "Midnight Drift",   artist: "Echo Collective", album: "Luminous · 2024",      duration: 214, colors: ["#1a0a2e","#6b21a8","#a855f7","#e879f9"] },
  { title: "Stellar Haze",     artist: "Neon Reverie",    album: "Orbits · 2024",        duration: 187, colors: ["#0f172a","#1e3a5f","#3b82f6","#93c5fd"] },
  { title: "Velvet Current",   artist: "Synthwave Club",  album: "Deep Blue · 2023",     duration: 231, colors: ["#052e16","#065f46","#10b981","#6ee7b7"] },
  { title: "Copper Rain",      artist: "The Dusk Pilots", album: "Horizons · 2023",      duration: 198, colors: ["#431407","#9a3412","#f97316","#fed7aa"] },
  { title: "Glass Arcade",     artist: "Echo Collective", album: "Luminous · 2024",      duration: 175, colors: ["#1e1b4b","#4338ca","#818cf8","#e0e7ff"] },
  { title: "Pale Meridian",    artist: "Ariel Drift",     album: "Somewhere · 2024",     duration: 243, colors: ["#0c0a09","#44403c","#a8a29e","#f5f5f4"] },
  { title: "Resonant Bloom",   artist: "Neon Reverie",    album: "Orbits · 2024",        duration: 209, colors: ["#4a044e","#a21caf","#e879f9","#fce7f3"] },
  { title: "Solar Anchor",     artist: "The Dusk Pilots", album: "Horizons · 2023",      duration: 221, colors: ["#422006","#854d0e","#eab308","#fef9c3"] },
];

let currentIndex = 0;
let isPlaying = false;
let shuffleOn = false;
let repeatOn = false;
let autoplayOn = true;
let isMuted = false;
let prevVolume = 75;
let currentTime = 0;
let timerInterval = null;

// Fake audio simulation
function fmtTime(s) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2,'0')}`;
}

// ─── Artwork Generator ───
function drawArtwork(canvas, colors, size) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = size || canvas.width;
  const h = size || canvas.height;
  canvas.width = w; canvas.height = h;
  
  // Background
  ctx.fillStyle = colors[0];
  ctx.fillRect(0, 0, w, h);
  
  // Shapes
  const seed = colors[1].charCodeAt(1) + colors[2].charCodeAt(2);
  const shapes = 7 + (seed % 6);
  for (let i = 0; i < shapes; i++) {
    const x = (((seed * (i+1) * 137) % w));
    const y = (((seed * (i+1) * 97) % h));
    const r = 20 + (seed * (i+3)) % (w * 0.55);
    const alpha = 0.08 + (i % 4) * 0.07;
    ctx.beginPath();
    if (i % 3 === 0) {
      ctx.arc(x, y, r, 0, Math.PI * 2);
    } else if (i % 3 === 1) {
      ctx.ellipse(x, y, r, r * 0.55, (i * 0.7), 0, Math.PI * 2);
    } else {
      const pts = 3 + (i % 4);
      for (let p = 0; p < pts; p++) {
        const a = (p / pts) * Math.PI * 2 - Math.PI / 2;
        const px = x + Math.cos(a) * r;
        const py = y + Math.sin(a) * r;
        p === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
    }
    ctx.fillStyle = (i % 2 === 0 ? colors[2] : colors[3]) + Math.round(alpha * 255).toString(16).padStart(2,'0');
    ctx.fill();
  }
  // Gradient overlay
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, colors[2] + '22');
  grad.addColorStop(1, colors[0] + 'aa');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

// FIX 1 & 2: Rewritten logic to cleanly handle both active states, wave animations, and numbers
function updatePlaylistUI() {
  document.querySelectorAll('.track-item').forEach((el, i) => {
    const isActive = (i === currentIndex);
    el.classList.toggle('active', isActive);
    
    const numSpan = el.querySelector('.track-num');
    if (numSpan) {
      if (isActive) {
        numSpan.innerHTML = `<div class="wave-bars ${isPlaying ? 'playing' : ''}"><span></span><span></span><span></span></div>`;
      } else {
        numSpan.innerHTML = i + 1;
      }
    }
  });
}

function loadTrack(idx) {
  const t = tracks[idx];
  document.getElementById('songTitle').textContent = t.title;
  document.getElementById('songArtist').textContent = t.artist;
  document.getElementById('songAlbum').textContent = t.album;
  document.getElementById('totalTime').textContent = fmtTime(t.duration);
  document.getElementById('progressFill').style.width = '0%';
  document.getElementById('progressInput').value = 0;
  document.getElementById('currentTime').textContent = '0:00';
  currentTime = 0;
  clearInterval(timerInterval);
  
  // Draw main art
  const c = document.getElementById('mainArt');
  drawArtwork(c, t.colors, 296);
  
  // Apply visual updates to list
  updatePlaylistUI();
}

function startTimer() {
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    const t = tracks[currentIndex];
    currentTime = Math.min(currentTime + 0.5, t.duration);
    const pct = (currentTime / t.duration) * 100;
    document.getElementById('progressFill').style.width = pct + '%';
    document.getElementById('progressInput').value = pct;
    document.getElementById('currentTime').textContent = fmtTime(currentTime);
    if (currentTime >= t.duration) {
      clearInterval(timerInterval);
      if (repeatOn) { currentTime = 0; startTimer(); }
      else if (autoplayOn) { nextTrack(); }
      else { isPlaying = false; updatePlayBtn(); updatePlaylistUI(); }
    }
  }, 500);
}

function togglePlay() {
  isPlaying = !isPlaying;
  updatePlayBtn();
  if (isPlaying) startTimer(); else clearInterval(timerInterval);
  updatePlaylistUI();
}

function updatePlayBtn() {
  const icon = document.getElementById('playIcon');
  if (isPlaying) {
    icon.innerHTML = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>';
  } else {
    icon.innerHTML = '<path d="M8 5v14l11-7z"/>';
  }
}

function prevTrack() {
  if (currentTime > 3) { currentTime = 0; loadTrack(currentIndex); if(isPlaying) startTimer(); return; }
  currentIndex = (currentIndex - 1 + tracks.length) % tracks.length;
  loadTrack(currentIndex);
  if (isPlaying) startTimer();
}

// Updated next track logic for smooth processing
function nextTrack() {
  if (shuffleOn) {
    let ni = Math.floor(Math.random() * tracks.length);
    while (ni === currentIndex && tracks.length > 1) ni = Math.floor(Math.random() * tracks.length);
    currentIndex = ni;
  } else {
    currentIndex = (currentIndex + 1) % tracks.length;
  }
  loadTrack(currentIndex);
  if (isPlaying || autoplayOn) { isPlaying = true; updatePlayBtn(); startTimer(); }
  updatePlaylistUI();
}

function toggleShuffle() {
  shuffleOn = !shuffleOn;
  document.getElementById('shuffleBtn').classList.toggle('active', shuffleOn);
}
function toggleRepeat() {
  repeatOn = !repeatOn;
  document.getElementById('repeatBtn').classList.toggle('active', repeatOn);
}
function toggleAutoplay(btn) {
  autoplayOn = !autoplayOn;
  btn.classList.toggle('active', autoplayOn);
}
function toggleShuffleAll(btn) {
  shuffleOn = !shuffleOn;
  btn.classList.toggle('active', shuffleOn);
  document.getElementById('shuffleBtn').classList.toggle('active', shuffleOn);
}

// Progress scrub
document.getElementById('progressInput').addEventListener('input', function() {
  const pct = parseFloat(this.value);
  document.getElementById('progressFill').style.width = pct + '%';
  currentTime = (pct / 100) * tracks[currentIndex].duration;
  document.getElementById('currentTime').textContent = fmtTime(currentTime);
});

// Volume
document.getElementById('volumeInput').addEventListener('input', function() {
  const v = parseInt(this.value);
  document.getElementById('volumeFill').style.width = v + '%';
  document.getElementById('volPct').textContent = v + '%';
  isMuted = v === 0;
  updateVolIcon(v);
  prevVolume = v > 0 ? v : prevVolume;
});

function toggleMute() {
  const input = document.getElementById('volumeInput');
  if (isMuted) {
    input.value = prevVolume;
    document.getElementById('volumeFill').style.width = prevVolume + '%';
    document.getElementById('volPct').textContent = prevVolume + '%';
    isMuted = false;
    updateVolIcon(prevVolume);
  } else {
    prevVolume = parseInt(input.value) || 75;
    input.value = 0;
    document.getElementById('volumeFill').style.width = '0%';
    document.getElementById('volPct').textContent = '0%';
    isMuted = true;
    updateVolIcon(0);
  }
}

function updateVolIcon(v) {
  const icon = document.getElementById('volIcon');
  if (v === 0) {
    icon.innerHTML = '<path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>';
  } else if (v < 50) {
    icon.innerHTML = '<path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"/>';
  } else {
    icon.innerHTML = '<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/><path d="M14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>';
  }
}

// Build playlist
function buildPlaylist() {
  const list = document.getElementById('trackList');
  list.innerHTML = '';
  tracks.forEach((t, i) => {
    const el = document.createElement('div');
    el.className = 'track-item';
    el.onclick = () => {
      currentIndex = i;
      if (!isPlaying) { isPlaying = true; updatePlayBtn(); }
      loadTrack(i);
      startTimer();
    };
    el.innerHTML = `
      <span class="track-num">${i + 1}</span>
      <div class="track-mini-art"><canvas id="miniArt${i}" width="38" height="38"></canvas></div>
      <div class="track-meta">
        <div class="track-name">${t.title}</div>
        <div class="track-artist">${t.artist}</div>
      </div>
      <span class="track-dur">${fmtTime(t.duration)}</span>
    `;
    list.appendChild(el);
    setTimeout(() => drawArtwork(document.getElementById(`miniArt${i}`), t.colors, 38), 0);
  });
  document.getElementById('trackCountLabel').textContent = `${tracks.length} tracks`;
}

// Init
buildPlaylist();
loadTrack(0);
</script>