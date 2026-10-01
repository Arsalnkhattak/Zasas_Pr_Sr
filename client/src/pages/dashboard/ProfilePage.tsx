import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import {
  UserCheck,
  CheckCircle2,
  GraduationCap,
  CreditCard,
  BookOpen,
  ArrowRight,
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/api/v1/profile');
        if (res.data.success) {
          setProfile(res.data.data.profile);
        }
      } catch (err) {
        console.error('Failed to load profile', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) {
    return <div className="p-12 text-center text-sm text-slate-500">Loading profile data...</div>;
  }

  if (!profile || !profile.isConfirmed) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-xl mx-auto shadow-sm">
        <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-200">
          <UserCheck className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Student Profile Not Confirmed Yet</h2>
        <p className="text-sm text-slate-500 mt-2 leading-relaxed">
          To generate your verified student profile, upload your documents in the Document Center and complete the Side-by-Side Review.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            to="/documents"
            className="px-4 py-2.5 rounded-lg bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-500 transition-colors shadow-md"
          >
            Upload Documents
          </Link>
          <Link
            to="/review"
            className="px-4 py-2.5 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition-colors"
          >
            Open Review UI
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center font-bold text-2xl shadow-lg shadow-indigo-500/30">
            {profile.fullName?.charAt(0) || 'U'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">{profile.fullName}</h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Verified Student
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Father's Name: <span className="font-semibold text-slate-700">{profile.fatherName}</span> • Domicile: <span className="font-semibold text-slate-700">{profile.domicileDistrict}</span>
            </p>
          </div>
        </div>

        <Link
          to="/programs"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all"
        >
          <span>Find Kohat Programs</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Identity & Personal Info */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
          <CreditCard className="w-5 h-5 text-indigo-600" />
          <h2 className="font-bold text-slate-800 text-base">Verified Identity Information</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div>
            <span className="block text-xs font-medium text-slate-500">CNIC / Form-B Number</span>
            <p className="font-semibold text-slate-800 mt-0.5">{profile.cnicNumber || 'N/A'}</p>
          </div>
          <div>
            <span className="block text-xs font-medium text-slate-500">Date of Birth</span>
            <p className="font-semibold text-slate-800 mt-0.5">{profile.dateOfBirth || 'N/A'}</p>
          </div>
          <div>
            <span className="block text-xs font-medium text-slate-500">Gender</span>
            <p className="font-semibold text-slate-800 mt-0.5">{profile.gender || 'N/A'}</p>
          </div>
          <div>
            <span className="block text-xs font-medium text-slate-500">Domicile District</span>
            <p className="font-semibold text-slate-800 mt-0.5">{profile.domicileDistrict || 'Kohat'}</p>
          </div>
          <div className="md:col-span-2">
            <span className="block text-xs font-medium text-slate-500">Address</span>
            <p className="font-semibold text-slate-800 mt-0.5">{profile.address || 'KDA Kohat, Khyber Pakhtunkhwa'}</p>
          </div>
        </div>
      </div>

      {/* Academic Credentials */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Matric */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-slate-800 text-sm">Matriculation (SSC)</h3>
            </div>
            {profile.matric && (
              <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                {profile.matric.percentage}%
              </span>
            )}
          </div>

          {profile.matric ? (
            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Board:</span>
                <span className="font-bold text-slate-800">{profile.matric.board}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Roll Number:</span>
                <span className="font-bold text-slate-800">{profile.matric.rollNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Passing Year:</span>
                <span className="font-bold text-slate-800">{profile.matric.passingYear}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Marks:</span>
                <span className="font-bold text-slate-800">
                  {profile.matric.obtainedMarks} / {profile.matric.totalMarks}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400">No matric marksheet confirmed yet</p>
          )}
        </div>

        {/* Intermediate */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-violet-600" />
              <h3 className="font-bold text-slate-800 text-sm">Intermediate (HSSC)</h3>
            </div>
            {profile.intermediate && (
              <span className="text-xs font-black text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full border border-violet-100">
                {profile.intermediate.percentage}%
              </span>
            )}
          </div>

          {profile.intermediate ? (
            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Discipline / Group:</span>
                <span className="font-bold text-violet-700">{profile.intermediate.group || 'Pre-Engineering'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Board:</span>
                <span className="font-bold text-slate-800">{profile.intermediate.board}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Roll Number:</span>
                <span className="font-bold text-slate-800">{profile.intermediate.rollNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Passing Year:</span>
                <span className="font-bold text-slate-800">{profile.intermediate.passingYear}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Marks:</span>
                <span className="font-bold text-slate-800">
                  {profile.intermediate.obtainedMarks} / {profile.intermediate.totalMarks}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400">No intermediate marksheet confirmed yet</p>
          )}
        </div>
      </div>
    </div>
  );
};
