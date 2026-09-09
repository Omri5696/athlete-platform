/**
 * Generate a one-time link for a coach to set (or reset) their password.
 * The coach opens it, lands on /auth/reset with a session, and picks a password.
 *
 *   set -a && . ./.env.local && set +a && npx tsx scripts/coach-link.ts [email] [--local]
 */
import { createClient } from "@supabase/supabase-js";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const args = process.argv.slice(2);
  const local = args.includes("--local");
  const email = args.find((a) => a.includes("@")) ?? "omricohen5696@gmail.com";
  const site = local
    ? "http://localhost:3000"
    : "https://athlete-platform-seven.vercel.app";

  const db = createClient(url, serviceKey, { auth: { persistSession: false } });

  const { data, error } = await db.auth.admin.generateLink({
    type: "recovery",
    email,
  });

  if (error || !data.properties?.hashed_token) {
    console.error(error ?? "no token returned");
    process.exit(1);
  }

  const link = `${site}/auth/confirm?token_hash=${data.properties.hashed_token}&type=recovery&next=/auth/reset`;

  console.log(`\nPassword-setup link for ${email}:\n\n${link}\n`);
  console.log("Valid for 1 hour. Open it, choose a password, done.\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
