import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { VillagePage } from "@/components/village-page";
import { isValidSession, SESSION_COOKIE } from "@/lib/auth";
import { getScores } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const jar = await cookies();
  if (!(await isValidSession(jar.get(SESSION_COOKIE)?.value))) {
    redirect("/login");
  }
  const scores = await getScores();
  return <VillagePage initial={scores} />;
}
