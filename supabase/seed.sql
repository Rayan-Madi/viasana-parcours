-- =====================================================================
-- Jeu de démonstration, à exécuter après schema.sql.
--
-- Reproduit exactement l'état du jeu en mémoire (src/data/seed.ts) :
-- six patients répartis sur des étapes différentes, dont un parcours
-- terminé, un en pause et deux sans questionnaire. Les filtres et les
-- alertes ont ainsi quelque chose à montrer.
--
-- Les dates sont relatives à l'exécution, pour que la démonstration ne
-- vieillisse pas.
-- =====================================================================

truncate note_suivi, reponse_formulaire, etape_patient, parcours_patient,
         patient, praticien restart identity cascade;

-- ------------------------------------------------------------ équipe
insert into praticien (id, nom, specialite, email) values
  ('a0000000-0000-4000-8000-000000000001', 'Camille Renaud',    'kine',         'c.renaud@viasana.fr'),
  ('a0000000-0000-4000-8000-000000000002', 'Dr Samir Ben Ali',  'medecin',      's.benali@viasana.fr'),
  ('a0000000-0000-4000-8000-000000000003', 'Léa Fontaine',      'osteopathe',   'l.fontaine@viasana.fr'),
  ('a0000000-0000-4000-8000-000000000004', 'Marc Delaunay',     'dieteticien',  'm.delaunay@viasana.fr'),
  ('a0000000-0000-4000-8000-000000000005', 'Nadia Kessler',     'coordinateur', 'n.kessler@viasana.fr');

-- --------------------------------------------- second parcours type
insert into parcours_modele (id, nom, description) values
  ('11111111-1111-1111-1111-111111111112',
   'Retour à la course après blessure',
   'Reprise progressive encadrée après une blessure, avec réévaluation régulière.');

insert into etape_modele (parcours_modele_id, ordre, libelle, description, specialite_requise, obligatoire) values
  ('11111111-1111-1111-1111-111111111112', 1, 'Questionnaire initial',
   'Nature de la blessure, durée d''arrêt, douleurs résiduelles.', null, true),
  ('11111111-1111-1111-1111-111111111112', 2, 'Consultation médicale',
   'Validation médicale de la reprise.', 'medecin', true),
  ('11111111-1111-1111-1111-111111111112', 3, 'Protocole de reprise',
   'Plan de reprise progressif établi avec le kiné.', 'kine', true);

-- ---------------------------------------------------------- patients
insert into patient (id, nom, prenom, email, objectif, date_objectif) values
  ('b0000000-0000-4000-8000-000000000001', 'Moreau',   'Julie',  'julie.moreau@example.com',   'Marathon de Paris, viser 3h45',                    '2027-04-11'),
  ('b0000000-0000-4000-8000-000000000002', 'Ferrand',  'Thomas', 'thomas.ferrand@example.com', 'Premier marathon, terminer sans blessure',         '2027-04-11'),
  ('b0000000-0000-4000-8000-000000000003', 'Nguyen',   'Linh',   'linh.nguyen@example.com',    'Marathon de Berlin, battre 3h20',                  '2027-09-26'),
  ('b0000000-0000-4000-8000-000000000004', 'Bertrand', 'Paul',   'paul.bertrand@example.com',  'Reprendre la course après une fracture de fatigue', null),
  ('b0000000-0000-4000-8000-000000000005', 'Silva',    'Ana',    'ana.silva@example.com',      'Marathon de Nice, finir sous 4h',                  '2026-11-08'),
  ('b0000000-0000-4000-8000-000000000006', 'Dubois',   'Karim',  'karim.dubois@example.com',   'Marathon de Paris, première participation',        '2027-04-11');

-- ------------------------------------------------------- inscriptions
insert into parcours_patient (id, patient_id, parcours_modele_id, statut, date_debut) values
  ('c0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', '11111111-1111-1111-1111-111111111111', 'en_cours', current_date - 60),
  ('c0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000002', '11111111-1111-1111-1111-111111111111', 'en_cours', current_date - 13),
  ('c0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000003', '11111111-1111-1111-1111-111111111111', 'en_cours', current_date - 77),
  ('c0000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000004', '11111111-1111-1111-1111-111111111112', 'en_cours', current_date - 26),
  ('c0000000-0000-4000-8000-000000000005', 'b0000000-0000-4000-8000-000000000005', '11111111-1111-1111-1111-111111111111', 'termine',  current_date - 174),
  ('c0000000-0000-4000-8000-000000000006', 'b0000000-0000-4000-8000-000000000006', '11111111-1111-1111-1111-111111111111', 'en_pause', current_date - 42);

-- ---------------------------------------------------------- étapes
-- Chaque parcours reçoit une instance par étape de son modèle, à venir
-- par défaut. Les cas particuliers sont ajustés juste après.
insert into etape_patient (parcours_patient_id, etape_modele_id)
select pp.id, em.id
from parcours_patient pp
join etape_modele em on em.parcours_modele_id = pp.parcours_modele_id;

-- Julie : bilan fait, plan d'action en cours
update etape_patient e set statut = 'realisee', date_realisee = now() - interval '40 days'
  from etape_modele m where e.etape_modele_id = m.id
  and e.parcours_patient_id = 'c0000000-0000-4000-8000-000000000001' and m.ordre = 1;
update etape_patient e set statut = 'realisee', date_realisee = now() - interval '32 days',
       date_prevue = now() - interval '32 days', praticien_id = 'a0000000-0000-4000-8000-000000000001'
  from etape_modele m where e.etape_modele_id = m.id
  and e.parcours_patient_id = 'c0000000-0000-4000-8000-000000000001' and m.ordre = 2;
update etape_patient e set statut = 'en_cours', date_prevue = now() + interval '3 days',
       praticien_id = 'a0000000-0000-4000-8000-000000000001'
  from etape_modele m where e.etape_modele_id = m.id
  and e.parcours_patient_id = 'c0000000-0000-4000-8000-000000000001' and m.ordre = 3;
update etape_patient e set date_prevue = now() + interval '12 days',
       praticien_id = 'a0000000-0000-4000-8000-000000000001'
  from etape_modele m where e.etape_modele_id = m.id
  and e.parcours_patient_id = 'c0000000-0000-4000-8000-000000000001' and m.ordre = 4;
update etape_patient e set praticien_id = 'a0000000-0000-4000-8000-000000000005'
  from etape_modele m where e.etape_modele_id = m.id
  and e.parcours_patient_id = 'c0000000-0000-4000-8000-000000000001' and m.ordre = 5;

-- Thomas : questionnaire tout juste reçu, bilan planifié
update etape_patient e set statut = 'realisee', date_realisee = now() - interval '4 days'
  from etape_modele m where e.etape_modele_id = m.id
  and e.parcours_patient_id = 'c0000000-0000-4000-8000-000000000002' and m.ordre = 1;
update etape_patient e set statut = 'en_cours', date_prevue = now() + interval '6 days',
       praticien_id = 'a0000000-0000-4000-8000-000000000001'
  from etape_modele m where e.etape_modele_id = m.id
  and e.parcours_patient_id = 'c0000000-0000-4000-8000-000000000002' and m.ordre = 2;

-- Linh : parcours avancé, suivi coordonné en cours
update etape_patient e set statut = 'realisee', date_realisee = now() - interval '70 days'
  from etape_modele m where e.etape_modele_id = m.id
  and e.parcours_patient_id = 'c0000000-0000-4000-8000-000000000003' and m.ordre = 1;
update etape_patient e set statut = 'realisee', date_realisee = now() - interval '62 days',
       praticien_id = 'a0000000-0000-4000-8000-000000000001'
  from etape_modele m where e.etape_modele_id = m.id
  and e.parcours_patient_id = 'c0000000-0000-4000-8000-000000000003' and m.ordre = 2;
update etape_patient e set statut = 'realisee', date_realisee = now() - interval '55 days',
       praticien_id = 'a0000000-0000-4000-8000-000000000001'
  from etape_modele m where e.etape_modele_id = m.id
  and e.parcours_patient_id = 'c0000000-0000-4000-8000-000000000003' and m.ordre = 3;
update etape_patient e set statut = 'realisee', date_realisee = now() - interval '30 days',
       praticien_id = 'a0000000-0000-4000-8000-000000000001'
  from etape_modele m where e.etape_modele_id = m.id
  and e.parcours_patient_id = 'c0000000-0000-4000-8000-000000000003' and m.ordre = 4;
update etape_patient e set statut = 'en_cours', date_prevue = now() + interval '9 days',
       praticien_id = 'a0000000-0000-4000-8000-000000000005'
  from etape_modele m where e.etape_modele_id = m.id
  and e.parcours_patient_id = 'c0000000-0000-4000-8000-000000000003' and m.ordre = 5;

-- Paul : questionnaire jamais reçu, consultation médicale planifiée
update etape_patient e set statut = 'en_cours'
  from etape_modele m where e.etape_modele_id = m.id
  and e.parcours_patient_id = 'c0000000-0000-4000-8000-000000000004' and m.ordre = 1;
update etape_patient e set date_prevue = now() + interval '15 days',
       praticien_id = 'a0000000-0000-4000-8000-000000000002'
  from etape_modele m where e.etape_modele_id = m.id
  and e.parcours_patient_id = 'c0000000-0000-4000-8000-000000000004' and m.ordre = 2;
update etape_patient e set praticien_id = 'a0000000-0000-4000-8000-000000000001'
  from etape_modele m where e.etape_modele_id = m.id
  and e.parcours_patient_id = 'c0000000-0000-4000-8000-000000000004' and m.ordre = 3;

-- Ana : parcours terminé, analyse de foulée non retenue
update etape_patient e set statut = 'realisee', date_realisee = now() - interval '160 days'
  from etape_modele m where e.etape_modele_id = m.id
  and e.parcours_patient_id = 'c0000000-0000-4000-8000-000000000005' and m.ordre in (1);
update etape_patient e set statut = 'realisee', date_realisee = now() - interval '150 days',
       praticien_id = 'a0000000-0000-4000-8000-000000000001'
  from etape_modele m where e.etape_modele_id = m.id
  and e.parcours_patient_id = 'c0000000-0000-4000-8000-000000000005' and m.ordre = 2;
update etape_patient e set statut = 'realisee', date_realisee = now() - interval '142 days',
       praticien_id = 'a0000000-0000-4000-8000-000000000001'
  from etape_modele m where e.etape_modele_id = m.id
  and e.parcours_patient_id = 'c0000000-0000-4000-8000-000000000005' and m.ordre = 3;
update etape_patient e set statut = 'ignoree'
  from etape_modele m where e.etape_modele_id = m.id
  and e.parcours_patient_id = 'c0000000-0000-4000-8000-000000000005' and m.ordre = 4;
update etape_patient e set statut = 'realisee', date_realisee = now() - interval '20 days',
       praticien_id = 'a0000000-0000-4000-8000-000000000005'
  from etape_modele m where e.etape_modele_id = m.id
  and e.parcours_patient_id = 'c0000000-0000-4000-8000-000000000005' and m.ordre = 5;

-- Karim : rien n'a démarré, aucun praticien assigné
update etape_patient e set statut = 'en_cours'
  from etape_modele m where e.etape_modele_id = m.id
  and e.parcours_patient_id = 'c0000000-0000-4000-8000-000000000006' and m.ordre = 1;

-- ----------------------------------------------------- questionnaires
insert into reponse_formulaire (patient_id, soumis_le, contenu) values
  ('b0000000-0000-4000-8000-000000000001', now() - interval '40 days', '{
     "Depuis combien de temps courez-vous ?": "6 ans",
     "Volume hebdomadaire actuel": "45 km sur 4 sorties",
     "Objectif": "Marathon de Paris en moins de 3h45",
     "Douleurs ou gênes actuelles": "Tension au tendon d''Achille droit après les sorties longues",
     "Blessures dans les 12 derniers mois": "Aponévrosite plantaire, résolue en janvier",
     "Chaussures utilisées": "Drop 8 mm, changées il y a 400 km"}'::jsonb),
  ('b0000000-0000-4000-8000-000000000002', now() - interval '4 days', '{
     "Depuis combien de temps courez-vous ?": "14 mois",
     "Volume hebdomadaire actuel": "25 km sur 3 sorties",
     "Objectif": "Terminer mon premier marathon sans blessure",
     "Douleurs ou gênes actuelles": "Genou gauche sensible en descente",
     "Blessures dans les 12 derniers mois": "Aucune",
     "Chaussures utilisées": "Un seul modèle depuis le début"}'::jsonb),
  ('b0000000-0000-4000-8000-000000000003', now() - interval '70 days', '{
     "Depuis combien de temps courez-vous ?": "11 ans",
     "Volume hebdomadaire actuel": "70 km sur 5 sorties, dont du fractionné",
     "Objectif": "Berlin sous 3h20",
     "Douleurs ou gênes actuelles": "Aucune",
     "Blessures dans les 12 derniers mois": "Périostite en mars, résolue",
     "Chaussures utilisées": "Deux paires en alternance"}'::jsonb),
  ('b0000000-0000-4000-8000-000000000005', now() - interval '160 days', '{
     "Depuis combien de temps courez-vous ?": "3 ans",
     "Volume hebdomadaire actuel": "30 km",
     "Objectif": "Nice sous 4h",
     "Douleurs ou gênes actuelles": "Aucune",
     "Blessures dans les 12 derniers mois": "Aucune",
     "Chaussures utilisées": "Drop 10 mm"}'::jsonb);

-- ------------------------------------------------------------- notes
insert into note_suivi (parcours_patient_id, praticien_id, contenu, cree_le, visible_patient) values
  ('c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001',
   'Bilan réalisé. Déséquilibre marqué côté droit, appui pronateur. Charge à réduire de 20 % pendant trois semaines avant reprise progressive.',
   now() - interval '32 days', true),
  ('c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000003',
   'Séance ostéo réalisée hors parcours à la demande de la patiente. Mobilité cheville droite améliorée, à revoir dans un mois.',
   now() - interval '14 days', true),
  ('c0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001',
   'Analyse de foulée : cadence 168 pas par minute, attaque talon marquée. Travail de cadence proposé, cible 175.',
   now() - interval '30 days', true),
  ('c0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000004',
   'Point diététique : apports glucidiques insuffisants sur les sorties longues. Plan de ravitaillement transmis.',
   now() - interval '8 days', true),
  ('c0000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000005',
   'Patient injoignable depuis trois semaines. Parcours mis en pause, relance prévue début du mois prochain.',
   now() - interval '21 days', false);

-- Rattache les notes qui concernent une etape precise, pour refleter le
-- jeu en memoire : une observation de bilan appartient au bilan, pas au
-- parcours entier.
update note_suivi n set etape_patient_id = ep.id
from etape_patient ep
join etape_modele m on m.id = ep.etape_modele_id
where ep.parcours_patient_id = n.parcours_patient_id
  and n.parcours_patient_id = 'c0000000-0000-4000-8000-000000000001'
  and m.ordre = 2
  and n.contenu like 'Bilan réalisé%';

update note_suivi n set etape_patient_id = ep.id
from etape_patient ep
join etape_modele m on m.id = ep.etape_modele_id
where ep.parcours_patient_id = n.parcours_patient_id
  and n.parcours_patient_id = 'c0000000-0000-4000-8000-000000000003'
  and m.ordre = 4
  and n.contenu like 'Analyse de foulée%';
