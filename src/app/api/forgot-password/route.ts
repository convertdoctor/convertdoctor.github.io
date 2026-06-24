import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { email, phoneNumber } = await req.json();

    if (!email || !phoneNumber) {
      return NextResponse.json({ message: "Email and phone number are required" }, { status: 400 });
    }

    // Verify user exists with matching email AND phone number
    const user = await prisma.user.findFirst({
      where: {
        email: email,
        phoneNumber: phoneNumber
      }
    });

    // We still return 200 even if not found to prevent user enumeration attacks, 
    // but in this development app we might want to return 404 to help the user.
    // Given the prompt, the user probably wants to see if they got it wrong.
    if (!user) {
      return NextResponse.json({ message: "No account found matching this email and phone number combination." }, { status: 404 });
    }

    // Generate token
    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 3600000); // 1 hour from now

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: token,
        resetTokenExpiry: expiry
      }
    });

    // In a production app, we would send an email here.
    // For development, we return the token directly so the UI can redirect or show the link.
    const resetUrl = `/reset-password?token=${token}`;

    return NextResponse.json({ 
      message: "Password reset link generated.",
      resetUrl: resetUrl // Mocking the email delivery for development
    }, { status: 200 });

  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ message: "An error occurred" }, { status: 500 });
  }
}
