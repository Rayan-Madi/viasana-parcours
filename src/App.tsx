import { useCallback, useEffect, useState } from "react";
import { repository } from "./data";
import type { FichePatient, LignePatient, ParcoursModele, Praticien, StatutEtape } from "./types";
import { ListePraticien } from "./pages/ListePraticien";
import { FicheParcours } from "./pages/FicheParcours";
import { EspacePatient } from "./pages/EspacePatient";

type Role = "praticien" | "patient";
type Vue = "liste" | "fiche";

export default function App() {
  const [role, setRole] = useState<Role>("praticien");
  const [vue, setVue] = useState<Vue>("liste");

  const [lignes, setLignes] = useState<LignePatient[]>([]);
  const [modeles, setModeles] = useState<ParcoursModele[]>([]);
  const [praticiens, setPraticiens] = useState<Praticien[]>([]);
  const [selection, setSelection] = useState<string | null>(null);
  const [fiche, setFiche] = useState<FichePatient | null>(null);
  const [chargement, setChargement] = useState(true);

  const rafraichirListe = useCallback(async () => {
    const [l, m, p] = await Promise.all([
      repository.listerPatients(),
      repository.listerParcoursModeles(),
      repository.listerPraticiens(),
    ]);
    setLignes(l);
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

  const changerStatut = async (etapeId: string, statut: StatutEtape) => {
    await repository.changerStatutEtape(etapeId, statut);
    if (selection) await rafraichirFiche(selection);
    await rafraichirListe();
  };

  const assignerPraticien = async (etapeId: string, praticienId: string | null) => {
    await repository.assignerPraticien(etapeId, praticienId);
    if (selection) await rafraichirFiche(selection);
  };

  const planifier = async (etapeId: string, datePrevue: string | null) => {
    await repository.planifierEtape(etapeId, datePrevue);
    if (selection) await rafraichirFiche(selection);
    await rafraichirListe();
  };

  const ajouterNote = async (contenu: string, praticienId: string | null) => {
    if (!selection) return;
    await repository.ajouterNote({
      parcoursPatientId: selection,
      etapePatientId: null,
      praticienId,
      contenu,
    });
    await rafraichirFiche(selection);
  };

  const envoyerFormulaire = async (patientId: string, contenu: Record<string, string>) => {
    await repository.enregistrerFormulaire(patientId, contenu);
    if (selection) await rafraichirFiche(selection);
    await rafraichirListe();
  };

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
          <button
            className="role-btn"
            aria-pressed={role === "praticien"}
            onClick={() => {
              setRole("praticien");
              setVue("liste");
            }}
          >
            Praticien
          </button>
          <button className="role-btn" aria-pressed={role === "patient"} onClick={() => setRole("patient")}>
            Patient
          </button>
        </div>
      </header>

      <main className="page">
        {chargement && <p className="empty">Chargement…</p>}

        {!chargement && role === "praticien" && vue === "liste" && (
          <ListePraticien lignes={lignes} modeles={modeles} onOuvrir={ouvrirFiche} />
        )}

        {!chargement && role === "praticien" && vue === "fiche" && fiche && (
          <FicheParcours
            fiche={fiche}
            praticiens={praticiens}
            onRetour={() => setVue("liste")}
            onChangerStatut={changerStatut}
            onAjouterNote={ajouterNote}
            onAssignerPraticien={assignerPraticien}
            onPlanifier={planifier}
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
