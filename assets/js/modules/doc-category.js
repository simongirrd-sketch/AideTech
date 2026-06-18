/**
 * doc-category.js — Page documentation par catégorie (réutilisable)
 */

function renderMachineCardFull(machine) {
  const section = (title, items, className = "") => {
    if (!items?.length) return "";
    return `
      <div class="${className}" style="margin-top:1rem;">
        <h4 style="font-size:0.875rem;margin-bottom:0.5rem;color:var(--color-primary-dark);">${title}</h4>
        <ul style="list-style:disc;padding-left:1.5rem;font-size:0.875rem;">${items.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul>
      </div>`;
  };

  const documents = (machine.documents || [])
    .map((d) => `<span class="tag">${escapeHtml(d.type)}: ${escapeHtml(d.titre)}</span>`).join("");

  return `
    <article class="machine-card" data-id="${machine.id}">
      <div class="machine-card-header">
        <div>
          <h3>${escapeHtml(machine.nom)}</h3>
          <div class="machine-meta">
            <span><strong>Marque :</strong> ${escapeHtml(machine.marque)}</span>
            <span><strong>Modèle :</strong> ${escapeHtml(machine.modele)}</span>
          </div>
        </div>
        <span class="badge badge-phase">${escapeHtml(machine.sousCategorie || machine.categorie)}</span>
      </div>
      <div class="machine-card-body">
        <p>${escapeHtml(machine.description)}</p>
        <div class="machine-tags">${documents}</div>
        ${section("Notes techniques", machine.notes)}
        ${section("Procédures de contrôle", machine.proceduresControle)}
        ${section("Causes possibles de panne", machine.causesPossibles)}
        ${section("Bonnes pratiques", machine.bonnesPratiques)}
        ${machine.pannesFrequentes?.length ? `
          <div class="faults-list">
            <h4>Pannes fréquentes</h4>
            <ul>${machine.pannesFrequentes.map((p) => `<li>${escapeHtml(p)}</li>`).join("")}</ul>
          </div>` : ""}
      </div>
    </article>`;
}

async function initDocCategoryPage(config) {
  renderDocSidebar(config.categoryId);

  await MachineService.setJsonPath(config.jsonPath);
  await initMachineSearch({
    inputId: "machine-search",
    listId: "machine-list",
    jsonPath: config.jsonPath,
    category: config.categoryId,
    renderFn: renderMachineCardFull,
  });
}
