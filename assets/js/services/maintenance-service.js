/**
 * maintenance-service.js — Logique métier maintenance préventive (Phase 3)
 *
 * CRUD équipements, check-lists, interventions.
 * Stockage via DataService (localStorage → Supabase).
 */

const MaintenanceService = {
  /** Initialise les données exemple si première visite */
  async initDefaults(defaultsPath) {
    const initialized = await DataService.get(STORAGE_KEYS.INITIALIZED);
    if (initialized) return;

    let defaults = { equipments: [], checklists: [], interventions: [] };
    try {
      defaults = await DataService.fetchJson(defaultsPath);
    } catch (e) {
      console.warn("Données par défaut non chargées, utilisation vide", e);
    }

    await DataService.set(STORAGE_KEYS.EQUIPMENTS, defaults.equipments || []);
    await DataService.set(STORAGE_KEYS.CHECKLISTS, defaults.checklists || []);
    await DataService.set(STORAGE_KEYS.INTERVENTIONS, defaults.interventions || []);
    await DataService.set(STORAGE_KEYS.INITIALIZED, true);
  },

  /* ── Équipements ───────────────────────────────────────── */

  async getEquipments() {
    return (await DataService.get(STORAGE_KEYS.EQUIPMENTS)) || [];
  },

  async getEquipment(id) {
    const list = await this.getEquipments();
    return list.find((e) => e.id === id) || null;
  },

  async createEquipment(data) {
    const list = await this.getEquipments();
    const equipment = {
      id: generateId("eq"),
      nom: data.nom,
      marque: data.marque || "",
      modele: data.modele || "",
      emplacement: data.emplacement || "",
      categorie: data.categorie || "general",
      frequenceJours: Number(data.frequenceJours) || 90,
      prochainEntretien: data.prochainEntretien || new Date().toISOString().slice(0, 10),
      notes: data.notes || "",
      createdAt: new Date().toISOString(),
    };
    list.push(equipment);
    await DataService.set(STORAGE_KEYS.EQUIPMENTS, list);
    return equipment;
  },

  async updateEquipment(id, data) {
    const list = await this.getEquipments();
    const idx = list.findIndex((e) => e.id === id);
    if (idx === -1) throw new Error("Équipement introuvable");
    list[idx] = { ...list[idx], ...data, updatedAt: new Date().toISOString() };
    await DataService.set(STORAGE_KEYS.EQUIPMENTS, list);
    return list[idx];
  },

  async deleteEquipment(id) {
    let list = await this.getEquipments();
    list = list.filter((e) => e.id !== id);
    await DataService.set(STORAGE_KEYS.EQUIPMENTS, list);
    /* Supprimer check-lists et interventions liées */
    const checklists = (await this.getChecklists()).filter((c) => c.equipmentId !== id);
    await DataService.set(STORAGE_KEYS.CHECKLISTS, checklists);
    return true;
  },

  /* ── Check-lists ─────────────────────────────────────────── */

  async getChecklists(equipmentId = null) {
    let list = (await DataService.get(STORAGE_KEYS.CHECKLISTS)) || [];
    if (equipmentId) list = list.filter((c) => c.equipmentId === equipmentId);
    return list;
  },

  async createChecklist(data) {
    const list = await this.getChecklists();
    const checklist = {
      id: generateId("cl"),
      equipmentId: data.equipmentId,
      titre: data.titre,
      items: (data.items || []).map((label, i) => ({
        id: `item_${i}`,
        label,
        done: false,
      })),
      createdAt: new Date().toISOString(),
    };
    list.push(checklist);
    await DataService.set(STORAGE_KEYS.CHECKLISTS, list);
    return checklist;
  },

  async toggleChecklistItem(checklistId, itemId) {
    const list = await this.getChecklists();
    const cl = list.find((c) => c.id === checklistId);
    if (!cl) return null;
    const item = cl.items.find((i) => i.id === itemId);
    if (item) item.done = !item.done;
    await DataService.set(STORAGE_KEYS.CHECKLISTS, list);
    return cl;
  },

  async deleteChecklist(id) {
    const list = (await this.getChecklists()).filter((c) => c.id !== id);
    await DataService.set(STORAGE_KEYS.CHECKLISTS, list);
  },

  /* ── Interventions ───────────────────────────────────────── */

  async getInterventions(equipmentId = null) {
    let list = (await DataService.get(STORAGE_KEYS.INTERVENTIONS)) || [];
    if (equipmentId) list = list.filter((i) => i.equipmentId === equipmentId);
    return list.sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  async createIntervention(data) {
    const list = await this.getInterventions();
    const intervention = {
      id: generateId("int"),
      equipmentId: data.equipmentId,
      date: data.date || new Date().toISOString().slice(0, 10),
      type: data.type || "preventive",
      description: data.description || "",
      technicien: data.technicien || "Non renseigné",
      dureeMinutes: Number(data.dureeMinutes) || 0,
      checklistId: data.checklistId || null,
      createdAt: new Date().toISOString(),
    };
    list.unshift(intervention);
    await DataService.set(STORAGE_KEYS.INTERVENTIONS, list);

    /* Mettre à jour la prochaine échéance de l'équipement */
    const eq = await this.getEquipment(data.equipmentId);
    if (eq) {
      const next = new Date(intervention.date);
      next.setDate(next.getDate() + eq.frequenceJours);
      await this.updateEquipment(eq.id, {
        prochainEntretien: next.toISOString().slice(0, 10),
        dernierEntretien: intervention.date,
      });
    }

    return intervention;
  },

  async deleteIntervention(id) {
    const list = (await this.getInterventions()).filter((i) => i.id !== id);
    await DataService.set(STORAGE_KEYS.INTERVENTIONS, list);
  },

  /* ── Tableau de bord / KPI ───────────────────────────────── */

  async getDashboardStats() {
    const equipments = await this.getEquipments();
    const interventions = await this.getInterventions();
    const now = new Date();

    const overdue = equipments.filter((e) => daysUntil(e.prochainEntretien) < 0);
    const dueSoon = equipments.filter((e) => {
      const d = daysUntil(e.prochainEntretien);
      return d >= 0 && d <= 7;
    });

    /* Taux de réalisation : interventions ce mois / équipements avec échéance ce mois */
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const interventionsThisMonth = interventions.filter(
      (i) => new Date(i.date) >= monthStart
    ).length;

    const dueThisMonth = equipments.filter((e) => {
      const d = new Date(e.prochainEntretien);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;

    const tauxRealisation = dueThisMonth > 0
      ? Math.min(100, Math.round((interventionsThisMonth / dueThisMonth) * 100))
      : interventionsThisMonth > 0 ? 100 : 0;

    return {
      totalEquipments: equipments.length,
      totalInterventions: interventions.length,
      overdueCount: overdue.length,
      dueSoonCount: dueSoon.length,
      interventionsThisMonth,
      tauxRealisation,
      overdueList: overdue,
      dueSoonList: dueSoon,
    };
  },

  /** Échéances pour le calendrier (mois donné) */
  async getCalendarEvents(year, month) {
    const equipments = await this.getEquipments();
    const interventions = await this.getInterventions();

    const events = [];

    equipments.forEach((eq) => {
      const d = new Date(eq.prochainEntretien);
      if (d.getFullYear() === year && d.getMonth() === month) {
        events.push({
          date: eq.prochainEntretien,
          type: "echeance",
          title: `Entretien : ${eq.nom}`,
          equipmentId: eq.id,
          overdue: daysUntil(eq.prochainEntretien) < 0,
        });
      }
    });

    interventions.forEach((int) => {
      const d = new Date(int.date);
      if (d.getFullYear() === year && d.getMonth() === month) {
        events.push({
          date: int.date,
          type: "intervention",
          title: int.description || "Intervention",
          interventionId: int.id,
          equipmentId: int.equipmentId,
        });
      }
    });

    return events;
  },
};
