/**
 * Run a .sql file (or ad-hoc SQL) against the Supabase database via the
 * Management API — no psql, no dashboard. Needs a Supabase personal access
 * token in SUPABASE_ACCESS_TOKEN (https://supabase.com/dashboard/account/tokens).
 *
 *   set -a && . ./.env.local && set +a && npx tsx scripts/db.ts supabase/migrations/0001_init.sql
 *   ... && npx tsx scripts/db.ts --sql "select count(*) from athletes"
 */
import { readFileSync } from "node:fs";

async function main() {
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const ref = projectUrl.match(/https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1];

  if (!token || !ref) {
    console.error(
      "Need SUPABASE_ACCESS_TOKEN and NEXT_PUBLIC_SUPABASE_URL in the environment.",
    );
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const sqlFlag = args.indexOf("--sql");
  const query =
    sqlFlag !== -1
      ? args[sqlFlag + 1]
      : readFileSync(args[0], "utf8");

  const res = await fetch(
    `https://api.supabase.com/v1/projects/${ref}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    },
  );

  const body = await res.text();
  if (!res.ok) {
    console.error(`HTTP ${res.status}: ${body}`);
    process.exit(1);
  }

  console.log(body || "OK (no rows returned)");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
