'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wrench,
  ExternalLink,
  MapPin,
  Phone,
  Clock,
  Building2,
  Globe,
  FileText,
  CheckCircle2,
  ArrowRight,
  AlertTriangle,
  Info,
} from 'lucide-react';

import { useAppStore, type DocIssue } from '@/lib/store';
import { GOVERNMENT_PORTALS, OFFLINE_CENTERS } from '@/lib/data';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

/* ──────────────────────── Animation helpers ──────────────────────── */

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.07 } },
};

const staggerItem = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

/* ──────────────────────── Severity config ──────────────────────── */

type SeverityLevel = DocIssue['severity'];

const severityConfig: Record<
  SeverityLevel,
  { label: string; color: string; bg: string; border: string }
> = {
  critical: {
    label: 'Critical',
    color: 'text-red-700 dark:text-red-400',
    bg: 'bg-red-100 dark:bg-red-900/30',
    border: 'border-red-300 dark:border-red-800',
  },
  high: {
    label: 'High',
    color: 'text-orange-700 dark:text-orange-400',
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    border: 'border-orange-300 dark:border-orange-800',
  },
  medium: {
    label: 'Medium',
    color: 'text-yellow-700 dark:text-yellow-400',
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    border: 'border-yellow-300 dark:border-yellow-800',
  },
  low: {
    label: 'Low',
    color: 'text-emerald-700 dark:text-emerald-400',
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    border: 'border-emerald-300 dark:border-emerald-800',
  },
};

/* ──────────────────────── Method badge config ──────────────────────── */

const methodConfig: Record<
  string,
  { label: string; icon: React.ElementType; color: string; bg: string }
> = {
  online: { label: 'Online', icon: Globe, color: 'text-teal-700 dark:text-teal-400', bg: 'bg-teal-100 dark:bg-teal-900/30' },
  offline: { label: 'Offline', icon: Building2, color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  both: { label: 'Online & Offline', icon: Wrench, color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
};

/* ──────────────────────── Common Corrections Guide ──────────────────────── */

interface CorrectionGuide {
  id: string;
  title: string;
  icon: string;
  steps: string[];
  portalName: string;
  portalUrl: string;
}

const COMMON_CORRECTIONS: CorrectionGuide[] = [
  {
    id: 'aadhaar',
    title: 'Correct Aadhaar Name / DOB',
    icon: '🆔',
    steps: [
      'Visit the UIDAI Self-Service Update Portal (ssup.uidai.gov.in)',
      'Login with your Aadhaar number and OTP verification',
      'Select the fields you want to update (Name, DOB, etc.)',
      'Upload supporting documents (for name: valid ID proof; for DOB: birth certificate)',
      'Submit and note the Update Request Number (URN)',
      'Track status online; typically processed in 30-90 days',
    ],
    portalName: 'UIDAI Self-Service Update Portal',
    portalUrl: 'https://ssup.uidai.gov.in',
  },
  {
    id: 'pan',
    title: 'Correct PAN Details',
    icon: '💳',
    steps: [
      'Go to NSDL e-Gov or UTIITSL PAN correction portal',
      'Select "Changes or Correction in existing PAN Data"',
      'Fill in your current PAN number and personal details',
      'Select fields to correct (Name, DOB, Father\'s name, etc.)',
      'Upload required proof documents and pay the fee (₹107 for Indian address / ₹989 for foreign)',
      'Submit and track using the 15-digit acknowledgment number',
    ],
    portalName: 'NSDL PAN Services',
    portalUrl: 'https://www.tin-nsdl.com',
  },
  {
    id: 'passport',
    title: 'Renew Passport',
    icon: '📘',
    steps: [
      'Register / Login on Passport Seva Online Portal',
      'Click "Apply for Fresh Passport / Re-issue of Passport"',
      'Fill the application form with required details',
      'Book an appointment at the nearest Passport Seva Kendra',
      'Visit the Kendra on appointment day with original documents and photocopies',
      'Police verification will follow; passport is dispatched after clearance',
    ],
    portalName: 'Passport Seva',
    portalUrl: 'https://www.passportindia.gov.in',
  },
  {
    id: 'driving-licence',
    title: 'Update Driving Licence',
    icon: '🚗',
    steps: [
      'Visit the Parivahan Sarathi portal',
      'Select your state and navigate to "Driving Licence" → "Services on DL"',
      'Enter your DL number and date of birth to fetch details',
      'Select the service required (Change of Address, Name correction, etc.)',
      'Upload supporting documents and pay the applicable fee',
      'Visit the RTO if biometric verification is required',
    ],
    portalName: 'Parivahan Sarathi',
    portalUrl: 'https://parivahan.gov.in',
  },
  {
    id: 'income-certificate',
    title: 'Get Income Certificate',
    icon: '💰',
    steps: [
      'Visit your state\'s e-District / ServiceOnline portal',
      'Register or login with your credentials',
      'Navigate to "Income Certificate" under certificate services',
      'Fill the application with income details, occupation, and family information',
      'Upload supporting documents (salary slip, IT return, self-declaration)',
      'Pay the fee and submit; collect from Tehsil office or download online',
    ],
    portalName: 'ServiceOnline Portal',
    portalUrl: 'https://serviceonline.gov.in',
  },
];

/* ════════════════════════════════════════════════════════════════════════════
   Correction Header
   ════════════════════════════════════════════════════════════════════════════ */

function CorrectionHeader({ openCount }: { openCount: number }) {
  return (
    <motion.div {...fadeInUp} transition={{ duration: 0.4 }}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-500/10 shadow-sm dark:bg-emerald-500/20">
            <Wrench className="size-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Correction Assistant
            </h2>
            <p className="text-sm text-muted-foreground">
              Get step-by-step guidance for correcting your document issues
            </p>
          </div>
        </div>
        {openCount > 0 && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 dark:border-amber-800 dark:bg-amber-900/20">
            <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" />
            <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
              {openCount} open issue{openCount !== 1 ? 's' : ''} need{openCount === 1 ? 's' : ''} attention
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   Open Issues Section
   ════════════════════════════════════════════════════════════════════════════ */

function OpenIssuesSection({
  issues,
  selectedIssueId,
  onSelectIssue,
}: {
  issues: DocIssue[];
  selectedIssueId: string | null;
  onSelectIssue: (id: string) => void;
}) {
  if (issues.length === 0) {
    return (
      <motion.div {...fadeInUp} transition={{ duration: 0.4, delay: 0.1 }}>
        <Card className="border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-900/10">
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <CheckCircle2 className="size-7 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold text-emerald-700 dark:text-emerald-400">
              All Clear!
            </h3>
            <p className="max-w-sm text-sm text-muted-foreground">
              No open issues found. Upload documents and run analysis to detect
              issues that need correction.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="size-5 text-amber-500" />
            Open Issues ({issues.length})
          </CardTitle>
          <CardDescription>
            Select an issue to view detailed correction steps
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {issues.map((issue) => {
            const sev = severityConfig[issue.severity];
            const isSelected = selectedIssueId === issue.id;
            return (
              <motion.div key={issue.id} variants={staggerItem}>
                <button
                  onClick={() => onSelectIssue(isSelected ? '' : issue.id)}
                  className={`
                    w-full text-left rounded-lg border p-3 transition-all duration-200
                    hover:shadow-md
                    ${isSelected
                      ? 'border-emerald-400 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-900/20 shadow-sm'
                      : 'border-border bg-card hover:border-emerald-300 dark:hover:border-emerald-800'
                    }
                  `}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-semibold px-1.5 py-0 ${sev.bg} ${sev.color} ${sev.border}`}
                        >
                          {sev.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {issue.category}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-foreground truncate">
                        {issue.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {issue.description}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant={isSelected ? 'default' : 'outline'}
                      className={`shrink-0 text-xs ${
                        isSelected
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-900/20'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectIssue(isSelected ? '' : issue.id);
                      }}
                    >
                      {isSelected ? 'Selected' : 'Fix This Issue'}
                      {!isSelected && <ArrowRight className="ml-1 size-3" />}
                    </Button>
                  </div>
                </button>
              </motion.div>
            );
          })}
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   Correction Steps (for selected issue)
   ════════════════════════════════════════════════════════════════════════════ */

function CorrectionSteps({ issue }: { issue: DocIssue }) {
  const updateIssue = useAppStore((s) => s.updateIssue);
  const guidance = issue.fixGuidance;

  if (!guidance) {
    return (
      <Card className="border-amber-200 dark:border-amber-800">
        <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
          <Info className="size-6 text-amber-500" />
          <p className="text-sm text-muted-foreground">
            Detailed correction steps are not available for this issue.
            Please consult the government portal links below for guidance.
          </p>
        </CardContent>
      </Card>
    );
  }

  const method = methodConfig[guidance.method] || methodConfig.both;
  const MethodIcon = method.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <Card className="border-emerald-200 dark:border-emerald-800">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Wrench className="size-5 text-emerald-600 dark:text-emerald-400" />
                Correction Steps
              </CardTitle>
              <CardDescription className="mt-1">{issue.title}</CardDescription>
            </div>
            <Badge
              variant="outline"
              className={`text-[10px] font-semibold shrink-0 ${method.bg} ${method.color}`}
            >
              <MethodIcon className="mr-1 size-3" />
              {method.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Required documents */}
          {guidance.requiredDocs.length > 0 && (
            <div>
              <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <FileText className="size-4 text-emerald-500" />
                Required Documents
              </h4>
              <ul className="grid gap-1.5 sm:grid-cols-2">
                {guidance.requiredDocs.map((doc, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 rounded-md border border-border/50 bg-muted/30 px-3 py-1.5 text-sm"
                  >
                    <CheckCircle2 className="size-3.5 shrink-0 text-emerald-500" />
                    <span>{doc}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Separator />

          {/* Step-by-step process */}
          {guidance.steps.length > 0 && (
            <div>
              <h4 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <ArrowRight className="size-4 text-emerald-500" />
                Step-by-Step Process
              </h4>
              <ol className="space-y-3">
                {guidance.steps.map((step, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.3 }}
                    className="flex gap-3"
                  >
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white shadow-sm shadow-emerald-500/25">
                      {i + 1}
                    </span>
                    <p className="pt-1 text-sm leading-relaxed text-foreground">
                      {step}
                    </p>
                  </motion.li>
                ))}
              </ol>
            </div>
          )}

          <Separator />

          {/* Info grid: fees, processing time, department, portal */}
          <div className="grid gap-3 sm:grid-cols-2">
            {/* Fees */}
            <div className="flex items-start gap-3 rounded-lg border border-border/50 p-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-emerald-100 dark:bg-emerald-900/30">
                <span className="text-sm">₹</span>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Fees</p>
                <p className="text-sm font-semibold text-foreground">
                  {guidance.fees}
                </p>
              </div>
            </div>

            {/* Processing time */}
            <div className="flex items-start gap-3 rounded-lg border border-border/50 p-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-teal-100 dark:bg-teal-900/30">
                <Clock className="size-4 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Estimated Processing Time
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {guidance.processingTime}
                </p>
              </div>
            </div>

            {/* Department */}
            <div className="flex items-start gap-3 rounded-lg border border-border/50 p-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-amber-100 dark:bg-amber-900/30">
                <Building2 className="size-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Government Department
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {guidance.department}
                </p>
              </div>
            </div>

            {/* Portal link */}
            {guidance.portalUrl && (
              <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 dark:border-emerald-800 dark:bg-emerald-900/10">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-emerald-100 dark:bg-emerald-900/30">
                  <Globe className="size-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">
                    Online Portal
                  </p>
                  <a
                    href={guidance.portalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                  >
                    {guidance.portalName || 'Visit Portal'}
                    <ExternalLink className="size-3" />
                  </a>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Mark as resolved */}
          <div className="flex justify-end">
            <Button
              onClick={() => updateIssue(issue.id, { status: 'resolved' })}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <CheckCircle2 className="mr-2 size-4" />
              Mark Issue as Resolved
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   Government Portal Links
   ════════════════════════════════════════════════════════════════════════════ */

function GovernmentPortalLinks() {
  return (
    <motion.div {...fadeInUp} transition={{ duration: 0.4, delay: 0.15 }}>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="size-5 text-teal-600 dark:text-teal-400" />
            Government Portal Links
          </CardTitle>
          <CardDescription>
            Direct access to official portals for document services
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {GOVERNMENT_PORTALS.map((portal, i) => (
              <motion.a
                key={portal.name}
                href={portal.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.3 }}
                className="group flex flex-col gap-2 rounded-lg border border-border/60 p-4 transition-all duration-200 hover:border-emerald-300 hover:shadow-md dark:hover:border-emerald-700"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{portal.icon}</span>
                  <span className="text-sm font-semibold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 line-clamp-1">
                    {portal.name}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {portal.description}
                </p>
                <span className="mt-auto inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  Visit Portal
                  <ExternalLink className="size-3 transition-transform group-hover:translate-x-0.5" />
                </span>
              </motion.a>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   Offline Service Centers
   ════════════════════════════════════════════════════════════════════════════ */

function OfflineServiceCenters() {
  return (
    <motion.div {...fadeInUp} transition={{ duration: 0.4, delay: 0.2 }}>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="size-5 text-red-500" />
            Offline Service Centers
          </CardTitle>
          <CardDescription>
            Visit these centers for in-person document services
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="w-full">
            {OFFLINE_CENTERS.map((center, i) => (
              <AccordionItem key={i} value={`center-${i}`}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2 text-left">
                    <Building2 className="size-4 shrink-0 text-emerald-500" />
                    <span className="text-sm font-medium">{center.name}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 pl-6">
                    <p className="text-sm text-muted-foreground">
                      {center.description}
                    </p>
                    <div>
                      <h5 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Services Offered
                      </h5>
                      <ul className="space-y-1">
                        {center.services.map((service, j) => (
                          <li
                            key={j}
                            className="flex items-center gap-2 text-sm"
                          >
                            <CheckCircle2 className="size-3.5 shrink-0 text-emerald-500" />
                            <span>{service}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50/50 p-2.5 dark:border-amber-800 dark:bg-amber-900/10">
                      <Info className="mt-0.5 size-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                      <p className="text-xs text-amber-700 dark:text-amber-300">
                        Contact your local office for exact address and hours.
                      </p>
                    </div>
                    {/* Maps placeholder card */}
                    <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MapPin className="size-4 text-red-500" />
                          <span className="text-sm text-muted-foreground">
                            Find nearby centers on Google Maps
                          </span>
                        </div>
                        <a
                          href={`https://www.google.com/maps/search/${encodeURIComponent(center.name + ' India')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-emerald-700"
                        >
                          Find on Maps
                          <ExternalLink className="size-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {/* General contact info */}
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-lg border border-border/50 p-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-emerald-100 dark:bg-emerald-900/30">
                <Phone className="size-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  UIDAI Helpline
                </p>
                <p className="text-sm font-semibold text-foreground">1947</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-border/50 p-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-teal-100 dark:bg-teal-900/30">
                <Clock className="size-4 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  CSC Helpdesk
                </p>
                <p className="text-sm font-semibold text-foreground">
                  1800-121-3456
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   Common Corrections Guide
   ════════════════════════════════════════════════════════════════════════════ */

function CommonCorrectionsGuide() {
  return (
    <motion.div {...fadeInUp} transition={{ duration: 0.4, delay: 0.25 }}>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="size-5 text-emerald-600 dark:text-emerald-400" />
            Common Corrections Guide
          </CardTitle>
          <CardDescription>
            Step-by-step instructions for frequently needed corrections
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="aadhaar" className="w-full">
            <TabsList className="mb-4 flex h-auto flex-wrap gap-1">
              {COMMON_CORRECTIONS.map((guide) => (
                <TabsTrigger
                  key={guide.id}
                  value={guide.id}
                  className="gap-1.5 text-xs data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-700 dark:data-[state=active]:bg-emerald-900/30 dark:data-[state=active]:text-emerald-400"
                >
                  <span>{guide.icon}</span>
                  <span className="hidden sm:inline">{guide.title}</span>
                  <span className="sm:hidden">
                    {guide.title.split(' ').slice(0, 2).join(' ')}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>

            {COMMON_CORRECTIONS.map((guide) => (
              <TabsContent key={guide.id} value={guide.id}>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{guide.icon}</span>
                    <h3 className="text-lg font-semibold text-foreground">
                      {guide.title}
                    </h3>
                  </div>

                  <ol className="space-y-3">
                    {guide.steps.map((step, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04, duration: 0.25 }}
                        className="flex gap-3"
                      >
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white shadow-sm shadow-emerald-500/25">
                          {i + 1}
                        </span>
                        <p className="pt-1 text-sm leading-relaxed text-foreground">
                          {step}
                        </p>
                      </motion.li>
                    ))}
                  </ol>

                  <Separator />

                  <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 dark:border-emerald-800 dark:bg-emerald-900/10">
                    <div className="flex items-center gap-2">
                      <Globe className="size-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-sm text-muted-foreground">
                        Start at {guide.portalName}
                      </span>
                    </div>
                    <a
                      href={guide.portalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-700"
                    >
                      Visit Portal
                      <ExternalLink className="size-3" />
                    </a>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   Main Component — CorrectionAssistant
   ════════════════════════════════════════════════════════════════════════════ */

export default function CorrectionAssistant() {
  const issues = useAppStore((s) => s.issues);
  const getOpenIssueCount = useAppStore((s) => s.getOpenIssueCount);

  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);

  const openIssues = useMemo(
    () => issues.filter((i) => i.status === 'open'),
    [issues]
  );

  const openCount = getOpenIssueCount();

  const selectedIssue = useMemo(
    () => issues.find((i) => i.id === selectedIssueId) || null,
    [issues, selectedIssueId]
  );

  const handleSelectIssue = (id: string) => {
    setSelectedIssueId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <CorrectionHeader openCount={openCount} />

      {/* Open issues + correction steps side by side on larger screens */}
      <div className="grid gap-6 lg:grid-cols-2">
        <OpenIssuesSection
          issues={openIssues}
          selectedIssueId={selectedIssueId}
          onSelectIssue={handleSelectIssue}
        />
        <AnimatePresence mode="wait">
          {selectedIssue ? (
            <CorrectionSteps key={selectedIssue.id} issue={selectedIssue} />
          ) : (
            <motion.div
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="flex h-full flex-col items-center justify-center border-dashed border-2 border-border/50 bg-muted/20">
                <CardContent className="py-16 text-center">
                  <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                    <Wrench className="size-7 text-emerald-500/60 dark:text-emerald-400/60" />
                  </div>
                  <h3 className="text-base font-semibold text-muted-foreground">
                    Select an Issue
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground/70">
                    Choose an issue from the list to view detailed correction steps
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Government Portal Links */}
      <GovernmentPortalLinks />

      {/* Offline Service Centers */}
      <OfflineServiceCenters />

      {/* Common Corrections Guide */}
      <CommonCorrectionsGuide />
    </div>
  );
}
