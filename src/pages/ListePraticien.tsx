import { useMemo, useState } from "react";
import type { LignePatient, ParcoursModele } from "../types";
import { BadgeParcours, Progression, dateHeure } from "../components/ui";

interface Props {
  lignes: LignePatient[];
  modeles: ParcoursModele[];
  onOuvrir: (parcoursPatientId: string) => void;
}

export function ListePraticien({ lignes, modeles, onOuvrir }: Props) {
  const [recherche, setRecherche] = useState("");
  const [parcours, setParcours] = useState("tous");
  const [statut, setStatut] = useState("tous");
  const [etape, setEtape] = useState("toutes");

  const etapesDisponibles = useMemo(() => {
    const set = new Set<string>();
    lignes.forEach((l) => l.etapeCourante && set.add(l.etapeCourante));
    return [...set].sort();
  }, [lignes]);

  const filtrees = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return lignes.filter((l) => {
      if (parcours !== "tous" && l.parcours.parcours_modele_id !== parcours) return false;
      if (statut !== "tous" && l.parcours.statut !== statut) return false;
      if (etape !== "toutes" && l.etapeCourante !== etape) return false;
      if (q) {
        const cible = `${l.patient.prenom} ${l.patient.nom} ${l.patient.email}`.toLowerCase();
        if (!cible.includes(q)) return false;
      }
      return true;
    });
  }, [lignes, recherche, parcours, statut, etape]);

  return (
    <>
      <h1>Patients suivis</h1>
      <p className="subtitle">
        Vue d&apos;ensemble des parcours en cours, quelle que soit la spécialité du praticien.
      </p>

      <div className="filters">
        <input
          type="search"
          placeholder="Rechercher un patient"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          aria-label="Rechercher un patient"
        />
        <select value={parcours} onChange={(e) => setParcours(e.target.value)} aria-label="Parcours">
          <option value="tous">Tous les parcours</option>
          {modeles.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nom}
            </option>
          ))}
        </select>
        <select value={statut} onChange={(e) => setStatut(e.target.value)} aria-label="Statut">
          <option value="tous">Tous les statuts</option>
          <option value="en_cours">En cours</option>
          <option value="termine">Terminé</option>
          <option value="en_pause">En pause</option>
        </select>
        <select value={etape} onChange={(e) => setEtape(e.target.value)} aria-label="Étape courante">
          <option value="toutes">Toutes les étapes</option>
          {etapesDisponibles.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
        <span className="count">
          {filtrees.length} patient{filtrees.length > 1 ? "s" : ""} sur {lignes.length}
        </span>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Parcours</th>
                <th>Étape courante</th>
                <th>Avancement</th>
                <th>Prochaine séance</th>
                <th>Statut</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtrees.map((l) => (
                <tr key={l.parcours.id}>
                  <td className="name">
                    {l.patient.prenom} {l.patient.nom}
                    <div className="muted">{l.patient.objectif ?? "Objectif non renseigné"}</div>
                  </td>
                  <td>{l.parcoursNom}</td>
                  <td>
                    {l.etapeCourante ?? <span className="muted">Aucune étape active</span>}
                    {!l.formulaireRecu && (
                      <div className="muted">Formulaire non reçu</div>
                    )}
                  </td>
                  <td>
                    <Progression fait={l.etapesRealisees} total={l.etapesTotal} />
                  </td>
                  <td>{dateHeure(l.prochaineSeance)}</td>
                  <td>
                    <BadgeParcours statut={l.parcours.statut} />
                  </td>
                  <td>
                    <button className="link-btn" onClick={() => onOuvrir(l.parcours.id)}>
                      Ouvrir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtrees.length === 0 && <p className="empty">Aucun patient ne correspond à ces filtres.</p>}
      </div>
    </>
  );
}
