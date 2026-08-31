import { MockRepository } from "./mockRepository";
import type { Repository } from "./repository";
import { SupabaseRepository } from "./supabaseRepository";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Un seul endroit décide de la source de données.
 * Sans variables d'environnement, l'application tourne sur le jeu de
 * démonstration : elle se lance sans compte et sans réseau.
 */
export const repository: Repository =
  url && key ? new SupabaseRepository(url, key) : new MockRepository();

export type { Repository };
