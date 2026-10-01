import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../../api/client';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  CheckCircle2,
  AlertTriangle,
  Save,
  ShieldCheck,
  RefreshCw,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface ExtractedFieldItem {
  _id: string;
  fieldName: string;
  fieldLabel: string;
  extractedValue: string;
  userValue?: string;
  confidence: number;
  isLowConfidence: boolean;
  userVerified: boolean;
  category: string;
}

export const ReviewConfirmPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const docIdParam = searchParams.get('docId');

  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>(docIdParam || '');
  const [documentData, setDocumentData] = useState<any>(null);
  const [fields, setFields] = useState<ExtractedFieldItem[]>([]);
  const [viewUrl, setViewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successBanner, setSuccessBanner] = useState(false);

  // Viewer transformation state
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  // Fetch list of user documents
  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const res = await api.get('/api/v1/documents');
        if (res.data.success) {
          const list = res.data.data.documents;
          setDocuments(list);
          if (!selectedDocId && list.length > 0) {
            setSelectedDocId(list[0]._id);
          }
        }
      } catch (err) {
        console.error('Failed to fetch documents', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDocs();
  }, []);

  // Fetch selected document details & extracted fields
  useEffect(() => {
    if (!selectedDocId) return;

    const fetchDetails = async () => {
      setLoading(true);
      setSuccessBanner(false);
      try {
        const [detRes, urlRes] = await Promise.all([
          api.get(`/api/v1/documents/${selectedDocId}`),
          api.get(`/api/v1/documents/${selectedDocId}/url`),
        ]);

        if (detRes.data.success) {
          setDocumentData(detRes.data.data.document);
          setFields(detRes.data.data.extractedFields || []);
        }
        if (urlRes.data.success) {
          setViewUrl(urlRes.data.data.viewUrl);
        }
      } catch (err) {
        console.error('Failed to load document details', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [selectedDocId]);

  const handleFieldChange = (index: number, val: string) => {
    setFields((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        userValue: val,
        isLowConfidence: false, // User manually edited/approved it
      };
      return copy;
    });
  };

  const handleConfirmAndSync = async () => {
    if (!selectedDocId) return;
    setSubmitting(true);

    try {
      const formattedFields = fields.map((f) => ({
        fieldName: f.fieldName,
        verifiedValue: f.userValue !== undefined && f.userValue !== '' ? f.userValue : f.extractedValue,
      }));

      const res = await api.post('/api/v1/profile/confirm', {
        documentId: selectedDocId,
        fields: formattedFields,
      });

      if (res.data.success) {
        setSuccessBanner(true);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Confirmation failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            Milestone 1: Review & Confirm Engine
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Side-by-Side Document Verification
          </h1>
          <p className="text-sm text-slate-500">
            Compare original credential scan with OCR-extracted values, correct any anomalies, and confirm into your Student Profile.
          </p>
        </div>

        {/* Document Switcher */}
        {documents.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Select Document:</span>
            <select
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500"
            >
              {documents.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.docType.replace('_', ' ').toUpperCase()} ({d.originalName})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {successBanner && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-emerald-900">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-sm font-bold">Document Confirmed & Student Profile Updated!</p>
              <p className="text-xs text-emerald-700">
                Your verified academic and identity records are now stored in your Student Profile.
              </p>
            </div>
          </div>
          <Link
            to="/profile"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors"
          >
            <span>View Student Profile</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {loading ? (
        <div className="p-16 text-center text-sm text-slate-500 bg-white rounded-2xl border border-slate-200">
          Loading verification workspace...
        </div>
      ) : !documentData ? (
        <div className="p-16 text-center bg-white rounded-2xl border border-slate-200">
          <p className="text-base font-semibold text-slate-700">No document selected or available</p>
          <p className="text-xs text-slate-400 mt-1">Please upload a document in the Document Center first.</p>
          <Link
            to="/documents"
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold"
          >
            Go to Document Center
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT PANE: Document Image Viewer */}
          <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[700px]">
            {/* Viewer Toolbar */}
            <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
              <span className="font-semibold text-slate-800">
                Original Scan: {documentData.originalName}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setZoom((z) => Math.min(z + 0.25, 2.5))}
                  className="p-1.5 bg-white border border-slate-200 rounded hover:bg-slate-100"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setZoom((z) => Math.max(z - 0.25, 0.5))}
                  className="p-1.5 bg-white border border-slate-200 rounded hover:bg-slate-100"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  className="p-1.5 bg-white border border-slate-200 rounded hover:bg-slate-100"
                  title="Rotate 90deg"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setZoom(1);
                    setRotation(0);
                  }}
                  className="p-1.5 bg-white border border-slate-200 rounded hover:bg-slate-100"
                  title="Reset View"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Document Canvas */}
            <div className="flex-1 bg-slate-900/90 overflow-auto flex items-center justify-center p-4">
              {viewUrl ? (
                <div
                  style={{
                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                    transition: 'transform 0.2s ease-out',
                  }}
                  className="origin-center shadow-2xl rounded-lg overflow-hidden max-w-full"
                >
                  <img
                    src={viewUrl}
                    alt={documentData.originalName}
                    className="max-h-[600px] object-contain rounded"
                  />
                </div>
              ) : (
                <div className="text-slate-400 text-xs">Preview unavailable</div>
              )}
            </div>
          </div>

          {/* RIGHT PANE: Editable Extracted Fields */}
          <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[700px] overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-800">
                  Extracted Structured Fields ({fields.length})
                </h2>
                <p className="text-xs text-slate-500">
                  Review values, click to correct, then confirm.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Pakistani NADRA/BISE Rules</span>
              </div>
            </div>

            {/* Form Fields List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {fields.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">
                  No extracted fields found for this document yet.
                </div>
              ) : (
                fields.map((field, idx) => {
                  const currentValue =
                    field.userValue !== undefined ? field.userValue : field.extractedValue;
                  return (
                    <div
                      key={field._id || idx}
                      className={`p-3.5 rounded-xl border transition-all ${
                        field.isLowConfidence
                          ? 'border-amber-300 bg-amber-50/40'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-slate-700">
                          {field.fieldLabel}
                        </label>
                        <div className="flex items-center gap-2">
                          {field.isLowConfidence ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              Low Confidence ({field.confidence}%)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              {field.confidence}% Match
                            </span>
                          )}
                        </div>
                      </div>

                      <input
                        type="text"
                        value={currentValue}
                        onChange={(e) => handleFieldChange(idx, e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg text-sm font-medium border focus:outline-none focus:ring-2 ${
                          field.isLowConfidence
                            ? 'border-amber-300 focus:ring-amber-500 bg-white'
                            : 'border-slate-300 focus:ring-indigo-500 bg-slate-50/50'
                        }`}
                      />
                    </div>
                  );
                })
              )}
            </div>

            {/* Confirmation Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Writes directly to verified <span className="font-semibold">StudentProfile</span>
              </span>

              <button
                onClick={handleConfirmAndSync}
                disabled={submitting || fields.length === 0}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all shadow-md shadow-indigo-600/30 disabled:opacity-50"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Confirm & Save Profile
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
