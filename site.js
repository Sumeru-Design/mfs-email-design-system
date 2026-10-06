/* MyFreeStyle Email Design System — documentation site.
   Vanilla JS, no build step. Content comes from manifest.json (built by scripts/build.mjs). */
(function () {
  'use strict';

  // SHA-256 of the site password. This is a visibility gate only — every file
  // in the public repo stays readable. Change with: scripts/set-password.mjs
  var PASSWORD_SHA256 = '157c1ab2280a6a20b978d26e3d2245365df3e93124a707d6a85be7e7044680e0';
  var AUTH_KEY = 'mfs-auth';

  var BRAND_PAGES = [
    { id: 'overview', name: 'Overview', icon: 'M3 4h14v12H3z M3 8h14' },
    { id: 'colours', name: 'Colours', icon: 'M10 3a7 7 0 1 0 0 14c1 0 1.5-.7 1.5-1.4 0-.9-.8-1.2-.8-2.1 0-.8.7-1.5 1.5-1.5H14a3 3 0 0 0 3-3C17 5.6 13.9 3 10 3Z' },
    { id: 'tokens', name: 'Light / Dark tokens', icon: 'M10 3a7 7 0 1 0 0 14V3Z M10 3a7 7 0 0 1 0 14' },
    { id: 'typography', name: 'Typography', icon: 'M4 6V4h12v2 M10 4v12 M7.5 16h5' },
    { id: 'spacing', name: 'Spacing & layout', icon: 'M3 3v14 M17 3v14 M6 10h8 M8 8l-2 2 2 2 M12 8l2 2-2 2' },
    { id: 'buttons', name: 'Buttons', icon: 'M3 7h14a3 3 0 0 1 0 6H3a3 3 0 0 1 0-6Z' },
    { id: 'icons', name: 'Icons', icon: 'M10 3l2.2 4.5 4.8.7-3.5 3.4.8 4.9-4.3-2.3-4.3 2.3.8-4.9L3 8.2l4.8-.7Z' },
    { id: 'logos', name: 'Logos', icon: 'M4 14c2-6 4-9 6-9s4 3 6 9 M6.5 11h7' },
    { id: 'setup', name: 'Email setup', icon: 'M7 6 3 10l4 4 M13 6l4 4-4 4' }
  ];

  var $ = function (sel, el) { return (el || document).querySelector(sel); };
  var $$ = function (sel, el) { return [].slice.call((el || document).querySelectorAll(sel)); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var store = {
    get: function (k, s) { try { return (s ? sessionStorage : localStorage).getItem(k); } catch (e) { return null; } },
    set: function (k, v, s) { try { (s ? sessionStorage : localStorage).setItem(k, v); } catch (e) {} }
  };

  var M = null;           // manifest
  var root = document.documentElement;
  var main = $('#main');
  var frameObserver = null;
  var spyObserver = null;
  var sourceCache = {};
  var pinned = null, pinTimer;

  /* ------------------------------------------------------------ gate */
  function sha256(text) {
    var data = new TextEncoder().encode(text);
    return crypto.subtle.digest('SHA-256', data).then(function (buf) {
      return [].map.call(new Uint8Array(buf), function (b) { return b.toString(16).padStart(2, '0'); }).join('');
    });
  }
  function unlock() {
    $('#gate').hidden = true;
    $('#app').hidden = false;
    boot();
  }
  function initGate() {
    if (!PASSWORD_SHA256 || store.get(AUTH_KEY, true) === PASSWORD_SHA256) { unlock(); return; }
    var gate = $('#gate');
    gate.hidden = false;
    $('#gate-pw').focus();
    $('#gate-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var pw = $('#gate-pw').value;
      if (!window.crypto || !crypto.subtle) { $('#gate-error').textContent = 'This page needs a secure (https) connection.'; $('#gate-error').hidden = false; return; }
      sha256(pw).then(function (h) {
        if (h === PASSWORD_SHA256) { store.set(AUTH_KEY, h, true); unlock(); }
        else {
          $('#gate-error').hidden = false;
          gate.classList.remove('gate--shake'); void gate.offsetWidth; gate.classList.add('gate--shake');
          $('#gate-pw').select();
        }
      });
    });
  }

  /* ------------------------------------------------------------ boot */
  function boot() {
    fetch('manifest.json', { cache: 'no-cache' })
      .then(function (r) { return r.json(); })
      .then(function (m) {
        M = m;
        M.byId = {};
        M.modules.forEach(function (mod) { M.byId[mod.id] = mod; });
        $('#version-pill').textContent = 'v' + M.site.version;
        renderNav();
        bindChrome();
        syncToggles();
        route();
        window.addEventListener('hashchange', route);
      })
      .catch(function () {
        main.innerHTML = '<div class="page"><h1 class="page-title">Couldn’t load the design system</h1><p class="lead">manifest.json failed to load. If you opened index.html from disk, serve the folder over http instead.</p></div>';
      });
  }

  /* ------------------------------------------------------------ chrome */
  function svgIcon(d) {
    return '<svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="' + d + '"/></svg>';
  }
  var CHEV = '<svg class="chev" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M4.5 2.5 8 6l-3.5 3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function renderNav() {
    var h = '<div class="nav-group" data-group="brand"><div class="nav-group__title">Foundations</div>';
    BRAND_PAGES.forEach(function (p) {
      h += '<a class="nav-link" data-nav="brand/' + p.id + '" data-search="' + esc(p.name.toLowerCase()) + '" href="#/brand/' + p.id + '">' + svgIcon(p.icon) + '<span>' + esc(p.name) + '</span></a>';
    });
    h += '</div><div class="nav-group" data-group="modules"><div class="nav-group__title">Categories</div>';
    M.categories.forEach(function (c) {
      var mods = M.modules.filter(function (m) { return m.category === c.id; });
      h += '<details class="nav-cat" data-cat="' + c.id + '"><summary class="nav-link" data-nav="modules/' + c.id + '">' + CHEV +
        '<span>' + esc(c.name) + '</span><span class="nav-link__count">' + mods.length + '</span></summary><div class="nav-sub">';
      mods.forEach(function (m) {
        h += '<a class="nav-link" data-mod="' + m.id + '" data-search="' + esc((m.id + ' ' + m.title + ' ' + c.name).toLowerCase()) + '" href="#/modules/' + c.id + '/' + m.id + '"><span class="nav-id">' + m.id + '</span><span class="nav-title">' + esc(shortTitle(m.title)) + '</span></a>';
      });
      h += '</div></details>';
    });
    h += '</div><p class="nav-empty" id="nav-empty" hidden>No matches.</p>';
    $('#nav').innerHTML = h;

    // Clicking a category summary navigates instead of only toggling.
    $$('.nav-cat > summary').forEach(function (s) {
      s.addEventListener('click', function (e) {
        var cat = s.parentElement.dataset.cat;
        var onPage = location.hash.indexOf('#/modules/' + cat) === 0;
        if (!onPage) { e.preventDefault(); location.hash = '#/modules/' + cat; }
      });
    });
  }

  function shortTitle(t) { return t.replace(/^(Yellow|Support|Feature card|Celebration)\s·\s/, ''); }

  function bindChrome() {
    // Toggles live in the Modules toolbar, which is re-rendered per page, so delegate.
    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-set-scheme],[data-set-view]');
      if (!b) return;
      if (b.dataset.setScheme) setScheme(b.dataset.setScheme); else setView(b.dataset.setView);
    });
    if (window.matchMedia) {
      var mq = matchMedia('(prefers-color-scheme: dark)');
      var follow = function () { root.dataset.theme = mq.matches ? 'dark' : 'light'; };
      if (mq.addEventListener) mq.addEventListener('change', follow); else if (mq.addListener) mq.addListener(follow);
    }

    var sidebar = $('#sidebar'), scrim = $('#scrim'), menu = $('#menu-btn');
    function closeMenu() { sidebar.classList.remove('sidebar--open'); scrim.hidden = true; menu.setAttribute('aria-expanded', 'false'); }
    menu.addEventListener('click', function () {
      var open = !sidebar.classList.contains('sidebar--open');
      sidebar.classList.toggle('sidebar--open', open); scrim.hidden = !open; menu.setAttribute('aria-expanded', String(open));
    });
    scrim.addEventListener('click', closeMenu);
    sidebar.addEventListener('click', function (e) { if (e.target.closest('a.nav-link')) closeMenu(); });
    window.addEventListener('hashchange', closeMenu);

    var filter = $('#nav-filter');
    filter.addEventListener('input', function () { filterNav(filter.value.trim().toLowerCase()); });
    filter.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { filter.value = ''; filterNav(''); filter.blur(); }
      if (e.key === 'Enter') { var first = $$('#nav a.nav-link').filter(function (a) { return a.offsetParent; })[0]; if (first) { location.hash = first.getAttribute('href'); filter.blur(); } }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === '/' && !/input|textarea/i.test(document.activeElement.tagName)) { e.preventDefault(); filter.focus(); }
    });

    window.addEventListener('message', function (e) {
      var d = e.data;
      if (!d || d.type !== 'mfs-height') return;
      var f = $('iframe[data-frame="' + d.frame + '"]');
      if (f && d.height > 0) f.style.height = d.height + 'px';
      if (pinned) pinned.scrollIntoView({ block: 'start' });
    });
    ['wheel', 'touchstart', 'keydown'].forEach(function (ev) { window.addEventListener(ev, function () { pinned = null; }, { passive: true }); });
  }

  function filterNav(q) {
    var any = false;
    $$('#nav .nav-group').forEach(function (g) { g.hidden = false; });
    $$('.nav-group[data-group="brand"] .nav-link').forEach(function (a) {
      var hit = !q || a.dataset.search.indexOf(q) > -1; a.hidden = !hit; any = any || hit;
    });
    $$('.nav-cat').forEach(function (d) {
      var hits = 0;
      $$('.nav-sub .nav-link', d).forEach(function (a) { var hit = !q || a.dataset.search.indexOf(q) > -1; a.hidden = !hit; if (hit) hits++; });
      d.hidden = q && !hits; if (q && hits) d.open = true;
      any = any || hits > 0;
    });
    $$('#nav .nav-group').forEach(function (g) { if (q && !$$('.nav-link', g).some(function (a) { return !a.hidden && !a.closest('[hidden]'); })) g.hidden = true; });
    $('#nav-empty').hidden = any;
    if (!q) syncNav();
  }

  function setScheme(t) { root.dataset.scheme = t; store.set('mfs-scheme', t); syncToggles(); refreshFrames(); }
  function setView(v) { root.dataset.view = v; store.set('mfs-view', v); syncToggles(); fitFrames(); }

  // Previews keep their true 600/375px width (so the email's media queries fire)
  // and are zoomed down only when the stage is narrower than that.
  function fitFrames() {
    var need = root.dataset.view === 'mobile' ? 375 : 600;
    $$('.mod__stage', main).forEach(function (stage) {
      var cs = getComputedStyle(stage);
      var avail = stage.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      var s = Math.min(1, avail / need);
      var wrap = $('.mod__frame-wrap', stage);
      wrap.style.zoom = s < 1 ? s.toFixed(3) : '';
      var lbl = $('.mod__scale', stage);
      if (lbl) lbl.textContent = s < 1 ? 'Scaled to ' + Math.round(s * 100) + '%' : '';
    });
  }
  window.addEventListener('resize', function () { if (M) fitFrames(); });
  function syncToggles() {
    $$('[data-set-scheme]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.setScheme === root.dataset.scheme)); });
    $$('[data-set-view]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.setView === root.dataset.view)); });
    $$('.mod__frame-label .size').forEach(function (s) { s.textContent = sizeLabel(); });
  }
  function sizeLabel() { return (root.dataset.view === 'mobile' ? 'Mobile · 375px' : 'Desktop · 600px') + ' · ' + (root.dataset.scheme === 'dark' ? 'Dark' : 'Light'); }

  var toastTimer;
  function toast(msg) {
    var t = $('#toast'); t.textContent = msg; t.classList.add('toast--show');
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.classList.remove('toast--show'); }, 1800);
  }
  function copy(text, msg) {
    var done = function () { toast(msg || 'Copied'); };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, fallback); else fallback();
    function fallback() {
      var ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); done(); } catch (e) { toast('Copy failed'); }
      ta.remove();
    }
  }

  /* ------------------------------------------------------------ routing */
  function route() {
    var parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
    if (frameObserver) frameObserver.disconnect();
    if (spyObserver) spyObserver.disconnect();

    if (parts[0] === 'modules' && catById(parts[1])) {
      renderCategory(parts[1]);
      if (parts[2] && M.byId[parts[2]]) {
        var el = document.getElementById('mod-' + parts[2]);
        if (el) {
          // Keep the target pinned while previews above it load and change height.
          pinned = el; clearTimeout(pinTimer); pinTimer = setTimeout(function () { pinned = null; }, 2500);
          requestAnimationFrame(function () { el.scrollIntoView({ block: 'start' }); });
        }
      } else window.scrollTo(0, 0);
    } else if (parts[0] === 'm' && M.byId[parts[1]]) {
      location.replace('#/modules/' + M.byId[parts[1]].category + '/' + parts[1]); return;
    } else {
      var page = parts[0] === 'brand' && BRAND_PAGES.some(function (p) { return p.id === parts[1]; }) ? parts[1] : 'overview';
      renderBrand(page);
      window.scrollTo(0, 0);
    }
    syncNav();
    main.focus({ preventScroll: true });
  }

  function syncNav() {
    var parts = location.hash.replace(/^#\/?/, '').split('/');
    var key = parts.slice(0, 2).join('/') || 'brand/overview';
    var tab = parts[0] === 'modules' ? 'modules' : 'brand';
    $$('[data-tab-link]').forEach(function (a) {
      if (a.dataset.tabLink === tab) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    if (!$('#nav-filter').value) $$('#nav .nav-group').forEach(function (g) { g.hidden = g.dataset.group !== tab; });
    $('#nav-filter').placeholder = tab === 'modules' ? 'Search modules…' : 'Search brand library…';
    // Remember the last module category so the Modules tab returns to it.
    if (tab === 'modules' && parts[1]) $('[data-tab-link="modules"]').setAttribute('href', '#/modules/' + parts[1]);
    $$('#nav [data-nav]').forEach(function (a) {
      if (a.dataset.nav === key) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    $$('.nav-cat').forEach(function (d) { if (parts[0] === 'modules' && d.dataset.cat === parts[1]) d.open = true; });
    if (parts[2]) markModule(parts[2]);
  }
  function markModule(id) {
    $$('#nav [data-mod]').forEach(function (a) { if (a.dataset.mod === id) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
  }

  function catById(id) { return M.categories.filter(function (c) { return c.id === id; })[0]; }

  function pager(prev, next) {
    var h = '<nav class="pager" aria-label="Pagination">';
    if (prev) h += '<a class="prev" href="' + prev.href + '"><small>← Previous</small><strong>' + esc(prev.name) + '</strong></a>';
    if (next) h += '<a class="next" href="' + next.href + '"><small>Next →</small><strong>' + esc(next.name) + '</strong></a>';
    return h + '</nav>';
  }
  function sequence() {
    return BRAND_PAGES.map(function (p) { return { href: '#/brand/' + p.id, name: p.name }; })
      .concat(M.categories.map(function (c) { return { href: '#/modules/' + c.id, name: c.name + ' modules' }; }));
  }
  function pagerFor(href) {
    var seq = sequence(), i = seq.map(function (s) { return s.href; }).indexOf(href);
    return pager(seq[i - 1], seq[i + 1]);
  }

  /* ------------------------------------------------------------ colour helpers */
  function rgb(hex) { var h = hex.replace('#', ''); return [0, 2, 4].map(function (i) { return parseInt(h.substr(i, 2), 16); }); }
  function lum(hex) {
    return rgb(hex).map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); })
      .reduce(function (a, v, i) { return a + v * [0.2126, 0.7152, 0.0722][i]; }, 0);
  }
  function contrast(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  function badge(fg, bg, label) {
    var r = contrast(fg, bg), pass = r >= 4.5, large = r >= 3;
    var cls = pass ? 'badge--pass' : 'badge--fail';
    var txt = pass ? 'AA' : (large ? 'AA large' : 'Fail');
    if (!pass && large) cls = 'badge--pass';
    return '<span class="badge ' + cls + '" title="' + label + ' text: ' + r.toFixed(2) + ':1"><i style="background:' + fg + '"></i>' + txt + ' ' + r.toFixed(1) + '</span>';
  }
  function isLight(hex) { return lum(hex) > 0.6; }

  /* ------------------------------------------------------------ brand pages */
  function head(eyebrow, title, lead) {
    return '<p class="eyebrow"><span class="dot"></span>' + esc(eyebrow) + '</p><h1 class="page-title">' + esc(title) + '</h1>' + (lead ? '<p class="lead">' + esc(lead) + '</p>' : '');
  }

  function renderBrand(page) {
    var h = '<div class="page">';
    var B = M;
    if (page === 'overview') {
      h += head('Brand Library', B.site.title, B.site.intro);
      h += '<div class="cta-row"><a class="btn btn--primary" href="#/modules/hero">Browse modules →</a><a class="btn" href="#/brand/colours">Brand colours</a><a class="btn" href="' + esc(B.site.figmaFile) + '" target="_blank" rel="noopener">Open in Figma ↗</a></div>';
      h += '<section class="section"><dl class="facts">' +
        fact('Modules', B.modules.length + ' across ' + B.categories.length + ' categories') +
        fact('Email width', '600 / 375 px') + fact('Content width', '504 / 311 px') +
        fact('Email font', 'Calibri → Arial') + fact('Version', 'v' + B.site.version) + fact('Updated', fmtDate(B.site.updated)) +
        '</dl></section>';
      h += '<section class="section"><h2>Building an email</h2><p class="section__desc">Every MyFreeStyle email is assembled top to bottom from these six categories.</p><div class="grid grid--3">';
      B.categories.forEach(function (c, i) {
        var n = B.modules.filter(function (m) { return m.category === c.id; }).length;
        h += '<a class="card" style="text-decoration:none;color:inherit" href="#/modules/' + c.id + '"><p class="eyebrow" style="margin-bottom:6px">0' + (i + 1) + ' · ' + n + ' module' + (n === 1 ? '' : 's') + '</p><h3>' + esc(c.name) + '</h3><p>' + esc(c.blurb) + '</p></a>';
      });
      h += '</div></section>';
      h += '<section class="section"><h2>Guidelines</h2><p class="section__desc">Read these before building your first email.</p><div class="grid grid--2">';
      B.guidelines.forEach(function (g) { h += '<div class="card"><h3>' + esc(g.title) + '</h3><p>' + esc(g.body) + '</p></div>'; });
      h += '</div></section>';
    }
    else if (page === 'colours') {
      h += head('Brand Library', 'Colours', B.colours.primaryNote);
      h += '<section class="section"><h2>Primary</h2><p class="section__desc">Click a swatch to copy its hex value.</p><div class="grid grid--3">';
      B.colours.primary.forEach(function (c) { h += swatch(c, true); });
      h += '</div></section><section class="section"><h2>Secondary</h2><p class="section__desc">' + esc(B.colours.secondaryNote) + '</p><div class="grid grid--4">';
      B.colours.secondary.forEach(function (c) { h += swatch(c, false); });
      h += '</div></section>';
      h += '<section class="section"><div class="callout"><p><strong>Contrast badges</strong> show the WCAG ratio of charcoal and white text on each colour. AA needs 4.5:1 for body text, or 3:1 for text 24px and up (18.66px bold).</p></div></section>';
    }
    else if (page === 'tokens') {
      h += head('Brand Library', 'Light / Dark tokens', 'Semantic tokens from the Abbott Brand Master File. In email, each token is applied inline in its light value and swapped to its dark value by a class in the email head CSS.');
      h += '<section class="section"><div class="table-wrap"><table class="doc"><thead><tr><th>Token</th><th>Light</th><th>Dark</th><th>Used for</th><th>Email class</th></tr></thead><tbody>';
      B.tokens.forEach(function (t) {
        h += '<tr><td><strong>' + esc(t.name) + '</strong></td><td>' + chip(t.light) + '</td><td>' + chip(t.dark) + '</td><td>' + esc(t.use) + '</td><td class="mono">' + esc(t.cls) + '</td></tr>';
      });
      h += '</tbody></table></div></section>';
      h += '<section class="section"><h2>How dark mode works</h2><div class="grid grid--3">' +
        card('Apple Mail, iOS, Outlook for Mac', 'Honour <code>prefers-color-scheme</code>, so the token classes switch every surface, text and link colour.') +
        card('Outlook.com and new Outlook', 'Use the <code>[data-ogsc]</code> and <code>[data-ogsb]</code> rules in the head CSS.') +
        card('Gmail apps', 'Ignore dark-mode CSS and apply their own partial inversion. The light colours still render safely.') +
        '</div></section>';
    }
    else if (page === 'typography') {
      var T = B.typography;
      h += head('Brand Library', 'Typography', 'Emails are set in ' + T.family + ', falling back to Arial where Calibri isn’t installed (Gmail, most Android). This site uses Brandon Text; emails never do.');
      h += '<section class="section"><div class="card family-card"><div class="family-card__aa">Aa</div><div><h3>' + esc(T.family) + '</h3><p>' + esc(T.weights) + '</p><p class="mono" style="margin-top:6px"><code>font-family: ' + esc(T.stack) + ';</code></p></div></div>' +
        '<div class="callout" style="margin-top:16px"><p>' + esc(T.fallbackNote) + '</p></div></section>';
      h += '<section class="section"><h2>Type scale</h2><p class="section__desc">Specimens render in Calibri at their web size.</p><div class="table-wrap">';
      h += '<div class="type-row type-row--head"><div>Style</div><div>Token</div><div>Web / Mobile</div><div>Spec</div></div>';
      T.scale.forEach(function (s) {
        var size = s.web;
        h += '<div class="type-row"><div class="type-sample" style="font-size:' + size + 'px;line-height:' + s.lh + ';font-weight:' + s.weight + (s.caps ? ';text-transform:uppercase;letter-spacing:.04em' : '') + '">' + esc(s.sample) + '<small>' + esc(s.style) + ' · ' + esc(s.use) + '</small></div>' +
          '<div class="type-cell"><code>' + esc(s.token) + '</code>' + (s.cls ? '<br><code style="margin-top:4px;display:inline-block">.' + s.cls + '</code>' : '') + '</div>' +
          '<div class="type-cell"><strong>' + s.web + ' / ' + s.mobile + ' px</strong></div><div class="type-cell">' + esc(s.spec) + '</div></div>';
      });
      h += '</div></section>';
    }
    else if (page === 'spacing') {
      h += head('Brand Library', 'Spacing & layout', 'Spacing tokens step down on mobile. In email, padding is set inline at the web value and a class swaps in the mobile value.');
      h += '<section class="section"><h2>Spacing scale</h2><p class="legend"><span><i style="background:var(--yellow)"></i>Web</span><span><i style="background:var(--border-strong)"></i>Mobile</span></p><div class="table-wrap">';
      B.spacing.forEach(function (s) {
        var n = s.token.split('/')[1];
        h += '<div class="space-row"><div><strong>' + esc(s.token) + '</strong><br><code>.mfs-p' + n + '</code></div><div class="space-bars"><div class="space-bar" style="width:' + s.web * 3 + 'px;max-width:100%"></div><div class="space-bar space-bar--m" style="width:' + s.mobile * 3 + 'px;max-width:100%"></div></div><div class="type-cell"><strong>' + s.web + ' / ' + s.mobile + ' px</strong></div></div>';
      });
      h += '</div></section><section class="section"><h2>Layout rules</h2><div class="grid grid--3">';
      B.layout.forEach(function (l) { h += card(esc(l.title), esc(l.value)); });
      h += '</div></section>';
    }
    else if (page === 'buttons') {
      h += head('Brand Library', 'Buttons', B.buttons.note);
      h += '<section class="section"><div class="grid grid--3">';
      B.buttons.variants.forEach(function (v) {
        h += '<div class="btn-demo" style="background:' + v.stage + '"><a class="btn-demo__btn" href="#/brand/buttons" style="background:' + v.bg + ';color:' + v.fg + '">' + esc(v.label) + '</a><span class="btn-demo__label" style="color:' + (isLight(v.stage) ? '#464D5C' : '#D7D9DE') + '">' + esc(v.name) + '</span></div>';
      });
      h += '</div></section><section class="section"><h2>Specs</h2><div class="table-wrap"><table class="doc"><tbody>' +
        '<tr><td>Label</td><td>Calibri Bold 18 / 23 px</td></tr><tr><td>Padding</td><td>14 px × 32 px</td></tr><tr><td>Radius</td><td>48 px (pill). Square in Outlook for Windows.</td></tr>' +
        '<tr><td>Outlook</td><td>VML <code>v:roundrect</code> fallback, sized to the label + 64 px</td></tr><tr><td>Dark mode</td><td>Primary: <code>.mfs-dm-bg-charcoal</code> on the cell + <code>.mfs-dm-text-inv</code> on the link. Yellow: no classes.</td></tr>' +
        '</tbody></table></div></section>';
      h += '<section class="section"><h2>Markup</h2><div class="code-block"><pre>' + highlight(BUTTON_SNIPPET) + '</pre></div><div class="cta-row"><button class="btn btn--sm" data-copy-snippet>Copy button HTML</button></div></section>';
    }
    else if (page === 'icons') {
      h += head('Brand Library', 'Icons', B.icons.note);
      h += '<section class="section"><div class="grid grid--4" style="grid-template-columns:repeat(auto-fill,minmax(128px,1fr))">';
      B.icons.items.forEach(function (it) {
        h += '<div class="icon-tile"><div class="icon-tile__circle"><img src="assets/brand/' + it[1] + '" alt="" width="42" height="42" loading="lazy"></div><span class="icon-tile__name">' + esc(it[0]) + '</span><a href="assets/brand/' + it[1] + '" download>Download</a></div>';
      });
      h += '</div></section>';
    }
    else if (page === 'logos') {
      h += head('Brand Library', 'Logos', B.logos.note);
      h += '<section class="section"><div class="grid grid--2">';
      B.logos.items.forEach(function (l) {
        h += '<div class="logo-tile"><div class="logo-tile__stage" style="background:' + l.bg + '"><img src="assets/brand/' + l.file + '" alt="' + esc(l.name) + ' logo ' + esc(l.variant) + '" loading="lazy"></div><div class="logo-tile__body"><p><strong>' + esc(l.name) + '</strong> · ' + esc(l.variant) + '</p><a class="btn btn--sm" href="assets/brand/' + l.file + '" download>Download</a></div></div>';
      });
      h += '</div></section><section class="section"><div class="callout"><p>Use PNG logos in email (SVG isn’t supported in Outlook or Gmail). Header modules include ready-made 2× PNGs.</p></div></section>';
    }
    else if (page === 'setup') {
      h += head('Developer', 'Email setup', 'How the modules plug into ADC’s Salesforce Marketing Cloud templates.');
      h += '<section class="section"><div class="grid grid--2">' +
        card('1 · Template head', 'The modules expect the ADC template’s head CSS plus the MyFreeStyle additions (mobile sizing and dark mode). Both are in <a href="email-head.css" target="_blank">email-head.css</a>.') +
        card('2 · Paste modules', 'Each module is a self-contained 600px table. Paste it into the template body in order: Header → Hero → Body → Support → Poll → Disclaimer.') +
        card('3 · Swap content', 'Edit text in place and replace image <code>src</code> with the hosted 2× image. Keep <code>width</code> and <code>height</code> at the 1× size.') +
        card('4 · Links & aliases', 'Every link is <code>href="#"</code> with an empty <code>alias</code>. Fill both with the ADC link-alias format before sending.') +
        '</div></section>';
      h += '<section class="section"><h2>Mobile classes</h2><div class="table-wrap"><table class="doc"><thead><tr><th>Class</th><th>Effect at ≤ 640px</th></tr></thead><tbody>' +
        row('.mfs-w100', 'Fixed-width table becomes 100% wide') + row('.mfs-img', 'Image scales to 100% width, auto height') + row('.mfs-stack', 'Table cell becomes a full-width block (columns stack)') +
        row('.mfs-h1 / .mfs-h2', 'Headline 38 → 28 px · Subheadline 28 → 24 px') + row('.mfs-p{n} .mfs-px{n} .mfs-py{n} .mfs-pt{n} .mfs-pb{n}', 'Spacing token n at its mobile value') +
        row('.mfs-hide / .mfs-show', 'Hide on mobile / show only on mobile') + row('.mfs-center / .mfs-auto', 'Centre text / centre a block') +
        '</tbody></table></div></section>';
      h += '<section class="section"><h2>Dark-mode classes</h2><div class="table-wrap"><table class="doc"><thead><tr><th>Class</th><th>Light → Dark</th></tr></thead><tbody>';
      B.tokens.filter(function (t) { return t.cls !== '—'; }).forEach(function (t) { h += '<tr><td class="mono">.' + t.cls + '</td><td>' + chip(t.light) + ' → ' + chip(t.dark) + '</td></tr>'; });
      h += row('.mfs-light-img / .mfs-dark-img', 'Swap an image (e.g. a logo) in dark mode') + '</tbody></table></div></section>';
      h += '<section class="section"><div class="callout"><p><strong>Heads-up:</strong> ADC’s current template locks <code>color-scheme</code> to light. The dark-mode classes only take effect once the head CSS from this site replaces that lock. Without it, emails stay in light mode — safely.</p></div></section>';
    }
    h += pagerFor('#/brand/' + page) + '</div>';
    main.innerHTML = h;

    $$('.swatch__chip', main).forEach(function (b) { b.addEventListener('click', function () { copy(b.dataset.hex, b.dataset.hex + ' copied'); }); });
    var snip = $('[data-copy-snippet]', main);
    if (snip) snip.addEventListener('click', function () { copy(BUTTON_SNIPPET, 'Button HTML copied'); });
  }

  function fact(k, v) { return '<div class="fact"><dt>' + esc(k) + '</dt><dd>' + esc(v) + '</dd></div>'; }
  function card(t, body) { return '<div class="card"><h3>' + t + '</h3><p>' + body + '</p></div>'; }
  function row(a, b) { return '<tr><td class="mono">' + esc(a) + '</td><td>' + esc(b) + '</td></tr>'; }
  function chip(hex) { return '<span class="chip-pair"><span class="chip" style="background:' + hex + '"></span><span class="mono">' + hex + '</span></span>'; }
  function fmtDate(s) { var d = new Date(s + 'T12:00:00'); return isNaN(d) ? s : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
  function swatch(c, lg) {
    var light = isLight(c.hex);
    var badges = c.annotation ? '<span class="badge badge--warn">Annotation only</span>' : badge('#222731', c.hex, 'Charcoal') + badge('#FFFFFF', c.hex, 'White');
    var rgbv = rgb(c.hex).join(', ');
    return '<div class="swatch' + (lg ? ' swatch--lg' : '') + '"><button class="swatch__chip' + (light ? ' swatch__chip--light' : '') + '" style="background:' + c.hex + '" data-hex="' + c.hex + '" aria-label="Copy ' + esc(c.name) + ' ' + c.hex + '"></button>' +
      '<div class="swatch__body"><p class="swatch__name">' + esc(c.name) + '</p><p class="swatch__hex">' + c.hex + ' · rgb(' + rgbv + ')</p><p class="swatch__meta">' + esc(c.tokens) + '</p><div class="swatch__badges">' + badges + '</div></div></div>';
  }

  var BUTTON_SNIPPET = [
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">',
    '  <tr>',
    '    <td align="center" class="mfs-dm-bg-charcoal" style="border-radius:48px; background-color:#222731;" bgcolor="#222731">',
    '      <!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="#" style="height:51px; v-text-anchor:middle; width:220px;" arcsize="50%" stroke="f" fillcolor="#222731"><w:anchorlock/><center style="color:#FFFFFF; font-family:Calibri, Arial, sans-serif; font-size:18px; font-weight:bold;">Get my free sensor</center></v:roundrect><![endif]-->',
    '      <!--[if !mso]><!-- --><a href="#" alias="" target="_blank" class="mfs-dm-text-inv" style="display:inline-block; padding:14px 32px; font-family:Calibri, Arial, Helvetica, sans-serif; font-size:18px; line-height:23px; font-weight:bold; color:#FFFFFF; text-decoration:none; border-radius:48px; mso-line-height-rule:exactly;">Get my free sensor</a><!--<![endif]-->',
    '    </td>',
    '  </tr>',
    '</table>'
  ].join('\n');

  /* ------------------------------------------------------------ module pages */
  function renderCategory(catId) {
    var c = catById(catId);
    var mods = M.modules.filter(function (m) { return m.category === catId; });
    var idx = M.categories.indexOf(c);
    var h = '<div class="page">' + toolbar() + head('Modules · 0' + (idx + 1), c.name, c.blurb);
    h += '<div class="mod-index">';
    mods.forEach(function (m) { h += '<a href="#/modules/' + catId + '/' + m.id + '"><b>' + m.id + '</b>' + esc(shortTitle(m.title)) + '</a>'; });
    h += '</div>';
    if (!mods.length) h += '<section class="section"><div class="callout"><p>Modules for this category are on their way.</p></div></section>';
    mods.forEach(function (m) { h += moduleCard(m); });
    h += pagerFor('#/modules/' + catId) + '</div>';
    main.innerHTML = h;

    mods.forEach(function (m) { bindModule(m); });
    fitFrames();
    lazyFrames();
    spy(mods);
  }

  var ICON_WEB = '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><rect x="1.5" y="2.5" width="13" height="9" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M5.5 14h5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>';
  var ICON_MOBILE = '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><rect x="4" y="1.5" width="8" height="13" rx="1.6" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M7 12.3h2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>';
  var ICON_LIGHT = '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="3" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M8 1v1.6M8 13.4V15M1 8h1.6M13.4 8H15M3 3l1.1 1.1M11.9 11.9 13 13M3 13l1.1-1.1M11.9 4.1 13 3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>';
  var ICON_DARK = '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M13.5 9.6A5.8 5.8 0 0 1 6.4 2.5a5.8 5.8 0 1 0 7.1 7.1Z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>';

  function toolbar() {
    var v = root.dataset.view, sc = root.dataset.scheme;
    return '<div class="mod-toolbar" role="toolbar" aria-label="Preview settings"><span class="mod-toolbar__label">Preview</span>' +
      '<div class="seg" role="group" aria-label="Preview size">' +
      '<button type="button" data-set-view="web" aria-pressed="' + (v !== 'mobile') + '">' + ICON_WEB + '<span>Desktop</span></button>' +
      '<button type="button" data-set-view="mobile" aria-pressed="' + (v === 'mobile') + '">' + ICON_MOBILE + '<span>Mobile</span></button></div>' +
      '<div class="seg" role="group" aria-label="Preview colour scheme">' +
      '<button type="button" data-set-scheme="light" aria-pressed="' + (sc !== 'dark') + '">' + ICON_LIGHT + '<span>Light</span></button>' +
      '<button type="button" data-set-scheme="dark" aria-pressed="' + (sc === 'dark') + '">' + ICON_DARK + '<span>Dark</span></button></div></div>';
  }

  function figmaUrl(node) { return M.site.figmaFile + '?node-id=' + String(node).replace(':', '-'); }

  function moduleCard(m) {
    var h = '<article class="mod" id="mod-' + m.id + '" data-id="' + m.id + '">';
    h += '<header class="mod__head"><div><span class="mod__id">' + m.id + '</span><h2 class="mod__title">' + esc(m.title) + '</h2><p class="mod__desc">' + esc(m.description) + '</p></div>' +
      '<div class="mod__actions"><button class="btn btn--sm" data-act="copy">Copy HTML</button><button class="btn btn--sm" data-act="download">Download</button>' +
      '<a class="btn btn--sm" href="' + frameSrc(m.id) + '" target="_blank" rel="noopener" data-act="open">Open ↗</a>' +
      (m.figmaNode ? '<a class="btn btn--sm" href="' + esc(figmaUrl(m.figmaNode)) + '" target="_blank" rel="noopener">Figma ↗</a>' : '') + '</div></header>';
    h += '<div class="mod__stage"><div class="mod__frame-wrap"><div class="mod__frame-label"><span class="size">' + sizeLabel() + '</span><span>' + (m.bytes ? (m.bytes / 1024).toFixed(1) + ' KB' : '') + '</span></div>' +
      '<iframe class="mod__frame" title="' + esc(m.id + ' preview') + '" data-frame="' + m.id + '" data-id="' + m.id + '" loading="lazy"></iframe></div></div>';
    h += '<div class="mod__tabs" role="tablist"><button class="mod__tab" role="tab" aria-selected="true" data-tab="specs">Specs</button><button class="mod__tab" role="tab" aria-selected="false" data-tab="html">HTML</button></div>';
    h += '<div class="mod__panel" data-panel="specs">' + specs(m) + '</div><div class="mod__panel" data-panel="html" hidden><div class="code-block"><pre>Loading…</pre></div></div>';
    return h + '</article>';
  }

  function specs(m) {
    var h = '<div class="specs">';
    var usage = '';
    if (m.usage) usage += '<p style="margin:0 0 10px">' + esc(m.usage) + '</p>';
    if (m.seenIn) usage += '<dl><dt>Seen in</dt><dd>' + esc(m.seenIn) + '</dd></dl>';
    if (usage) h += '<div><h4>Usage</h4>' + usage + '</div>';
    if (m.editable && m.editable.length) h += '<div><h4>Editable</h4><ul>' + m.editable.map(function (e) { return '<li>' + esc(e) + '</li>'; }).join('') + '</ul></div>';
    var chars = m.chars ? Object.keys(m.chars) : [];
    if (chars.length) h += '<div><h4>Character counts</h4><dl>' + chars.map(function (k) { return '<dt>' + esc(k) + '</dt><dd>' + esc(m.chars[k]) + ' char</dd>'; }).join('') + '</dl></div>';
    if (m.images && m.images.length) {
      h += '<div><h4>Image dimensions</h4><dl>' + m.images.map(function (i) {
        return '<dt>' + esc(i.slot) + '</dt><dd>' + i.w + ' × ' + i.h + ' px<br><span style="font-weight:400;color:var(--muted);font-size:14px">Retina ' + i.w * 2 + ' × ' + i.h * 2 + ' px' + (i.notes ? ' · ' + esc(i.notes) : '') + '</span></dd>';
      }).join('') + '</dl></div>';
    }
    if (m.tokens && m.tokens.length) h += '<div><h4>Tokens</h4><div class="tag-list">' + m.tokens.map(function (t) { return '<span class="tag">' + esc(t) + '</span>'; }).join('') + '</div></div>';
    if (m.notes && m.notes.length) h += '<div><h4>Notes</h4><ul>' + m.notes.map(function (n) { return '<li>' + esc(n) + '</li>'; }).join('') + '</ul></div>';
    return h + '</div>';
  }

  function frameSrc(id) { return 'module-view.html?id=' + encodeURIComponent(id) + '&scheme=' + (root.dataset.scheme === 'dark' ? 'dark' : 'light') + '&frame=' + encodeURIComponent(id); }

  function lazyFrames() {
    var frames = $$('iframe.mod__frame', main);
    if (!('IntersectionObserver' in window)) { frames.forEach(function (f) { f.src = frameSrc(f.dataset.id); }); return; }
    frameObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting && !e.target.getAttribute('src')) { e.target.src = frameSrc(e.target.dataset.id); }
      });
    }, { rootMargin: '600px 0px' });
    frames.forEach(function (f) { frameObserver.observe(f); });
  }
  function refreshFrames() {
    $$('iframe.mod__frame', main).forEach(function (f) { if (f.getAttribute('src')) f.src = frameSrc(f.dataset.id); });
    $$('[data-act="open"]', main).forEach(function (a) { a.href = frameSrc(a.closest('.mod').dataset.id); });
  }

  function spy(mods) {
    if (!('IntersectionObserver' in window) || !mods.length) return;
    spyObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) markModule(e.target.dataset.id); });
    }, { rootMargin: '-35% 0px -60% 0px' });
    $$('.mod', main).forEach(function (el) { spyObserver.observe(el); });
  }

  function source(id) {
    if (sourceCache[id]) return Promise.resolve(sourceCache[id]);
    return fetch('modules/' + id + '.html', { cache: 'no-cache' }).then(function (r) { return r.text(); }).then(function (t) { sourceCache[id] = t; return t; });
  }
  // Rewrite relative image paths to absolute URLs so pasted HTML works anywhere.
  function portable(html) {
    return html.replace(/(\s(?:src|background)=")(?!https?:|data:|#)([^"]+)"/g, function (_, a, p) { return a + new URL(p, location.href).href + '"'; })
      .replace(/url\((['"]?)(?!https?:|data:)(assets\/[^'")]+)\1\)/g, function (_, q, p) { return 'url(' + q + new URL(p, location.href).href + q + ')'; });
  }

  function bindModule(m) {
    var el = document.getElementById('mod-' + m.id);
    $('[data-act="copy"]', el).addEventListener('click', function () { source(m.id).then(function (t) { copy(portable(t), m.id + ' HTML copied'); }); });
    $('[data-act="download"]', el).addEventListener('click', function () {
      source(m.id).then(function (t) {
        var blob = new Blob([portable(t)], { type: 'text/html' });
        var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = m.id + '.html';
        document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
      });
    });
    $$('.mod__tab', el).forEach(function (tab) {
      tab.addEventListener('click', function () {
        $$('.mod__tab', el).forEach(function (t) { t.setAttribute('aria-selected', String(t === tab)); });
        $$('.mod__panel', el).forEach(function (p) { p.hidden = p.dataset.panel !== tab.dataset.tab; });
        if (tab.dataset.tab === 'html') source(m.id).then(function (t) { $('[data-panel="html"] pre', el).innerHTML = highlight(t); });
      });
    });
  }

  function highlight(src) {
    return esc(src)
      .replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="tok-com">$1</span>')
      .replace(/(&lt;\/?)([a-zA-Z:]+)/g, '$1<span class="tok-tag">$2</span>')
      .replace(/\s([a-zA-Z:-]+)=(&quot;[\s\S]*?&quot;)/g, ' <span class="tok-attr">$1</span>=<span class="tok-str">$2</span>');
  }

  initGate();
})();
