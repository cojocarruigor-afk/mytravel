/* My Travel 2026: meniu, eroul cu destinații, rândurile glisante, testul de vacanță, formularul de cerere. Fără biblioteci. */
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var MT = window.MT || {};

  /* Meniul pe telefon */
  var burger = $('.burger'), mob = $('.mob');
  if (burger && mob) burger.addEventListener('click', function () {
    var open = mob.classList.toggle('open');
    burger.setAttribute('aria-expanded', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });

  /* Lista de destinații din meniu */
  $$('.dd').forEach(function (dd) {
    var b = $('button', dd), t;
    var set = function (v) { dd.classList.toggle('open', v); b.setAttribute('aria-expanded', v); };
    b.addEventListener('click', function () { set(!dd.classList.contains('open')); });
    dd.addEventListener('mouseenter', function () { clearTimeout(t); set(true); });
    dd.addEventListener('mouseleave', function () { t = setTimeout(function () { set(false); }, 180); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') set(false); });
    document.addEventListener('click', function (e) { if (!dd.contains(e.target)) set(false); });
  });

  /* Eroul: „my” + destinația care se schimbă, cu poza ei */
  var hero = $('.hero[data-rotate]');
  if (hero && !reduce) {
    var imgs = $$('.hero-img img', hero), w = $('.w', hero), names = JSON.parse(hero.getAttribute('data-rotate')), i = 0;
    if (imgs.length > 1 && w) setInterval(function () {
      if (document.hidden) return;
      var nx = (i + 1) % imgs.length;
      if (!imgs[nx].complete || !imgs[nx].naturalWidth) return; /* următoarea poză nu s-a încărcat încă: așteptăm */
      i = nx;
      w.classList.add('out');
      setTimeout(function () {
        imgs.forEach(function (im, k) { im.classList.toggle('on', k === i); });
        w.textContent = names[i];
        w.classList.remove('out');
      }, 350);
    }, 4200);
  }
  /* pozele din erou se încarcă după prima */
  $$('.hero-img img[data-src]').forEach(function (im, k) { setTimeout(function () { im.src = im.getAttribute('data-src'); }, 900 + k * 500); });

  /* Săgețile rândurilor glisante */
  $$('[data-rail]').forEach(function (nav) {
    var rail = document.getElementById(nav.getAttribute('data-rail'));
    $$('button', nav).forEach(function (b) {
      b.addEventListener('click', function () {
        rail.scrollBy({ left: (b.value === 'next' ? 1 : -1) * rail.clientWidth * 0.8, behavior: reduce ? 'auto' : 'smooth' });
      });
    });
  });

  /* Testul „Găsește-ți vacanța” */
  $$('.quiz-box').forEach(function (box) {
    var qs = $$('.quiz-q', box), res = $('.quiz-res', box), bar = $('.quiz-progress i', box), ans = {}, step = 0;
    var data = JSON.parse(box.getAttribute('data-quiz'));
    function show(n) {
      step = n;
      qs.forEach(function (q, k) { q.classList.toggle('on', k === n); });
      res.hidden = n < qs.length;
      bar.style.width = Math.min(100, (n + 1) / qs.length * 100) + '%';
      if (n < qs.length) { var f = $('button', qs[n]); if (f && n) f.focus(); }
    }
    $$('.opts button', box).forEach(function (b) {
      b.addEventListener('click', function () {
        ans[b.getAttribute('data-k')] = b.value;
        if (step + 1 < qs.length) show(step + 1); else finish();
      });
    });
    $$('.quiz-back', box).forEach(function (b) { b.addEventListener('click', function () { show(Math.max(0, step - 1)); }); });
    function finish() {
      // punctaj simplu: fiecare răspuns dă puncte destinațiilor potrivite
      var score = {};
      Object.keys(ans).forEach(function (k) {
        (data.rules[k + ':' + ans[k]] || []).forEach(function (d, idx) { score[d] = (score[d] || 0) + (3 - Math.min(idx, 2)); });
      });
      var top = Object.keys(score).sort(function (a, b) { return score[b] - score[a]; }).slice(0, 3);
      if (!top.length) top = data.fallback;
      $('.picks', res).innerHTML = top.map(function (d) {
        var x = data.dest[d];
        return '<a class="pick" href="' + x.url + '"><img src="' + x.img + '" alt="" loading="lazy"><div><b>' + x.name + '</b><span>' + x.why + '</span></div></a>';
      }).join('');
      var dest = $('[name=destinatie]', res);
      if (dest) dest.value = top.map(function (d) { return data.dest[d].name; }).join(', ') + ' (' + Object.keys(ans).map(function (k) { return ans[k]; }).join(', ') + ')';
      show(qs.length);
      res.focus();
    }
    show(0);
  });

  /* Formularul de cerere: trimite în WordPress; dacă nu merge, dă WhatsApp / Viber / telefon */
  $$('form.form[data-lead]').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var msg = $('.msg', f), btn = $('button[type=submit]', f), tel = $('[name=telefon]', f);
      if ((tel.value.replace(/\D/g, '')).length < 6) { tel.focus(); msg.className = 'msg err'; msg.textContent = f.getAttribute('data-err-tel'); return; }
      var fd = new FormData(f);
      fd.append('action', 'mt_lead');
      fd.append('pagina', location.href);
      btn.disabled = true;
      fetch(MT.ajax || '/wp-admin/admin-post.php', { method: 'POST', body: fd, credentials: 'same-origin' })
        .then(function (r) { return r.json(); })
        .then(function (j) { if (!j.ok) throw 0; msg.className = 'msg ok'; msg.textContent = f.getAttribute('data-ok'); f.reset(); })
        .catch(function () { msg.className = 'msg err'; msg.innerHTML = f.getAttribute('data-fail'); })
        .then(function () { btn.disabled = false; });
    });
  });
  /* butoanele „Cere ofertă pentru X” completează destinația în formular */
  $$('[data-ask]').forEach(function (a) {
    a.addEventListener('click', function () {
      var d = $('#cerere [name=destinatie]');
      if (d) d.value = a.getAttribute('data-ask');
    });
  });

  /* Plecări otpusk: blocul otpusk e doar sursa de date (ascuns). Desenăm cardurile noastre:
     doar țara paginii, 5*, all inclusive / ultra all inclusive; fiecare card duce pe WhatsApp cu oferta completată. */
  $$('.os-hot').forEach(function (box) {
    var d = box.dataset, names = (d.tara || '').toLowerCase().split('|').filter(Boolean);
    var out = box.parentNode.querySelector('.ocards'), empty = box.parentNode.querySelector('.hot-empty'), t = null, seen = '';
    var tx = function (it, s) { var e = it.querySelector(s); return e ? e.textContent.replace(/\s+/g, ' ').trim() : ''; };
    var esc = function (v) { return String(v).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
    function draw() {
      var items = $$('.new-hot-tour-item', box), cards = [];
      items.forEach(function (it) {
        var a = it.closest('a') || it.querySelector('a'), href = a ? (a.getAttribute('href') || '') : '';
        var geo = tx(it, '.new-hot-tour-img-geo'), name = tx(it, '.new-hot-tour-name'), food = tx(it, '.new-hot-tour-food');
        var date = tx(it, '.new-hot-tour-date'), price = tx(it, '.new-hot-tour-price-value'), per = tx(it, '.new-hot-tour-price-desc');
        var img = it.querySelector('img'), src = img ? (img.getAttribute('src') || img.getAttribute('data-src') || '') : '';
        var stars = it.querySelectorAll('.new-hot-tour-stars > *').length - it.querySelectorAll('.new-hot-tour-stars .new-hot-tour-star-gray').length;
        var g = geo.toLowerCase();
        var okTara = d.taraId ? new RegExp('[#!&]i=' + d.taraId + '(&|$)').test(href) : names.some(function (n) { return g.indexOf(n) === 0; });
        if (!(okTara && stars >= 5 && /all inclusive|всё включено|все включено/i.test(food))) return;
        var m = date.match(/^(\d+\s+\S+)\s+\S+\s+(\d+)/), when = m ? d.plec.replace('{d}', m[1]).replace('{n}', m[2]) : date;
        var msg = d.waText.replace('{h}', name).replace('{g}', geo).replace('{f}', food).replace('{d}', date).replace('{p}', price);
        var url = d.wa ? d.wa + encodeURIComponent(msg) : '#cerere';
        var tgt = d.wa ? ' target="_blank" rel="noopener"' : '';
        cards.push('<article class="ocard"><a class="ocard-img" href="' + esc(url) + '"' + tgt + '>' + (src ? '<img src="' + esc(src) + '" alt="' + esc(name) + '" loading="lazy">' : '') +
          '<span class="ocard-food">' + esc(food) + '</span></a><div class="ocard-b"><p class="hloc">' + esc(geo) + ' · <span class="st" aria-label="5*">★★★★★</span></p>' +
          '<h3>' + esc(name) + '</h3><p class="ocard-when">' + esc(when) + '</p><p class="ocard-price"><b>' + esc(price) + '</b> ' + esc(per || d.per) + '</p>' +
          '<a class="btn btn-wa btn-sm" href="' + esc(url) + '"' + tgt + '>' + d.waIcon + esc(d.waBtn) + '</a></div></article>');
      });
      var key = cards.join('');
      if (key === seen) return;
      seen = key;
      out.innerHTML = key;
      if (empty) empty.hidden = cards.length > 0;
    }
    new MutationObserver(function () { clearTimeout(t); t = setTimeout(draw, 300); }).observe(box, { childList: true, subtree: true });
    setTimeout(function () { draw(); if (empty && !out.children.length) empty.hidden = false; }, 9000);
  });
})();
