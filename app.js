// Fills in the newest version, size, date and checksum from the project's GitHub releases.
// The page works without this: the Download button always points at the newest installer.
(function () {
  'use strict';
  const DEFAULTS = { repo: 'MackKD/yakima-sales-download', installer: 'YakimaSalesCity-Setup.exe', contact: '' };
  const $ = (id) => document.getElementById(id);

  function formatSize(bytes) {
    return bytes >= 1048576 ? Math.round(bytes / 1048576) + ' MB' : Math.max(1, Math.round(bytes / 1024)) + ' KB';
  }
  function formatDate(iso) {
    const d = new Date(iso);
    return isNaN(d) ? '' : d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  }

  async function loadConfig() {
    try {
      const r = await fetch('site.json', { cache: 'no-cache' });
      return r.ok ? { ...DEFAULTS, ...(await r.json()) } : DEFAULTS;
    } catch (e) { return DEFAULTS; }
  }

  function showContact(address) {
    if (!/^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/.test(address || '')) return;   // never show a malformed address
    $('contact-link').href = 'mailto:' + address;
    $('contact-link').textContent = address;
    $('contact').hidden = false;
  }

  async function showRelease(cfg) {
    const btn = $('dl'), meta = $('meta'), notice = $('notice');
    btn.href = `https://github.com/${cfg.repo}/releases/latest/download/${cfg.installer}`;
    let res;
    try { res = await fetch(`https://api.github.com/repos/${cfg.repo}/releases/latest`, { headers: { Accept: 'application/vnd.github+json' } }); }
    catch (e) { return; }                                                       // offline or blocked: keep the plain link
    if (res.status === 404) {
      btn.setAttribute('aria-disabled', 'true'); btn.removeAttribute('href');
      notice.textContent = 'The first version is being prepared. Please check back soon.'; notice.hidden = false;
      return;
    }
    if (!res.ok) return;
    const rel = await res.json();
    const asset = (rel.assets || []).find((a) => a.name === cfg.installer);
    const parts = [];
    if (rel.tag_name) parts.push('Version ' + String(rel.tag_name).replace(/^v/i, ''));
    if (asset && asset.size) parts.push(formatSize(asset.size));
    if (rel.published_at) parts.push('Released ' + formatDate(rel.published_at));
    parts.push('Windows 10 or 11 (64-bit)');
    meta.textContent = parts.join(' · ');
    const m = /SHA256:\s*([0-9a-f]{64})/i.exec(rel.body || '');
    if (m) $('sha').textContent = m[1].toLowerCase();
  }

  loadConfig().then((cfg) => { showContact(cfg.contact); return showRelease(cfg); }).catch(() => {});
})();
