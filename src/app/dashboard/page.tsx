import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import DashboardClient from "./DashboardClient";

export default async function DashboardIndex() {
  const session = await getServerSession(authOptions);

  return <DashboardClient user={session?.user || null} initialConversionType="pdf-to-word" />;
}
