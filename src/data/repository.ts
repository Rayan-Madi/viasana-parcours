import type {
  FichePatient, LignePatient, ParcoursModele, Praticien, StatutEtape,
} from "../types";

/**
 * Toute la lecture et l'écriture passe par cette interface.
 * L'application ne sait pas si les données viennent d'un jeu de démonstration
 * en mémoire ou de Supabase : changer de source, c'est changer une ligne
 * dans `data/index.ts`.
 */
export interface Repository {
  /** Source réellement utilisée, affichée dans l'interface. */
  readonly source: "demo" | "supabase";

  listerParcoursModeles(): Promise<ParcoursModele[]>;
  listerPraticiens(): Promise<Praticien[]>;

  /** Liste praticien, avec l'avancement déjà calculé. */
  listerPatients(): Promise<LignePatient[]>;

  /** Fiche complète d'un parcours patient. */
  chargerFiche(parcoursPatientId: string): Promise<FichePatient | null>;

  changerStatutEtape(etapePatientId: string, statut: StatutEtape): Promise<void>;
  planifierEtape(etapePatientId: string, datePrevue: string | null): Promise<void>;

  ajouterNote(input: {
    parcoursPatientId: string;
    etapePatientId: string | null;
    praticienId: string | null;
    contenu: string;
  }): Promise<void>;

  enregistrerFormulaire(patientId: string, contenu: Record<string, string>): Promise<void>;
}
