import { Wordmark } from "@/components/Wordmark";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "כניסה — מוקד בוקר" };

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  const { next } = await searchParams;
  const target = typeof next === "string" ? next : "/";

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Wordmark />
        <p className="auth-sub">כניסת מאמן</p>
        <LoginForm next={target} />
      </div>
    </div>
  );
}
