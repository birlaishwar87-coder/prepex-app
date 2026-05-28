import { LoginForm } from "./login-form";

export const metadata = {
  title: "Sign in · Prepex",
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: { redirect?: string; error?: string };
}) {
  return <LoginForm redirect={searchParams.redirect} initialError={searchParams.error} />;
}
