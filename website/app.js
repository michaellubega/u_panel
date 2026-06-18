const WEB_APP_URL = 'https://u-panel-2026.web.app/';
const WEB_APP_ALT_HOST = 'u-panel-2026.firebaseapp.com';
const SITE_DOMAIN = 'https://kiu.orion13.us';
const DEFAULT_PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.u_panel';

function applyWebButton(button, noteEl, url, alternateUrl) {
  if (!button) return;

  button.href = url || WEB_APP_URL;
  button.classList.remove('is-disabled');
  button.removeAttribute('aria-disabled');

  if (noteEl) {
    if (alternateUrl) {
      noteEl.textContent =
        'Also at ' + WEB_APP_ALT_HOST + ' — same app, no install.';
    } else {
      noteEl.textContent =
        'Runs in your browser — same sign-in as the mobile app.';
    }
  }
}

function resolveDownloadUrl(file) {
  if (!file) return null;
  if (/^https?:\/\//i.test(file)) return file;
  const base = (window.__releaseHostBase || SITE_DOMAIN).replace(/\/$/, '');
  return base + '/' + file.replace(/^\//, '');
}

function configureDownload(platform, button, noteEl, options = {}) {
  if (!button) return;

  const href = resolveDownloadUrl(platform?.file);
  const available = platform?.available === true && href;
  if (available) {
    button.href = href;
    button.removeAttribute('download');
    button.setAttribute('target', '_blank');
    button.setAttribute('rel', 'noopener noreferrer');
    button.classList.remove('is-disabled');
    button.removeAttribute('aria-disabled');
    if (noteEl && options.noteText) {
      noteEl.textContent = options.noteText;
    }
    return;
  }

  button.classList.add('is-disabled');
  button.setAttribute('aria-disabled', 'true');
  button.removeAttribute('href');
  button.removeAttribute('download');
}

function configureHelperDownload(platform, button) {
  if (!button) return;

  const href = resolveDownloadUrl(platform?.helperBat);
  const available = platform?.available === true && href;
  if (available) {
    button.href = href;
    button.setAttribute('download', '');
    button.removeAttribute('target');
    button.classList.remove('is-disabled');
    button.removeAttribute('aria-disabled');
    return;
  }

  button.classList.add('is-disabled');
  button.setAttribute('aria-disabled', 'true');
  button.removeAttribute('href');
  button.removeAttribute('download');
}

function configurePlayStore(playStore, button, noteEl) {
  if (!button) return false;

  const url = (playStore?.url || DEFAULT_PLAY_STORE_URL).trim();
  const available = playStore?.available === true && url;

  if (available) {
    button.href = url;
    button.setAttribute('target', '_blank');
    button.setAttribute('rel', 'noopener noreferrer');
    button.classList.remove('is-disabled');
    button.removeAttribute('aria-disabled');
    button.classList.add('btn-primary');
    if (noteEl) {
      const packageName = playStore?.packageName || 'com.u_panel';
      noteEl.textContent =
        playStore?.message ||
        'Official Android app on Google Play (' + packageName + ').';
    }
    return true;
  }

  button.classList.add('is-disabled');
  button.setAttribute('aria-disabled', 'true');
  button.removeAttribute('href');
  if (noteEl) {
    noteEl.textContent =
      playStore?.message ||
      'Google Play listing is not available yet. Check back soon.';
  }
  return false;
}

async function loadReleaseInfo() {
  const versionEl = document.getElementById('version-label');
  const playStoreBtn = document.getElementById('android-play-store');
  const windowsBtn = document.getElementById('windows-download');
  const windowsHelperBtn = document.getElementById('windows-helper-download');
  const webBtn = document.getElementById('web-open');
  const iosWebBtn = document.getElementById('ios-web');
  const androidNote = document.getElementById('android-note');
  const windowsNote = document.getElementById('windows-note');
  applyWebButton(webBtn, null, WEB_APP_URL, WEB_APP_ALT_HOST);
  applyWebButton(iosWebBtn, null, WEB_APP_URL, null);

  try {
    const res = await fetch('releases.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('Could not load release info');
    const text = await res.text();
    const data = JSON.parse(text.replace(/^\uFEFF/, ''));
    if (data.hostBase) window.__releaseHostBase = data.hostBase;

    const versionText = `Version ${data.version} (build ${data.build})`;
    if (versionEl) versionEl.textContent = versionText;

    configurePlayStore(data.playStore, playStoreBtn, androidNote);

    configureDownload(data.windows, windowsBtn, windowsNote, {
      noteText: data.windows?.size
        ? `Installer: ${data.windows.size} · save to your PC, then run from your hard disk`
        : 'Save the installer to your PC, then run it from your hard disk',
    });
    configureHelperDownload(data.windows, windowsHelperBtn);

    const webUrl = data.web?.url || WEB_APP_URL;
    applyWebButton(webBtn, null, webUrl, null);
    applyWebButton(iosWebBtn, null, webUrl, null);
  } catch (_) {
    if (versionEl) versionEl.textContent = 'Release info unavailable';
    [playStoreBtn, windowsBtn, windowsHelperBtn].forEach((btn) => {
      if (btn) {
        btn.classList.add('is-disabled');
        btn.setAttribute('aria-disabled', 'true');
        btn.removeAttribute('href');
        btn.removeAttribute('download');
      }
    });
  }
}

function initScrollReveal() {
  const items = document.querySelectorAll('.reveal');
  if (!items.length) return;

  if (!('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  items.forEach((el) => observer.observe(el));
}

function markVersionReady() {
  const pill = document.getElementById('version-label');
  if (pill) pill.classList.add('is-ready');
}

document.addEventListener('DOMContentLoaded', () => {
  initScrollReveal();
  loadReleaseInfo().finally(markVersionReady);
});
