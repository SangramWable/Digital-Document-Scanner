'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Lock,
  Phone,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  Shield,
  RefreshCw,
  CheckCircle2,
  MessageSquare,
  Clock,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAppStore, type UserProfile } from '@/lib/store';

/* ──────────────────────── Animation variants ──────────────────────── */

const formVariant = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
  exit: { opacity: 0, x: -20, transition: { duration: 0.2 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

/* ──────────────────────── Helper ──────────────────────── */

async function authFetch(action: string, payload: Record<string, string>) {
  const res = await fetch('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...payload }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Authentication failed');
  return data;
}

/* ════════════════════════ Component ════════════════════════ */

export default function AuthDialog() {
  const showAuthDialog = useAppStore((s) => s.showAuthDialog);
  const authMode = useAppStore((s) => s.authMode);
  const setShowAuthDialog = useAppStore((s) => s.setShowAuthDialog);
  const setAuthMode = useAppStore((s) => s.setAuthMode);
  const login = useAppStore((s) => s.login);

  /* ── shared state ── */
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  /* ── email form ── */
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  /* ── mobile / OTP form ── */
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoOtp, setDemoOtp] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const resendTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── derived ── */
  const isLogin = authMode === 'login';

  /* ── Resend cooldown timer ── */
  useEffect(() => {
    if (resendCooldown > 0) {
      resendTimerRef.current = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            if (resendTimerRef.current) clearInterval(resendTimerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (resendTimerRef.current) clearInterval(resendTimerRef.current);
    };
  }, [resendCooldown]);

  /* ── reset form state when dialog closes or mode changes ── */
  const resetForm = useCallback(() => {
    setEmail('');
    setPassword('');
    setName('');
    setPhone('');
    setOtp('');
    setOtpSent(false);
    setIsDemoMode(false);
    setDemoOtp('');
    setOtpVerified(false);
    setResendCooldown(0);
    setError('');
    setShowPassword(false);
    if (resendTimerRef.current) clearInterval(resendTimerRef.current);
  }, []);

  /* ────────────────── Email login/signup ────────────────── */

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const action = isLogin ? 'login' : 'signup';
      const payload: Record<string, string> = isLogin ? { email, password } : { name, email, password };
      const data = await authFetch(action, payload);

      const user: UserProfile = {
        id: data.user?.id || crypto.randomUUID(),
        email: data.user?.email || email,
        name: data.user?.name || name || email.split('@')[0],
        phone: data.user?.phone,
      };
      login(user);
      resetForm();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  /* ────────────────── Send OTP to Mobile ────────────────── */

  const handleSendOtp = async () => {
    setError('');
    if (!phone || phone.length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    setLoading(true);

    try {
      const data = await authFetch('send-otp', { phone });

      setOtpSent(true);
      setIsDemoMode(data.demoMode || false);
      setDemoOtp(data.demoOtp || '');
      setResendCooldown(60); // 60 second cooldown
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ────────────────── Resend OTP ────────────────── */

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;

    setError('');
    setOtp('');
    setLoading(true);

    try {
      const data = await authFetch('resend-otp', { phone });

      setIsDemoMode(data.demoMode || false);
      setDemoOtp(data.demoOtp || '');
      setResendCooldown(60);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to resend OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ────────────────── Verify OTP ────────────────── */

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (otp.length !== 6) {
      setError('Please enter the complete 6-digit OTP');
      return;
    }

    setLoading(true);

    try {
      const data = await authFetch('verify-otp', { phone, otp });

      setOtpVerified(true);

      // Short delay to show success animation
      setTimeout(() => {
        const user: UserProfile = {
          id: data.user?.id || crypto.randomUUID(),
          email: data.user?.email || '',
          name: data.user?.name || phone,
          phone,
        };
        login(user);
        resetForm();
      }, 1000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ────────────────── Toggle login/signup ────────────────── */

  const toggleMode = () => {
    setError('');
    setAuthMode(isLogin ? 'signup' : 'login');
  };

  /* ────────────────── Handle dialog open/close ────────────────── */

  const handleOpenChange = (open: boolean) => {
    if (!open) resetForm();
    setShowAuthDialog(open, authMode);
  };

  /* ════════════════════════ Render ════════════════════════ */

  return (
    <Dialog open={showAuthDialog} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[460px] p-0 overflow-hidden gap-0">
        {/* ── Emerald header banner ── */}
        <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 px-6 py-5 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
              <Shield className="size-5" />
              {isLogin ? 'Sign in to DocSync' : 'Create your Account'}
            </DialogTitle>
            <DialogDescription className="text-emerald-100/80 mt-1">
              {isLogin
                ? 'Access your documents securely from your device'
                : 'Join DocSync to manage your documents digitally'}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* ── Tabbed content ── */}
        <div className="px-6 pt-5 pb-2">
          <Tabs defaultValue="email" className="w-full">
            <TabsList className="w-full grid grid-cols-2 bg-emerald-50 dark:bg-emerald-950/40">
              <TabsTrigger
                value="email"
                className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-sm"
              >
                <Mail className="size-4" />
                Email
              </TabsTrigger>
              <TabsTrigger
                value="mobile"
                className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-sm"
              >
                <Phone className="size-4" />
                Mobile
              </TabsTrigger>
            </TabsList>

            {/* ──────────── Email Tab ──────────── */}
            <TabsContent value="email" className="mt-4">
              <AnimatePresence mode="wait">
                <motion.form
                  key={isLogin ? 'login' : 'signup'}
                  variants={formVariant}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  onSubmit={handleEmailSubmit}
                  className="space-y-4"
                >
                  {/* Name (signup only) */}
                  {!isLogin && (
                    <motion.div
                      variants={fadeUp}
                      initial="hidden"
                      animate="visible"
                      className="space-y-2"
                    >
                      <Label htmlFor="auth-name" className="text-sm font-medium">
                        Full Name
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                          id="auth-name"
                          placeholder="Enter your full name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </motion.div>
                  )}

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="auth-email" className="text-sm font-medium">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input
                        id="auth-email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <Label htmlFor="auth-password" className="text-sm font-medium">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input
                        id="auth-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Error message */}
                  <AnimatePresence>
                    {error && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-md"
                      >
                        {error}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  {/* Submit */}
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
                    size="lg"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin size-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        {isLogin ? 'Signing in…' : 'Creating account…'}
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        {isLogin ? 'Sign In' : 'Create Account'}
                        <ArrowRight className="size-4" />
                      </span>
                    )}
                  </Button>

                  {/* Toggle login/signup */}
                  <p className="text-center text-sm text-muted-foreground pt-1">
                    {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
                    <button
                      type="button"
                      onClick={toggleMode}
                      className="font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 underline-offset-4 hover:underline transition-colors"
                    >
                      {isLogin ? 'Sign up' : 'Sign in'}
                    </button>
                  </p>
                </motion.form>
              </AnimatePresence>
            </TabsContent>

            {/* ──────────── Mobile Tab ──────────── */}
            <TabsContent value="mobile" className="mt-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={otpVerified ? 'verified' : otpSent ? 'otp' : 'phone'}
                  variants={formVariant}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  {/* ── OTP Verified Success ── */}
                  {otpVerified ? (
                    <div className="flex flex-col items-center justify-center py-8 space-y-4">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                        className="size-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center"
                      >
                        <CheckCircle2 className="size-8 text-emerald-600" />
                      </motion.div>
                      <p className="text-lg font-semibold text-emerald-700 dark:text-emerald-400">
                        OTP Verified Successfully!
                      </p>
                      <p className="text-sm text-muted-foreground">Logging you in…</p>
                    </div>
                  ) : !otpSent ? (
                    /* ── Phone input ── */
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="auth-phone" className="text-sm font-medium">
                          Mobile Number
                        </Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                            +91
                          </span>
                          <Phone className="absolute left-12 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                          <Input
                            id="auth-phone"
                            type="tel"
                            placeholder="Enter 10-digit number"
                            value={phone}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                              setPhone(val);
                            }}
                            className="pl-[4.5rem]"
                            required
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          We&apos;ll send a 6-digit OTP to verify your number
                        </p>
                      </div>

                      {/* Error */}
                      <AnimatePresence>
                        {error && (
                          <motion.p
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-md"
                          >
                            {error}
                          </motion.p>
                        )}
                      </AnimatePresence>

                      <Button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={loading || phone.length < 10}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
                        size="lg"
                      >
                        {loading ? (
                          <span className="flex items-center gap-2">
                            <svg className="animate-spin size-4" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Sending OTP…
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <MessageSquare className="size-4" />
                            Send OTP
                            <ArrowRight className="size-4" />
                          </span>
                        )}
                      </Button>

                      {/* Info about SMS */}
                      <Card className="bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-800">
                        <CardContent className="px-3 py-2 flex items-start gap-2">
                          <span className="text-sky-600 text-sm mt-0.5">📱</span>
                          <p className="text-xs text-sky-700 dark:text-sky-400">
                            <strong>Real SMS:</strong> OTP will be sent to your mobile number via SMS.
                            {!process.env.NEXT_PUBLIC_SMS_CONFIGURED && ' In demo mode, OTP will be shown on screen.'}
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    /* ── OTP verification ── */
                    <form onSubmit={handleVerifyOtp} className="space-y-4">
                      {/* OTP sent indicator */}
                      <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="size-4 shrink-0" />
                        <span>OTP sent to <strong>+91 {phone}</strong></span>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="auth-otp" className="text-sm font-medium">
                          Enter 6-digit OTP
                        </Label>
                        <div className="relative">
                          <Shield className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                          <Input
                            id="auth-otp"
                            type="text"
                            inputMode="numeric"
                            placeholder="• • • • • •"
                            maxLength={6}
                            value={otp}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                              setOtp(val);
                            }}
                            className="pl-10 tracking-[0.5em] text-center font-mono text-lg"
                            required
                            autoFocus
                          />
                        </div>
                      </div>

                      {/* Demo mode hint - show OTP on screen */}
                      {isDemoMode && demoOtp && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.3 }}
                        >
                          <Card className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
                            <CardContent className="px-3 py-3 flex flex-col items-center gap-2">
                              <p className="text-xs text-amber-700 dark:text-amber-400 text-center font-medium">
                                🔧 Demo Mode — SMS service not configured
                              </p>
                              <p className="text-xs text-amber-600 dark:text-amber-500 text-center">
                                Your OTP is:
                              </p>
                              <div className="bg-amber-100 dark:bg-amber-900/50 px-4 py-2 rounded-lg">
                                <span className="font-mono text-2xl font-bold tracking-[0.3em] text-amber-800 dark:text-amber-300">
                                  {demoOtp}
                                </span>
                              </div>
                              <p className="text-[10px] text-amber-600/70 dark:text-amber-500/70 text-center mt-1">
                                Add FAST2SMS_API_KEY to .env for real SMS delivery
                              </p>
                            </CardContent>
                          </Card>
                        </motion.div>
                      )}

                      {/* Real SMS mode indicator */}
                      {!isDemoMode && (
                        <Card className="bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800">
                          <CardContent className="px-3 py-2 flex items-start gap-2">
                            <MessageSquare className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                                OTP sent via SMS
                              </p>
                              <p className="text-[10px] text-emerald-600/70 dark:text-emerald-500/70">
                                Check your phone for the 6-digit code. Valid for 5 minutes.
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Error */}
                      <AnimatePresence>
                        {error && (
                          <motion.p
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-md"
                          >
                            {error}
                          </motion.p>
                        )}
                      </AnimatePresence>

                      <Button
                        type="submit"
                        disabled={loading || otp.length < 6}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
                        size="lg"
                      >
                        {loading ? (
                          <span className="flex items-center gap-2">
                            <svg className="animate-spin size-4" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Verifying…
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <Shield className="size-4" />
                            Verify & Continue
                          </span>
                        )}
                      </Button>

                      {/* Resend / change number */}
                      <div className="flex items-center justify-between text-sm">
                        <button
                          type="button"
                          onClick={() => {
                            setOtp('');
                            setOtpSent(false);
                            setIsDemoMode(false);
                            setDemoOtp('');
                            setError('');
                          }}
                          className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-medium hover:underline underline-offset-4 transition-colors"
                        >
                          Change number
                        </button>
                        <button
                          type="button"
                          onClick={handleResendOtp}
                          disabled={resendCooldown > 0 || loading}
                          className={`font-medium transition-colors ${
                            resendCooldown > 0
                              ? 'text-muted-foreground cursor-not-allowed'
                              : 'text-muted-foreground hover:text-foreground hover:underline underline-offset-4'
                          }`}
                        >
                          {resendCooldown > 0 ? (
                            <span className="flex items-center gap-1.5">
                              <Clock className="size-3.5" />
                              Resend in {resendCooldown}s
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5">
                              <RefreshCw className="size-3.5" />
                              Resend OTP
                            </span>
                          )}
                        </button>
                      </div>
                    </form>
                  )}
                </motion.div>
              </AnimatePresence>
            </TabsContent>
          </Tabs>
        </div>

        {/* ── Privacy notice footer ── */}
        <DialogFooter className="px-6 pb-5 pt-0 sm:justify-center">
          <Separator className="mb-3" />
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground"
          >
            <Lock className="size-3 text-emerald-600 dark:text-emerald-400" />
            <span>Your Documents. Your Device. Your Privacy.</span>
          </motion.div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
