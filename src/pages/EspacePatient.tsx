import { useState } from "react";
import type { FichePatient, LignePatient } from "../types";
import { FicheParcours } from "./FicheParcours";

/** Questions du formulaire préalable, reprises du parcours Prépa Marathon. */
export const QUESTIONS = [
  "Depuis combien de temps courez-vous ?",
  "Volume hebdomadaire actuel",
  "Objectif",
  "Douleurs ou gênes actuelles",
  "Blessures dans les 12 derniers mois",
  "Chaussures utilisées",
];

interface Props {
  lignes: LignePatient[];
  parcoursId: string;
  fiche: FichePatient | null;
  onChangerPatient: (parcoursPatientId: string) => void;
  onEnvoyerFormulaire: (patientId: string, contenu: Record<string, string>) => void;
}

export function EspacePatient({
  lignes, parcoursId, fiche, onChangerPatient, onEnvoyerFormulaire,
}: Props) {
  const [reponses, setReponses] = useState<Record<string, string>>({});
  const [modeEdition, setModeEdition] = useState(false);

  if (!fiche) return <p className="empty">Chargement…</p>;

  const formulaireRempli = Boolean(fiche.formulaire);
  const afficherFormulaire = !formulaireRempli || modeEdition;

  const envoyer = () => {
    const contenu: Record<string, string> = {};
    QUESTIONS.forEach((q) => {
      contenu[q] = (reponses[q] ?? fiche.formulaire?.contenu[q] ?? "").trim() || "Non renseigné";
    });
    onEnvoyerFormulaire(fiche.patient.id, contenu);
    setReponses({});
    setModeEdition(false);
  };

  return (
    <>
      <div className="patient-switch">
        <span className="muted" style={{ color: "var(--ink-faint)", fontSize: 13 }}>
          Démonstration, choisir le patient connecté :
        </span>
        <select value={parcoursId} onChange={(e) => onChangerPatient(e.target.value)} aria-label="Patient">
          {lignes.map((l) => (
            <option key={l.parcours.id} value={l.parcours.id}>
              {l.patient.prenom} {l.patient.nom} — {l.parcoursNom}
            </option>
          ))}
        </select>
      </div>

      {!formulaireRempli && (
        <div className="banner">
          Votre questionnaire n&apos;a pas encore été transmis. Il est lu par le kinésithérapeute
          avant votre bilan, cela prend cinq minutes.
        </div>
      )}

      {afficherFormulaire ? (
        <div className="card">
          <h2>Questionnaire préalable</h2>
          <p className="subtitle">
            Ces réponses constituent votre dossier et sont partagées avec les praticiens de votre
            parcours.
          </p>
          <div className="form-grid">
            {QUESTIONS.map((q) => (
              <label key={q}>
                <span className="q">{q}</span>
                <input
                  value={reponses[q] ?? fiche.formulaire?.contenu[q] ?? ""}
                  onChange={(e) => setReponses((r) => ({ ...r, [q]: e.target.value }))}
                />
              </label>
            ))}
            <div>
              <button className="primary" onClick={envoyer}>
                {formulaireRempli ? "Enregistrer les modifications" : "Transmettre mon questionnaire"}
              </button>
              {formulaireRempli && (
                <button
                  className="link-btn"
                  style={{ marginLeft: 8 }}
                  onClick={() => setModeEdition(false)}
                >
                  Annuler
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>Votre questionnaire a bien été transmis.</span>
          <button className="link-btn" onClick={() => setModeEdition(true)}>
            Consulter ou modifier
          </button>
        </div>
      )}

      <FicheParcours
        fiche={fiche}
        praticiens={[]}
        lectureSeule
        onChangerStatut={() => {}}
        onAjouterNote={() => {}}
      />
    </>
  );
}
