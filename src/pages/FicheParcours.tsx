import { useState } from "react";
import type { FichePatient, Praticien, StatutEtape } from "../types";
import {
  BadgeEtape, BadgeParcours, Progression, SPECIALITES, dateCourte, dateHeure,
  depuisInputDateTime, versInputDateTime,
} from "../components/ui";

interface Props {
  fiche: FichePatient;
  praticiens: Praticien[];
  lectureSeule?: boolean;
  onRetour?: () => void;
  onChangerStatut: (etapePatientId: string, statut: StatutEtape) => void;
  /**
   * L'auteur n'est volontairement pas un paramètre : il est déduit de la session
   * par App. Le formulaire est ainsi incapable de désigner quelqu'un d'autre.
   */
  onAjouterNote: (
    contenu: string,
    etapePatientId: string | null,
    visiblePatient: boolean,
  ) => void;
  onAssignerPraticien?: (etapePatientId: string, praticienId: string | null) => void;
  onPlanifier?: (etapePatientId: string, datePrevue: string | null) => void;
}

export function FicheParcours({
  fiche, praticiens, lectureSeule = false, onRetour, onChangerStatut, onAjouterNote,
  onAssignerPraticien, onPlanifier,
}: Props) {
  const [note, setNote] = useState("");
  // Une note peut concerner une étape précise ou le parcours dans son ensemble,
  // par exemple une séance réalisée hors parcours.
  const [rattachement, setRattachement] = useState("");
  // Interne par défaut : partager avec le patient doit être un geste conscient.
  const [visiblePatient, setVisiblePatient] = useState(false);

  const realisees = fiche.etapes.filter((e) => e.instance.statut === "realisee").length;
  const prochaines = fiche.etapes
    .filter((e) => e.instance.date_prevue && e.instance.statut !== "realisee")
    .sort((a, b) => a.instance.date_prevue!.localeCompare(b.instance.date_prevue!));

  const soumettreNote = () => {
    const contenu = note.trim();
    if (!contenu) return;
    onAjouterNote(contenu, rattachement || null, visiblePatient);
    setNote("");
    setVisiblePatient(false);
  };

  /** Libellé de l'étape à laquelle une note est rattachée, s'il y en a une. */
  const etapeDeLaNote = (etapePatientId: string | null) =>
    etapePatientId
      ? (fiche.etapes.find((e) => e.instance.id === etapePatientId)?.modele.libelle ?? null)
      : null;

  return (
    <>
      {onRetour && (
        <button className="back" onClick={onRetour}>
          &larr; Retour à la liste
        </button>
      )}

      <h1>
        {fiche.patient.prenom} {fiche.patient.nom}
      </h1>
      <p className="subtitle">
        {fiche.modele.nom} &middot; démarré le {dateCourte(fiche.parcours.date_debut)}{" "}
        <BadgeParcours statut={fiche.parcours.statut} />
      </p>

      <div className="grid-2">
        <div>
          <div className="card">
            <h2>Parcours</h2>
            <div style={{ marginBottom: 16 }}>
              <Progression fait={realisees} total={fiche.etapes.length} />
            </div>

            <ul className="timeline">
              {fiche.etapes.map(({ instance, modele, praticien }) => {
                const classeDot =
                  instance.statut === "realisee" ? "done" : instance.statut === "en_cours" ? "now" : "";
                return (
                  <li key={instance.id}>
                    <span className={`dot ${classeDot}`}>
                      {instance.statut === "realisee" ? "✓" : modele.ordre}
                    </span>
                    <div>
                      <div className="step-head">
                        <span className="step-title">{modele.libelle}</span>
                        <BadgeEtape statut={instance.statut} />
                        {!modele.obligatoire && <span className="optional">optionnelle</span>}
                      </div>
                      <p className="step-desc">{modele.description}</p>
                      <div className="step-meta">
                        {praticien && (
                          <span>
                            {praticien.nom} &middot; {SPECIALITES[praticien.specialite]}
                          </span>
                        )}
                        {instance.date_realisee && <span>Réalisée le {dateCourte(instance.date_realisee)}</span>}
                        {!instance.date_realisee && instance.date_prevue && (
                          <span>Prévue le {dateHeure(instance.date_prevue)}</span>
                        )}
                      </div>

                      {!lectureSeule && (
                        <div className="step-actions">
                          {instance.statut !== "en_cours" && (
                            <button onClick={() => onChangerStatut(instance.id, "en_cours")}>
                              Marquer en cours
                            </button>
                          )}
                          {instance.statut !== "realisee" && (
                            <button onClick={() => onChangerStatut(instance.id, "realisee")}>
                              Marquer réalisée
                            </button>
                          )}
                          {instance.statut !== "a_venir" && (
                            <button onClick={() => onChangerStatut(instance.id, "a_venir")}>
                              Remettre à venir
                            </button>
                          )}
                          {!modele.obligatoire && instance.statut !== "ignoree" && (
                            <button onClick={() => onChangerStatut(instance.id, "ignoree")}>
                              Non retenue
                            </button>
                          )}
                        </div>
                      )}

                      {!lectureSeule && onAssignerPraticien && onPlanifier && (
                        <div className="coordination">
                          <label>
                            Praticien assigné
                            <select
                              value={instance.praticien_id ?? ""}
                              onChange={(e) =>
                                onAssignerPraticien(instance.id, e.target.value || null)
                              }
                            >
                              <option value="">Non assigné</option>
                              {praticiens.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.nom} — {SPECIALITES[p.specialite]}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label>
                            Date prévue
                            <input
                              type="datetime-local"
                              value={versInputDateTime(instance.date_prevue)}
                              onChange={(e) =>
                                onPlanifier(instance.id, depuisInputDateTime(e.target.value))
                              }
                            />
                          </label>
                          {modele.specialite_requise && (
                            <span className="hint">
                              Spécialité attendue : {SPECIALITES[modele.specialite_requise]}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="card">
            <h2>Notes de suivi</h2>
            {!lectureSeule && (
              <div className="note-form">
                <textarea
                  placeholder="Observation, compte rendu de séance, point de coordination…"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
                <div className="row">
                  <select
                    value={rattachement}
                    onChange={(e) => setRattachement(e.target.value)}
                    aria-label="Rattacher la note"
                  >
                    <option value="">Sur le parcours entier</option>
                    {fiche.etapes.map(({ instance, modele }) => (
                      <option key={instance.id} value={instance.id}>
                        Étape {modele.ordre} : {modele.libelle}
                      </option>
                    ))}
                  </select>
                  <button className="primary" onClick={soumettreNote} disabled={!note.trim()}>
                    Ajouter la note
                  </button>
                </div>
                <label className="partage">
                  <input
                    type="checkbox"
                    checked={visiblePatient}
                    onChange={(e) => setVisiblePatient(e.target.checked)}
                  />
                  Visible par le patient
                  <span className="partage-aide">
                    Par défaut la note reste interne à l&apos;équipe.
                  </span>
                </label>
              </div>
            )}

            <div style={{ marginTop: lectureSeule ? 0 : 20 }}>
              {fiche.notes.length === 0 && <p className="empty">Aucune note pour l&apos;instant.</p>}
              {fiche.notes.map((n) => (
                <div className="note" key={n.id}>
                  <div className="note-head">
                    {n.praticienNom ?? "Équipe Via Sana"} &middot; {dateCourte(n.cree_le)}
                    {etapeDeLaNote(n.etape_patient_id) && (
                      <span className="note-etape">{etapeDeLaNote(n.etape_patient_id)}</span>
                    )}
                    {!lectureSeule && !n.visible_patient && (
                      <span className="note-interne">interne</span>
                    )}
                  </div>
                  <div className="note-body">{n.contenu}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="card">
            <h2>Identité et objectif</h2>
            <dl className="facts">
              <dt>Patient</dt>
              <dd>
                {fiche.patient.prenom} {fiche.patient.nom}
              </dd>
              <dt>Email</dt>
              <dd>{fiche.patient.email}</dd>
              <dt>Objectif</dt>
              <dd>{fiche.patient.objectif ?? "Non renseigné"}</dd>
              <dt>Échéance</dt>
              <dd>{fiche.patient.date_objectif ? dateCourte(fiche.patient.date_objectif) : "Non fixée"}</dd>
            </dl>
          </div>

          <div className="card">
            <h2>Prochaines séances</h2>
            {prochaines.length === 0 && <p className="empty">Rien de planifié.</p>}
            {prochaines.map(({ instance, modele, praticien }) => (
              <div className="qa" key={instance.id}>
                <div className="q">{dateHeure(instance.date_prevue)}</div>
                <div className="a">
                  {modele.libelle}
                  {praticien && <span className="muted"> &middot; {praticien.nom}</span>}
                </div>
              </div>
            ))}
          </div>

          <div className="card">
            <h2>Praticiens impliqués</h2>
            {fiche.praticiens.length === 0 && <p className="empty">Aucun praticien assigné.</p>}
            {fiche.praticiens.map((p) => (
              <div className="qa" key={p.id}>
                <div className="a">{p.nom}</div>
                <div className="q">{SPECIALITES[p.specialite]}</div>
              </div>
            ))}
          </div>

          <div className="card">
            <h2>Formulaire préalable</h2>
            {!fiche.formulaire && <p className="empty">Formulaire non reçu.</p>}
            {fiche.formulaire && (
              <>
                <p className="subtitle" style={{ marginBottom: 12 }}>
                  Reçu le {dateCourte(fiche.formulaire.soumis_le)}
                </p>
                {Object.entries(fiche.formulaire.contenu).map(([q, a]) => (
                  <div className="qa" key={q}>
                    <div className="q">{q}</div>
                    <div className="a">{a}</div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
