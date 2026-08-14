'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  Edit3,
  Save,
  X,
  Shield,
  FileText,
  CheckCircle2,
  Activity,
} from 'lucide-react';

import { useAppStore, type UserProfile } from '@/lib/store';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

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

/* ──────────────────────── Indian states list ──────────────────────── */

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

const GENDERS = ['Male', 'Female', 'Non-Binary', 'Other', 'Prefer not to say'];
const CATEGORIES = ['General', 'OBC', 'SC', 'ST', 'EWS', 'Other'];

/* ════════════════════════════════════════════════════════════════════════════
   ProfileView — User profile view and editor
   ════════════════════════════════════════════════════════════════════════════ */

export default function ProfileView() {
  const user = useAppStore((s) => s.user);
  const updateUser = useAppStore((s) => s.updateUser);
  const documents = useAppStore((s) => s.documents);
  const getResolvedIssueCount = useAppStore((s) => s.getResolvedIssueCount);
  const activities = useAppStore((s) => s.activities);

  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<UserProfile>>({});

  const resolvedIssues = getResolvedIssueCount();

  /* ── User initials ── */
  const initials = useMemo(() => {
    const name = user?.name || 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, [user?.name]);

  /* ── Member since ── */
  const memberSince = useMemo(() => {
    if (activities.length > 0) {
      const oldest = activities[activities.length - 1];
      return new Date(oldest.timestamp).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
      });
    }
    return new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long' });
  }, [activities]);

  /* ── Start editing ── */
  const startEditing = useCallback(() => {
    if (user) {
      setEditForm({
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        age: user.age,
        gender: user.gender || '',
        category: user.category || '',
        income: user.income || '',
        occupation: user.occupation || '',
        state: user.state || '',
      });
      setEditing(true);
    }
  }, [user]);

  /* ── Save changes ── */
  const saveChanges = useCallback(() => {
    updateUser({
      name: editForm.name,
      email: editForm.email,
      phone: editForm.phone || undefined,
      age: editForm.age ? Number(editForm.age) : undefined,
      gender: editForm.gender || undefined,
      category: editForm.category || undefined,
      income: editForm.income || undefined,
      occupation: editForm.occupation || undefined,
      state: editForm.state || undefined,
    });
    setEditing(false);
  }, [editForm, updateUser]);

  /* ── Cancel editing ── */
  const cancelEditing = useCallback(() => {
    setEditing(false);
    setEditForm({});
  }, []);

  /* ── Update edit form field ── */
  const updateField = useCallback((field: keyof UserProfile, value: string) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  /* ── If no user, show message ── */
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <User className="mb-4 size-12 text-muted-foreground/30" />
        <p className="text-lg font-medium text-muted-foreground">No profile found</p>
        <p className="text-sm text-muted-foreground/70">Please log in to view your profile</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-6">
      {/* ══════════════════ Profile Header Card ══════════════════ */}
      <motion.div {...fadeInUp} transition={{ duration: 0.4 }}>
        <Card className="overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-emerald-500 to-emerald-600" />
          <CardContent className="relative px-6 pb-6 pt-0">
            <div className="-mt-12 flex items-end gap-4">
              <Avatar className="size-24 border-4 border-background shadow-lg">
                <AvatarFallback className="bg-emerald-100 text-2xl font-bold text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="mb-1 flex-1">
                <h2 className="text-xl font-bold text-foreground">{user.name}</h2>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
              {!editing ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startEditing}
                  className="mb-1 gap-1.5"
                >
                  <Edit3 className="size-3.5" />
                  Edit Profile
                </Button>
              ) : (
                <div className="mb-1 flex gap-2">
                  <Button
                    size="sm"
                    onClick={saveChanges}
                    className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    <Save className="size-3.5" />
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={cancelEditing}
                    className="gap-1.5"
                  >
                    <X className="size-3.5" />
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="space-y-6"
      >
        {/* ══════════════════ Profile Details ══════════════════ */}
        <motion.div variants={staggerItem}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="size-5 text-emerald-600" />
                Profile Details
              </CardTitle>
              <CardDescription>
                {editing ? 'Edit your profile information' : 'Your personal information'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Name */}
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <User className="size-3" /> Full Name
                  </Label>
                  {editing ? (
                    <Input
                      value={editForm.name || ''}
                      onChange={(e) => updateField('name', e.target.value)}
                      placeholder="Enter your name"
                    />
                  ) : (
                    <p className="rounded-md border border-border/50 px-3 py-2 text-sm">
                      {user.name || '—'}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Mail className="size-3" /> Email
                  </Label>
                  {editing ? (
                    <Input
                      value={editForm.email || ''}
                      onChange={(e) => updateField('email', e.target.value)}
                      placeholder="Enter your email"
                      type="email"
                    />
                  ) : (
                    <p className="rounded-md border border-border/50 px-3 py-2 text-sm">
                      {user.email || '—'}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Phone className="size-3" /> Phone
                  </Label>
                  {editing ? (
                    <Input
                      value={editForm.phone || ''}
                      onChange={(e) => updateField('phone', e.target.value)}
                      placeholder="Enter your phone number"
                      type="tel"
                    />
                  ) : (
                    <p className="rounded-md border border-border/50 px-3 py-2 text-sm">
                      {user.phone || '—'}
                    </p>
                  )}
                </div>

                {/* Age */}
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="size-3" /> Age
                  </Label>
                  {editing ? (
                    <Input
                      value={editForm.age || ''}
                      onChange={(e) => updateField('age', e.target.value)}
                      placeholder="Enter your age"
                      type="number"
                      min={0}
                      max={120}
                    />
                  ) : (
                    <p className="rounded-md border border-border/50 px-3 py-2 text-sm">
                      {user.age ? `${user.age} years` : '—'}
                    </p>
                  )}
                </div>

                {/* Gender */}
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <User className="size-3" /> Gender
                  </Label>
                  {editing ? (
                    <select
                      value={editForm.gender || ''}
                      onChange={(e) => updateField('gender', e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="">Select gender</option>
                      {GENDERS.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="rounded-md border border-border/50 px-3 py-2 text-sm">
                      {user.gender || '—'}
                    </p>
                  )}
                </div>

                {/* Category */}
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Shield className="size-3" /> Category
                  </Label>
                  {editing ? (
                    <select
                      value={editForm.category || ''}
                      onChange={(e) => updateField('category', e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="">Select category</option>
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="rounded-md border border-border/50 px-3 py-2 text-sm">
                      {user.category ? (
                        <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                          {user.category}
                        </Badge>
                      ) : (
                        '—'
                      )}
                    </p>
                  )}
                </div>

                {/* Income */}
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Briefcase className="size-3" /> Income
                  </Label>
                  {editing ? (
                    <Input
                      value={editForm.income || ''}
                      onChange={(e) => updateField('income', e.target.value)}
                      placeholder="e.g., Below ₹1 Lakh"
                    />
                  ) : (
                    <p className="rounded-md border border-border/50 px-3 py-2 text-sm">
                      {user.income || '—'}
                    </p>
                  )}
                </div>

                {/* Occupation */}
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Briefcase className="size-3" /> Occupation
                  </Label>
                  {editing ? (
                    <Input
                      value={editForm.occupation || ''}
                      onChange={(e) => updateField('occupation', e.target.value)}
                      placeholder="Enter your occupation"
                    />
                  ) : (
                    <p className="rounded-md border border-border/50 px-3 py-2 text-sm">
                      {user.occupation || '—'}
                    </p>
                  )}
                </div>

                {/* State */}
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="size-3" /> State / UT
                  </Label>
                  {editing ? (
                    <select
                      value={editForm.state || ''}
                      onChange={(e) => updateField('state', e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="">Select state</option>
                      {INDIAN_STATES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="rounded-md border border-border/50 px-3 py-2 text-sm">
                      {user.state || '—'}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ══════════════════ Account Stats ══════════════════ */}
        <motion.div variants={staggerItem}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Account Statistics</CardTitle>
              <CardDescription>Your activity at a glance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  {
                    label: 'Documents',
                    value: documents.length,
                    icon: FileText,
                    color: 'text-emerald-600',
                    bg: 'bg-emerald-500/10',
                  },
                  {
                    label: 'Issues Resolved',
                    value: resolvedIssues,
                    icon: CheckCircle2,
                    color: 'text-emerald-600',
                    bg: 'bg-emerald-500/10',
                  },
                  {
                    label: 'Member Since',
                    value: memberSince,
                    icon: Calendar,
                    color: 'text-amber-600',
                    bg: 'bg-amber-500/10',
                    isText: true,
                  },
                  {
                    label: 'Activities',
                    value: activities.length,
                    icon: Activity,
                    color: 'text-blue-600',
                    bg: 'bg-blue-500/10',
                  },
                ].map((stat) => {
                  const SIcon = stat.icon;
                  return (
                    <div
                      key={stat.label}
                      className="flex flex-col items-center rounded-lg border border-border/50 p-4 text-center"
                    >
                      <div className={`mb-2 flex size-10 items-center justify-center rounded-lg ${stat.bg}`}>
                        <SIcon className={`size-5 ${stat.color}`} />
                      </div>
                      <p className={`font-bold text-foreground ${stat.isText ? 'text-sm' : 'text-2xl'}`}>
                        {stat.value}
                      </p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ══════════════════ Privacy Badge ══════════════════ */}
        <motion.div
          variants={staggerItem}
          className="flex items-center justify-center gap-2 rounded-lg bg-emerald-50 px-4 py-4 dark:bg-emerald-950/30"
        >
          <Shield className="size-5 text-emerald-600" />
          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
            Your Documents. Your Device. Your Privacy.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
