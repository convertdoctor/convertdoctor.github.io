import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardClient from "../DashboardClient";

export default async function DashboardDynamicPage({ params }: { params: Promise<{ type: string }> }) {
  const resolvedParams = await params;
  const session = await getServerSession(authOptions);

  const validTypes = ["pdf-to-word", "word-to-pdf", "pdf-to-jpg", "pdf-ocr", "word-to-excel", "word-to-ppt"];
  if (!validTypes.includes(resolvedParams.type)) {
    redirect("/dashboard/pdf-to-word");
  }

  return <DashboardClient key={resolvedParams.type} user={session?.user || null} initialConversionType={resolvedParams.type as any} />;
}
