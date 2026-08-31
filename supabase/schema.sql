-- =====================================================================
-- Via Sana - suivi des parcours de soins coordonnes
-- A coller dans l'editeur SQL d'un projet Supabase.
--
-- Choix de modelisation :
--   Un parcours est decrit une seule fois (parcours_modele + etape_modele),
--   puis instancie pour chaque patient (parcours_patient + etape_patient).
--   Ajouter un nouveau parcours est une insertion de donnees, pas une
--   modification de schema ni de code.
-- =====================================================================

drop table if exists note_suivi cascade;
drop table if exists etape_patient cascade;
drop table if exists parcours_patient cascade;
drop table if exists reponse_formulaire cascade;
drop table if exists etape_modele cascade;
drop table if exists parcours_modele cascade;
drop table if exists patient cascade;
drop table if exists praticien cascade;

-- ---------------------------------------------------------------- refs
create table praticien (
  id          uuid primary key default gen_random_uuid(),
  nom         text not null,
  specialite  text not null check (specialite in
                ('medecin','kine','osteopathe','podologue','dieteticien','coordinateur')),
  email       text unique
);

create table patient (
  id            uuid primary key default gen_random_uuid(),
  nom           text not null,
  prenom        text not null,
  email         text unique not null,
  objectif      text,
  date_objectif date,
  cree_le       timestamptz not null default now()
);

-- ------------------------------------------------------------ modeles
create table parcours_modele (
  id          uuid primary key default gen_random_uuid(),
  nom         text not null unique,
  description text
);

create table etape_modele (
  id                 uuid primary key default gen_random_uuid(),
  parcours_modele_id uuid not null references parcours_modele(id) on delete cascade,
  ordre              int  not null,
  libelle            text not null,
  description        text,
  specialite_requise text,
  obligatoire        boolean not null default true,
  unique (parcours_modele_id, ordre)
);

-- ---------------------------------------------------------- instances
create table parcours_patient (
  id                 uuid primary key default gen_random_uuid(),
  patient_id         uuid not null references patient(id) on delete cascade,
  parcours_modele_id uuid not null references parcours_modele(id),
  statut             text not null default 'en_cours'
                     check (statut in ('en_cours','termine','en_pause')),
  date_debut         date not null default current_date,
  unique (patient_id, parcours_modele_id)
);

create table etape_patient (
  id                  uuid primary key default gen_random_uuid(),
  parcours_patient_id uuid not null references parcours_patient(id) on delete cascade,
  etape_modele_id     uuid not null references etape_modele(id),
  statut              text not null default 'a_venir'
                      check (statut in ('a_venir','en_cours','realisee','ignoree')),
  date_prevue         timestamptz,
  date_realisee       timestamptz,
  praticien_id        uuid references praticien(id),
  unique (parcours_patient_id, etape_modele_id)
);

-- Le questionnaire evolue souvent : on le stocke tel quel plutot que
-- d'ajouter une colonne par question.
create table reponse_formulaire (
  id         uuid primary key default gen_random_uuid(),
  -- Un seul questionnaire par patient : l'unicite permet a l'application
  -- de faire un upsert plutot que de gerer creation et mise a jour.
  patient_id uuid not null unique references patient(id) on delete cascade,
  contenu    jsonb not null,
  soumis_le  timestamptz not null default now()
);

create table note_suivi (
  id                  uuid primary key default gen_random_uuid(),
  parcours_patient_id uuid not null references parcours_patient(id) on delete cascade,
  etape_patient_id    uuid references etape_patient(id) on delete set null,
  praticien_id        uuid references praticien(id),
  contenu             text not null,
  cree_le             timestamptz not null default now()
);

create index on etape_patient (parcours_patient_id);
create index on note_suivi (parcours_patient_id);
create index on reponse_formulaire (patient_id);

-- =====================================================================
-- Jeu de demonstration : le parcours Prepa Marathon tel qu'il existe
-- =====================================================================
insert into parcours_modele (id, nom, description) values
  ('11111111-1111-1111-1111-111111111111',
   'Prepa Marathon',
   'Parcours coordonne de preparation a un marathon, du questionnaire initial au suivi pluridisciplinaire.');

insert into etape_modele (parcours_modele_id, ordre, libelle, description, specialite_requise, obligatoire) values
  ('11111111-1111-1111-1111-111111111111', 1, 'Questionnaire initial',
   'Formulaire en ligne, 5 minutes. Historique de course, objectif, douleurs. Lu par le kine avant le bilan.', null, true),
  ('11111111-1111-1111-1111-111111111111', 2, 'Bilan clinique',
   'Consultation de 30 minutes avec un kine du sport. Antecedents, volume, objectif, douleurs, appuis, desequilibres.', 'kine', true),
  ('11111111-1111-1111-1111-111111111111', 3, 'Plan d''action personnalise',
   'Remise des observations et des recommandations concretes.', 'kine', true),
  ('11111111-1111-1111-1111-111111111111', 4, 'Analyse de foulee sur tapis',
   'Analyse video de la course en conditions controlees.', 'kine', false),
  ('11111111-1111-1111-1111-111111111111', 5, 'Suivi coordonne 6 mois',
   'Acces au reseau pluridisciplinaire, rendez-vous coordonnes et partage documentaire.', 'coordinateur', false);
