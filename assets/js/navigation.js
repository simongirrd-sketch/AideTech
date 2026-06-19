/**
 * navigation.js — En-tête et pied de page réutilisables
 * Updated: added Admin local link
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
    </div>
  `;
  initMobileNav();
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
        <p>&copy; ${new Date().getFullYear()} SiteMAINT — ${typeof SITE_CONFIG === 'undefined' ? '' : SITE_CONFIG.version}</p>
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

document.addEventListener("DOMContentLoaded", () => {
  renderHeader();
  renderFooter();
});
