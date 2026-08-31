import { useMemo } from "react";
import type { Alerte, LignePatient } from "../types";
import { Progression, dateHeure } from "../components/ui";

interface Props {
  alertes: Alerte[];
  lignes: LignePatient[];
  onOuvrir: (parcoursPatientId: string) => void;
}

/**
 * La vue praticien répond à « où en est ce patient ».
 * Celle-ci répond à « de qui dois-je m'occuper aujourd'hui ».
 */
export function TableauCoordination({ alertes, lignes, onOuvrir }: Props) {
  const hautes = alertes.filter((a) => a.gravite === "haute");
  const moyennes = alertes.filter((a) => a.gravite === "moyenne");

  const parParcours = useMemo(() => {
    const map = new Map<string, Alerte[]>();
    alertes.forEach((a) => {
      const liste = map.get(a.parcoursPatientId) ?? [];
      liste.push(a);
      map.set(a.parcoursPatientId, liste);
    });
    return map;
  }, [alertes]);

  const sansAlerte = lignes.filter(
    (l) => l.parcours.statut !== "termine" && !parParcours.has(l.parcours.id),
  );

  return (
    <>
      <h1>Points à traiter</h1>
      <p className="subtitle">
        Les parcours qui n&apos;avancent pas, classés par urgence. Un parcours terminé ne remonte
        jamais ici.
      </p>

      <div className="stats">
        <div className="stat">
          <strong>{hautes.length}</strong>
          <span>bloquants</span>
        </div>
        <div className="stat">
          <strong>{moyennes.length}</strong>
          <span>à surveiller</span>
        </div>
        <div className="stat">
          <strong>{sansAlerte.length}</strong>
          <span>parcours sains</span>
        </div>
      </div>

      {[...parParcours.entries()].map(([parcoursId, liste]) => {
        const ligne = lignes.find((l) => l.parcours.id === parcoursId);
        const bloquant = liste.some((a) => a.gravite === "haute");
        return (
          <div className={`card alerte ${bloquant ? "bloquant" : ""}`} key={parcoursId}>
            <div className="alerte-head">
              <div>
                <span className="alerte-nom">{liste[0].patientNom}</span>
                <span className="alerte-parcours">{liste[0].parcoursNom}</span>
              </div>
              <div className="alerte-actions">
                {ligne && (
                  <Progression fait={ligne.etapesRealisees} total={ligne.etapesTotal} />
                )}
                <button className="link-btn" onClick={() => onOuvrir(parcoursId)}>
                  Ouvrir la fiche
                </button>
              </div>
            </div>
            <ul className="alerte-liste">
              {liste.map((a, i) => (
                <li key={i}>
                  <span className={`puce ${a.gravite}`} aria-hidden />
                  <div>
                    <div className="alerte-libelle">{a.libelle}</div>
                    <div className="alerte-detail">{a.detail}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        );
      })}

      {alertes.length === 0 && (
        <div className="card">
          <p className="empty">Aucun point bloquant. Tous les parcours avancent.</p>
        </div>
      )}

      {sansAlerte.length > 0 && (
        <div className="card">
          <h2>Parcours sans point d&apos;attention</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Parcours</th>
                  <th>Étape courante</th>
                  <th>Prochaine séance</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {sansAlerte.map((l) => (
                  <tr key={l.parcours.id}>
                    <td className="name">
                      {l.patient.prenom} {l.patient.nom}
                    </td>
                    <td>{l.parcoursNom}</td>
                    <td>{l.etapeCourante ?? "—"}</td>
                    <td>{dateHeure(l.prochaineSeance)}</td>
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
        </div>
      )}
    </>
  );
}
