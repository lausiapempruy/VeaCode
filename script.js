/* ============================================================
   CODETESTER — script.js
============================================================ */

/* ---- DEFAULT TEMPLATES ---- */
const TEMPLATES = {
  html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>My Page</title>
</head>
<body>

  <h1>Hello, World!</h1>
  <p>Edit HTML, CSS, dan JS lalu klik <strong>Run</strong>.</p>
  <button id="btn">Klik aku</button>

</body>
</html>`,

  css: `/* Styles */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Segoe UI', sans-serif;
  background: #f5f5f5;
  color: #1a1a1a;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  gap: 16px;
  padding: 20px;
}

h1 {
  font-size: 2.5rem;
  font-weight: 700;
  letter-spacing: -0.03em;
}

p {
  color: #666;
  font-size: 1rem;
}

#btn {
  padding: 10px 24px;
  background: #7c6aff;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: transform 0.15s;
}

#btn:hover {
  transform: translateY(-2px);
}`,

  js: `// JavaScript
const btn = document.getElementById('btn');
let count = 0;

btn.addEventListener('click', () => {
  count++;
  btn.textContent = \`Diklik \${count}x\`;
  console.log('Button clicked! Count:', count);
});

console.log('Script loaded!');`
};

/* ---- STATE ---- */
const LS_KEY = 'codetester_code';
let activeTab = 'html';
let codes = { html: '', css: '', js: '' };
let logCount = 0;

/* ---- DOM REFS ---- */
const tabBtns       = document.querySelectorAll('.tab');
const codeArea      = document.getElementById('codeArea');
const lineNums      = document.getElementById('lineNums');
const previewFrame  = document.getElementById('previewFrame');
const previewStatus = document.getElementById('previewStatus');
const previewPlaceholder = document.getElementById('previewPlaceholder');
const runOverlay    = document.getElementById('runOverlay');
const runLabel      = document.getElementById('runLabel');
const consoleOutput = document.getElementById('consoleOutput');
const consoleCount  = document.getElementById('consoleCount');
const editorZone    = document.getElementById('editorZone');
const previewZone   = document.getElementById('previewZone');
const consoleZone   = document.getElementById('consoleZone');
const dragHandle    = document.getElementById('dragHandle');

/* ============================================================
   INIT
============================================================ */
function init() {
  loadFromStorage();
  setActiveTab('html');
  updateLayout();
  setupDrag();
  setupEvents();
}

/* ---- LOAD / SAVE ---- */
function loadFromStorage() {
  try {
    const saved = JSON.parse(localStorage.getItem(LS_KEY));
    if (saved && saved.html !== undefined) {
      codes = { html: saved.html ?? TEMPLATES.html, css: saved.css ?? TEMPLATES.css, js: saved.js ?? TEMPLATES.js };
    } else {
      codes = { html: TEMPLATES.html, css: TEMPLATES.css, js: TEMPLATES.js };
    }
  } catch {
    codes = { html: TEMPLATES.html, css: TEMPLATES.css, js: TEMPLATES.js };
  }
}

function saveToStorage() {
  try { localStorage.setItem(LS_KEY, JSON.stringify(codes)); } catch {}
}

/* ---- TABS ---- */
function setActiveTab(tab) {
  activeTab = tab;
  tabBtns.forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  codeArea.value = codes[tab];
  updateLineNums();
  codeArea.focus();
}

/* ---- LINE NUMBERS ---- */
function updateLineNums() {
  const lines = codeArea.value.split('\n').length;
  lineNums.innerHTML = Array.from({ length: lines }, (_, i) =>
    `<span class="line-num">${i + 1}</span>`
  ).join('');
  syncScroll();
}

function syncScroll() {
  lineNums.scrollTop = codeArea.scrollTop;
}

/* ---- LAYOUT CALCULATION ---- */
const TOPBAR_H  = 52;
const CONSOLE_H = 160;
let editorH = null; // null = auto 45vh

function updateLayout() {
  const vh = window.innerHeight;
  const avail = vh - TOPBAR_H - CONSOLE_H - 8; // 8 = handle height
  const eH = editorH !== null
    ? Math.max(80, Math.min(editorH, avail - 80))
    : Math.floor(vh * 0.38);
  const pTop = TOPBAR_H + eH + 8;
  const pH = avail - eH;

  editorZone.style.top     = `${TOPBAR_H}px`;
  editorZone.style.height  = `${eH}px`;
  dragHandle.style.top     = `${TOPBAR_H + eH}px`;
  previewZone.style.top    = `${pTop}px`;
  previewZone.style.height = `${pH}px`;
  consoleZone.style.height = `${CONSOLE_H}px`;
}

/* ---- DRAG HANDLE ---- */
function setupDrag() {
  let dragging = false, startY = 0, startEH = 0;

  function onDown(e) {
    dragging = true;
    startY  = e.clientY ?? e.touches?.[0].clientY;
    startEH = editorZone.offsetHeight;
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
  }
  function onMove(e) {
    if (!dragging) return;
    const y = e.clientY ?? e.touches?.[0].clientY;
    editorH = startEH + (y - startY);
    updateLayout();
  }
  function onUp() {
    dragging = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }

  dragHandle.addEventListener('mousedown',  onDown);
  dragHandle.addEventListener('touchstart', onDown, { passive: true });
  document.addEventListener('mousemove',  onMove);
  document.addEventListener('touchmove',  onMove, { passive: true });
  document.addEventListener('mouseup',   onUp);
  document.addEventListener('touchend',  onUp);
}

/* ============================================================
   RUN PREVIEW
============================================================ */
function runPreview() {
  previewStatus.className = 'preview-status loading';
  runOverlay.classList.add('active');
  runLabel.textContent = 'Compiling...';

  // save current tab before running
  codes[activeTab] = codeArea.value;
  saveToStorage();

  setTimeout(() => {
    runLabel.textContent = 'Rendering...';
  }, 600);

  setTimeout(() => {
    buildPreview();
    runOverlay.classList.remove('active');
  }, 1400 + Math.random() * 600); // 1.4s - 2s
}

function buildPreview() {
  clearConsole(false);

  const html = codes.html;
  const css  = codes.css;
  const js   = codes.js;

  // Inject CSS & JS into HTML
  const consoleShim = `
<script>
(function(){
  const _send = function(type, args) {
    const msg = Array.from(args).map(a => {
      try { return (typeof a === 'object') ? JSON.stringify(a, null, 2) : String(a); }
      catch { return String(a); }
    }).join(' ');
    window.parent.postMessage({ type: 'console', level: type, msg }, '*');
  };
  ['log','info','warn','error'].forEach(m => {
    const orig = console[m].bind(console);
    console[m] = function() { _send(m, arguments); orig.apply(console, arguments); };
  });
  window.addEventListener('error', function(e) {
    window.parent.postMessage({ type: 'jserror', msg: e.message + (e.filename ? ' (' + e.lineno + ':' + e.colno + ')' : '') }, '*');
  });
  window.addEventListener('unhandledrejection', function(e) {
    window.parent.postMessage({ type: 'jserror', msg: 'Unhandled Promise: ' + e.reason }, '*');
  });
})();
<\/script>`;

  // Build full document
  let doc = html;

  // inject style before </head> or at start of body
  const styleTag = `<style>\n${css}\n</style>`;
  const scriptTag = `${consoleShim}<script>\n${js}\n<\/script>`;

  if (/<\/head>/i.test(doc)) {
    doc = doc.replace(/<\/head>/i, `${styleTag}\n</head>`);
  } else {
    doc = styleTag + '\n' + doc;
  }

  if (/<\/body>/i.test(doc)) {
    doc = doc.replace(/<\/body>/i, `${scriptTag}\n</body>`);
  } else {
    doc += '\n' + scriptTag;
  }

  previewFrame.srcdoc = doc;
  previewFrame.classList.add('visible');
  previewPlaceholder.style.display = 'none';
  previewStatus.className = 'preview-status ok';
}

/* ============================================================
   CONSOLE
============================================================ */
window.addEventListener('message', (e) => {
  if (!e.data || !e.data.type) return;
  if (e.data.type === 'console') {
    addConsoleLog(e.data.level, e.data.msg);
  }
  if (e.data.type === 'jserror') {
    addConsoleLog('error', e.data.msg);
    previewStatus.className = 'preview-status error';
  }
});

function addConsoleLog(level, msg) {
  const prefixes = { log: '›', info: 'ℹ', warn: '⚠', error: '✕' };
  const div = document.createElement('div');
  div.className = `console-line log-${level}`;
  div.innerHTML = `<span class="console-prefix">${prefixes[level] || '›'}</span><span class="console-msg">${escHtml(msg)}</span>`;
  consoleOutput.appendChild(div);
  consoleOutput.scrollTop = consoleOutput.scrollHeight;
  logCount++;
  consoleCount.textContent = logCount;
  consoleCount.classList.add('visible');
}

function clearConsole(resetCount = true) {
  consoleOutput.innerHTML = '';
  if (resetCount) {
    logCount = 0;
    consoleCount.classList.remove('visible');
  }
  const wel = document.createElement('div');
  wel.className = 'console-welcome';
  wel.textContent = '// Console output akan muncul di sini';
  consoleOutput.appendChild(wel);
}

function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

/* ============================================================
   EVENTS
============================================================ */
function setupEvents() {
  // Tab switching
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      codes[activeTab] = codeArea.value;
      saveToStorage();
      setActiveTab(btn.dataset.tab);
    });
  });

  // Code input
  codeArea.addEventListener('input', () => {
    codes[activeTab] = codeArea.value;
    updateLineNums();
    saveToStorage();
  });

  // Sync scroll for line numbers
  codeArea.addEventListener('scroll', syncScroll);

  // Tab key → indent
  codeArea.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = codeArea.selectionStart;
      const end   = codeArea.selectionEnd;
      const val   = codeArea.value;
      if (e.shiftKey) {
        // Unindent
        const lineStart = val.lastIndexOf('\n', start - 1) + 1;
        if (val.substring(lineStart, lineStart + 2) === '  ') {
          codeArea.value = val.slice(0, lineStart) + val.slice(lineStart + 2);
          codeArea.selectionStart = codeArea.selectionEnd = start - 2;
        }
      } else {
        codeArea.value = val.slice(0, start) + '  ' + val.slice(end);
        codeArea.selectionStart = codeArea.selectionEnd = start + 2;
      }
      codes[activeTab] = codeArea.value;
      updateLineNums();
      saveToStorage();
    }

    // Ctrl/Cmd+Enter = Run
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      runPreview();
    }

    // Auto-close brackets
    const pairs = { '(':')', '[':']', '{':'}', '"':'"', "'":"'", '`':'`' };
    if (pairs[e.key]) {
      e.preventDefault();
      const s = codeArea.selectionStart;
      const selected = codeArea.value.slice(s, codeArea.selectionEnd);
      const ins = e.key + selected + pairs[e.key];
      document.execCommand('insertText', false, ins);
      codeArea.selectionStart = codeArea.selectionEnd = s + 1;
      codes[activeTab] = codeArea.value;
      updateLineNums();
      saveToStorage();
    }
  });

  // Run button
  document.getElementById('btnRun').addEventListener('click', runPreview);

  // Clear current tab
  document.getElementById('btnClear').addEventListener('click', () => {
    codeArea.value = '';
    codes[activeTab] = '';
    updateLineNums();
    saveToStorage();
  });

  // Reset to template
  document.getElementById('btnReset').addEventListener('click', () => {
    codes = { html: TEMPLATES.html, css: TEMPLATES.css, js: TEMPLATES.js };
    setActiveTab(activeTab);
    saveToStorage();
  });

  // Console clear
  document.getElementById('consoleClear').addEventListener('click', () => clearConsole(true));

  // Refresh preview
  document.getElementById('btnRefresh').addEventListener('click', runPreview);

  // Fullscreen toggle
  document.getElementById('btnFullscreen').addEventListener('click', () => {
    previewZone.classList.toggle('fullscreen');
    const isFS = previewZone.classList.contains('fullscreen');
    document.getElementById('btnFullscreen').title = isFS ? 'Exit Fullscreen' : 'Fullscreen preview';
    if (isFS) {
      document.addEventListener('keydown', exitFullscreenOnEsc);
    } else {
      document.removeEventListener('keydown', exitFullscreenOnEsc);
    }
  });

  // Resize
  window.addEventListener('resize', updateLayout);
}

function exitFullscreenOnEsc(e) {
  if (e.key === 'Escape') {
    previewZone.classList.remove('fullscreen');
    document.removeEventListener('keydown', exitFullscreenOnEsc);
  }
}

/* ============================================================
   KEYBOARD SHORTCUT HINT in topbar
============================================================ */
(function injectShortcutHint() {
  const hint = document.createElement('span');
  hint.style.cssText = 'font-family:var(--font-mono);font-size:0.65rem;color:var(--text3);letter-spacing:0.04em;white-space:nowrap';
  hint.textContent = 'Ctrl+Enter to run';
  document.querySelector('.topbar-right').prepend(hint);
})();

/* ---- KICK OFF ---- */
init();
