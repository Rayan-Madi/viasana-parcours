import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type {
  EtapeModele, EtapePatient, FichePatient, LignePatient, NoteSuivi,
  ParcoursModele, ParcoursPatient, Patient, Praticien, ReponseFormulaire, StatutEtape,
} from "../types";
import type { Repository } from "./repository";

/**
 * Même contrat que MockRepository, branché sur un projet Supabase.
 * Le schéma correspondant est dans supabase/schema.sql.
 */
export class SupabaseRepository implements Repository {
  readonly source = "supabase" as const;
  private db: SupabaseClient;

  constructor(url: string, anonKey: string) {
    this.db = createClient(url, anonKey);
  }

  async listerParcoursModeles(): Promise<ParcoursModele[]> {
    const { data, error } = await this.db.from("parcours_modele").select("*").order("nom");
    if (error) throw error;
    return data as ParcoursModele[];
  }

  async listerPraticiens(): Promise<Praticien[]> {
    const { data, error } = await this.db.from("praticien").select("*").order("nom");
    if (error) throw error;
    return data as Praticien[];
  }

  async listerPatients(): Promise<LignePatient[]> {
    const [parcours, patients, modeles, etapes, etapesModele, formulaires] = await Promise.all([
      this.table<ParcoursPatient>("parcours_patient"),
      this.table<Patient>("patient"),
      this.table<ParcoursModele>("parcours_modele"),
      this.table<EtapePatient>("etape_patient"),
      this.table<EtapeModele>("etape_modele"),
      this.table<ReponseFormulaire>("reponse_formulaire"),
    ]);

    return parcours.map((p) => {
      const patient = patients.find((x) => x.id === p.patient_id)!;
      const modele = modeles.find((m) => m.id === p.parcours_modele_id)!;
      const lignes = etapes
        .filter((e) => e.parcours_patient_id === p.id)
        .map((e) => ({ e, m: etapesModele.find((m) => m.id === e.etape_modele_id)! }))
        .sort((a, b) => a.m.ordre - b.m.ordre);

      const courante = lignes.find((l) => l.e.statut === "en_cours");
      const aVenir = lignes
        .filter((l) => l.e.date_prevue && l.e.statut !== "realisee")
        .map((l) => l.e.date_prevue!)
        .sort();

      return {
        patient,
        parcours: p,
        parcoursNom: modele.nom,
        etapeCourante: courante ? courante.m.libelle : null,
        etapesRealisees: lignes.filter((l) => l.e.statut === "realisee").length,
        etapesTotal: lignes.length,
        prochaineSeance: aVenir[0] ?? null,
        formulaireRecu: formulaires.some((f) => f.patient_id === patient.id),
      };
    });
  }

  async chargerFiche(parcoursPatientId: string): Promise<FichePatient | null> {
    const [parcoursAll, patients, modeles, etapes, etapesModele, praticiens, formulaires, notes] =
      await Promise.all([
        this.table<ParcoursPatient>("parcours_patient"),
        this.table<Patient>("patient"),
        this.table<ParcoursModele>("parcours_modele"),
        this.table<EtapePatient>("etape_patient"),
        this.table<EtapeModele>("etape_modele"),
        this.table<Praticien>("praticien"),
        this.table<ReponseFormulaire>("reponse_formulaire"),
        this.table<NoteSuivi>("note_suivi"),
      ]);

    const parcours = parcoursAll.find((p) => p.id === parcoursPatientId);
    if (!parcours) return null;

    const lignes = etapes
      .filter((e) => e.parcours_patient_id === parcours.id)
      .map((instance) => ({
        instance,
        modele: etapesModele.find((m) => m.id === instance.etape_modele_id)!,
        praticien: praticiens.find((p) => p.id === instance.praticien_id) ?? null,
      }))
      .sort((a, b) => a.modele.ordre - b.modele.ordre);

    const notesParcours = notes.filter((n) => n.parcours_patient_id === parcours.id);
    const impliques = new Set<string>();
    lignes.forEach((l) => l.instance.praticien_id && impliques.add(l.instance.praticien_id));
    notesParcours.forEach((n) => n.praticien_id && impliques.add(n.praticien_id));

    return {
      patient: patients.find((p) => p.id === parcours.patient_id)!,
      parcours,
      modele: modeles.find((m) => m.id === parcours.parcours_modele_id)!,
      etapes: lignes,
      praticiens: praticiens.filter((p) => impliques.has(p.id)),
      formulaire: formulaires.find((f) => f.patient_id === parcours.patient_id) ?? null,
      notes: notesParcours
        .sort((a, b) => b.cree_le.localeCompare(a.cree_le))
        .map((n) => ({
          ...n,
          praticienNom: praticiens.find((p) => p.id === n.praticien_id)?.nom ?? null,
        })),
    };
  }

  async changerStatutEtape(etapePatientId: string, statut: StatutEtape): Promise<void> {
    const { error } = await this.db
      .from("etape_patient")
      .update({
        statut,
        date_realisee: statut === "realisee" ? new Date().toISOString() : null,
      })
      .eq("id", etapePatientId);
    if (error) throw error;
  }

  async planifierEtape(etapePatientId: string, datePrevue: string | null): Promise<void> {
    const { error } = await this.db
      .from("etape_patient")
      .update({ date_prevue: datePrevue })
      .eq("id", etapePatientId);
    if (error) throw error;
  }

  async assignerPraticien(etapePatientId: string, praticienId: string | null): Promise<void> {
    const { error } = await this.db
      .from("etape_patient")
      .update({ praticien_id: praticienId })
      .eq("id", etapePatientId);
    if (error) throw error;
  }

  async ajouterNote(input: {
    parcoursPatientId: string;
    etapePatientId: string | null;
    praticienId: string | null;
    contenu: string;
  }): Promise<void> {
    const { error } = await this.db.from("note_suivi").insert({
      parcours_patient_id: input.parcoursPatientId,
      etape_patient_id: input.etapePatientId,
      praticien_id: input.praticienId,
      contenu: input.contenu,
    });
    if (error) throw error;
  }

  async enregistrerFormulaire(patientId: string, contenu: Record<string, string>): Promise<void> {
    const { error } = await this.db
      .from("reponse_formulaire")
      .upsert({ patient_id: patientId, contenu }, { onConflict: "patient_id" });
    if (error) throw error;
  }

  private async table<T>(nom: string): Promise<T[]> {
    const { data, error } = await this.db.from(nom).select("*");
    if (error) throw error;
    return (data ?? []) as T[];
  }
}
