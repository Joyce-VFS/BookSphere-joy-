import { NextRequest, NextResponse } from 'next/server';
import { getUserById, verifyToken } from '../../../../lib/mock-auth';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        success: false,
        message: 'No token provided',
      }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({
        success: false,
        message: 'Invalid token',
      }, { status: 401 });
    }

    const user = await getUserById(decoded.userId);

    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'User not found',
      }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      user,
    }, { status: 200 });
  } catch (error) {
    console.error('Token verification error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
    }, { status: 500 });
  }
}
