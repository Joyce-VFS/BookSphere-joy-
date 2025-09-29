import { NextRequest, NextResponse } from 'next/server';
import { createUser } from '../../../../lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password, firstName, lastName } = await req.json();

    // Basic validation
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json({
        success: false,
        message: 'All fields are required',
      }, { status: 400 });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({
        success: false,
        message: 'Please enter a valid email address',
      }, { status: 400 });
    }

    // Password validation
    if (password.length < 6) {
      return NextResponse.json({
        success: false,
        message: 'Password must be at least 6 characters long',
      }, { status: 400 });
    }

    const result = await createUser({
      email,
      password,
      firstName,
      lastName,
    });

    if (result.success) {
      return NextResponse.json(result, { status: 201 });
    } else {
      return NextResponse.json(result, { status: 400 });
    }
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
    }, { status: 500 });
  }
}
