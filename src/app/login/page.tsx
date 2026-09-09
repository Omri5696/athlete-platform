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
        <h1>מוקד בוקר</h1>
        <p className="auth-sub">כניסת מאמן</p>
        <LoginForm next={target} />
      </div>
    </div>
  );
}
