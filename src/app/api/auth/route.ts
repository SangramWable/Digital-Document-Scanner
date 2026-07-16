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
 * Fast2SMS provides SMS credits for Indian numbers
 * Get your API key from: https://www.fast2sms.com
 *
 * Tries multiple routes in order:
 * 1. 'q' route — Quick transactional
 * 2. 'otp' route — Dedicated OTP delivery (requires website verification)
 * 3. 'v3' route — Transactional
 * 4. Voice call — Reads OTP over phone call
 */
async function sendOtpViaFast2Sms(phone: string, otp: string): Promise<{ success: boolean; message: string; demoMode: boolean; setupInfo?: string }> {
  const FAST2SMS_API_KEY = process.env.FAST2SMS_API_KEY;

  if (!FAST2SMS_API_KEY) {
    return {
      success: true,
      message: 'DEMO_MODE',
      demoMode: true,
    };
  }

  const otpMessage = `${otp} is your DocSync India verification code. Do not share this OTP with anyone.`;

  // Try SMS routes in order
  const smsRoutes = [
    { name: 'q', payload: { route: 'q', message: otpMessage, numbers: phone, flash: 0 } },
    { name: 'otp', payload: { route: 'otp', variables_values: otp, numbers: phone, flash: 0 } },
    { name: 'v3', payload: { route: 'v3', message: otpMessage, numbers: phone, flash: 0 } },
  ];

  const errors: string[] = [];

  for (const route of smsRoutes) {
    try {
      console.log(`[Fast2SMS] Trying SMS route '${route.name}' for phone ${phone}`);
      const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          'authorization': FAST2SMS_API_KEY,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(route.payload),
      });

      const data = await response.json();

      if (data.return === true || data.return === 'true') {
        console.log(`[Fast2SMS] OTP sent successfully via route '${route.name}'`);
        return { success: true, message: 'OTP sent successfully via SMS', demoMode: false };
      } else {
        const errMsg = data.message || `Route '${route.name}' failed`;
        console.warn(`[Fast2SMS] Route '${route.name}' failed:`, JSON.stringify(data));
        errors.push(errMsg);
      }
    } catch (error) {
      console.error(`[Fast2SMS] Route '${route.name}' error:`, error);
      errors.push(`Route '${route.name}' network error`);
    }
  }

  // Try voice call as last Fast2SMS option
  try {
    console.log(`[Fast2SMS] Trying voice call for phone ${phone}`);
    const voiceResponse = await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: {
        'authorization': FAST2SMS_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        route: 'voice',
        variables_values: otp,
        numbers: phone,
      }),
    });

    const voiceData = await voiceResponse.json();

    if (voiceData.return === true || voiceData.return === 'true') {
      console.log('[Fast2SMS] OTP sent successfully via voice call');
      return { success: true, message: 'OTP sent successfully via voice call', demoMode: false };
    } else {
      console.warn('[Fast2SMS] Voice call failed:', JSON.stringify(voiceData));
      errors.push(voiceData.message || 'Voice call failed');
    }
  } catch (error) {
    console.error('[Fast2SMS] Voice call error:', error);
    errors.push('Voice call network error');
  }

  // All Fast2SMS routes failed
  console.warn('[Fast2SMS] All routes failed. Errors:', errors.join(' | '));
  return {
    success: false,
    message: 'Fast2SMS routes failed',
    demoMode: true,
    setupInfo: 'Fast2SMS needs ₹100 wallet credit. Trying alternative...',
  };
}

/**
 * Send OTP via MSG91 — Indian OTP service with free credits on signup
 * Sign up at: https://msg91.com
 */
async function sendOtpViaMsg91(phone: string, otp: string): Promise<{ success: boolean; message: string }> {
  const MSG91_API_KEY = process.env.MSG91_API_KEY;
  const MSG91_TEMPLATE_ID = process.env.MSG91_TEMPLATE_ID;

  if (!MSG91_API_KEY) {
    return { success: false, message: 'MSG91 not configured' };
  }

  try {
    console.log(`[MSG91] Sending OTP to +91${phone}`);
    const response = await fetch(`https://api.msg91.com/api/v5/otp`, {
      method: 'POST',
      headers: {
        'authkey': MSG91_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        template_id: MSG91_TEMPLATE_ID || 'docsync_otp',
        mobile: `91${phone}`,
        OTP: otp,
      }),
    });

    const data = await response.json();

    if (data.type === 'success' || data.message === 'success') {
      console.log('[MSG91] OTP sent successfully');
      return { success: true, message: 'OTP sent successfully via MSG91' };
    } else {
      console.warn('[MSG91] Failed:', JSON.stringify(data));
      return { success: false, message: data.message || 'MSG91 failed' };
    }
  } catch (error) {
    console.error('[MSG91] Error:', error);
    return { success: false, message: 'MSG91 network error' };
  }
}

/**
 * Send OTP via TextBelt — truly free SMS service (no account needed)
 * TextBelt provides free SMS delivery (1 free SMS per day per IP)
 * Website: https://textbelt.com
 */
async function sendOtpViaTextBelt(phone: string, otp: string): Promise<{ success: boolean; message: string }> {
  const otpMessage = `${otp} is your DocSync India verification code. Do not share this OTP with anyone. Valid for 5 minutes.`;

  try {
    console.log(`[TextBelt] Sending OTP to +91${phone}`);
    const response = await fetch('https://textbelt.com/text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: `+91${phone}`,
        message: otpMessage,
        key: 'textbelt',
      }),
    });

    const data = await response.json();

    if (data.success) {
      console.log('[TextBelt] OTP sent successfully');
      return { success: true, message: 'OTP sent successfully via SMS' };
    } else {
      console.warn('[TextBelt] Failed:', data.error || 'Unknown error');
      return { success: false, message: data.error || 'TextBelt failed' };
    }
  } catch (error) {
    console.error('[TextBelt] Network error:', error);
    return { success: false, message: 'TextBelt network error' };
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
 * Unified OTP sender — tries multiple services in order:
 * 1. Fast2SMS (SMS + Voice call)
 * 2. MSG91 (if API key configured)
 * 3. TextBelt (free, no account needed)
 * 4. 2Factor.in (if API key configured)
 * 5. Falls back to demo mode (OTP shown on screen)
 */
async function sendOtp(phone: string, otp: string): Promise<{ success: boolean; message: string; demoMode: boolean; setupInfo?: string }> {
  // 1. Try Fast2SMS (SMS routes + voice call)
  const fast2smsResult = await sendOtpViaFast2Sms(phone, otp);

  if (!fast2smsResult.demoMode && fast2smsResult.success) {
    return fast2smsResult;
  }

  // 2. Try MSG91
  const msg91Result = await sendOtpViaMsg91(phone, otp);
  if (msg91Result.success) {
    return { ...msg91Result, demoMode: false };
  }

  // 3. Try TextBelt (free, no account needed)
  console.log('[OTP] Fast2SMS & MSG91 unavailable, trying TextBelt...');
  const textBeltResult = await sendOtpViaTextBelt(phone, otp);
  if (textBeltResult.success) {
    return { ...textBeltResult, demoMode: false };
  }

  // 4. Try 2Factor if configured
  const TWOFACTOR_API_KEY = process.env.TWOFACTOR_API_KEY;
  if (TWOFACTOR_API_KEY) {
    console.log('[OTP] Trying 2Factor...');
    const twoFactorResult = await sendOtpVia2Factor(phone, otp);
    if (twoFactorResult.success) {
      return { ...twoFactorResult, demoMode: false };
    }
  }

  // All services failed — fall back to demo mode so users can still log in
  console.log(`[DEMO OTP FALLBACK] Phone: +91${phone}, OTP: ${otp}`);
  return {
    success: true,
    message: 'DEMO_FALLBACK',
    demoMode: true,
    setupInfo: 'SMS delivery needs Fast2SMS wallet credit (₹100). Your OTP is shown on screen for now.',
  };
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
          ? (result.message === 'DEMO_FALLBACK'
              ? 'SMS service is being set up. OTP is shown on screen for now.'
              : 'Demo mode: OTP displayed on screen (configure FAST2SMS_API_KEY for real SMS)')
          : 'OTP sent to your mobile number',
        demoMode: result.demoMode,
      };

      // In demo mode, return the OTP so the frontend can show it
      if (result.demoMode) {
        response.demoOtp = otp;
        if (result.setupInfo) {
          response.setupInfo = result.setupInfo;
        }
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
          ? (result.message === 'DEMO_FALLBACK'
              ? 'SMS service is being set up. New OTP shown on screen.'
              : 'Demo mode: New OTP displayed on screen')
          : 'New OTP sent to your mobile number',
        demoMode: result.demoMode,
      };

      if (result.demoMode) {
        response.demoOtp = otp;
        if (result.setupInfo) {
          response.setupInfo = result.setupInfo;
        }
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
