import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const settings = await prisma.systemSetting.findMany();
  return NextResponse.json(settings);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { key, value } = await req.json();

  if (!key || !value) {
    return NextResponse.json({ message: "Key and value required" }, { status: 400 });
  }

  const setting = await prisma.systemSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value }
  });

  return NextResponse.json(setting);
}
