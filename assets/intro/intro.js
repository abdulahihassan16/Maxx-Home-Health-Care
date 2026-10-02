/* First-visit logo intro. See intro.css. No dependencies. */
(function () {
  'use strict';

  var PLAYBACK_RATE = 1.25;    // try 1.15-1.25 if the middle drags
  var START_TIMEOUT = 800;     // ms the video gets to start playing
  var FALLBACK_HOLD = 400;     // ms on the still end frame when autoplay fails
  var REDUCED_HOLD = 300;      // ms on the end frame under reduced motion
  var REDUCED_FADE = 400;      // ms fade-out under reduced motion
  var EXIT_DURATION = 600;     // ms lift-away
  var EXIT_RISE = 48;          // px the logo rises while fading
  var HERO_OVERLAP = 150;      // ms before exit ends that the hero starts
  var MAX_TOTAL = 5000;        // ms from navigation start; hard ceiling

  var root = document.documentElement;
  var overlay = document.getElementById('intro');
  if (!overlay) return;
  if (!root.classList.contains('intro-on')) { overlay.remove(); return; }

  var video = overlay.querySelector('video');

  /* Derived from the poster attribute rather than hardcoded, so this always
     carries the same cache-busting version as the HTML that loaded it —
     two independently-maintained copies of that query string is how a stale
     fallback image survives past its own fix. */
  var END_FRAME = video
    ? video.getAttribute('poster').replace('intro-poster.webp', 'intro-end.webp')
    : 'assets/intro/intro-end.webp';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var timers = [];
  var exiting = false;

  overlay.style.setProperty('--intro-exit', EXIT_DURATION + 'ms');
  overlay.style.setProperty('--intro-rise', EXIT_RISE + 'px');

  function later(fn, ms) { timers.push(window.setTimeout(fn, Math.max(0, ms))); }

  function swapToEndFrame() {
    if (!video) return;
    var img = new Image();
    img.src = END_FRAME;
    img.alt = '';
    img.width = 1920;
    img.height = 1080;
    img.className = 'intro__media';
    video.pause();
    video.replaceWith(img);
    video = null;
  }

  function release() {
    document.dispatchEvent(new CustomEvent('maxx:intro-release'));
  }

  /* Focus is left at the document start, so the first Tab reaches the skip
     link. Calling focus() on it would paint the focus ring over the logo for
     every mouse and touch visitor. */
  function finish() {
    overlay.remove();
    root.classList.remove('intro-on', 'intro-hold');
  }

  function onSkip() { exit(); }

  function exit() {
    if (exiting) return;
    exiting = true;
    timers.forEach(window.clearTimeout);
    window.removeEventListener('pointerdown', onSkip);
    window.removeEventListener('keydown', onSkip);

    if (reduced) {
      overlay.style.transition = 'opacity ' + REDUCED_FADE + 'ms ease';
      overlay.classList.add('is-fading');
      release();
      window.setTimeout(finish, REDUCED_FADE);
      return;
    }

    overlay.classList.add('is-exiting');
    window.setTimeout(release, EXIT_DURATION - HERO_OVERLAP);
    window.setTimeout(finish, EXIT_DURATION);
  }

  window.addEventListener('pointerdown', onSkip);
  window.addEventListener('keydown', onSkip);

  // Whatever happens, the lift-away finishes by MAX_TOTAL.
  later(exit, MAX_TOTAL - EXIT_DURATION - window.performance.now());

  if (reduced) {
    swapToEndFrame();
    later(exit, REDUCED_HOLD);
    return;
  }

  var pageReady = Promise.all([
    new Promise(function (resolve) {
      if (document.readyState === 'complete') resolve();
      else window.addEventListener('load', resolve, { once: true });
    }),
    document.fonts ? document.fonts.ready : Promise.resolve()
  ]);

  /* The inline script after the <video> may already have started loading it
     (and it may already be playing), so the download never waits on this
     deferred file. */
  var started = !video.paused && video.currentTime > 0;
  video.addEventListener('playing', function () { started = true; }, { once: true });
  video.addEventListener('ended', function () { pageReady.then(exit); }, { once: true });

  video.defaultPlaybackRate = PLAYBACK_RATE;
  if (!video.dataset.loading) {
    Array.prototype.forEach.call(video.querySelectorAll('source[data-src]'), function (s) {
      s.src = s.getAttribute('data-src');
    });
    video.load();
  }
  video.playbackRate = PLAYBACK_RATE;
  var attempt = video.play();
  if (attempt && attempt.catch) attempt.catch(function () {});

  later(function () {
    if (started || (!video.paused && video.currentTime > 0)) return;
    swapToEndFrame();
    later(exit, FALLBACK_HOLD);
  }, START_TIMEOUT);
}());
