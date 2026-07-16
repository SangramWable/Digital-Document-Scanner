'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Settings,
  Moon,
  Sun,
  Eye,
  Shield,
  Trash2,
  Download,
  Upload,
  AlertTriangle,
  Lock,
  Monitor,
  Palette,
} from 'lucide-react';

import { useAppStore } from '@/lib/store';
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
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  animate: { transition: { staggerChildren: 0.07 } },
};

const staggerItem = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

/* ════════════════════════════════════════════════════════════════════════════
   SettingsView — App settings and preferences
   ════════════════════════════════════════════════════════════════════════════ */

export default function SettingsView() {
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const deleteAllData = useAppStore((s) => s.deleteAllData);
  const documents = useAppStore((s) => s.documents);
  const issues = useAppStore((s) => s.issues);
  const notifications = useAppStore((s) => s.notifications);
  const chatMessages = useAppStore((s) => s.chatMessages);
  const user = useAppStore((s) => s.user);

  const [largeFonts, setLargeFonts] = useState(false);
  const [highContrastMode, setHighContrastMode] = useState(theme === 'high-contrast');

  /* ── Handle theme change ── */
  const handleThemeChange = useCallback(
    (value: string) => {
      setTheme(value as 'light' | 'dark' | 'high-contrast');
      if (value === 'high-contrast') {
        setHighContrastMode(true);
      } else {
        setHighContrastMode(false);
      }
    },
    [setTheme]
  );

  /* ── Export data as JSON ── */
  const handleExportData = useCallback(() => {
    const exportObj = {
      exportedAt: new Date().toISOString(),
      user,
      documents,
      issues,
      notifications,
      chatMessages,
    };
    const json = JSON.stringify(exportObj, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `docsync-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [user, documents, issues, notifications, chatMessages]);

  /* ── Data size estimate ── */
  const dataCount = documents.length + issues.length + notifications.length + chatMessages.length;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-6">
      {/* ── Header ── */}
      <motion.div {...fadeInUp} transition={{ duration: 0.4 }}>
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10">
            <Settings className="size-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Settings</h2>
            <p className="text-sm text-muted-foreground">
              Manage your preferences and privacy
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="space-y-6"
      >
        {/* ══════════════════ Appearance ══════════════════ */}
        <motion.div variants={staggerItem}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Palette className="size-5 text-emerald-600" />
                Appearance
              </CardTitle>
              <CardDescription>
                Customize how DocSync India looks for you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Theme selector */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                    {theme === 'dark' ? (
                      <Moon className="size-4 text-foreground" />
                    ) : theme === 'high-contrast' ? (
                      <Eye className="size-4 text-foreground" />
                    ) : (
                      <Sun className="size-4 text-foreground" />
                    )}
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Theme</Label>
                    <p className="text-xs text-muted-foreground">Choose your preferred color theme</p>
                  </div>
                </div>
                <Select value={theme} onValueChange={handleThemeChange}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">
                      <span className="flex items-center gap-2">
                        <Sun className="size-3.5" /> Light
                      </span>
                    </SelectItem>
                    <SelectItem value="dark">
                      <span className="flex items-center gap-2">
                        <Moon className="size-3.5" /> Dark
                      </span>
                    </SelectItem>
                    <SelectItem value="high-contrast">
                      <span className="flex items-center gap-2">
                        <Eye className="size-3.5" /> High Contrast
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Large Fonts */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                    <span className="text-base font-bold text-foreground">Aa</span>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Large Fonts</Label>
                    <p className="text-xs text-muted-foreground">Increase text size for better readability</p>
                  </div>
                </div>
                <Switch
                  checked={largeFonts}
                  onCheckedChange={setLargeFonts}
                  aria-label="Toggle large fonts"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ══════════════════ Privacy & Security ══════════════════ */}
        <motion.div variants={staggerItem}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="size-5 text-emerald-600" />
                Privacy & Security
              </CardTitle>
              <CardDescription>
                Your data stays on your device
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Privacy notice */}
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/30">
                <div className="flex items-start gap-3">
                  <Lock className="mt-0.5 size-5 shrink-0 text-emerald-600" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                      Your Documents. Your Device. Your Privacy.
                    </p>
                    <p className="mt-1 text-xs text-emerald-600/80 dark:text-emerald-400/70">
                      All your documents and data are stored locally on your device using browser storage.
                      No data is sent to any external server. You have complete control over your information.
                    </p>
                  </div>
                </div>
              </div>

              {/* Storage info */}
              <div className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                <div className="flex items-center gap-3">
                  <Monitor className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Local Storage</p>
                    <p className="text-xs text-muted-foreground">
                      {dataCount} items stored locally in your browser
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  On Device
                </Badge>
              </div>

              <Separator />

              {/* Delete All Data */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600">Delete All Data</p>
                  <p className="text-xs text-muted-foreground">
                    Permanently remove all documents, issues, and notifications
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="gap-1.5">
                      <Trash2 className="size-3.5" />
                      Delete All
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="size-5 text-red-500" />
                        Delete All Data?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. All your documents, detected issues,
                        notifications, and chat messages will be permanently deleted from your
                        device. Your account will remain active.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={deleteAllData}
                        className="bg-red-600 text-white hover:bg-red-700"
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

        {/* ══════════════════ Accessibility ══════════════════ */}
        <motion.div variants={staggerItem}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Eye className="size-5 text-emerald-600" />
                Accessibility
              </CardTitle>
              <CardDescription>
                Make DocSync India more accessible
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* High Contrast Mode */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">High Contrast Mode</Label>
                  <p className="text-xs text-muted-foreground">
                    Increase contrast for better visibility
                  </p>
                </div>
                <Switch
                  checked={highContrastMode}
                  onCheckedChange={(checked) => {
                    setHighContrastMode(checked);
                    if (checked) {
                      setTheme('high-contrast');
                    } else {
                      setTheme('light');
                    }
                  }}
                  aria-label="Toggle high contrast mode"
                />
              </div>

              <Separator />

              {/* Large Fonts (accessibility section) */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Large Fonts</Label>
                  <p className="text-xs text-muted-foreground">
                    Increase text size throughout the app
                  </p>
                </div>
                <Switch
                  checked={largeFonts}
                  onCheckedChange={setLargeFonts}
                  aria-label="Toggle large fonts"
                />
              </div>

              <Separator />

              {/* Screen Reader note */}
              <div className="flex items-start gap-3 rounded-lg bg-muted/30 p-3">
                <Eye className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Screen Reader Compatible</p>
                  <p className="text-xs text-muted-foreground">
                    DocSync India is built with semantic HTML and ARIA labels for screen reader
                    compatibility. All interactive elements are keyboard accessible.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ══════════════════ Data Management ══════════════════ */}
        <motion.div variants={staggerItem}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Upload className="size-5 text-emerald-600" />
                Data Management
              </CardTitle>
              <CardDescription>
                Export or delete your data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Export Data */}
              <div className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                <div className="flex items-center gap-3">
                  <Download className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Export Data</p>
                    <p className="text-xs text-muted-foreground">
                      Download all your data as a JSON file
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportData}
                  className="gap-1.5"
                  disabled={dataCount === 0}
                >
                  <Download className="size-3.5" />
                  Export
                </Button>
              </div>

              {/* Delete All Data */}
              <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50/50 p-3 dark:border-red-800 dark:bg-red-950/20">
                <div className="flex items-center gap-3">
                  <Trash2 className="size-4 text-red-500" />
                  <div>
                    <p className="text-sm font-medium text-red-600">Delete All Data</p>
                    <p className="text-xs text-red-500/70">
                      This cannot be undone. All data will be permanently removed.
                    </p>
                  </div>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="gap-1.5">
                      <Trash2 className="size-3.5" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="size-5 text-red-500" />
                        Delete All Data?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently remove all your documents, issues, notifications,
                        and chat history. Your account will remain but all associated data will be gone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={deleteAllData}
                        className="bg-red-600 text-white hover:bg-red-700"
                      >
                        Delete Everything
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ══════════════════ About ══════════════════ */}
        <motion.div variants={staggerItem}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="size-5 text-emerald-600" />
                About DocSync India
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Version */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">App Version</p>
                <Badge variant="outline" className="font-mono text-xs">
                  1.0.0
                </Badge>
              </div>

              <Separator />

              {/* Privacy policy summary */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Privacy Policy</p>
                <div className="rounded-lg bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
                  <p className="mb-2">
                    <strong>Local-First Privacy:</strong> All document processing happens on your device.
                    No documents, extracted data, or personal information is transmitted to any external server.
                  </p>
                  <p className="mb-2">
                    <strong>Data Storage:</strong> Your data is stored in your browser&apos;s local storage.
                    Clearing your browser data will remove all stored information.
                  </p>
                  <p>
                    <strong>No Tracking:</strong> DocSync India does not use analytics, tracking pixels,
                    or any third-party data collection services.
                  </p>
                </div>
              </div>

              <Separator />

              {/* Disclaimer */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Disclaimer</p>
                <div className="rounded-lg bg-amber-50 p-3 text-xs leading-relaxed text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
                  <p>
                    DocSync India is an assistive tool designed to help Indian citizens manage their
                    government documents. It does not replace official government services or legal
                    advice. Always verify document requirements with the relevant government authorities.
                    The AI-powered analysis provides suggestions that should be reviewed by the user
                    before taking any action.
                  </p>
                </div>
              </div>

              {/* Privacy badge */}
              <div className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 dark:bg-emerald-950/30">
                <Lock className="size-4 text-emerald-600" />
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  Your Documents. Your Device. Your Privacy.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
