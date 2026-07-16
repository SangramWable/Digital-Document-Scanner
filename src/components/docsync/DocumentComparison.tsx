'use client';

import { useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GitCompare,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  FileText,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  AlertTriangle,
} from 'lucide-react';

import { useAppStore } from '@/lib/store';
import { EXTRACTED_FIELDS, DOCUMENT_TYPES } from '@/lib/data';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/* ──────────────────────── Types ──────────────────────── */

type FieldStatus = 'correct' | 'missing' | 'mismatch';

interface ComparisonField {
  key: string;
  label: string;
  values: { docId: string; docName: string; docType: string; value: string }[];
  status: FieldStatus;
}

interface MismatchConsequence {
  field: string;
  consequence: string;
  severity: 'low' | 'medium' | 'high';
}

/* ──────────────────────── Animation helpers ──────────────────────── */

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.05 } },
};

const staggerItem = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

/* ──────────────────────── Consequence data ──────────────────────── */

const MISMATCH_CONSEQUENCES: Record<string, MismatchConsequence[]> = {
  fullName: [
    { field: 'fullName', consequence: 'Application rejection — name must match across all documents', severity: 'high' },
    { field: 'fullName', consequence: 'Difficulty in identity verification at government offices', severity: 'medium' },
    { field: 'fullName', consequence: 'Bank account and scholarship application delays', severity: 'high' },
  ],
  dob: [
    { field: 'dob', consequence: 'Age verification failure for age-restricted services and schemes', severity: 'high' },
    { field: 'dob', consequence: 'School/college admission may be rejected', severity: 'high' },
    { field: 'dob', consequence: 'Pension and retirement benefit miscalculation', severity: 'medium' },
  ],
  gender: [
    { field: 'gender', consequence: 'Gender-specific scheme applications may be rejected', severity: 'medium' },
    { field: 'gender', consequence: 'Inconsistency flagged during KYC verification', severity: 'low' },
  ],
  fatherName: [
    { field: 'fatherName', consequence: "Scholarship and admission form rejection — father's name must match", severity: 'high' },
    { field: 'fatherName', consequence: 'Property and inheritance document issues', severity: 'medium' },
  ],
  motherName: [
    { field: 'motherName', consequence: "Scholarship application issues — mother's name is a key identifier", severity: 'medium' },
    { field: 'motherName', consequence: 'Bank account opening may face additional scrutiny', severity: 'low' },
  ],
  address: [
    { field: 'address', consequence: 'Domicile certificate and state-specific scheme ineligibility', severity: 'high' },
    { field: 'address', consequence: 'Voter ID and passport address mismatch causes verification delays', severity: 'medium' },
    { field: 'address', consequence: 'Postal correspondence and government notice delivery issues', severity: 'low' },
  ],
  aadhaarNumber: [
    { field: 'aadhaarNumber', consequence: 'Critical — Different Aadhaar numbers suggest identity fraud', severity: 'high' },
    { field: 'aadhaarNumber', consequence: 'All Aadhaar-linked services and DBT benefits affected', severity: 'high' },
  ],
  panNumber: [
    { field: 'panNumber', consequence: 'ITR filing rejection — PAN must be consistent', severity: 'high' },
    { field: 'panNumber', consequence: 'Bank account and financial transaction compliance issues', severity: 'high' },
  ],
  passportNumber: [
    { field: 'passportNumber', consequence: 'International travel and visa application rejection', severity: 'high' },
    { field: 'passportNumber', consequence: 'Different passport numbers may indicate duplicate passports', severity: 'high' },
  ],
  mobileNumber: [
    { field: 'mobileNumber', consequence: 'OTP verification failures for government portals', severity: 'medium' },
    { field: 'mobileNumber', consequence: 'Important notifications may be sent to wrong number', severity: 'low' },
  ],
  email: [
    { field: 'email', consequence: 'Digital communication and e-verification may go to wrong address', severity: 'low' },
    { field: 'email', consequence: 'Account recovery difficulties if email is inconsistent', severity: 'medium' },
  ],
  documentNumber: [
    { field: 'documentNumber', consequence: 'Document verification failure — each document should have unique number', severity: 'medium' },
  ],
  issueDate: [
    { field: 'issueDate', consequence: 'Document validity and chronological verification issues', severity: 'low' },
  ],
  expiryDate: [
    { field: 'expiryDate', consequence: 'Expired document usage — legal penalties possible', severity: 'high' },
    { field: 'expiryDate', consequence: 'Services requiring valid documents will be denied', severity: 'high' },
  ],
};

/* ──────────────────────── Helper: doc type label ──────────────────────── */

function getDocTypeLabel(docType: string): string {
  const found = DOCUMENT_TYPES.find((d) => d.value === docType);
  return found ? found.label : docType;
}

/* ──────────────────────── Component ──────────────────────── */

export default function DocumentComparison() {
  const { documents, setCurrentView } = useAppStore();
  const [isRunning, setIsRunning] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [expandedMismatches, setExpandedMismatches] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<string>('all');

  /* ─── Comparison logic ─── */

  const comparisonResults = useMemo(() => {
    const fields: ComparisonField[] = [];

    for (const field of EXTRACTED_FIELDS) {
      const values = documents.map((doc) => ({
        docId: doc.id,
        docName: doc.docName,
        docType: doc.docType,
        value: doc.extractedData?.[field.key] ?? '',
      }));

      // If all values are empty, skip this field entirely
      if (values.every((v) => !v.value.trim())) continue;

      // Determine status
      const nonEmptyValues = values.filter((v) => v.value.trim());
      let status: FieldStatus;

      if (nonEmptyValues.length < values.length) {
        // Some documents missing this field
        // But check if the non-empty ones all match first
        const uniqueValues = new Set(
          nonEmptyValues.map((v) => v.value.trim().toLowerCase())
        );
        if (uniqueValues.size > 1) {
          status = 'mismatch';
        } else {
          status = 'missing';
        }
      } else {
        // All documents have this field
        const uniqueValues = new Set(
          nonEmptyValues.map((v) => v.value.trim().toLowerCase())
        );
        if (uniqueValues.size === 1) {
          status = 'correct';
        } else {
          status = 'mismatch';
        }
      }

      fields.push({
        key: field.key,
        label: field.label,
        values,
        status,
      });
    }

    return fields;
  }, [documents]);

  /* ─── Summary stats ─── */

  const summary = useMemo(() => {
    const total = comparisonResults.length;
    const matching = comparisonResults.filter((f) => f.status === 'correct').length;
    const missing = comparisonResults.filter((f) => f.status === 'missing').length;
    const mismatched = comparisonResults.filter((f) => f.status === 'mismatch').length;
    const consistency = total > 0 ? Math.round((matching / total) * 100) : 0;

    return { total, matching, missing, mismatched, consistency };
  }, [comparisonResults]);

  /* ─── Filtered results ─── */

  const filteredResults = useMemo(() => {
    if (filterStatus === 'all') return comparisonResults;
    return comparisonResults.filter((f) => f.status === filterStatus);
  }, [comparisonResults, filterStatus]);

  /* ─── Handlers ─── */

  const runComparison = useCallback(() => {
    setIsRunning(true);
    // Simulate a brief analysis period
    setTimeout(() => {
      setIsRunning(false);
      setHasRun(true);
    }, 800);
  }, []);

  const toggleMismatch = useCallback((fieldKey: string) => {
    setExpandedMismatches((prev) => {
      const next = new Set(prev);
      if (next.has(fieldKey)) {
        next.delete(fieldKey);
      } else {
        next.add(fieldKey);
      }
      return next;
    });
  }, []);

  const handleFixThis = useCallback(() => {
    setCurrentView('correction');
  }, [setCurrentView]);

  /* ─── Status icon & badge helpers ─── */

  const statusIcon = (status: FieldStatus) => {
    switch (status) {
      case 'correct':
        return <CheckCircle2 className="size-4 text-emerald-500" />;
      case 'missing':
        return <AlertCircle className="size-4 text-amber-500" />;
      case 'mismatch':
        return <XCircle className="size-4 text-red-500" />;
    }
  };

  const statusBadge = (status: FieldStatus) => {
    switch (status) {
      case 'correct':
        return (
          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-0 gap-1">
            <CheckCircle2 className="size-3" /> Correct
          </Badge>
        );
      case 'missing':
        return (
          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-0 gap-1">
            <AlertCircle className="size-3" /> Missing
          </Badge>
        );
      case 'mismatch':
        return (
          <Badge className="bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-0 gap-1">
            <XCircle className="size-3" /> Mismatch
          </Badge>
        );
    }
  };

  const statusLabel = (status: FieldStatus): string => {
    switch (status) {
      case 'correct': return 'Correct';
      case 'missing': return 'Missing';
      case 'mismatch': return 'Mismatch';
    }
  };

  /* ─── Empty state ─── */

  if (documents.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-2xl bg-teal-50 dark:bg-teal-950/40">
            <GitCompare className="size-10 text-teal-500" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Upload Documents to Compare
          </h2>
          <p className="text-muted-foreground mb-6">
            You need at least 2 documents with extracted data to run a comparison.
            Upload your documents first, then come back here.
          </p>
          <Button
            onClick={() => setCurrentView('dashboard')}
            className="bg-teal-600 hover:bg-teal-700 text-white gap-2"
          >
            <FileText className="size-4" />
            Go to Dashboard
          </Button>
        </motion.div>
      </div>
    );
  }

  /* ─── Main render ─── */

  return (
    <div className="space-y-6">
      {/* ────── 1. Comparison Header ────── */}
      <motion.div {...fadeInUp} transition={{ duration: 0.4 }}>
        <Card className="border-teal-200 dark:border-teal-800/50 bg-gradient-to-br from-teal-50/50 to-emerald-50/30 dark:from-teal-950/20 dark:to-emerald-950/10">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-xl bg-teal-100 dark:bg-teal-900/50">
                  <GitCompare className="size-5 text-teal-600 dark:text-teal-400" />
                </div>
                <div>
                  <CardTitle className="text-xl text-foreground">
                    Smart Document Comparison
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Compare information across your uploaded documents to find inconsistencies
                  </CardDescription>
                </div>
              </div>
              <Button
                onClick={runComparison}
                disabled={isRunning}
                className="bg-teal-600 hover:bg-teal-700 text-white gap-2 shrink-0"
              >
                {isRunning ? (
                  <>
                    <RefreshCw className="size-4 animate-spin" />
                    Comparing...
                  </>
                ) : (
                  <>
                    <GitCompare className="size-4" />
                    Run Comparison
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          {hasRun && (
            <CardContent className="pt-0">
              <div className="flex items-center gap-2 text-sm text-teal-700 dark:text-teal-300">
                <CheckCircle2 className="size-4" />
                Comparison complete — {documents.length} documents, {summary.total} fields analyzed
              </div>
            </CardContent>
          )}
        </Card>
      </motion.div>

      {/* Auto-run on first render if documents exist */}
      {!hasRun && !isRunning && (
        <div className="flex items-center justify-center py-10">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center"
          >
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-teal-50 dark:bg-teal-950/40">
              <GitCompare className="size-8 text-teal-400" />
            </div>
            <p className="text-muted-foreground mb-4">
              Click &quot;Run Comparison&quot; to analyze your documents for inconsistencies
            </p>
          </motion.div>
        </div>
      )}

      {/* ────── 3. Comparison Summary ────── */}
      {(hasRun || isRunning) && (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-2 sm:grid-cols-4 gap-4"
        >
          <motion.div variants={staggerItem}>
            <Card className="border-slate-200 dark:border-slate-700/50">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{summary.total}</p>
                <p className="text-xs text-muted-foreground mt-1">Fields Compared</p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={staggerItem}>
            <Card className="border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/50 dark:bg-emerald-950/20">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{summary.matching}</p>
                <p className="text-xs text-muted-foreground mt-1">Matching</p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={staggerItem}>
            <Card className="border-amber-200 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-950/20">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{summary.missing}</p>
                <p className="text-xs text-muted-foreground mt-1">Missing</p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={staggerItem}>
            <Card className="border-red-200 dark:border-red-800/40 bg-red-50/50 dark:bg-red-950/20">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{summary.mismatched}</p>
                <p className="text-xs text-muted-foreground mt-1">Mismatched</p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}

      {/* Consistency bar */}
      {(hasRun || isRunning) && (
        <motion.div {...fadeInUp} transition={{ delay: 0.2 }}>
          <Card className="border-teal-200 dark:border-teal-800/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Overall Consistency</span>
                <span className="text-sm font-bold text-teal-600 dark:text-teal-400">
                  {summary.consistency}%
                </span>
              </div>
              <div className="h-3 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${summary.consistency}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className={`h-full rounded-full ${
                    summary.consistency >= 80
                      ? 'bg-emerald-500'
                      : summary.consistency >= 50
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                  }`}
                />
              </div>
              <div className="flex justify-between mt-1.5 text-xs text-muted-foreground">
                <span>0%</span>
                <span>100%</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ────── 2. Comparison Table ────── */}
      {(hasRun || isRunning) && (
        <motion.div {...fadeInUp} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <CardTitle className="text-lg text-foreground">Field Comparison</CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Filter:</span>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Fields</SelectItem>
                      <SelectItem value="correct">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="size-3 text-emerald-500" />
                          Correct
                        </span>
                      </SelectItem>
                      <SelectItem value="missing">
                        <span className="flex items-center gap-1.5">
                          <AlertCircle className="size-3 text-amber-500" />
                          Missing
                        </span>
                      </SelectItem>
                      <SelectItem value="mismatch">
                        <span className="flex items-center gap-1.5">
                          <XCircle className="size-3 text-red-500" />
                          Mismatch
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* ── Desktop Table View ── */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <TableHead className="w-[160px] font-semibold text-foreground">
                        Field Name
                      </TableHead>
                      {documents.map((doc) => (
                        <TableHead key={doc.id} className="font-semibold text-foreground">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="cursor-help truncate max-w-[140px] inline-block">
                                  {doc.docName}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                {getDocTypeLabel(doc.docType)}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableHead>
                      ))}
                      <TableHead className="font-semibold text-foreground text-center">
                        Status
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredResults.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={2 + documents.length}
                          className="text-center py-8 text-muted-foreground"
                        >
                          No fields match the selected filter.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredResults.map((field, idx) => (
                        <TableRow
                          key={field.key}
                          className={
                            idx % 2 === 0
                              ? 'bg-white dark:bg-slate-900/20'
                              : 'bg-slate-50/50 dark:bg-slate-800/20'
                          }
                        >
                          <TableCell className="font-medium text-foreground">
                            {field.label}
                          </TableCell>
                          {field.values.map((v) => (
                            <TableCell key={v.docId}>
                              {v.value ? (
                                <span className="text-sm">{v.value}</span>
                              ) : (
                                <span className="text-xs text-muted-foreground italic">
                                  Not found
                                </span>
                              )}
                            </TableCell>
                          ))}
                          <TableCell className="text-center">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex justify-center">
                                    {statusBadge(field.status)}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {field.status === 'correct' && 'All documents match for this field'}
                                  {field.status === 'missing' && 'Some documents are missing this field'}
                                  {field.status === 'mismatch' && 'Values differ across documents'}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* ── Mobile Card View ── */}
              <div className="md:hidden space-y-3 p-4 max-h-[60vh] overflow-y-auto">
                {filteredResults.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">
                    No fields match the selected filter.
                  </p>
                ) : (
                  filteredResults.map((field) => (
                    <motion.div
                      key={field.key}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Card className={`border-l-4 ${
                        field.status === 'correct'
                          ? 'border-l-emerald-500'
                          : field.status === 'missing'
                            ? 'border-l-amber-500'
                            : 'border-l-red-500'
                      }`}>
                        <CardContent className="p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm text-foreground">{field.label}</span>
                            {statusBadge(field.status)}
                          </div>
                          <div className="space-y-1.5">
                            {field.values.map((v) => (
                              <div
                                key={v.docId}
                                className="flex items-center gap-2 text-xs"
                              >
                                <span className="text-muted-foreground min-w-[90px] truncate">
                                  {v.docName}:
                                </span>
                                {v.value ? (
                                  <span className="text-foreground">{v.value}</span>
                                ) : (
                                  <span className="italic text-muted-foreground">Not found</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ────── 4. Mismatch Details ────── */}
      {hasRun && summary.mismatched > 0 && (
        <motion.div {...fadeInUp} transition={{ delay: 0.4 }}>
          <Card className="border-red-200 dark:border-red-800/40">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="size-5 text-red-500" />
                <CardTitle className="text-lg text-foreground">Mismatch Details</CardTitle>
              </div>
              <CardDescription>
                Review and resolve inconsistencies found across your documents
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <AnimatePresence>
                {comparisonResults
                  .filter((f) => f.status === 'mismatch')
                  .map((field) => {
                    const isExpanded = expandedMismatches.has(field.key);
                    const consequences = MISMATCH_CONSEQUENCES[field.key] ?? [];
                    const uniqueValues = new Set(
                      field.values
                        .filter((v) => v.value.trim())
                        .map((v) => v.value.trim().toLowerCase())
                    );
                    const hasTwoPlusDistinct = uniqueValues.size >= 2;

                    return (
                      <motion.div
                        key={field.key}
                        initial={false}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0, opacity: 0 }}
                      >
                        <Card className="border-red-100 dark:border-red-900/30 overflow-hidden">
                          {/* Collapsible header */}
                          <button
                            onClick={() => toggleMismatch(field.key)}
                            className="w-full text-left p-4 flex items-center justify-between hover:bg-red-50/50 dark:hover:bg-red-950/20 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <XCircle className="size-5 text-red-500 shrink-0" />
                              <div>
                                <p className="font-semibold text-sm text-foreground">
                                  {field.label}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {hasTwoPlusDistinct
                                    ? `${uniqueValues.size} different values found across documents`
                                    : 'Values differ across documents'
                                  }
                                </p>
                              </div>
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="size-4 text-muted-foreground shrink-0" />
                            ) : (
                              <ChevronDown className="size-4 text-muted-foreground shrink-0" />
                            )}
                          </button>

                          {/* Expanded content */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                <div className="px-4 pb-4 space-y-4">
                                  {/* Value comparison */}
                                  <div className="space-y-2">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                      Value Comparison
                                    </p>
                                    <div className="grid gap-2">
                                      {field.values
                                        .filter((v) => v.value.trim())
                                        .map((v, i, arr) => (
                                          <div key={v.docId} className="flex items-center gap-2">
                                            <Badge
                                              variant="outline"
                                              className="shrink-0 text-xs border-teal-300 dark:border-teal-700 text-teal-700 dark:text-teal-300"
                                            >
                                              {v.docName}
                                            </Badge>
                                            <span className="text-sm text-foreground font-medium truncate">
                                              {v.value}
                                            </span>
                                            {i < arr.length - 1 && (
                                              <ArrowRight className="size-3 text-muted-foreground shrink-0 hidden sm:block" />
                                            )}
                                          </div>
                                        ))}
                                    </div>
                                  </div>

                                  {/* Consequences */}
                                  {consequences.length > 0 && (
                                    <div className="space-y-2">
                                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        Possible Consequences
                                      </p>
                                      <div className="space-y-1.5">
                                        {consequences.map((c, idx) => (
                                          <div
                                            key={idx}
                                            className="flex items-start gap-2 text-sm"
                                          >
                                            <AlertTriangle
                                              className={`size-3.5 shrink-0 mt-0.5 ${
                                                c.severity === 'high'
                                                  ? 'text-red-500'
                                                  : c.severity === 'medium'
                                                    ? 'text-amber-500'
                                                    : 'text-slate-400'
                                              }`}
                                            />
                                            <span className="text-muted-foreground">
                                              {c.consequence}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Fix button */}
                                  <Button
                                    size="sm"
                                    onClick={handleFixThis}
                                    className="bg-teal-600 hover:bg-teal-700 text-white gap-1.5"
                                  >
                                    Fix This
                                    <ArrowRight className="size-3.5" />
                                  </Button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </Card>
                      </motion.div>
                    );
                  })}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ── All clear message ── */}
      {hasRun && summary.mismatched === 0 && summary.missing === 0 && (
        <motion.div {...fadeInUp} transition={{ delay: 0.4 }}>
          <Card className="border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/50 dark:bg-emerald-950/20">
            <CardContent className="p-6 text-center">
              <CheckCircle2 className="size-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-emerald-700 dark:text-emerald-300 mb-1">
                All Fields Match!
              </h3>
              <p className="text-sm text-muted-foreground">
                All extracted data is consistent across your documents. No inconsistencies found.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ── Missing fields note ── */}
      {hasRun && summary.missing > 0 && summary.mismatched === 0 && (
        <motion.div {...fadeInUp} transition={{ delay: 0.4 }}>
          <Card className="border-amber-200 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-950/20">
            <CardContent className="p-6 text-center">
              <AlertCircle className="size-12 text-amber-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-amber-700 dark:text-amber-300 mb-1">
                Some Fields Are Missing
              </h3>
              <p className="text-sm text-muted-foreground">
                No mismatches found, but {summary.missing} field{summary.missing > 1 ? 's are' : ' is'} not present in all documents.
                Consider uploading additional documents for complete coverage.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
