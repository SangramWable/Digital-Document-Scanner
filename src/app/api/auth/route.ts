import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { randomUUID } from 'crypto';

/* ══════════════════════════════════════════════════════════════════════════════
   In-memory OTP store (resets on server restart — fine for this use case)
   ══════════════════════════════════════════════════════════════════════════════ */

interface OtpRecord {
  otp: string;
  phone: string;
  createdAt: number;   // epoch ms
  verified: boolean;
  attempts: number;    // verification attempts
}

const otpStore = new Map<string, OtpRecord>();

// OTP config
const OTP_EXPIRY_MS = 5 * 60 * 1000;       // 5 minutes
const OTP_MAX_ATTEMPTS = 3;                 // max verification attempts
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;   // 1 minute cooldown between resends
const OTP_RATE_LIMIT_MS = 60 * 1000;        // 1 OTP per phone per minute

/* ──────────────────────── Helpers ──────────────────────── */

function generateOtp(): string {
  // Generate a random 6-digit OTP
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function cleanExpiredOtps() {
  const now = Date.now();
  for (const [key, record] of otpStore.entries()) {
    if (now - record.createdAt > OTP_EXPIRY_MS) {
      otpStore.delete(key);
    }
  }
}

/**
 * Send OTP via Fast2SMS API
 * Fast2SMS provides free SMS credits for Indian numbers
 * Get your API key from: https://www.fast2sms.com
 */
async function sendOtpViaFast2Sms(phone: string, otp: string): Promise<{ success: boolean; message: string }> {
  const FAST2SMS_API_KEY = process.env.FAST2SMS_API_KEY;

  if (!FAST2SMS_API_KEY) {
    // No API key configured — return demo mode info
    return {
      success: true,
      message: 'DEMO_MODE',
    };
  }

  try {
    const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: {
        'authorization': FAST2SMS_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        route: 'otp',
        variables_values: otp,
        numbers: phone,
        flash: 0,
      }),
    });

    const data = await response.json();

    if (data.return === true || data.return === 'true') {
      return { success: true, message: 'OTP sent successfully' };
    } else {
      console.error('Fast2SMS Error:', data);
      return {
        success: false,
        message: data.message || 'Failed to send OTP via SMS. Please try again.',
      };
    }
  } catch (error) {
    console.error('Fast2SMS Network Error:', error);
    return {
      success: false,
      message: 'Network error sending SMS. Please try again.',
    };
  }
}

/**
 * Send OTP via 2Factor.in API (alternative free service)
 * Get your API key from: https://2factor.in
 */
async function sendOtpVia2Factor(phone: string, otp: string): Promise<{ success: boolean; message: string }> {
  const TWOFACTOR_API_KEY = process.env.TWOFACTOR_API_KEY;

  if (!TWOFACTOR_API_KEY) {
    return { success: true, message: 'DEMO_MODE' };
  }

  try {
    const response = await fetch(
      `https://2factor.in/API/V1/${TWOFACTOR_API_KEY}/SMS/${phone}/${otp}/DocSyncOTP`,
      { method: 'GET' }
    );

    const data = await response.json();

    if (data.Status === 'Success') {
      return { success: true, message: 'OTP sent successfully' };
    } else {
      console.error('2Factor Error:', data);
      return { success: false, message: data.Details || 'Failed to send OTP' };
    }
  } catch (error) {
    console.error('2Factor Network Error:', error);
    return { success: false, message: 'Network error sending SMS' };
  }
}

/**
 * Unified OTP sender — tries Fast2SMS first, then 2Factor, then falls back to demo mode
 */
async function sendOtp(phone: string, otp: string): Promise<{ success: boolean; message: string; demoMode: boolean }> {
  // Try Fast2SMS first
  const fast2smsResult = await sendOtpViaFast2Sms(phone, otp);

  if (fast2smsResult.message === 'DEMO_MODE') {
    // No Fast2SMS key, try 2Factor
    const twoFactorResult = await sendOtpVia2Factor(phone, otp);

    if (twoFactorResult.message === 'DEMO_MODE') {
      // No SMS service configured — demo mode
      console.log(`[DEMO OTP] Phone: +91${phone}, OTP: ${otp}`);
      return { success: true, message: 'DEMO_MODE', demoMode: true };
    }

    return { ...twoFactorResult, demoMode: false };
  }

  return { ...fast2smsResult, demoMode: false };
}

/* ══════════════════════════════════════════════════════════════════════════════
   API Route Handler
   ══════════════════════════════════════════════════════════════════════════════ */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    // Clean expired OTPs on every request
    cleanExpiredOtps();

    /* ──────────────────── Signup with Email ──────────────────── */
    if (action === 'signup') {
      const { email, password, name, phone } = body;
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
          password: btoa(password),
        },
      });

      return NextResponse.json({
        success: true,
        user: { id: user.id, email: user.email, name: user.name, phone: user.phone },
      });
    }

    /* ──────────────────── Login with Email ──────────────────── */
    if (action === 'login') {
      const { email, password } = body;
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

    /* ──────────────────── Send OTP to Mobile ──────────────────── */
    if (action === 'send-otp') {
      const { phone } = body;
      if (!phone || !/^\d{10}$/.test(phone)) {
        return NextResponse.json({ error: 'Please enter a valid 10-digit mobile number' }, { status: 400 });
      }

      // Check rate limit — only 1 OTP per minute per phone
      const existing = otpStore.get(phone);
      if (existing && Date.now() - existing.createdAt < OTP_RATE_LIMIT_MS) {
        const waitSeconds = Math.ceil((OTP_RATE_LIMIT_MS - (Date.now() - existing.createdAt)) / 1000);
        return NextResponse.json(
          { error: `Please wait ${waitSeconds} seconds before requesting a new OTP` },
          { status: 429 }
        );
      }

      // Generate and store OTP
      const otp = generateOtp();
      otpStore.set(phone, {
        otp,
        phone,
        createdAt: Date.now(),
        verified: false,
        attempts: 0,
      });

      // Send OTP via SMS gateway
      const result = await sendOtp(phone, otp);

      if (!result.success) {
        otpStore.delete(phone);
        return NextResponse.json({ error: result.message }, { status: 500 });
      }

      // Ensure user exists in database
      let user = await db.user.findFirst({ where: { phone } });
      if (!user) {
        user = await db.user.create({
          data: {
            email: `phone_${phone}@docsync.local`,
            name: `User ${phone.slice(-4)}`,
            phone,
            password: btoa(randomUUID()),
          },
        });
      }

      const response: Record<string, unknown> = {
        success: true,
        message: result.demoMode
          ? 'Demo mode: OTP displayed on screen (configure FAST2SMS_API_KEY for real SMS)'
          : 'OTP sent to your mobile number',
        demoMode: result.demoMode,
      };

      // In demo mode, return the OTP so the frontend can show it
      if (result.demoMode) {
        response.demoOtp = otp;
      }

      return NextResponse.json(response);
    }

    /* ──────────────────── Verify OTP ──────────────────── */
    if (action === 'verify-otp') {
      const { phone, otp } = body;
      if (!phone || !otp) {
        return NextResponse.json({ error: 'Phone number and OTP are required' }, { status: 400 });
      }

      const record = otpStore.get(phone);

      // No OTP record found
      if (!record) {
        return NextResponse.json(
          { error: 'No OTP was sent to this number. Please request a new OTP.' },
          { status: 401 }
        );
      }

      // OTP expired
      if (Date.now() - record.createdAt > OTP_EXPIRY_MS) {
        otpStore.delete(phone);
        return NextResponse.json(
          { error: 'OTP has expired. Please request a new one.' },
          { status: 401 }
        );
      }

      // Too many attempts
      if (record.attempts >= OTP_MAX_ATTEMPTS) {
        otpStore.delete(phone);
        return NextResponse.json(
          { error: 'Too many incorrect attempts. Please request a new OTP.' },
          { status: 429 }
        );
      }

      // Increment attempt counter
      record.attempts++;

      // Check OTP match
      if (record.otp !== otp) {
        const remainingAttempts = OTP_MAX_ATTEMPTS - record.attempts;
        return NextResponse.json(
          { error: `Invalid OTP. ${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining.` },
          { status: 401 }
        );
      }

      // OTP verified successfully
      record.verified = true;
      otpStore.delete(phone);

      // Find or create user
      let user = await db.user.findFirst({ where: { phone } });
      if (!user) {
        user = await db.user.create({
          data: {
            email: `phone_${phone}@docsync.local`,
            name: `User ${phone.slice(-4)}`,
            phone,
            password: btoa(randomUUID()),
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: 'OTP verified successfully',
        user: { id: user.id, email: user.email, name: user.name, phone: user.phone },
      });
    }

    /* ──────────────────── Resend OTP ──────────────────── */
    if (action === 'resend-otp') {
      const { phone } = body;
      if (!phone || !/^\d{10}$/.test(phone)) {
        return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 });
      }

      // Check cooldown
      const existingRecord = otpStore.get(phone);
      if (existingRecord && Date.now() - existingRecord.createdAt < OTP_RESEND_COOLDOWN_MS) {
        const waitSeconds = Math.ceil((OTP_RESEND_COOLDOWN_MS - (Date.now() - existingRecord.createdAt)) / 1000);
        return NextResponse.json(
          { error: `Please wait ${waitSeconds} seconds before resending OTP` },
          { status: 429 }
        );
      }

      // Generate new OTP
      const otp = generateOtp();
      otpStore.set(phone, {
        otp,
        phone,
        createdAt: Date.now(),
        verified: false,
        attempts: 0,
      });

      // Send via gateway
      const result = await sendOtp(phone, otp);

      if (!result.success) {
        otpStore.delete(phone);
        return NextResponse.json({ error: result.message }, { status: 500 });
      }

      const response: Record<string, unknown> = {
        success: true,
        message: result.demoMode
          ? 'Demo mode: New OTP displayed on screen'
          : 'New OTP sent to your mobile number',
        demoMode: result.demoMode,
      };

      if (result.demoMode) {
        response.demoOtp = otp;
      }

      return NextResponse.json(response);
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
