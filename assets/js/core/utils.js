/**
 * utils.js — Fonctions utilitaires partagées
 */

/** Génère un identifiant unique */
function generateId(prefix = "id") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/** Normalise une chaîne pour la recherche */
function normalizeText(str) {
  return (str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/** Échappe le HTML pour éviter les injections XSS */
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

/** Formate une date ISO en format français */
function formatDate(isoDate) {
  if (!isoDate) return "—";
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

/** Formate date + heure */
function formatDateTime(isoDate) {
  if (!isoDate) return "—";
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

/** Debounce générique */
function debounce(fn, delay = 200) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/** Différence en jours entre aujourd'hui et une date */
function daysUntil(isoDate) {
  const target = new Date(isoDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.round((target - today) / 86400000);
}

/** Classe CSS selon statut échéance */
function dueStatusClass(isoDate) {
  const days = daysUntil(isoDate);
  if (days < 0) return "status-overdue";
  if (days <= 7) return "status-soon";
  return "status-ok";
}
