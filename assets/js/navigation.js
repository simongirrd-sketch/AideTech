/**
 * navigation.js — En-tête et pied de page réutilisables
 * Updated: add Login button in header and inline login modal
 */

const NAV_LINKS = [
  { href: "index.html", label: "Accueil", id: "home" },
  { href: "pages/documentation.html", label: "Documentation", id: "documentation" },
  { href: "pages/diagnostic.html", label: "Diagnostic", id: "diagnostic" },
  { href: "pages/maintenance.html", label: "Maintenance Préventive", id: "maintenance" },
  { href: "pages/about.html", label: "À propos", id: "about" },
  { href: "pages/admin-local.html", label: "Connexion", id: "admin" },
];

const DOC_CATEGORIES = [
  { id: "electricite", label: "Électricité", href: "documentation/electricite/index.html", subcategories: ["Schémas électriques", "Notices techniques", "Références composants"] },
  { id: "automatisme", label: "Automatisme", href: "documentation/automatisme/index.html", subcategories: ["API", "Variateurs", "IHM", "Réseaux industriels"] },
  { id: "mecanique", label: "Mécanique", href: "documentation/mecanique/index.html", subcategories: ["Plans mécaniques", "Éclatés", "Procédures"] },
  { id: "hydraulique", label: "Hydraulique", href: "documentation/hydraulique/index.html", subcategories: ["Schémas", "Composants", "Procédures de dépannage"] },
  { id: "pneumatique", label: "Pneumatique", href: "documentation/pneumatique/index.html", subcategories: ["Schémas", "Composants", "Diagnostic"] },
];

function getPathDepth() {
  const path = window.location.pathname;
  if (path.includes("documentation/")) return 2;
  if (path.includes("/pages/")) return 1;
  return 0;
}

function relativeUrl(target) {
  const depth = getPathDepth();
  return (depth > 0 ? "../".repeat(depth) : "") + target;
}

function getActivePageId() {
  const path = window.location.pathname;
  if (path.includes("documentation")) return "documentation";
  if (path.includes("diagnostic")) return "diagnostic";
  if (path.includes("maintenance")) return "maintenance";
  if (path.includes("gmao")) return "about";
  if (path.includes("about")) return "about";
  if (path.includes("admin-local")) return "admin";
  return "home";
}

function renderHeader() {
  const container = document.getElementById("site-header");
  if (!container) return;

  const activeId = getActivePageId();
  const navItems = NAV_LINKS.map((link) => {
    const isActive = link.id === activeId;
    return `<li><a href="${relativeUrl(link.href)}" class="${isActive ? "active" : ""}"${isActive ? ' aria-current="page"' : ""}>${link.label}</a></li>`;
  }).join("");

  container.innerHTML = `
    <a href="#main-content" class="skip-link">Aller au contenu principal</a>
    <div class="container header-inner">
      <a href="${relativeUrl("index.html")}" class="logo" aria-label="SiteMAINT — Accueil">
        <img src="${relativeUrl("assets/img/logo.svg")}" alt="" class="logo-icon" width="36" height="36">
        <span>SiteMAINT</span>
      </a>
      <button class="nav-toggle" aria-label="Ouvrir le menu" aria-expanded="false" aria-controls="main-nav">
        <span></span><span></span><span></span>
      </button>
      <nav class="main-nav" id="main-nav" aria-label="Navigation principale">
        <ul>${navItems}</ul>
      </nav>
      <div class="header-actions">
        <button id="btn-open-login" class="btn btn-outline">Se connecter</button>
      </div>
    </div>

    <!-- Login modal inserted by navigation.js -->
    <div id="login-modal" class="modal" role="dialog" aria-modal="true" aria-hidden="true" style="display:none;">
      <div class="modal-backdrop"></div>
      <div class="modal-content" role="document" aria-labelledby="login-title">
        <button class="modal-close" id="login-close" aria-label="Fermer">×</button>
        <h2 id="login-title">Se connecter</h2>
        <form id="login-form-header">
          <label>Utilisateur<br><input id="header-admin-user" type="text" autocomplete="username"></label>
          <label>Mot de passe<br><input id="header-admin-pass" type="password" autocomplete="current-password"></label>
          <div style="margin-top:8px;">
            <button type="button" id="header-btn-login" class="btn btn-primary">Se connecter</button>
            <button type="button" id="header-btn-cancel" class="btn">Annuler</button>
          </div>
          <p id="header-login-msg" aria-live="polite" style="margin-top:8px;color:#b00020;"></p>
        </form>
      </div>
    </div>
  `;

  initMobileNav();
  initHeaderLogin();
}

function renderFooter() {
  const container = document.getElementById("site-footer");
  if (!container) return;
  const year = new Date().getFullYear();

  container.innerHTML = `
    <div class="container">
      <div class="footer-inner">
        <div>
          <h3>SiteMAINT</h3>
          <p>Plateforme de documentation, diagnostic et maintenance préventive pour techniciens industriels.</p>
        </div>
        <div>
          <h3>Navigation</h3>
          <ul>${NAV_LINKS.map((l) => `<li><a href="${relativeUrl(l.href)}">${l.label}</a></li>`).join("")}</ul>
        </div>
        <div>
          <h3>Modules</h3>
          <ul>
            <li><a href="${relativeUrl("pages/gmao.html")}">Préparation GMAO</a></li>
            <li>15 fiches machines — 6 diagnostics</li>
            <li>Maintenance localStorage</li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; ${year} SiteMAINT — ${typeof SITE_CONFIG === 'undefined' ? '' : SITE_CONFIG.version}</p>
      </div>
    </div>
  `;
}

function renderDocSidebar(activeCategoryId) {
  const container = document.getElementById("doc-sidebar");
  if (!container) return;

  const items = DOC_CATEGORIES.map((cat) => {
    const isActive = cat.id === activeCategoryId ? " active" : "";
    return `<li><a href="${relativeUrl(cat.href)}" class="${isActive.trim()}">${cat.label}</a></li>`;
  }).join("");

  container.innerHTML = `
    <h2>Catégories</h2>
    <nav class="sidebar-nav" aria-label="Catégories documentation"><ul>${items}</ul></nav>
  `;
}

function initMobileNav() {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".main-nav");
  if (!toggle || !nav) return;

  toggle.addEventListener("click", () => {
    const isOpen = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!isOpen));
    toggle.setAttribute("aria-label", isOpen ? "Ouvrir le menu" : "Fermer le menu");
    nav.classList.toggle("is-open", !isOpen);
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      toggle.setAttribute("aria-expanded", "false");
      nav.classList.remove("is-open");
    });
  });
}

// Header login/modal helpers — uses the same local admin config as admin-local.js
function initHeaderLogin(){
  const openBtn = document.getElementById('btn-open-login');
  const modal = document.getElementById('login-modal');
  const closeBtn = document.getElementById('login-close');
  const cancelBtn = document.getElementById('header-btn-cancel');
  const loginBtn = document.getElementById('header-btn-login');
  const msg = document.getElementById('header-login-msg');

  if(!openBtn || !modal) return;

  openBtn.addEventListener('click', ()=> showLoginModal());
  closeBtn.addEventListener('click', ()=> hideLoginModal());
  cancelBtn.addEventListener('click', ()=> hideLoginModal());
  modal.querySelector('.modal-backdrop').addEventListener('click', ()=> hideLoginModal());

  loginBtn.addEventListener('click', ()=>{
    const user = document.getElementById('header-admin-user').value;
    const pass = document.getElementById('header-admin-pass').value;
    const cfg = window.SITEMAINT_ADMIN_CONFIG || {};
    const ADMIN_USER = cfg.ADMIN_USER || 'admin';
    const ADMIN_PASS = cfg.ADMIN_PASS || 'admin123';
    if(user === ADMIN_USER && pass === ADMIN_PASS){
      // set session and redirect to admin page
      sessionStorage.setItem('sitemaint_admin_session', 'true');
      hideLoginModal();
      // redirect to admin page where full editor is available
      window.location.href = relativeUrl('pages/admin-local.html');
    } else {
      msg.textContent = 'Identifiants incorrects';
    }
  });

  // keyboard trap: Esc closes
  document.addEventListener('keydown', (e)=>{
    if(e.key === 'Escape' && modal.getAttribute('aria-hidden') === 'false') hideLoginModal();
  });
}

function showLoginModal(){
  const modal = document.getElementById('login-modal');
  if(!modal) return;
  modal.style.display = 'block';
  modal.setAttribute('aria-hidden','false');
  const input = document.getElementById('header-admin-user');
  if(input) input.focus();
}

function hideLoginModal(){
  const modal = document.getElementById('login-modal');
  if(!modal) return;
  modal.style.display = 'none';
  modal.setAttribute('aria-hidden','true');
  // clear message
  const msg = document.getElementById('header-login-msg');
  if(msg) msg.textContent = '';
}

document.addEventListener("DOMContentLoaded", () => {
  renderHeader();
  renderFooter();
});
