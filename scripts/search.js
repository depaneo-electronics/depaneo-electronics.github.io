/* Recherche instantanée Dépanéo — 100 % locale, aucun cookie, aucune requête externe */
(function () {
  'use strict';
  var IDX = window.DEP_INDEX || [];

  function norm(s) {
    return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }
  IDX.forEach(function (e) { e._n = norm(e.t + ' ' + e.b + ' ' + e.c); });

  function search(q) {
    var toks = norm(q).split(/\s+/).filter(Boolean);
    if (!toks.length) return [];
    var out = [];
    for (var i = 0; i < IDX.length; i++) {
      var e = IDX[i], score = 0, ok = true;
      for (var j = 0; j < toks.length; j++) {
        var p = e._n.indexOf(toks[j]);
        if (p < 0) { ok = false; break; }
        score += (p === 0 || e._n[p - 1] === ' ' ? 2 : 1);
      }
      if (ok) { out.push([score + (e.i ? 0 : .5), e]); }
    }
    out.sort(function (a, b) { return b[0] - a[0]; });
    return out.slice(0, 8).map(function (x) { return x[1]; });
  }

  /* ——— styles ——— */
  var css = document.createElement('style');
  css.textContent =
    '#dep-search-ov{position:fixed;inset:0;z-index:120;background:rgba(16,20,8,.45);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);opacity:0;transition:opacity .25s;display:flex;align-items:flex-start;justify-content:center;padding:12vh 1rem 1rem}' +
    '#dep-search-ov.on{opacity:1}' +
    '#dep-search-panel{width:100%;max-width:34rem;background:#fafaf7;border-radius:1.25rem;box-shadow:0 40px 120px -30px rgba(0,0,0,.5);overflow:hidden;transform:translateY(14px) scale(.98);transition:transform .3s cubic-bezier(.16,1,.3,1)}' +
    '#dep-search-ov.on #dep-search-panel{transform:none}' +
    '#dep-search-in{width:100%;border:0;outline:0;background:transparent;font:500 1.05rem/1 Inter,sans-serif;color:#101408;padding:1.1rem .5rem}' +
    '#dep-search-in::placeholder{color:#a8b09b}' +
    '.dep-sr{display:flex;align-items:center;gap:.8rem;padding:.55rem .9rem;border-radius:.8rem;cursor:pointer;text-decoration:none}' +
    '.dep-sr.sel,.dep-sr:hover{background:rgba(131,189,29,.12)}' +
    '.dep-sr img{width:44px;height:34px;object-fit:contain;background:#fff;border:1px solid #e9ecdf;border-radius:.45rem;flex:none}' +
    '.dep-sr .ph{width:44px;height:34px;border-radius:.45rem;flex:none;background:#eef0e6;display:flex;align-items:center;justify-content:center;color:#699917}' +
    '.dep-flash{animation:depFlash 2.2s ease}' +
    '@keyframes depFlash{0%,60%{box-shadow:0 0 0 3px #83bd1d, 0 18px 50px -18px rgba(20,26,12,.3)}100%{box-shadow:none}}';
  document.head.appendChild(css);

  /* ——— panneau ——— */
  var ov = null, input = null, list = null, sel = 0, results = [];

  function build() {
    ov = document.createElement('div');
    ov.id = 'dep-search-ov';
    ov.innerHTML =
      '<div id="dep-search-panel">' +
      '<div style="display:flex;align-items:center;gap:.3rem;padding:0 1rem;border-bottom:1px solid #e9ecdf">' +
      '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" style="flex:none;color:#699917"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/><path d="M20 20l-3.5-3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' +
      '<input id="dep-search-in" type="text" placeholder="Boîtier, marque, page…" autocomplete="off" spellcheck="false"/>' +
      '<kbd style="flex:none;font:600 .62rem/1 JetBrains Mono,monospace;color:#6b7563;border:1px solid #dfe4d2;border-radius:.35rem;padding:.28rem .45rem;background:#fff">ESC</kbd></div>' +
      '<div id="dep-search-list" style="max-height:22rem;overflow-y:auto;padding:.5rem"></div>' +
      '<a id="dep-search-foot" href="index.html#demande" style="display:flex;align-items:center;justify-content:space-between;gap:.8rem;padding:.8rem 1rem;border-top:1px dashed #b0d363;background:rgba(131,189,29,.07);text-decoration:none">' +
      '<span style="min-width:0"><span style="display:block;font:600 .85rem/1.3 Inter,sans-serif;color:#101408">Vous ne trouvez pas votre modèle&nbsp;?</span>' +
      '<span style="display:block;font:500 .72rem/1.4 Inter,sans-serif;color:#5b6455">Nous intervenons sur tous les boîtiers, toutes les marques — même les plus anciens.</span></span>' +
      '<span style="flex:none;background:#83bd1d;color:#101408;font:600 .78rem/1 Inter,sans-serif;padding:.55rem .9rem;border-radius:99px">Contactez-nous</span></a></div>';
    document.body.appendChild(ov);
    input = ov.querySelector('#dep-search-in');
    list = ov.querySelector('#dep-search-list');
    ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    var foot = ov.querySelector('#dep-search-foot');
    var tgt = ['#demande-cta', '#demande', '#devis'].filter(function (id) { return document.querySelector(id); })[0];
    if (tgt) foot.setAttribute('href', tgt);
    foot.addEventListener('click', function () { close(); });
    input.addEventListener('input', function () { render(input.value); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { sel = Math.min(sel + 1, results.length - 1); paint(); e.preventDefault(); }
      else if (e.key === 'ArrowUp') { sel = Math.max(sel - 1, 0); paint(); e.preventDefault(); }
      else if (e.key === 'Enter' && results[sel]) { window.location.href = results[sel].u; close(); }
    });
  }

  function hint(msg) {
    list.innerHTML = '<p style="padding:1.4rem .9rem;color:#6b7563;font-size:.88rem;text-align:center">' + msg + '</p>';
  }

  function render(q) {
    sel = 0;
    results = search(q);
    if (!norm(q)) { hint('Tapez un nom de produit, une marque (Claas, Amazone…) ou une page.'); return; }
    if (!results.length) { hint('Aucun résultat pour « ' + q.replace(/</g, '&lt;') + ' » — essayez la marque seule, ou <a href="index.html#demande" style="color:#699917;font-weight:600">contactez-nous</a>, on s’adapte à tout.'); return; }
    list.innerHTML = results.map(function (e, i) {
      var img = e.i ? '<img src="' + e.i + '" alt="" loading="lazy"/>' :
        '<span class="ph"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12h4l2-5 3 9 2-4h3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>';
      var meta = [e.b, e.c].filter(Boolean).join(' · ');
      return '<a class="dep-sr' + (i === sel ? ' sel' : '') + '" data-i="' + i + '" href="' + e.u + '">' + img +
        '<span style="min-width:0"><span style="display:block;font:600 .92rem/1.3 Inter,sans-serif;color:#101408;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + e.t + '</span>' +
        (meta ? '<span style="display:block;font:500 .72rem/1.4 Inter,sans-serif;color:#6b7563">' + meta + '</span>' : '') +
        '</span></a>';
    }).join('');
  }

  function paint() {
    [].forEach.call(list.children, function (el, i) { el.classList.toggle('sel', i === sel); });
    var s = list.children[sel]; if (s && s.scrollIntoView) s.scrollIntoView({ block: 'nearest' });
  }

  function open() {
    if (!ov) build();
    ov.style.display = 'flex';
    requestAnimationFrame(function () { ov.classList.add('on'); });
    document.documentElement.style.overflow = 'hidden';
    input.value = ''; render('');
    setTimeout(function () { input.focus(); }, 60);
  }
  function close() {
    if (!ov) return;
    ov.classList.remove('on');
    document.documentElement.style.overflow = '';
    setTimeout(function () { ov.style.display = 'none'; }, 250);
  }

  document.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('.dep-search-btn')) { open(); }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') close();
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); open(); }
  });

  /* ——— arrivée via #find=<fichier> : scroll + surbrillance du produit ——— */
  function landing() {
    var m = window.location.hash.match(/^#find=(.+)$/);
    if (!m) return;
    var file = decodeURIComponent(m[1]);
    var img = document.querySelector('img[src*="' + file.replace(/"/g, '') + '"]');
    if (!img) return;
    var card = img.closest('.card-hover') || img;
    setTimeout(function () {
      card.scrollIntoView({ block: 'center', behavior: 'smooth' });
      card.classList.add('dep-flash');
      setTimeout(function () { card.classList.remove('dep-flash'); }, 2400);
    }, 350);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', landing);
  else landing();

  /* ——— iPhone : quand le bandeau est collé, Safari peint la page qui défile dans la zone
     status-bar/Dynamic Island au-dessus de lui — et il n'y dessine QUE le contenu du
     document (les éléments sticky y sont rognés, un ::after sur le bandeau ne marche pas).
     On place donc un cache de blé DANS le document, repositionné à chaque défilement juste
     au-dessus du haut de l'écran ; sa tranche basse reste cachée derrière le bandeau
     (z-index 49 < 50) pour absorber le retard éventuel. Mobile/tablette uniquement. ——— */
  function stickyCap() {
    if (!window.matchMedia('(max-width: 1023px)').matches) return;
    var hdr = document.querySelector('header.sticky, header#site-header');
    if (!hdr) return;
    /* Bandeau : photo descendue pour montrer la ligne d'arbres (mobile uniquement) */
    var stH = document.createElement('style');
    stH.textContent = '@media (max-width: 1023px){header.sticky, header#site-header{background-position:center 35% !important}}';
    document.head.appendChild(stH);
    var cap = document.createElement('div');
    cap.setAttribute('aria-hidden', 'true');
    cap.style.cssText = 'position:absolute;left:0;width:100%;height:240px;z-index:49;pointer-events:none;display:none';
    document.body.appendChild(cap);
    /* Le cache est un APLAT de ciel (couleur du ciel de la photo sous le voile sombre) :
       une surface unie ne peut trahir aucun mouvement, et elle prolonge naturellement le
       haut du bandeau (qui montre désormais ciel + arbres). */
    function dress() {
      cap.style.background = 'linear-gradient(rgb(120,122,115), rgb(114,117,109))';
    }
    /* Suivi du défilement. Deux modes :
       — moderne (Safari 26+/Chrome) : animation pilotée par le défilement, exécutée par le
         compositeur graphique → le cache est RÉELLEMENT fixe à l'écran, zéro retard ;
       — secours : repositionnement à chaque événement scroll (léger retard possible). */
    /* Détection stricte : certains Safari acceptent animation-timeline mais IGNORENT
       animation-range → l'animation filerait 16× trop vite. On exige les deux, et on
       vérifie que le style est réellement retenu, sinon bascule sur le mode servo JS. */
    var animOK = window.CSS && CSS.supports &&
      CSS.supports('animation-timeline: scroll()') &&
      CSS.supports('animation-range: 0px 100000px');
    var shown = false;
    /* theme-color : Safari peint LUI-MÊME la zone status-bar/caméra avec cette couleur
       (opaque et parfaitement fixe, hors de portée du défilement de la page).
       Vert bandeau recherche en haut de page → gris-ciel du bandeau une fois collé. */
    var themeMeta = document.querySelector('meta[name="theme-color"]');
    if (!themeMeta) {
      themeMeta = document.createElement('meta');
      themeMeta.setAttribute('name', 'theme-color');
      themeMeta.setAttribute('content', '#83bd1d');
      document.head.appendChild(themeMeta);
    }
    function place() {
      if (hdr.getBoundingClientRect().top <= 0) {
        if (animOK) {
          /* servo : corrige tout résidu (barre Safari, arrondi) — converge au pixel au repos */
          var ecart = cap.getBoundingClientRect().top + 180;
          if (ecart > 1 || ecart < -1) cap.style.top = ((parseFloat(cap.style.top) || 0) - ecart) + 'px';
        } else {
          cap.style.top = (window.scrollY - 180) + 'px';
        }
        if (!shown) { cap.style.display = 'block'; shown = true; themeMeta.setAttribute('content', '#747770'); }
      } else if (shown) {
        cap.style.display = 'none'; shown = false; themeMeta.setAttribute('content', '#83bd1d');
      }
    }
    if (animOK) {
      /* Règle exacte : 1px de défilement = 1px de déplacement, via animation-range fixe de
         100 000px — indépendante de la hauteur de page ET de la barre Safari qui se replie
         (l'ancien calcul sur scrollHeight dérivait quand Safari redimensionnait sa barre). */
      var kf = document.createElement('style');
      kf.textContent = '@keyframes depCapRide{from{transform:translateY(-180px)}to{transform:translateY(99820px)}}';
      document.head.appendChild(kf);
      cap.style.top = '0';
      cap.style.animationName = 'depCapRide';
      cap.style.animationDuration = 'auto';
      cap.style.animationTimingFunction = 'linear';
      cap.style.animationFillMode = 'both';
      cap.style.animationTimeline = 'scroll(root)';
      cap.style.animationRange = '0px 100000px';
      /* le style doit être réellement retenu, sinon on annule et on repasse en mode servo */
      if (!cap.style.animationRange && !cap.style.getPropertyValue('animation-range')) {
        animOK = false;
        cap.style.animationName = '';
        cap.style.animationTimeline = '';
      }
    }
    /* Panneau de diagnostic (uniquement si l'adresse contient "debug") */
    if (/debug/.test(window.location.search + window.location.hash)) {
      var hud = document.createElement('div');
      hud.style.cssText = 'position:fixed;top:130px;left:8px;z-index:500;background:rgba(0,0,0,.85);color:#7dff5e;font:700 13px/1.5 monospace;padding:8px 10px;border-radius:8px;pointer-events:none;white-space:pre';
      document.body.appendChild(hud);
      var os = (navigator.userAgent.match(/OS (\d+[_\d]*)/) || [])[1] || '?';
      var sT = CSS.supports('animation-timeline: scroll()');
      var sR = CSS.supports('animation-range: 0px 100000px');
      (function boucle() {
        hud.textContent = 'iOS ' + os.replace(/_/g, '.') +
          '\ntimeline:' + (sT ? 'OUI' : 'non') + ' range:' + (sR ? 'OUI' : 'non') +
          '\nmode:' + (animOK ? 'ANIM' : 'SERVO') +
          '\nscrollY:' + Math.round(window.scrollY) +
          '\ncapTop:' + Math.round(cap.getBoundingClientRect().top) + ' (cible -180)';
        requestAnimationFrame(boucle);
      })();
    }
    window.addEventListener('scroll', place, { passive: true });
    window.addEventListener('resize', function () { dress(); place(); }, { passive: true });
    dress();
    place();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', stickyCap);
  else stickyCap();

  /* ——— Mobile : CHAMP DE BLÉ FIXE (équivalent du background-attachment:fixed du desktop,
     que Safari iOS ne supporte pas). La photo devient un calque verrouillé sur l'écran
     (scroll-driven animation + servo, mécanisme éprouvé du cache caméra) placé DERRIÈRE
     le contenu de chaque bloc (z-index:-1, rogné par le bloc). Le voile sombre et le fondu
     restent ancrés au document, dans un second calque. Desktop inchangé. ——— */
  function bleFixe() {
    if (!window.matchMedia('(max-width: 1023px)').matches) return;
    var hero = document.getElementById('hero-wrap');
    if (!hero) return; /* accueil uniquement */
    var VOILES = {
      'hero-wrap': 'linear-gradient(to bottom, rgba(250,250,247,0) 500px, #fafaf7 680px), linear-gradient(rgba(16,20,8,.58), rgba(16,20,8,.58))',
      'process': 'linear-gradient(rgba(16,20,8,.66), rgba(16,20,8,.72))',
      'realisations': 'linear-gradient(rgba(16,20,8,.62), rgba(16,20,8,.66))'
    };
    var css = '';
    Object.keys(VOILES).forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      css += '#' + id + '{background:none !important}';
      var voile = document.createElement('div');
      voile.setAttribute('aria-hidden', 'true');
      voile.style.cssText = 'position:absolute;left:0;top:0;right:0;bottom:0;z-index:-1;pointer-events:none;background:' + VOILES[id];
      el.insertBefore(voile, el.firstChild);
    });
    var st = document.createElement('style');
    st.textContent = '@media (max-width: 1023px){' + css + '}';
    document.head.appendChild(st);

    /* Le champ est un élément position:fixed — ancrage NATIF du compositeur iOS, aucun
       repositionnement par code, aucun retard possible. Il vit derrière tout le contenu
       (z-index:-1) ; les blocs sans blé sont opacifiés pour le masquer. */
    var fond = document.createElement('div');
    fond.setAttribute('aria-hidden', 'true');
    fond.style.cssText = 'position:fixed;left:0;top:-120px;width:100%;z-index:-1;pointer-events:none';
    document.body.insertBefore(fond, document.body.firstChild);
    function dress2() {
      var H = window.innerHeight;
      var hImg = Math.max(Math.round((H - 85) / 0.7), 900);
      /* horizon vers 205px d'écran → un liseré de ciel apparaît SOUS le bandeau
         (séparation demandée par Baptiste), puis les arbres et le champ */
      var off = Math.round(325 - 0.3 * hImg);
      fond.style.height = (H + 240) + 'px';
      fond.style.background = 'url("images/bandeau-ble-hd.jpg") center ' + off + 'px / auto ' + hImg + 'px no-repeat';
    }
    dress2();
    window.addEventListener('resize', dress2, { passive: true });

    /* Les blocs translucides reposaient sur le fond clair de la page : on fige leur couleur
       (mélange calculé) pour qu'ils masquent le champ là où il ne doit pas se voir. */
    Array.prototype.forEach.call(document.body.children, function (el) {
      if (el === fond || VOILES[el.id]) return;
      var cs = getComputedStyle(el);
      if (cs.backgroundImage !== 'none') return;
      var m = cs.backgroundColor.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/);
      var a = m ? (m[4] === undefined ? 1 : parseFloat(m[4])) : 0;
      if (a >= 1) return;
      function mel(c, base) { return Math.round(c * a + base * (1 - a)); }
      var r = m ? mel(parseFloat(m[1]), 250) : 250;
      var g = m ? mel(parseFloat(m[2]), 250) : 250;
      var b = m ? mel(parseFloat(m[3]), 247) : 247;
      el.style.backgroundColor = 'rgb(' + r + ',' + g + ',' + b + ')';
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bleFixe);
  else bleFixe();
})();
