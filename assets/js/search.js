/**
 * search.js — Recherche dans la bibliothèque technique
 *
 * Phase 1 : recherche côté client dans le fichier machines.json.
 * Phase 4 : pourra être remplacée par une API Supabase.
 */

/**
 * Charge les données machines depuis le JSON.
 * @param {string} jsonPath - Chemin vers machines.json
 * @returns {Promise<Array>}
 */
async function loadMachines(jsonPath) {
  try {
    const response = await fetch(jsonPath);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data.machines || [];
  } catch (error) {
    console.error("Erreur chargement machines:", error);
    return [];
  }
}

/**
 * Normalise une chaîne pour la recherche (minuscules, sans accents).
 * @param {string} str
 */
function normalize(str) {
  return (str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Filtre les machines selon un terme de recherche.
 * @param {Array} machines
 * @param {string} query
 */
function filterMachines(machines, query) {
  if (!query.trim()) return machines;

  const term = normalize(query);

  return machines.filter((machine) => {
    const searchable = [
      machine.nom,
      machine.marque,
      machine.modele,
      machine.description,
      ...(machine.notes || []),
      ...(machine.pannesFrequentes || []),
      ...(machine.proceduresControle || []),
      ...(machine.causesPossibles || []),
      ...(machine.bonnesPratiques || []),
      ...(machine.documents || []).map((d) => d.titre),
    ]
      .join(" ")
      .toLowerCase();

    return normalize(searchable).includes(term);
  });
}

/**
 * Initialise la barre de recherche sur une page catégorie.
 * @param {Object} options
 * @param {string} options.inputId - ID de l'input recherche
 * @param {string} options.listId - ID du conteneur des résultats
 * @param {string} options.jsonPath - Chemin vers machines.json
 * @param {string} [options.category] - Filtrer par catégorie
 * @param {Function} options.renderFn - Fonction pour afficher une machine
 */
async function initMachineSearch(options) {
  const input = document.getElementById(options.inputId);
  const listContainer = document.getElementById(options.listId);
  const infoEl = document.getElementById("search-results-info");

  if (!input || !listContainer) return;

  let allMachines = await loadMachines(options.jsonPath);

  if (options.category) {
    allMachines = allMachines.filter((m) => m.categorie === options.category);
  }

  /** Affiche la liste filtrée */
  function renderList(machines) {
    if (infoEl) {
      infoEl.textContent =
        machines.length === allMachines.length
          ? `${machines.length} machine(s) répertoriée(s)`
          : `${machines.length} résultat(s) sur ${allMachines.length}`;
    }

    if (machines.length === 0) {
      listContainer.innerHTML = `
        <div class="card" style="text-align:center;padding:2rem;">
          <p>Aucune machine ne correspond à votre recherche.</p>
        </div>
      `;
      return;
    }

    listContainer.innerHTML = machines.map(options.renderFn).join("");
  }

  renderList(allMachines);

  /* Recherche en temps réel avec debounce léger */
  let debounceTimer;
  input.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const filtered = filterMachines(allMachines, input.value);
      renderList(filtered);
    }, 200);
  });
}

/**
 * Génère le HTML d'une carte machine.
 * @param {Object} machine
 */
function renderMachineCard(machine) {
  const documents = (machine.documents || [])
    .map(
      (doc) =>
        `<span class="tag">${doc.type}: ${doc.titre}</span>`
    )
    .join("");

  const notes = (machine.notes || [])
    .map((n) => `<li>${n}</li>`)
    .join("");

  const pannes = (machine.pannesFrequentes || [])
    .map((p) => `<li>${p}</li>`)
    .join("");

  const pannesBlock =
    pannes.length > 0
      ? `<div class="faults-list">
          <h4>Pannes fréquentes</h4>
          <ul>${pannes}</ul>
        </div>`
      : "";

  const notesBlock =
    notes.length > 0
      ? `<div style="margin-top:1rem;">
          <h4 style="font-size:0.875rem;margin-bottom:0.5rem;">Notes techniques</h4>
          <ul style="list-style:disc;padding-left:1.5rem;font-size:0.875rem;">${notes}</ul>
        </div>`
      : "";

  return `
    <article class="machine-card" data-id="${machine.id}">
      <div class="machine-card-header">
        <div>
          <h3>${machine.nom}</h3>
          <div class="machine-meta">
            <span><strong>Marque :</strong> ${machine.marque}</span>
            <span><strong>Modèle :</strong> ${machine.modele}</span>
          </div>
        </div>
        <span class="badge badge-phase">${machine.sousCategorie || machine.categorie}</span>
      </div>
      <div class="machine-card-body">
        <p>${machine.description}</p>
        <div class="machine-tags">${documents}</div>
        ${notesBlock}
        ${pannesBlock}
      </div>
    </article>
  `;
}
