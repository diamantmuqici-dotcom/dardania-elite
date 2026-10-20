/* ============================================================
   DARDANIA ELITE CS2 â�,��?� main.js
   scroll reveals, count-up stats, live stats.json fetch,
   copy-IP, burger menu, WebAudio UI sounds
   ============================================================ */

(function () {
  'use strict';

  /* ---------------- audio engine ---------------- */

  var Sound = {
    ctx: null,
    enabled: (localStorage.getItem('dardaniaSound') !== 'off'),
    ensure: function () {
      if (!this.ctx) {
        try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); }
        catch (e) { this.enabled = false; }
      }
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
      return this.ctx;
    },
    blip: function (freq, dur, gain) {
      if (!this.enabled) return;
      var ctx = this.ensure();
      if (!ctx) return;
      var osc = ctx.createOscillator();
      var g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      g.gain.setValueAtTime(gain, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
      osc.connect(g).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + dur);
    },
    hover: function () { this.blip(1800, 0.03, 0.025); },
    click: function () { this.blip(760, 0.07, 0.06); setTimeout(function () { Sound.blip(1020, 0.06, 0.05); }, 55); }
  };

  // unlock audio on first interaction anywhere
  document.addEventListener('pointerdown', function unlock() {
    Sound.ensure();
    document.removeEventListener('pointerdown', unlock);
  }, { once: true });

  // wire sounds to interactive elements
  var sndEls = document.querySelectorAll('[data-snd], .btn, .nav-links a');
  sndEls.forEach(function (el) {
    el.addEventListener('mouseenter', function () { Sound.hover(); });
    el.addEventListener('click', function () { Sound.click(); });
  });

  // toggle button
  var soundBtn = document.getElementById('soundToggle');
  function paintSoundBtn() {
    if (!soundBtn) return;
    if (Sound.enabled) { soundBtn.classList.remove('muted'); soundBtn.title = 'Z�f«ri: ON'; }
    else { soundBtn.classList.add('muted'); soundBtn.title = 'Z�f«ri: OFF'; }
  }
  if (soundBtn) {
    paintSoundBtn();
    soundBtn.addEventListener('click', function () {
      Sound.enabled = !Sound.enabled;
      localStorage.setItem('dardaniaSound', Sound.enabled ? 'on' : 'off');
      paintSoundBtn();
      if (Sound.enabled) Sound.click();
    });
  }

  /* ---------------- nav ---------------- */

  var nav = document.getElementById('nav');
  var burger = document.getElementById('navBurger');
  var navLinks = document.getElementById('navLinks');

  window.addEventListener('scroll', function () {
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 30);
  }, { passive: true });

  if (burger && navLinks) {
    burger.addEventListener('click', function () {
      burger.classList.toggle('open');
      navLinks.classList.toggle('open');
    });
    navLinks.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        burger.classList.remove('open');
        navLinks.classList.remove('open');
      });
    });
  }

  /* ---------------- scroll reveal ---------------- */

  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('visible');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('visible'); });
  }

  /* ---------------- count-up ---------------- */

  function countUp(el, target) {
    var start = null;
    var dur = 900;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.floor(eased * target).toLocaleString('sq-AL');
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = target.toLocaleString('sq-AL');
    }
    requestAnimationFrame(step);
  }

  function runCountUps() {
    document.querySelectorAll('.stat-value[data-count]').forEach(function (el) {
      var target = parseInt(el.getAttribute('data-count'), 10) || 0;
      countUp(el, target);
      el.removeAttribute('data-count');
    });
  }

  /* ---------------- toast ---------------- */

  var toast = document.getElementById('toast');
  var toastTimer = null;
  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('show'); }, 2200);
  }

  /* ---------------- copy IP ---------------- */

  var copyBtn = document.getElementById('btnCopyIp');
  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      var ipEl = document.getElementById('serverIp');
      var ip = ipEl ? ipEl.textContent.trim() : '';
      if (navigator.clipboard && ip) {
        navigator.clipboard.writeText(ip).then(function () {
          showToast('IP u kopjua: ' + ip);
        }).catch(function () { showToast('Kopjoje manualisht: ' + ip); });
      } else {
        showToast('Kopjoje manualisht: ' + ip);
      }
    });
  }

  /* ---------------- live stats ---------------- */

  function applyIp(ip) {
    var ipEl = document.getElementById('serverIp');
    if (ipEl && ip) ipEl.textContent = ip;
    document.querySelectorAll('a[href*="IP_ADRESA"]').forEach(function (a) {
      a.href = a.href.replace(/IP_ADRESA(:\d+)?/, ip);
    });
  }

  function applyStats(s) {
    if (!s) return;
    var map = [
      ['statPlayers', s.playersTotal],
      ['statOnline', s.onlineNow],
      ['statBans', s.bans],
      ['statMutes', s.mutes],
      ['statGags', s.gags],
      ['statHs', s.headshots]
    ];
    map.forEach(function (pair) {
      var el = document.getElementById(pair[0]);
      if (el && typeof pair[1] === 'number') el.setAttribute('data-count', pair[1]);
    });
    var heroOnline = document.getElementById('heroOnline');
    if (heroOnline && typeof s.onlineNow === 'number') heroOnline.textContent = s.onlineNow;
    var sp = document.getElementById('serverPlayers');
    if (sp && typeof s.onlineNow === 'number') sp.textContent = s.onlineNow + '/64';
    if (s.serverIp) applyIp(s.serverIp);
    if (s.top && s.top.length) {
      var list = document.getElementById('topList');
      if (list) {
        list.innerHTML = '';
        s.top.slice(0, 10).forEach(function (p, i) {
          var row = document.createElement('div');
          row.className = 'top-row';
          row.setAttribute('data-place', i + 1);
          var place = document.createElement('div');
          place.className = 'top-place';
          place.textContent = (i + 1);
          var name = document.createElement('div');
          name.className = 'top-name';
          name.textContent = p.name || 'lojtar';
          var pts = document.createElement('div');
          pts.className = 'top-points';
          pts.textContent = (p.points || 0).toLocaleString('sq-AL') + ' pik�f«';
          row.appendChild(place); row.appendChild(name); row.appendChild(pts);
          list.appendChild(row);
        });
      }
    }
    runCountUps();
  }

  fetch('stats.json', { cache: 'no-store' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(applyStats)
    .catch(function () { /* bundled defaults already in DOM */ });

  // run initial count-ups with fallback values even before fetch resolves
  setTimeout(runCountUps, 400);

  /* ---------------- public bans & logs (bans.json / logs.json) ---------------- */

  function escHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', ''': '&#39;' }[c;
    });
  }

  function whenText(unix) {
    if (!unix) return 'â�,��?�';
    var d = new Date(unix * 1000);
    return d.toLocaleString('sq-AL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  function untilText(u) {
    if (u === 0) return 'â�,��?�';
    if (u < 0) return 'PERMANENT';
    return whenText(u);
  }

  var TYPE_LABEL = {
    ban: 'BAN', banip: 'BAN IP', webban: 'BAN', kick: 'KICK', mute: 'MUTE',
    gag: 'GAG', warn: 'WARN', pccheck: 'PC CHECK', unban: 'UNBAN',
    unpccheck: 'PC REVOKED', map: 'MAP', clantag: 'CLANTAG'
  };

  function loadBans() {
    fetch('bans.json', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (bans) {
        var body = document.getElementById('bansBody');
        if (!body) return;
        if (!bans || !bans.length) {
          body.innerHTML = '<tr><td colspan="4" class="log-empty">S\'ka bane aktive \u0026mdash; serveri i past\u00EBr.</td></tr>';
          return;
        }
        body.innerHTML = bans.slice(0, 20).map(function (b) {
          return '<tr><td class="log-name">' + escHtml(b.name || b.steamId) +
            '</td><td>' + escHtml(b.reason || '\u2014') + '</td><td class="log-muted">' + escHtml(b.by || '\u2014') +
            '</td><td class="log-muted">' + untilText(b.until) + '</td></tr>';
        }).join('');
      })
      .catch(function () {});
  }

  function loadLogs() {
    fetch('logs.json', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (logs) {
        var body = document.getElementById('logsBody');
        if (!body) return;
        if (!logs || !logs.length) {
          body.innerHTML = '<tr><td colspan="4" class="log-empty">S\'ka logje ende.</td></tr>';
          return;
        }
        body.innerHTML = logs.slice(0, 20).map(function (e) {
          return '<tr><td class="log-muted">' + whenText(e.at) +
            '</td><td class="log-type log-type--' + escHtml(e.type) + '">' + (TYPE_LABEL[e.type] || String(e.type || '').toUpperCase()) +
            '</td><td class="log-name">' + escHtml(e.player || '\u2014') +
            '</td><td>' + escHtml(e.reason || '\u2014') + '</td></tr>';
        }).join('');
      })
      .catch(function () {});
  }

  loadBans();
  loadLogs();
  setInterval(function () { loadBans(); loadLogs(); }, 30000);

})();
