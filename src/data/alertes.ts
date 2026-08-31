import type {
  Alerte, EtapeModele, EtapePatient, NoteSuivi, ParcoursModele,
  ParcoursPatient, Patient, ReponseFormulaire,
} from "../types";

/** Au-dela de ce delai sans aucune activite, un parcours est considere dormant. */
export const JOURS_AVANT_DORMANT = 21;

interface Donnees {
  parcours: ParcoursPatient[];
  patients: Patient[];
  modeles: ParcoursModele[];
  etapes: EtapePatient[];
  etapesModele: EtapeModele[];
  formulaires: ReponseFormulaire[];
  notes: NoteSuivi[];
}

/**
 * Regles de detection, ecrites une seule fois et partagees par les deux
 * implementations du repository. Elles ne dependent d'aucune source de
 * donnees, ce qui les rend testables isolement.
 */
export function calculerAlertes(d: Donnees): Alerte[] {
  const alertes: Alerte[] = [];
  const maintenant = Date.now();

  for (const parcours of d.parcours) {
    if (parcours.statut === "termine") continue;

    const patient = d.patients.find((p) => p.id === parcours.patient_id);
    const modele = d.modeles.find((m) => m.id === parcours.parcours_modele_id);
    if (!patient || !modele) continue;

    const base = {
      parcoursPatientId: parcours.id,
      patientNom: `${patient.prenom} ${patient.nom}`,
      parcoursNom: modele.nom,
    };

    const etapes = d.etapes
      .filter((e) => e.parcours_patient_id === parcours.id)
      .map((e) => ({ e, m: d.etapesModele.find((m) => m.id === e.etape_modele_id)! }))
      .sort((a, b) => a.m.ordre - b.m.ordre);

    if (parcours.statut === "en_pause") {
      alertes.push({
        ...base,
        type: "parcours_en_pause",
        libelle: "Parcours en pause",
        detail: "À relancer ou à clôturer explicitement.",
        gravite: "moyenne",
      });
    }

    if (!d.formulaires.some((f) => f.patient_id === patient.id)) {
      alertes.push({
        ...base,
        type: "formulaire_manquant",
        libelle: "Questionnaire jamais transmis",
        detail: "Le bilan ne peut pas être préparé sans ces réponses.",
        gravite: "haute",
      });
    }

    for (const { e, m } of etapes) {
      if (e.statut !== "en_cours") continue;
      if (!e.date_prevue) {
        alertes.push({
          ...base,
          type: "etape_sans_date",
          libelle: `« ${m.libelle} » sans date`,
          detail: "Étape en cours mais aucune séance planifiée.",
          gravite: "haute",
        });
      }
      if (!e.praticien_id && m.specialite_requise) {
        alertes.push({
          ...base,
          type: "etape_sans_praticien",
          libelle: `« ${m.libelle} » sans praticien`,
          detail: `Aucun praticien assigné alors qu'un ${m.specialite_requise} est attendu.`,
          gravite: "haute",
        });
      }
    }

    const dates = [
      ...etapes.map(({ e }) => e.date_realisee).filter((v): v is string => Boolean(v)),
      ...d.notes.filter((n) => n.parcours_patient_id === parcours.id).map((n) => n.cree_le),
    ];
    if (dates.length > 0) {
      const triees = dates.sort();
      const derniere = triees[triees.length - 1];
      const jours = Math.floor((maintenant - new Date(derniere).getTime()) / 86_400_000);
      if (jours >= JOURS_AVANT_DORMANT) {
        alertes.push({
          ...base,
          type: "parcours_dormant",
          libelle: `Aucune activité depuis ${jours} jours`,
          detail: "Dernier acte enregistré il y a plus de trois semaines.",
          gravite: "moyenne",
        });
      }
    }
  }

  const poids = { haute: 0, moyenne: 1 } as const;
  return alertes.sort(
    (a, b) => poids[a.gravite] - poids[b.gravite] || a.patientNom.localeCompare(b.patientNom),
  );
}
