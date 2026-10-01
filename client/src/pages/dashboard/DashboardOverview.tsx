import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { RoleBadge, Badge } from '../../components/ui/Badge';
import {
  FileCheck2,
  ScanText,
  UserCheck,
  GraduationCap,
  ArrowRight,
  CheckCircle2,
  Settings,
  UploadCloud,
  Eye,
} from 'lucide-react';

// ── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard: React.FC<{
  label: string;
  value: React.ReactNode;
  sub?: string;
  icon: React.FC<{ className?: string }>;
  color?: string;
}> = ({ label, value, sub, icon: Icon, color = 'text-indigo-600' }) => (
  <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-center justify-between">
      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
      <Icon className={`h-5 w-5 ${color}`} />
    </div>
    <div>
      <p className="text-2xl font-extrabold text-slate-800">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
    </div>
  </div>
);

// ── Step Item ──────────────────────────────────────────────────────────────────
const Step: React.FC<{
  num: number;
  label: string;
  desc: string;
  done: boolean;
  to?: string;
}> = ({ num, label, desc, done, to }) => {
  const content = (
    <div
      className={`flex flex-col gap-2 rounded-xl border p-4 transition-all ${
        done ? 'border-indigo-200 bg-indigo-50/60' : 'border-slate-200 bg-white hover:border-slate-300'
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-black ${
            done ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'
          }`}
        >
          {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : num}
        </span>
        <span className="text-sm font-bold text-slate-800">{label}</span>
      </div>
      <p className="pl-8 text-xs leading-relaxed text-slate-500">{desc}</p>
    </div>
  );

  return to && !done ? <Link to={to}>{content}</Link> : content;
};

// ─────────────────────────────────────────────────────────────────────────────
export const DashboardOverview: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profRes, docsRes] = await Promise.all([
          api.get('/api/v1/profile'),
          api.get('/api/v1/documents'),
        ]);
        setProfile(profRes.data?.data?.profile);
        setDocuments(docsRes.data?.data?.documents || []);
      } catch {
        // silently handle — data will just be empty
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalDocs = documents.length;
  const verifiedDocs = documents.filter((d) => d.verified).length;
  const processingDocs = documents.filter((d) => d.status === 'processing').length;
  const hasProfile = profile?.isConfirmed;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-8">
      {/* ── Welcome Banner ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-900 p-6 text-white shadow-xl md:p-8">
        {/* Subtle gradient accent */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-indigo-600/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-16 -left-8 h-48 w-48 rounded-full bg-violet-600/10 blur-3xl"
        />

        <div className="relative z-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-xl font-black shadow-lg shadow-indigo-500/30">
                {user?.fullName?.[0]?.toUpperCase() ?? 'U'}
              </div>
              <div>
                <p className="text-xs font-medium text-slate-400">{greeting()},</p>
                <h1 className="text-xl font-extrabold tracking-tight md:text-2xl">
                  {user?.fullName}
                </h1>
                <div className="mt-1.5 flex items-center gap-2">
                  <RoleBadge role={user?.role ?? 'user'} />
                  {user?.isVerified ? (
                    <Badge variant="success" dot>Verified</Badge>
                  ) : (
                    <Badge variant="warning" dot>Pending Verification</Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Quick actions */}
            <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col">
              <Link
                to="/documents"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm shadow-indigo-600/40 transition-all hover:bg-indigo-500"
              >
                <UploadCloud className="h-3.5 w-3.5" />
                Upload Documents
              </Link>
              <Link
                to="/settings"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-2.5 text-xs font-bold text-slate-300 transition-all hover:bg-slate-700"
              >
                <Settings className="h-3.5 w-3.5" />
                Account Settings
              </Link>
            </div>
          </div>

          {/* Email row */}
          <div className="mt-4 flex items-center gap-2 border-t border-slate-700/60 pt-4">
            <span className="text-xs text-slate-500">{user?.email}</span>
            <span className="text-slate-700">·</span>
            <span className="text-xs text-slate-500">
              Member since {new Date().getFullYear()}
            </span>
          </div>
        </div>
      </div>

      {/* ── Stats Grid ─────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-200" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard
            label="Documents"
            value={totalDocs}
            sub={`${verifiedDocs} verified`}
            icon={FileCheck2}
          />
          <StatCard
            label="OCR Pipeline"
            value={processingDocs > 0 ? `${processingDocs}` : 'Idle'}
            sub={processingDocs > 0 ? 'Processing' : 'Sharp + Rules Engine'}
            icon={ScanText}
            color="text-emerald-600"
          />
          <StatCard
            label="Profile"
            value={hasProfile ? 'Confirmed' : 'Pending'}
            sub={hasProfile ? 'Ready for admissions' : 'Complete review to confirm'}
            icon={UserCheck}
            color="text-blue-600"
          />
          <StatCard
            label="Matching"
            value="Phase 3"
            sub="Eligibility Engine Ready"
            icon={GraduationCap}
            color="text-violet-600"
          />
        </div>
      )}

      {/* ── Journey Steps ──────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-base font-bold text-slate-900">Your Admission Journey</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Complete each step to become eligible for Kohat university programs.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
          <Step
            num={1}
            label="Register & Login"
            desc="JWT auth with httpOnly cookies and role-based access."
            done
          />
          <Step
            num={2}
            label="Upload Documents"
            desc="NADRA & BISE documents processed via the OCR pipeline."
            done={totalDocs > 0}
            to="/documents"
          />
          <Step
            num={3}
            label="Review & Confirm"
            desc="Side-by-side review of extracted data before confirming."
            done={hasProfile}
            to="/review"
          />
          <Step
            num={4}
            label="Kohat Admissions"
            desc="Find matching institutions and apply based on merit."
            done={false}
            to="/programs"
          />
        </div>
      </div>

      {/* ── Quick Links ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            label: 'View My Profile',
            desc: 'See your confirmed academic profile.',
            to: '/profile',
            icon: Eye,
            color: 'from-indigo-500 to-indigo-600',
          },
          {
            label: 'Explore Programs',
            desc: 'Browse Kohat university programs.',
            to: '/programs',
            icon: GraduationCap,
            color: 'from-violet-500 to-violet-600',
          },
          {
            label: 'Account Settings',
            desc: 'Edit name, password and preferences.',
            to: '/settings',
            icon: Settings,
            color: 'from-slate-600 to-slate-700',
          },
        ].map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-slate-300 hover:shadow-md"
          >
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${item.color} text-white shadow-sm`}
            >
              <item.icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800">{item.label}</p>
              <p className="text-xs text-slate-500">{item.desc}</p>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500" />
          </Link>
        ))}
      </div>
    </div>
  );
};
