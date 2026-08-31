# Via Sana — suivi des parcours de soins coordonnés

Prototype d'un outil de suivi des parcours de soins, construit autour du parcours
**Prépa Marathon**. Trois vues, parce que trois personnes se posent trois questions
différentes : le praticien demande où en est son patient, le coordinateur demande qui
débloquer aujourd'hui, le patient demande où il en est.

---

## Lancer le projet

```bash
npm install
npm run dev     # http://localhost:5174
npm test        # 12 tests sur les règles de détection
npm run build   # production dans dist/
```

L'application démarre sur http://localhost:5174 avec un jeu de démonstration en mémoire.
Aucun compte ni service externe n'est nécessaire. Le premier écran demande qui vous êtes :
choisissez un praticien, le coordinateur Nadia Kessler, ou un patient.

Pour la brancher sur une vraie base :

1. Créer un projet Supabase.
2. Coller dans l'éditeur SQL, dans cet ordre : `supabase/schema.sql`,
   `supabase/seed.sql`, puis `supabase/policies.sql`.
3. Copier `.env.example` vers `.env` et renseigner les deux variables.
4. Relancer `npm run dev`.

Le jeu de démonstration SQL reproduit exactement l'état du jeu en mémoire, avec des dates
relatives à l'exécution pour que la démonstration ne vieillisse pas.

Le troisième fichier est important : Supabase active Row Level Security par défaut, donc
sans politiques les tables répondent 200 avec un tableau vide. J'ai préféré écrire des
politiques ouvertes et assumées plutôt que de désactiver RLS : une base sans RLS est ouverte
sans que rien ne le signale, une politique explicite se lit dans le dépôt et se remplace le
jour où l'authentification arrive. `policies.sql` contient en commentaire les vraies
politiques, celles qui restreindraient chaque lecture à l'utilisateur authentifié.

L'en-tête indique en permanence la source utilisée, `données de démonstration` ou `Supabase`.

---

## Le problème tel que je l'ai compris

Aujourd'hui un parcours vit dans des formulaires externes, des mails, WhatsApp et des
fichiers partagés. Trois conséquences : les praticiens ne voient pas ce que les autres
ont fait, le patient ne sait pas où il en est, et personne ne peut suivre plusieurs
patients à la fois.

Le prototype répond à ces trois points, dans cet ordre de priorité.

---

## Le choix de modélisation, qui est le cœur du travail

Un parcours est **décrit une fois**, puis **instancié pour chaque patient**.

```
parcours_modele  ──<  etape_modele          (le parcours type)
       │
parcours_patient ──<  etape_patient         (le parcours d'un patient donné)
```

Concrètement, les cinq étapes de Prépa Marathon (questionnaire initial, bilan clinique,
plan d'action, analyse de foulée, suivi coordonné six mois) sont des **données**, pas du
code. Ajouter le parcours « Retour à la course après blessure », déjà présent dans la
démonstration, n'a demandé aucune modification de schéma ni de composant.

C'est ce qui permet de tenir la troisième exigence de l'énoncé : gérer plusieurs patients
**et** plusieurs parcours en parallèle.

Deux autres décisions :

- **Le formulaire préalable est stocké en `jsonb`.** Le questionnaire évoluera, et une
  colonne par question rendrait le schéma ingérable. En contrepartie, on perd le typage
  fort sur ces champs, ce qui est acceptable pour des réponses libres.
- **Une note peut être rattachée à une étape ou au parcours entier.** Un ostéopathe qui
  voit le patient hors parcours doit pouvoir laisser une trace, sinon l'information
  repart dans WhatsApp.

---

## Architecture applicative

```
src/
  types.ts              le modèle métier, partagé par toute l'application
  data/
    repository.ts       le contrat d'accès aux données
    mockRepository.ts   implémentation en mémoire (démonstration)
    supabaseRepository.ts  implémentation Supabase
    index.ts            choisit l'une ou l'autre selon l'environnement
    seed.ts             jeu de démonstration
    alertes.ts          règles de détection des points bloquants (fonction pure)
    alertes.test.ts     12 tests sur ces règles
  pages/
    Connexion.tsx          choix du profil
    ListePraticien.tsx     liste + filtres
    TableauCoordination.tsx  points à traiter, vue coordinateur
    FicheParcours.tsx      fiche détaillée, réutilisée en lecture seule côté patient
    EspacePatient.tsx      espace patient + questionnaire
  components/ui.tsx     badges, progression, formats de date
```

L'application est utilisable sur téléphone. Ce n'est pas un détail cosmétique : un patient
qui veut savoir quand est sa prochaine séance le fait depuis son téléphone, pas depuis un
poste de travail. Sur petit écran, le sous-titre et l'indicateur de source disparaissent,
les filtres passent en pleine largeur et les tableaux défilent horizontalement dans leur
propre conteneur.

Les écrans ne connaissent que l'interface `Repository`. Changer de source de données
revient à changer une ligne dans `data/index.ts`, et la vue patient réutilise le même
composant que la vue praticien avec `lectureSeule`, ce qui garantit que les deux
affichent exactement le même parcours.

---

## Ce que fait le prototype

**Identification**

Un écran d'entrée demande qui vous êtes, sans mot de passe. Ce n'est pas de
l'authentification, c'est une identité de démonstration, et c'est assumé : ce qui compte
est de montrer que chacun ne voit que ce qui le concerne. En production, Supabase Auth avec
des politiques de sécurité au niveau des lignes.

**Interface praticien**

- par défaut, uniquement les parcours sur lesquels le praticien connecté intervient,
  avec une bascule vers l'ensemble des patients
- liste des patients avec parcours, étape courante, avancement, prochaine séance
- filtres par parcours, par statut, par étape courante, plus une recherche
- signalement visible des formulaires non reçus
- fiche patient : identité, objectif, réponses du questionnaire, praticiens impliqués,
  frise des étapes, prochaines séances, notes
- changement de statut d'une étape et ajout d'une note de suivi
- **assignation d'un praticien et planification d'une date, étape par étape**, avec rappel
  de la spécialité attendue par le modèle de parcours

**Interface patient**

- accès limité à son seul dossier
- questionnaire préalable à remplir ou à consulter
- parcours en lecture seule, avec ce qui est fait, en cours et à venir
- prochaines séances et notes de suivi

**Interface coordinateur**

- deux onglets : « Points à traiter » et « Tous les patients », parce qu'un coordinateur
  a besoin de piloter les blocages sans perdre l'accès à l'ensemble des dossiers
- « Points à traiter » : les parcours qui n'avancent pas, classés par urgence
- cinq règles de détection : questionnaire jamais transmis, étape en cours sans date,
  étape en cours sans praticien alors qu'une spécialité est attendue, parcours sans
  aucune activité depuis trois semaines, parcours en pause
- assignation d'un praticien et planification d'une date, réservées à ce rôle
- les parcours sains sont listés à part, pour qu'ils ne créent pas de bruit

Le rôle vient de leur offre, qui décrit « un coordinateur qui gère les rendez-vous et
s'assure que les praticiens partagent les documents ». Assigner quelqu'un à une étape est
donc un acte quotidien du métier, pas un réglage technique : s'il fallait un accès à la base
ou un développeur pour le faire, l'outil raterait ce qu'il doit résoudre.

Le praticien, lui, peut changer le statut d'une étape et écrire une note, mais pas
réassigner : il n'a pas la vision d'ensemble. C'est une règle simple, volontairement, pour
montrer qu'on a pensé aux permissions sans construire un système de droits complet.

Une précision sur la bascule « Mes patients / Tous » côté praticien. On aurait pu cloisonner
strictement, mais dans un parcours coordonné, savoir ce que les collègues ont fait est
précisément l'objet de l'outil. Le défaut affiche donc sa propre file, sans interdire de
voir le reste.

Les règles de détection vivent dans `data/alertes.ts`, sous la forme d'une fonction pure
partagée par les deux implémentations du repository. Elles ne dépendent d'aucune source de
données, donc elles se testent isolément et ne peuvent pas diverger entre la démonstration
et Supabase.

Transmettre le questionnaire clôture automatiquement la première étape et fait passer la
suivante en cours. C'est le seul automatisme du prototype, et il correspond à ce que
décrit le parcours réel : le questionnaire est lu par le kiné avant le bilan.

---

## Ce que j'ai volontairement laissé de côté

Trois jours imposent des choix. Ce qui manque, et pourquoi.

- **L'authentification réelle.** L'écran d'entrée identifie sans vérifier : pas de mot de
  passe, pas de session, pas de jeton. En production, Supabase Auth et des politiques de
  sécurité au niveau des lignes, pour que le filtrage soit appliqué par la base et non par
  l'interface.
- **La prise de rendez-vous.** Les dates sont affichées et modifiables en base, mais il
  n'y a pas d'agenda. C'est un chantier à part entière, souvent connecté à l'existant
  des praticiens.
- **Les notifications** au patient et aux praticiens.
- **La génération du plan d'action en PDF.**
- **Le routage.** Deux vues et un détail se pilotent très bien avec un état local ; un
  routeur serait la première chose à ajouter dès qu'on veut partager une URL de fiche.
- **Le nombre de requêtes.** L'implémentation Supabase charge chaque table séparément puis
  fait les jointures en JavaScript, ce qui donne une trentaine d'appels à l'ouverture là où
  deux suffiraient. C'est un choix de simplicité qui tient à cette échelle et qui ne tiendrait
  pas à mille patients. La correction est connue : demander les ressources imbriquées à
  PostgREST en une seule fois, par exemple
  `select=*,etape_patient(*,etape_modele(*))`, ou exposer une vue côté base.

En revanche, les règles de détection des points bloquants sont testées : douze tests
couvrent chaque règle et son cas négatif, parce que c'est la seule logique du projet dont
une erreur passerait inaperçue. Un chargement qui échoue affiche un message et un bouton
Réessayer plutôt qu'une page blanche.

Sur un vrai produit de santé, il faudrait aussi traiter l'hébergement de données de santé,
la traçabilité des accès et la durée de conservation. Ce sont des contraintes
réglementaires, pas des fonctionnalités, et elles orientent l'architecture dès le départ.

---

## Ce que je ferais ensuite, dans cet ordre

1. La vraie authentification, avec le cloisonnement appliqué côté base.
2. Une URL par fiche patient, pour pouvoir en partager une en réunion.
3. Le rattachement d'un document à une étape, le partage documentaire étant au cœur de
   la coordination.
4. Des tests sur les repositories, en particulier le calcul d'avancement, aujourd'hui
   dupliqué entre les deux implémentations.

Le troisième point est celui qui ferait gagner le plus de temps au quotidien : tant que les
comptes rendus circulent par mail, la coordination reste incomplète.
