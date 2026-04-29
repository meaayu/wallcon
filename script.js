// ════════════════════════════════════════════════════════
//  SHARED: Page navigation
// ════════════════════════════════════════════════════════

// Toast utility
function showToast(msg, duration = 2000) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), duration);
}

document.querySelectorAll('.bottom-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.bottom-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    const page = document.getElementById('page-' + tab.dataset.page);
    page.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});

// ════════════════════════════════════════════════════════
//  PIXEL ART CONVERTER
// ════════════════════════════════════════════════════════
const PALETTES = {
  "Catppuccin Mocha": [
    [245,224,220],[242,205,205],[245,194,231],[203,166,247],
    [243,139,168],[235,160,172],[250,179,135],[249,226,175],
    [166,227,161],[148,226,213],[137,220,235],[116,199,236],
    [135,175,235],[180,190,254],[205,214,244],[186,194,222],
    [166,173,200],[147,153,178],[127,132,156],[108,112,134],
    [88,91,112],[69,71,90],[49,50,68],[30,30,46],[24,24,37],[17,17,27]
  ],
  "Catppuccin Frappé": [
    [242,213,207],[238,190,190],[244,184,228],[202,158,230],
    [231,130,132],[234,153,156],[239,159,118],[229,200,144],
    [166,209,137],[129,200,190],[153,209,219],[133,193,220],
    [140,170,238],[186,187,241],[198,208,245],[181,191,226],
    [165,173,206],[148,156,187],[131,139,167],[115,121,148],
    [98,104,128],[81,87,109],[65,69,89],[48,52,70],[41,44,60],[35,38,52]
  ],
  "Gruvbox": [
    [251,241,199],[235,219,178],[213,196,161],[189,174,147],
    [168,153,132],[146,131,116],[124,111,100],[60,56,54],
    [40,40,40],[29,32,33],[204,36,29],[214,93,14],
    [215,153,33],[152,151,26],[104,157,106],[69,133,136],
    [177,98,134],[251,73,52],[254,128,25],[250,189,47],
    [184,187,38],[142,192,124],[131,165,152],[211,134,155]
  ],
  "Nord": [
    [46,52,64],[59,66,82],[67,76,94],[76,86,106],
    [216,222,233],[229,233,240],[236,239,244],[143,188,187],
    [136,192,208],[129,161,193],[94,129,172],[191,97,106],
    [208,135,112],[235,203,139],[163,190,140],[180,142,173]
  ],
  "Tokyo Night": [
    [26,27,38],[36,40,59],[55,59,82],[65,72,104],
    [86,95,137],[169,177,214],[192,202,245],[200,209,245],
    [247,118,142],[255,158,100],[224,175,104],[158,206,106],
    [115,218,202],[125,207,255],[122,162,247],[187,154,247]
  ],
  "Rosé Pine": [
    [25,23,36],[26,24,38],[42,39,63],[57,53,82],
    [110,106,134],[144,140,170],[224,222,244],[235,188,186],
    [49,116,143],[156,207,216],[196,167,231],[246,193,119],
    [235,111,146],[62,143,176],[234,154,151],[199,163,177]
  ]
};

const PALETTE_COLORS = {
  "Original":         "#e5e7eb",
  "Catppuccin Mocha": "#d8b4fe",
  "Catppuccin Frappé":"#fbcfe8",
  "Gruvbox":          "#fcd34d",
  "Nord":             "#bae6fd",
  "Tokyo Night":      "#a5b4fc",
  "Rosé Pine":        "#fda4af"
};

let sourceImg = null, cellSize = 8, selectedPalette = null, lastResult = null;

const uploadZone   = document.getElementById('upload-zone');
const workspace    = document.getElementById('workspace');
const uploader     = document.getElementById('uploader');
const fileInput    = document.getElementById('file-input');
const originalImg  = document.getElementById('original-img');
const processedImg = document.getElementById('processed-img');
const processedWrap= document.getElementById('processed-wrap');
const sliderLine   = document.getElementById('slider-line');
const previewWrap  = document.getElementById('preview-wrap');
const overlay      = document.getElementById('processing-overlay');
const cellSizeInput= document.getElementById('cell-size');
const sizeDisplay  = document.getElementById('size-display');
const paletteGrid  = document.getElementById('palette-grid');
const btnPng       = document.getElementById('btn-png');
const btnSvg       = document.getElementById('btn-svg');
const changeBtn    = document.getElementById('change-btn');

function closestColor(r, g, b, palette) {
  if (!palette || palette.length === 0) return [r, g, b];
  let minDist = Infinity, best = palette[0];
  for (const [pr,pg,pb] of palette) {
    const d = (r-pr)**2 + (g-pg)**2 + (b-pb)**2;
    if (d < minDist) { minDist = d; best = [pr,pg,pb]; }
  }
  return best;
}

function pixelate(img, size, paletteName) {
  const w = img.naturalWidth, h = img.naturalHeight;
  const sample = document.createElement('canvas');
  sample.width = w; sample.height = h;
  const sCtx = sample.getContext('2d');
  sCtx.drawImage(img, 0, 0, w, h);
  const src = sCtx.getImageData(0, 0, w, h).data;
  const out = document.createElement('canvas');
  out.width = w; out.height = h;
  const ctx = out.getContext('2d');
  const palette = paletteName ? PALETTES[paletteName] : null;
  const cells = [];
  const cols = Math.ceil(w / size), rows = Math.ceil(h / size);
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x0 = col*size, y0 = row*size;
      const x1 = Math.min(x0+size, w), y1 = Math.min(y0+size, h);
      let rS=0, gS=0, bS=0, n=0;
      for (let y=y0; y<y1; y++) for (let x=x0; x<x1; x++) {
        const i = (y*w+x)*4;
        rS += src[i]; gS += src[i+1]; bS += src[i+2]; n++;
      }
      let r=Math.round(rS/n), g=Math.round(gS/n), b=Math.round(bS/n);
      if (palette) [r,g,b] = closestColor(r,g,b,palette);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(x0, y0, x1-x0, y1-y0);
      cells.push({x:x0, y:y0, w:x1-x0, h:y1-y0, r, g, b});
    }
  }
  return { canvas: out, width: w, height: h, cells };
}

function cellsToSVG(cells, w, h) {
  const rects = cells.map(c =>
    `<rect x="${c.x}" y="${c.y}" width="${c.w}" height="${c.h}" fill="rgb(${c.r},${c.g},${c.b})"/>`
  ).join('\n');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">\n${rects}\n</svg>`;
}

function process() {
  if (!sourceImg) return;
  overlay.classList.add('visible');
  btnPng.disabled = true; btnSvg.disabled = true;
  requestAnimationFrame(() => {
    setTimeout(() => {
      lastResult = pixelate(sourceImg, cellSize, selectedPalette);
      processedImg.src = lastResult.canvas.toDataURL('image/png');
      processedImg.onload = () => {
        overlay.classList.remove('visible');
        btnPng.disabled = false; btnSvg.disabled = false;
        // Show dimensions badge
        const dimBadge = document.getElementById('dimensions-badge');
        const cols = Math.ceil(lastResult.width / cellSize);
        const rows = Math.ceil(lastResult.height / cellSize);
        dimBadge.textContent = `${lastResult.width}×${lastResult.height}px · ${cols}×${rows} cells`;
        dimBadge.style.display = 'block';
      };
    }, 20);
  });
}

function loadImage(file) {
  if (!file || !file.type.startsWith('image/')) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      sourceImg = img;
      originalImg.src = e.target.result;
      uploadZone.style.display = 'none';
      workspace.classList.add('visible');
      process();
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

uploader.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', e => loadImage(e.target.files[0]));
uploader.addEventListener('dragover', e => { e.preventDefault(); uploader.classList.add('dragging'); });
uploader.addEventListener('dragleave', () => uploader.classList.remove('dragging'));
uploader.addEventListener('drop', e => {
  e.preventDefault(); uploader.classList.remove('dragging');
  loadImage(e.dataTransfer.files[0]);
});

cellSizeInput.addEventListener('input', () => {
  cellSize = parseInt(cellSizeInput.value);
  sizeDisplay.textContent = cellSize + 'px';
  process();
});

const paletteOptions = [{ name: null, label: 'Original' }, ...Object.keys(PALETTES).map(k => ({ name: k, label: k }))];
paletteOptions.forEach(p => {
  const btn = document.createElement('button');
  btn.className = 'palette-btn' + (p.name === null ? ' active' : '');
  btn.textContent = p.label;
  btn.style.background = PALETTE_COLORS[p.label] || '#e5e7eb';
  btn.addEventListener('click', () => {
    document.querySelectorAll('.palette-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedPalette = p.name;
    process();
  });
  paletteGrid.appendChild(btn);
});

let dragging = false;
function updateSlider(clientX) {
  const rect = previewWrap.getBoundingClientRect();
  const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
  sliderLine.style.left = pct + '%';
  processedWrap.style.clipPath = `inset(0 0 0 ${pct}%)`;
}
previewWrap.addEventListener('pointerdown', e => {
  dragging = true; previewWrap.setPointerCapture(e.pointerId); updateSlider(e.clientX);
});
previewWrap.addEventListener('pointermove', e => { if (dragging) updateSlider(e.clientX); });
previewWrap.addEventListener('pointerup', () => dragging = false);

btnPng.addEventListener('click', () => {
  if (!lastResult) return;
  const a = document.createElement('a');
  a.download = 'wallcon-pixel-art.png';
  a.href = lastResult.canvas.toDataURL('image/png');
  a.click();
  showToast('⬇ PNG downloaded!');
});
btnSvg.addEventListener('click', () => {
  if (!lastResult) return;
  const svg = cellsToSVG(lastResult.cells, lastResult.width, lastResult.height);
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.download = 'wallcon-pixel-art.svg'; a.href = url; a.click();
  URL.revokeObjectURL(url);
  showToast('⬇ SVG downloaded!');
});
changeBtn.addEventListener('click', () => {
  sourceImg = null; lastResult = null;
  originalImg.src = ''; processedImg.src = ''; fileInput.value = '';
  workspace.classList.remove('visible');
  uploadZone.style.display = '';
  btnPng.disabled = true; btnSvg.disabled = true;
  const dimBadge = document.getElementById('dimensions-badge');
  if (dimBadge) dimBadge.style.display = 'none';
});



// ════════════════════════════════════════════════════════
//  WALLPAPER GENERATOR — Color & Utility Functions
// ════════════════════════════════════════════════════════

const QUICK_PALETTES = [
  { name: 'Neon',    c: ['#ff6b9d','#ffe547','#5effc8','#0a0a0a'] },
  { name: 'Ocean',   c: ['#0ea5e9','#6366f1','#14b8a6','#0f172a'] },
  { name: 'Sunset',  c: ['#f97316','#ef4444','#ec4899','#1c1917'] },
  { name: 'Forest',  c: ['#22c55e','#84cc16','#a3e635','#14532d'] },
  { name: 'Candy',   c: ['#f472b6','#c084fc','#60a5fa','#fdf4ff'] },
  { name: 'Mono',    c: ['#ffffff','#aaaaaa','#555555','#111111'] },
  { name: 'Sakura',  c: ['#fda4af','#f9a8d4','#fbcfe8','#fff1f2'] },
  { name: 'Cyber',   c: ['#00ffff','#ff00ff','#ffff00','#000000'] },
];

const quickPalettesEl = document.getElementById('quick-palettes');
const c1El = document.getElementById('wg-color1');
const c2El = document.getElementById('wg-color2');
const c3El = document.getElementById('wg-color3');
const c4El = document.getElementById('wg-color4');

// ── Color utility functions ──
function hexToRgb(hex) {
  if (!hex || typeof hex !== 'string') return [128,128,128];
  let h = hex.trim();
  if (h.startsWith('#') && h.length === 4) h = '#'+h[1]+h[1]+h[2]+h[2]+h[3]+h[3];
  if (h.length < 7) return [128,128,128];
  const r=parseInt(h.slice(1,3),16), g=parseInt(h.slice(3,5),16), b=parseInt(h.slice(5,7),16);
  if (isNaN(r)||isNaN(g)||isNaN(b)) return [128,128,128];
  return [r,g,b];
}

function rgbToHex(r,g,b) {
  return '#'+[r,g,b].map(v=>Math.round(Math.max(0,Math.min(255,v))).toString(16).padStart(2,'0')).join('');
}

function hexToHsl(hex) {
  let [r,g,b] = hexToRgb(hex);
  r/=255; g/=255; b/=255;
  const max=Math.max(r,g,b), min=Math.min(r,g,b);
  let h,s,l=(max+min)/2;
  if (max===min) { h=s=0; }
  else {
    const d=max-min;
    s = l>0.5 ? d/(2-max-min) : d/(max+min);
    switch(max) {
      case r: h=((g-b)/d+(g<b?6:0))/6; break;
      case g: h=((b-r)/d+2)/6; break;
      case b: h=((r-g)/d+4)/6; break;
    }
  }
  return [h*360, s*100, l*100];
}

function hslToHex(h,s,l) {
  h/=360; s/=100; l/=100;
  let r,g,b;
  if (s===0) { r=g=b=l; }
  else {
    const q=l<0.5?l*(1+s):l+s-l*s, p=2*l-q;
    const hue2rgb=(p,q,t)=>{
      if(t<0)t+=1; if(t>1)t-=1;
      if(t<1/6) return p+(q-p)*6*t;
      if(t<1/2) return q;
      if(t<2/3) return p+(q-p)*(2/3-t)*6;
      return p;
    };
    r=hue2rgb(p,q,h+1/3); g=hue2rgb(p,q,h); b=hue2rgb(p,q,h-1/3);
  }
  return rgbToHex(r*255,g*255,b*255);
}

function lerpColor(a,b,t) {
  return [Math.round(a[0]+(b[0]-a[0])*t), Math.round(a[1]+(b[1]-a[1])*t), Math.round(a[2]+(b[2]-a[2])*t)];
}

function rgbStr(c) {
  if (!c||!Array.isArray(c)||c.length<3) return 'rgb(128,128,128)';
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

// ── Color harmony generator ──
function generateHarmony(baseHex, mode) {
  const [h,s,l] = hexToHsl(baseHex);
  const bg = hslToHex(h, Math.max(s-20,10), Math.min(l+35,92));
  switch(mode) {
    case 'complementary': return [baseHex, hslToHex((h+180)%360,s,l), hslToHex((h+150)%360,s,Math.min(l+15,90)), bg];
    case 'triadic':       return [baseHex, hslToHex((h+120)%360,s,l), hslToHex((h+240)%360,s,l), bg];
    case 'analogous':     return [baseHex, hslToHex((h+30)%360,s,l),  hslToHex((h+60)%360,s,l),  bg];
    case 'split':         return [baseHex, hslToHex((h+150)%360,s,l), hslToHex((h+210)%360,s,l), bg];
    case 'monochrome':    return [hslToHex(h,s,Math.min(l+25,90)), hslToHex(h,s,l), hslToHex(h,s,Math.max(l-25,10)), hslToHex(h,Math.max(s-30,5),Math.min(l+40,95))];
    default: return [baseHex, baseHex, baseHex, bg];
  }
}

// ── Recent colors ──
let recentColors = [];
function addToRecent(hex) {
  if (!hex||!hex.startsWith('#')) return;
  recentColors = [hex, ...recentColors.filter(c=>c!==hex)].slice(0,12);
  renderRecent();
}
function renderRecent() {
  const container = document.getElementById('recent-colors');
  const section   = document.getElementById('recent-section');
  if (!container||!section) return;
  if (recentColors.length===0) { section.style.display='none'; return; }
  section.style.display='block';
  container.innerHTML='';
  recentColors.forEach(hex => {
    const dot = document.createElement('div');
    dot.className='recent-dot'; dot.style.background=hex; dot.title=hex;
    dot.addEventListener('click', ()=>applyColorsToSlots([hex].concat(getSlotColors().slice(1))));
    container.appendChild(dot);
  });
}

// ── Slot helpers ──
function getSlotColors() { return [c1El.value, c2El.value, c3El.value, c4El.value]; }

function applyColorsToSlots(colors) {
  const pickers = [c1El,c2El,c3El,c4El];
  const slots = document.querySelectorAll('.color-slot');
  colors.forEach((hex,i) => {
    if (!pickers[i]||!hex) return;
    pickers[i].value = hex;
    const hexInput = slots[i]&&slots[i].querySelector('.slot-hex');
    if (hexInput) { hexInput.value=hex; hexInput.classList.remove('invalid'); }
    addToRecent(hex);
  });
  updateStrip();
}

function updateStrip() {
  const strip = document.getElementById('color-preview-strip');
  if (!strip) return;
  const [c1,c2,c3,c4] = getSlotColors();
  strip.style.background = `linear-gradient(90deg, ${c1} 0%, ${c2} 33%, ${c3} 66%, ${c4} 100%)`;
}

// ── Wire up color slots ──
document.querySelectorAll('.color-slot').forEach(slot => {
  const picker  = slot.querySelector('.slot-picker');
  const hexInp  = slot.querySelector('.slot-hex');
  const copyBtn = slot.querySelector('.slot-copy');
  if (!picker||!hexInp) return;

  picker.addEventListener('input', () => {
    hexInp.value = picker.value;
    hexInp.classList.remove('invalid');
    updateStrip(); addToRecent(picker.value);
  });

  hexInp.addEventListener('input', () => {
    let val = hexInp.value.trim();
    if (!val.startsWith('#')) val = '#'+val;
    const ok = /^#[0-9a-fA-F]{6}$/.test(val);
    hexInp.classList.toggle('invalid', !ok);
    if (ok) { picker.value=val; updateStrip(); addToRecent(val); }
  });

  hexInp.addEventListener('keydown', e => { if(e.key==='Enter') hexInp.blur(); });

  copyBtn && copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(picker.value).then(() => {
      copyBtn.textContent='✓'; copyBtn.classList.add('copied');
      setTimeout(()=>{ copyBtn.textContent='⎘'; copyBtn.classList.remove('copied'); },1200);
    }).catch(()=>hexInp.select());
  });
});

// ── Quick palettes ──
QUICK_PALETTES.forEach(qp => {
  const sw = document.createElement('div');
  sw.className='grad-swatch'; sw.title=qp.name;
  sw.style.background=`linear-gradient(135deg,${qp.c[0]} 0%,${qp.c[1]} 50%,${qp.c[2]} 100%)`;
  sw.addEventListener('click', ()=>{
    document.querySelectorAll('.grad-swatch').forEach(s=>s.classList.remove('active'));
    sw.classList.add('active');
    applyColorsToSlots(qp.c);
  });
  quickPalettesEl.appendChild(sw);
});

// ── Harmony buttons ──
document.querySelectorAll('.harmony-btn').forEach(btn => {
  btn.addEventListener('click', ()=>{
    const base = document.getElementById('harmony-base').value;
    const colors = generateHarmony(base, btn.dataset.mode);
    document.querySelectorAll('.harmony-btn').forEach(b=>{ b.style.background=''; b.style.color=''; });
    btn.style.background = base;
    btn.style.color = hexToHsl(base)[2]>55 ? '#000' : '#fff';
    applyColorsToSlots(colors);
  });
});

// Init preview strip
updateStrip();

// Auto-generate on color change
document.querySelectorAll('.slot-picker').forEach(picker => {
  picker.addEventListener('input', () => { if (wgGenerated) debouncedAutoGenerate(); });
});
document.querySelectorAll('#wg-shadow,#wg-outline,#wg-vignette').forEach(cb => {
  cb.addEventListener('change', () => { if (wgGenerated) generateWallpaper(); });
});

// Pattern type selection
let wgPattern = 'geometric';
document.querySelectorAll('.pattern-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.pattern-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    wgPattern = btn.dataset.pattern;
    generateWallpaper();
  });
});

// Size presets
let wgW = 1920, wgH = 1080;
document.querySelectorAll('.size-preset-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.size-preset-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    wgW = parseInt(btn.dataset.w); wgH = parseInt(btn.dataset.h);
    debouncedAutoGenerate();
  });
});

// Parameter sliders
const scaleSlider = document.getElementById('wg-scale');
const scaleVal = document.getElementById('wg-scale-val');
const complexSlider = document.getElementById('wg-complexity');
const complexVal = document.getElementById('wg-complexity-val');
const rotSlider = document.getElementById('wg-rotation');
const rotVal = document.getElementById('wg-rotation-val');

scaleSlider.addEventListener('input', () => { scaleVal.textContent = scaleSlider.value; debouncedAutoGenerate(); });
complexSlider.addEventListener('input', () => { complexVal.textContent = complexSlider.value; debouncedAutoGenerate(); });
rotSlider.addEventListener('input', () => { rotVal.textContent = rotSlider.value + '°'; debouncedAutoGenerate(); });

const opacitySlider = document.getElementById('wg-opacity');
const opacityVal = document.getElementById('wg-opacity-val');
if (opacitySlider) opacitySlider.addEventListener('input', () => { opacityVal.textContent = opacitySlider.value + '%'; debouncedAutoGenerate(); });

// Canvas & download
const wgCanvas = document.getElementById('wg-canvas');
const wgPlaceholder = document.getElementById('wg-placeholder');
const wgDlPng = document.getElementById('wg-dl-png');
const wgDlJpg = document.getElementById('wg-dl-jpg');
const wgDlCopy = document.getElementById('wg-dl-copy');
const wgCanvasOverlay = document.getElementById('wg-canvas-overlay');
const wgPreviewMeta = document.getElementById('wg-preview-meta');
let wgGenerated = false;


// ─────────── Auto-preview debounce ───────────
let autoGenTimer = null;
function debouncedAutoGenerate() {
  if (!wgGenerated) return;
  clearTimeout(autoGenTimer);
  autoGenTimer = setTimeout(generateWallpaper, 300);
}

// ─────────── Randomize ───────────
const PATTERNS = ['geometric','waves','dots','stripes','mosaic','noise','hexagons','triangles','gradient','chevron','mandala','isometric','circuit','aurora','confetti'];
function randomHex() {
  const h = Math.floor(Math.random()*360);
  const s = 55 + Math.floor(Math.random()*40);
  const l = 40 + Math.floor(Math.random()*30);
  return hslToHex(h, s, l);
}

document.getElementById('wg-randomize-btn').addEventListener('click', () => {
  // Random pattern
  const pat = PATTERNS[Math.floor(Math.random()*PATTERNS.length)];
  document.querySelectorAll('.pattern-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.pattern === pat);
  });
  wgPattern = pat;
  // Random colors via harmony
  const base = randomHex();
  const modes = ['complementary','triadic','analogous','split','monochrome'];
  const mode = modes[Math.floor(Math.random()*modes.length)];
  const colors = generateHarmony(base, mode);
  applyColorsToSlots(colors);
  // Random params
  scaleSlider.value = 20 + Math.floor(Math.random()*140);
  scaleVal.textContent = scaleSlider.value;
  complexSlider.value = 1 + Math.floor(Math.random()*9);
  complexVal.textContent = complexSlider.value;
  rotSlider.value = Math.floor(Math.random()*360);
  rotVal.textContent = rotSlider.value + '°';
  generateWallpaper();
  showToast('🎲 Randomized!');
});

// ─────────── Pattern drawing functions ───────────
function drawGeometric(ctx, w, h, colors, scale, complexity, rotation, shadow, outline) {
  const bg = colors[3];
  ctx.fillStyle = rgbStr(bg);
  ctx.fillRect(0, 0, w, h);
  const s = scale;
  const cols = Math.ceil(w / s) + 4;
  const rows = Math.ceil(h / s) + 4;
  const rot = rotation * Math.PI / 180;
  ctx.save();
  ctx.translate(w/2, h/2);
  ctx.rotate(rot * 0.3);
  ctx.translate(-w/2, -h/2);
  for (let row = -2; row < rows; row++) {
    for (let col = -2; col < cols; col++) {
      const x = col * s + (row % 2 === 0 ? s/2 : 0);
      const y = row * s;
      const ci = (row * cols + col) % (colors.length - 1);
      const c = colors[ci % 3];
      if (shadow) {
        ctx.shadowColor = 'rgba(0,0,0,0.18)';
        ctx.shadowBlur = 10; ctx.shadowOffsetX = 4; ctx.shadowOffsetY = 4;
      }
      ctx.fillStyle = rgbStr(c);
      const shapeType = Math.abs((row * 7 + col * 13)) % 3;
      ctx.beginPath();
      if (shapeType === 0) {
        ctx.rect(x, y, s*0.88, s*0.88);
      } else if (shapeType === 1) {
        ctx.moveTo(x + s/2, y);
        ctx.lineTo(x + s, y + s);
        ctx.lineTo(x, y + s);
      } else {
        ctx.arc(x + s/2, y + s/2, s*0.42, 0, Math.PI*2);
      }
      ctx.fill();
      if (outline) {
        ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }
  }
  ctx.restore();
  ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
}

function drawWaves(ctx, w, h, colors, scale, complexity, rotation, shadow, outline) {
  ctx.fillStyle = rgbStr(colors[3]);
  ctx.fillRect(0, 0, w, h);
  const freq = complexity * 0.5;
  const amp = scale;
  const numWaves = Math.ceil(h / (scale * 0.6)) + 4;
  for (let i = 0; i < numWaves; i++) {
    const t = i / numWaves;
    const c = lerpColor(colors[0], colors[i % 3 === 0 ? 1 : 2], (Math.sin(i) + 1) / 2);
    ctx.beginPath();
    const yBase = (i / numWaves) * h * 1.4 - h * 0.2;
    ctx.moveTo(-10, yBase);
    for (let x = 0; x <= w + 10; x += 4) {
      const y = yBase + Math.sin((x / w) * Math.PI * 2 * freq + i * 0.7 + rotation * 0.05) * amp;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w + 10, h + 10);
    ctx.lineTo(-10, h + 10);
    ctx.closePath();
    if (shadow) { ctx.shadowColor = 'rgba(0,0,0,0.12)'; ctx.shadowBlur = 12; }
    ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},0.85)`;
    ctx.fill();
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
    if (outline) {
      ctx.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},0.5)`;
      ctx.lineWidth = 2; ctx.stroke();
    }
  }
}

function drawDots(ctx, w, h, colors, scale, complexity, rotation, shadow, outline) {
  ctx.fillStyle = rgbStr(colors[3]);
  ctx.fillRect(0, 0, w, h);
  const s = scale * 1.2;
  const r = s * 0.35 + complexity * 2;
  const cols = Math.ceil(w / s) + 4;
  const rows = Math.ceil(h / s) + 4;
  ctx.save();
  ctx.translate(w/2, h/2);
  ctx.rotate((rotation) * Math.PI / 180);
  ctx.translate(-w/2, -h/2);
  for (let row = -2; row < rows; row++) {
    for (let col = -2; col < cols; col++) {
      const x = col * s + (row % 2 === 0 ? s/2 : 0) - s;
      const y = row * s - s;
      const c = colors[(row + col) % 3];
      if (shadow) { ctx.shadowColor = 'rgba(0,0,0,0.2)'; ctx.shadowBlur = 8; ctx.shadowOffsetX = 3; ctx.shadowOffsetY = 3; }
      ctx.fillStyle = rgbStr(c);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      if (outline) {
        ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.lineWidth = 1.5; ctx.stroke();
      }
    }
  }
  ctx.restore();
  ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
}

function drawStripes(ctx, w, h, colors, scale, complexity, rotation, shadow, outline) {
  ctx.fillStyle = rgbStr(colors[3]);
  ctx.fillRect(0, 0, w, h);
  const stripeW = scale * 0.8;
  const total = w * 2 + h * 2;
  const numStripes = Math.ceil(total / stripeW) + 4;
  ctx.save();
  ctx.translate(w/2, h/2);
  ctx.rotate(rotation * Math.PI / 180);
  ctx.translate(-w/2-w, -h/2-h);
  for (let i = 0; i < numStripes * 3; i++) {
    const x = i * stripeW;
    const c = colors[i % 3];
    if (shadow) { ctx.shadowColor = 'rgba(0,0,0,0.12)'; ctx.shadowBlur = 6; }
    ctx.fillStyle = rgbStr(c);
    ctx.fillRect(x, -h, stripeW, h * 4);
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
    if (outline) {
      ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 1;
      ctx.strokeRect(x, -h, stripeW, h * 4);
    }
  }
  ctx.restore();
}

function drawMosaic(ctx, w, h, colors, scale, complexity, rotation, shadow, outline) {
  ctx.fillStyle = rgbStr(colors[3]);
  ctx.fillRect(0, 0, w, h);
  const s = Math.max(8, scale / 2);
  const cols = Math.ceil(w / s);
  const rows = Math.ceil(h / s);
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const seed = (row * 1237 + col * 4567 + complexity * 11) % 100;
      const ci = seed < 40 ? 0 : seed < 65 ? 1 : seed < 80 ? 2 : 3;
      const c = colors[ci];
      if (shadow && seed % 5 === 0) { ctx.shadowColor = 'rgba(0,0,0,0.15)'; ctx.shadowBlur = 5; }
      ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${0.6 + (seed/100)*0.4})`;
      ctx.fillRect(col*s, row*s, s-1, s-1);
      ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
    }
  }
}

function drawStarburst(ctx, w, h, colors, scale, complexity, rotation, shadow, outline) {
  ctx.fillStyle = rgbStr(colors[3]);
  ctx.fillRect(0, 0, w, h);
  const numBursts = Math.max(1, Math.round(complexity));
  const positions = [];
  for (let i = 0; i < numBursts; i++) {
    positions.push([
      w * (0.15 + (i * 0.7 / Math.max(1, numBursts-1))),
      h * (0.3 + Math.sin(i * 1.3) * 0.4),
    ]);
  }
  positions.forEach(([cx, cy], pi) => {
    const c = colors[pi % 3];
    const rays = 12 + complexity * 2;
    const outerR = scale * 3;
    const innerR = scale * 1.2;
    for (let ray = 0; ray < rays; ray++) {
      const angle = (ray / rays) * Math.PI * 2 + rotation * Math.PI / 180;
      const grad = ctx.createLinearGradient(cx, cy, cx + Math.cos(angle)*outerR, cy + Math.sin(angle)*outerR);
      grad.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},0.9)`);
      grad.addColorStop(1, `rgba(${c[0]},${c[1]},${c[2]},0)`);
      if (shadow) { ctx.shadowColor = `rgba(${c[0]},${c[1]},${c[2]},0.4)`; ctx.shadowBlur = 20; }
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      const a1 = angle - Math.PI / rays;
      const a2 = angle + Math.PI / rays;
      ctx.arc(cx, cy, innerR, a1, a2);
      ctx.lineTo(cx + Math.cos(angle) * outerR, cy + Math.sin(angle) * outerR);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
    }
    // Center glow
    const radGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, innerR*1.5);
    radGrad.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},1)`);
    radGrad.addColorStop(1, `rgba(${c[0]},${c[1]},${c[2]},0)`);
    ctx.fillStyle = radGrad;
    ctx.beginPath(); ctx.arc(cx, cy, innerR*1.5, 0, Math.PI*2); ctx.fill();
  });
}

function drawHexagons(ctx, w, h, colors, scale, complexity, rotation, shadow, outline) {
  ctx.fillStyle = rgbStr(colors[3]);
  ctx.fillRect(0, 0, w, h);
  const r = scale;
  const hexH = r * Math.sqrt(3);
  const hexW = r * 2;
  const rot = rotation * Math.PI / 180;
  ctx.save();
  ctx.translate(w/2, h/2);
  ctx.rotate(rot * 0.15);
  ctx.translate(-w/2, -h/2);
  const cols = Math.ceil(w / (hexW * 0.75)) + 4;
  const rows = Math.ceil(h / hexH) + 4;
  for (let row = -2; row < rows; row++) {
    for (let col = -2; col < cols; col++) {
      const x = col * hexW * 0.75;
      const y = row * hexH + (col % 2 !== 0 ? hexH/2 : 0);
      const ci = Math.abs((row * 5 + col * 7)) % 3;
      const c = colors[ci];
      if (shadow) { ctx.shadowColor = 'rgba(0,0,0,0.2)'; ctx.shadowBlur = 10; ctx.shadowOffsetX = 4; ctx.shadowOffsetY = 4; }
      ctx.fillStyle = rgbStr(c);
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = Math.PI / 180 * (60 * i - 30);
        const px = x + r * Math.cos(a);
        const py = y + r * Math.sin(a);
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
      if (outline) {
        ctx.strokeStyle = rgbStr(colors[3]); ctx.lineWidth = 3; ctx.stroke();
      }
    }
  }
  ctx.restore();
}

function drawTriangles(ctx, w, h, colors, scale, complexity, rotation, shadow, outline) {
  ctx.fillStyle = rgbStr(colors[3]);
  ctx.fillRect(0, 0, w, h);
  const s = scale;
  const cols = Math.ceil(w / s) + 4;
  const rows = Math.ceil(h / (s * Math.sqrt(3)/2)) + 4;
  ctx.save();
  ctx.translate(w/2, h/2);
  ctx.rotate(rotation * Math.PI / 180 * 0.2);
  ctx.translate(-w/2, -h/2);
  for (let row = -2; row < rows; row++) {
    for (let col = -2; col < cols * 2; col++) {
      const triH = s * Math.sqrt(3) / 2;
      const x = (col / 2) * s;
      const y = row * triH;
      const isUp = (row + col) % 2 === 0;
      const ci = Math.abs((row * 3 + col)) % 3;
      const c = colors[ci];
      if (shadow) { ctx.shadowColor = 'rgba(0,0,0,0.15)'; ctx.shadowBlur = 8; }
      ctx.fillStyle = rgbStr(c);
      ctx.beginPath();
      if (isUp) {
        ctx.moveTo(x, y + triH);
        ctx.lineTo(x + s/2, y);
        ctx.lineTo(x + s, y + triH);
      } else {
        ctx.moveTo(x, y);
        ctx.lineTo(x + s/2, y + triH);
        ctx.lineTo(x + s, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
      if (outline) { ctx.strokeStyle = rgbStr(colors[3]); ctx.lineWidth = 2; ctx.stroke(); }
    }
  }
  ctx.restore();
}

function drawGradientWall(ctx, w, h, colors, scale, complexity, rotation, shadow, outline) {
  const rot = rotation * Math.PI / 180;
  const cx = w/2, cy = h/2;
  const dx = Math.cos(rot) * Math.max(w,h);
  const dy = Math.sin(rot) * Math.max(w,h);
  const grad = ctx.createLinearGradient(cx - dx, cy - dy, cx + dx, cy + dy);
  grad.addColorStop(0, rgbStr(colors[0]));
  grad.addColorStop(0.35, rgbStr(colors[1]));
  grad.addColorStop(0.65, rgbStr(colors[2]));
  grad.addColorStop(1, rgbStr(colors[3]));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  // Radial overlay for complexity
  const seed = [0.2, 0.7, 0.4, 0.9, 0.15, 0.6, 0.35, 0.8, 0.55, 0.05];
  for (let i = 0; i < complexity; i++) {
    const rx = seed[i % seed.length] * w;
    const ry = seed[(i + 3) % seed.length] * h;
    const rr = seed[(i + 6) % seed.length] * Math.max(w, h) * 0.5 + scale;
    const c = colors[i % 3];
    if (!c || !Array.isArray(c)) continue;
    const rg = ctx.createRadialGradient(rx, ry, 0, rx, ry, rr);
    rg.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},0.25)`);
    rg.addColorStop(1, `rgba(${c[0]},${c[1]},${c[2]},0)`);
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, w, h);
  }
}


// ─────────── NEW PATTERNS ───────────

function drawChevron(ctx, w, h, colors, scale, complexity, rotation, shadow, outline) {
  ctx.fillStyle = rgbStr(colors[3]);
  ctx.fillRect(0, 0, w, h);
  const bandH = Math.max(10, scale * 0.8);
  const teeth = Math.max(2, Math.round(complexity * 1.5));
  const toothW = w / teeth;
  const toothH = bandH * 0.9;
  ctx.save();
  ctx.translate(w/2, h/2);
  ctx.rotate(rotation * Math.PI / 180 * 0.05);
  ctx.translate(-w/2, -h/2);
  const numBands = Math.ceil(h / bandH) + 6;
  for (let band = -3; band < numBands; band++) {
    const c = colors[Math.abs(band) % 3];
    const yTop = band * bandH;
    if (shadow) { ctx.shadowColor = 'rgba(0,0,0,0.15)'; ctx.shadowBlur = 10; }
    ctx.fillStyle = rgbStr(c);
    ctx.beginPath();
    ctx.moveTo(-toothW, yTop + bandH);
    for (let t = -1; t <= teeth + 1; t++) {
      const x1 = t * toothW;
      const x2 = x1 + toothW / 2;
      const x3 = x1 + toothW;
      ctx.lineTo(x2, yTop);
      ctx.lineTo(x3, yTop + bandH);
    }
    ctx.lineTo(-toothW, yTop + bandH);
    ctx.closePath();
    ctx.fill();
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
    if (outline) { ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.lineWidth = 1.5; ctx.stroke(); }
  }
  ctx.restore();
}

function drawMandala(ctx, w, h, colors, scale, complexity, rotation, shadow, outline) {
  ctx.fillStyle = rgbStr(colors[3]);
  ctx.fillRect(0, 0, w, h);
  const cx = w / 2, cy = h / 2;
  const maxR = Math.min(w, h) * 0.48;
  const rings = Math.max(3, Math.round(complexity * 1.2));
  const petals = Math.max(6, Math.round(complexity * 2 + 6));
  for (let ring = rings; ring >= 1; ring--) {
    const r = (ring / rings) * maxR;
    const innerR = ((ring - 1) / rings) * maxR;
    const c = colors[(ring - 1) % 3];
    const rot = rotation * Math.PI / 180 + (ring % 2 === 0 ? Math.PI / petals : 0);
    for (let p = 0; p < petals; p++) {
      const angle = (p / petals) * Math.PI * 2 + rot;
      const nextAngle = ((p + 1) / petals) * Math.PI * 2 + rot;
      const midAngle = (angle + nextAngle) / 2;
      const petalR = r + (r - innerR) * 0.3;
      if (shadow) { ctx.shadowColor = `rgba(${c[0]},${c[1]},${c[2]},0.3)`; ctx.shadowBlur = 20; }
      ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${0.7 + 0.3 * (ring / rings)})`;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * innerR, cy + Math.sin(angle) * innerR);
      ctx.quadraticCurveTo(
        cx + Math.cos(midAngle) * petalR, cy + Math.sin(midAngle) * petalR,
        cx + Math.cos(nextAngle) * innerR, cy + Math.sin(nextAngle) * innerR
      );
      ctx.quadraticCurveTo(
        cx + Math.cos(midAngle) * (innerR * 0.6), cy + Math.sin(midAngle) * (innerR * 0.6),
        cx + Math.cos(angle) * innerR, cy + Math.sin(angle) * innerR
      );
      ctx.closePath();
      ctx.fill();
      ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
      if (outline) { ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.lineWidth = 1; ctx.stroke(); }
    }
  }
  // Center dot
  const cc = colors[0];
  ctx.beginPath();
  ctx.arc(cx, cy, maxR * 0.06, 0, Math.PI * 2);
  ctx.fillStyle = rgbStr(cc);
  ctx.fill();
}

function drawIsometric(ctx, w, h, colors, scale, complexity, rotation, shadow, outline) {
  ctx.fillStyle = rgbStr(colors[3]);
  ctx.fillRect(0, 0, w, h);
  const s = Math.max(16, scale * 0.9);
  const tileW = s * 2;
  const tileH = s * Math.sqrt(3);
  const cols = Math.ceil(w / tileW) + 6;
  const rows = Math.ceil(h / (tileH / 2)) + 6;
  // Sort for painter's algorithm
  const cubes = [];
  for (let row = -3; row < rows; row++) {
    for (let col = -3; col < cols; col++) {
      const sx = col * tileW + (row % 2 !== 0 ? tileW / 2 : 0);
      const sy = row * (tileH / 2);
      const depth = (complexity > 5) ? Math.sin(row * 0.7 + col * 1.1) * 0.5 + 0.5 : 1;
      cubes.push({ sx, sy, row, col, depth });
    }
  }
  cubes.sort((a, b) => (a.sy + a.sx * 0.001) - (b.sy + b.sx * 0.001));
  for (const { sx, sy, row, col, depth } of cubes) {
    if (depth < 0.3 && complexity > 5) continue;
    const c0 = colors[Math.abs(row + col) % 3];
    const lighter = (c) => c.map(v => Math.min(255, v + 60));
    const darker  = (c) => c.map(v => Math.max(0, v - 50));
    const right = lighter(c0), left = darker(c0);
    // Top face
    ctx.beginPath();
    ctx.moveTo(sx, sy - s);
    ctx.lineTo(sx + tileW / 2, sy - s / 2);
    ctx.lineTo(sx + tileW / 2, sy + s / 2);
    ctx.lineTo(sx, sy);
    ctx.lineTo(sx - tileW / 2, sy + s / 2);
    ctx.lineTo(sx - tileW / 2, sy - s / 2);
    ctx.closePath();
    if (shadow) { ctx.shadowColor = 'rgba(0,0,0,0.2)'; ctx.shadowBlur = 12; }
    ctx.fillStyle = rgbStr(c0);
    ctx.fill();
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
    if (outline) { ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 1; ctx.stroke(); }
    // Right face
    ctx.beginPath();
    ctx.moveTo(sx + tileW / 2, sy - s / 2);
    ctx.lineTo(sx + tileW / 2, sy + s * 1.2);
    ctx.lineTo(sx, sy + s * 1.7);
    ctx.lineTo(sx, sy + s / 2);
    ctx.closePath();
    ctx.fillStyle = rgbStr(right);
    ctx.fill();
    if (outline) { ctx.strokeStyle = 'rgba(0,0,0,0.1)'; ctx.lineWidth = 1; ctx.stroke(); }
    // Left face
    ctx.beginPath();
    ctx.moveTo(sx - tileW / 2, sy - s / 2);
    ctx.lineTo(sx, sy + s / 2);
    ctx.lineTo(sx, sy + s * 1.7);
    ctx.lineTo(sx - tileW / 2, sy + s * 1.2);
    ctx.closePath();
    ctx.fillStyle = rgbStr(left);
    ctx.fill();
    if (outline) { ctx.strokeStyle = 'rgba(0,0,0,0.1)'; ctx.lineWidth = 1; ctx.stroke(); }
  }
}

function drawCircuit(ctx, w, h, colors, scale, complexity, rotation, shadow, outline) {
  ctx.fillStyle = rgbStr(colors[3]);
  ctx.fillRect(0, 0, w, h);
  const grid = Math.max(20, scale);
  const cols = Math.ceil(w / grid) + 2;
  const rows = Math.ceil(h / grid) + 2;
  const lineColor = colors[0];
  const nodeColor = colors[1];
  const accentColor = colors[2];
  ctx.lineWidth = Math.max(1.5, grid * 0.08);
  const rng = (seed) => { let s = seed * 9301 + 49297; return (s % 233280) / 233280; };
  // Draw traces
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * grid;
      const y = row * grid;
      const seed = row * cols + col + complexity;
      const r1 = rng(seed);
      const r2 = rng(seed + 1000);
      const r3 = rng(seed + 2000);
      if (shadow) { ctx.shadowColor = `rgba(${lineColor[0]},${lineColor[1]},${lineColor[2]},0.4)`; ctx.shadowBlur = 8; }
      ctx.strokeStyle = `rgba(${lineColor[0]},${lineColor[1]},${lineColor[2]},0.7)`;
      ctx.beginPath();
      if (r1 > 0.4 && col < cols - 1) { ctx.moveTo(x, y); ctx.lineTo(x + grid, y); }
      if (r2 > 0.4 && row < rows - 1) { ctx.moveTo(x, y); ctx.lineTo(x, y + grid); }
      ctx.stroke();
      ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
      // Nodes
      if (r3 > 0.7) {
        const nc = r3 > 0.88 ? accentColor : nodeColor;
        ctx.fillStyle = rgbStr(nc);
        ctx.beginPath();
        ctx.arc(x, y, grid * 0.15, 0, Math.PI * 2);
        ctx.fill();
        if (outline) { ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 1; ctx.stroke(); }
        // Large nodes
        if (r3 > 0.92) {
          ctx.fillStyle = rgbStr(nc);
          ctx.beginPath();
          const rs = grid * 0.32;
          ctx.roundRect ? ctx.roundRect(x - rs, y - rs, rs * 2, rs * 2, 4) : ctx.rect(x - rs, y - rs, rs * 2, rs * 2);
          ctx.fill();
        }
      }
    }
  }
}

function drawAurora(ctx, w, h, colors, scale, complexity, rotation, shadow, outline) {
  ctx.fillStyle = rgbStr(colors[3]);
  ctx.fillRect(0, 0, w, h);
  const numLayers = Math.max(4, complexity * 2);
  for (let layer = 0; layer < numLayers; layer++) {
    const t = layer / numLayers;
    const c = colors[layer % 3];
    const alpha = 0.15 + (1 - t) * 0.35;
    const yBase = h * (0.2 + t * 0.5);
    const amp = scale * (0.5 + t * 1.5);
    const freq = (2 + complexity * 0.4) * (1 + layer * 0.1);
    const phase = layer * 0.8 + rotation * 0.04;
    const grad = ctx.createLinearGradient(0, yBase - amp, 0, yBase + amp * 2);
    grad.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},0)`);
    grad.addColorStop(0.3, `rgba(${c[0]},${c[1]},${c[2]},${alpha})`);
    grad.addColorStop(0.6, `rgba(${c[0]},${c[1]},${c[2]},${alpha * 0.5})`);
    grad.addColorStop(1, `rgba(${c[0]},${c[1]},${c[2]},0)`);
    if (shadow) { ctx.shadowColor = `rgba(${c[0]},${c[1]},${c[2]},0.4)`; ctx.shadowBlur = 40; }
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += 3) {
      const y = yBase + Math.sin((x / w) * Math.PI * freq + phase) * amp
                       + Math.sin((x / w) * Math.PI * freq * 2.3 + phase * 1.4) * amp * 0.4;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w, h); ctx.closePath();
    ctx.fill();
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
  }
}

function drawConfetti(ctx, w, h, colors, scale, complexity, rotation, shadow, outline) {
  ctx.fillStyle = rgbStr(colors[3]);
  ctx.fillRect(0, 0, w, h);
  const count = Math.round(complexity * 80 + 60);
  const maxSize = scale * 0.7;
  const rng = (n) => { let x = Math.sin(n + 1) * 43758.5453; return x - Math.floor(x); };
  for (let i = 0; i < count; i++) {
    const x = rng(i * 7.3) * w;
    const y = rng(i * 3.7) * h;
    const size = maxSize * (0.2 + rng(i * 11.1) * 0.8);
    const rot = rng(i * 5.9) * Math.PI * 2 + rotation * Math.PI / 180;
    const c = colors[i % 3];
    const shape = Math.floor(rng(i * 2.3) * 5);
    if (shadow) { ctx.shadowColor = 'rgba(0,0,0,0.2)'; ctx.shadowBlur = 8; ctx.shadowOffsetX = 3; ctx.shadowOffsetY = 3; }
    ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${0.6 + rng(i * 4.1) * 0.4})`;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.beginPath();
    if (shape === 0) {
      ctx.rect(-size/2, -size/4, size, size/2);
    } else if (shape === 1) {
      ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
    } else if (shape === 2) {
      ctx.moveTo(0, -size/2); ctx.lineTo(size/2, size/2); ctx.lineTo(-size/2, size/2); ctx.closePath();
    } else if (shape === 3) {
      for (let s = 0; s < 5; s++) {
        const a = s * Math.PI * 2 / 5 - Math.PI / 2;
        const b = a + Math.PI / 5;
        ctx.lineTo(Math.cos(a)*size*0.5, Math.sin(a)*size*0.5);
        ctx.lineTo(Math.cos(b)*size*0.2, Math.sin(b)*size*0.2);
      }
      ctx.closePath();
    } else {
      ctx.ellipse(0, 0, size * 0.5, size * 0.2, 0, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
    if (outline) { ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.lineWidth = 1; ctx.stroke(); }
    ctx.restore();
  }
}

const DRAW_FNS = {
  geometric: drawGeometric,
  waves: drawWaves,
  dots: drawDots,
  stripes: drawStripes,
  mosaic: drawMosaic,
  noise: drawStarburst,
  hexagons: drawHexagons,
  triangles: drawTriangles,
  gradient: drawGradientWall,
  chevron: drawChevron,
  mandala: drawMandala,
  isometric: drawIsometric,
  circuit: drawCircuit,
  aurora: drawAurora,
  confetti: drawConfetti,
};

function applyVignette(ctx, w, h, strength) {
  const grad = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, Math.max(w, h) * 0.7);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(0.6, 'rgba(0,0,0,0)');
  grad.addColorStop(1, `rgba(0,0,0,${strength})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

function generateWallpaper() {
  try {
    const scale = parseInt(scaleSlider.value) || 60;
    const complexity = parseInt(complexSlider.value) || 5;
    const rotation = parseInt(rotSlider.value) || 0;
    const shadowEl = document.getElementById('wg-shadow');
    const outlineEl = document.getElementById('wg-outline');
    const vignetteEl = document.getElementById('wg-vignette');
    const opacityEl = document.getElementById('wg-opacity');
    const hasShadow = shadowEl ? shadowEl.checked : false;
    const hasOutline = outlineEl ? outlineEl.checked : false;
    const hasVignette = vignetteEl ? vignetteEl.checked : false;
    const opacity = opacityEl ? parseInt(opacityEl.value) / 100 : 1;
    const colors = [
      hexToRgb(c1El ? c1El.value : '#ff6b9d'),
      hexToRgb(c2El ? c2El.value : '#ffe547'),
      hexToRgb(c3El ? c3El.value : '#5effc8'),
      hexToRgb(c4El ? c4El.value : '#c9b8ff'),
    ];
    const safeColors = colors.map(c => (Array.isArray(c) && c.length === 3) ? c : [128,128,128]);
    wgCanvas.width = wgW;
    wgCanvas.height = wgH;
    const ctx = wgCanvas.getContext('2d');
    // Fill bg first
    ctx.fillStyle = rgbStr(safeColors[3]);
    ctx.fillRect(0, 0, wgW, wgH);
    // Draw pattern with opacity
    ctx.globalAlpha = opacity;
    const drawFn = DRAW_FNS[wgPattern] || drawGeometric;
    drawFn(ctx, wgW, wgH, safeColors, scale, complexity, rotation, hasShadow, hasOutline);
    ctx.globalAlpha = 1;
    // Post-effects
    if (hasVignette) applyVignette(ctx, wgW, wgH, 0.55);
    wgPlaceholder.style.display = 'none';
    wgCanvas.style.display = 'block';
    if (wgCanvasOverlay) wgCanvasOverlay.style.display = 'flex';
    if (wgPreviewMeta) wgPreviewMeta.textContent = wgPattern.charAt(0).toUpperCase() + wgPattern.slice(1) + ' · ' + wgW + '×' + wgH;
    wgGenerated = true;
  } catch(e) {
    console.error('Wallpaper generation error:', e);
    alert('Generation failed: ' + e.message);
  }
}

document.getElementById('wg-generate-btn').addEventListener('click', generateWallpaper);

wgDlPng.addEventListener('click', () => {
  if (!wgGenerated) return;
  const a = document.createElement('a');
  a.download = `wallcon-${wgPattern}-${wgW}x${wgH}.png`;
  a.href = wgCanvas.toDataURL('image/png');
  a.click();
  showToast('⬇ PNG downloaded!');
});

wgDlJpg.addEventListener('click', () => {
  if (!wgGenerated) return;
  const a = document.createElement('a');
  a.download = `wallcon-${wgPattern}-${wgW}x${wgH}.jpg`;
  a.href = wgCanvas.toDataURL('image/jpeg', 0.95);
  a.click();
  showToast('⬇ JPG downloaded!');
});

wgDlCopy.addEventListener('click', () => {
  if (!wgGenerated) return;
  wgCanvas.toBlob(async (blob) => {
    try {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      showToast('⎘ Copied to clipboard!');
    } catch(e) {
      // Fallback: open in new tab
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      showToast('↗ Opened in new tab (copy manually)');
    }
  }, 'image/png');
});

// ─────────── Accordion ───────────
function toggleAcc(id) {
  const el = document.getElementById(id);
  el.classList.toggle('open');
}
// Open colors by default
document.addEventListener('DOMContentLoaded', () => {
  const acc = document.getElementById('acc-colors');
  if (acc) acc.classList.add('open');
});

