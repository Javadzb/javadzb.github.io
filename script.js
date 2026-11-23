(() => {
  const doc = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  doc.classList.add('js');

  document.getElementById('year').textContent = new Date().getFullYear();

  /* Project filters */
  const buttons = document.querySelectorAll('.filter');
  const cards = document.querySelectorAll('.project');
  buttons.forEach(button => button.addEventListener('click', () => {
    const tag = button.dataset.filter;
    buttons.forEach(b => {
      b.classList.toggle('active', b === button);
      b.setAttribute('aria-pressed', String(b === button));
    });
    cards.forEach(card => {
      card.hidden = tag !== 'all' && !card.dataset.tags.split(' ').includes(tag);
      if (!card.hidden) card.classList.add('in');
    });
  }));

  /* Mobile menu */
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('site-nav');
  const setMenu = open => {
    nav.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
  };
  toggle.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
  nav.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
  document.addEventListener('click', e => { if (!e.target.closest('.site-header')) setMenu(false); });

  /* Header state and reading progress */
  const header = document.querySelector('.site-header');
  const progress = document.querySelector('.scroll-progress');
  let ticking = false;
  const onScroll = () => {
    const max = doc.scrollHeight - window.innerHeight;
    header.classList.toggle('scrolled', window.scrollY > 8);
    progress.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`;
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  /* Highlight the section currently in view */
  const links = [...nav.querySelectorAll('a[href^="#"]')];
  const sections = links.map(a => document.getElementById(a.getAttribute('href').slice(1))).filter(Boolean);
  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        links.forEach(a => {
          if (a.getAttribute('href') === '#' + entry.target.id) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(s => spy.observe(s));
  }

  /* Reveal on scroll */
  const revealTargets = document.querySelectorAll(
    '.section-top, .filters, .project, .spotlight-card, .timeline-item, .paper-list a, .ip-panel, .about-grid > div, .contact-section .wrap > *, .journey-section .wrap > h2, .journey-section .wrap > .kicker, .journey-section .section-intro'
  );
  if (!reduceMotion && 'IntersectionObserver' in window) {
    const seen = new Map();
    revealTargets.forEach(el => {
      const n = seen.get(el.parentElement) || 0;
      seen.set(el.parentElement, n + 1);
      el.style.setProperty('--d', Math.min(n, 5) * 70 + 'ms');
      el.classList.add('reveal');
    });
    const reveal = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('in'); reveal.unobserve(entry.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    revealTargets.forEach(el => reveal.observe(el));
  }

  /* Autoplay video: off when reduced motion is requested */
  if (reduceMotion) {
    document.querySelectorAll('video[autoplay]').forEach(v => {
      v.removeAttribute('autoplay'); v.pause(); v.controls = true;
    });
  }

  /* Hero backdrop: layered signal waves */
  const canvas = document.querySelector('.hero-canvas');
  const ctx = canvas && canvas.getContext('2d');
  if (ctx) {
    const waves = [
      { amp: 34, len: 520, speed: 0.22, y: 0.62, color: 'rgba(181,229,202,0.50)', width: 1.4 },
      { amp: 22, len: 310, speed: -0.31, y: 0.66, color: 'rgba(127,212,245,0.38)', width: 1.1 },
      { amp: 46, len: 760, speed: 0.14, y: 0.72, color: 'rgba(181,229,202,0.22)', width: 1 },
      { amp: 14, len: 190, speed: 0.48, y: 0.78, color: 'rgba(127,212,245,0.20)', width: 1 },
      { amp: 28, len: 430, speed: -0.19, y: 0.84, color: 'rgba(181,229,202,0.14)', width: 1 }
    ];
    let w = 0, h = 0, raf = 0, visible = true;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const draw = time => {
      const t = time / 1000;
      ctx.clearRect(0, 0, w, h);
      for (const wave of waves) {
        ctx.beginPath();
        for (let x = 0; x <= w; x += 6) {
          const envelope = 0.55 + 0.45 * Math.sin(x / (wave.len * 2.6) + t * wave.speed * 0.6);
          const y = h * wave.y + Math.sin(x / wave.len * Math.PI * 2 + t * wave.speed * 2.2) * wave.amp * envelope;
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = wave.color; ctx.lineWidth = wave.width; ctx.stroke();
      }
    };
    const loop = time => { draw(time); raf = requestAnimationFrame(loop); };
    const start = () => { if (!raf && visible && !document.hidden && !reduceMotion) raf = requestAnimationFrame(loop); };
    const stop = () => { cancelAnimationFrame(raf); raf = 0; };
    resize(); draw(0);
    window.addEventListener('resize', () => { resize(); draw(performance.now()); });
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; visible ? start() : stop(); }).observe(canvas);
    }
    start();
  }
})();
