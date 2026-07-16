'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  CheckCircle2,
  ArrowRight,
  Filter,
  Star,
} from 'lucide-react';

import { useAppStore } from '@/lib/store';
import { GOVERNMENT_SCHEMES } from '@/lib/data';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

/* ──────────────────────── Constants ──────────────────────── */

const CATEGORIES = ['General', 'OBC', 'SC', 'ST', 'EWS', 'Minority'] as const;
const GENDERS = ['Male', 'Female', 'Other'] as const;
const INCOME_RANGES = [
  'Below ₹1 Lakh',
  '₹1 Lakh - ₹3 Lakh',
  '₹3 Lakh - ₹5 Lakh',
  '₹5 Lakh - ₹8 Lakh',
  '₹8 Lakh - ₹12 Lakh',
  'Above ₹12 Lakh',
] as const;
const OCCUPATIONS = [
  'Student',
  'Farmer',
  'Unorganized Worker',
  'Self-Employed',
  'Salaried',
  'Business Owner',
  'Homemaker',
  'Retired',
  'Unemployed',
] as const;
const STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
  'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim',
  'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand',
  'West Bengal', 'Delhi', 'Chandigarh',
] as const;

/* ──────────────────────── Types ──────────────────────── */

interface UserProfileForm {
  age: string;
  gender: string;
  category: string;
  incomeRange: string;
  occupation: string;
  state: string;
}

interface MatchResult {
  schemeId: string;
  matchScore: number;  // 0–3
  matchedCriteria: string[];
}

/* ──────────────────────── Filter logic ──────────────────────── */

function computeMatches(profile: UserProfileForm): MatchResult[] {
  const age = parseInt(profile.age, 10);
  const results: MatchResult[] = [];

  for (const scheme of GOVERNMENT_SCHEMES) {
    const matchedCriteria: string[] = [];
    let score = 0;

    /* Age check */
    const minAge = scheme.eligibility.minAge ?? 0;
    const maxAge = scheme.eligibility.maxAge ?? 150;
    if (!isNaN(age) && age >= minAge && age <= maxAge) {
      score += 1;
      matchedCriteria.push('Age');
    }

    /* Category overlap */
    const schemeCats = scheme.eligibility.category as readonly string[];
    const userCat = profile.category;
    const catMatch =
      schemeCats.includes('All') ||
      (userCat && schemeCats.some((c) => c.toLowerCase() === userCat.toLowerCase()));
    if (catMatch) {
      score += 1;
      matchedCriteria.push('Category');
    }

    /* Occupation heuristic */
    const occupation = profile.occupation;
    const schemeDesc = (scheme.description + ' ' + scheme.benefits).toLowerCase();
    if (occupation) {
      let occMatch = false;
      if (occupation === 'Farmer' && (schemeDesc.includes('farmer') || schemeCats.includes('Farmer'))) occMatch = true;
      if (occupation === 'Unorganized Worker' && (schemeDesc.includes('unorganized') || schemeCats.includes('Unorganized Workers'))) occMatch = true;
      if (occupation === 'Student' && schemeDesc.includes('education')) occMatch = true;
      if (occMatch) {
        score += 1;
        matchedCriteria.push('Occupation');
      }
    }

    /* Only include schemes with at least one match or partial match */
    if (matchedCriteria.length > 0) {
      results.push({
        schemeId: scheme.id,
        matchScore: score,
        matchedCriteria,
      });
    }
  }

  /* Sort by match score descending */
  results.sort((a, b) => b.matchScore - a.matchScore);
  return results;
}

/* ════════════════════════════════════════════════════════════════════════════
   SchemeRecommendation
   ════════════════════════════════════════════════════════════════════════════ */

export default function SchemeRecommendation() {
  const user = useAppStore((s) => s.user);

  /* ── Form state (pre-fill from store if available) ── */
  const [form, setForm] = useState<UserProfileForm>({
    age: user?.age?.toString() ?? '',
    gender: user?.gender ?? '',
    category: user?.category ?? '',
    incomeRange: user?.income ?? '',
    occupation: user?.occupation ?? '',
    state: user?.state ?? '',
  });

  const [searched, setSearched] = useState(false);

  /* ── Compute matches ── */
  const matches = useMemo(() => {
    if (!searched) return [];
    return computeMatches(form);
  }, [form, searched]);

  /* ── Handle search ── */
  const handleSearch = () => {
    setSearched(true);
  };

  /* ── Helper: get scheme by id ── */
  function getScheme(id: string) {
    return GOVERNMENT_SCHEMES.find((s) => s.id === id);
  }

  /* ── Match badge color ── */
  function matchColor(score: number): string {
    if (score >= 3) return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20';
    if (score >= 2) return 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20';
    return 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20';
  }

  function matchLabel(score: number): string {
    if (score >= 3) return 'Strong Match';
    if (score >= 2) return 'Good Match';
    return 'Partial Match';
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
            <Building2 className="size-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Government Scheme Recommendations
            </h2>
            <p className="text-sm text-muted-foreground">
              Find government schemes you are eligible for based on your profile
            </p>
          </div>
        </div>
      </motion.div>

      {/* ─── User Profile Form ─── */}
      <motion.div
        {...fadeInUp}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="mb-8"
      >
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Filter className="size-5 text-emerald-600 dark:text-emerald-400" />
              <CardTitle className="text-lg">Your Profile</CardTitle>
            </div>
            <CardDescription>
              Fill in your details below and we will find schemes you may be eligible for
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Age */}
              <div className="space-y-2">
                <Label htmlFor="age" className="text-sm font-medium">
                  Age
                </Label>
                <Input
                  id="age"
                  type="number"
                  min={0}
                  max={120}
                  placeholder="Enter your age"
                  value={form.age}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, age: e.target.value }))
                  }
                  className="h-9"
                />
              </div>

              {/* Gender */}
              <div className="space-y-2">
                <Label htmlFor="gender" className="text-sm font-medium">
                  Gender
                </Label>
                <Select
                  value={form.gender}
                  onValueChange={(v) =>
                    setForm((prev) => ({ ...prev, gender: v }))
                  }
                >
                  <SelectTrigger id="gender" className="h-9">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    {GENDERS.map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-medium">
                  Category
                </Label>
                <Select
                  value={form.category}
                  onValueChange={(v) =>
                    setForm((prev) => ({ ...prev, category: v }))
                  }
                >
                  <SelectTrigger id="category" className="h-9">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Income Range */}
              <div className="space-y-2">
                <Label htmlFor="income" className="text-sm font-medium">
                  Income Range
                </Label>
                <Select
                  value={form.incomeRange}
                  onValueChange={(v) =>
                    setForm((prev) => ({ ...prev, incomeRange: v }))
                  }
                >
                  <SelectTrigger id="income" className="h-9">
                    <SelectValue placeholder="Select income range" />
                  </SelectTrigger>
                  <SelectContent>
                    {INCOME_RANGES.map((ir) => (
                      <SelectItem key={ir} value={ir}>
                        {ir}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Occupation */}
              <div className="space-y-2">
                <Label htmlFor="occupation" className="text-sm font-medium">
                  Occupation
                </Label>
                <Select
                  value={form.occupation}
                  onValueChange={(v) =>
                    setForm((prev) => ({ ...prev, occupation: v }))
                  }
                >
                  <SelectTrigger id="occupation" className="h-9">
                    <SelectValue placeholder="Select occupation" />
                  </SelectTrigger>
                  <SelectContent>
                    {OCCUPATIONS.map((o) => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* State */}
              <div className="space-y-2">
                <Label htmlFor="state" className="text-sm font-medium">
                  State
                </Label>
                <Select
                  value={form.state}
                  onValueChange={(v) =>
                    setForm((prev) => ({ ...prev, state: v }))
                  }
                >
                  <SelectTrigger id="state" className="h-9">
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator className="my-5" />

            <Button
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleSearch}
            >
              <Filter className="size-4" />
              Find Eligible Schemes
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── Eligible Schemes List ─── */}
      {searched && (
        <motion.div
          {...fadeInUp}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="mb-4 flex items-center gap-2">
            <Star className="size-5 text-amber-500" />
            <h3 className="text-lg font-semibold text-foreground">
              Eligible Schemes
            </h3>
            {matches.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {matches.length} found
              </Badge>
            )}
          </div>

          {matches.length === 0 ? (
            /* ─── No matches ─── */
            <Card className="border-dashed border-2 border-border/50">
              <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                <div className="flex size-14 items-center justify-center rounded-full bg-muted">
                  <Building2 className="size-7 text-muted-foreground" />
                </div>
                <p className="text-base font-medium text-foreground">
                  No schemes found matching your profile
                </p>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Try adjusting your profile details or check back later as new schemes are added.
                </p>
              </CardContent>
            </Card>
          ) : (
            /* ─── Scheme cards ─── */
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="grid gap-5 sm:grid-cols-2"
            >
              {matches.map((match) => {
                const scheme = getScheme(match.schemeId);
                if (!scheme) return null;

                return (
                  <motion.div key={match.schemeId} variants={staggerItem}>
                    <Card className="h-full hover:shadow-md transition-shadow duration-200">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{scheme.name}</CardTitle>
                            <CardDescription className="mt-1 text-xs leading-relaxed">
                              {scheme.description}
                            </CardDescription>
                          </div>
                          <Badge
                            variant="outline"
                            className={`shrink-0 text-[10px] px-2 py-0.5 h-auto whitespace-nowrap ${matchColor(match.matchScore)}`}
                          >
                            {matchLabel(match.matchScore)}
                          </Badge>
                        </div>
                      </CardHeader>

                      <CardContent className="pt-0 space-y-4">
                        {/* Eligibility match badges */}
                        <div className="space-y-1.5">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Matching Criteria
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {match.matchedCriteria.map((criterion) => (
                              <Badge
                                key={criterion}
                                variant="secondary"
                                className="gap-1 text-[10px] px-2 py-0 h-5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20"
                              >
                                <CheckCircle2 className="size-3" />
                                {criterion}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <Separator />

                        {/* Benefits */}
                        <div className="space-y-1.5">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Benefits
                          </p>
                          <p className="text-sm text-foreground/90 leading-relaxed">
                            {scheme.benefits}
                          </p>
                        </div>

                        <Separator />

                        {/* Eligibility details */}
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span>
                            Min Age: <strong className="text-foreground">{scheme.eligibility.minAge ?? 'N/A'}</strong>
                          </span>
                          {scheme.eligibility.maxAge != null && (
                            <span>
                              Max Age: <strong className="text-foreground">{scheme.eligibility.maxAge}</strong>
                            </span>
                          )}
                          <span>
                            Income: <strong className="text-foreground">{scheme.eligibility.maxIncome}</strong>
                          </span>
                        </div>

                        {/* Learn More */}
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full gap-2 hover:border-emerald-500/50 hover:text-emerald-600"
                          onClick={() => {
                            /* placeholder — could navigate to a detail page */
                          }}
                        >
                          Learn More
                          <ArrowRight className="size-3.5" />
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
}
