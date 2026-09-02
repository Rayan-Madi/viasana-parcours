# Décisions

Une section par choix structurant : le problème posé, ce que j'ai décidé, ce que ça coûte,
et ce que j'aurais fait autrement avec plus de temps.

---

## 1. Un parcours est décrit une fois, puis instancié

**Problème.** Via Sana ne vend pas un parcours mais plusieurs, et doit en suivre beaucoup en
parallèle. Coder les cinq étapes de Prépa Marathon en dur aurait fonctionné pour la
démonstration et bloqué tout le reste.

**Choix.** Séparer `parcours_modele` et `etape_modele`, qui décrivent un parcours type, de
`parcours_patient` et `etape_patient`, qui sont son application à une personne. Les étapes
deviennent des données.

**Ce que ça coûte.** Deux tables de plus, une jointure supplémentaire partout, et un modèle
un peu plus abstrait à lire pour quelqu'un qui découvre le code.

**La preuve que ça marche.** Le second parcours, « Retour à la course après blessure », a été
ajouté par une insertion SQL. Aucune migration, aucun composant modifié.

---

## 2. Le questionnaire préalable est stocké en `jsonb`

**Problème.** Le formulaire compte six questions aujourd'hui et changera. Une colonne par
question imposerait une migration à chaque modification.

**Choix.** Une colonne `jsonb` contenant les paires question et réponse.

**Ce que ça coûte.** On perd le typage fort et la possibilité de contraindre une réponse au
niveau de la base. Acceptable pour des réponses en texte libre, discutable le jour où on
voudra filtrer les patients sur un critère précis du questionnaire.

**Autrement.** Une table `reponse` avec une ligne par question, plus souple pour requêter,
plus lourde à écrire et à lire.

---

## 3. Une note peut viser une étape ou le parcours entier

**Problème.** Un ostéopathe qui voit le patient hors parcours doit pouvoir laisser une trace.
Sans cela, l'information repart dans WhatsApp, c'est-à-dire exactement le problème à résoudre.

**Choix.** `etape_patient_id` est facultatif sur une note. Le praticien choisit le
rattachement au moment de l'écrire.

---

## 4. Une note est interne par défaut

**Problème.** Toutes les notes ne se destinent pas au patient. En regardant l'espace de Karim
Dubois, j'ai constaté qu'il lisait une note de coordination le concernant : « patient
injoignable depuis trois semaines ».

**Choix.** Un indicateur `visible_patient`, faux par défaut. Communiquer au patient devient un
geste conscient, et le défaut sûr est de ne pas partager.

**Où vit la règle.** Dans `chargerFiche`, pas dans le composant, pour qu'un écran ne puisse pas
l'oublier. En production, ce serait une politique de sécurité au niveau des lignes.

---

## 5. Toute la donnée passe par une seule interface

**Problème.** Faire dépendre la démonstration d'un compte Supabase la rend fragile, et coder
directement contre Supabase interdit de tester sans réseau.

**Choix.** Une interface `Repository`, deux implémentations : un jeu en mémoire et Supabase.
Un seul fichier décide laquelle utiliser, selon la présence des variables d'environnement.

**Bénéfice observé.** L'application se lance sans compte ni configuration, et l'en-tête
indique en permanence la source réellement utilisée.

**Ce que ça coûte.** Une logique de jointure dupliquée entre les deux implémentations. Les
règles de détection des alertes, elles, sont partagées via une fonction pure.

---

## 6. Le coordinateur est un rôle à part entière

**Problème.** L'assignation d'un praticien était accessible à tous, ce qui ne correspond ni à
l'offre Via Sana ni à la réalité.

**Choix.** Trois rôles, parce que trois personnes se posent trois questions différentes. Le
praticien demande où en est son patient, le coordinateur demande qui débloquer aujourd'hui,
le patient demande où il en est. L'assignation et la planification sont réservées au
coordinateur.

**Pourquoi ce rôle existe.** Leur propre offre décrit « un coordinateur qui gère les
rendez-vous et s'assure que les praticiens partagent les documents ».

---

## 7. Le praticien voit ses patients, sans être enfermé

**Problème.** Un praticien noyé dans les patients des autres ne trouve pas les siens. Mais un
cloisonnement strict reproduirait le problème de départ : dans un parcours coordonné, savoir
ce que les collègues ont fait est l'objet même de l'outil.

**Choix.** Sa file par défaut, avec une bascule vers l'ensemble. Le défaut guide sans
interdire.

---

## 8. Une identification, pas une authentification

**Problème.** Une vraie authentification représente une journée de travail, et obligerait le
relecteur à se connecter pour voir la démonstration.

**Choix.** Un écran qui demande qui vous êtes, sans mot de passe, assumé comme tel.

**La limite, dite franchement.** Le filtrage est appliqué par l'interface, donc contournable
en ouvrant les outils de développement. En production, Supabase Auth et des politiques au
niveau des lignes, pour que la base fasse respecter la règle.

---

## 9. RLS activé avec des politiques ouvertes plutôt que désactivé

**Problème.** Supabase active la sécurité au niveau des lignes par défaut. Sans politique, les
tables répondent 200 avec un tableau vide, sans aucune erreur. Symptôme déroutant, rencontré
en branchant la base.

**Choix.** Écrire des politiques explicites et permissives, plutôt que de désactiver RLS.

**Pourquoi.** Une base sans RLS est ouverte sans que rien ne le signale. Une politique se lit
dans le dépôt et se remplace le jour où l'authentification arrive. `policies.sql` contient en
commentaire les politiques de production, restreintes à l'utilisateur authentifié.

---

## 10. Des tests sur une seule chose

**Problème.** Tout tester en trois jours n'a pas de sens. Ne rien tester non plus.

**Choix.** Douze tests sur `calculerAlertes`, chaque règle avec son cas négatif.

**Pourquoi celle-là.** C'est la seule logique dont une erreur passerait inaperçue : une alerte
qui ne se déclenche pas, personne ne la voit. Un bug d'affichage, si.

---

## 11. Ce que je n'ai pas fait, et pourquoi

**La prise de rendez-vous.** Les dates sont saisissables, mais il n'y a pas d'agenda. C'est un
chantier à part entière, généralement connecté à l'existant des praticiens.

**Les notifications**, au patient comme aux praticiens.

**Le routage.** Deux vues et un détail se pilotent avec un état local. Un routeur serait la
première chose à ajouter pour pouvoir partager l'URL d'une fiche.

**L'historique des modifications.** Indispensable en santé pour savoir qui a changé quoi, hors
de portée en trois jours.

**De la 3D ou des effets visuels.** Un kiné ouvre cet outil entre deux patients. Tout ce qui
n'aide pas à lire l'information lui coûte du temps.

---

## 12. Deux limites techniques connues

**Une trentaine de requêtes à l'ouverture.** L'implémentation Supabase charge chaque table
séparément puis joint en JavaScript. Ça tient à six patients, pas à mille. La correction est
connue : demander les ressources imbriquées à PostgREST en une fois, par exemple
`select=*,etape_patient(*,etape_modele(*))`, ou exposer une vue côté base.

**Le poids du client Supabase.** `@supabase/supabase-js` embarque l'authentification, le temps
réel, le stockage et les fonctions, alors que seul l'accès aux données est utilisé. C'est
l'essentiel des 111 ko compressés. Corrections possibles : n'importer que
`@supabase/postgrest-js`, ou charger l'implémentation Supabase en import dynamique.

---

## 13. Deux corrections d'accessibilité, mesurées

Le gris des informations secondaires donnait un contraste de 2,85:1 sur le fond, sous le seuil
WCAG AA de 4,5:1. Assombri, mesuré à 4,51:1.

Aucun indicateur de focus n'était visible, ce qui rend la navigation au clavier impossible à
suivre. Ajouté via `:focus-visible`, donc invisible au clic à la souris.

Les deux ont été trouvés en mesurant dans le navigateur, pas en supposant.
