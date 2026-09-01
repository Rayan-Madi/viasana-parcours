-- Distingue une note interne d'une note destinee au patient.
--
-- Sans cette colonne, l'espace patient affichait toutes les notes, y compris
-- celles de coordination. Karim Dubois lisait ainsi, dans son propre espace,
-- « Patient injoignable depuis trois semaines ».
--
-- Le defaut est false : partager avec le patient doit etre un geste conscient.
alter table note_suivi
  add column if not exists visible_patient boolean not null default false;

update note_suivi set visible_patient = true
where contenu not like 'Patient injoignable%';
