/* Glamis Staff Help: unlocks the encrypted content bundle and renders it. */
(function () {
  'use strict';
  var VER = 'ac177f2bcf';
  var K_KEY = 'gdrh.k', K_SALT = 'gdrh.s', K_LANG = 'gdrh.lang', K_CL = 'gdrh.cl.';
  var GROUPS = ['checklist', 'howto', 'handbook', 'quickref'];

  var T = {
    en: {
      app: 'Staff Help', appShort: 'Staff Help', lockSub: 'Glamis Dunes Rentals · staff only', pw: 'Staff password', show: 'Show',
      remember: 'Remember this device', unlock: 'Unlock', working: 'Unlocking…',
      wrong: "That password didn't work. Check it and try again.",
      offline: "Can't load the site right now. Check your connection and try again.",
      old: 'This browser is too old to open the site. Update it, or use Chrome or Safari.',
      fine: 'For Glamis Dunes Rentals staff only. Ask a manager for the password.',
      search: 'Search', searchPh: 'Search checklists, how-tos, the handbook…', noRes: 'No results. Try fewer or different words.',
      typeMore: 'Type a word or two, like "hold", "cancel" or "propane".',
      menu: 'Menu', close: 'Close', otp: 'On this page', updated: 'Updated', prev: 'Previous', next: 'Next',
      groups: { checklist: 'Counter checklists', howto: 'How-to guides', handbook: 'Staff Handbook', quickref: 'Quick references' },
      groupDesc: {
        checklist: 'Tap through each rental, step by step.',
        howto: 'How to do things in each program we use.',
        handbook: 'Every policy and procedure, chapter by chapter.',
        quickref: 'Prices and rules at a glance.'
      },
      home: 'Home', lock: 'Lock this device', print: 'Print this page',
      clear: 'Clear', clearAgain: 'Tap again to clear', done: 'done', of: 'of',
      homeTitle: 'How can we help?', homeSub: 'Checklists, how-tos and the full Staff Handbook, in English and Spanish.',
      untranslated: "This page isn't in Spanish yet, so it's showing in English.",
      notFound: "That page doesn't exist.", backHome: 'Go to the home page',
      foot: 'Glamis Dunes Rentals · glamisrent.com · (760) 573-6825 · Staff only',
      built: 'Site updated',
      dl: 'Download PDF', dlCap: 'The one-page sheet, to print and fill in by hand.', dlWorking: 'Preparing…', dlFail: "Couldn't download it. Check your connection and try again."
    },
    es: {
      app: 'Ayuda al personal', appShort: 'Ayuda', lockSub: 'Glamis Dunes Rentals · solo personal', pw: 'Contraseña del personal', show: 'Ver',
      remember: 'Recordar este dispositivo', unlock: 'Entrar', working: 'Abriendo…',
      wrong: 'Esa contraseña no funcionó. Revísala e inténtalo otra vez.',
      offline: 'No se puede cargar el sitio ahora. Revisa tu conexión e inténtalo otra vez.',
      old: 'Este navegador es muy antiguo para abrir el sitio. Actualízalo o usa Chrome o Safari.',
      fine: 'Solo para el personal de Glamis Dunes Rentals. Pide la contraseña a un gerente.',
      search: 'Buscar', searchPh: 'Busca en listas, guías y el manual…', noRes: 'Sin resultados. Prueba con menos palabras u otras.',
      typeMore: 'Escribe una o dos palabras, como "retención", "cancelar" o "propano".',
      menu: 'Menú', close: 'Cerrar', otp: 'En esta página', updated: 'Actualizado', prev: 'Anterior', next: 'Siguiente',
      groups: { checklist: 'Listas de mostrador', howto: 'Guías de programas', handbook: 'Manual del personal', quickref: 'Referencias rápidas' },
      groupDesc: {
        checklist: 'Cada renta, paso a paso. Toca para marcar.',
        howto: 'Cómo hacer las cosas en cada programa que usamos.',
        handbook: 'Todas las políticas y procedimientos, capítulo por capítulo.',
        quickref: 'Precios y reglas de un vistazo.'
      },
      home: 'Inicio', lock: 'Bloquear este dispositivo', print: 'Imprimir esta página',
      clear: 'Borrar', clearAgain: 'Toca otra vez para borrar', done: 'listos', of: 'de',
      homeTitle: '¿En qué te ayudamos?', homeSub: 'Listas, guías y el manual completo del personal, en inglés y español.',
      untranslated: 'Esta página aún no está en español, así que se muestra en inglés.',
      notFound: 'Esa página no existe.', backHome: 'Ir al inicio',
      foot: 'Glamis Dunes Rentals · glamisrent.com · (760) 573-6825 · Solo personal',
      built: 'Sitio actualizado',
      dl: 'Descargar PDF', dlCap: 'La hoja de una página, para imprimir y llenar a mano.', dlWorking: 'Preparando…', dlFail: 'No se pudo descargar. Revisa tu conexión e inténtalo otra vez.'
    }
  };

  var DATA = null, LANG = 'en', IDX = {}, RAWKEY = null, app = document.getElementById('app');

  /* ---------- storage (never throws) ---------- */
  function sget(k) { try { return localStorage.getItem(k) || sessionStorage.getItem(k); } catch (e) { return null; } }
  function sset(k, v, persist) {
    try { (persist ? localStorage : sessionStorage).setItem(k, v); } catch (e) {}
  }
  function sdel(k) { try { localStorage.removeItem(k); sessionStorage.removeItem(k); } catch (e) {} }

  try {
    var l = localStorage.getItem(K_LANG);
    LANG = l === 'es' || l === 'en' ? l : ((navigator.language || '').toLowerCase().indexOf('es') === 0 ? 'es' : 'en');
  } catch (e) {}
  function t(k) { return T[LANG][k]; }

  /* ---------- crypto ---------- */
  function b64d(s) { var b = atob(s), u = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; }
  function b64e(u) { var s = ''; for (var i = 0; i < u.length; i++) s += String.fromCharCode(u[i]); return btoa(s); }
  function derive(pw, blob) {
    return crypto.subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveBits']).then(function (base) {
      return crypto.subtle.deriveBits({ name: 'PBKDF2', salt: b64d(blob.salt), iterations: blob.iter, hash: 'SHA-256' }, base, 256);
    }).then(function (bits) { return new Uint8Array(bits); });
  }
  function openBlob(raw, blob) {
    return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['decrypt']).then(function (key) {
      return crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64d(blob.iv) }, key, b64d(blob.ct));
    }).then(function (pt) {
      return JSON.parse(new TextDecoder().decode(fflate.gunzipSync(new Uint8Array(pt))));
    });
  }

  /* ---------- helpers ---------- */
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  var EDGE = '<svg class="edge" viewBox="0 0 816 14" preserveAspectRatio="none" aria-hidden="true"><path d="M0 0 H816 V5 L790 10 L764 4 L736 11 L708 5 L682 9 L654 3 L626 10 L600 5 L572 12 L544 4 L518 9 L490 3 L462 10 L436 5 L408 11 L380 4 L354 9 L326 3 L298 10 L272 5 L244 12 L216 4 L190 9 L162 3 L134 10 L108 5 L80 11 L52 4 L26 9 L0 4 Z" fill="#3A352A"></path></svg>';
  var ICON = {
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>'
  };
  function langToggle() {
    return '<div class="langtog" role="group" aria-label="Language / Idioma">' +
      '<button type="button" data-lang="en" aria-pressed="' + (LANG === 'en') + '">EN</button>' +
      '<button type="button" data-lang="es" aria-pressed="' + (LANG === 'es') + '">ES</button></div>';
  }
  function bindLang(root, after) {
    $$('[data-lang]', root).forEach(function (b) {
      b.addEventListener('click', function () {
        LANG = b.getAttribute('data-lang');
        try { localStorage.setItem(K_LANG, LANG); } catch (e) {}
        document.documentElement.lang = LANG;
        after();
      });
    });
  }

  /* ---------- boot ---------- */
  var BLOB = null;
  function boot() {
    document.documentElement.lang = LANG;
    if (!window.crypto || !crypto.subtle || !window.TextDecoder || !window.fflate) { app.innerHTML = '<div class="loading">' + esc(t('old')) + '</div>'; return; }
    fetch('site.dat?v=' + VER, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error('http ' + r.status); return r.json();
    }).then(function (blob) {
      BLOB = blob;
      var saved = sget(K_KEY), salt = sget(K_SALT);
      if (saved && salt === blob.salt) {
        return openBlob(b64d(saved), blob).then(function (d) { DATA = d; RAWKEY = b64d(saved); start(); }).catch(function () { sdel(K_KEY); sdel(K_SALT); showLock(); });
      }
      showLock();
    }).catch(function () { app.innerHTML = '<div class="loading">' + esc(t('offline')) + '</div>'; });
  }

  function showLock(errMsg) {
    app.innerHTML =
      '<div class="lock"><div class="lock-card">' +
      '<div class="lock-logo"><img src="assets/img/logo-600.png" alt="Glamis Dunes Rentals"></div>' +
      '<h1>' + esc(t('app')) + '</h1><p class="sub">' + esc(t('lockSub')) + '</p>' +
      '<form id="lockf" autocomplete="on">' +
      '<label class="pw" for="pw">' + esc(t('pw')) + '</label>' +
      '<input id="pw" name="password" type="password" autocomplete="current-password" autocapitalize="none" autocorrect="off" spellcheck="false" required>' +
      '<div class="row"><input id="rem" type="checkbox" checked><label for="rem">' + esc(t('remember')) + '</label></div>' +
      '<button class="go" type="submit">' + esc(t('unlock')) + '</button>' +
      '<p class="err" role="alert">' + (errMsg ? esc(errMsg) : '') + '</p></form>' +
      '<div class="lang">' + langToggle() + '</div>' +
      '<p class="fine">' + esc(t('fine')) + '</p></div></div>';
    bindLang(app, function () { showLock(); });
    var f = $('#lockf'), pw = $('#pw'), btn = $('.go'), err = $('.err');
    setTimeout(function () { pw.focus(); }, 50);
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var val = pw.value.trim().toLowerCase();
      if (!val) return;
      btn.disabled = true; btn.textContent = t('working'); err.textContent = '';
      var raw;
      derive(val, BLOB).then(function (r) { raw = r; return openBlob(r, BLOB); }).then(function (d) {
        var keep = $('#rem').checked;
        sset(K_KEY, b64e(raw), keep); sset(K_SALT, BLOB.salt, keep);
        DATA = d; RAWKEY = raw; start();
      }).catch(function () {
        btn.disabled = false; btn.textContent = t('unlock'); err.textContent = t('wrong'); pw.select();
      });
    });
  }

  /* ---------- app frame ---------- */
  function pagesFor(lang) { return (DATA.pages[lang] || {}); }
  function getPage(slug) {
    var p = pagesFor(LANG)[slug];
    if (p) return { p: p, fallback: false };
    p = pagesFor('en')[slug];
    return p ? { p: p, fallback: LANG !== 'en' } : null;
  }
  function slugsIn(group) {
    var en = pagesFor('en');
    return Object.keys(en).filter(function (s) { return en[s].group === group; })
      .sort(function (a, b) { return en[a].order - en[b].order; });
  }
  function navLabel(slug) { var g = getPage(slug); return g ? (g.p.nav || g.p.title) : slug; }

  function start() {
    document.documentElement.lang = LANG;
    app.innerHTML =
      '<header class="top">' +
      '<button class="iconbtn menubtn" type="button" id="menuBtn" aria-label="' + esc(t('menu')) + '" aria-controls="nav" aria-expanded="false">' + ICON.menu + '</button>' +
      '<a class="brand" href="#/"><img src="assets/img/logo-240.png" alt=""><span>' + esc(t('appShort')) + '</span></a>' +
      '<button class="iconbtn" type="button" id="srchBtn" aria-label="' + esc(t('search')) + '">' + ICON.search + '</button>' +
      langToggle() + '</header>' +
      '<div class="shell"><nav class="nav" id="nav" aria-label="' + esc(t('menu')) + '"></nav><div class="scrim hidden" id="scrim"></div>' +
      '<main id="main"></main></div>';
    bindLang($('.top'), function () { IDX = {}; start(); });
    $('#menuBtn').addEventListener('click', function () { toggleNav(true); });
    $('#scrim').addEventListener('click', function () { toggleNav(false); });
    $('#srchBtn').addEventListener('click', openSearch);
    document.onkeydown = function (e) {
      if (e.key === '/' && !/input|textarea/i.test((e.target.tagName || '')) && !$('.srch')) { e.preventDefault(); openSearch(); }
    };
    renderNav();
    window.onhashchange = route;
    route();
    if ('serviceWorker' in navigator && location.protocol === 'https:') { navigator.serviceWorker.register('sw.js').catch(function () {}); }
  }

  function toggleNav(open) {
    var nav = $('#nav'); if (!nav) return;
    nav.classList.toggle('open', open);
    $('#scrim').classList.toggle('hidden', !open);
    $('#menuBtn').setAttribute('aria-expanded', String(open));
  }

  function renderNav() {
    var cur = parseHash().slug, h = '<div class="navhead"><b>' + esc(t('menu')) + '</b><button class="iconbtn" type="button" id="navClose" aria-label="' + esc(t('close')) + '">' + ICON.close + '</button></div>';
    h += '<div class="navgrp"><a href="#/"' + (cur ? '' : ' aria-current="page"') + '>' + esc(t('home')) + '</a></div>';
    GROUPS.forEach(function (g) {
      var ss = slugsIn(g); if (!ss.length) return;
      h += '<div class="navgrp"><h4>' + esc(t('groups')[g]) + '</h4>';
      ss.forEach(function (s) { h += '<a href="#/' + s + '"' + (s === cur ? ' aria-current="page"' : '') + '>' + esc(navLabel(s)) + '</a>'; });
      h += '</div>';
    });
    h += '<div class="navfoot"><button type="button" id="printBtn">' + esc(t('print')) + '</button> <button type="button" id="lockBtn">' + esc(t('lock')) + '</button></div>';
    var nav = $('#nav'); nav.innerHTML = h;
    $('#navClose').addEventListener('click', function () { toggleNav(false); });
    $$('a', nav).forEach(function (a) { a.addEventListener('click', function () { toggleNav(false); }); });
    $('#lockBtn').addEventListener('click', function () { sdel(K_KEY); sdel(K_SALT); DATA = null; RAWKEY = null; IDX = {}; location.hash = ''; showLock(); });
    $('#printBtn').addEventListener('click', function () { toggleNav(false); setTimeout(function () { window.print(); }, 150); });
  }

  function parseHash() {
    var h = decodeURIComponent((location.hash || '').replace(/^#\/?/, ''));
    var parts = h.split('/').filter(Boolean);
    return { slug: parts[0] || '', sec: parts[1] || '' };
  }

  function route() {
    if (!DATA) return;
    var r = parseHash(), main = $('#main');
    renderNav();
    if (!r.slug) { renderHome(main); window.scrollTo(0, 0); return; }
    var g = getPage(r.slug);
    if (!g) { main.innerHTML = '<div class="page"><div class="content"><p class="lead">' + esc(t('notFound')) + '</p><p><a href="#/">' + esc(t('backHome')) + '</a></p></div></div>'; return; }
    renderPage(main, r.slug, g);
    if (r.sec) {
      var el = document.getElementById(r.sec);
      if (el) { setTimeout(function () { el.scrollIntoView({ block: 'start' }); }, 30); $$('.sec').forEach(function (s) { s.classList.remove('hit'); }); }
      else window.scrollTo(0, 0);
    } else window.scrollTo(0, 0);
  }

  function footer() {
    return '<div class="foot">' + esc(t('foot')) + (DATA.built ? '<br>' + esc(t('built')) + ' ' + esc(DATA.built) : '') + '</div>';
  }

  function renderHome(main) {
    var h = '<section class="home-hero"><img class="bg" src="assets/img/utv-sand.png" alt=""><div class="fade"></div><div class="in">' +
      '<h1>' + esc(t('homeTitle')) + '</h1><p>' + esc(t('homeSub')) + '</p>' +
      '<button type="button" class="searchbox" id="homeSearch">' + ICON.search + '<span>' + esc(t('searchPh')) + '</span></button></div></section>';
    h += '<div class="page">';
    GROUPS.forEach(function (g) {
      var ss = slugsIn(g); if (!ss.length) return;
      h += '<section class="homegrp"><h2>' + esc(t('groups')[g]) + '</h2><p class="cap" style="">' + esc(t('groupDesc')[g]) + '</p><div class="tiles">';
      ss.forEach(function (s) {
        var gp = getPage(s).p;
        h += '<a class="tile' + (g === 'checklist' ? ' big' : '') + '" href="#/' + s + '"><div class="tt">' + esc(gp.nav || gp.title) + '</div>' + (gp.summary ? '<div class="td">' + esc(gp.summary) + '</div>' : '') + '</a>';
      });
      h += '</div></section>';
    });
    h += '</div>' + footer();
    main.innerHTML = h.replace(/ style=""/g, '');
    $('#homeSearch').addEventListener('click', openSearch);
  }

  function renderPage(main, slug, g) {
    var p = g.p, grp = p.group;
    var ss = slugsIn(grp), i = ss.indexOf(slug), prev = ss[i - 1], next = ss[i + 1];
    var h = '<div class="band"><div class="band-in"><p class="kick">' + esc(t('groups')[grp] || '') + '</p><h1>' + esc(p.title) + '</h1>' +
      (p.summary ? '<p class="sum">' + esc(p.summary) + '</p>' : '') +
      (p.updated ? '<span class="upd">' + esc(t('updated')) + ' ' + esc(p.updated) + '</span>' : '') + '</div></div>' + EDGE;
    h += '<div class="page">' + (g.fallback ? '<p class="untranslated">' + esc(t('untranslated')) + '</p>' : '') +
      '<div class="content" id="content">' + p.html + '</div>';
    h += '<nav class="pn">' +
      (prev ? '<a href="#/' + prev + '"><small>‹ ' + esc(t('prev')) + '</small><span>' + esc(navLabel(prev)) + '</span></a>' : '') +
      (next ? '<a class="nx" href="#/' + next + '"><small>' + esc(t('next')) + ' ›</small><span>' + esc(navLabel(next)) + '</span></a>' : '') +
      '</nav></div>' + footer();
    main.innerHTML = h;
    if (p.pdf) addDownload($('#content'), p.pdf);
    enhance($('#content'), slug, grp);
  }

  /* ---------- printable PDF (encrypted like the site: dl/<name>.bin = 12-byte IV + AES-GCM ciphertext) ---------- */
  function addDownload(root, pdf) {
    var box = document.createElement('div'); box.className = 'dlbox';
    box.innerHTML = '<button type="button" class="btn solid">' + esc(t('dl')) + '</button><span class="cap">' + esc(t('dlCap')) + '</span>';
    var lead = $('.lead', root);
    if (lead && lead.parentNode === root) lead.after(box); else root.prepend(box);
    var btn = $('button', box);
    btn.addEventListener('click', function () {
      if (!RAWKEY) return;
      btn.disabled = true; btn.textContent = t('dlWorking');
      fetch(pdf.f).then(function (r) { if (!r.ok) throw new Error('http ' + r.status); return r.arrayBuffer(); }).then(function (buf) {
        var u = new Uint8Array(buf);
        return crypto.subtle.importKey('raw', RAWKEY, { name: 'AES-GCM' }, false, ['decrypt']).then(function (key) {
          return crypto.subtle.decrypt({ name: 'AES-GCM', iv: u.slice(0, 12) }, key, u.slice(12));
        });
      }).then(function (pt) {
        var url = URL.createObjectURL(new Blob([pt], { type: 'application/pdf' }));
        var a = document.createElement('a'); a.href = url; a.download = pdf.n; a.rel = 'noopener';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
        btn.disabled = false; btn.textContent = t('dl');
      }).catch(function () {
        btn.disabled = false; btn.textContent = t('dlFail');
        setTimeout(function () { btn.textContent = t('dl'); }, 4000);
      });
    });
  }

  /* ---------- page enhancements ---------- */
  function enhance(root, slug, grp) {
    // tables scroll sideways on phones
    $$('table', root).forEach(function (tb) {
      if (tb.parentNode.classList && tb.parentNode.classList.contains('tblwrap')) return;
      if (!tb.classList.contains('tbl')) tb.classList.add('tbl');
      var w = document.createElement('div'); w.className = 'tblwrap'; tb.parentNode.insertBefore(w, tb); w.appendChild(tb);
    });
    // continued step numbering: <ol class="steps" start="8">
    $$('ol.steps[start]', root).forEach(function (ol) {
      var n = parseInt(ol.getAttribute('start'), 10);
      if (n > 1) ol.style.counterReset = 'st ' + (n - 1);
    });
    // in-page table of contents
    var secs = $$('section.sec[id]', root).filter(function (s) { return $('h2', s); });
    if (secs.length > 2 && grp !== 'checklist') {
      var d = document.createElement('details'); d.className = 'otp';
      if (window.matchMedia && window.matchMedia('(min-width: 1100px)').matches) d.open = true;
      d.innerHTML = '<summary>' + esc(t('otp')) + '</summary><ol>' + secs.map(function (s) {
        return '<li><a href="#/' + slug + '/' + s.id + '">' + esc($('h2', s).textContent) + '</a></li>';
      }).join('') + '</ol>';
      var lead = $('.lead', root);
      if (lead && lead.parentNode === root) lead.after(d); else root.prepend(d);
    }
    // tick-box lists
    var items = $$('ul.checks > li', root), fields = $$('.fields input', root);
    if (!items.length && !fields.length) return;
    var key = K_CL + slug, st = {}, keep = grp === 'checklist';
    if (keep) { try { st = JSON.parse(localStorage.getItem(key) || '{}'); } catch (e) { st = {}; } }
    st.c = st.c || []; st.f = st.f || {};
    function save() { if (keep) { try { localStorage.setItem(key, JSON.stringify(st)); } catch (e) {} } update(); }
    var bar, count;
    function update() {
      if (!count) return;
      var n = items.filter(function (li) { return li.classList.contains('on'); }).length;
      count.textContent = n + ' ' + t('of') + ' ' + items.length + ' ' + t('done');
      bar.style.width = (items.length ? Math.round(100 * n / items.length) : 0) + '%';
    }
    items.forEach(function (li, i) {
      li.setAttribute('role', 'checkbox'); li.tabIndex = 0;
      var on = st.c.indexOf(i) > -1; li.classList.toggle('on', on); li.setAttribute('aria-checked', String(on));
      function flip(e) {
        if (e && e.target && e.target.closest && e.target.closest('a,input,button')) return;
        var now = !li.classList.contains('on'); li.classList.toggle('on', now); li.setAttribute('aria-checked', String(now));
        st.c = st.c.filter(function (x) { return x !== i; }); if (now) st.c.push(i); save();
      }
      li.addEventListener('click', flip);
      li.addEventListener('keydown', function (e) { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flip(); } });
    });
    fields.forEach(function (inp, i) {
      inp.value = st.f[i] || '';
      inp.addEventListener('input', function () { st.f[i] = inp.value; save(); });
    });
    if (keep) {
      var tools = document.createElement('div'); tools.className = 'cltools';
      tools.innerHTML = '<div class="clbar"><i></i></div><span class="clcount"></span><button type="button" class="btn">' + esc(t('clear')) + '</button>';
      root.prepend(tools);
      bar = $('.clbar i', tools); count = $('.clcount', tools);
      var cb = $('button', tools), armed = false, timer;
      cb.addEventListener('click', function () {
        if (!armed) { armed = true; cb.textContent = t('clearAgain'); cb.classList.add('solid'); timer = setTimeout(function () { armed = false; cb.textContent = t('clear'); cb.classList.remove('solid'); }, 3000); return; }
        clearTimeout(timer); armed = false; cb.textContent = t('clear'); cb.classList.remove('solid');
        st = { c: [], f: {} }; items.forEach(function (li) { li.classList.remove('on'); li.setAttribute('aria-checked', 'false'); }); fields.forEach(function (f) { f.value = ''; }); save();
      });
      update();
    }
  }

  /* ---------- search ---------- */
  function norm(s) { return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function buildIndex() {
    if (IDX[LANG]) return IDX[LANG];
    var out = [], tmp = document.createElement('div'), all = pagesFor('en');
    Object.keys(all).forEach(function (slug) {
      var g = getPage(slug); if (!g) return;
      tmp.innerHTML = g.p.html;
      var secs = $$('section.sec[id]', tmp);
      var pre = tmp.cloneNode(true); $$('section.sec', pre).forEach(function (s) { s.remove(); });
      var preText = pre.textContent.replace(/\s+/g, ' ').trim();
      out.push({ slug: slug, sec: '', page: g.p.title, title: g.p.title, text: (g.p.summary || '') + ' ' + preText, group: g.p.group });
      secs.forEach(function (s) {
        var h2 = $('h2', s), title = h2 ? h2.textContent.trim() : g.p.title;
        out.push({ slug: slug, sec: s.id, page: g.p.title, title: title, text: s.textContent.replace(/\s+/g, ' ').trim(), group: g.p.group });
      });
    });
    out.forEach(function (e) { e.n = norm(e.text); e.nt = norm(e.title); e.np = norm(e.page); });
    IDX[LANG] = out; return out;
  }
  function doSearch(q) {
    var terms = norm(q).split(/[^a-z0-9$%+.]+/).filter(function (x) { return x.length > 1 || /\d/.test(x); });
    if (!terms.length) return null;
    var res = [];
    buildIndex().forEach(function (e) {
      var score = 0, ok = true;
      terms.forEach(function (w) {
        var inT = e.nt.indexOf(w) > -1, inP = e.np.indexOf(w) > -1, c = 0, i = -1;
        while ((i = e.n.indexOf(w, i + 1)) > -1 && c < 20) c++;
        if (!inT && !c && !inP) ok = false;
        score += (inT ? 12 : 0) + (inP ? 3 : 0) + Math.min(c, 8);
      });
      if (ok) res.push({ e: e, s: score + (e.group === 'checklist' || e.group === 'howto' ? 1 : 0) });
    });
    res.sort(function (a, b) { return b.s - a.s; });
    return { terms: terms, list: res.slice(0, 40) };
  }
  function snippet(e, terms) {
    var i = -1;
    for (var k = 0; k < terms.length && i < 0; k++) i = e.n.indexOf(terms[k]);
    var start = Math.max(0, i - 60), s = e.text.slice(start, start + 180);
    var out = esc((start > 0 ? '…' : '') + s + (start + 180 < e.text.length ? '…' : ''));
    terms.forEach(function (w) {
      if (w.length < 2) return;
      var re = new RegExp('(' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig');
      out = out.replace(re, '<mark>$1</mark>');
    });
    return out;
  }
  function openSearch() {
    if ($('.srch')) return;
    var d = document.createElement('div'); d.className = 'srch'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true'); d.setAttribute('aria-label', t('search'));
    d.innerHTML = '<div class="srch-in"><div class="srch-top">' + ICON.search +
      '<input type="search" id="sq" placeholder="' + esc(t('searchPh')) + '" aria-label="' + esc(t('search')) + '" autocomplete="off" autocapitalize="none" spellcheck="false">' +
      '<button class="iconbtn" type="button" id="sclose" aria-label="' + esc(t('close')) + '">' + ICON.close + '</button></div>' +
      '<div class="srch-res" id="sres"><p class="srch-empty">' + esc(t('typeMore')) + '</p></div></div>';
    document.body.appendChild(d);
    var q = $('#sq'), resEl = $('#sres'), sel = -1;
    function close() { d.remove(); document.removeEventListener('keydown', onKey, true); }
    function onKey(e) {
      if (e.key === 'Escape') { close(); }
      var links = $$('a', resEl);
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault(); sel = Math.max(0, Math.min(links.length - 1, sel + (e.key === 'ArrowDown' ? 1 : -1)));
        links.forEach(function (a, i) { a.classList.toggle('sel', i === sel); }); if (links[sel]) links[sel].scrollIntoView({ block: 'nearest' });
      }
      if (e.key === 'Enter' && document.activeElement === q) { e.preventDefault(); var a = links[Math.max(sel, 0)]; if (a) { location.hash = a.getAttribute('href'); close(); } }
    }
    document.addEventListener('keydown', onKey, true);
    $('#sclose').addEventListener('click', close);
    d.addEventListener('click', function (e) { if (e.target === d) close(); });
    var timer;
    q.addEventListener('input', function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        sel = -1;
        var r = doSearch(q.value);
        if (!r) { resEl.innerHTML = '<p class="srch-empty">' + esc(t('typeMore')) + '</p>'; return; }
        if (!r.list.length) { resEl.innerHTML = '<p class="srch-empty">' + esc(t('noRes')) + '</p>'; return; }
        resEl.innerHTML = r.list.map(function (x) {
          var e = x.e, href = '#/' + e.slug + (e.sec ? '/' + e.sec : '');
          return '<a href="' + href + '"><div class="where">' + esc(t('groups')[e.group] || '') + ' · ' + esc(e.page) + '</div>' +
            (e.sec ? '<div class="what">' + esc(e.title) + '</div>' : '') + '<div class="snip">' + snippet(e, r.terms) + '</div></a>';
        }).join('');
        $$('a', resEl).forEach(function (a) { a.addEventListener('click', function () { setTimeout(close, 0); }); });
      }, 120);
    });
    setTimeout(function () { q.focus(); }, 30);
  }

  boot();
})();
