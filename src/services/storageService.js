// Local storage compatibility helpers and JSON persistence utilities.

// ── Polyfill window.storage via localStorage ──
window.storage = {
  get: async (key) => {
    const value = localStorage.getItem(key);
    return value !== null ? { value } : null;
  },
  set: async (key, value) => {
    localStorage.setItem(key, value);
    return true;
  },
  remove: async (key) => {
    localStorage.removeItem(key);
    return true;
  }
};

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    const parsed = JSON.parse(raw);
    return parsed === null || parsed === undefined ? fallback : parsed;
  } catch { return fallback; }
}
function writeJson(key, value) {
