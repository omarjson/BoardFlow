(function () {
  'use strict';

  const DesignSystem = {
    init() {
      if (!document.querySelector('.design-system-page')) return;

      this.renderColors();
      this.renderTypography();
      this.renderSpacing();
      this.initColorCopy();
      this.initBlurSlider();
      this.initScrollReveal();
      this.initNavScroll();
      this.initThemeToggle();
    },

    // ---- Read CSS variable ----

    _get(name) {
      return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    },

    // ---- Color Palette ----

    colorMeta: [
      { var: '--primary', name: 'Primary', cat: 'Brand' },
      { var: '--primary-hover', name: 'Primary Hover', cat: 'Brand' },
      { var: '--primary-active', name: 'Primary Active', cat: 'Brand' },
      { var: '--primary-subtle', name: 'Primary Subtle', cat: 'Brand' },
      { var: '--secondary', name: 'Secondary', cat: 'Brand' },
      { var: '--accent-rose', name: 'Accent Rose', cat: 'Accent' },
      { var: '--accent-amber', name: 'Accent Amber', cat: 'Accent' },
      { var: '--accent-emerald', name: 'Accent Emerald', cat: 'Accent' },
      { var: '--accent-cyan', name: 'Accent Cyan', cat: 'Accent' },
      { var: '--accent-violet', name: 'Accent Violet', cat: 'Accent' },
      { var: '--accent-fuchsia', name: 'Accent Fuchsia', cat: 'Accent' },
      { var: '--ink', name: 'Ink', cat: 'Text' },
      { var: '--ink-secondary', name: 'Ink Secondary', cat: 'Text' },
      { var: '--ink-muted', name: 'Ink Muted', cat: 'Text' },
      { var: '--ink-faint', name: 'Ink Faint', cat: 'Text' },
      { var: '--ink-inverse', name: 'Ink Inverse', cat: 'Text' },
      { var: '--success', name: 'Success', cat: 'Semantic' },
      { var: '--warning', name: 'Warning', cat: 'Semantic' },
      { var: '--danger', name: 'Danger', cat: 'Semantic' },
      { var: '--info', name: 'Info', cat: 'Semantic' },
      { var: '--canvas', name: 'Canvas', cat: 'Surface' },
      { var: '--surface', name: 'Surface', cat: 'Surface' },
      { var: '--surface-hover', name: 'Surface Hover', cat: 'Surface' },
      { var: '--hairline', name: 'Hairline', cat: 'Surface' },
    ],

    renderColors() {
      const grid = document.getElementById('ds-color-grid');
      if (!grid) return;

      grid.innerHTML = this.colorMeta.map(m => {
        const val = this._get(m.var);
        const isLight = val.startsWith('#F') || val.startsWith('#E') || val.startsWith('#D') || val === '#FFFFFF';
        const textColor = isLight ? '#1A1A2E' : '#FFFFFF';
        return `
          <div class="ds-color-card" data-hex="${val}" data-var="${m.var}" role="button" tabindex="0" title="Click to copy ${val}">
            <div class="ds-color-swatch" style="background: ${val};">
              <label style="color: ${textColor};">${m.cat}</label>
            </div>
            <div class="ds-color-info">
              <div class="ds-color-name">${m.name}</div>
              <div class="ds-color-hex">${val}</div>
            </div>
          </div>
        `;
      }).join('');
    },

    // ---- Typography ----

    typeMeta: [
      { var: '--text-display', name: 'Display', tag: 'div' },
      { var: '--text-h1', name: 'Heading 1', tag: 'h1' },
      { var: '--text-h2', name: 'Heading 2', tag: 'h2' },
      { var: '--text-h3', name: 'Heading 3', tag: 'h3' },
      { var: '--text-h4', name: 'Heading 4', tag: 'h4' },
      { var: '--text-body', name: 'Body', tag: 'p' },
      { var: '--text-body-sm', name: 'Body Small', tag: 'p' },
      { var: '--text-button', name: 'Button', tag: 'span' },
      { var: '--text-caption', name: 'Caption', tag: 'span' },
      { var: '--text-xs', name: 'Extra Small', tag: 'span' },
      { var: '--text-eyebrow', name: 'Eyebrow', tag: 'span' },
    ],

    renderTypography() {
      const list = document.getElementById('ds-type-list');
      if (!list) return;

      list.innerHTML = this.typeMeta.map(m => {
        const val = this._get(m.var);
        const size = this._get(m.var.replace('text-', 'text-').replace(/display|h1|h2|h3|h4|body|body-sm|button|caption|xs|eyebrow/, m2 => m2 + '-size'));
        const sizeVal = this._get(m.var.replace('text-', 'text-').replace(/display|h1|h2|h3|h4|body|body-sm|button|caption|xs|eyebrow/, '$&-size'));
        return `
          <div class="ds-type-item">
            <div class="ds-type-label">${m.name}</div>
            <${m.tag} class="ds-type-sample" style="font: ${val}; margin: 0;">The quick brown fox jumps over the lazy dog</${m.tag}>
            <div class="ds-type-meta">${m.var.replace('--text-', '')}</div>
          </div>
        `;
      }).join('');
    },

    // ---- Spacing ----

    spacingMeta: [
      { var: '--space-1', name: '4px' },
      { var: '--space-2', name: '8px' },
      { var: '--space-3', name: '12px' },
      { var: '--space-4', name: '16px' },
      { var: '--space-5', name: '20px' },
      { var: '--space-6', name: '24px' },
      { var: '--space-8', name: '32px' },
      { var: '--space-10', name: '40px' },
      { var: '--space-12', name: '48px' },
      { var: '--space-16', name: '64px' },
      { var: '--space-20', name: '80px' },
    ],

    renderSpacing() {
      const grid = document.getElementById('ds-spacing-grid');
      if (!grid) return;

      grid.innerHTML = this.spacingMeta.map(m => {
        const val = this._get(m.var);
        const px = parseInt(val) || 0;
        return `
          <div class="ds-spacing-item">
            <div class="ds-spacing-label">${m.name}</div>
            <div class="ds-spacing-block" style="width: ${px}px; height: 16px;"></div>
            <div class="ds-spacing-value">${val}</div>
          </div>
        `;
      }).join('');
    },

    // ---- Copy color hex on click ----

    initColorCopy() {
      document.querySelectorAll('.ds-color-card').forEach(card => {
        const handler = async () => {
          const hex = card.dataset.hex;
          if (!hex) return;

          try {
            await navigator.clipboard.writeText(hex);
          } catch {
            const ta = document.createElement('textarea');
            ta.value = hex;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
          }

          card.classList.add('copied');
          setTimeout(() => card.classList.remove('copied'), 1200);
        };

        card.addEventListener('click', handler);
        card.addEventListener('keydown', e => {
          if (e.key === 'Enter' || e.key === ' ') handler();
        });
      });
    },

    // ---- Interactive blur slider ----

    initBlurSlider() {
      const slider = document.getElementById('ds-blur-range');
      const card = document.getElementById('ds-blur-card');
      const val = document.getElementById('ds-blur-value');
      if (!slider || !card || !val) return;

      slider.addEventListener('input', () => {
        const v = slider.value;
        card.style.setProperty('-webkit-backdrop-filter', `blur(${v}px)`);
        card.style.backdropFilter = `blur(${v}px)`;
        val.textContent = `${v}px`;
      });
    },

    // ---- Scroll-triggered reveals ----

    initScrollReveal() {
      const els = document.querySelectorAll('.ds-section');
      if (!els.length) return;

      els.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
      });

      if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
              entry.target.style.opacity = '1';
              entry.target.style.transform = 'translateY(0)';
              observer.unobserve(entry.target);
            }
          });
        }, { threshold: 0.1 });

        els.forEach(el => observer.observe(el));
      } else {
        els.forEach(el => {
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
        });
      }
    },

    // ---- Nav scroll shadow ----

    initNavScroll() {
      const nav = document.querySelector('.ds-nav');
      if (!nav) return;

      const scrollContainer = document.querySelector('.design-system-page');
      if (!scrollContainer) return;

      scrollContainer.addEventListener('scroll', () => {
        nav.classList.toggle('ds-nav-scrolled', scrollContainer.scrollTop > 10);
      }, { passive: true });
    },

    // ---- Theme Toggle ----

    initThemeToggle() {
      const toggle = document.getElementById('ds-theme-toggle');
      if (!toggle) return;

      const savedTheme = localStorage.getItem('boardflow_theme') || 'light';
      document.documentElement.setAttribute('data-theme', savedTheme);
      this._updateToggleIcon(toggle, savedTheme);

      toggle.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme') || 'light';
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('boardflow_theme', next);
        this._updateToggleIcon(toggle, next);

        // Re-render colors so hex values update for the theme
        this.renderColors();
        this.initColorCopy();
      });
    },

    _updateToggleIcon(el, theme) {
      el.innerHTML = theme === 'dark'
        ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>'
        : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
    },
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => DesignSystem.init());
  } else {
    DesignSystem.init();
  }

  window.DesignSystem = DesignSystem;
})();
