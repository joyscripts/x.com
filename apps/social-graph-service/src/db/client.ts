import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/config/env";

const sql = postgres(env.DATABASE_URL, {
  prepare: false,
});

export const db = drizzle(sql);
