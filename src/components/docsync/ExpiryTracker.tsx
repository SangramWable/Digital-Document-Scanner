'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock, AlertTriangle, CheckCircle2, FileText } from 'lucide-react';

import { useAppStore } from '@/lib/store';
import { DOCUMENT_TYPES } from '@/lib/data';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

export default function ExpiryTracker() {
  const documents = useAppStore((s) => s.documents);
  const setCurrentView = useAppStore((s) => s.setCurrentView);

  /* ── Calculate expiry status for documents ── */
  const expiryData = useMemo(() => {
    const now = new Date();
    return documents
      .filter((doc) => doc.expiryDate)
      .map((doc) => {
        const expiry = new Date(doc.expiryDate!);
        const daysUntilExpiry = Math.ceil(
          (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        let status: 'expired' | 'critical' | 'warning' | 'safe' = 'safe';
        if (daysUntilExpiry < 0) status = 'expired';
        else if (daysUntilExpiry <= 30) status = 'critical';
        else if (daysUntilExpiry <= 90) status = 'warning';

        const docType = DOCUMENT_TYPES.find((dt) => dt.value === doc.docType);

        return {
          id: doc.id,
          docName: doc.docName,
          docType: docType?.label || doc.docType,
          icon: docType?.icon || '📄',
          expiryDate: doc.expiryDate!,
          daysUntilExpiry,
          status,
        };
      })
      .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
  }, [documents]);

  const expiredCount = expiryData.filter((d) => d.status === 'expired').length;
  const criticalCount = expiryData.filter((d) => d.status === 'critical').length;
  const warningCount = expiryData.filter((d) => d.status === 'warning').length;
  const safeCount = expiryData.filter((d) => d.status === 'safe').length;

  const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
    expired: { label: 'Expired', color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/30', icon: AlertTriangle },
    critical: { label: 'Expiring Soon', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30', icon: AlertTriangle },
    warning: { label: 'Expiring in 90 days', color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-950/30', icon: Clock },
    safe: { label: 'Valid', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30', icon: CheckCircle2 },
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-6">
      {/* Header */}
      <motion.div {...fadeInUp} transition={{ duration: 0.4 }}>
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10">
            <Clock className="size-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Expiry Tracker</h2>
            <p className="text-sm text-muted-foreground">
              Monitor document expiration dates
            </p>
          </div>
        </div>
      </motion.div>

      {/* Summary cards */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        {[
          { label: 'Expired', count: expiredCount, color: 'text-red-600', bg: 'bg-red-500/10' },
          { label: 'Critical', count: criticalCount, color: 'text-amber-600', bg: 'bg-amber-500/10' },
          { label: 'Warning', count: warningCount, color: 'text-yellow-600', bg: 'bg-yellow-500/10' },
          { label: 'Valid', count: safeCount, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.count}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Document list */}
      {expiryData.length > 0 ? (
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-3 pr-2">
            {expiryData.map((doc, idx) => {
              const config = statusConfig[doc.status];
              const StatusIcon = config.icon;
              return (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className={`border-l-4 ${doc.status === 'expired' ? 'border-l-red-500' : doc.status === 'critical' ? 'border-l-amber-500' : doc.status === 'warning' ? 'border-l-yellow-500' : 'border-l-emerald-500'}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{doc.icon}</span>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-foreground">{doc.docName}</p>
                          <p className="text-xs text-muted-foreground">{doc.docType}</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1.5">
                            <StatusIcon className={`size-3.5 ${config.color}`} />
                            <Badge variant="outline" className={`text-[10px] ${config.color}`}>
                              {config.label}
                            </Badge>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {doc.daysUntilExpiry < 0
                              ? `Expired ${Math.abs(doc.daysUntilExpiry)} days ago`
                              : doc.daysUntilExpiry === 0
                                ? 'Expires today'
                                : `${doc.daysUntilExpiry} days remaining`}
                          </p>
                          <p className="text-[10px] text-muted-foreground/60">
                            Expires: {new Date(doc.expiryDate).toLocaleDateString('en-IN')}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </ScrollArea>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <FileText className="mb-4 size-12 text-muted-foreground/30" />
          <p className="text-lg font-medium text-muted-foreground">No documents with expiry dates</p>
          <p className="mt-1 text-sm text-muted-foreground/70">
            Upload documents to track their expiration dates
          </p>
          <Button
            variant="outline"
            className="mt-4 gap-2"
            onClick={() => setCurrentView('documents')}
          >
            <FileText className="size-4" />
            Upload Documents
          </Button>
        </motion.div>
      )}
    </div>
  );
}
