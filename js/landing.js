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
      this.initPreviewTilt();
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
      const navLinks = document.querySelector('.landing-nav-links');

      if (!toggle || !navLinks) return;

      toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        navLinks.classList.toggle('open');
      });

      document.addEventListener('click', (e) => {
        if (!navLinks.contains(e.target) && e.target !== toggle) {
          navLinks.classList.remove('open');
        }
      });

      navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          navLinks.classList.remove('open');
        });
      });
    },

    // ---- Smooth Scroll for Anchor Links ----

    initSmoothScroll() {
      document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        const targetId = anchor.getAttribute('href').slice(1);
        const target = document.getElementById(targetId);
        if (!target) return;

        anchor.addEventListener('click', (e) => {
          if (anchor.getAttribute('href') === '#') return;
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

      window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = scrollY / docHeight;

        if (scrollPercent > 0.15 && scrollY > lastScrollY && !footerVisible) {
          sticky.classList.add('visible');
        } else if (scrollPercent < 0.1 || scrollY < lastScrollY || footerVisible) {
          sticky.classList.remove('visible');
        }

        // Show on any scroll past hero when scrolling down
        if (scrollY > 600 && scrollY > lastScrollY && !footerVisible) {
          sticky.classList.add('visible');
        }

        lastScrollY = scrollY;
      }, { passive: true });
    },

    // ---- Nav Scroll Shadow ----

    initNavScroll() {
      const nav = document.querySelector('.landing-nav');
      const legalNav = document.querySelector('.legal-nav');

      if (!nav && !legalNav) return;

      window.addEventListener('scroll', () => {
        if (nav) nav.classList.toggle('scrolled', window.scrollY > 20);
        if (legalNav) legalNav.classList.toggle('scrolled', window.scrollY > 20);
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

          items.forEach(i => i.classList.remove('open'));

          if (!isOpen) {
            item.classList.add('open');
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
      const duration = Math.min(2000, target * 15);
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

    // ---- Hero Preview Card 3D Tilt ----

    initPreviewTilt() {
      const card = document.querySelector('.landing-preview-card');
      if (!card) return;

      if (window.matchMedia('(hover: hover)').matches) {
        card.addEventListener('mousemove', (e) => {
          const rect = card.getBoundingClientRect();
          const x = (e.clientX - rect.left) / rect.width;
          const y = (e.clientY - rect.top) / rect.height;

          const tiltX = (y - 0.5) * -6;
          const tiltY = (x - 0.5) * 6;

          card.style.transform = `rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
        });

        card.addEventListener('mouseleave', () => {
          card.style.transform = 'rotateX(2deg) rotateY(-1deg)';
        });
      }
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => LandingPage.init());
  } else {
    LandingPage.init();
  }

  window.LandingPage = LandingPage;
})();
