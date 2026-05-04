'use client';

import { useState } from 'react';
import { ArrowLeft, Upload, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function VendorUploadTestPage() {
  const router = useRouter();
  const [vendorId, setVendorId] = useState('');
  const [docType, setDocType] = useState('logo');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleUpload = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);

    if (!vendorId.trim()) {
      setError('Vendor ID is required');
      return;
    }
    if (!file) {
      setError('Please select a file');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('vendorId', vendorId.trim());
      formData.append('docType', docType);

      const res = await fetch('/api/modules/vendor/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.error?.message || data?.message || 'Upload failed');
      }

      setResult(data.data);
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-2xl">
        <button
          onClick={() => router.back()}
          className="mb-4 inline-flex items-center gap-2 text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Vendor S3 Upload Test</h1>
          <p className="mt-1 text-sm text-slate-500">
            Use this page to test image upload directly to `/api/modules/vendor/upload`.
          </p>

          <form onSubmit={handleUpload} className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Vendor ID</label>
              <input
                value={vendorId}
                onChange={(e) => setVendorId(e.target.value)}
                placeholder="507f191e810c19729de860ea"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-[#005596]"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Document Type</label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-[#005596]"
              >
                <option value="logo">logo</option>
                <option value="id_proof">id_proof</option>
                <option value="certificate">certificate</option>
                <option value="bank_cheque">bank_cheque</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">File (any image or PDF)</label>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5"
              />
              {file ? (
                <p className="mt-1 text-xs text-slate-500">
                  Selected: {file.name} ({Math.ceil(file.size / 1024)} KB, {file.type || 'unknown'})
                </p>
              ) : null}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-[#005596] px-5 py-2.5 font-semibold text-white disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {loading ? 'Uploading...' : 'Upload File'}
            </button>
          </form>

          {error ? (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          ) : null}

          {result ? (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="mb-2 flex items-center gap-2 text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm font-semibold">Upload successful</span>
              </div>
              <p className="break-all text-sm text-slate-700"><strong>URL:</strong> {result.url}</p>
              <p className="break-all text-sm text-slate-700"><strong>Key:</strong> {result.key}</p>
              <p className="text-sm text-slate-700"><strong>Size:</strong> {result.size} bytes</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
