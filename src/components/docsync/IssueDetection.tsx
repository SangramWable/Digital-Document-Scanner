'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  XCircle,
  CheckCircle2,
  Shield,
  RefreshCw,
  Wrench,
  ChevronDown,
  ChevronUp,
  Filter,
  Loader2,
} from 'lucide-react';

import { useAppStore, type DocIssue, type FixGuidance } from '@/lib/store';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';

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

interface SeverityConfig {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  badgeClass: string;
  icon: React.ElementType;
  ringColor: string;
}

const SEVERITY_CONFIG: Record<SeverityLevel, SeverityConfig> = {
  critical: {
    label: 'Critical',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950/40',
    borderColor: 'border-red-200 dark:border-red-800',
    badgeClass:
      'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800',
    icon: XCircle,
    ringColor: 'ring-red-500/30',
  },
  high: {
    label: 'High',
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-950/40',
    borderColor: 'border-orange-200 dark:border-orange-800',
    badgeClass:
      'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/50 dark:text-orange-300 dark:border-orange-800',
    icon: AlertTriangle,
    ringColor: 'ring-orange-500/30',
  },
  medium: {
    label: 'Medium',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950/40',
    borderColor: 'border-amber-200 dark:border-amber-800',
    badgeClass:
      'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-800',
    icon: AlertCircle,
    ringColor: 'ring-amber-500/30',
  },
  low: {
    label: 'Low',
    color: 'text-teal-600 dark:text-teal-400',
    bgColor: 'bg-teal-50 dark:bg-teal-950/40',
    borderColor: 'border-teal-200 dark:border-teal-800',
    badgeClass:
      'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/50 dark:text-teal-300 dark:border-teal-800',
    icon: Info,
    ringColor: 'ring-teal-500/30',
  },
};

/* ──────────────────────── Category display map ──────────────────────── */

const CATEGORY_LABELS: Record<string, string> = {
  dob_mismatch: 'DOB Mismatch',
  name_mismatch: 'Name Mismatch',
  address_mismatch: 'Address Mismatch',
  gender_mismatch: 'Gender Mismatch',
  father_name_mismatch: "Father's Name Mismatch",
  mother_name_mismatch: "Mother's Name Mismatch",
  expired: 'Expired Document',
  missing: 'Missing Document',
  invalid_format: 'Invalid Format',
  ocr_error: 'OCR Error',
};

/* ──────────────────────── Status config ──────────────────────── */

type IssueStatus = DocIssue['status'];

interface StatusConfig {
  label: string;
  badgeClass: string;
  icon: React.ElementType;
}

const STATUS_CONFIG: Record<IssueStatus, StatusConfig> = {
  open: {
    label: 'Open',
    badgeClass:
      'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800',
    icon: XCircle,
  },
  resolved: {
    label: 'Resolved',
    badgeClass:
      'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800',
    icon: CheckCircle2,
  },
  dismissed: {
    label: 'Dismissed',
    badgeClass:
      'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800/40 dark:text-gray-400 dark:border-gray-700',
    icon: AlertCircle,
  },
};

/* ──────────────────────── Method badge ──────────────────────── */

function MethodBadge({ method }: { method: FixGuidance['method'] }) {
  const cls =
    method === 'online'
      ? 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/40 dark:text-sky-300 dark:border-sky-800'
      : method === 'offline'
        ? 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/40 dark:text-violet-300 dark:border-violet-800'
        : 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800';

  return (
    <Badge variant="outline" className={`text-[10px] font-semibold uppercase ${cls}`}>
      {method}
    </Badge>
  );
}

/* ──────────────────────── Fix Guidance Dialog ──────────────────────── */

function FixGuidanceDialog({
  issue,
  open,
  onOpenChange,
  onGoToCorrection,
}: {
  issue: DocIssue | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGoToCorrection: () => void;
}) {
  if (!issue || !issue.fixGuidance) return null;

  const fg = issue.fixGuidance;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="size-5 text-emerald-500" />
            Fix Guidance
          </DialogTitle>
          <DialogDescription className="text-left">
            {issue.title}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-5 pr-2">
            {/* Required Documents */}
            <div>
              <h4 className="mb-2 text-sm font-semibold text-foreground">
                Required Documents
              </h4>
              <ul className="space-y-1">
                {fg.requiredDocs.map((doc, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                      {i + 1}
                    </span>
                    {doc}
                  </li>
                ))}
              </ul>
            </div>

            <Separator />

            {/* Method & Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="mb-1 text-xs font-medium text-muted-foreground">Method</h4>
                <MethodBadge method={fg.method} />
              </div>
              <div>
                <h4 className="mb-1 text-xs font-medium text-muted-foreground">Fees</h4>
                <span className="text-sm font-medium text-foreground">{fg.fees}</span>
              </div>
              <div>
                <h4 className="mb-1 text-xs font-medium text-muted-foreground">Processing Time</h4>
                <span className="text-sm font-medium text-foreground">{fg.processingTime}</span>
              </div>
              <div>
                <h4 className="mb-1 text-xs font-medium text-muted-foreground">Department</h4>
                <span className="text-sm font-medium text-foreground">{fg.department}</span>
              </div>
            </div>

            <Separator />

            {/* Step-by-step process */}
            <div>
              <h4 className="mb-2 text-sm font-semibold text-foreground">
                Step-by-step Process
              </h4>
              <ol className="space-y-2">
                {fg.steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
                      {i + 1}
                    </span>
                    <span className="pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Portal link */}
            {fg.portalUrl && (
              <>
                <Separator />
                <div>
                  <h4 className="mb-1 text-xs font-medium text-muted-foreground">Online Portal</h4>
                  <a
                    href={fg.portalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:underline dark:text-emerald-400 dark:hover:text-emerald-300"
                  >
                    {fg.portalName || fg.portalUrl}
                    <span className="text-[10px]">&#8599;</span>
                  </a>
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            onClick={() => {
              onOpenChange(false);
              onGoToCorrection();
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Wrench className="mr-2 size-4" />
            Go to Correction Assistant
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ──────────────────────── Issue Card ──────────────────────── */

function IssueCard({
  issue,
  onFix,
  onStatusChange,
}: {
  issue: DocIssue;
  onFix: (issue: DocIssue) => void;
  onStatusChange: (id: string, status: IssueStatus) => void;
}) {
  const [expandedSection, setExpandedSection] = useState<'impact' | 'fix' | null>(null);

  const severity = SEVERITY_CONFIG[issue.severity];
  const SevIcon = severity.icon;
  const statusConf = STATUS_CONFIG[issue.status];
  const StatusIcon = statusConf.icon;
  const categoryLabel = CATEGORY_LABELS[issue.category] || issue.category;

  const toggleSection = (section: 'impact' | 'fix') => {
    setExpandedSection((prev) => (prev === section ? null : section));
  };

  const createdDate = new Date(issue.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <motion.div variants={staggerItem}>
      <Card className={`overflow-hidden border ${severity.borderColor} transition-shadow hover:shadow-md`}>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {/* Severity badge */}
              <Badge variant="outline" className={`gap-1 font-semibold ${severity.badgeClass}`}>
                <SevIcon className="size-3.5" />
                {severity.label}
              </Badge>

              {/* Category badge */}
              <Badge variant="outline" className="bg-muted/50 text-muted-foreground border-border text-xs">
                {categoryLabel}
              </Badge>

              {/* Status badge */}
              <Badge variant="outline" className={`gap-1 text-xs ${statusConf.badgeClass}`}>
                <StatusIcon className="size-3" />
                {statusConf.label}
              </Badge>
            </div>

            <span className="text-xs text-muted-foreground">{createdDate}</span>
          </div>

          <CardTitle className="mt-2 text-base leading-snug">{issue.title}</CardTitle>
          <CardDescription className="text-sm leading-relaxed">{issue.description}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-3 pt-0">
          {/* Expandable Impact section */}
          <div>
            <button
              onClick={() => toggleSection('impact')}
              className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
            >
              <span className="flex items-center gap-1.5">
                <AlertCircle className="size-3.5" />
                Impact ({issue.impact.length})
              </span>
              {expandedSection === 'impact' ? (
                <ChevronUp className="size-4" />
              ) : (
                <ChevronDown className="size-4" />
              )}
            </button>
            <AnimatePresence>
              {expandedSection === 'impact' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <ul className="mt-1 space-y-1 rounded-md bg-muted/30 px-3 py-2">
                    {issue.impact.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="mt-1 size-1.5 shrink-0 rounded-full bg-amber-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Expandable Fix Guidance section */}
          {issue.fixGuidance && (
            <div>
              <button
                onClick={() => toggleSection('fix')}
                className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
              >
                <span className="flex items-center gap-1.5">
                  <Wrench className="size-3.5" />
                  Fix Guidance
                </span>
                {expandedSection === 'fix' ? (
                  <ChevronUp className="size-4" />
                ) : (
                  <ChevronDown className="size-4" />
                )}
              </button>
              <AnimatePresence>
                {expandedSection === 'fix' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-1 space-y-2 rounded-md bg-emerald-50/50 px-3 py-2 dark:bg-emerald-950/20">
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        <span>
                          Method: <MethodBadge method={issue.fixGuidance.method} />
                        </span>
                        <span>
                          Fees: <strong className="text-foreground">{issue.fixGuidance.fees}</strong>
                        </span>
                        <span>
                          Time: <strong className="text-foreground">{issue.fixGuidance.processingTime}</strong>
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Department: <strong className="text-foreground">{issue.fixGuidance.department}</strong>
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <Separator />

          {/* Action row */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* Status toggle buttons */}
            <div className="flex items-center gap-1">
              {(['open', 'resolved', 'dismissed'] as IssueStatus[]).map((s) => {
                const isActive = issue.status === s;
                const conf = STATUS_CONFIG[s];
                return (
                  <Button
                    key={s}
                    variant={isActive ? 'default' : 'ghost'}
                    size="sm"
                    className={`h-7 text-xs ${
                      isActive
                        ? s === 'resolved'
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : s === 'dismissed'
                            ? 'bg-gray-500 hover:bg-gray-600 text-white'
                            : 'bg-red-500 hover:bg-red-600 text-white'
                        : 'text-muted-foreground'
                    }`}
                    onClick={() => onStatusChange(issue.id, s)}
                  >
                    {conf.label}
                  </Button>
                );
              })}
            </div>

            {/* Fix button */}
            {issue.fixGuidance && (
              <Button
                size="sm"
                variant="outline"
                className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300"
                onClick={() => onFix(issue)}
              >
                <Wrench className="mr-1.5 size-3.5" />
                Fix
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   IssueDetection — Main component
   ════════════════════════════════════════════════════════════════════════════ */

export default function IssueDetection() {
  const documents = useAppStore((s) => s.documents);
  const issues = useAppStore((s) => s.issues);
  const addIssue = useAppStore((s) => s.addIssue);
  const updateIssue = useAppStore((s) => s.updateIssue);
  const addActivity = useAppStore((s) => s.addActivity);
  const addNotification = useAppStore((s) => s.addNotification);
  const setCurrentView = useAppStore((s) => s.setCurrentView);

  /* ── Local state ── */
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [selectedIssue, setSelectedIssue] = useState<DocIssue | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  /* ── Derived counts ── */
  const counts = useMemo(() => {
    const openIssues = issues.filter((i) => i.status === 'open');
    return {
      critical: openIssues.filter((i) => i.severity === 'critical').length,
      high: openIssues.filter((i) => i.severity === 'high').length,
      medium: openIssues.filter((i) => i.severity === 'medium').length,
      low: openIssues.filter((i) => i.severity === 'low').length,
      total: openIssues.length,
    };
  }, [issues]);

  /* ── Filtered issues ── */
  const filteredIssues = useMemo(() => {
    return issues
      .filter((issue) => {
        if (severityFilter !== 'all' && issue.severity !== severityFilter) return false;
        if (statusFilter !== 'all' && issue.status !== statusFilter) return false;
        return true;
      })
      .sort((a, b) => {
        const severityOrder: Record<SeverityLevel, number> = {
          critical: 0,
          high: 1,
          medium: 2,
          low: 3,
        };
        if (severityOrder[a.severity] !== severityOrder[b.severity]) {
          return severityOrder[a.severity] - severityOrder[b.severity];
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [issues, severityFilter, statusFilter]);

  /* ── Run AI Analysis ── */
  const runAnalysis = useCallback(async () => {
    if (documents.length === 0 || analyzing) return;

    setAnalyzing(true);
    setAnalysisProgress(10);

    try {
      // Simulate progress while waiting
      const progressInterval = setInterval(() => {
        setAnalysisProgress((prev) => {
          if (prev >= 85) {
            clearInterval(progressInterval);
            return 85;
          }
          return prev + Math.random() * 12;
        });
      }, 600);

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documents }),
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        throw new Error('Analysis request failed');
      }

      const data = await response.json();
      setAnalysisProgress(95);

      const newIssues: DocIssue[] = data.issues || [];

      // Add each issue to store
      newIssues.forEach((issue: DocIssue) => {
        addIssue(issue);
      });

      setAnalysisProgress(100);

      // Record activity
      addActivity(
        'AI Analysis',
        `AI Analysis completed - ${newIssues.length} issue${newIssues.length !== 1 ? 's' : ''} found`
      );

      // Add notification
      if (newIssues.length > 0) {
        const criticalCount = newIssues.filter(
          (i: DocIssue) => i.severity === 'critical' || i.severity === 'high'
        ).length;

        addNotification({
          id: crypto.randomUUID(),
          type: 'system',
          title: 'AI Analysis Complete',
          message: `Found ${newIssues.length} issue${newIssues.length !== 1 ? 's' : ''}${
            criticalCount > 0 ? ` (${criticalCount} critical/high)` : ''
          } across your documents.`,
          read: false,
          actionUrl: 'issues',
          createdAt: new Date().toISOString(),
        });
      } else {
        addNotification({
          id: crypto.randomUUID(),
          type: 'system',
          title: 'AI Analysis Complete',
          message: 'No issues detected. Your documents look good!',
          read: false,
          createdAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Analysis error:', error);
      addNotification({
        id: crypto.randomUUID(),
        type: 'system',
        title: 'Analysis Failed',
        message: 'Could not complete AI analysis. Please try again.',
        read: false,
        createdAt: new Date().toISOString(),
      });
    } finally {
      setTimeout(() => {
        setAnalyzing(false);
        setAnalysisProgress(0);
      }, 500);
    }
  }, [documents, analyzing, addIssue, addActivity, addNotification]);

  /* ── Status change handler ── */
  const handleStatusChange = useCallback(
    (id: string, status: IssueStatus) => {
      updateIssue(id, { status });
    },
    [updateIssue]
  );

  /* ── Fix handler ── */
  const handleFix = useCallback((issue: DocIssue) => {
    setSelectedIssue(issue);
    setDialogOpen(true);
  }, []);

  /* ── Go to correction ── */
  const goToCorrection = useCallback(() => {
    setCurrentView('correction');
  }, [setCurrentView]);

  /* ──────────────────────── Empty State: No Documents ──────────────────────── */

  if (documents.length === 0) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex max-w-md flex-col items-center text-center"
        >
          <div className="mb-4 flex size-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
            <Shield className="size-10 text-emerald-500" />
          </div>
          <h2 className="mb-2 text-xl font-semibold text-foreground">
            No Documents Yet
          </h2>
          <p className="mb-6 text-sm text-muted-foreground leading-relaxed">
            Upload documents first to run AI analysis. DocSync will detect
            inconsistencies, mismatches, and errors across your documents.
          </p>
          <Button
            onClick={() => setCurrentView('documents')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Upload Documents
          </Button>
        </motion.div>
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════════════════════
     Main render
     ════════════════════════════════════════════════════════════════════════ */

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6">
      {/* ──────── Header ──────── */}
      <motion.div {...fadeInUp} transition={{ duration: 0.4 }}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
              <Shield className="size-7 text-emerald-500" />
              AI Issue Detection
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Scan your documents for inconsistencies, mismatches, and errors using AI-powered analysis.
            </p>
          </div>

          <Button
            onClick={runAnalysis}
            disabled={analyzing}
            className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20"
          >
            {analyzing ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 size-4" />
                Run AI Analysis
              </>
            )}
          </Button>
        </div>

        {/* Analysis progress bar */}
        <AnimatePresence>
          {analyzing && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 overflow-hidden"
            >
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-800 dark:bg-emerald-950/20">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-emerald-700 dark:text-emerald-400">
                    Analyzing your documents...
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {Math.round(analysisProgress)}%
                  </span>
                </div>
                <Progress value={analysisProgress} className="h-2" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ──────── Summary Cards ──────── */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"
      >
        {/* Critical */}
        <motion.div variants={staggerItem}>
          <Card className="border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/40">
                <XCircle className="size-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{counts.critical}</p>
                <p className="text-xs font-medium text-red-500/80 dark:text-red-400/70">Critical</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* High */}
        <motion.div variants={staggerItem}>
          <Card className="border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-950/20">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/40">
                <AlertTriangle className="size-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{counts.high}</p>
                <p className="text-xs font-medium text-orange-500/80 dark:text-orange-400/70">High</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Medium */}
        <motion.div variants={staggerItem}>
          <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/40">
                <AlertCircle className="size-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{counts.medium}</p>
                <p className="text-xs font-medium text-amber-500/80 dark:text-amber-400/70">Medium</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Low */}
        <motion.div variants={staggerItem}>
          <Card className="border-teal-200 bg-teal-50/50 dark:border-teal-800 dark:bg-teal-950/20">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-900/40">
                <Info className="size-5 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">{counts.low}</p>
                <p className="text-xs font-medium text-teal-500/80 dark:text-teal-400/70">Low</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* ──────── Filters ──────── */}
      <motion.div {...fadeInUp} transition={{ duration: 0.4, delay: 0.15 }}>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Filter className="size-4" />
            Filters
          </div>

          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-[160px] h-9 text-sm">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px] h-9 text-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="dismissed">Dismissed</SelectItem>
            </SelectContent>
          </Select>

          {(severityFilter !== 'all' || statusFilter !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 text-xs text-muted-foreground"
              onClick={() => {
                setSeverityFilter('all');
                setStatusFilter('all');
              }}
            >
              Clear Filters
            </Button>
          )}

          <div className="ml-auto text-xs text-muted-foreground">
            {filteredIssues.length} issue{filteredIssues.length !== 1 ? 's' : ''}
          </div>
        </div>
      </motion.div>

      {/* ──────── Issues List ──────── */}
      {issues.length === 0 ? (
        /* Empty state — no issues */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card className="border-dashed border-emerald-300 bg-emerald-50/30 dark:border-emerald-700 dark:bg-emerald-950/10">
            <CardContent className="flex flex-col items-center py-12 text-center">
              <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                <CheckCircle2 className="size-8 text-emerald-500" />
              </div>
              <h3 className="mb-1 text-lg font-semibold text-foreground">
                No issues detected!
              </h3>
              <p className="max-w-sm text-sm text-muted-foreground">
                Your documents look good. Run AI Analysis to check for any inconsistencies,
                mismatches, or errors across your documents.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ) : filteredIssues.length === 0 ? (
        /* No matching issues after filter */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center py-12 text-center">
              <Filter className="mb-3 size-8 text-muted-foreground/50" />
              <h3 className="mb-1 text-base font-semibold text-foreground">
                No matching issues
              </h3>
              <p className="text-sm text-muted-foreground">
                No issues match the current filter criteria. Try adjusting your filters.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <ScrollArea className="max-h-[calc(100vh-420px)]">
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="space-y-4 pb-4"
          >
            {filteredIssues.map((issue) => (
              <IssueCard
                key={issue.id}
                issue={issue}
                onFix={handleFix}
                onStatusChange={handleStatusChange}
              />
            ))}
          </motion.div>
        </ScrollArea>
      )}

      {/* ──────── Fix Guidance Dialog ──────── */}
      <FixGuidanceDialog
        issue={selectedIssue}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onGoToCorrection={goToCorrection}
      />
    </div>
  );
}
