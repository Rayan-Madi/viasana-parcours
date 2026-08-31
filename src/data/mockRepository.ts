import type {
  Alerte, EtapePatient, FichePatient, LignePatient, NoteSuivi, ParcoursModele,
  Praticien, ReponseFormulaire, StatutEtape,
} from "../types";
import { calculerAlertes } from "./alertes";
import type { Repository } from "./repository";
import * as seed from "./seed";

/**
 * Implémentation en mémoire, utilisée quand aucun projet Supabase n'est
 * configuré. Elle sert à faire tourner la démonstration sans compte, et à
 * garder l'application testable sans réseau.
 */
export class MockRepository implements Repository {
  readonly source = "demo" as const;

  private etapes: EtapePatient[] = seed.etapesPatient.map((e) => ({ ...e }));
  private notes: NoteSuivi[] = seed.notes.map((n) => ({ ...n }));
  private formulaires: ReponseFormulaire[] = seed.formulaires.map((f) => ({ ...f }));

  async listerParcoursModeles(): Promise<ParcoursModele[]> {
    return seed.parcoursModeles;
  }

  async listerPraticiens(): Promise<Praticien[]> {
    return seed.praticiens;
  }

  async listerPatients(): Promise<LignePatient[]> {
    return seed.parcoursPatients.map((parcours) => {
      const patient = seed.patients.find((p) => p.id === parcours.patient_id)!;
      const modele = seed.parcoursModeles.find((m) => m.id === parcours.parcours_modele_id)!;
      const etapes = this.etapesDuParcours(parcours.id);

      const impliques = new Set<string>();
      etapes.forEach((e) => e.instance.praticien_id && impliques.add(e.instance.praticien_id));
      this.notes
        .filter((n) => n.parcours_patient_id === parcours.id && n.praticien_id)
        .forEach((n) => impliques.add(n.praticien_id!));

      const courante = etapes.find((e) => e.instance.statut === "en_cours");
      const aVenir = etapes
        .filter((e) => e.instance.date_prevue && e.instance.statut !== "realisee")
        .map((e) => e.instance.date_prevue!)
        .sort();

      return {
        patient,
        parcours,
        parcoursNom: modele.nom,
        etapeCourante: courante ? courante.modele.libelle : null,
        etapesRealisees: etapes.filter((e) => e.instance.statut === "realisee").length,
        etapesTotal: etapes.length,
        prochaineSeance: aVenir[0] ?? null,
        formulaireRecu: this.formulaires.some((f) => f.patient_id === patient.id),
        praticienIds: [...impliques],
      };
    });
  }

  async listerAlertes(): Promise<Alerte[]> {
    return calculerAlertes({
      parcours: seed.parcoursPatients,
      patients: seed.patients,
      modeles: seed.parcoursModeles,
      etapes: this.etapes,
      etapesModele: seed.etapesModele,
      formulaires: this.formulaires,
      notes: this.notes,
    });
  }

  async chargerFiche(parcoursPatientId: string): Promise<FichePatient | null> {
    const parcours = seed.parcoursPatients.find((p) => p.id === parcoursPatientId);
    if (!parcours) return null;

    const patient = seed.patients.find((p) => p.id === parcours.patient_id)!;
    const modele = seed.parcoursModeles.find((m) => m.id === parcours.parcours_modele_id)!;
    const etapes = this.etapesDuParcours(parcoursPatientId);

    const praticienIds = new Set(
      etapes.map((e) => e.instance.praticien_id).filter((v): v is string => Boolean(v)),
    );
    this.notes
      .filter((n) => n.parcours_patient_id === parcoursPatientId && n.praticien_id)
      .forEach((n) => praticienIds.add(n.praticien_id!));

    return {
      patient,
      parcours,
      modele,
      etapes,
      praticiens: seed.praticiens.filter((p) => praticienIds.has(p.id)),
      formulaire: this.formulaires.find((f) => f.patient_id === patient.id) ?? null,
      notes: this.notes
        .filter((n) => n.parcours_patient_id === parcoursPatientId)
        .sort((a, b) => b.cree_le.localeCompare(a.cree_le))
        .map((n) => ({
          ...n,
          praticienNom: seed.praticiens.find((p) => p.id === n.praticien_id)?.nom ?? null,
        })),
    };
  }

  async changerStatutEtape(etapePatientId: string, statut: StatutEtape): Promise<void> {
    const etape = this.etapes.find((e) => e.id === etapePatientId);
    if (!etape) return;
    etape.statut = statut;
    etape.date_realisee = statut === "realisee" ? new Date().toISOString() : null;
  }

  async planifierEtape(etapePatientId: string, datePrevue: string | null): Promise<void> {
    const etape = this.etapes.find((e) => e.id === etapePatientId);
    if (etape) etape.date_prevue = datePrevue;
  }

  async assignerPraticien(etapePatientId: string, praticienId: string | null): Promise<void> {
    const etape = this.etapes.find((e) => e.id === etapePatientId);
    if (etape) etape.praticien_id = praticienId;
  }

  async ajouterNote(input: {
    parcoursPatientId: string;
    etapePatientId: string | null;
    praticienId: string | null;
    contenu: string;
  }): Promise<void> {
    this.notes.push({
      id: `nt-${Date.now()}`,
      parcours_patient_id: input.parcoursPatientId,
      etape_patient_id: input.etapePatientId,
      praticien_id: input.praticienId,
      contenu: input.contenu,
      cree_le: new Date().toISOString(),
    });
  }

  async enregistrerFormulaire(patientId: string, contenu: Record<string, string>): Promise<void> {
    const existant = this.formulaires.find((f) => f.patient_id === patientId);
    if (existant) {
      existant.contenu = contenu;
      existant.soumis_le = new Date().toISOString();
    } else {
      this.formulaires.push({
        id: `rf-${Date.now()}`,
        patient_id: patientId,
        contenu,
        soumis_le: new Date().toISOString(),
      });
    }
    // Le questionnaire est la première étape : la recevoir la clôture.
    const parcours = seed.parcoursPatients.find((p) => p.patient_id === patientId);
    if (!parcours) return;
    const premiere = this.etapesDuParcours(parcours.id)[0];
    if (premiere && premiere.instance.statut !== "realisee") {
      await this.changerStatutEtape(premiere.instance.id, "realisee");
      const suivante = this.etapesDuParcours(parcours.id)[1];
      if (suivante && suivante.instance.statut === "a_venir") {
        await this.changerStatutEtape(suivante.instance.id, "en_cours");
      }
    }
  }

  /** Étapes d'un parcours, jointes à leur modèle et triées par ordre. */
  private etapesDuParcours(parcoursPatientId: string): FichePatient["etapes"] {
    return this.etapes
      .filter((e) => e.parcours_patient_id === parcoursPatientId)
      .map((instance) => ({
        instance,
        modele: seed.etapesModele.find((m) => m.id === instance.etape_modele_id)!,
        praticien: seed.praticiens.find((p) => p.id === instance.praticien_id) ?? null,
      }))
      .sort((a, b) => a.modele.ordre - b.modele.ordre);
  }
}
