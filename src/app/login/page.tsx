import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { isValidSession, SESSION_COOKIE } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const jar = await cookies();
  if (await isValidSession(jar.get(SESSION_COOKIE)?.value)) {
    redirect("/");
  }
  const params = await searchParams;
  return <LoginForm errorCode={params.error} />;
}
