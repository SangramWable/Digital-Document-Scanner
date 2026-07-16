'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  GraduationCap,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  ArrowRight,
} from 'lucide-react';

import { useAppStore } from '@/lib/store';
import { SCHOLARSHIPS, DOCUMENT_TYPES } from '@/lib/data';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

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

/* ──────────────────────── Helpers ──────────────────────── */

function getDocLabel(docType: string): string {
  const found = DOCUMENT_TYPES.find((d) => d.value === docType);
  return found ? found.label : docType;
}

/* ════════════════════════════════════════════════════════════════════════════
   ScholarshipAssistant
   ════════════════════════════════════════════════════════════════════════════ */

export default function ScholarshipAssistant() {
  const documents = useAppStore((s) => s.documents);
  const setCurrentView = useAppStore((s) => s.setCurrentView);

  /* ── Set of doc types the user has uploaded ── */
  const uploadedDocTypes = useMemo(() => {
    return new Set(documents.map((d) => d.docType));
  }, [documents]);

  /* ── Per-scholarship readiness data ── */
  const scholarshipData = useMemo(() => {
    return SCHOLARSHIPS.map((sch) => {
      const requiredDocs = sch.requiredDocs as readonly string[];
      const uploaded = requiredDocs.filter((doc) => uploadedDocTypes.has(doc));
      const missing = requiredDocs.filter((doc) => !uploadedDocTypes.has(doc));
      const readiness = requiredDocs.length > 0
        ? Math.round((uploaded.length / requiredDocs.length) * 100)
        : 0;

      return {
        ...sch,
        requiredDocsList: requiredDocs,
        uploadedDocs: uploaded,
        missingDocs: missing,
        readiness,
      };
    });
  }, [uploadedDocTypes]);

  /* ── Overall readiness ── */
  const overallReadiness = useMemo(() => {
    if (scholarshipData.length === 0) return 0;
    const total = scholarshipData.reduce((sum, s) => sum + s.readiness, 0);
    return Math.round(total / scholarshipData.length);
  }, [scholarshipData]);

  /* ── All missing docs across scholarships ── */
  const allMissingDocs = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const sch of scholarshipData) {
      for (const doc of sch.missingDocs) {
        const existing = map.get(doc) || [];
        existing.push(sch.name);
        map.set(doc, existing);
      }
    }
    return Array.from(map.entries()).map(([docType, scholarships]) => ({
      docType,
      label: getDocLabel(docType),
      scholarships,
    }));
  }, [scholarshipData]);

  /* ── Readiness color helper ── */
  function readinessColor(pct: number): string {
    if (pct >= 80) return 'text-emerald-600 dark:text-emerald-400';
    if (pct >= 50) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-500 dark:text-red-400';
  }

  function progressClass(pct: number): string {
    if (pct >= 80) return '[&>div]:bg-emerald-500';
    if (pct >= 50) return '[&>div]:bg-amber-500';
    return '[&>div]:bg-red-500';
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      {/* ─── Header ─── */}
      <motion.div
        {...fadeInUp}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10">
            <GraduationCap className="size-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Scholarship Assistant
            </h2>
            <p className="text-sm text-muted-foreground">
              Check if you have the required documents for various scholarships and track your readiness
            </p>
          </div>
        </div>
      </motion.div>

      {/* ─── Overall Readiness Summary ─── */}
      <motion.div
        {...fadeInUp}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="mb-8"
      >
        <Card className="border-emerald-500/20 bg-gradient-to-r from-emerald-500/5 via-card to-emerald-500/5">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-full bg-emerald-500/10">
                  <GraduationCap className="size-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Overall Scholarship Readiness</p>
                  <p className={`text-3xl font-bold ${readinessColor(overallReadiness)}`}>
                    {overallReadiness}%
                  </p>
                </div>
              </div>
              <div className="flex-1 max-w-md">
                <Progress
                  value={overallReadiness}
                  className={`h-3 ${progressClass(overallReadiness)}`}
                />
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{documents.length} document{documents.length !== 1 ? 's' : ''} uploaded</span>
                  <span>
                    {allMissingDocs.length} missing document{allMissingDocs.length !== 1 ? 's' : ''} across all scholarships
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── Scholarship Cards Grid ─── */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid gap-6 sm:grid-cols-2 mb-8"
      >
        {scholarshipData.map((sch) => (
          <motion.div key={sch.id} variants={staggerItem}>
            <Card className="h-full hover:shadow-md transition-shadow duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{sch.name}</CardTitle>
                    <CardDescription className="mt-1 text-xs leading-relaxed">
                      {sch.description}
                    </CardDescription>
                  </div>
                  <div className={`shrink-0 text-right`}>
                    <p className={`text-2xl font-bold ${readinessColor(sch.readiness)}`}>
                      {sch.readiness}%
                    </p>
                    <p className="text-[10px] text-muted-foreground">ready</p>
                  </div>
                </div>
                {/* Category badges */}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {(sch.category as readonly string[]).map((cat) => (
                    <Badge
                      key={cat}
                      variant="secondary"
                      className="text-[10px] px-2 py-0 h-5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20"
                    >
                      {cat}
                    </Badge>
                  ))}
                </div>
              </CardHeader>

              <CardContent className="pt-0 space-y-4">
                {/* Progress bar */}
                <Progress
                  value={sch.readiness}
                  className={`h-2 ${progressClass(sch.readiness)}`}
                />

                {/* Document checklist */}
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Required Documents
                  </p>
                  <div className="space-y-1">
                    {sch.requiredDocsList.map((docType) => {
                      const isUploaded = uploadedDocTypes.has(docType);
                      return (
                        <div
                          key={docType}
                          className={`flex items-center gap-2 rounded-md px-2 py-1 text-sm transition-colors ${
                            isUploaded
                              ? 'bg-emerald-500/5 text-emerald-700 dark:text-emerald-300'
                              : 'bg-red-500/5 text-red-600 dark:text-red-400'
                          }`}
                        >
                          {isUploaded ? (
                            <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
                          ) : (
                            <XCircle className="size-4 shrink-0 text-red-500" />
                          )}
                          <span className="truncate">{getDocLabel(docType)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <Separator />

                {/* Apply Now link */}
                <Button
                  variant={sch.readiness === 100 ? 'default' : 'outline'}
                  size="sm"
                  className={`w-full gap-2 ${
                    sch.readiness === 100
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'hover:border-emerald-500/50 hover:text-emerald-600'
                  }`}
                  asChild
                >
                  <a
                    href="https://scholarships.gov.in"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Apply Now
                    <ArrowRight className="size-3.5" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* ─── Missing Documents List ─── */}
      {allMissingDocs.length > 0 && (
        <motion.div
          {...fadeInUp}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card className="border-amber-500/20">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="size-5 text-amber-500" />
                <CardTitle className="text-lg">Missing Documents</CardTitle>
              </div>
              <CardDescription>
                Upload these documents to improve your scholarship readiness
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {allMissingDocs.map((item) => (
                <div
                  key={item.docType}
                  className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-border/50 bg-muted/30 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-md bg-red-500/10">
                      <FileText className="size-4 text-red-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground">
                        Required for: {item.scholarships.join(', ')}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs shrink-0 hover:border-emerald-500/50 hover:text-emerald-600"
                    onClick={() => setCurrentView('documents')}
                  >
                    Upload Missing Document
                    <ArrowRight className="size-3" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ─── Empty state ─── */}
      {documents.length === 0 && (
        <motion.div
          {...fadeInUp}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="mt-6"
        >
          <Card className="border-dashed border-2 border-border/50">
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="flex size-14 items-center justify-center rounded-full bg-muted">
                <GraduationCap className="size-7 text-muted-foreground" />
              </div>
              <p className="text-base font-medium text-foreground">No Documents Uploaded Yet</p>
              <p className="text-sm text-muted-foreground max-w-sm">
                Upload your documents first to check scholarship eligibility and track your readiness percentage.
              </p>
              <Button
                className="mt-2 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => setCurrentView('documents')}
              >
                <FileText className="size-4" />
                Go to Documents
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
