
import React, { useState, useRef } from 'react';
import Modal from '../ui/Modal';
import { useSales } from '../../context/SalesContext';
import { Upload, Link as LinkIcon, Database, AlertCircle, CheckCircle2, FileSpreadsheet } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function ImportDataModal({ isOpen, onClose }: Props) {
  const { importCSV, fetchGoogleSheet, isLoading, error } = useSales();
  const [activeTab, setActiveTab] = useState<'csv' | 'gsheet'>('csv');
  const [sheetUrl, setSheetUrl] = useState('');
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      importCSV(text);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    };
    reader.readAsText(file);
  };

  const handleSheetFetch = async () => {
    if (!sheetUrl) return;
    
    // Simple validation for Google Sheets export URL
    // If it's a standard URL, try to convert it to export CSV
    let finalUrl = sheetUrl;
    if (sheetUrl.includes('docs.google.com/spreadsheets')) {
      const match = sheetUrl.match(/\/d\/(.*?)\//);
      if (match) {
        finalUrl = `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv`;
      }
    }

    await fetchGoogleSheet(finalUrl);
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      onClose();
    }, 1500);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Connect Data Source">
      <div className="space-y-6">
        <div className="flex p-1 bg-slate-100 rounded-2xl">
          <button 
            onClick={() => setActiveTab('csv')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'csv' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Upload className="w-4 h-4" />
            CSV Upload
          </button>
          <button 
            onClick={() => setActiveTab('gsheet')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'gsheet' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Google Sheet
          </button>
        </div>

        {activeTab === 'csv' ? (
          <div className="space-y-4">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 rounded-3xl p-10 flex flex-col items-center justify-center gap-4 hover:border-indigo-400 hover:bg-indigo-50/30 cursor-pointer transition-all group"
            >
              <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600 group-hover:scale-110 transition-transform">
                <Upload className="w-8 h-8" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-slate-700">Drop your CSV here</p>
                <p className="text-xs text-slate-400 mt-1">or click to browse from files</p>
              </div>
              <input 
                type="file" 
                accept=".csv" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleFileUpload}
              />
            </div>
            
            <div className="p-4 bg-slate-50 rounded-2xl flex gap-3 items-start">
              <Database className="w-4 h-4 text-slate-400 mt-0.5" />
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Format Requirement</p>
                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                  Expected headers: Category, FY, Qtr, Half, SalesPerson, Item, Customer, Sector... 
                  (Matches standard company template)
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Shareable Google Sheet Link</label>
              <div className="relative">
                <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  value={sheetUrl}
                  onChange={e => setSheetUrl(e.target.value)}
                />
              </div>
              <p className="text-[10px] text-slate-400 px-1 mt-2 flex items-center gap-1.5">
                <AlertCircle className="w-3 h-3" />
                Sheet must be "Anyone with the link can view"
              </p>
            </div>

            <button 
              onClick={handleSheetFetch}
              disabled={isLoading || !sheetUrl}
              className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-2xl shadow-lg hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Database className="w-4 h-4" />
              )}
              Connect & Sync Sheet
            </button>
          </div>
        )}

        {error && (
          <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl text-xs font-medium flex gap-2 items-center animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl text-sm font-bold flex gap-2 items-center justify-center animate-in zoom-in">
            <CheckCircle2 className="w-5 h-5" />
            Data Connected Successfully
          </div>
        )}
      </div>
    </Modal>
  );
}
