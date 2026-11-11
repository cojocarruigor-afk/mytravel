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
      i = (i + 1) % imgs.length;
      w.classList.add('out');
      setTimeout(function () {
        imgs.forEach(function (im, k) { im.classList.toggle('on', k === i); });
        w.textContent = names[i];
        w.classList.remove('out');
      }, 350);
    }, 4200);
  }
  /* pozele din erou se încarcă după prima */
  $$('.hero-img img[data-src]').forEach(function (im) { setTimeout(function () { im.src = im.getAttribute('data-src'); }, 1200); });

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
})();
