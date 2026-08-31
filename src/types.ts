export type Specialite =
  | "medecin"
  | "kine"
  | "osteopathe"
  | "podologue"
  | "dieteticien"
  | "coordinateur";

export type StatutParcours = "en_cours" | "termine" | "en_pause";
export type StatutEtape = "a_venir" | "en_cours" | "realisee" | "ignoree";

export interface Praticien {
  id: string;
  nom: string;
  specialite: Specialite;
  email: string;
}

export interface Patient {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  objectif: string | null;
  date_objectif: string | null;
}

export interface ParcoursModele {
  id: string;
  nom: string;
  description: string;
}

export interface EtapeModele {
  id: string;
  parcours_modele_id: string;
  ordre: number;
  libelle: string;
  description: string;
  specialite_requise: Specialite | null;
  obligatoire: boolean;
}

export interface ParcoursPatient {
  id: string;
  patient_id: string;
  parcours_modele_id: string;
  statut: StatutParcours;
  date_debut: string;
}

export interface EtapePatient {
  id: string;
  parcours_patient_id: string;
  etape_modele_id: string;
  statut: StatutEtape;
  date_prevue: string | null;
  date_realisee: string | null;
  praticien_id: string | null;
}

export interface ReponseFormulaire {
  id: string;
  patient_id: string;
  contenu: Record<string, string>;
  soumis_le: string;
}

export interface NoteSuivi {
  id: string;
  parcours_patient_id: string;
  etape_patient_id: string | null;
  praticien_id: string | null;
  contenu: string;
  cree_le: string;
}

/** Ligne de la liste praticien : tout ce qu'il faut sans ouvrir la fiche. */
export interface LignePatient {
  patient: Patient;
  parcours: ParcoursPatient;
  parcoursNom: string;
  etapeCourante: string | null;
  etapesRealisees: number;
  etapesTotal: number;
  prochaineSeance: string | null;
  formulaireRecu: boolean;
}

/** Vue complete d'un parcours, cote praticien comme cote patient. */
export interface FichePatient {
  patient: Patient;
  parcours: ParcoursPatient;
  modele: ParcoursModele;
  etapes: Array<{
    instance: EtapePatient;
    modele: EtapeModele;
    praticien: Praticien | null;
  }>;
  praticiens: Praticien[];
  formulaire: ReponseFormulaire | null;
  notes: Array<NoteSuivi & { praticienNom: string | null }>;
}

export type TypeAlerte =
  | "formulaire_manquant"
  | "etape_sans_date"
  | "etape_sans_praticien"
  | "parcours_dormant"
  | "parcours_en_pause";

/** Un point qui demande une action du coordinateur. */
export interface Alerte {
  parcoursPatientId: string;
  patientNom: string;
  parcoursNom: string;
  type: TypeAlerte;
  libelle: string;
  detail: string;
  gravite: "haute" | "moyenne";
}
