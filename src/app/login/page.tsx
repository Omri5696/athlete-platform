import { APP_NAME, Logo } from "@/lib/branding";
import { LoginForm } from "./LoginForm";

export const metadata = { title: `כניסה — ${APP_NAME}` };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;
  const target = typeof next === "string" ? next : "/";

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="brand">
          <Logo size={19} />
          <span className="name">{APP_NAME}</span>
        </div>
        <p className="auth-sub">כניסת מאמן</p>
        <LoginForm next={target} />
      </div>
    </div>
  );
}
