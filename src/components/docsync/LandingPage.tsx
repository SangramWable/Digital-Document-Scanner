'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  Shield,
  FileText,
  Scan,
  GitCompare,
  AlertTriangle,
  GraduationCap,
  Building2,
  Upload,
  CheckCircle2,
  ArrowRight,
  Lock,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/lib/store';

interface LandingPageProps {
  onGetStarted: () => void;
}

/* ──────────────────────────── Animation helpers ──────────────────────────── */

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

/* ──────────────────────────── Animated counter ──────────────────────────── */

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 1800;
    const stepTime = 16;
    const steps = Math.ceil(duration / stepTime);
    const increment = target / steps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [inView, target]);

  return (
    <span ref={ref}>
      {count.toLocaleString('en-IN')}
      {suffix}
    </span>
  );
}

/* ──────────────────────────── Data ──────────────────────────── */

const features = [
  {
    icon: Scan,
    title: 'Smart OCR Extraction',
    description: 'AI-powered text extraction from any Indian government document with 99%+ accuracy across Hindi, English & regional languages.',
    color: 'from-emerald-500 to-teal-500',
    bgGlow: 'bg-emerald-500/10',
  },
  {
    icon: GitCompare,
    title: 'Document Comparison',
    description: 'Instantly cross-verify details across Aadhaar, PAN, Voter ID & more to catch mismatches before they cause rejections.',
    color: 'from-teal-500 to-sky-500',
    bgGlow: 'bg-teal-500/10',
  },
  {
    icon: AlertTriangle,
    title: 'AI Issue Detection',
    description: 'Automatically detect errors, inconsistencies, and potential issues in your documents with severity grading.',
    color: 'from-amber-500 to-orange-500',
    bgGlow: 'bg-amber-500/10',
  },
  {
    icon: FileText,
    title: 'Correction Assistant',
    description: 'Step-by-step guidance to fix document issues with direct links to government portals and fee details.',
    color: 'from-sky-500 to-blue-500',
    bgGlow: 'bg-sky-500/10',
  },
  {
    icon: GraduationCap,
    title: 'Scholarship Checker',
    description: 'Find scholarships you qualify for based on your profile, category, income & academic records.',
    color: 'from-emerald-500 to-cyan-500',
    bgGlow: 'bg-emerald-500/10',
  },
  {
    icon: Building2,
    title: 'Government Scheme Finder',
    description: 'Discover central & state government schemes, subsidies and benefits tailored to your eligibility.',
    color: 'from-teal-500 to-emerald-500',
    bgGlow: 'bg-teal-500/10',
  },
];

const howItWorks = [
  {
    step: 1,
    icon: Upload,
    title: 'Upload',
    description: 'Upload your government documents — Aadhaar, PAN, Voter ID, Driving License, and more. All processing stays on your device.',
  },
  {
    step: 2,
    icon: Eye,
    title: 'Verify',
    description: 'Our AI extracts data, cross-verifies across documents, and flags any mismatches or issues instantly.',
  },
  {
    step: 3,
    icon: CheckCircle2,
    title: 'Resolve',
    description: 'Get guided corrections with portal links, fee details, and step-by-step instructions to fix every issue.',
  },
];

const supportedDocs = [
  'Aadhaar Card',
  'PAN Card',
  'Voter ID',
  'Passport',
  'Driving License',
  'Ration Card',
  'Domicile Certificate',
  'Caste Certificate',
  'Income Certificate',
  'Birth Certificate',
  'Bank Passbook',
  'Character Certificate',
  'Marksheet / Degree',
  'Property Documents',
  'GST Certificate',
  'Udyam Registration',
  'ESIC Card',
  'EPFO Passbook',
];

const stats = [
  { value: 15, suffix: 'L+', label: 'Documents Verified' },
  { value: 98, suffix: '%', label: 'OCR Accuracy' },
  { value: 500, suffix: '+', label: 'Schemes Covered' },
  { value: 35, suffix: '+', label: 'States & UTs' },
];

const govPortals = [
  { name: 'Aadhaar (UIDAI)', url: 'https://uidai.gov.in' },
  { name: 'PAN (NSDL)', url: 'https://www.onlineservices.nsdl.com' },
  { name: 'Passport Seva', url: 'https://www.passportindia.gov.in' },
  { name: 'DigiLocker', url: 'https://www.digilocker.gov.in' },
  { name: 'mParivahan', url: 'https://parivahan.gov.in' },
  { name: 'UMANG', url: 'https://web.umang.gov.in' },
  { name: 'MyGov', url: 'https://www.mygov.in' },
  { name: 'National Scholarship Portal', url: 'https://scholarships.gov.in' },
];

/* ══════════════════════════ Main Component ══════════════════════════ */

export default function LandingPage({ onGetStarted }: LandingPageProps) {
  useAppStore();

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-white dark:bg-slate-950">
      {/* ───────────── Navbar ───────────── */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-50 w-full border-b border-slate-200/60 bg-white/80 dark:border-slate-800/60 dark:bg-slate-950/80 backdrop-blur-xl"
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md shadow-emerald-500/20">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              DocSync <span className="text-emerald-600 dark:text-emerald-400">India</span>
            </span>
          </div>

          <div className="hidden items-center gap-6 md:flex">
            {['Features', 'How It Works', 'Documents', 'Schemes'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                className="text-sm font-medium text-slate-600 transition-colors hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400"
              >
                {item}
              </a>
            ))}
          </div>

          <Button
            onClick={onGetStarted}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-700 hover:to-teal-700"
          >
            Get Started <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </motion.nav>

      {/* ───────────── Hero ───────────── */}
      <section className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-emerald-400/20 to-teal-400/10 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-sky-400/20 to-cyan-400/10 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-teal-400/10 to-emerald-400/5 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 sm:pb-28 sm:pt-24 lg:px-8">
          <div className="flex flex-col items-center text-center">
            {/* Privacy badge */}
            <motion.div
              custom={0}
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
            >
              <Badge
                className="mb-6 gap-1.5 border-emerald-200 bg-emerald-50 px-4 py-1.5 text-sm font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
              >
                <Lock className="h-3.5 w-3.5" />
                Your Documents. Your Device. Your Privacy.
              </Badge>
            </motion.div>

            {/* Main heading */}
            <motion.h1
              custom={1}
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-6xl"
            >
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 bg-clip-text text-transparent">
                DocSync India
              </span>
            </motion.h1>

            <motion.p
              custom={2}
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              className="mx-auto mt-5 max-w-2xl text-lg text-slate-600 dark:text-slate-400 sm:text-xl"
            >
              AI-Powered Government Document Verification &amp; Assistance System
            </motion.p>

            <motion.p
              custom={3}
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              className="mx-auto mt-3 max-w-xl text-base text-slate-500 dark:text-slate-500"
            >
              Verify, compare, and fix your government documents with AI — everything stays on your device, nothing leaves your browser.
            </motion.p>

            {/* CTA */}
            <motion.div
              custom={4}
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              className="mt-10 flex flex-col items-center gap-4 sm:flex-row"
            >
              <Button
                onClick={onGetStarted}
                size="lg"
                className="h-12 gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 px-8 text-base font-semibold text-white shadow-xl shadow-emerald-500/25 transition-all hover:from-emerald-700 hover:to-teal-700 hover:shadow-emerald-500/40 hover:scale-[1.02]"
              >
                Get Started <ArrowRight className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-12 gap-2 border-slate-300 px-8 text-base font-semibold dark:border-slate-700"
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Learn More
              </Button>
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              custom={5}
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              className="mt-14 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500 dark:text-slate-500"
            >
              <span className="flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-emerald-500" /> 100% Client-Side
              </span>
              <span className="flex items-center gap-1.5">
                <Lock className="h-4 w-4 text-teal-500" /> Zero Data Upload
              </span>
              <span className="flex items-center gap-1.5">
                <Eye className="h-4 w-4 text-sky-500" /> Open &amp; Transparent
              </span>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ───────────── Features ───────────── */}
      <section id="features" className="relative py-20 sm:py-28">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-50/80 via-transparent to-slate-50/80 dark:from-slate-900/50 dark:via-transparent dark:to-slate-900/50" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            badge="Features"
            title="Everything you need for document verification"
            subtitle="Six powerful AI-driven tools to ensure your government documents are accurate, consistent, and compliant."
          />

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {features.map((f) => (
              <motion.div key={f.title} variants={staggerItem}>
                <Card className="group relative h-full overflow-hidden border-slate-200/80 bg-white/60 backdrop-blur-lg transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/5 hover:border-emerald-200/60 dark:border-slate-800/80 dark:bg-slate-900/40 dark:hover:border-emerald-700/40">
                  {/* Glow */}
                  <div className={`absolute -top-20 -right-20 h-40 w-40 rounded-full ${f.bgGlow} blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100`} />

                  <CardHeader className="relative">
                    <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${f.color} shadow-lg`}>
                      <f.icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-lg text-slate-900 dark:text-white">{f.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="relative">
                    <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                      {f.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ───────────── How It Works ───────────── */}
      <section id="how-it-works" className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            badge="How It Works"
            title="Three simple steps"
            subtitle="From upload to resolution — your documents verified and corrected in minutes, not days."
          />

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            className="mt-14 grid gap-8 md:grid-cols-3"
          >
            {howItWorks.map((s, i) => (
              <motion.div key={s.step} variants={staggerItem} className="relative flex flex-col items-center text-center">
                {/* Connector line (desktop) */}
                {i < howItWorks.length - 1 && (
                  <div className="absolute top-10 left-[calc(50%+40px)] hidden h-[2px] w-[calc(100%-80px)] bg-gradient-to-r from-emerald-300 to-teal-300 dark:from-emerald-700 dark:to-teal-700 md:block" />
                )}

                <div className="relative mb-5">
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-xl shadow-emerald-500/20">
                    <s.icon className="h-9 w-9 text-white" />
                  </div>
                  <span className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs font-bold text-emerald-600 shadow-md ring-2 ring-emerald-200 dark:bg-slate-900 dark:text-emerald-400 dark:ring-emerald-800">
                    {s.step}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{s.title}</h3>
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {s.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ───────────── Supported Documents ───────────── */}
      <section id="documents" className="relative py-20 sm:py-28">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-50/80 via-transparent to-slate-50/80 dark:from-slate-900/50 dark:via-transparent dark:to-slate-900/50" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            badge="Supported Documents"
            title="All major Indian government documents"
            subtitle="DocSync works with the documents you already have — from identity cards to property papers."
          />

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            className="mt-12 flex flex-wrap justify-center gap-3"
          >
            {supportedDocs.map((doc) => (
              <motion.div key={doc} variants={staggerItem}>
                <Badge
                  variant="outline"
                  className="gap-1.5 rounded-full border-slate-300 bg-white/70 px-4 py-2 text-sm font-medium text-slate-700 backdrop-blur-sm transition-all hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:border-emerald-600 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300"
                >
                  <FileText className="h-3.5 w-3.5" />
                  {doc}
                </Badge>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ───────────── Statistics ───────────── */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-sky-700 p-[1px]">
            <div className="rounded-3xl bg-gradient-to-br from-emerald-600/95 via-teal-600/95 to-sky-700/95 px-6 py-14 backdrop-blur sm:px-12 sm:py-20">
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-60px' }}
                className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4"
              >
                {stats.map((s) => (
                  <motion.div
                    key={s.label}
                    variants={staggerItem}
                    className="flex flex-col items-center text-center"
                  >
                    <span className="text-4xl font-extrabold text-white sm:text-5xl">
                      <AnimatedCounter target={s.value} suffix={s.suffix} />
                    </span>
                    <span className="mt-2 text-sm font-medium text-emerald-100/80">{s.label}</span>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── Government Portal Links ───────────── */}
      <section id="schemes" className="relative py-20 sm:py-28">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-50/80 via-transparent to-slate-50/80 dark:from-slate-900/50 dark:via-transparent dark:to-slate-900/50" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            badge="Government Portals"
            title="Quick access to key portals"
            subtitle="Direct links to the most-used Indian government services — verified and up-to-date."
          />

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            {govPortals.map((p) => (
              <motion.div key={p.name} variants={staggerItem}>
                <a
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white/60 p-4 backdrop-blur-lg transition-all hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-500/5 dark:border-slate-800/80 dark:bg-slate-900/40 dark:hover:border-emerald-700/40"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 shadow-md shadow-emerald-500/20">
                    <Building2 className="h-5 w-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{p.name}</p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-500">{p.url.replace('https://', '')}</p>
                  </div>
                  <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-emerald-500" />
                </a>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ───────────── CTA ───────────── */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
            className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/60 p-10 text-center backdrop-blur-lg dark:border-slate-800/80 dark:bg-slate-900/40 sm:p-16"
          >
            {/* Decorative blurs */}
            <div className="pointer-events-none absolute -top-20 -left-20 h-60 w-60 rounded-full bg-emerald-400/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-sky-400/20 blur-3xl" />

            <div className="relative">
              <Badge className="mb-5 gap-1.5 border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                <Lock className="h-3 w-3" /> Privacy-First Design
              </Badge>

              <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white sm:text-4xl">
                Ready to verify your documents?
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-base text-slate-600 dark:text-slate-400">
                Start with zero setup. No sign-up required for basic features. Your data never leaves your browser.
              </p>

              <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Button
                  onClick={onGetStarted}
                  size="lg"
                  className="h-12 gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 px-10 text-base font-semibold text-white shadow-xl shadow-emerald-500/25 transition-all hover:from-emerald-700 hover:to-teal-700 hover:shadow-emerald-500/40 hover:scale-[1.02]"
                >
                  Get Started <ArrowRight className="h-5 w-5" />
                </Button>
              </div>

              <p className="mt-5 text-xs text-slate-500 dark:text-slate-600">
                Free to use &middot; No data stored on servers &middot; Open source
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ───────────── Footer ───────────── */}
      <footer className="border-t border-slate-200/60 bg-slate-50 dark:border-slate-800/60 dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
            {/* Brand */}
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
                <Shield className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                DocSync <span className="text-emerald-600 dark:text-emerald-400">India</span>
              </span>
            </div>

            {/* Privacy notice */}
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-500">
              <Lock className="h-3.5 w-3.5 text-emerald-500" />
              <span>
                All document processing happens locally on your device. No data is transmitted to any server. Your privacy is guaranteed.
              </span>
            </div>

            {/* Copyright */}
            <p className="text-xs text-slate-400 dark:text-slate-600">
              &copy; {new Date().getFullYear()} DocSync India
            </p>
          </div>

          <div className="mt-6 border-t border-slate-200/60 pt-6 dark:border-slate-800/60">
            <p className="text-center text-xs leading-relaxed text-slate-400 dark:text-slate-600">
              DocSync India is not affiliated with, endorsed by, or connected to any government body. All government portal links are provided for convenience only.
              Document processing is powered by client-side AI. Please verify critical information with official sources.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ──────────────────────────── Reusable Section Heading ──────────────────────────── */

function SectionHeading({
  badge,
  title,
  subtitle,
}: {
  badge: string;
  title: string;
  subtitle: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
      className="text-center"
    >
      <Badge
        variant="outline"
        className="mb-4 gap-1.5 rounded-full border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
      >
        {badge}
      </Badge>
      <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
        {title}
      </h2>
      <p className="mx-auto mt-3 max-w-2xl text-base text-slate-600 dark:text-slate-400">
        {subtitle}
      </p>
    </motion.div>
  );
}
