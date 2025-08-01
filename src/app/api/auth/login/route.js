import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { User } from "@/model/User";
import { signToken } from "@/lib/auth";

export async function POST(request) {
  try {
    await dbConnect();

    const { email, password, rememberMe } = await request.json();

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Check if user is active (after password is validated)
    if (!user.isActive) {
      return NextResponse.json(
        { error: "Please contact management, Error: Status-inactive" },
        { status: 403 }
      );
    }

    // Generate token with appropriate expiration
    const token = signToken({
      userId: user._id,
      email: user.email,
      role: user.role,
    }, rememberMe);

    return NextResponse.json({
      message: "Login successful",
      token,
      rememberMe,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    // more specific error messages for debugging
    if (error.name === "MongoServerError") {
      console.error("MongoDB connection error:", error.message);
      if (error.code === 8000) {
        console.error(
          "Authentication failed - check MongoDB Atlas credentials"
        );
      }
    }

    return NextResponse.json(
      { error: "Internal server error..." },
      { status: 500 }
    );
  }
}
