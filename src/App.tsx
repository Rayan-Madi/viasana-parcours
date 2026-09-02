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
type OngletCoordination = "alertes" | "patients";

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [vue, setVue] = useState<Vue>("liste");
  const [onglet, setOnglet] = useState<OngletCoordination>("alertes");

  const [lignes, setLignes] = useState<LignePatient[]>([]);
  const [alertes, setAlertes] = useState<Alerte[]>([]);
  const [modeles, setModeles] = useState<ParcoursModele[]>([]);
  const [praticiens, setPraticiens] = useState<Praticien[]>([]);
  const [selection, setSelection] = useState<string | null>(null);
  const [fiche, setFiche] = useState<FichePatient | null>(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  const rafraichirListe = useCallback(async () => {
    try {
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
      setErreur(null);
    } catch (e) {
      // Sans ce garde-fou, une base injoignable donnerait une page blanche
      // sans aucune indication de ce qui s'est passé.
      setErreur(e instanceof Error ? e.message : "Impossible de charger les données.");
    } finally {
      setChargement(false);
    }
  }, []);

  const estPatient = session?.type === "patient";

  const rafraichirFiche = useCallback(async (id: string) => {
    try {
      setFiche(await repository.chargerFiche(id, estPatient));
      setErreur(null);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Impossible de charger ce dossier.");
    }
  }, [estPatient]);

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

  const ajouterNote = async (
    contenu: string,
    etapePatientId: string | null,
    visiblePatient: boolean,
  ) => {
    // L'auteur vient de la session, jamais du formulaire : une note engage celui
    // qui la signe, et un praticien ne doit pas pouvoir écrire au nom d'un autre.
    if (!selection || session?.type !== "praticien") return;
    await repository.ajouterNote({
      parcoursPatientId: selection,
      etapePatientId,
      praticienId: session.id,
      contenu,
      visiblePatient,
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
        {erreur && (
          <div className="erreur" role="alert">
            <strong>Les données n&apos;ont pas pu être chargées.</strong>
            <div>{erreur}</div>
            <button className="link-btn" onClick={() => rafraichirListe()}>
              Réessayer
            </button>
          </div>
        )}

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
          <>
            <div className="perimetre">
              <button
                className="role-btn"
                aria-pressed={onglet === "alertes"}
                onClick={() => setOnglet("alertes")}
              >
                Points à traiter ({alertes.length})
              </button>
              <button
                className="role-btn"
                aria-pressed={onglet === "patients"}
                onClick={() => setOnglet("patients")}
              >
                Tous les patients ({lignes.length})
              </button>
            </div>

            {onglet === "alertes" ? (
              <TableauCoordination alertes={alertes} lignes={lignes} onOuvrir={ouvrirFiche} />
            ) : (
              <ListePraticien lignes={lignes} modeles={modeles} onOuvrir={ouvrirFiche} />
            )}
          </>
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
