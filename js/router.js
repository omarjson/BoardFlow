// ============================================
// BoardFlow SPA Router (Hash-based)
// ============================================

class _Router {
  constructor() {
    this.routes = {};
    this.currentRoute = null;
    this.beforeEach = null;
    window.addEventListener('hashchange', () => this.resolve());
  }

  on(path, handler) {
    this.routes[path] = handler;
    return this;
  }

  resolve() {
    const hash = window.location.hash.slice(1) || '/';
    const [path, queryString] = hash.split('?');
    const params = Object.fromEntries(new URLSearchParams(queryString || ''));

    // Extract route parameters: /board/:id -> /board/abc123
    let matchedHandler = null;
    let routeParams = {};

    for (const [pattern, handler] of Object.entries(this.routes)) {
      const regex = this._patternToRegex(pattern);
      const match = path.match(regex);
      if (match) {
        matchedHandler = handler;
        routeParams = this._extractParams(pattern, match);
        break;
      }
    }

    if (!matchedHandler) {
      matchedHandler = this.routes['*'] || (() => {});
    }

    const context = {
      path,
      params: { ...routeParams, ...params },
      query: params,
      from: this.currentRoute
    };

    if (this.beforeEach) {
      const proceed = this.beforeEach(context);
      if (proceed === false) return;
    }

    this.currentRoute = path;
    matchedHandler(context);
  }

  navigate(path) {
    window.location.hash = path;
  }

  _patternToRegex(pattern) {
    const regex = pattern
      .replace(/:([a-zA-Z]+)/g, '___PARAM_$1___')
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      .replace(/___PARAM_([a-zA-Z]+)___/g, '([^/]+)');
    return new RegExp(`^${regex}$`);
  }

  _extractParams(pattern, match) {
    const keys = (pattern.match(/:([a-zA-Z]+)/g) || []).map(k => k.slice(1));
    const values = match.slice(1);
    const params = {};
    keys.forEach((key, i) => { params[key] = values[i]; });
    return params;
  }

  start() {
    this.resolve();
  }
}

window.AppRouter = new _Router();
