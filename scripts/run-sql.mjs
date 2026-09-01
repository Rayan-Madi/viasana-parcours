#!/usr/bin/env node
/**
 * Applique un fichier SQL sur la base Supabase.
 *
 * Evite d'avoir a copier-coller les migrations dans l'editeur web, et
 * garde une trace de ce qui a ete execute.
 *
 *   node scripts/run-sql.mjs supabase/schema.sql
 *   node scripts/run-sql.mjs supabase/schema.sql supabase/seed.sql
 *
 * La chaine de connexion est lue depuis .env.local, qui n'est jamais
 * versionne :
 *
 *   DATABASE_URL=postgresql://postgres.xxxx:motdepasse@aws-0-eu-central-1...
 */
import { readFileSync, existsSync } from "node:fs";
import pg from "pg";

const fichierEnv = ".env.local";
if (!existsSync(fichierEnv)) {
  console.error(`Fichier ${fichierEnv} introuvable.`);
  console.error("Il doit contenir une ligne DATABASE_URL=postgresql://...");
  process.exit(1);
}

const url = readFileSync(fichierEnv, "utf8")
  .split(/\r?\n/)
  .find((l) => l.startsWith("DATABASE_URL="))
  ?.slice("DATABASE_URL=".length)
  .trim();

if (!url) {
  console.error(`Aucune ligne DATABASE_URL dans ${fichierEnv}.`);
  process.exit(1);
}

const fichiers = process.argv.slice(2);
if (fichiers.length === 0) {
  console.error("Usage : node scripts/run-sql.mjs <fichier.sql> [autre.sql ...]");
  process.exit(1);
}

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();

try {
  for (const fichier of fichiers) {
    process.stdout.write(`${fichier} ... `);
    await client.query(readFileSync(fichier, "utf8"));
    console.log("ok");
  }
} catch (e) {
  console.error("\nEchec :", e.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
