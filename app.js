/* ================================================================
   VEACODE 2.0 — app.js
   Complete application logic for all pages.
   No backend. localStorage only.
================================================================ */

'use strict';

/* ================================================================
   CONSTANTS
================================================================ */
const LS = {
  USER:     'vea2_user',
  SESSION:  'vea2_session',
  ACTIVITY: 'vea2_activity',
};

const PAGE = {
  IS_LANDING:   document.body.classList.contains('') && !!document.getElementById('featGrid'),
  IS_LOGIN:     !!document.getElementById('authCard'),
  IS_DASHBOARD: !!document.getElementById('actList'),
  IS_EDITOR:    !!document.getElementById('edTa'),
  IS_SETTINGS:  !!document.getElementById('panelAccount'),
  IS_DOCS:      !!document.querySelector('.doc-content'),
  IS_TOS:       !!document.querySelector('.tos-body'),
};

/* ================================================================
   UTILS
================================================================ */
const VEA = {

  /* ---- STORAGE ---- */
  get(key) {
    try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
  },
  set(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); return true; } catch { return false; }
  },
  remove(key) {
    try { localStorage.removeItem(key); } catch {}
  },

  /* ---- CURRENT USER ---- */
  user() { return VEA.get(LS.USER); },
  session() { return VEA.get(LS.SESSION); },
  isLoggedIn() {
    const u = VEA.user(); const s = VEA.session();
    return !!(u && s && s.username === u.username);
  },

  /* ---- SHA-256 (pure JS for browser) ---- */
  async sha256(str) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
  },

  /* ---- TOAST ---- */
  toast(msg, type='') {
    const wrap = document.getElementById('veaToasts');
    if (!wrap) return;
    const t = document.createElement('div');
    t.className = 'v-toast' + (type ? ' '+type : '');
    t.textContent = msg;
    wrap.appendChild(t);
    setTimeout(() => t.remove(), 3200);
  },

  /* ---- LOADER ---- */
  loaderOn(msg='Memproses...') {
    const el = document.getElementById('vLoader');
    const msg_el = document.getElementById('vLoaderMsg');
    const bar = document.getElementById('vLoaderBar');
    if (!el) return;
    if (msg_el) msg_el.textContent = msg;
    if (bar) bar.style.width = '0%';
    el.classList.add('on');
  },
  loaderProgress(pct, msg) {
    const bar = document.getElementById('vLoaderBar');
    const msg_el = document.getElementById('vLoaderMsg');
    if (bar) bar.style.width = pct + '%';
    if (msg && msg_el) msg_el.textContent = msg;
  },
  loaderOff() {
    const el = document.getElementById('vLoader');
    if (el) el.classList.remove('on');
  },

  /* ---- MODAL ---- */
  openModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('on');
  },
  closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('on');
  },

  /* ---- LOG ACTIVITY ---- */
  logActivity(msg) {
    const acts = VEA.get(LS.ACTIVITY) || [];
    acts.unshift({ msg, ts: new Date().toISOString() });
    if (acts.length > 20) acts.splice(20);
    VEA.set(LS.ACTIVITY, acts);
  },

  /* ---- STORAGE SIZE ---- */
  storageSize() {
    let total = 0;
    for (const k in localStorage) {
      if (!localStorage.hasOwnProperty(k)) continue;
      total += (localStorage[k].length + k.length) * 2;
    }
    if (total < 1024) return total + ' B';
    if (total < 1024*1024) return (total/1024).toFixed(1) + ' KB';
    return (total/(1024*1024)).toFixed(2) + ' MB';
  },

  /* ---- RELATIVE TIME ---- */
  relTime(iso) {
    if (!iso) return '—';
    const diff = Date.now() - new Date(iso).getTime();
    const sec = Math.floor(diff/1000);
    if (sec < 60)    return 'baru saja';
    if (sec < 3600)  return Math.floor(sec/60) + ' menit lalu';
    if (sec < 86400) return Math.floor(sec/3600) + ' jam lalu';
    return Math.floor(sec/86400) + ' hari lalu';
  },

  /* ---- FORMAT DATE ---- */
  fmtDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'});
  },

  /* ---- BUILD PIN ROW ---- */
  buildPinRow(containerId) {
    const row = document.getElementById(containerId);
    if (!row) return;
    row.innerHTML = '';
    for (let i = 0; i < 10; i++) {
      const inp = document.createElement('input');
      inp.type = 'password';
      inp.maxLength = 1;
      inp.className = 'pin-cell';
      inp.inputMode = 'numeric';
      inp.pattern = '[0-9]';
      inp.dataset.i = i;
      inp.addEventListener('input', e => {
        const val = e.target.value.replace(/\D/g,'');
        e.target.value = val;
        e.target.classList.toggle('filled', !!val);
        if (val && i < 9) {
          row.children[i+1].focus();
        }
      });
      inp.addEventListener('keydown', e => {
        if (e.key === 'Backspace' && !inp.value && i > 0) {
          row.children[i-1].focus();
          row.children[i-1].value = '';
          row.children[i-1].classList.remove('filled');
        }
      });
      row.appendChild(inp);
    }
  },

  getPinValue(containerId) {
    const row = document.getElementById(containerId);
    if (!row) return '';
    return Array.from(row.children).map(c => c.value).join('');
  },

  clearPinRow(containerId) {
    const row = document.getElementById(containerId);
    if (!row) return;
    Array.from(row.children).forEach(c => { c.value=''; c.classList.remove('filled'); });
    if (row.children[0]) row.children[0].focus();
  },

  /* ---- UPDATE NAV USER ---- */
  updateNavUser() {
    const user = VEA.user();
    const navAvInit = document.getElementById('navAvInit');
    const navAvImg  = document.getElementById('navAvImg');
    const navUname  = document.getElementById('navUname');
    if (!user) return;
    if (navUname)  navUname.textContent = user.display_name || user.username;
    if (navAvInit) navAvInit.textContent = (user.display_name || user.username).charAt(0).toUpperCase();
    if (navAvImg && user.avatar) {
      navAvImg.src = user.avatar;
      navAvImg.style.display = 'block';
      if (navAvInit) navAvInit.style.display = 'none';
    }
  },

  /* ---- REDIRECT IF NOT LOGGED IN ---- */
  requireLogin() {
    if (!VEA.isLoggedIn()) { window.location.href = 'login.html'; }
  },
};

/* ================================================================
   LANDING PAGE
================================================================ */
if (PAGE.IS_LANDING) {
  (async () => {
    // update nav auth button
    const navAuth = document.getElementById('navAuthBtn');
    if (VEA.isLoggedIn() && navAuth) {
      navAuth.textContent = 'Dashboard';
      navAuth.href = 'dashboard.html';
    }

    try {
      const cfg = await fetch('config.json').then(r=>r.json());
      // render features
      const fg = document.getElementById('featGrid');
      if (fg && cfg.features) {
        cfg.features.forEach((f, i) => {
          const card = document.createElement('div');
          card.className = 'fc glass';
          card.style.animationDelay = `${i*0.07}s`;
          card.style.animation = `fcIn 0.45s cubic-bezier(0.22,1,0.36,1) ${i*0.07}s both`;
          card.innerHTML = `<div class="fc-ico">${f.icon}</div><div class="fc-name">${f.title}</div><div class="fc-desc">${f.desc}</div>`;
          fg.appendChild(card);
        });
        const st = document.createElement('style');
        st.textContent = '@keyframes fcIn{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}';
        document.head.appendChild(st);
      }
      // render files
      const fr = document.getElementById('filesRow');
      if (fr && cfg.supported_files) {
        cfg.supported_files.forEach(f => {
          const pill = document.createElement('div');
          pill.className = 'fp glass';
          pill.innerHTML = `<div class="fp-dot" style="background:${f.color};box-shadow:0 0 7px ${f.color}55"></div><div><div class="fp-ext">.${f.ext}</div><div class="fp-lbl">${f.label}</div></div>`;
          fr.appendChild(pill);
        });
      }
    } catch(e) {
      // fallback — render inline
      const fg = document.getElementById('featGrid');
      if (fg) fg.innerHTML = '<p style="color:var(--w3);font-size:0.8rem">Features loaded inline.</p>';
    }
  })();
}

/* ================================================================
   LOGIN PAGE
================================================================ */
if (PAGE.IS_LOGIN) {

  const VAL = window.VAL = {
    mode: new URLSearchParams(location.search).get('m') === 'register' ? 'register' : 'login',
    regStep: 0,
    avatarB64: null,

    switchTab(m) {
      VAL.mode = m;
      document.getElementById('tLogin').classList.toggle('on', m==='login');
      document.getElementById('tRegister').classList.toggle('on', m==='register');
      document.getElementById('acMode').textContent = m==='login' ? 'Selamat datang kembali' : 'Buat akun baru';
      document.getElementById('sLoginForm').classList.toggle('on', m==='login');
      document.getElementById('footLogin').style.display = m==='login' ? '' : 'none';
      document.getElementById('footReg').style.display   = m==='register' ? '' : 'none';
      if (m==='register') { VAL.regStep=0; VAL.showRegStep(0); }
    },

    showRegStep(s) {
      VAL.regStep = s;
      ['sReg1','sReg2','sReg3'].forEach((id,i) => {
        document.getElementById(id).classList.toggle('on', i===s);
      });
      document.getElementById('btnBack').style.display = s>0 ? '' : 'none';
      document.getElementById('btnNext').textContent = s===2 ? 'Buat Akun' : 'Lanjut →';
    },
  };

  // init
  VAL.switchTab(VAL.mode);

  // Build all PIN rows
  ['lPinRow','rPin1Row','rPin2Row'].forEach(id => VEA.buildPinRow(id));

  // Avatar upload
  const avFile = document.getElementById('avFile');
  if (avFile) {
    avFile.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        VAL.avatarB64 = ev.target.result;
        const img = document.getElementById('avPreviewImg');
        const plus = document.getElementById('avPlus');
        if (img) { img.src = ev.target.result; img.style.display='block'; }
        if (plus) plus.style.display='none';
      };
      reader.readAsDataURL(file);
    });
  }

  // Register: NEXT button
  document.getElementById('btnNext')?.addEventListener('click', async () => {
    if (VAL.regStep === 0) {
      // validate username
      const user = document.getElementById('rUser')?.value.trim();
      if (!user || !/^[a-zA-Z0-9_]{3,32}$/.test(user)) {
        document.getElementById('rUserErr').classList.add('show');
        return;
      }
      document.getElementById('rUserErr').classList.remove('show');
      VAL.showRegStep(1);
    }
    else if (VAL.regStep === 1) {
      const p1 = VEA.getPinValue('rPin1Row');
      const p2 = VEA.getPinValue('rPin2Row');
      if (p1.length !== 10 || p2.length !== 10 || p1 !== p2) {
        document.getElementById('rPinErr').classList.add('show');
        return;
      }
      document.getElementById('rPinErr').classList.remove('show');
      VAL.showRegStep(2);
    }
    else if (VAL.regStep === 2) {
      if (!document.getElementById('tosOk')?.checked) {
        VEA.toast('Setujui Terms of Service terlebih dahulu.', 'err');
        return;
      }
      await VAL.doRegister();
    }
  });

  document.getElementById('btnBack')?.addEventListener('click', () => {
    if (VAL.regStep > 0) VAL.showRegStep(VAL.regStep - 1);
  });

  // Login button
  document.getElementById('btnLogin')?.addEventListener('click', () => VAL.doLogin());

  VAL.doRegister = async () => {
    const username    = document.getElementById('rUser')?.value.trim();
    const displayName = document.getElementById('rDisplay')?.value.trim() || username;
    const pin         = VEA.getPinValue('rPin1Row');

    VEA.loaderOn('Menyiapkan akun VeaCode...');
    VEA.loaderProgress(10, 'Memvalidasi data...');

    const existing = VEA.get(LS.USER);
    if (existing) {
      VEA.loaderOff();
      VEA.toast('Sudah ada akun di perangkat ini. Hapus akun lama dulu dari Settings.', 'err');
      return;
    }

    // animate progress 10→20→40→60→80→100 over 10–20 seconds
    const totalMs = 10000 + Math.random() * 10000;
    const steps = [
      { pct:20, msg:'Membuat hash PIN...',        at: totalMs*0.1 },
      { pct:40, msg:'Menyiapkan profil...',        at: totalMs*0.3 },
      { pct:60, msg:'Menulis ke localStorage...',  at: totalMs*0.55 },
      { pct:80, msg:'Memverifikasi akun...',        at: totalMs*0.75 },
      { pct:95, msg:'Hampir selesai...',            at: totalMs*0.9 },
    ];
    steps.forEach(s => setTimeout(() => VEA.loaderProgress(s.pct, s.msg), s.at));

    await new Promise(r => setTimeout(r, totalMs));

    const pinHash = await VEA.sha256(pin);
    const now = new Date().toISOString();
    const user = {
      username, display_name: displayName,
      avatar: VAL.avatarB64 || null,
      pin_hash: pinHash,
      created_at: now,
      updated_at: now,
    };
    VEA.set(LS.USER, user);
    VEA.set(LS.SESSION, { username, logged_at: now });
    VEA.set(LS.ACTIVITY, [{ msg: 'Akun dibuat', ts: now }]);

    VEA.loaderProgress(100, 'Akun siap!');
    await new Promise(r => setTimeout(r, 500));
    VEA.loaderOff();
    VEA.toast('Akun berhasil dibuat!', 'ok');
    setTimeout(() => window.location.href = 'dashboard.html', 600);
  };

  VAL.doLogin = async () => {
    const username = document.getElementById('lUser')?.value.trim();
    const pin      = VEA.getPinValue('lPinRow');
    const user     = VEA.get(LS.USER);

    document.getElementById('lUserErr').classList.remove('show');
    document.getElementById('lPinErr').classList.remove('show');

    if (!user || user.username !== username) {
      document.getElementById('lUserErr').classList.add('show');
      return;
    }
    const pinHash = await VEA.sha256(pin);
    if (pinHash !== user.pin_hash) {
      document.getElementById('lPinErr').classList.add('show');
      VEA.clearPinRow('lPinRow');
      return;
    }

    const now = new Date().toISOString();
    VEA.set(LS.SESSION, { username, logged_at: now });
    VEA.logActivity('Login berhasil');
    VEA.toast('Selamat datang kembali!', 'ok');
    setTimeout(() => window.location.href = 'dashboard.html', 400);
  };
}

/* ================================================================
   DASHBOARD PAGE
================================================================ */
if (PAGE.IS_DASHBOARD) {
  VEA.requireLogin();
  const user = VEA.user();

  // nav
  VEA.updateNavUser();

  // greeting
  const init = (user.display_name || user.username).charAt(0).toUpperCase();
  const greetInit = document.getElementById('greetInit');
  const greetAvImg = document.getElementById('greetAvImg');
  if (greetInit) greetInit.textContent = init;
  if (greetAvImg && user.avatar) {
    greetAvImg.src = user.avatar; greetAvImg.style.display = 'block';
    if (greetInit) greetInit.style.display = 'none';
  }

  const hour = new Date().getHours();
  const salut = hour<12 ? 'Selamat pagi' : hour<17 ? 'Selamat siang' : 'Selamat malam';
  const hi = document.getElementById('greetHi');
  if (hi) hi.textContent = `${salut}, ${user.display_name || user.username}!`;

  // stats
  const set = (id,v) => { const el=document.getElementById(id); if(el) el.textContent=v; };
  set('sUsername',  '@' + user.username);
  set('sCreated',   VEA.fmtDate(user.created_at));
  set('sStorage',   VEA.storageSize());
  const sess = VEA.session();
  set('sLastLogin', sess ? VEA.relTime(sess.logged_at) : '—');

  // activity
  const acts = VEA.get(LS.ACTIVITY) || [];
  const actList = document.getElementById('actList');
  if (actList) {
    if (!acts.length) {
      actList.innerHTML = '<div class="act-empty">Belum ada aktivitas.</div>';
    } else {
      acts.slice(0,8).forEach(a => {
        const row = document.createElement('div');
        row.className = 'act-row';
        row.innerHTML = `<span class="act-ico">·</span><span class="act-msg">${a.msg}</span><span class="act-ts">${VEA.relTime(a.ts)}</span>`;
        actList.appendChild(row);
      });
    }
  }
}

/* ================================================================
   EDITOR PAGE
================================================================ */
if (PAGE.IS_EDITOR) {

  const TEMPLATES = {
    'index.html': `<!DOCTYPE html>\n<html lang="id">\n<head>\n  <meta charset="UTF-8"/>\n  <title>My Project</title>\n</head>\n<body>\n\n  <h1>Hello, World!</h1>\n  <p>Edit kode lalu klik <strong>Run</strong>.</p>\n  <button id="btn">Klik aku</button>\n\n</body>\n</html>`,
    'style.css':  `* {\n  box-sizing: border-box;\n  margin: 0; padding: 0;\n}\n\nbody {\n  font-family: 'Segoe UI', sans-serif;\n  background: #f0f0f0;\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  min-height: 100vh;\n  gap: 16px;\n  padding: 20px;\n}\n\nh1 {\n  font-size: 2.4rem;\n  font-weight: 700;\n  color: #111;\n}\n\n#btn {\n  padding: 10px 24px;\n  background: #4f6fff;\n  color: #fff;\n  border: none;\n  border-radius: 8px;\n  font-size: 1rem;\n  cursor: pointer;\n  transition: transform 0.15s;\n}\n#btn:hover { transform: translateY(-2px); }`,
    'script.js':  `const btn = document.getElementById('btn');\nlet count = 0;\n\nbtn.addEventListener('click', () => {\n  count++;\n  btn.textContent = \`Diklik \${count}x\`;\n  console.log('Count:', count);\n});\n\nconsole.log('VeaCode 2.0 — Script loaded!');`,
  };

  const FILE_EXT_COLOR = { html:'#e96c3b', css:'#38b8ff', js:'#f0db4f', json:'#7ee787', py:'#4ebeff', txt:'#888' };
  function extColor(name) { const e=name.split('.').pop().toLowerCase(); return FILE_EXT_COLOR[e]||'#aaa'; }
  function defaultContent(name) {
    if (TEMPLATES[name]) return TEMPLATES[name];
    const e=name.split('.').pop().toLowerCase();
    if (e==='html') return `<!DOCTYPE html>\n<html>\n<head><title>${name}</title></head>\n<body>\n\n</body>\n</html>`;
    if (e==='css')  return `/* ${name} */\n`;
    if (e==='js')   return `// ${name}\n`;
    if (e==='json') return `{\n  \n}`;
    if (e==='py')   return `# ${name}\n# Python preview only — not executed\n`;
    return '';
  }

  let files = { 'index.html': TEMPLATES['index.html'], 'style.css': TEMPLATES['style.css'], 'script.js': TEMPLATES['script.js'] };
  let activeFile = 'index.html';
  let logCount = 0;

  const edTa   = document.getElementById('edTa');
  const edLnum = document.getElementById('edLnum');
  const prevFrame = document.getElementById('prevFrame');
  const prevEmpty = document.getElementById('prevEmpty');
  const sdotSt    = document.getElementById('sdotSt');
  const conBody   = document.getElementById('conBody');
  const logBadge  = document.getElementById('logBadge');
  const flashBar  = document.getElementById('flashBar');

  function saveActive() { if (activeFile) files[activeFile] = edTa.value; }
  function getFileByExt(ext) { const e=Object.entries(files).find(([n])=>n.endsWith('.'+ext)); return e?e[1]:null; }

  function switchFile(name) {
    saveActive(); activeFile = name;
    edTa.value = files[name] || '';
    renderLineNums(); renderTabs(); renderSidebar(); edTa.focus();
  }

  function renderLineNums() {
    const n = edTa.value.split('\n').length;
    edLnum.innerHTML = Array.from({length:n},(_,i)=>`<span class="lnum-n">${i+1}</span>`).join('');
    edLnum.scrollTop = edTa.scrollTop;
  }

  function renderSidebar() {
    const sb = document.getElementById('sbFiles');
    if (!sb) return;
    sb.innerHTML = '';
    Object.keys(files).forEach(name => {
      const item = document.createElement('div');
      item.className = 'sf' + (name===activeFile?' on':'');
      item.innerHTML = `<div class="sf-dot" style="background:${extColor(name)}"></div><span class="sf-name" title="${name}">${name}</span><button class="sf-del" data-n="${name}">✕</button>`;
      item.querySelector('.sf-name').addEventListener('click', ()=>switchFile(name));
      item.querySelector('.sf-del').addEventListener('click', e=>{ e.stopPropagation(); removeFile(name); });
      sb.appendChild(item);
    });
  }

  function renderTabs() {
    const tabs = document.getElementById('etbTabs');
    if (!tabs) return;
    tabs.innerHTML = '';
    Object.keys(files).forEach(name => {
      const tab = document.createElement('div');
      tab.className = 'ftab' + (name===activeFile?' on':'');
      tab.innerHTML = `<div class="ftab-dot" style="background:${extColor(name)}"></div><span>${name}</span><button class="ftab-close" data-n="${name}">✕</button>`;
      tab.querySelector('span').addEventListener('click', ()=>switchFile(name));
      tab.querySelector('.ftab-close').addEventListener('click', e=>{ e.stopPropagation(); removeFile(name); });
      tabs.appendChild(tab);
    });
  }

  function addFile(name, content) {
    name = name.trim().replace(/\s+/g,'-');
    if (!name.includes('.')) name += '.html';
    files[name] = content !== undefined ? content : defaultContent(name);
    renderSidebar(); renderTabs(); switchFile(name);
  }

  function removeFile(name) {
    if (Object.keys(files).length <= 1) { VEA.toast('Minimal harus ada 1 file.', 'err'); return; }
    delete files[name];
    if (activeFile === name) { activeFile = Object.keys(files)[0]; edTa.value = files[activeFile]; }
    renderLineNums(); renderSidebar(); renderTabs();
  }

  // RUN
  function runPreview() {
    saveActive();
    flashBar.style.width='0%'; flashBar.style.transition='none';
    requestAnimationFrame(()=>{ flashBar.style.transition='width 0.38s cubic-bezier(0.22,1,0.36,1)'; flashBar.style.width='100%'; });
    setTimeout(()=>{ flashBar.style.width='0%'; flashBar.style.transition='none'; }, 450);

    sdotSt.className = 'sdot-st run';
    clearConsole(false);

    const html = getFileByExt('html') || '<html><body></body></html>';
    const css  = Object.entries(files).filter(([n])=>n.endsWith('.css')).map(([,v])=>v).join('\n');
    const js   = Object.entries(files).filter(([n])=>n.endsWith('.js')).map(([,v])=>v).join('\n');

    const SHIM = `<script>(function(){const _p=function(l,a){const m=Array.from(a).map(x=>{try{return typeof x==='object'?JSON.stringify(x,null,2):String(x);}catch{return '[?]';}}).join(' ');window.parent.postMessage({type:'__vea_log',level:l,msg:m},'*');};['log','info','warn','error'].forEach(m=>{const o=console[m].bind(console);console[m]=function(){_p(m,arguments);o.apply(console,arguments);};});window.addEventListener('error',e=>{window.parent.postMessage({type:'__vea_err',msg:e.message+' (line '+e.lineno+')'},'*');});window.addEventListener('unhandledrejection',e=>{window.parent.postMessage({type:'__vea_err',msg:'Unhandled: '+e.reason},'*');});})();<\/script>`;

    let doc = html;
    if (css) { const s=`<style>\n${css}\n</style>`; doc=/<\/head>/i.test(doc)?doc.replace(/<\/head>/i,s+'\n</head>'):s+'\n'+doc; }
    const scriptEl = SHIM + `<script>\n${js}\n<\/script>`;
    doc = /<\/body>/i.test(doc)?doc.replace(/<\/body>/i,scriptEl+'\n</body>'):doc+'\n'+scriptEl;

    const delay = 200 + Math.random()*200;
    setTimeout(()=>{
      try {
        prevFrame.srcdoc = doc;
        prevFrame.classList.add('show');
        prevEmpty.style.display = 'none';
        sdotSt.className = 'sdot-st ok';
      } catch(e) {
        sdotSt.className = 'sdot-st err';
        addLog('error', 'Build failed: '+e.message);
      }
    }, delay);
  }

  // CONSOLE
  window.addEventListener('message', e => {
    if (!e.data) return;
    if (e.data.type==='__vea_log') addLog(e.data.level, e.data.msg);
    if (e.data.type==='__vea_err') { addLog('error', e.data.msg); sdotSt.className='sdot-st err'; }
  });

  const ICONS = { log:'›', info:'ℹ', warn:'⚠', error:'✕' };
  function addLog(level, msg) {
    const ph = conBody.querySelector('.con-ph');
    if (ph) ph.remove();
    const line = document.createElement('div');
    line.className = `cline ${level}`;
    line.innerHTML = `<span class="cline-ic">${ICONS[level]||'›'}</span><span class="cline-msg">${msg.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</span>`;
    conBody.appendChild(line);
    conBody.scrollTop = conBody.scrollHeight;
    logCount++;
    logBadge.textContent = logCount; logBadge.classList.add('show');
  }

  function clearConsole(resetCount=true) {
    conBody.innerHTML = '<div class="con-ph">// output muncul di sini</div>';
    if (resetCount) { logCount=0; logBadge.classList.remove('show'); }
  }

  // DIVIDERS
  (function setupDividers() {
    // H divider (editor width)
    const hDiv = document.getElementById('hDiv');
    const edPane = document.getElementById('edPane');
    const outPane = document.getElementById('outPane');
    let draggingH=false, sx=0, sw=0;
    hDiv.addEventListener('mousedown', e=>{ draggingH=true; sx=e.clientX; sw=edPane.offsetWidth; document.body.style.cursor='col-resize'; document.body.style.userSelect='none'; });
    document.addEventListener('mousemove', e=>{ if(!draggingH)return; const total=edPane.parentElement.offsetWidth-hDiv.offsetWidth; const nw=Math.max(180,Math.min(total-180,sw+(e.clientX-sx))); edPane.style.flex='none'; edPane.style.width=nw+'px'; outPane.style.flex='none'; outPane.style.width=(total-nw)+'px'; });
    document.addEventListener('mouseup',()=>{ if(draggingH){draggingH=false;document.body.style.cursor='';document.body.style.userSelect='';} });

    // V divider (preview/console height)
    const vDiv = document.getElementById('vDiv');
    const prevPane = document.getElementById('prevPane');
    const conPane  = document.getElementById('conPane');
    let draggingV=false, sy=0, sh=0;
    vDiv.addEventListener('mousedown', e=>{ draggingV=true; sy=e.clientY; sh=prevPane.offsetHeight; document.body.style.cursor='row-resize'; document.body.style.userSelect='none'; });
    document.addEventListener('mousemove', e=>{ if(!draggingV)return; const total=outPane.offsetHeight-vDiv.offsetHeight; const nh=Math.max(70,Math.min(total-70,sh+(e.clientY-sy))); prevPane.style.flex='none'; prevPane.style.height=nh+'px'; conPane.style.flex='none'; conPane.style.height=(total-nh)+'px'; });
    document.addEventListener('mouseup',()=>{ if(draggingV){draggingV=false;document.body.style.cursor='';document.body.style.userSelect='';} });
  })();

  // ADD FILE MODAL
  let selExt = 'html';
  const addModal = document.getElementById('addModal');
  document.getElementById('addFileBtn')?.addEventListener('click', ()=>{ document.getElementById('newFileName').value=''; VEA.openModal('addModal'); setTimeout(()=>document.getElementById('newFileName').focus(),100); });
  document.getElementById('closeModal')?.addEventListener('click', ()=>VEA.closeModal('addModal'));
  document.getElementById('cancelModal')?.addEventListener('click', ()=>VEA.closeModal('addModal'));
  addModal?.addEventListener('click', e=>{ if(e.target===addModal) VEA.closeModal('addModal'); });
  document.querySelectorAll('#ftChips .ft-chip').forEach(c=>{
    c.addEventListener('click',()=>{
      selExt=c.dataset.e;
      document.querySelectorAll('#ftChips .ft-chip').forEach(x=>x.classList.remove('on'));
      c.classList.add('on');
      const inp=document.getElementById('newFileName');
      const base=inp.value.replace(/\.[^.]+$/,'')||'new-file';
      inp.value=base+'.'+selExt;
    });
  });
  document.getElementById('confirmModal')?.addEventListener('click',()=>{
    const name=document.getElementById('newFileName')?.value.trim();
    if(name){ addFile(name); VEA.closeModal('addModal'); }
  });
  document.getElementById('newFileName')?.addEventListener('keydown',e=>{ if(e.key==='Enter') document.getElementById('confirmModal')?.click(); if(e.key==='Escape') VEA.closeModal('addModal'); });

  // EVENTS
  document.getElementById('runBtn')?.addEventListener('click', runPreview);
  document.getElementById('btnRefresh')?.addEventListener('click', runPreview);
  document.getElementById('btnClearCon')?.addEventListener('click', ()=>clearConsole(true));
  document.getElementById('btnFs')?.addEventListener('click', ()=>{
    const pp=document.getElementById('prevPane');
    const fs=pp.classList.toggle('fs');
    if(!fs){pp.style.height='';pp.style.flex='';}
  });

  edTa.addEventListener('input', ()=>{ files[activeFile]=edTa.value; renderLineNums(); });
  edTa.addEventListener('scroll', ()=>{ edLnum.scrollTop=edTa.scrollTop; });

  edTa.addEventListener('keydown', e=>{
    if ((e.ctrlKey||e.metaKey) && e.key==='Enter') { e.preventDefault(); runPreview(); return; }
    if (e.key==='Tab') {
      e.preventDefault();
      const s=edTa.selectionStart, v=edTa.value;
      if (e.shiftKey) { const ls=v.lastIndexOf('\n',s-1)+1; if(v.substring(ls,ls+2)==='  '){ edTa.value=v.slice(0,ls)+v.slice(ls+2); edTa.selectionStart=edTa.selectionEnd=Math.max(ls,s-2); } }
      else { edTa.value=v.slice(0,s)+'  '+v.slice(edTa.selectionEnd); edTa.selectionStart=edTa.selectionEnd=s+2; }
      files[activeFile]=edTa.value; renderLineNums(); return;
    }
    if (e.key==='Escape') { const pp=document.getElementById('prevPane'); if(pp.classList.contains('fs')){ pp.classList.remove('fs'); pp.style.height=''; pp.style.flex=''; } return; }
    const P={'(':')','{':'}','[':']','"':'"',"'":"'"};
    if (P[e.key]) {
      e.preventDefault();
      const s=edTa.selectionStart,en=edTa.selectionEnd,v=edTa.value,sel=v.slice(s,en);
      document.execCommand('insertText',false,e.key+sel+P[e.key]);
      edTa.selectionStart=edTa.selectionEnd=s+1;
      files[activeFile]=edTa.value; renderLineNums();
    }
  });

  // init
  renderTabs(); renderSidebar(); switchFile('index.html');
}

/* ================================================================
   SETTINGS PAGE
================================================================ */
if (PAGE.IS_SETTINGS) {
  VEA.requireLogin();
  VEA.updateNavUser();

  const VS = window.VS = {
    switchTab(t) {
      document.getElementById('tabAccount').classList.toggle('on',  t==='account');
      document.getElementById('tabSecurity').classList.toggle('on', t==='security');
      document.getElementById('panelAccount').classList.toggle('on',  t==='account');
      document.getElementById('panelSecurity').classList.toggle('on', t==='security');
    },
  };

  // Build PIN rows
  ['ucPinRow','pcPin1Row','pcPin2Row','pcPin3Row','delPinRow'].forEach(id => VEA.buildPinRow(id));

  // Check hash param
  if (location.hash === '#security') VS.switchTab('security');

  const user = VEA.user();

  // Populate current user data
  const set = (id,v) => { const el=document.getElementById(id); if(el) el.textContent=v; };
  const setVal = (id,v) => { const el=document.getElementById(id); if(el) el.value=v; };

  setVal('displayNameInput', user.display_name || '');
  const ucCur = document.getElementById('ucCurDisplay');
  if (ucCur) ucCur.textContent = '@' + user.username;

  // Avatar
  const avBigImg  = document.getElementById('avBigImg');
  const avBigInit = document.getElementById('avBigInit');
  if (avBigInit) avBigInit.textContent = (user.display_name||user.username).charAt(0).toUpperCase();
  const avBigName = document.getElementById('avBigName');
  if (avBigName) avBigName.textContent = user.display_name || user.username;
  if (avBigImg && user.avatar) { avBigImg.src=user.avatar; avBigImg.style.display='block'; if(avBigInit) avBigInit.style.display='none'; }

  // avatar upload
  const avFileInput = document.getElementById('avFileInput');
  if (avFileInput) {
    avFileInput.addEventListener('change', e=>{
      const file=e.target.files[0]; if(!file)return;
      const reader=new FileReader();
      reader.onload=ev=>{
        const u=VEA.get(LS.USER);
        u.avatar=ev.target.result; VEA.set(LS.USER,u);
        if(avBigImg){avBigImg.src=ev.target.result;avBigImg.style.display='block';}
        if(avBigInit) avBigInit.style.display='none';
        VEA.toast('Foto profil diperbarui.','ok');
        VEA.logActivity('Foto profil diubah');
        VEA.updateNavUser();
      };
      reader.readAsDataURL(file);
    });
  }

  // remove avatar
  document.getElementById('btnRemoveAv')?.addEventListener('click',()=>{
    const u=VEA.get(LS.USER); u.avatar=null; VEA.set(LS.USER,u);
    if(avBigImg){avBigImg.src='';avBigImg.style.display='none';}
    if(avBigInit) avBigInit.style.display='';
    VEA.toast('Foto profil dihapus.','ok'); VEA.logActivity('Foto profil dihapus');
  });

  // save display name
  document.getElementById('btnSaveDisplay')?.addEventListener('click',()=>{
    const val=document.getElementById('displayNameInput')?.value.trim();
    const u=VEA.get(LS.USER); u.display_name=val||u.username; VEA.set(LS.USER,u);
    VEA.toast('Display name disimpan.','ok'); VEA.logActivity('Display name diubah');
    VEA.updateNavUser();
  });

  // username change
  document.getElementById('btnUnlockUsername')?.addEventListener('click',()=>{
    document.getElementById('ucLocked').style.display='none';
    document.getElementById('ucForm').classList.add('show');
  });
  document.getElementById('btnCancelUc')?.addEventListener('click',()=>{
    document.getElementById('ucLocked').style.display='';
    document.getElementById('ucForm').classList.remove('show');
    VEA.clearPinRow('ucPinRow');
  });
  document.getElementById('btnConfirmUc')?.addEventListener('click', async ()=>{
    const newUser=document.getElementById('ucNewInput')?.value.trim();
    const pin=VEA.getPinValue('ucPinRow');
    const u=VEA.get(LS.USER);

    document.getElementById('ucNewErr').classList.remove('show');
    document.getElementById('ucPinErr').classList.remove('show');

    if (!newUser||!/^[a-zA-Z0-9_]{3,32}$/.test(newUser)) { document.getElementById('ucNewErr').classList.add('show'); return; }
    const pinHash=await VEA.sha256(pin);
    if (pinHash!==u.pin_hash) { document.getElementById('ucPinErr').classList.add('show'); VEA.clearPinRow('ucPinRow'); return; }

    u.username=newUser; u.display_name=u.display_name||newUser; VEA.set(LS.USER,u);
    VEA.set(LS.SESSION,{username:newUser,logged_at:new Date().toISOString()});
    VEA.logActivity('Username diubah ke @'+newUser);
    const ucCurEl=document.getElementById('ucCurDisplay'); if(ucCurEl) ucCurEl.textContent='@'+newUser;
    document.getElementById('ucLocked').style.display='';
    document.getElementById('ucForm').classList.remove('show');
    VEA.toast('Username berhasil diubah.','ok'); VEA.updateNavUser();
  });

  // change PIN
  document.getElementById('btnOpenPinChange')?.addEventListener('click',()=>{
    document.getElementById('pinChangeForm').classList.add('show');
  });
  document.getElementById('btnCancelPinChange')?.addEventListener('click',()=>{
    document.getElementById('pinChangeForm').classList.remove('show');
    ['pcPin1Row','pcPin2Row','pcPin3Row'].forEach(id=>VEA.clearPinRow(id));
  });
  document.getElementById('btnConfirmPinChange')?.addEventListener('click', async ()=>{
    const p1=VEA.getPinValue('pcPin1Row');
    const p2=VEA.getPinValue('pcPin2Row');
    const p3=VEA.getPinValue('pcPin3Row');
    const u=VEA.get(LS.USER);

    document.getElementById('pcOldErr').classList.remove('show');
    document.getElementById('pcMatchErr').classList.remove('show');

    const oldHash=await VEA.sha256(p2);
    if (oldHash!==u.pin_hash) { document.getElementById('pcOldErr').classList.add('show'); VEA.clearPinRow('pcPin2Row'); return; }
    if (p1!==p3||p1.length!==10) { document.getElementById('pcMatchErr').classList.add('show'); return; }

    VEA.loaderOn('Mengubah PIN...');
    const steps=[{pct:30,msg:'Membuat hash PIN baru...',at:2000},{pct:60,msg:'Memperbarui akun...',at:5000},{pct:90,msg:'Hampir selesai...',at:8500}];
    steps.forEach(s=>setTimeout(()=>VEA.loaderProgress(s.pct,s.msg),s.at));
    await new Promise(r=>setTimeout(r,10000));

    const newHash=await VEA.sha256(p1);
    u.pin_hash=newHash; VEA.set(LS.USER,u);
    VEA.remove(LS.SESSION);
    VEA.loaderProgress(100,'PIN berhasil diubah!');
    VEA.logActivity('PIN diubah');
    await new Promise(r=>setTimeout(r,500));
    VEA.loaderOff();
    VEA.toast('PIN diubah. Silakan login ulang.','ok');
    setTimeout(()=>window.location.href='login.html',800);
  });

  // EXPORT
  document.getElementById('btnExport')?.addEventListener('click', async ()=>{
    VEA.loaderOn('Menyiapkan ekspor data...');
    const steps=[{pct:30,msg:'Mengumpulkan data...',at:1500},{pct:60,msg:'Memformat JSON...',at:4000},{pct:90,msg:'Hampir selesai...',at:7000}];
    steps.forEach(s=>setTimeout(()=>VEA.loaderProgress(s.pct,s.msg),s.at));
    const delay=5000+Math.random()*5000;
    await new Promise(r=>setTimeout(r,delay));

    const data={
      _version:'vea2_export_v1',
      exported_at:new Date().toISOString(),
      user:VEA.get(LS.USER),
      activity:VEA.get(LS.ACTIVITY)||[],
    };
    const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download=`veacode-backup-${Date.now()}.json`;
    a.click();
    VEA.loaderProgress(100,'Ekspor selesai!');
    await new Promise(r=>setTimeout(r,400));
    VEA.loaderOff(); VEA.toast('Data berhasil diekspor.','ok'); VEA.logActivity('Data diekspor');
  });

  // IMPORT
  const importFile=document.getElementById('importFileInput');
  document.getElementById('btnImport')?.addEventListener('click',()=>importFile?.click());
  importFile?.addEventListener('change', async e=>{
    const file=e.target.files[0]; if(!file)return;
    const reader=new FileReader();
    reader.onload=async ev=>{
      VEA.loaderOn('Mengimpor data...');
      const steps=[{pct:15,msg:'Membaca file...',at:2000},{pct:35,msg:'Memvalidasi data...',at:6000},{pct:60,msg:'Menerapkan data...',at:12000},{pct:85,msg:'Memverifikasi...',at:18000}];
      steps.forEach(s=>setTimeout(()=>VEA.loaderProgress(s.pct,s.msg),s.at));
      const delay=20000+Math.random()*10000;
      await new Promise(r=>setTimeout(r,delay));
      try {
        const parsed=JSON.parse(ev.target.result);
        if (!parsed._version||!parsed.user) throw new Error('Format tidak valid');
        VEA.set(LS.USER,parsed.user);
        if(parsed.activity) VEA.set(LS.ACTIVITY,parsed.activity);
        VEA.remove(LS.SESSION);
        VEA.loaderProgress(100,'Impor selesai!');
        await new Promise(r=>setTimeout(r,400));
        VEA.loaderOff(); VEA.toast('Data berhasil diimpor. Silakan login ulang.','ok');
        setTimeout(()=>window.location.href='login.html',800);
      } catch(err) {
        VEA.loaderOff(); VEA.toast('File tidak valid: '+err.message,'err');
      }
    };
    reader.readAsText(file);
    e.target.value='';
  });

  // LOGOUT
  document.getElementById('btnLogout')?.addEventListener('click',()=>{
    VEA.remove(LS.SESSION); VEA.logActivity('Logout');
    VEA.toast('Berhasil logout.','ok');
    setTimeout(()=>window.location.href='login.html',500);
  });

  // DELETE ACCOUNT
  document.getElementById('btnDeleteAccount')?.addEventListener('click',()=>VEA.openModal('deleteModal'));
  document.getElementById('btnConfirmDelete')?.addEventListener('click', async ()=>{
    const pin=VEA.getPinValue('delPinRow');
    const u=VEA.get(LS.USER);
    const pinHash=await VEA.sha256(pin);
    if(pinHash!==u.pin_hash){ document.getElementById('delPinErr').classList.add('show'); VEA.clearPinRow('delPinRow'); return; }
    VEA.remove(LS.USER); VEA.remove(LS.SESSION); VEA.remove(LS.ACTIVITY);
    VEA.closeModal('deleteModal');
    VEA.toast('Akun berhasil dihapus.','ok');
    setTimeout(()=>window.location.href='index.html',700);
  });
}

/* ================================================================
   DOCS PAGE
================================================================ */
if (PAGE.IS_DOCS) {
  // accordion
  document.querySelectorAll('.qa-item').forEach(item=>{
    const q=item.querySelector('.qa-q');
    if(!q)return;
    q.addEventListener('click',()=>{
      const wasOpen=item.classList.contains('open');
      // close all in same block
      item.closest('.qa-block')?.querySelectorAll('.qa-item.open').forEach(i=>i.classList.remove('open'));
      if(!wasOpen) item.classList.add('open');
    });
  });

  // smooth scroll for nav links
  document.querySelectorAll('.doc-nav-link').forEach(link=>{
    link.addEventListener('click',e=>{
      const href=link.getAttribute('href');
      if(href&&href.startsWith('#')){
        e.preventDefault();
        document.querySelector(href)?.scrollIntoView({behavior:'smooth',block:'start'});
        document.querySelectorAll('.doc-nav-link').forEach(l=>l.classList.remove('cur'));
        link.classList.add('cur');
      }
    });
  });

  // auth button
  const navAuth=document.getElementById('navAuthBtn');
  if(navAuth && VEA.isLoggedIn()){ navAuth.textContent='Dashboard'; navAuth.href='dashboard.html'; }
}

/* ================================================================
   TOS / LANDING — auth nav button
================================================================ */
if (PAGE.IS_TOS) {
  const navAuth=document.getElementById('navAuthBtn');
  if(navAuth && VEA.isLoggedIn()){ navAuth.textContent='Dashboard'; navAuth.href='dashboard.html'; }
}
