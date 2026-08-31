import { describe, expect, it } from "vitest";
import { JOURS_AVANT_DORMANT, calculerAlertes } from "./alertes";
import type {
  EtapeModele, EtapePatient, NoteSuivi, ParcoursModele, ParcoursPatient,
  Patient, ReponseFormulaire,
} from "../types";

/**
 * `calculerAlertes` est la seule logique métier non triviale du projet :
 * c'est elle qui décide ce qui est bloquant. Elle est écrite comme une
 * fonction pure, donc elle se teste sans base de données.
 */

const ilYA = (jours: number) =>
  new Date(Date.now() - jours * 86_400_000).toISOString();

const modele: ParcoursModele = { id: "m1", nom: "Prépa Marathon", description: "" };

const etapesModele: EtapeModele[] = [
  { id: "em1", parcours_modele_id: "m1", ordre: 1, libelle: "Questionnaire initial",
    description: "", specialite_requise: null, obligatoire: true },
  { id: "em2", parcours_modele_id: "m1", ordre: 2, libelle: "Bilan clinique",
    description: "", specialite_requise: "kine", obligatoire: true },
];

const patient: Patient = {
  id: "p1", nom: "Moreau", prenom: "Julie", email: "j@example.com",
  objectif: null, date_objectif: null,
};

/** Construit un cas de test complet à partir de quelques différences. */
function cas(options: {
  statut?: ParcoursPatient["statut"];
  etapes?: Partial<EtapePatient>[];
  formulaire?: boolean;
  notes?: Partial<NoteSuivi>[];
}) {
  const parcours: ParcoursPatient = {
    id: "pp1", patient_id: "p1", parcours_modele_id: "m1",
    statut: options.statut ?? "en_cours", date_debut: ilYA(30),
  };
  const etapes: EtapePatient[] = (options.etapes ?? []).map((e, i) => ({
    id: `ep${i}`,
    parcours_patient_id: "pp1",
    etape_modele_id: etapesModele[i].id,
    statut: "a_venir",
    date_prevue: null,
    date_realisee: null,
    praticien_id: null,
    ...e,
  }));
  const formulaires: ReponseFormulaire[] = options.formulaire
    ? [{ id: "rf1", patient_id: "p1", contenu: {}, soumis_le: ilYA(30) }]
    : [];
  const notes: NoteSuivi[] = (options.notes ?? []).map((n, i) => ({
    id: `n${i}`, parcours_patient_id: "pp1", etape_patient_id: null,
    praticien_id: null, contenu: "", cree_le: ilYA(1), ...n,
  }));

  return calculerAlertes({
    parcours: [parcours], patients: [patient], modeles: [modele],
    etapes, etapesModele, formulaires, notes,
  });
}

describe("calculerAlertes", () => {
  it("signale un questionnaire jamais transmis", () => {
    const a = cas({ formulaire: false, etapes: [{}, {}] });
    expect(a.map((x) => x.type)).toContain("formulaire_manquant");
  });

  it("ne signale rien sur le questionnaire quand il est reçu", () => {
    const a = cas({ formulaire: true, etapes: [{ statut: "realisee", date_realisee: ilYA(1) }] });
    expect(a.map((x) => x.type)).not.toContain("formulaire_manquant");
  });

  it("signale une étape en cours sans date", () => {
    const a = cas({ formulaire: true, etapes: [{ statut: "realisee", date_realisee: ilYA(1) }, { statut: "en_cours" }] });
    expect(a.map((x) => x.type)).toContain("etape_sans_date");
  });

  it("ne signale pas une étape à venir sans date", () => {
    const a = cas({ formulaire: true, etapes: [{ statut: "realisee", date_realisee: ilYA(1) }, { statut: "a_venir" }] });
    expect(a.map((x) => x.type)).not.toContain("etape_sans_date");
  });

  it("signale une étape en cours sans praticien quand une spécialité est attendue", () => {
    const a = cas({
      formulaire: true,
      etapes: [{ statut: "realisee", date_realisee: ilYA(1) }, { statut: "en_cours", date_prevue: ilYA(-2) }],
    });
    expect(a.map((x) => x.type)).toContain("etape_sans_praticien");
  });

  it("ne réclame pas de praticien sur une étape qui n'en attend pas", () => {
    const a = cas({
      formulaire: true,
      etapes: [{ statut: "en_cours", date_prevue: ilYA(-2) }],
    });
    expect(a.map((x) => x.type)).not.toContain("etape_sans_praticien");
  });

  it("signale un parcours sans activité depuis plus de trois semaines", () => {
    const a = cas({
      formulaire: true,
      etapes: [{ statut: "realisee", date_realisee: ilYA(JOURS_AVANT_DORMANT + 5) }],
    });
    expect(a.map((x) => x.type)).toContain("parcours_dormant");
  });

  it("ne signale pas un parcours actif récemment", () => {
    const a = cas({
      formulaire: true,
      etapes: [{ statut: "realisee", date_realisee: ilYA(2) }],
    });
    expect(a.map((x) => x.type)).not.toContain("parcours_dormant");
  });

  it("compte une note récente comme une activité", () => {
    const a = cas({
      formulaire: true,
      etapes: [{ statut: "realisee", date_realisee: ilYA(JOURS_AVANT_DORMANT + 5) }],
      notes: [{ cree_le: ilYA(1) }],
    });
    expect(a.map((x) => x.type)).not.toContain("parcours_dormant");
  });

  it("ignore complètement un parcours terminé", () => {
    const a = cas({ statut: "termine", formulaire: false, etapes: [{ statut: "en_cours" }] });
    expect(a).toHaveLength(0);
  });

  it("signale un parcours en pause", () => {
    const a = cas({
      statut: "en_pause", formulaire: true,
      etapes: [{ statut: "realisee", date_realisee: ilYA(1) }],
    });
    expect(a.map((x) => x.type)).toContain("parcours_en_pause");
  });

  it("place les alertes bloquantes avant celles à surveiller", () => {
    const a = cas({ statut: "en_pause", formulaire: false, etapes: [{ statut: "en_cours" }] });
    const gravites = a.map((x) => x.gravite);
    expect(gravites.indexOf("haute")).toBeLessThan(gravites.lastIndexOf("moyenne"));
  });
});
