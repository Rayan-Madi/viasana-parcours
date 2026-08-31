import type {
  EtapeModele, EtapePatient, NoteSuivi, ParcoursModele, ParcoursPatient,
  Patient, Praticien, ReponseFormulaire,
} from "../types";

/** Décalage en jours par rapport à aujourd'hui, en ISO. */
const j = (delta: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + delta);
  d.setHours(9, 0, 0, 0);
  return d.toISOString();
};

export const praticiens: Praticien[] = [
  { id: "pr-1", nom: "Camille Renaud", specialite: "kine", email: "c.renaud@viasana.fr" },
  { id: "pr-2", nom: "Dr Samir Ben Ali", specialite: "medecin", email: "s.benali@viasana.fr" },
  { id: "pr-3", nom: "Léa Fontaine", specialite: "osteopathe", email: "l.fontaine@viasana.fr" },
  { id: "pr-4", nom: "Marc Delaunay", specialite: "dieteticien", email: "m.delaunay@viasana.fr" },
  { id: "pr-5", nom: "Nadia Kessler", specialite: "coordinateur", email: "n.kessler@viasana.fr" },
];

export const parcoursModeles: ParcoursModele[] = [
  {
    id: "pm-marathon",
    nom: "Prépa Marathon",
    description:
      "Parcours coordonné de préparation à un marathon, du questionnaire initial au suivi pluridisciplinaire.",
  },
  {
    id: "pm-retour",
    nom: "Retour à la course après blessure",
    description:
      "Reprise progressive encadrée après une blessure, avec réévaluation régulière.",
  },
];

export const etapesModele: EtapeModele[] = [
  { id: "em-1", parcours_modele_id: "pm-marathon", ordre: 1, libelle: "Questionnaire initial",
    description: "Formulaire en ligne, 5 minutes. Historique de course, objectif, douleurs. Lu par le kiné avant le bilan.",
    specialite_requise: null, obligatoire: true },
  { id: "em-2", parcours_modele_id: "pm-marathon", ordre: 2, libelle: "Bilan clinique",
    description: "Consultation de 30 minutes avec un kiné du sport. Antécédents, volume, objectif, douleurs, appuis, déséquilibres.",
    specialite_requise: "kine", obligatoire: true },
  { id: "em-3", parcours_modele_id: "pm-marathon", ordre: 3, libelle: "Plan d’action personnalisé",
    description: "Remise des observations et des recommandations concrètes.",
    specialite_requise: "kine", obligatoire: true },
  { id: "em-4", parcours_modele_id: "pm-marathon", ordre: 4, libelle: "Analyse de foulée sur tapis",
    description: "Analyse vidéo de la course en conditions contrôlées.",
    specialite_requise: "kine", obligatoire: false },
  { id: "em-5", parcours_modele_id: "pm-marathon", ordre: 5, libelle: "Suivi coordonné 6 mois",
    description: "Accès au réseau pluridisciplinaire, rendez-vous coordonnés et partage documentaire.",
    specialite_requise: "coordinateur", obligatoire: false },

  { id: "er-1", parcours_modele_id: "pm-retour", ordre: 1, libelle: "Questionnaire initial",
    description: "Nature de la blessure, durée d'arrêt, douleurs résiduelles.",
    specialite_requise: null, obligatoire: true },
  { id: "er-2", parcours_modele_id: "pm-retour", ordre: 2, libelle: "Consultation médicale",
    description: "Validation médicale de la reprise.", specialite_requise: "medecin", obligatoire: true },
  { id: "er-3", parcours_modele_id: "pm-retour", ordre: 3, libelle: "Protocole de reprise",
    description: "Plan de reprise progressif établi avec le kiné.", specialite_requise: "kine", obligatoire: true },
];

export const patients: Patient[] = [
  { id: "pa-1", nom: "Moreau", prenom: "Julie", email: "julie.moreau@example.com",
    objectif: "Marathon de Paris, viser 3h45", date_objectif: "2027-04-11" },
  { id: "pa-2", nom: "Ferrand", prenom: "Thomas", email: "thomas.ferrand@example.com",
    objectif: "Premier marathon, terminer sans blessure", date_objectif: "2027-04-11" },
  { id: "pa-3", nom: "Nguyen", prenom: "Linh", email: "linh.nguyen@example.com",
    objectif: "Marathon de Berlin, battre 3h20", date_objectif: "2027-09-26" },
  { id: "pa-4", nom: "Bertrand", prenom: "Paul", email: "paul.bertrand@example.com",
    objectif: "Reprendre la course après une fracture de fatigue", date_objectif: null },
  { id: "pa-5", nom: "Silva", prenom: "Ana", email: "ana.silva@example.com",
    objectif: "Marathon de Nice, finir sous 4h", date_objectif: "2026-11-08" },
  { id: "pa-6", nom: "Dubois", prenom: "Karim", email: "karim.dubois@example.com",
    objectif: "Marathon de Paris, première participation", date_objectif: "2027-04-11" },
];

export const parcoursPatients: ParcoursPatient[] = [
  { id: "pp-1", patient_id: "pa-1", parcours_modele_id: "pm-marathon", statut: "en_cours", date_debut: "2026-07-02" },
  { id: "pp-2", patient_id: "pa-2", parcours_modele_id: "pm-marathon", statut: "en_cours", date_debut: "2026-08-18" },
  { id: "pp-3", patient_id: "pa-3", parcours_modele_id: "pm-marathon", statut: "en_cours", date_debut: "2026-06-15" },
  { id: "pp-4", patient_id: "pa-4", parcours_modele_id: "pm-retour", statut: "en_cours", date_debut: "2026-08-05" },
  { id: "pp-5", patient_id: "pa-5", parcours_modele_id: "pm-marathon", statut: "termine", date_debut: "2026-03-10" },
  { id: "pp-6", patient_id: "pa-6", parcours_modele_id: "pm-marathon", statut: "en_pause", date_debut: "2026-07-20" },
];

export const etapesPatient: EtapePatient[] = [
  // Julie : bilan réalisé, plan d'action en cours
  { id: "ep-1", parcours_patient_id: "pp-1", etape_modele_id: "em-1", statut: "realisee", date_prevue: null, date_realisee: j(-40), praticien_id: null },
  { id: "ep-2", parcours_patient_id: "pp-1", etape_modele_id: "em-2", statut: "realisee", date_prevue: j(-32), date_realisee: j(-32), praticien_id: "pr-1" },
  { id: "ep-3", parcours_patient_id: "pp-1", etape_modele_id: "em-3", statut: "en_cours", date_prevue: j(3), date_realisee: null, praticien_id: "pr-1" },
  { id: "ep-4", parcours_patient_id: "pp-1", etape_modele_id: "em-4", statut: "a_venir", date_prevue: j(12), date_realisee: null, praticien_id: "pr-1" },
  { id: "ep-5", parcours_patient_id: "pp-1", etape_modele_id: "em-5", statut: "a_venir", date_prevue: null, date_realisee: null, praticien_id: "pr-5" },

  // Thomas : formulaire tout juste reçu, bilan à venir
  { id: "ep-6", parcours_patient_id: "pp-2", etape_modele_id: "em-1", statut: "realisee", date_prevue: null, date_realisee: j(-4), praticien_id: null },
  { id: "ep-7", parcours_patient_id: "pp-2", etape_modele_id: "em-2", statut: "en_cours", date_prevue: j(6), date_realisee: null, praticien_id: "pr-1" },
  { id: "ep-8", parcours_patient_id: "pp-2", etape_modele_id: "em-3", statut: "a_venir", date_prevue: null, date_realisee: null, praticien_id: null },
  { id: "ep-9", parcours_patient_id: "pp-2", etape_modele_id: "em-4", statut: "a_venir", date_prevue: null, date_realisee: null, praticien_id: null },
  { id: "ep-10", parcours_patient_id: "pp-2", etape_modele_id: "em-5", statut: "a_venir", date_prevue: null, date_realisee: null, praticien_id: null },

  // Linh : parcours avancé, suivi coordonné en cours
  { id: "ep-11", parcours_patient_id: "pp-3", etape_modele_id: "em-1", statut: "realisee", date_prevue: null, date_realisee: j(-70), praticien_id: null },
  { id: "ep-12", parcours_patient_id: "pp-3", etape_modele_id: "em-2", statut: "realisee", date_prevue: j(-62), date_realisee: j(-62), praticien_id: "pr-1" },
  { id: "ep-13", parcours_patient_id: "pp-3", etape_modele_id: "em-3", statut: "realisee", date_prevue: null, date_realisee: j(-55), praticien_id: "pr-1" },
  { id: "ep-14", parcours_patient_id: "pp-3", etape_modele_id: "em-4", statut: "realisee", date_prevue: j(-30), date_realisee: j(-30), praticien_id: "pr-1" },
  { id: "ep-15", parcours_patient_id: "pp-3", etape_modele_id: "em-5", statut: "en_cours", date_prevue: j(9), date_realisee: null, praticien_id: "pr-5" },

  // Paul : autre parcours, formulaire non reçu
  { id: "ep-16", parcours_patient_id: "pp-4", etape_modele_id: "er-1", statut: "en_cours", date_prevue: null, date_realisee: null, praticien_id: null },
  { id: "ep-17", parcours_patient_id: "pp-4", etape_modele_id: "er-2", statut: "a_venir", date_prevue: j(15), date_realisee: null, praticien_id: "pr-2" },
  { id: "ep-18", parcours_patient_id: "pp-4", etape_modele_id: "er-3", statut: "a_venir", date_prevue: null, date_realisee: null, praticien_id: "pr-1" },

  // Ana : parcours terminé
  { id: "ep-19", parcours_patient_id: "pp-5", etape_modele_id: "em-1", statut: "realisee", date_prevue: null, date_realisee: j(-160), praticien_id: null },
  { id: "ep-20", parcours_patient_id: "pp-5", etape_modele_id: "em-2", statut: "realisee", date_prevue: j(-150), date_realisee: j(-150), praticien_id: "pr-1" },
  { id: "ep-21", parcours_patient_id: "pp-5", etape_modele_id: "em-3", statut: "realisee", date_prevue: null, date_realisee: j(-142), praticien_id: "pr-1" },
  { id: "ep-22", parcours_patient_id: "pp-5", etape_modele_id: "em-4", statut: "ignoree", date_prevue: null, date_realisee: null, praticien_id: null },
  { id: "ep-23", parcours_patient_id: "pp-5", etape_modele_id: "em-5", statut: "realisee", date_prevue: null, date_realisee: j(-20), praticien_id: "pr-5" },

  // Karim : en pause, formulaire jamais rempli
  { id: "ep-24", parcours_patient_id: "pp-6", etape_modele_id: "em-1", statut: "en_cours", date_prevue: null, date_realisee: null, praticien_id: null },
  { id: "ep-25", parcours_patient_id: "pp-6", etape_modele_id: "em-2", statut: "a_venir", date_prevue: null, date_realisee: null, praticien_id: null },
  { id: "ep-26", parcours_patient_id: "pp-6", etape_modele_id: "em-3", statut: "a_venir", date_prevue: null, date_realisee: null, praticien_id: null },
  { id: "ep-27", parcours_patient_id: "pp-6", etape_modele_id: "em-4", statut: "a_venir", date_prevue: null, date_realisee: null, praticien_id: null },
  { id: "ep-28", parcours_patient_id: "pp-6", etape_modele_id: "em-5", statut: "a_venir", date_prevue: null, date_realisee: null, praticien_id: null },
];

export const formulaires: ReponseFormulaire[] = [
  { id: "rf-1", patient_id: "pa-1", soumis_le: j(-40), contenu: {
    "Depuis combien de temps courez-vous ?": "6 ans",
    "Volume hebdomadaire actuel": "45 km sur 4 sorties",
    "Objectif": "Marathon de Paris en moins de 3h45",
    "Douleurs ou gênes actuelles": "Tension au tendon d'Achille droit après les sorties longues",
    "Blessures dans les 12 derniers mois": "Aponévrosite plantaire, résolue en janvier",
    "Chaussures utilisées": "Drop 8 mm, changées il y a 400 km",
  }},
  { id: "rf-2", patient_id: "pa-2", soumis_le: j(-4), contenu: {
    "Depuis combien de temps courez-vous ?": "14 mois",
    "Volume hebdomadaire actuel": "25 km sur 3 sorties",
    "Objectif": "Terminer mon premier marathon sans blessure",
    "Douleurs ou gênes actuelles": "Genou gauche sensible en descente",
    "Blessures dans les 12 derniers mois": "Aucune",
    "Chaussures utilisées": "Un seul modèle depuis le début",
  }},
  { id: "rf-3", patient_id: "pa-3", soumis_le: j(-70), contenu: {
    "Depuis combien de temps courez-vous ?": "11 ans",
    "Volume hebdomadaire actuel": "70 km sur 5 sorties, dont du fractionné",
    "Objectif": "Berlin sous 3h20",
    "Douleurs ou gênes actuelles": "Aucune",
    "Blessures dans les 12 derniers mois": "Périostite en mars, résolue",
    "Chaussures utilisées": "Deux paires en alternance",
  }},
  { id: "rf-5", patient_id: "pa-5", soumis_le: j(-160), contenu: {
    "Depuis combien de temps courez-vous ?": "3 ans",
    "Volume hebdomadaire actuel": "30 km",
    "Objectif": "Nice sous 4h",
    "Douleurs ou gênes actuelles": "Aucune",
    "Blessures dans les 12 derniers mois": "Aucune",
    "Chaussures utilisées": "Drop 10 mm",
  }},
];

export const notes: NoteSuivi[] = [
  { id: "nt-1", parcours_patient_id: "pp-1", etape_patient_id: "ep-2", praticien_id: "pr-1",
    contenu: "Bilan réalisé. Déséquilibre marqué côté droit, appui pronateur. Charge à réduire de 20 % pendant trois semaines avant reprise progressive.",
    cree_le: j(-32) },
  { id: "nt-2", parcours_patient_id: "pp-1", etape_patient_id: null, praticien_id: "pr-3",
    contenu: "Séance ostéo réalisée hors parcours à la demande de la patiente. Mobilité cheville droite améliorée, à revoir dans un mois.",
    cree_le: j(-14) },
  { id: "nt-3", parcours_patient_id: "pp-3", etape_patient_id: "ep-14", praticien_id: "pr-1",
    contenu: "Analyse de foulée : cadence 168 pas par minute, attaque talon marquée. Travail de cadence proposé, cible 175.",
    cree_le: j(-30) },
  { id: "nt-4", parcours_patient_id: "pp-3", etape_patient_id: null, praticien_id: "pr-4",
    contenu: "Point diététique : apports glucidiques insuffisants sur les sorties longues. Plan de ravitaillement transmis.",
    cree_le: j(-8) },
  { id: "nt-5", parcours_patient_id: "pp-6", etape_patient_id: null, praticien_id: "pr-5",
    contenu: "Patient injoignable depuis trois semaines. Parcours mis en pause, relance prévue début du mois prochain.",
    cree_le: j(-21) },
];
