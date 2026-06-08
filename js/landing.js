// ============================================
// BoardFlow Landing Page — Interactions
// ============================================

(function () {
  'use strict';

  const LandingPage = {
    init() {
      if (!document.querySelector('.landing-page')) return;

      this.initScrollReveal();
      this.initMobileNav();
      this.initSmoothScroll();
      this.initStickyCTA();
      this.initNavScroll();
      this.initFAQ();
      this.initCounters();
      this.initThemeToggle();
      this.initLangSelector();
      this.initHeroParallax();
      this.initStaggeredReveal();
      this.initGlitchEffects();
      this.initHeroTypewriter();
    },

    // ---- Theme Toggle ----

    initThemeToggle() {
      const toggle = document.getElementById('theme-toggle');
      if (!toggle) return;

      const savedTheme = localStorage.getItem('boardflow_theme') || 'light';
      document.documentElement.setAttribute('data-theme', savedTheme);

      toggle.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme') || 'light';
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('boardflow_theme', next);
      });
    },

    // ---- Language Selector ----

    initLangSelector() {
      const selector = document.getElementById('lang-selector');
      if (!selector) return;

      const currentLang = localStorage.getItem('boardflow_lang') || 'en';
      selector.value = currentLang;

      selector.addEventListener('change', () => {
        const lang = selector.value;
        if (window.I18n && typeof window.I18n.setLanguage === 'function') {
          window.I18n.setLanguage(lang);
        } else {
          localStorage.setItem('boardflow_lang', lang);
          location.reload();
        }
      });
    },

    // ---- Scroll-Triggered Reveals ----

    initScrollReveal() {
      const els = document.querySelectorAll('[data-animate]');
      if (!els.length) return;

      if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('in-view');
              observer.unobserve(entry.target);
            }
          });
        }, {
          threshold: 0.12,
          rootMargin: '0px 0px -40px 0px'
        });

        els.forEach(el => {
          const rect = el.getBoundingClientRect();
          const isInView = rect.top < window.innerHeight - 60;
          if (isInView) {
            el.classList.add('in-view');
          } else {
            observer.observe(el);
          }
        });
      } else {
        els.forEach(el => el.classList.add('in-view'));
      }
    },

    // ---- Mobile Nav Toggle ----

    initMobileNav() {
      const toggle = document.getElementById('landing-nav-toggle');
      const navLinks = document.getElementById('landing-nav-links') || document.querySelector('.landing-nav-links');

      if (!toggle || !navLinks) return;

      function setOpen(isOpen) {
        navLinks.classList.toggle('open', isOpen);
        toggle.setAttribute('aria-expanded', String(isOpen));
        document.body.style.overflow = isOpen ? 'hidden' : '';
      }

      toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        setOpen(!navLinks.classList.contains('open'));
      });

      document.addEventListener('click', (e) => {
        if (navLinks.classList.contains('open') && !navLinks.contains(e.target) && e.target !== toggle) {
          setOpen(false);
        }
      });

      navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => setOpen(false));
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navLinks.classList.contains('open')) {
          setOpen(false);
          toggle.focus();
        }
      });
    },

    // ---- Smooth Scroll for Anchor Links ----

    initSmoothScroll() {
      document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        const href = anchor.getAttribute('href');
        if (!href || href === '#') return;

        // Skip SPA route links (/#/login, /#/signup, etc.) — let the router handle those
        if (href.startsWith('#/')) return;

        // Only handle same-page anchor links (#features, #pricing, etc.)
        const targetId = href.slice(1);
        const target = document.getElementById(targetId);
        if (!target) return;

        anchor.addEventListener('click', (e) => {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      });
    },

    // ---- Sticky CTA ----

    initStickyCTA() {
      const sticky = document.querySelector('.landing-sticky-cta');
      const footer = document.querySelector('.landing-footer');

      if (!sticky || !footer) return;

      let lastScrollY = 0;
      let footerVisible = false;

      const footerObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          footerVisible = entry.isIntersecting;
          if (footerVisible) {
            sticky.classList.remove('visible');
          }
        });
      }, { threshold: 0 });

      footerObserver.observe(footer);

      const scrollContainer = document.querySelector('.landing-page');

      if (!scrollContainer) return;

      scrollContainer.addEventListener('scroll', () => {
        const scrollY = scrollContainer.scrollTop;
        const scrolledDown = scrollY > lastScrollY;
        const pastHero = scrollY > 400;

        if (pastHero && scrolledDown && !footerVisible) {
          sticky.classList.add('visible');
        } else if (!scrolledDown || footerVisible) {
          sticky.classList.remove('visible');
        }

        lastScrollY = scrollY;
      }, { passive: true });
    },

    // ---- Nav Scroll Shadow ----

    initNavScroll() {
      const nav = document.querySelector('.landing-nav');
      const legalNav = document.querySelector('.legal-nav');

      if (!nav && !legalNav) return;

      const scrollContainer = document.querySelector('.landing-page, .legal-page');

      if (!scrollContainer) return;

      scrollContainer.addEventListener('scroll', () => {
        if (nav) nav.classList.toggle('scrolled', scrollContainer.scrollTop > 20);
        if (legalNav) legalNav.classList.toggle('scrolled', scrollContainer.scrollTop > 20);
      }, { passive: true });
    },

    // ---- FAQ Accordion ----

    initFAQ() {
      const items = document.querySelectorAll('.landing-faq-item');

      items.forEach(item => {
        const question = item.querySelector('.landing-faq-question');
        if (!question) return;

        question.addEventListener('click', () => {
          const isOpen = item.classList.contains('open');

          items.forEach(i => {
            i.classList.remove('open');
            const btn = i.querySelector('.landing-faq-question');
            if (btn) btn.setAttribute('aria-expanded', 'false');
          });

          if (!isOpen) {
            item.classList.add('open');
            question.setAttribute('aria-expanded', 'true');
          }
        });
      });
    },

    // ---- Animated Counters ----

    initCounters() {
      const counters = document.querySelectorAll('[data-count]');
      if (!counters.length) return;

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.animateCounter(entry.target);
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.5 });

      counters.forEach(el => observer.observe(el));
    },

    animateCounter(el) {
      const target = parseInt(el.getAttribute('data-count'), 10);
      if (isNaN(target)) return;

      const suffix = el.getAttribute('data-suffix') || '';
      const duration = 1200;
      const start = performance.now();

      function update(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(eased * target);

        el.textContent = current + suffix;

        if (progress < 1) {
          requestAnimationFrame(update);
        } else {
          el.textContent = target + suffix;
        }
      }

      requestAnimationFrame(update);
    },

    // ---- Hero Board Mouse Parallax ----

    initHeroParallax() {
      const board = document.querySelector('.landing-hero-board');
      if (!board) return;

      board.addEventListener('mousemove', (e) => {
        const rect = board.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;

        const stickies = board.querySelectorAll('.hero-sticky');
        stickies.forEach(s => {
          const depth = parseFloat(s.style.getPropertyValue('--i') || 0) * 0.3 + 0.3;
          const dx = (x - 0.5) * depth * 12;
          const dy = (y - 0.5) * depth * 12;
          s.style.setProperty('--parallax-x', `${dx}px`);
          s.style.setProperty('--parallax-y', `${dy}px`);
        });
      });

      board.addEventListener('mouseleave', () => {
        document.querySelectorAll('.hero-sticky').forEach(s => {
          s.style.setProperty('--parallax-x', '0px');
          s.style.setProperty('--parallax-y', '0px');
        });
      });
    },

    // ---- Staggered Cascade Reveals ----

    initStaggeredReveal() {
      const containers = document.querySelectorAll('[data-stagger]');
      containers.forEach(container => {
        const children = container.children;
        Array.from(children).forEach((child, i) => {
          child.style.setProperty('--stagger-i', i);
          child.classList.add('stagger-item');
        });

        if ('IntersectionObserver' in window) {
          const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
              if (entry.isIntersecting) {
                container.classList.add('stagger-visible');
                observer.unobserve(container);
              }
            });
          }, { threshold: 0.15 });
          observer.observe(container);
        } else {
          container.classList.add('stagger-visible');
        }
      });
    },

    // ---- Glitch Hover Effect ----

    initGlitchEffects() {
      document.querySelectorAll('[data-glitch]').forEach(el => {
        el.addEventListener('mouseenter', () => {
          el.classList.add('glitch-active');
        });
        el.addEventListener('mouseleave', () => {
          el.classList.remove('glitch-active');
        });
      });
    },

    // ---- Hero Typewriter ----

    initHeroTypewriter() {
      const el = document.getElementById('hero-typewriter');
      if (!el) return;

      let phrases;
      try {
        phrases = JSON.parse(window.I18n && window.I18n.__('typewriter_phrases') || '[]');
      } catch(e) { phrases = []; }
      if (!phrases.length) return;

      let phraseIndex = 0;
      let charIndex = 0;
      let isDeleting = false;
      let isPaused = false;

      function tick() {
        const current = phrases[phraseIndex];

        if (isPaused) {
          isPaused = false;
          isDeleting = true;
          setTimeout(tick, 80);
          return;
        }

        if (isDeleting) {
          charIndex--;
          el.textContent = current.substring(0, charIndex);
          if (charIndex === 0) {
            isDeleting = false;
            phraseIndex = (phraseIndex + 1) % phrases.length;
            setTimeout(tick, 300);
            return;
          }
          setTimeout(tick, 30);
        } else {
          charIndex++;
          el.textContent = current.substring(0, charIndex);
          if (charIndex === current.length) {
            isPaused = true;
            setTimeout(tick, 2000);
            return;
          }
          setTimeout(tick, 60 + Math.random() * 40);
        }
      }

      setTimeout(tick, 800);
    },
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => LandingPage.init());
  } else {
    LandingPage.init();
  }

  window.LandingPage = LandingPage;
})();
