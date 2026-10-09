/* ==========================================================================
   Maxx Home Health Care LLC — site behaviour
   Built by Rocks Media

   No dependencies. Everything degrades: with JavaScript off every page reads
   in full, every phone link dials, the accordions open, and the hero and the
   underlines render in their final, drawn state.
   ========================================================================== */

(function () {
  'use strict';

  /* ------------------------------------------------------------------------
     CONFIGURE BEFORE LAUNCH
     Every form posts to the Cloudflare Pages Function in functions/api/,
     which checks the submission and emails it to the office.
     TURNSTILE_SITE_KEY is the public site key from Cloudflare Turnstile
     (the matching secret is set on the server, never here).
     ------------------------------------------------------------------------ */
  var FORM_ENDPOINT = '/api/submit';
  var TURNSTILE_SITE_KEY = window.MAXX_TURNSTILE_SITE_KEY || '0x4AAAAAAFQ2l0Hok5-_Vh4G';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  };

  var root = document.documentElement;
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* Tells the head failsafe that this script is alive. */
  root.dataset.jsReady = '1';

  /* Motion is armed only when the head script added js-anim. Without it,
     every animated element is already in its final state. */
  var animOK = root.classList.contains('js-anim');

  var fontsReady = document.fonts && document.fonts.ready
    ? document.fonts.ready
    : Promise.resolve();

  function onResize(fn) {
    var timer = null;
    var lastWidth = window.innerWidth;
    window.addEventListener('resize', function () {
      window.clearTimeout(timer);
      timer = window.setTimeout(function () {
        if (window.innerWidth === lastWidth) return;
        lastWidth = window.innerWidth;
        fn();
      }, 180);
    });
  }

  /* ------------------------------------------------------------------------
     1. The underline: a pen stroke, used once per page
     ------------------------------------------------------------------------ */

  /* Hand-drawn, slightly uneven, with a small upward flick at the end.
     Coordinates are fractions of the SVG box, rebuilt in pixels on every fit
     so the stroke length is exact and the curve never stretches. */
  function scribblePath(w, h, sw) {
    var pad = sw / 2 + 0.5;
    var X = function (t) { return (t * w).toFixed(1); };
    var Y = function (t) { return (pad + t * (h - pad * 2)).toFixed(1); };
    return 'M' + X(0.01) + ' ' + Y(0.62) +
      ' C' + X(0.18) + ' ' + Y(0.28) + ' ' + X(0.38) + ' ' + Y(0.45) + ' ' + X(0.55) + ' ' + Y(0.52) +
      ' S' + X(0.86) + ' ' + Y(0.74) + ' ' + X(0.945) + ' ' + Y(0.5) +
      ' Q' + X(0.972) + ' ' + Y(0.34) + ' ' + X(0.995) + ' ' + Y(0.06);
  }

  function fitUnderline(word) {
    var svg = $('.scribble', word);
    if (!svg) return null;
    var path = $('path', svg);
    var box = svg.getBoundingClientRect();
    if (!box.width || !box.height) return null;

    var fontSize = parseFloat(window.getComputedStyle(word).fontSize) || 32;
    var sw = Math.max(2, Math.min(3.4, fontSize * 0.048));

    svg.setAttribute('viewBox', '0 0 ' + box.width.toFixed(1) + ' ' + box.height.toFixed(1));
    path.setAttribute('d', scribblePath(box.width, box.height, sw));
    path.style.strokeWidth = sw + 'px';
    return { svg: svg, path: path, length: path.getTotalLength() };
  }

  function showDrawn(word) {
    var fit = fitUnderline(word);
    var svg = $('.scribble', word);
    if (svg) svg.style.opacity = '1';
    if (!fit) return;
    fit.path.style.strokeDasharray = '';
    fit.path.style.strokeDashoffset = '';
  }

  function drawUnderline(word, options) {
    var opts = options || {};
    var delay = opts.delay || 0;
    var duration = opts.duration || 900;

    if (!animOK || reducedMotion.matches || !Element.prototype.animate) {
      showDrawn(word);
      return null;
    }

    var fit = fitUnderline(word);
    if (!fit) { showDrawn(word); return null; }

    if (word._draw) word._draw.cancel();

    var len = fit.length;
    fit.path.style.strokeDasharray = len + ' ' + len;
    fit.path.style.strokeDashoffset = len;
    fit.svg.style.opacity = '1';

    var anim = fit.path.animate(
      [{ strokeDashoffset: len }, { strokeDashoffset: 0 }],
      { duration: duration, delay: delay, easing: 'cubic-bezier(.65, 0, .35, 1)', fill: 'both' }
    );
    word._draw = anim;

    var settle = function () {
      if (word._draw !== anim) return;
      anim.cancel();
      word._draw = null;
      fit.path.style.strokeDasharray = '';
      fit.path.style.strokeDashoffset = '';
    };
    anim.onfinish = settle;
    /* Background tabs pause animations; never leave the stroke half drawn. */
    window.setTimeout(settle, delay + duration + 1500);
    return anim;
  }

  window.drawUnderline = drawUnderline;

  (function underlines() {
    var words = $$('[data-draw]');
    if (!words.length) return;

    var canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    words.forEach(function (word) {
      var mode = word.dataset.draw;

      if (mode === 'load' && animOK) {
        fontsReady.then(function () { drawUnderline(word, { delay: 300 }); });
      } else if (mode === 'view' && animOK && 'IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            io.disconnect();
            drawUnderline(word, { delay: 150 });
          });
        }, { threshold: 0.6 });
        io.observe(word);
      } else if (mode !== 'hero') {
        fontsReady.then(function () { showDrawn(word); });
      }

      if (canHover && animOK) {
        var heading = word.closest('h1, h2') || word;
        /* The hero word is rebuilt whenever the headline re-splits. */
        var current = mode === 'hero'
          ? function () { return $('.hl-home__word', heading); }
          : function () { return word; };
        heading.addEventListener('mouseenter', function () {
          var w = current();
          if (!w || w._draw || reducedMotion.matches) return;
          if (mode === 'hero' && !$('#hero').classList.contains('is-landed')) return;
          drawUnderline(w, { duration: 500 });
        });
      }
    });

    onResize(function () {
      words.forEach(function (word) {
        if (word.dataset.draw !== 'hero' && !word._draw) showDrawn(word);
      });
    });
  }());

  /* ------------------------------------------------------------------------
     2. How the homepage lands
     T0 is 150ms before the intro overlay finishes, or the moment the fonts
     are ready (never waiting more than 300ms). Everything settles by about
     T0 + 2.2s. Buttons are clickable from the first frame.
     ------------------------------------------------------------------------ */

  (function landing() {
    var hero = $('#hero');
    var title = hero && $('.hero__title', hero);
    if (!hero || !title) return;

    var escape = function (s) {
      return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    };

    var hl = $('.hl', title);
    var source = hl ? hl.innerHTML : '';

    /* Split by rendered line, not by a fixed count: the headline wraps
       differently on every width. "at home." is bound by a no-break space so
       "home." can never sit on a line alone. */
    function split() {
      hl.innerHTML = source;
      title.classList.remove('is-split', 'hl--words');

      var text = $('.hl-text', hl);
      var home = $('.hl-home', hl);
      var words = text.textContent.trim().split(/\s+/);
      text.innerHTML = words.map(function (w) {
        return '<span class="w">' + escape(w) + '</span>';
      }).join(' ');

      var lines = [];
      var lastTop = null;
      $$('.w', text).forEach(function (w) {
        var top = w.offsetTop;
        if (lastTop === null || Math.abs(top - lastTop) > 4) {
          lines.push([]);
          lastTop = top;
        }
        lines[lines.length - 1].push(w.textContent);
      });

      if (!lines.length || !home) throw new Error('split failed');

      var homeHTML = home.outerHTML;
      hl.innerHTML = lines.map(function (line, i) {
        var html = '<span class="line__mask"><span class="line__inner" style="--i:' + i + '">' +
          escape(line.join(' ')) + '</span></span>';
        if (i === lines.length - 1) html += '&nbsp;' + homeHTML;
        return '<span class="line">' + html + '</span>';
      }).join(' ');
      title.classList.add('is-split');
    }

    /* Fallback: reveal word by word if line splitting fails. */
    function splitWords() {
      hl.innerHTML = source;
      var text = $('.hl-text', hl);
      var words = text.textContent.trim().split(/\s+/);
      text.innerHTML = words.map(function (w, i) {
        return '<span class="w" style="--i:' + i + '">' + escape(w) + '</span>';
      }).join(' ');
      title.classList.add('hl--words');
    }

    function prepare() {
      try { split(); } catch (e) { splitWords(); }
    }

    var homeWord = function () { return $('.hl-home__word', title); };

    if (!animOK) {
      fontsReady.then(function () { var w = homeWord(); if (w) showDrawn(w); });
      return;
    }

    var started = false;
    var landed = false;

    function settle() {
      if (landed) return;
      landed = true;
      hero.classList.add('is-landed');
    }

    function start() {
      if (started) return;
      started = true;

      prepare();
      /* Flush styles so the pre-states are committed before the landing
         class arrives; otherwise nothing has anything to transition from. */
      void title.offsetHeight;

      window.requestAnimationFrame(function () {
        hero.classList.add('is-landing');
        var w = homeWord();
        if (w) drawUnderline(w, { delay: 1100, duration: 900 });
      });

      window.setTimeout(settle, 2700);
    }

    if (root.classList.contains('intro-hold')) {
      document.addEventListener('maxx:intro-release', function () {
        root.classList.remove('intro-hold');
        start();
      }, { once: true });
    } else {
      Promise.race([
        fontsReady,
        new Promise(function (resolve) { window.setTimeout(resolve, 300); })
      ]).then(start);
    }

    /* Hard failsafe: the hero is never left hidden. */
    window.setTimeout(function () { start(); settle(); }, 7500);

    /* Re-split on resize, and once more if the fonts land after T0. */
    var resplit = function () {
      if (!started) return;
      settle();
      prepare();
      var w = homeWord();
      if (w) showDrawn(w);
    };
    onResize(resplit);
    fontsReady.then(function () {
      if (!started) return;
      var wait = landed ? 0 : 2800;
      window.setTimeout(function () {
        var before = title.offsetHeight;
        prepare();
        if (title.offsetHeight !== before || landed) {
          var w = homeWord();
          if (w) showDrawn(w);
        }
      }, wait);
    });
  }());

  /* ------------------------------------------------------------------------
     3. Dotted path lines that trace themselves once, when seen
     ------------------------------------------------------------------------ */

  (function traces() {
    var lines = $$('[data-trace]');
    if (!lines.length || !animOK || !('IntersectionObserver' in window)) return;
    /* Observe the parent: the line itself starts fully clipped, and an
       observer counts a clipped-away target as never visible. */
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        $('[data-trace]', entry.target).classList.add('is-drawn');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.4 });
    lines.forEach(function (el) { io.observe(el.parentNode); });
  }());

  /* ------------------------------------------------------------------------
     4. Announcement bar — dismissal lasts the session
     ------------------------------------------------------------------------ */

  (function announcement() {
    var bar = $('#announce');
    var close = $('#announce-close');
    if (!bar || !close) return;

    var dismissed = false;
    try {
      dismissed = window.sessionStorage.getItem('maxx-announce') === 'dismissed';
    } catch (e) { /* private mode */ }

    if (dismissed) bar.hidden = true;

    close.addEventListener('click', function () {
      bar.hidden = true;
      try { window.sessionStorage.setItem('maxx-announce', 'dismissed'); } catch (e) {}
    });
  }());

  /* ------------------------------------------------------------------------
     5. Header — rule appears and logo condenses past 40px
     ------------------------------------------------------------------------ */

  (function header() {
    var el = $('#header');
    if (!el) return;

    var ticking = false;
    var apply = function () {
      el.classList.toggle('is-scrolled', window.scrollY > 40);
      ticking = false;
    };

    apply();
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(apply);
    }, { passive: true });
  }());

  /* ------------------------------------------------------------------------
     6. Services dropdown — hover, click, and keyboard
     ------------------------------------------------------------------------ */

  (function dropdown() {
    $$('[data-menu]').forEach(function (wrap) {
      var trigger = $('[data-menu-trigger]', wrap);
      var menu = $('.submenu', wrap);
      if (!trigger || !menu) return;

      var hoverTimer = null;

      var open = function () {
        window.clearTimeout(hoverTimer);
        menu.hidden = false;
        wrap.dataset.open = 'true';
        trigger.setAttribute('aria-expanded', 'true');
      };

      var close = function () {
        menu.hidden = true;
        wrap.dataset.open = 'false';
        trigger.setAttribute('aria-expanded', 'false');
      };

      /* "Services" is a real link to the services page. Hover or keyboard
         focus shows the menu; a click always navigates. */
      wrap.addEventListener('mouseenter', open);
      wrap.addEventListener('mouseleave', function () {
        hoverTimer = window.setTimeout(close, 180);
      });

      /* Escape hands focus back to "Services" without reopening the menu. */
      var dismissed = false;
      wrap.addEventListener('focusin', function () {
        if (dismissed) { dismissed = false; return; }
        open();
      });
      wrap.addEventListener('focusout', function (ev) {
        if (!wrap.contains(ev.relatedTarget)) close();
      });

      wrap.addEventListener('keydown', function (ev) {
        if (ev.key !== 'Escape' || menu.hidden) return;
        close();
        if (document.activeElement !== trigger) {
          dismissed = true;
          trigger.focus();
        }
      });

      document.addEventListener('click', function (ev) {
        if (!wrap.contains(ev.target)) close();
      });
    });
  }());

  /* ------------------------------------------------------------------------
     7. Mobile drawer — focus trapped, Escape closes, scroll locked
     ------------------------------------------------------------------------ */

  (function drawer() {
    var panel = $('#drawer');
    var backdrop = $('#drawer-backdrop');
    var openBtn = $('#menu-open');
    var closeBtn = $('#menu-close');
    if (!panel || !backdrop || !openBtn || !closeBtn) return;

    var FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';
    var lastFocused = null;

    function open() {
      lastFocused = document.activeElement;
      panel.hidden = false;
      backdrop.hidden = false;
      window.requestAnimationFrame(function () {
        panel.classList.add('is-open');
        backdrop.classList.add('is-open');
      });
      document.body.classList.add('is-locked');
      openBtn.setAttribute('aria-expanded', 'true');
      closeBtn.focus();
      document.addEventListener('keydown', onKeydown);
    }

    function close() {
      panel.classList.remove('is-open');
      backdrop.classList.remove('is-open');
      document.body.classList.remove('is-locked');
      openBtn.setAttribute('aria-expanded', 'false');
      document.removeEventListener('keydown', onKeydown);

      var hide = function () {
        panel.hidden = true;
        backdrop.hidden = true;
      };
      if (reducedMotion.matches) { hide(); } else { window.setTimeout(hide, 320); }

      if (lastFocused) lastFocused.focus();
    }

    function onKeydown(ev) {
      if (ev.key === 'Escape') {
        close();
        return;
      }
      if (ev.key !== 'Tab') return;

      var items = $$(FOCUSABLE, panel).filter(function (el) {
        return el.offsetParent !== null;
      });
      if (!items.length) return;

      var first = items[0];
      var last = items[items.length - 1];

      if (ev.shiftKey && document.activeElement === first) {
        ev.preventDefault();
        last.focus();
      } else if (!ev.shiftKey && document.activeElement === last) {
        ev.preventDefault();
        first.focus();
      }
    }

    openBtn.addEventListener('click', open);
    closeBtn.addEventListener('click', close);
    backdrop.addEventListener('click', close);
    $$('a', panel).forEach(function (link) {
      link.addEventListener('click', close);
    });
  }());

  /* ------------------------------------------------------------------------
     8. Open / closed, calculated in Central Time
     ------------------------------------------------------------------------ */

  (function hours() {
    var card = $('#hours-card');
    var label = $('#hours-status');
    if (!card || !label) return;

    var parts;
    try {
      parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Chicago',
        weekday: 'short',
        hour: 'numeric',
        minute: 'numeric',
        hour12: false
      }).formatToParts(new Date());
    } catch (e) {
      return;
    }

    var get = function (type) {
      var found = parts.filter(function (p) { return p.type === type; })[0];
      return found ? found.value : '';
    };

    var day = get('weekday');
    var hour = parseInt(get('hour'), 10);
    var minute = parseInt(get('minute'), 10);
    if (isNaN(hour) || isNaN(minute)) return;
    if (hour === 24) hour = 0;

    var weekday = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].indexOf(day) !== -1;
    var minutes = (hour * 60) + minute;
    var isOpen = weekday && minutes >= 9 * 60 && minutes < 17 * 60;

    card.dataset.open = isOpen ? 'true' : 'false';
    label.textContent = isOpen ? 'Open now' : 'Currently closed';
  }());

  /* ------------------------------------------------------------------------
     9. Mobile action bar — appears after 400px
     ------------------------------------------------------------------------ */

  (function actionbar() {
    var bar = $('#actionbar');
    if (!bar) return;

    var ticking = false;
    var apply = function () {
      bar.classList.toggle('is-visible', window.scrollY > 400);
      ticking = false;
    };

    apply();
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(apply);
    }, { passive: true });
  }());

  /* ------------------------------------------------------------------------
     10. Cookie notice — nothing non-essential loads until accepted
     ------------------------------------------------------------------------ */

  (function cookies() {
    var box = $('#cookie');
    if (!box) return;

    var stored = null;
    try { stored = window.localStorage.getItem('maxx-cookies'); } catch (e) {}

    if (stored === 'all' || stored === 'essential') return;

    box.hidden = false;

    var decide = function (value) {
      box.hidden = true;
      try { window.localStorage.setItem('maxx-cookies', value); } catch (e) {}
    };

    $('#cookie-accept').addEventListener('click', function () { decide('all'); });
    $('#cookie-decline').addEventListener('click', function () { decide('essential'); });
  }());

  /* ------------------------------------------------------------------------
     11. Map — click to load, so nothing reaches Google unprompted
     ------------------------------------------------------------------------ */

  (function map() {
    var wrap = $('#map');
    var facade = $('#map-facade');
    var button = $('#map-load');
    if (!wrap || !facade || !button) return;

    button.addEventListener('click', function () {
      var frame = document.createElement('iframe');
      frame.src = wrap.dataset.embed;
      frame.title = 'Map showing Maxx Home Health Care at 1500 1st Ave NE, Unit 201C, Rochester, Minnesota';
      frame.loading = 'lazy';
      frame.referrerPolicy = 'no-referrer-when-downgrade';
      frame.setAttribute('allowfullscreen', '');
      facade.remove();
      wrap.appendChild(frame);
    });
  }());

  /* ------------------------------------------------------------------------
     12. Attachments: every chosen file listed, each removable before sending.
     A second pick adds to the list instead of replacing it.
     ------------------------------------------------------------------------ */

  (function attachments() {
    if (!window.DataTransfer) return;
    var MAX_BYTES = 10 * 1024 * 1024;

    function size(bytes) {
      return bytes < 1024 * 1024
        ? Math.max(1, Math.round(bytes / 1024)) + ' KB'
        : (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    $$('form[data-form] input[type="file"]').forEach(function (input) {
      var kept = new DataTransfer();

      var list = document.createElement('ul');
      list.className = 'file-list';
      list.hidden = true;
      list.setAttribute('aria-label', 'Attached files');

      var status = document.createElement('p');
      status.className = 'file-list__head';
      status.setAttribute('aria-live', 'polite');

      var error = document.createElement('p');
      error.className = 'error';
      error.id = input.id + '-error';
      error.setAttribute('aria-live', 'polite');

      input.insertAdjacentElement('afterend', error);
      input.insertAdjacentElement('afterend', list);
      input.insertAdjacentElement('afterend', status);
      input.setAttribute('aria-describedby',
        ((input.getAttribute('aria-describedby') || '') + ' ' + error.id).trim());

      function render() {
        list.innerHTML = '';
        Array.prototype.forEach.call(kept.files, function (file, i) {
          var li = document.createElement('li');
          var name = document.createElement('span');
          name.className = 'file-list__name';
          name.textContent = file.name;
          var bytes = document.createElement('span');
          bytes.className = 'file-list__size';
          bytes.textContent = size(file.size);
          var remove = document.createElement('button');
          remove.type = 'button';
          remove.textContent = 'Remove';
          remove.setAttribute('aria-label', 'Remove ' + file.name);
          remove.addEventListener('click', function () { drop(i); });
          li.appendChild(name);
          li.appendChild(bytes);
          li.appendChild(remove);
          list.appendChild(li);
        });
        var n = kept.files.length;
        list.hidden = n === 0;
        status.textContent = n ? 'Attachments (' + n + ')' : '';
        input.files = kept.files;
      }

      function drop(index) {
        var next = new DataTransfer();
        Array.prototype.forEach.call(kept.files, function (file, i) {
          if (i !== index) next.items.add(file);
        });
        kept = next;
        render();
        var buttons = $$('button', list);
        (buttons[Math.min(index, buttons.length - 1)] || input).focus();
      }

      input.addEventListener('change', function () {
        var tooBig = [];
        if (!input.multiple) kept = new DataTransfer();
        Array.prototype.forEach.call(input.files, function (file) {
          if (file.size > MAX_BYTES) { tooBig.push(file.name); return; }
          var duplicate = Array.prototype.some.call(kept.files, function (f) {
            return f.name === file.name && f.size === file.size;
          });
          if (!duplicate) kept.items.add(file);
        });
        error.textContent = tooBig.length
          ? tooBig.join(', ') + (tooBig.length > 1 ? ' are' : ' is') + ' over 10 MB and was not added.'
          : '';
        render();
      });
    });
  }());

  /* ------------------------------------------------------------------------
     13. Contact form: preselect from the link that brought the visitor here
     ?type=care | referral | general   and   ?service=<id>
     ------------------------------------------------------------------------ */

  (function prefill() {
    var form = $('#care-form');
    if (!form || !window.URLSearchParams) return;

    var params = new URLSearchParams(window.location.search);
    var SERVICES = {
      'home-care-nursing': 'Home Care Nursing',
      'private-duty-nursing': 'Private Duty Nursing',
      'homemaking': 'Homemaking',
      'respite-care': 'Respite Care',
      'companionship': 'Companionship',
      'emergency-support': '24-Hour Emergency Support',
      'cfss': 'Community First Services and Supports (CFSS)'
    };

    var type = params.get('type');
    if (['care', 'referral', 'general'].indexOf(type) !== -1) {
      $$('input[name="topic"]', form).forEach(function (input) {
        input.checked = input.value === type;
      });
    }

    var service = SERVICES[params.get('service')];
    if (service && form.elements.service) form.elements.service.value = service;
  }());

  /* ------------------------------------------------------------------------
     14. Forms — one handler for every form marked data-form
     Validation runs on blur, never on each keystroke. The server checks
     everything again. Success appears only after the email has been sent.
     ------------------------------------------------------------------------ */

  var rules = {
    name: function (v) {
      return v.trim().length >= 2 ? '' : 'Please tell us your name.';
    },
    email: function (v) {
      if (!v.trim()) return 'Please add an email address so we can reply.';
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())
        ? '' : 'That email address does not look complete.';
    },
    phone: function (v) {
      var digits = v.replace(/\D/g, '');
      if (!digits) return 'Please add a phone number.';
      return digits.length >= 10 ? '' : 'Please include the area code.';
    }
  };

  function ruleFor(input) {
    if (rules[input.name]) return rules[input.name];
    if (!input.required) return null;
    if (input.tagName === 'SELECT') {
      return function (v) { return v ? '' : 'Please choose an option.'; };
    }
    if (input.type === 'checkbox') {
      return function () {
        return input.checked ? '' : (input.dataset.message || 'Please tick this box to continue.');
      };
    }
    if (input.type === 'text' || input.tagName === 'TEXTAREA') {
      return function (v) { return v.trim() ? '' : 'Please fill this in.'; };
    }
    return null;
  }

  function showError(input, message) {
    var out = $('#' + input.id + '-error');
    if (message) {
      input.setAttribute('aria-invalid', 'true');
      if (out) out.textContent = message;
    } else {
      input.removeAttribute('aria-invalid');
      if (out) out.textContent = '';
    }
  }

  function validateField(input) {
    var rule = ruleFor(input);
    if (!rule || input.disabled) return true;
    var message = rule(input.value);
    showError(input, message);
    return !message;
  }

  /* Cloudflare Turnstile, loaded on first interaction with a form. The site
     key is public; the secret lives only on the server. */
  var turnstileReady = null;
  function loadTurnstile() {
    if (!turnstileReady) {
      turnstileReady = new Promise(function (resolve, reject) {
        var s = document.createElement('script');
        s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        s.async = true;
        s.onload = function () { resolve(window.turnstile); };
        s.onerror = reject;
        document.head.appendChild(s);
      });
    }
    return turnstileReady;
  }

  $$('form[data-form]').forEach(function (form) {
    var success = document.getElementById(form.dataset.success);
    var formError = $('[data-form-error]', form);
    var submitBtn = $('[type="submit"]', form);
    var box = $('[data-turnstile]', form);

    /* Topic switch: show the fields that type of message needs, and take the
       others out of the form entirely so they are neither checked nor sent. */
    var topics = $$('input[name="topic"]', form);
    function syncTopic() {
      var current = (topics.filter(function (i) { return i.checked; })[0] || {}).value;
      topics.forEach(function (input) {
        input.closest('label').classList.toggle('is-selected', input.checked);
      });
      if (!current) return;
      $$('[data-show]', form).forEach(function (el) {
        var on = el.dataset.show.split(' ').indexOf(current) !== -1;
        el.hidden = !on;
        $$('input, select, textarea', el).forEach(function (f) {
          f.disabled = !on;
          if (!on) showError(f, '');
        });
      });
      $$('[data-required-for]', form).forEach(function (f) {
        f.required = f.dataset.requiredFor.split(' ').indexOf(current) !== -1;
        if (!f.required) showError(f, '');
      });
    }
    topics.forEach(function (input) { input.addEventListener('change', syncTopic); });
    syncTopic();

    var controls = $$('input, select, textarea', form);
    controls.forEach(function (input) {
      var evt = input.type === 'checkbox' || input.tagName === 'SELECT' ? 'change' : 'blur';
      input.addEventListener(evt, function () { validateField(input); });
      input.addEventListener('input', function () {
        if (input.getAttribute('aria-invalid') === 'true') validateField(input);
      });
    });

    /* Spam check: render on first interaction, hand back a token on submit. */
    var widget = null;
    var token = '';
    var waiting = [];
    function settle(value) {
      token = value;
      waiting.splice(0).forEach(function (fn) { fn(value); });
    }
    function startTurnstile() {
      if (widget !== null || !box || !TURNSTILE_SITE_KEY) return;
      widget = false;
      loadTurnstile().then(function (ts) {
        widget = ts.render(box, {
          sitekey: TURNSTILE_SITE_KEY,
          appearance: 'interaction-only',
          callback: settle,
          'expired-callback': function () { token = ''; },
          'error-callback': function () { settle(''); }
        });
      }).catch(function () { settle(''); });
    }
    function getToken() {
      if (token) return Promise.resolve(token);
      startTurnstile();
      return new Promise(function (resolve) {
        waiting.push(resolve);
        window.setTimeout(function () { resolve(token); }, 15000);
      });
    }
    form.addEventListener('focusin', startTurnstile);

    var SORRY = 'We couldn’t send your message just now. Please call us at 507-884-8277 and we’ll take care of you.';

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (formError) formError.textContent = '';

      var firstBad = null;
      controls.forEach(function (input) {
        if (!validateField(input) && !firstBad) firstBad = input;
      });
      if (firstBad) {
        if (formError) formError.textContent = 'Please check the highlighted fields above.';
        firstBad.focus();
        return;
      }

      var original = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';

      function fail(message) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = original;
        if (formError) formError.textContent = message || SORRY;
        /* A Turnstile token works once; get a fresh one for the next try. */
        token = '';
        if (widget && window.turnstile) window.turnstile.reset(widget);
      }

      /* No site key yet: send without the spam check (the server skips it too
         until its secret is set). */
      (TURNSTILE_SITE_KEY ? getToken() : Promise.resolve(null)).then(function (t) {
        if (TURNSTILE_SITE_KEY && !t) { fail(); return null; }
        var body = new FormData(form);
        if (t) body.set('cf-turnstile-response', t);
        return window.fetch(FORM_ENDPOINT, {
          method: 'POST',
          body: body,
          headers: { Accept: 'application/json' }
        }).then(function (res) {
          return res.json().catch(function () { return {}; }).then(function (data) {
            if (res.ok && data.ok) {
              form.hidden = true;
              if (success) {
                success.hidden = false;
                success.focus();
              }
              return;
            }
            var first = null;
            Object.keys(data.fields || {}).forEach(function (name) {
              var input = form.elements[name];
              if (input && input.id) {
                showError(input, data.fields[name]);
                if (!first) first = input;
              }
            });
            fail(data.error);
            if (first) first.focus();
          });
        });
      }).catch(function () { fail(); });
    });
  });

}());
