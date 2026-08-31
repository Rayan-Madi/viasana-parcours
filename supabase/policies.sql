-- =====================================================================
-- Politiques de sécurité au niveau des lignes (RLS).
-- À exécuter après schema.sql et seed.sql.
--
-- ATTENTION, LECTURE IMPORTANTE
--
-- Ces politiques sont volontairement ouvertes : n'importe qui disposant
-- de la clé publique peut lire et écrire. C'est acceptable ici parce que
-- la base ne contient que des données inventées, et parce que l'objet du
-- prototype est le suivi des parcours, pas l'authentification.
--
-- En production, sur des données de santé, chaque politique serait
-- restreinte à l'utilisateur authentifié. Un exemple est donné en bas de
-- fichier, en commentaire.
--
-- Le choix a été de garder RLS activé plutôt que de le désactiver : une
-- base sans RLS est ouverte sans que rien ne le signale, alors qu'une
-- politique explicite se lit et se remplace.
-- =====================================================================

alter table praticien          enable row level security;
alter table patient            enable row level security;
alter table parcours_modele    enable row level security;
alter table etape_modele       enable row level security;
alter table parcours_patient   enable row level security;
alter table etape_patient      enable row level security;
alter table reponse_formulaire enable row level security;
alter table note_suivi         enable row level security;

-- ------------------------------------------------------------ lecture
create policy "demo lecture" on praticien          for select using (true);
create policy "demo lecture" on patient            for select using (true);
create policy "demo lecture" on parcours_modele    for select using (true);
create policy "demo lecture" on etape_modele       for select using (true);
create policy "demo lecture" on parcours_patient   for select using (true);
create policy "demo lecture" on etape_patient      for select using (true);
create policy "demo lecture" on reponse_formulaire for select using (true);
create policy "demo lecture" on note_suivi         for select using (true);

-- ------------------------------------------------------------ écriture
-- Seules les trois tables que l'application modifie.
create policy "demo maj etape" on etape_patient
  for update using (true) with check (true);

create policy "demo ajout note" on note_suivi
  for insert with check (true);

create policy "demo ajout formulaire" on reponse_formulaire
  for insert with check (true);
create policy "demo maj formulaire" on reponse_formulaire
  for update using (true) with check (true);

-- =====================================================================
-- Ce à quoi ressemblerait la version production, une fois
-- l'authentification en place et un identifiant Supabase associé à
-- chaque praticien et à chaque patient :
--
--   create policy "un patient ne lit que son dossier" on parcours_patient
--     for select using (
--       patient_id in (select id from patient where auth_user_id = auth.uid())
--     );
--
--   create policy "un praticien lit les parcours ou il intervient" on parcours_patient
--     for select using (
--       id in (
--         select ep.parcours_patient_id from etape_patient ep
--         join praticien p on p.id = ep.praticien_id
--         where p.auth_user_id = auth.uid()
--       )
--     );
--
-- Le filtrage serait alors appliqué par la base et non par l'interface,
-- donc impossible à contourner en ouvrant les outils de développement.
-- =====================================================================
