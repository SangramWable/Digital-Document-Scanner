'use client';

import { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Upload,
  ArrowRight,
  Shield,
  Activity,
  Bell,
  TrendingUp,
  AlertCircle,
  FileCheck,
  FileWarning,
  Trash2,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

import { useAppStore } from '@/lib/store';
import { DOCUMENT_TYPES } from '@/lib/data';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

/* ──────────────────────── Animation helpers ──────────────────────── */

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.06 } },
};

const staggerItem = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

/* ──────────────────────── Animated Counter ──────────────────────── */

function AnimatedCounter({ target, duration = 1200 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);

  return <span>{count}</span>;
}

/* ──────────────────────── Health Score Ring ──────────────────────── */

function HealthScoreRing({ score }: { score: number }) {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color = score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
  const label =
    score >= 80 ? 'Excellent' : score >= 50 ? 'Needs Attention' : score > 0 ? 'Critical' : 'No Data';

  return (
    <div className="relative flex flex-col items-center gap-2">
      <svg width="180" height="180" viewBox="0 0 180 180" className="-rotate-90">
        {/* Background ring */}
        <circle
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="12"
          className="text-muted/30"
        />
        {/* Progress ring */}
        <motion.circle
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.4, ease: 'easeOut' }}
        />
      </svg>
      {/* Center label */}
      <div className="absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
        <motion.span
          className="text-4xl font-bold tabular-nums"
          style={{ color }}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4, type: 'spring' }}
        >
          {score}
        </motion.span>
        <span className="text-xs font-medium text-muted-foreground">out of 100</span>
      </div>
      <Badge
        className="mt-1 text-xs font-semibold"
        style={{
          backgroundColor: color + '20',
          color: color,
          borderColor: color + '40',
        }}
      >
        {label}
      </Badge>
    </div>
  );
}

/* ──────────────────────── Stat Card ──────────────────────── */

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
  subtitle,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  accent: string;
  subtitle?: string;
}) {
  return (
    <motion.div variants={staggerItem}>
      <Card className="group relative overflow-hidden border-border/40 bg-card/60 backdrop-blur-md transition-shadow duration-300 hover:shadow-lg hover:shadow-emerald-500/5">
        <CardContent className="flex items-center gap-4 p-5">
          <div
            className="flex size-12 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
            style={{ backgroundColor: accent + '18' }}
          >
            <Icon className="size-6" style={{ color: accent }} />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {label}
            </span>
            <span className="text-2xl font-bold tabular-nums text-foreground">
              <AnimatedCounter target={value} />
            </span>
            {subtitle && (
              <span className="text-[11px] text-muted-foreground">{subtitle}</span>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ──────────────────────── AI Recommendations ──────────────────────── */

function AIRecommendationsCard() {
  const issues = useAppStore((s) => s.issues);
  const documents = useAppStore((s) => s.documents);
  const setCurrentView = useAppStore((s) => s.setCurrentView);

  const openIssues = useMemo(() => issues.filter((i) => i.status === 'open'), [issues]);

  const recommendations = useMemo(() => {
    if (openIssues.length === 0 && documents.length > 0) {
      return [
        {
          icon: CheckCircle2,
          text: 'Everything looks good! Keep your documents updated.',
          color: '#10b981',
        },
      ];
    }
    if (documents.length === 0) {
      return [
        {
          icon: Upload,
          text: 'Upload your first document to get started with AI analysis.',
          color: '#0d9488',
        },
      ];
    }
    const top3 = openIssues.slice(0, 3);
    return top3.map((issue) => ({
      icon: issue.severity === 'critical' || issue.severity === 'high' ? AlertCircle : AlertTriangle,
      text: issue.title,
      color:
        issue.severity === 'critical'
          ? '#ef4444'
          : issue.severity === 'high'
            ? '#f97316'
            : issue.severity === 'medium'
              ? '#f59e0b'
              : '#0d9488',
    }));
  }, [openIssues, documents]);

  return (
    <motion.div variants={staggerItem}>
      <Card className="border-border/40 bg-card/60 backdrop-blur-md transition-shadow duration-300 hover:shadow-lg hover:shadow-emerald-500/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/15">
              <Activity className="size-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <CardTitle className="text-base">AI Recommendations</CardTitle>
          </div>
          <CardDescription>Smart insights based on your documents and issues</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <AnimatePresence>
            {recommendations.map((rec, idx) => {
              const RecIcon = rec.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1, duration: 0.35 }}
                  className="flex items-start gap-3 rounded-lg border border-border/40 bg-background/50 p-3"
                >
                  <RecIcon className="mt-0.5 size-4 shrink-0" style={{ color: rec.color }} />
                  <span className="text-sm text-foreground/90">{rec.text}</span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </CardContent>
        <CardFooter>
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-300"
            onClick={() => setCurrentView('issues')}
          >
            <TrendingUp className="size-4" />
            Run Full Analysis
            <ArrowRight className="size-3.5" />
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

/* ──────────────────────── Document Distribution Chart ──────────────────────── */

function DocumentDistributionChart() {
  const documents = useAppStore((s) => s.documents);

  const chartData = useMemo(() => {
    const counts: Record<string, number> = {};
    documents.forEach((doc) => {
      counts[doc.docType] = (counts[doc.docType] || 0) + 1;
    });
    return Object.entries(counts).map(([type, count]) => {
      const docType = DOCUMENT_TYPES.find((dt) => dt.value === type);
      return {
        name: docType?.label || type,
        value: count,
        color: docType?.color || '#64748B',
      };
    });
  }, [documents]);

  if (chartData.length === 0) {
    return (
      <motion.div variants={staggerItem}>
        <Card className="border-border/40 bg-card/60 backdrop-blur-md transition-shadow duration-300 hover:shadow-lg hover:shadow-emerald-500/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/15">
                <FileText className="size-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <CardTitle className="text-base">Document Distribution</CardTitle>
            </div>
            <CardDescription>Breakdown by document type</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-10 text-center">
            <FileWarning className="mb-3 size-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
            <p className="text-xs text-muted-foreground/70">Upload documents to see distribution.</p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div variants={staggerItem}>
      <Card className="border-border/40 bg-card/60 backdrop-blur-md transition-shadow duration-300 hover:shadow-lg hover:shadow-emerald-500/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/15">
              <FileText className="size-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <CardTitle className="text-base">Document Distribution</CardTitle>
          </div>
          <CardDescription>Breakdown by document type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  animationBegin={200}
                  animationDuration={900}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--card)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    fontSize: '13px',
                  }}
                  itemStyle={{ color: 'var(--foreground)' }}
                  labelStyle={{ color: 'var(--foreground)', fontWeight: 600 }}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ──────────────────────── Recent Activity Timeline ──────────────────────── */

function RecentActivityTimeline() {
  const activities = useAppStore((s) => s.activities);

  const recentActivities = useMemo(() => activities.slice(0, 5), [activities]);

  const activityIcon = (action: string) => {
    const lower = action.toLowerCase();
    if (lower.includes('upload')) return Upload;
    if (lower.includes('issue') || lower.includes('resolved')) return FileCheck;
    if (lower.includes('delete') || lower.includes('removed')) return Trash2;
    if (lower.includes('login')) return Shield;
    return Activity;
  };

  const activityColor = (action: string) => {
    const lower = action.toLowerCase();
    if (lower.includes('upload')) return '#10b981';
    if (lower.includes('issue') || lower.includes('resolved')) return '#0d9488';
    if (lower.includes('delete') || lower.includes('removed')) return '#ef4444';
    if (lower.includes('login')) return '#059669';
    return '#64748b';
  };

  const formatTimestamp = (ts: string) => {
    const date = new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  return (
    <motion.div variants={staggerItem}>
      <Card className="border-border/40 bg-card/60 backdrop-blur-md transition-shadow duration-300 hover:shadow-lg hover:shadow-emerald-500/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/15">
              <Clock className="size-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </div>
          <CardDescription>Your latest actions and events</CardDescription>
        </CardHeader>
        <CardContent>
          {recentActivities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="mb-3 flex size-14 items-center justify-center rounded-full bg-muted/50">
                <Activity className="size-6 text-muted-foreground/40" />
              </div>
              <p className="text-sm text-muted-foreground">No recent activity</p>
              <p className="text-xs text-muted-foreground/70">
                Your actions will appear here as you use the app.
              </p>
            </div>
          ) : (
            <div className="relative space-y-0">
              {recentActivities.map((act, idx) => {
                const Icon = activityIcon(act.action);
                const color = activityColor(act.action);
                const isLast = idx === recentActivities.length - 1;
                return (
                  <motion.div
                    key={act.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.08, duration: 0.3 }}
                    className="relative flex gap-3 pb-4"
                  >
                    {/* Timeline line */}
                    {!isLast && (
                      <div className="absolute left-[15px] top-[32px] h-[calc(100%-24px)] w-px bg-border/60" />
                    )}
                    {/* Icon dot */}
                    <div
                      className="relative z-10 mt-0.5 flex size-[30px] shrink-0 items-center justify-center rounded-full border-2 border-background"
                      style={{ backgroundColor: color + '20' }}
                    >
                      <Icon className="size-3.5" style={{ color }} />
                    </div>
                    {/* Content */}
                    <div className="flex flex-1 flex-col gap-0.5">
                      <span className="text-sm font-medium text-foreground">{act.action}</span>
                      <span className="text-xs text-muted-foreground">{act.description}</span>
                      <span className="text-[10px] text-muted-foreground/60">
                        {formatTimestamp(act.timestamp)}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ──────────────────────── Quick Actions ──────────────────────── */

function QuickActionsCard() {
  const setCurrentView = useAppStore((s) => s.setCurrentView);

  const actions = [
    { icon: Upload, label: 'Upload Document', view: 'documents' as const, color: '#10b981' },
    { icon: FileText, label: 'Compare Documents', view: 'compare' as const, color: '#0d9488' },
    { icon: AlertTriangle, label: 'View Issues', view: 'issues' as const, color: '#f59e0b' },
    { icon: Activity, label: 'AI Chat', view: 'chat' as const, color: '#059669' },
  ];

  return (
    <motion.div variants={staggerItem}>
      <Card className="border-border/40 bg-card/60 backdrop-blur-md transition-shadow duration-300 hover:shadow-lg hover:shadow-emerald-500/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/15">
              <ArrowRight className="size-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </div>
          <CardDescription>Jump to common tasks</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          {actions.map((action, idx) => {
            const ActionIcon = action.icon;
            return (
              <motion.button
                key={action.label}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.06, duration: 0.3 }}
                onClick={() => setCurrentView(action.view)}
                className="flex flex-col items-center gap-2 rounded-xl border border-border/40 bg-background/50 p-4 transition-colors duration-200 hover:border-emerald-500/30 hover:bg-emerald-500/5"
              >
                <div
                  className="flex size-10 items-center justify-center rounded-lg"
                  style={{ backgroundColor: action.color + '18' }}
                >
                  <ActionIcon className="size-5" style={{ color: action.color }} />
                </div>
                <span className="text-xs font-medium text-foreground/80">{action.label}</span>
              </motion.button>
            );
          })}
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ──────────────────────── Upcoming Notifications ──────────────────────── */

function UpcomingNotificationsCard() {
  const notifications = useAppStore((s) => s.notifications);
  const setCurrentView = useAppStore((s) => s.setCurrentView);

  const latestNotifications = useMemo(() => notifications.slice(0, 3), [notifications]);

  const notifIcon = (type: string) => {
    switch (type) {
      case 'expiry':
        return Clock;
      case 'deadline':
        return AlertCircle;
      case 'scheme':
        return TrendingUp;
      default:
        return Bell;
    }
  };

  const notifColor = (type: string) => {
    switch (type) {
      case 'expiry':
        return '#ef4444';
      case 'deadline':
        return '#f59e0b';
      case 'scheme':
        return '#10b981';
      default:
        return '#0d9488';
    }
  };

  return (
    <motion.div variants={staggerItem}>
      <Card className="border-border/40 bg-card/60 backdrop-blur-md transition-shadow duration-300 hover:shadow-lg hover:shadow-emerald-500/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/15">
              <Bell className="size-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <CardTitle className="text-base">Notifications</CardTitle>
          </div>
          <CardDescription>Latest alerts and reminders</CardDescription>
        </CardHeader>
        <CardContent>
          {latestNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-muted/50">
                <Bell className="size-5 text-muted-foreground/40" />
              </div>
              <p className="text-sm text-muted-foreground">No new notifications</p>
            </div>
          ) : (
            <div className="space-y-3">
              {latestNotifications.map((notif, idx) => {
                const Icon = notifIcon(notif.type);
                const color = notifColor(notif.type);
                return (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.08, duration: 0.3 }}
                    className={`flex items-start gap-3 rounded-lg border border-border/40 p-3 transition-colors ${
                      !notif.read ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-background/50'
                    }`}
                  >
                    <div
                      className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: color + '18' }}
                    >
                      <Icon className="size-3.5" style={{ color }} />
                    </div>
                    <div className="flex flex-1 flex-col gap-0.5">
                      <span className="text-sm font-medium text-foreground">{notif.title}</span>
                      <span className="text-xs text-muted-foreground line-clamp-2">{notif.message}</span>
                    </div>
                    {!notif.read && (
                      <span className="mt-1 size-2 shrink-0 rounded-full bg-emerald-500" />
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
        {latestNotifications.length > 0 && (
          <CardFooter>
            <Button
              variant="ghost"
              size="sm"
              className="w-full gap-1 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
              onClick={() => setCurrentView('notifications')}
            >
              View All Notifications
              <ArrowRight className="size-3.5" />
            </Button>
          </CardFooter>
        )}
      </Card>
    </motion.div>
  );
}

/* ──────────────────────── Delete All Data Card ──────────────────────── */

function DeleteAllDataCard() {
  const deleteAllData = useAppStore((s) => s.deleteAllData);

  return (
    <motion.div variants={staggerItem}>
      <Card className="border-red-500/30 bg-red-500/5 backdrop-blur-md dark:border-red-500/20 dark:bg-red-500/10">
        <CardContent className="p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-red-500/15">
                <Trash2 className="size-5 text-red-500" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                  Delete All Data
                </span>
                <p className="text-xs text-muted-foreground">
                  Permanently remove all your documents, issues, and activity history. This action
                  cannot be undone.
                </p>
                <div className="flex items-center gap-1.5 text-[11px] text-red-500/70">
                  <Shield className="size-3" />
                  <span>Your data stays on your device. Deletion is permanent and irrecoverable.</span>
                </div>
              </div>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  className="shrink-0 gap-1.5"
                >
                  <Trash2 className="size-3.5" />
                  Delete All Data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="size-5 text-red-500" />
                    Delete All Data?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all your uploaded documents, detected issues,
                    notifications, and activity history. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={deleteAllData}
                    className="bg-red-500 text-white hover:bg-red-600 focus:ring-red-500"
                  >
                    Yes, Delete Everything
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   Dashboard — Main component
   ════════════════════════════════════════════════════════════════════════════ */

export default function Dashboard() {
  const user = useAppStore((s) => s.user);
  const documents = useAppStore((s) => s.documents);
  const issues = useAppStore((s) => s.issues);
  const notifications = useAppStore((s) => s.notifications);
  const getHealthScore = useAppStore((s) => s.getHealthScore);

  const healthScore = getHealthScore();
  const openIssues = useMemo(() => issues.filter((i) => i.status === 'open'), [issues]);
  const resolvedIssues = useMemo(() => issues.filter((i) => i.status === 'resolved'), [issues]);

  const upcomingExpiries = useMemo(() => {
    const now = new Date();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    return documents.filter((doc) => {
      if (!doc.expiryDate) return false;
      const expiry = new Date(doc.expiryDate);
      const diff = expiry.getTime() - now.getTime();
      return diff > 0 && diff < thirtyDays;
    }).length;
  }, [documents]);

  const currentDate = useMemo(
    () =>
      new Date().toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    []
  );

  const userInitials = useMemo(() => {
    if (!user?.name) return 'U';
    return user.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, [user]);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6">
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="space-y-6"
      >
        {/* ──────── 1. Welcome Card ──────── */}
        <motion.div variants={staggerItem}>
          <Card className="overflow-hidden border-border/40 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-card backdrop-blur-md">
            <CardContent className="p-5 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="size-14 border-2 border-emerald-500/30 shadow-md shadow-emerald-500/10">
                    <AvatarFallback className="bg-emerald-100 text-lg font-bold text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-xl font-bold text-foreground sm:text-2xl">
                      Welcome back, {user?.name || 'User'}!
                    </h2>
                    <p className="text-sm text-muted-foreground">{currentDate}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5">
                  <Shield className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                    Your Documents. Your Device. Your Privacy.
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ──────── 2. Health Score Card ──────── */}
        <motion.div variants={staggerItem}>
          <Card className="overflow-hidden border-border/40 bg-card/60 backdrop-blur-md transition-shadow duration-300 hover:shadow-lg hover:shadow-emerald-500/5">
            <CardHeader className="items-center text-center">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/15">
                  <Activity className="size-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <CardTitle className="text-base">Document Health Score</CardTitle>
              </div>
              <CardDescription>
                Overall health of your document portfolio
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center pb-6">
              <HealthScoreRing score={healthScore} />
              <p className="mt-3 text-center text-sm text-muted-foreground max-w-xs">
                {healthScore >= 80
                  ? 'Your documents are in great shape! Continue keeping them updated.'
                  : healthScore >= 50
                    ? 'Some issues need your attention. Review and resolve them to improve your score.'
                    : healthScore > 0
                      ? 'Critical issues detected. Immediate action recommended to protect your document health.'
                      : 'Upload documents and run analysis to get your health score.'}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* ──────── 3. Statistics Cards ──────── */}
        <motion.div
          variants={staggerContainer}
          className="grid grid-cols-2 gap-4 lg:grid-cols-4"
        >
          <StatCard
            icon={FileText}
            label="Total Documents"
            value={documents.length}
            accent="#10b981"
          />
          <StatCard
            icon={AlertTriangle}
            label="Open Issues"
            value={openIssues.length}
            accent={openIssues.length > 0 ? '#ef4444' : '#10b981'}
            subtitle={openIssues.length > 0 ? 'Needs attention' : 'All clear'}
          />
          <StatCard
            icon={CheckCircle2}
            label="Resolved Issues"
            value={resolvedIssues.length}
            accent="#0d9488"
          />
          <StatCard
            icon={Clock}
            label="Upcoming Expiries"
            value={upcomingExpiries}
            accent={upcomingExpiries > 0 ? '#f59e0b' : '#10b981'}
            subtitle={upcomingExpiries > 0 ? 'Within 30 days' : 'None soon'}
          />
        </motion.div>

        {/* ──────── Middle row: AI Recommendations + Document Distribution ──────── */}
        <div className="grid gap-6 md:grid-cols-2">
          <AIRecommendationsCard />
          <DocumentDistributionChart />
        </div>

        {/* ──────── Middle row: Activity + Quick Actions ──────── */}
        <div className="grid gap-6 md:grid-cols-2">
          <RecentActivityTimeline />
          <QuickActionsCard />
        </div>

        {/* ──────── Notifications Card ──────── */}
        <UpcomingNotificationsCard />

        {/* ──────── 9. Delete All Data Card ──────── */}
        <DeleteAllDataCard />
      </motion.div>
    </div>
  );
}
