import { existsSync, readFileSync, readdirSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import pg from "pg";

const { Client } = pg;

function readEnvValue(name) {
  if (process.env[name]) {
    return process.env[name];
  }

  for (const fileName of [".env.local", ".env"]) {
    const filePath = path.join(process.cwd(), fileName);

    if (!existsSync(filePath)) {
      continue;
    }

    const line = readFileSync(filePath, "utf8")
      .split(/\r?\n/)
      .find((entry) => entry.startsWith(`${name}=`));

    if (line) {
      return line.slice(name.length + 1).trim();
    }
  }

  return undefined;
}

const databaseUrl = readEnvValue("DATABASE_URL");

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to apply the Supabase migration.");
}

const migrationsDir = path.join(process.cwd(), "supabase", "migrations");
const migrationPaths = readdirSync(migrationsDir)
  .filter((fileName) => fileName.endsWith(".sql"))
  .sort()
  .map((fileName) => path.join(migrationsDir, fileName));

const client = new Client({
  connectionString: databaseUrl,
  ssl: databaseUrl.includes("sslmode=disable")
    ? false
    : { rejectUnauthorized: false }
});

try {
  await client.connect();
  for (const migrationPath of migrationPaths) {
    const migrationSql = await readFile(migrationPath, "utf8");
    await client.query(migrationSql);
    console.log(`Applied ${path.relative(process.cwd(), migrationPath)}`);
  }
} finally {
  await client.end().catch(() => {});
}
