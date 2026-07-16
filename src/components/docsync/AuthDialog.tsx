'use client';

import { useState, useCallback } from 'react';
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

  /* ── derived ── */
  const isLogin = authMode === 'login';

  /* ── reset form state when dialog closes or mode changes ── */
  const resetForm = useCallback(() => {
    setEmail('');
    setPassword('');
    setName('');
    setPhone('');
    setOtp('');
    setOtpSent(false);
    setError('');
    setShowPassword(false);
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

  /* ────────────────── Mobile OTP flow ────────────────── */

  const handleSendOtp = async () => {
    setError('');
    if (!phone || phone.length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    setLoading(true);
    try {
      await authFetch('otp-login', { phone });
      setOtpSent(true);
    } catch (err: unknown) {
      // Demo fallback: even if API fails, allow OTP flow for demo purposes
      setOtpSent(true);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Demo: accept "123456"
    if (otp === '123456') {
      const user: UserProfile = {
        id: crypto.randomUUID(),
        email: '',
        name: phone,
        phone,
      };
      login(user);
      resetForm();
      return;
    }

    setLoading(true);
    try {
      const data = await authFetch('verify-otp', { phone, otp });
      const user: UserProfile = {
        id: data.user?.id || crypto.randomUUID(),
        email: data.user?.email || '',
        name: data.user?.name || phone,
        phone,
      };
      login(user);
      resetForm();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid OTP. Try again.');
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
                  key={otpSent ? 'otp' : 'phone'}
                  variants={formVariant}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  {!otpSent ? (
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
                            Send OTP
                            <ArrowRight className="size-4" />
                          </span>
                        )}
                      </Button>
                    </div>
                  ) : (
                    /* ── OTP verification ── */
                    <form onSubmit={handleVerifyOtp} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="auth-otp" className="text-sm font-medium">
                          Enter OTP
                        </Label>
                        <div className="relative">
                          <Shield className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                          <Input
                            id="auth-otp"
                            type="text"
                            inputMode="numeric"
                            placeholder="6-digit OTP"
                            maxLength={6}
                            value={otp}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                              setOtp(val);
                            }}
                            className="pl-10 tracking-[0.3em] text-center font-mono text-lg"
                            required
                            autoFocus
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          OTP sent to +91 {phone}
                        </p>
                      </div>

                      {/* Demo hint */}
                      <Card className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
                        <CardContent className="px-3 py-2 flex items-start gap-2">
                          <span className="text-amber-600 text-sm mt-0.5">💡</span>
                          <p className="text-xs text-amber-700 dark:text-amber-400">
                            <strong>Demo Mode:</strong> Enter <code className="bg-amber-100 dark:bg-amber-900/50 px-1.5 py-0.5 rounded font-mono font-bold">123456</code> as demo OTP
                          </p>
                        </CardContent>
                      </Card>

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
                            Verify & Continue
                            <ArrowRight className="size-4" />
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
                            setError('');
                          }}
                          className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-medium hover:underline underline-offset-4 transition-colors"
                        >
                          Change number
                        </button>
                        <button
                          type="button"
                          onClick={handleSendOtp}
                          className="text-muted-foreground hover:text-foreground font-medium hover:underline underline-offset-4 transition-colors"
                        >
                          Resend OTP
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
