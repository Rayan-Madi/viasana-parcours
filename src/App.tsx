import { useCallback, useEffect, useState } from "react";
import { repository } from "./data";
import type {
  Alerte, FichePatient, LignePatient, ParcoursModele, Praticien, StatutEtape,
} from "./types";
import { Connexion, type Session } from "./pages/Connexion";
import { ListePraticien } from "./pages/ListePraticien";
import { FicheParcours } from "./pages/FicheParcours";
import { EspacePatient } from "./pages/EspacePatient";
import { TableauCoordination } from "./pages/TableauCoordination";

type Vue = "liste" | "fiche";

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
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
  }, []);

  const rafraichirFiche = useCallback(async (id: string) => {
    setFiche(await repository.chargerFiche(id));
  }, []);

  useEffect(() => {
    rafraichirListe();
  }, [rafraichirListe]);

  useEffect(() => {
    if (selection) rafraichirFiche(selection);
  }, [selection, rafraichirFiche]);

  const connecter = (s: Session) => {
    setSession(s);
    setVue("liste");
    // Un patient n'a qu'un dossier : on l'ouvre directement.
    setSelection(s.type === "patient" ? s.parcoursId : null);
  };

  const deconnecter = () => {
    setSession(null);
    setSelection(null);
    setFiche(null);
    setVue("liste");
  };

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

  const coordinateur = session?.type === "praticien" && session.coordinateur;

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
          {session && (
            <div className="identite">
              <div>
                <div className="identite-nom">{session.nom}</div>
                <div className="identite-role">
                  {session.type === "patient"
                    ? "Espace patient"
                    : coordinateur
                      ? "Coordination"
                      : "Praticien"}
                </div>
              </div>
              <button className="role-btn" onClick={deconnecter}>
                Changer de profil
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="page">
        {chargement && <p className="empty">Chargement…</p>}

        {!chargement && !session && (
          <Connexion praticiens={praticiens} lignes={lignes} onConnexion={connecter} />
        )}

        {!chargement && session?.type === "praticien" && vue === "liste" && !coordinateur && (
          <ListePraticien
            lignes={lignes}
            modeles={modeles}
            onOuvrir={ouvrirFiche}
            praticienId={session.id}
          />
        )}

        {!chargement && coordinateur && vue === "liste" && (
          <TableauCoordination alertes={alertes} lignes={lignes} onOuvrir={ouvrirFiche} />
        )}

        {!chargement && session?.type === "praticien" && vue === "fiche" && fiche && (
          <FicheParcours
            fiche={fiche}
            praticiens={praticiens}
            onRetour={() => setVue("liste")}
            onChangerStatut={changerStatut}
            onAjouterNote={ajouterNote}
            // Assignation et planification réservées au coordinateur : c'est son
            // métier, et un praticien n'a pas la vision d'ensemble du planning.
            onAssignerPraticien={coordinateur ? assignerPraticien : undefined}
            onPlanifier={coordinateur ? planifier : undefined}
          />
        )}

        {!chargement && session?.type === "patient" && selection && (
          <EspacePatient
            lignes={lignes}
            parcoursId={selection}
            fiche={fiche}
            onChangerPatient={setSelection}
            onEnvoyerFormulaire={envoyerFormulaire}
            verrouille
          />
        )}
      </main>
    </>
  );
}
