import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !(session.user as any).id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { name, username, email, phoneNumber } = await req.json();
    const userId = (session.user as any).id;

    if (!username || !email || !phoneNumber) {
      return NextResponse.json({ message: "Username, email, and phone number are required" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ message: "Invalid email format" }, { status: 400 });
    }

    // Check for existing users with the same email or username (excluding current user)
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ],
        NOT: { id: userId }
      }
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return NextResponse.json({ message: "Email is already taken" }, { status: 409 });
      } else {
        return NextResponse.json({ message: "Username is already taken" }, { status: 409 });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        username,
        email,
        phoneNumber
      }
    });

    return NextResponse.json({ message: "Profile updated successfully", user: updatedUser });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
