import React, { useState } from 'react';
import {
  GraduationCap,
  Search,
} from 'lucide-react';

const KOHAT_PROGRAMS = [
  {
    id: 'kust-cs',
    institution: 'Kohat University of Science and Technology (KUST)',
    program: 'BS Computer Science (BSCS)',
    degree: 'Undergraduate (4 Years)',
    minPercentage: 50,
    requiredGroup: 'Pre-Engineering / ICS',
    feePerSemester: 'PKR 38,500',
    deadline: '2026-10-15',
    status: 'Admissions Open',
  },
  {
    id: 'kust-se',
    institution: 'Kohat University of Science and Technology (KUST)',
    program: 'BS Software Engineering',
    degree: 'Undergraduate (4 Years)',
    minPercentage: 60,
    requiredGroup: 'Pre-Engineering / ICS',
    feePerSemester: 'PKR 42,000',
    deadline: '2026-10-15',
    status: 'Admissions Open',
  },
  {
    id: 'kmu-kohat',
    institution: 'KMU Institute of Health Sciences, Kohat',
    program: 'Doctor of Physical Therapy (DPT)',
    degree: 'Undergraduate (5 Years)',
    minPercentage: 60,
    requiredGroup: 'Pre-Medical',
    feePerSemester: 'PKR 65,000',
    deadline: '2026-10-20',
    status: 'Admissions Open',
  },
  {
    id: 'gpck-pre-med',
    institution: 'Government Post Graduate College, Kohat',
    program: 'BS Chemistry',
    degree: 'Undergraduate (4 Years)',
    minPercentage: 45,
    requiredGroup: 'Pre-Medical / Pre-Engineering',
    feePerSemester: 'PKR 14,000',
    deadline: '2026-10-10',
    status: 'Admissions Open',
  },
];

export const ProgramsPage: React.FC = () => {
  const [search, setSearch] = useState('');

  const filtered = KOHAT_PROGRAMS.filter(
    (p) =>
      p.program.toLowerCase().includes(search.toLowerCase()) ||
      p.institution.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-xs font-semibold mb-1">
          <GraduationCap className="w-3.5 h-3.5" />
          Phase 3 Preview: Kohat Admissions
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Kohat Programs & Eligibility</h1>
        <p className="text-sm text-slate-500 mt-1">
          Explore programs in Kohat matched automatically against your confirmed student profile credentials.
        </p>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
        <Search className="w-5 h-5 text-slate-400 shrink-0" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by program name or university (e.g. Computer Science, KUST)..."
          className="w-full text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
        />
      </div>

      {/* Programs List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-all space-y-3"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold text-indigo-600 block">{item.institution}</span>
                <h3 className="font-bold text-slate-900 text-base mt-0.5">{item.program}</h3>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                {item.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
              <div>
                <span className="text-slate-400 block">Min. Intermediate Marks:</span>
                <span className="font-bold text-slate-700">{item.minPercentage}%</span>
              </div>
              <div>
                <span className="text-slate-400 block">Required Stream:</span>
                <span className="font-bold text-slate-700">{item.requiredGroup}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Tuition Fee:</span>
                <span className="font-bold text-slate-700">{item.feePerSemester}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Deadline:</span>
                <span className="font-bold text-slate-700">{item.deadline}</span>
              </div>
            </div>

            <button
              disabled
              className="w-full py-2 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg cursor-not-allowed opacity-80"
            >
              Prepare Application (Phase 4 Ready)
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
