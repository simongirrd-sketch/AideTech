/**
 * config.js — Configuration globale du site
 *
 * BASE_PATH permet au site de fonctionner sur GitHub Pages
 * que le dépôt soit hébergé à la racine ou dans un sous-dossier.
 *
 * Exemple : si votre URL est https://user.github.io/SiteMAINT/
 * → BASE_PATH = "/SiteMAINT"
 *
 * Si votre URL est https://user.github.io/ (repo nommé user.github.io)
 * → BASE_PATH = ""
 */
const SITE_CONFIG = {
  name: "SiteMAINT",
  tagline: "Bibliothèque Technique & Maintenance Industrielle",
  basePath: getBasePath(),
  version: "2.0.0 — V1 Complète",
};

/**
 * Détecte automatiquement le chemin de base depuis l'URL.
 * Fonctionne en local (file://) et sur GitHub Pages.
 */
function getBasePath() {
  const path = window.location.pathname;

  /* En local, pathname peut être un chemin de fichier Windows */
  if (path.includes(".html") || path.endsWith("/")) {
    const segments = path.split("/").filter(Boolean);
    /* Retire le nom du fichier final */
    if (segments.length > 0 && segments[segments.length - 1].includes(".")) {
      segments.pop();
    }
    /* Si on est dans un sous-dossier du projet (pages/, documentation/) */
    const projectFolders = ["pages", "documentation", "assets", "data"];
    while (segments.length > 0 && projectFolders.includes(segments[segments.length - 1])) {
      segments.pop();
    }
    /* Remonte d'un niveau si dans documentation/electricite/ */
    if (segments.length > 0 && segments[segments.length - 1] === "electricite") {
      segments.pop();
    }
    if (segments.length > 0 && segments[segments.length - 1] === "documentation") {
      segments.pop();
    }
    return segments.length > 0 ? "/" + segments.join("/") : "";
  }

  return "";
}

/**
 * Construit une URL absolue depuis la racine du site.
 * @param {string} relativePath - Chemin relatif (ex: "pages/documentation.html")
 */
function siteUrl(relativePath) {
  const base = SITE_CONFIG.basePath.replace(/\/$/, "");
  const path = relativePath.replace(/^\//, "");
  return `${base}/${path}`.replace(/\/+/g, "/") || "/";
}
