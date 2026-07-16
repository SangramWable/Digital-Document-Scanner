import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { action, email, password, name, phone } = await request.json();

    if (action === 'signup') {
      if (!email || !password || !name) {
        return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
      }

      const existing = await db.user.findUnique({ where: { email } });
      if (existing) {
        return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
      }

      const user = await db.user.create({
        data: {
          email,
          name,
          phone: phone || null,
          password: btoa(password), // Simple encoding (in production, use bcrypt)
        },
      });

      return NextResponse.json({
        success: true,
        user: { id: user.id, email: user.email, name: user.name, phone: user.phone },
      });
    }

    if (action === 'login') {
      if (!email || !password) {
        return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
      }

      const user = await db.user.findUnique({ where: { email } });
      if (!user || user.password !== btoa(password)) {
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
      }

      return NextResponse.json({
        success: true,
        user: { id: user.id, email: user.email, name: user.name, phone: user.phone },
      });
    }

    if (action === 'otp-login') {
      if (!phone) {
        return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
      }

      // Demo OTP - always succeeds with any 6-digit code
      let user = await db.user.findFirst({ where: { phone } });
      if (!user) {
        user = await db.user.create({
          data: {
            email: `phone_${phone}@docsync.local`,
            name: phone,
            phone,
            password: btoa(randomUUID()),
          },
        });
      }

      return NextResponse.json({
        success: true,
        demoOtp: '123456',
        user: { id: user.id, email: user.email, name: user.name, phone: user.phone },
      });
    }

    if (action === 'verify-otp') {
      // Demo: accept any 6-digit OTP
      const { otp, phone: otpPhone } = await request.json();
      if (otp === '123456') {
        const user = await db.user.findFirst({ where: { phone: otpPhone } });
        if (user) {
          return NextResponse.json({
            success: true,
            user: { id: user.id, email: user.email, name: user.name, phone: user.phone },
          });
        }
      }
      return NextResponse.json({ error: 'Invalid OTP' }, { status: 401 });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Auth Error:', error);
    return NextResponse.json(
      { error: 'Authentication failed', details: (error as Error).message },
      { status: 500 }
    );
  }
}
