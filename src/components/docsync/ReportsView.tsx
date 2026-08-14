'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileBarChart,
  Download,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Shield,
  Loader2,
} from 'lucide-react';

import { useAppStore } from '@/lib/store';
import { DOCUMENT_TYPES, GOVERNMENT_PORTALS } from '@/lib/data';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

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

/* ──────────────────────── Report section config ──────────────────────── */

interface ReportSection {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  defaultChecked: boolean;
}

const REPORT_SECTIONS: ReportSection[] = [
  {
    id: 'summary',
    label: 'Document Summary',
    description: 'Overview of all uploaded documents and their types',
    icon: FileText,
    defaultChecked: true,
  },
  {
    id: 'comparison',
    label: 'Comparison Results',
    description: 'Data consistency check across documents',
    icon: CheckCircle2,
    defaultChecked: true,
  },
  {
    id: 'issues',
    label: 'Detected Issues',
    description: 'All identified issues with severity levels',
    icon: AlertTriangle,
    defaultChecked: true,
  },
  {
    id: 'corrections',
    label: 'Correction Suggestions',
    description: 'Recommended fixes for detected issues',
    icon: Shield,
    defaultChecked: true,
  },
  {
    id: 'health',
    label: 'Health Score',
    description: 'Overall document health assessment',
    icon: FileBarChart,
    defaultChecked: true,
  },
  {
    id: 'portals',
    label: 'Government Portal Links',
    description: 'Relevant government service portals',
    icon: Shield,
    defaultChecked: false,
  },
];

/* ════════════════════════════════════════════════════════════════════════════
   ReportsView — Report generation and download
   ════════════════════════════════════════════════════════════════════════════ */

export default function ReportsView() {
  const documents = useAppStore((s) => s.documents);
  const issues = useAppStore((s) => s.issues);
  const user = useAppStore((s) => s.user);
  const getHealthScore = useAppStore((s) => s.getHealthScore);
  const getOpenIssueCount = useAppStore((s) => s.getOpenIssueCount);
  const getResolvedIssueCount = useAppStore((s) => s.getResolvedIssueCount);

  const [selectedSections, setSelectedSections] = useState<Set<string>>(
    new Set(REPORT_SECTIONS.filter((s) => s.defaultChecked).map((s) => s.id))
  );
  const [generating, setGenerating] = useState(false);

  const healthScore = getHealthScore();
  const openIssues = getOpenIssueCount();
  const resolvedIssues = getResolvedIssueCount();

  /* ── Toggle section ── */
  const toggleSection = useCallback((id: string) => {
    setSelectedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  /* ── Get doc type label ── */
  const getDocTypeLabel = useCallback((docType: string) => {
    const found = DOCUMENT_TYPES.find((dt) => dt.value === docType);
    return found ? found.label : docType;
  }, []);

  /* ── Build HTML report content ── */
  const buildReportHTML = useCallback(() => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      time: 'numeric',
    });

    let sectionsHTML = '';

    /* ── Document Summary ── */
    if (selectedSections.has('summary')) {
      const docRows = documents
        .map(
          (doc) => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${getDocTypeLabel(doc.docType)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${doc.docName}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${doc.healthScore}%</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${new Date(doc.createdAt).toLocaleDateString('en-IN')}</td>
        </tr>`
        )
        .join('');

      sectionsHTML += `
      <div style="margin-bottom:32px;">
        <h2 style="font-size:18px;font-weight:700;color:#059669;margin-bottom:12px;padding-bottom:8px;border-bottom:2px solid #d1fae5;">📄 Document Summary</h2>
        <p style="color:#374151;margin-bottom:12px;">Total documents uploaded: <strong>${documents.length}</strong></p>
        ${
          documents.length > 0
            ? `<table style="width:100%;border-collapse:collapse;font-size:14px;">
          <thead>
            <tr style="background:#f0fdf4;">
              <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #059669;">Document Type</th>
              <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #059669;">Name</th>
              <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #059669;">Health Score</th>
              <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #059669;">Upload Date</th>
            </tr>
          </thead>
          <tbody>${docRows}</tbody>
        </table>`
            : '<p style="color:#6b7280;font-style:italic;">No documents uploaded yet.</p>'
        }
      </div>`;
    }

    /* ── Comparison Results ── */
    if (selectedSections.has('comparison')) {
      const mismatches = documents.flatMap((doc) =>
        Object.entries(doc.extractedData)
          .filter(([, val]) => val === 'MISMATCH' || val === 'missing')
          .map(([key]) => ({ docName: doc.docName, field: key }))
      );

      sectionsHTML += `
      <div style="margin-bottom:32px;">
        <h2 style="font-size:18px;font-weight:700;color:#059669;margin-bottom:12px;padding-bottom:8px;border-bottom:2px solid #d1fae5;">✅ Comparison Results</h2>
        <p style="color:#374151;margin-bottom:12px;">Cross-document comparison status:</p>
        ${
          mismatches.length > 0
            ? `<p style="color:#dc2626;margin-bottom:8px;">⚠ ${mismatches.length} data inconsistency(ies) detected:</p>
          <ul style="padding-left:20px;">
            ${mismatches
              .map(
                (m) =>
                  `<li style="color:#374151;margin-bottom:4px;"><strong>${m.docName}</strong> — Field: ${m.field}</li>`
              )
              .join('')}
          </ul>`
            : documents.length > 1
              ? '<p style="color:#059669;">✓ All document data is consistent across uploads.</p>'
              : '<p style="color:#6b7280;font-style:italic;">Upload at least 2 documents to see comparison results.</p>'
        }
      </div>`;
    }

    /* ── Detected Issues ── */
    if (selectedSections.has('issues')) {
      const severityColors: Record<string, string> = {
        critical: '#dc2626',
        high: '#ea580c',
        medium: '#d97706',
        low: '#059669',
      };

      const issueRows = issues
        .map(
          (issue) => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">
            <span style="display:inline-block;padding:2px 8px;border-radius:9999px;font-size:12px;font-weight:600;color:white;background:${severityColors[issue.severity] || '#6b7280'};">${issue.severity.toUpperCase()}</span>
          </td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${issue.title}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${issue.category}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">
            <span style="color:${issue.status === 'resolved' ? '#059669' : '#d97706'};font-weight:600;">${issue.status.toUpperCase()}</span>
          </td>
        </tr>`
        )
        .join('');

      sectionsHTML += `
      <div style="margin-bottom:32px;">
        <h2 style="font-size:18px;font-weight:700;color:#059669;margin-bottom:12px;padding-bottom:8px;border-bottom:2px solid #d1fae5;">⚠️ Detected Issues</h2>
        <p style="color:#374151;margin-bottom:12px;">Total: <strong>${issues.length}</strong> | Open: <strong>${openIssues}</strong> | Resolved: <strong>${resolvedIssues}</strong></p>
        ${
          issues.length > 0
            ? `<table style="width:100%;border-collapse:collapse;font-size:14px;">
          <thead>
            <tr style="background:#fef2f2;">
              <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #dc2626;">Severity</th>
              <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #dc2626;">Title</th>
              <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #dc2626;">Category</th>
              <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #dc2626;">Status</th>
            </tr>
          </thead>
          <tbody>${issueRows}</tbody>
        </table>`
            : '<p style="color:#059669;">✓ No issues detected. Your documents are in good shape!</p>'
        }
      </div>`;
    }

    /* ── Correction Suggestions ── */
    if (selectedSections.has('corrections')) {
      const issuesWithGuidance = issues.filter((i) => i.fixGuidance);
      sectionsHTML += `
      <div style="margin-bottom:32px;">
        <h2 style="font-size:18px;font-weight:700;color:#059669;margin-bottom:12px;padding-bottom:8px;border-bottom:2px solid #d1fae5;">🔧 Correction Suggestions</h2>
        ${
          issuesWithGuidance.length > 0
            ? issuesWithGuidance
                .map(
                  (issue) => `
          <div style="background:#f0fdf4;border:1px solid #d1fae5;border-radius:8px;padding:16px;margin-bottom:12px;">
            <h3 style="font-size:15px;font-weight:600;color:#374151;margin-bottom:8px;">${issue.title}</h3>
            <p style="color:#374151;margin-bottom:8px;">${issue.description}</p>
            <p style="font-size:13px;color:#6b7280;"><strong>Method:</strong> ${issue.fixGuidance!.method} | <strong>Fees:</strong> ${issue.fixGuidance!.fees} | <strong>Time:</strong> ${issue.fixGuidance!.processingTime}</p>
            <p style="font-size:13px;color:#6b7280;margin-top:4px;"><strong>Department:</strong> ${issue.fixGuidance!.department}</p>
            ${
              issue.fixGuidance!.steps.length > 0
                ? `<ol style="padding-left:20px;margin-top:8px;">${issue.fixGuidance!.steps.map((step) => `<li style="color:#374151;font-size:13px;margin-bottom:4px;">${step}</li>`).join('')}</ol>`
                : ''
            }
          </div>`
                )
                .join('')
            : '<p style="color:#6b7280;font-style:italic;">No correction suggestions available at this time.</p>'
        }
      </div>`;
    }

    /* ── Health Score ── */
    if (selectedSections.has('health')) {
      const scoreColor = healthScore >= 80 ? '#059669' : healthScore >= 50 ? '#d97706' : '#dc2626';
      const scoreLabel =
        healthScore >= 80 ? 'Excellent' : healthScore >= 50 ? 'Needs Attention' : 'Critical';

      sectionsHTML += `
      <div style="margin-bottom:32px;">
        <h2 style="font-size:18px;font-weight:700;color:#059669;margin-bottom:12px;padding-bottom:8px;border-bottom:2px solid #d1fae5;">📊 Health Score</h2>
        <div style="text-align:center;padding:24px;">
          <div style="display:inline-block;width:120px;height:120px;border-radius:50%;border:8px solid ${scoreColor};line-height:104px;font-size:36px;font-weight:800;color:${scoreColor};">${healthScore}</div>
          <p style="margin-top:12px;font-size:16px;font-weight:600;color:${scoreColor};">${scoreLabel}</p>
        </div>
        <p style="color:#374151;text-align:center;">Based on ${documents.length} document(s) and ${issues.length} detected issue(s).</p>
      </div>`;
    }

    /* ── Government Portal Links ── */
    if (selectedSections.has('portals')) {
      sectionsHTML += `
      <div style="margin-bottom:32px;">
        <h2 style="font-size:18px;font-weight:700;color:#059669;margin-bottom:12px;padding-bottom:8px;border-bottom:2px solid #d1fae5;">🏛️ Government Portal Links</h2>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <thead>
            <tr style="background:#f0fdf4;">
              <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #059669;">Portal</th>
              <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #059669;">Description</th>
              <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #059669;">URL</th>
            </tr>
          </thead>
          <tbody>
            ${GOVERNMENT_PORTALS.map(
              (p) => `
            <tr>
              <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${p.icon} ${p.name}</td>
              <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${p.description}</td>
              <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;"><a href="${p.url}" style="color:#059669;">${p.url}</a></td>
            </tr>`
            ).join('')}
          </tbody>
        </table>
      </div>`;
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>DocSync India — Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1f2937; line-height: 1.6; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body style="max-width:800px;margin:0 auto;padding:40px 24px;">
  <!-- Header -->
  <div style="text-align:center;margin-bottom:36px;border-bottom:3px solid #059669;padding-bottom:20px;">
    <h1 style="font-size:28px;font-weight:800;color:#059669;margin-bottom:4px;">DocSync India</h1>
    <p style="font-size:14px;color:#6b7280;">Document Health & Compliance Report</p>
    <p style="font-size:13px;color:#9ca3af;margin-top:8px;">Generated on ${dateStr}</p>
    ${user ? `<p style="font-size:14px;color:#374151;margin-top:4px;">Prepared for: <strong>${user.name}</strong> (${user.email})</p>` : ''}
  </div>

  <!-- Sections -->
  ${sectionsHTML}

  <!-- Footer -->
  <div style="margin-top:40px;border-top:2px solid #d1fae5;padding-top:16px;text-align:center;">
    <p style="font-size:12px;color:#6b7280;">Generated by DocSync India — Your Documents. Your Device. Your Privacy.</p>
    <p style="font-size:11px;color:#9ca3af;margin-top:4px;">This report is stored and generated entirely on your device. No data was sent to any server.</p>
  </div>
</body>
</html>`;
  }, [selectedSections, documents, issues, user, healthScore, openIssues, resolvedIssues, getDocTypeLabel]);

  /* ── Generate & download report ── */
  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    // Small delay for UX feedback
    await new Promise((r) => setTimeout(r, 800));

    const html = buildReportHTML();
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `DocSync-India-Report-${new Date().toISOString().slice(0, 10)}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setGenerating(false);
  }, [buildReportHTML]);

  /* ── Preview items ── */
  const previewItems = useMemo(() => {
    const items: { label: string; value: string | number }[] = [];
    if (selectedSections.has('summary'))
      items.push({ label: 'Documents', value: documents.length });
    if (selectedSections.has('comparison'))
      items.push({ label: 'Comparison', value: documents.length > 1 ? 'Available' : 'N/A' });
    if (selectedSections.has('issues'))
      items.push({ label: 'Issues', value: issues.length });
    if (selectedSections.has('corrections'))
      items.push({
        label: 'Corrections',
        value: issues.filter((i) => i.fixGuidance).length,
      });
    if (selectedSections.has('health'))
      items.push({ label: 'Health Score', value: `${healthScore}%` });
    if (selectedSections.has('portals'))
      items.push({ label: 'Portals', value: GOVERNMENT_PORTALS.length });
    return items;
  }, [selectedSections, documents.length, issues, healthScore]);

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-6">
      {/* ── Header ── */}
      <motion.div {...fadeInUp} transition={{ duration: 0.4 }}>
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10">
            <FileBarChart className="size-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Reports</h2>
            <p className="text-sm text-muted-foreground">
              Generate comprehensive document health reports
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid gap-6 md:grid-cols-2"
      >
        {/* ── Report Configuration ── */}
        <motion.div variants={staggerItem} className="md:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg">Report Sections</CardTitle>
              <CardDescription>
                Choose what to include in your report
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {REPORT_SECTIONS.map((section) => {
                const Icon = section.icon;
                const checked = selectedSections.has(section.id);
                return (
                  <div
                    key={section.id}
                    className="flex items-start gap-3 rounded-lg border border-border/50 p-3 transition-colors hover:bg-muted/30"
                  >
                    <Checkbox
                      id={section.id}
                      checked={checked}
                      onCheckedChange={() => toggleSection(section.id)}
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor={section.id}
                        className="flex cursor-pointer items-center gap-2 text-sm font-medium"
                      >
                        <Icon className="size-4 text-emerald-600" />
                        {section.label}
                      </Label>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {section.description}
                      </p>
                    </div>
                  </div>
                );
              })}

              <Separator />

              {/* Report format */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Report Format</Label>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                    HTML
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Opens in browser, printable as PDF
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Report Preview ── */}
        <motion.div variants={staggerItem} className="md:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg">Report Preview</CardTitle>
              <CardDescription>
                What will be included in your report
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {previewItems.length > 0 ? (
                <div className="space-y-3">
                  {previewItems.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2.5"
                    >
                      <span className="text-sm font-medium text-foreground">
                        {item.label}
                      </span>
                      <Badge variant="outline" className="font-semibold">
                        {item.value}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <FileText className="mb-3 size-10 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">
                    Select at least one section to generate a report
                  </p>
                </div>
              )}

              <Separator />

              {/* User info */}
              {user && (
                <div className="rounded-lg bg-muted/30 p-3">
                  <p className="text-xs font-medium text-muted-foreground">Report for</p>
                  <p className="text-sm font-semibold text-foreground">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              )}

              {/* Privacy notice */}
              <div className="flex items-center gap-2 rounded-lg bg-emerald-500/5 px-3 py-2.5">
                <Shield className="size-4 shrink-0 text-emerald-600" />
                <p className="text-xs text-emerald-700 dark:text-emerald-400">
                  Report generated locally. No data leaves your device.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* ── Generate Button ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="flex justify-center"
      >
        <Button
          size="lg"
          onClick={handleGenerate}
          disabled={generating || selectedSections.size === 0}
          className="gap-2 bg-emerald-600 px-8 text-white hover:bg-emerald-700"
        >
          {generating ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Generating Report…
            </>
          ) : (
            <>
              <Download className="size-4" />
              Generate Report
            </>
          )}
        </Button>
      </motion.div>

      {/* ── Quick stats ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        {[
          { label: 'Documents', value: documents.length, icon: FileText, color: 'text-emerald-600' },
          { label: 'Open Issues', value: openIssues, icon: AlertTriangle, color: 'text-amber-600' },
          { label: 'Resolved', value: resolvedIssues, icon: CheckCircle2, color: 'text-emerald-600' },
          { label: 'Health Score', value: `${healthScore}%`, icon: FileBarChart, color: healthScore >= 80 ? 'text-emerald-600' : 'text-amber-600' },
        ].map((stat) => {
          const SIcon = stat.icon;
          return (
            <Card key={stat.label} className="text-center">
              <CardContent className="p-4">
                <SIcon className={`mx-auto mb-1 size-5 ${stat.color}`} />
                <p className="text-xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </motion.div>
    </div>
  );
}
