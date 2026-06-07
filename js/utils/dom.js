// ============================================
// DOM Helper Utilities
// ============================================

const Dom = {
  create(tag, attrs = {}, children = []) {
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([key, value]) => {
      if (key === 'className') el.className = value;
      else if (key === 'style' && typeof value === 'object') {
        Object.assign(el.style, value);
      } else if (key === 'dataset') {
        Object.entries(value).forEach(([k, v]) => el.dataset[k] = v);
      } else if (key.startsWith('on')) {
        el.addEventListener(key.slice(2).toLowerCase(), value);
      } else {
        el.setAttribute(key, value);
      }
    });
    children.forEach(child => {
      if (typeof child === 'string') el.appendChild(document.createTextNode(child));
      else if (child instanceof HTMLElement) el.appendChild(child);
    });
    return el;
  },

  html(strings, ...values) {
    const template = document.createElement('template');
    template.innerHTML = strings.reduce((result, str, i) => result + str + (values[i] ?? ''), '');
    return template.content;
  },

  $(selector, parent = document) {
    return parent.querySelector(selector);
  },

  $$(selector, parent = document) {
    return [...parent.querySelectorAll(selector)];
  },

  on(el, event, handler, options) {
    if (typeof el === 'string') el = document.querySelector(el);
    if (!el) return () => {};
    el.addEventListener(event, handler, options);
    return () => el.removeEventListener(event, handler, options);
  },

  delegate(parent, selector, event, handler) {
    if (typeof parent === 'string') parent = document.querySelector(parent);
    if (!parent) return () => {};
    const listener = (e) => {
      const target = e.target.closest(selector);
      if (target && parent.contains(target)) {
        handler(e, target);
      }
    };
    parent.addEventListener(event, listener);
    return () => parent.removeEventListener(event, listener);
  },

  removeChildren(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
  },

  show(el) {
    if (typeof el === 'string') el = document.querySelector(el);
    if (el) el.classList.remove('hidden');
  },

  hide(el) {
    if (typeof el === 'string') el = document.querySelector(el);
    if (el) el.classList.add('hidden');
  },

  toggle(el, force) {
    if (typeof el === 'string') el = document.querySelector(el);
    if (!el) return;
    if (force === undefined) el.classList.toggle('hidden');
    else if (force) el.classList.remove('hidden');
    else el.classList.add('hidden');
  }
};

window.Dom = Dom;
