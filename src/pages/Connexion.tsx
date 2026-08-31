import type { LignePatient, Praticien } from "../types";
import { SPECIALITES } from "../components/ui";

export type Session =
  | { type: "praticien"; id: string; nom: string; coordinateur: boolean }
  | { type: "patient"; id: string; nom: string; parcoursId: string };

interface Props {
  praticiens: Praticien[];
  lignes: LignePatient[];
  onConnexion: (session: Session) => void;
}

/**
 * Écran d'identification, sans mot de passe.
 * C'est délibérément une identité de démonstration et non une
 * authentification : en production, Supabase Auth avec des politiques de
 * sécurité au niveau des lignes. Ce qui compte ici, c'est de montrer que
 * chacun ne voit que ce qui le concerne.
 */
export function Connexion({ praticiens, lignes, onConnexion }: Props) {
  return (
    <div className="connexion">
      <h1>Qui êtes-vous ?</h1>
      <p className="subtitle">
        Écran d&apos;identification de démonstration, sans mot de passe. Chaque profil ne voit que
        ce qui le concerne.
      </p>

      <div className="card">
        <h2>Équipe soignante</h2>
        <div className="choix">
          {praticiens.map((p) => (
            <button
              key={p.id}
              className="profil"
              onClick={() =>
                onConnexion({
                  type: "praticien",
                  id: p.id,
                  nom: p.nom,
                  coordinateur: p.specialite === "coordinateur",
                })
              }
            >
              <span className="profil-nom">{p.nom}</span>
              <span className="profil-role">{SPECIALITES[p.specialite]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <h2>Patients</h2>
        <div className="choix">
          {lignes.map((l) => (
            <button
              key={l.parcours.id}
              className="profil"
              onClick={() =>
                onConnexion({
                  type: "patient",
                  id: l.patient.id,
                  nom: `${l.patient.prenom} ${l.patient.nom}`,
                  parcoursId: l.parcours.id,
                })
              }
            >
              <span className="profil-nom">
                {l.patient.prenom} {l.patient.nom}
              </span>
              <span className="profil-role">{l.parcoursNom}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
