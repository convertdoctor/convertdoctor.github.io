import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    select: { id: true, username: true, email: true, name: true, role: true, createdAt: true }
  });

  return NextResponse.json(users);
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ message: "User ID required" }, { status: 400 });
  }

  if (id === (session.user as any).id) {
    return NextResponse.json({ message: "Cannot delete yourself" }, { status: 400 });
  }

  await prisma.user.delete({
    where: { id }
  });

  return NextResponse.json({ message: "User deleted" });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id, role } = await req.json();

  if (!id || !role) {
    return NextResponse.json({ message: "User ID and role are required" }, { status: 400 });
  }

  if (id === (session.user as any).id) {
    return NextResponse.json({ message: "Cannot change your own role" }, { status: 400 });
  }

  if (role !== "ADMIN" && role !== "USER") {
    return NextResponse.json({ message: "Invalid role" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id },
    data: { role }
  });

  return NextResponse.json({ message: "User role updated" });
}
