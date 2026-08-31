import type { StatutEtape, StatutParcours } from "../types";

export const LIBELLE_ETAPE: Record<StatutEtape, string> = {
  realisee: "Réalisée",
  en_cours: "En cours",
  a_venir: "À venir",
  ignoree: "Non retenue",
};

const CLASSE_ETAPE: Record<StatutEtape, string> = {
  realisee: "done",
  en_cours: "now",
  a_venir: "todo",
  ignoree: "skip",
};

const PARCOURS: Record<StatutParcours, { label: string; classe: string }> = {
  en_cours: { label: "En cours", classe: "now" },
  termine: { label: "Terminé", classe: "done" },
  en_pause: { label: "En pause", classe: "todo" },
};

export function BadgeEtape({ statut }: { statut: StatutEtape }) {
  return <span className={`badge ${CLASSE_ETAPE[statut]}`}>{LIBELLE_ETAPE[statut]}</span>;
}

export function BadgeParcours({ statut }: { statut: StatutParcours }) {
  const s = PARCOURS[statut];
  return <span className={`badge ${s.classe}`}>{s.label}</span>;
}

export function Progression({ fait, total }: { fait: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((fait / total) * 100);
  return (
    <div className="progress">
      <div className="progress-bar">
        <i style={{ width: `${pct}%` }} />
      </div>
      <span>
        {fait}/{total}
      </span>
    </div>
  );
}

/** Date courte, ou tiret si absente. */
export function dateCourte(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Date avec l'heure, pour les séances planifiées. */
export function dateHeure(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const SPECIALITES: Record<string, string> = {
  medecin: "Médecin",
  kine: "Kinésithérapeute",
  osteopathe: "Ostéopathe",
  podologue: "Podologue",
  dieteticien: "Diététicien",
  coordinateur: "Coordinateur",
};
