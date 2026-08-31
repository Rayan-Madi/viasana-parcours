import { useCallback, useEffect, useState } from "react";
import { repository } from "./data";
import type {
  Alerte, FichePatient, LignePatient, ParcoursModele, Praticien, StatutEtape,
} from "./types";
import { ListePraticien } from "./pages/ListePraticien";
import { FicheParcours } from "./pages/FicheParcours";
import { EspacePatient } from "./pages/EspacePatient";
import { TableauCoordination } from "./pages/TableauCoordination";

/**
 * Trois rôles, trois questions différentes.
 * Le praticien demande où en est son patient, le coordinateur demande qui
 * débloquer aujourd'hui, le patient demande où il en est.
 */
type Role = "praticien" | "coordinateur" | "patient";
type Vue = "liste" | "fiche";

const ROLES: Array<{ cle: Role; libelle: string }> = [
  { cle: "praticien", libelle: "Praticien" },
  { cle: "coordinateur", libelle: "Coordinateur" },
  { cle: "patient", libelle: "Patient" },
];

export default function App() {
  const [role, setRole] = useState<Role>("praticien");
  const [vue, setVue] = useState<Vue>("liste");

  const [lignes, setLignes] = useState<LignePatient[]>([]);
  const [alertes, setAlertes] = useState<Alerte[]>([]);
  const [modeles, setModeles] = useState<ParcoursModele[]>([]);
  const [praticiens, setPraticiens] = useState<Praticien[]>([]);
  const [selection, setSelection] = useState<string | null>(null);
  const [fiche, setFiche] = useState<FichePatient | null>(null);
  const [chargement, setChargement] = useState(true);

  const rafraichirListe = useCallback(async () => {
    const [l, a, m, p] = await Promise.all([
      repository.listerPatients(),
      repository.listerAlertes(),
      repository.listerParcoursModeles(),
      repository.listerPraticiens(),
    ]);
    setLignes(l);
    setAlertes(a);
    setModeles(m);
    setPraticiens(p);
    setChargement(false);
    return l;
  }, []);

  const rafraichirFiche = useCallback(async (id: string) => {
    setFiche(await repository.chargerFiche(id));
  }, []);

  useEffect(() => {
    rafraichirListe().then((l) => {
      if (l.length > 0) setSelection((s) => s ?? l[0].parcours.id);
    });
  }, [rafraichirListe]);

  useEffect(() => {
    if (selection) rafraichirFiche(selection);
  }, [selection, rafraichirFiche]);

  const ouvrirFiche = (id: string) => {
    setSelection(id);
    setVue("fiche");
  };

  const rafraichirTout = async () => {
    if (selection) await rafraichirFiche(selection);
    await rafraichirListe();
  };

  const changerStatut = async (etapeId: string, statut: StatutEtape) => {
    await repository.changerStatutEtape(etapeId, statut);
    await rafraichirTout();
  };

  const assignerPraticien = async (etapeId: string, praticienId: string | null) => {
    await repository.assignerPraticien(etapeId, praticienId);
    await rafraichirTout();
  };

  const planifier = async (etapeId: string, datePrevue: string | null) => {
    await repository.planifierEtape(etapeId, datePrevue);
    await rafraichirTout();
  };

  const ajouterNote = async (contenu: string, praticienId: string | null) => {
    if (!selection) return;
    await repository.ajouterNote({
      parcoursPatientId: selection,
      etapePatientId: null,
      praticienId,
      contenu,
    });
    await rafraichirTout();
  };

  const envoyerFormulaire = async (patientId: string, contenu: Record<string, string>) => {
    await repository.enregistrerFormulaire(patientId, contenu);
    await rafraichirTout();
  };

  const estCoordinateur = role === "coordinateur";

  return (
    <>
      <header className="topbar">
        <div className="brand">
          Via Sana <span>Suivi des parcours</span>
        </div>
        <div className="roles">
          <span className="source-tag">
            {repository.source === "demo" ? "données de démonstration" : "Supabase"}
          </span>
          {ROLES.map((r) => (
            <button
              key={r.cle}
              className="role-btn"
              aria-pressed={role === r.cle}
              onClick={() => {
                setRole(r.cle);
                setVue("liste");
              }}
            >
              {r.libelle}
            </button>
          ))}
        </div>
      </header>

      <main className="page">
        {chargement && <p className="empty">Chargement…</p>}

        {!chargement && role === "praticien" && vue === "liste" && (
          <ListePraticien lignes={lignes} modeles={modeles} onOuvrir={ouvrirFiche} />
        )}

        {!chargement && estCoordinateur && vue === "liste" && (
          <TableauCoordination alertes={alertes} lignes={lignes} onOuvrir={ouvrirFiche} />
        )}

        {!chargement && role !== "patient" && vue === "fiche" && fiche && (
          <FicheParcours
            fiche={fiche}
            praticiens={praticiens}
            onRetour={() => setVue("liste")}
            onChangerStatut={changerStatut}
            onAjouterNote={ajouterNote}
            // L'assignation et la planification sont réservées au coordinateur :
            // c'est son métier, et le praticien n'a pas la vision d'ensemble.
            onAssignerPraticien={estCoordinateur ? assignerPraticien : undefined}
            onPlanifier={estCoordinateur ? planifier : undefined}
          />
        )}

        {!chargement && role === "patient" && selection && (
          <EspacePatient
            lignes={lignes}
            parcoursId={selection}
            fiche={fiche}
            onChangerPatient={setSelection}
            onEnvoyerFormulaire={envoyerFormulaire}
          />
        )}
      </main>
    </>
  );
}
