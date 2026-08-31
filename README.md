# Via Sana — suivi des parcours de soins coordonnés

Prototype d'un outil de suivi des parcours de soins, construit autour du parcours
**Prépa Marathon**. Deux interfaces : une vue praticien pour piloter plusieurs patients,
une vue patient pour comprendre où il en est.

---

## Lancer le projet

```bash
npm install
npm run dev
```

L'application démarre sur http://localhost:5174 avec un jeu de démonstration en mémoire.
Aucun compte ni service externe n'est nécessaire.

Pour la brancher sur une vraie base :

1. Créer un projet Supabase.
2. Coller `supabase/schema.sql` dans l'éditeur SQL.
3. Copier `.env.example` vers `.env` et renseigner les deux variables.
4. Relancer `npm run dev`.

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
  pages/
    ListePraticien.tsx  liste + filtres
    FicheParcours.tsx   fiche détaillée, réutilisée en lecture seule côté patient
    EspacePatient.tsx   espace patient + questionnaire
  components/ui.tsx     badges, progression, formats de date
```

Les écrans ne connaissent que l'interface `Repository`. Changer de source de données
revient à changer une ligne dans `data/index.ts`, et la vue patient réutilise le même
composant que la vue praticien avec `lectureSeule`, ce qui garantit que les deux
affichent exactement le même parcours.

---

## Ce que fait le prototype

**Interface praticien**

- liste des patients avec parcours, étape courante, avancement, prochaine séance
- filtres par parcours, par statut, par étape courante, plus une recherche
- signalement visible des formulaires non reçus
- fiche patient : identité, objectif, réponses du questionnaire, praticiens impliqués,
  frise des étapes, prochaines séances, notes
- changement de statut d'une étape et ajout d'une note de suivi
- **assignation d'un praticien et planification d'une date, étape par étape**, avec rappel
  de la spécialité attendue par le modèle de parcours

**Interface patient**

- questionnaire préalable à remplir ou à consulter
- parcours en lecture seule, avec ce qui est fait, en cours et à venir
- prochaines séances et notes de suivi

L'assignation mérite un mot. Leur offre décrit un coordinateur qui « gère les rendez-vous et
s'assure que les praticiens partagent les documents ». Assigner un praticien à une étape est
donc un acte quotidien du métier, pas un réglage technique : s'il fallait un accès à la base
ou un développeur pour le faire, l'outil raterait ce qu'il est censé résoudre. C'est pour
cette raison qu'il se fait depuis la fiche, en deux clics.

Transmettre le questionnaire clôture automatiquement la première étape et fait passer la
suivante en cours. C'est le seul automatisme du prototype, et il correspond à ce que
décrit le parcours réel : le questionnaire est lu par le kiné avant le bilan.

---

## Ce que j'ai volontairement laissé de côté

Trois jours imposent des choix. Ce qui manque, et pourquoi.

- **L'authentification réelle.** Un sélecteur de rôle suffit à démontrer les deux vues.
  En production, Supabase Auth avec des politiques de sécurité au niveau des lignes.
- **La prise de rendez-vous.** Les dates sont affichées et modifiables en base, mais il
  n'y a pas d'agenda. C'est un chantier à part entière, souvent connecté à l'existant
  des praticiens.
- **Les notifications** au patient et aux praticiens.
- **La génération du plan d'action en PDF.**
- **Le routage.** Deux vues et un détail se pilotent très bien avec un état local ; un
  routeur serait la première chose à ajouter dès qu'on veut partager une URL de fiche.

Sur un vrai produit de santé, il faudrait aussi traiter l'hébergement de données de santé,
la traçabilité des accès et la durée de conservation. Ce sont des contraintes
réglementaires, pas des fonctionnalités, et elles orientent l'architecture dès le départ.

---

## Ce que je ferais ensuite, dans cet ordre

1. Authentification et cloisonnement des accès par rôle.
2. Une URL par fiche patient, pour pouvoir en partager une en réunion.
3. Le rattachement d'un document à une étape, le partage documentaire étant au cœur de
   la coordination.
4. Une vue coordinateur listant ce qui bloque : formulaires non reçus, étapes sans date,
   parcours sans activité depuis trois semaines.

Le quatrième point est celui qui ferait gagner le plus de temps au quotidien, parce qu'il
transforme l'outil de consultation en outil de pilotage.
