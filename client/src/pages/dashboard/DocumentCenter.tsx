import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import {
  UploadCloud,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  Eye,
  Trash2,
  ExternalLink,
  ShieldCheck,
  X,
} from 'lucide-react';

interface DocumentItem {
  _id: string;
  docType: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  status: 'uploaded' | 'processing' | 'completed' | 'failed';
  verified: boolean;
  createdAt: string;
  validationWarnings?: Array<{ field: string; message: string }>;
}

export const DocumentCenter: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState('cnic_front');
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const docTypes = [
    { value: 'cnic_front', label: 'CNIC / Form-B (Front)' },
    { value: 'cnic_back', label: 'CNIC (Back)' },
    { value: 'matric_marksheet', label: 'Matric (SSC) Marksheet' },
    { value: 'inter_marksheet', label: 'Intermediate (HSSC) Marksheet' },
    { value: 'domicile', label: 'Domicile Certificate (Kohat / KP)' },
  ];

  const fetchDocuments = async () => {
    try {
      const res = await api.get('/api/v1/documents');
      if (res.data.success) {
        setDocuments(res.data.data.documents);
      }
    } catch (err) {
      console.error('Failed to fetch documents', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
    // Poll for OCR status updates if any document is in processing
    const interval = setInterval(() => {
      setDocuments((prev) => {
        if (prev.some((d) => d.status === 'processing' || d.status === 'uploaded')) {
          fetchDocuments();
        }
        return prev;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleUpload = async (file: File) => {
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds the 10MB limit.');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('docType', selectedDocType);

    try {
      await api.post('/api/v1/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await fetchDocuments();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  const openPreview = async (doc: DocumentItem) => {
    setPreviewDoc(doc);
    try {
      const res = await api.get(`/api/v1/documents/${doc._id}/url`);
      setPreviewUrl(res.data.data.viewUrl);
    } catch {
      alert('Failed to obtain secure preview URL');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      await api.delete(`/api/v1/documents/${id}`);
      setDocuments(documents.filter((d) => d._id !== id));
      if (previewDoc?._id === id) {
        setPreviewDoc(null);
        setPreviewUrl(null);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  const formatDocType = (type: string) => {
    const item = docTypes.find((d) => d.value === type);
    return item ? item.label : type;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Document Center</h1>
        <p className="text-sm text-slate-500 mt-1">
          Upload and manage your official identity cards and academic marksheets with private storage.
        </p>
      </div>

      {/* Upload Zone */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-4 md:col-span-1">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                1. Select Document Category
              </label>
              <select
                value={selectedDocType}
                onChange={(e) => setSelectedDocType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium"
              >
                {docTypes.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-900 leading-relaxed">
              <span className="font-semibold block mb-1">NADRA & BISE Compatibility</span>
              Ensure the photograph and text (Roll number, CNIC, and Marks) are clearly visible with minimal glare. Supported: JPEG, PNG, PDF up to 10MB.
            </div>
          </div>

          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`md:col-span-2 border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
              dragActive
                ? 'border-indigo-500 bg-indigo-50/40'
                : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
            />

            <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mb-3">
              <UploadCloud className="w-6 h-6" />
            </div>

            <p className="text-sm font-semibold text-slate-800">
              {uploading ? 'Uploading and preprocessing...' : 'Click to upload or drag & drop'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Selected: <span className="font-medium text-indigo-600">{formatDocType(selectedDocType)}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Documents Grid / Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-slate-800 text-base">Your Stored Documents</h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
              {documents.length}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">Loading documents...</div>
        ) : documents.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700">No documents uploaded yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Upload your CNIC or marksheet above to kick off automated OCR extraction.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {documents.map((doc) => (
              <div
                key={doc._id}
                className="p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">{formatDocType(doc.docType)}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {doc.originalName} • {(doc.fileSize / 1024).toFixed(1)} KB •{' '}
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </p>
                    {doc.validationWarnings && doc.validationWarnings.length > 0 && (
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-amber-600">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>{doc.validationWarnings.length} validation notice(s)</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  {/* Status Badges */}
                  {doc.status === 'processing' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                      <Clock className="w-3.5 h-3.5 animate-spin" />
                      OCR Processing
                    </span>
                  )}
                  {doc.status === 'completed' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle className="w-3.5 h-3.5" />
                      {doc.verified ? 'Verified & Synced' : 'OCR Ready'}
                    </span>
                  )}
                  {doc.status === 'failed' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                      Failed
                    </span>
                  )}

                  {/* Actions */}
                  <button
                    onClick={() => openPreview(doc)}
                    className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Private Preview"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  <Link
                    to={`/review?docId=${doc._id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold transition-colors"
                  >
                    <span>Review & Confirm</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>

                  <button
                    onClick={() => handleDelete(doc._id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete document"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Private Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <span className="font-bold text-sm text-slate-800">
                  {formatDocType(previewDoc.docType)} - Private Preview
                </span>
              </div>
              <button
                onClick={() => {
                  setPreviewDoc(null);
                  setPreviewUrl(null);
                }}
                className="text-slate-400 hover:text-slate-700 p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto flex items-center justify-center bg-slate-950/5">
              {previewUrl ? (
                previewDoc.mimeType === 'application/pdf' ? (
                  <iframe src={previewUrl} className="w-full h-[500px] rounded border" />
                ) : (
                  <img
                    src={previewUrl}
                    alt={previewDoc.originalName}
                    className="max-h-[500px] object-contain rounded shadow"
                  />
                )
              ) : (
                <div className="p-8 text-slate-400 text-sm">Loading private image securely...</div>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 bg-slate-50">
              <span>Isolated by RBAC & Session Token</span>
              <Link
                to={`/review?docId=${previewDoc._id}`}
                className="px-3.5 py-1.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition-colors"
              >
                Open in Side-by-Side Review
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
