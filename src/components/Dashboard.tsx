
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { parseSalesData } from '../data';
import { SalesRecord } from '../types';
import KPISection from './KPISection';
import AdvancedAnalytics from './AdvancedAnalytics';
import ChartsSection from './ChartsSection';
import AIForecastHub from './AIForecastHub';
import QuotaCommissionHub from './QuotaCommissionHub';
import DataGrid from './DataGrid';
import AICopilot from './AICopilot';
import Fuse from 'fuse.js';
import { Search, Filter, Download, Plus, Database, Sparkles, Activity, Target, ChevronDown, BrainCircuit, Check, Users, Calendar, Trash2, RotateCcw, History, RefreshCw, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { useSales } from '../context/SalesContext';
import AddOpportunityModal from './modals/AddOpportunityModal';
import ImportDataModal from './modals/ImportDataModal';
import Modal from './ui/Modal';
import { motion, AnimatePresence } from 'motion/react';

const FILTER_STORAGE_KEY = 'forecast_pro_filters';

export const WIN_RATE_OPTIONS = [
  { id: 'ge90', label: '>= 90%', desc: 'High Certainty', test: (w: number) => w >= 0.9 },
  { id: 'ge75', label: '>= 75%', desc: 'Committed Focus', test: (w: number) => w >= 0.75 },
  { id: 'ge50', label: '>= 50%', desc: 'Qualified Lead', test: (w: number) => w >= 0.5 },
  { id: 'ge25', label: '>= 25%', desc: 'Early Stage', test: (w: number) => w >= 0.25 },
  { id: 'r75-100', label: '75% - 100%', desc: 'Closing Zone', test: (w: number) => w >= 0.75 && w <= 1.0 },
  { id: 'r50-75', label: '50% - 75%', desc: 'Mid Confidence', test: (w: number) => w >= 0.5 && w < 0.75 },
  { id: 'r25-50', label: '25% - 50%', desc: 'Under Review', test: (w: number) => w >= 0.25 && w < 0.50 },
  { id: 'r0-25', label: '0% - 25%', desc: 'At Risk / Init', test: (w: number) => w >= 0.0 && w < 0.25 }
];

export default function Dashboard() {
  const { 
    data: allData, 
    deletedRecords, 
    lastUpdated, 
    deleteRecord, 
    restoreRecord, 
    restoreAllRecords, 
    hardResetData, 
    clearRecycleBin,
    clearAllData,
    refreshData,
    isLoading: isSalesLoading,
    language,
    setLanguage,
    t
  } = useSales();
  
  // Load initial state from localStorage
  const initialState = useMemo(() => {
    const saved = localStorage.getItem(FILTER_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved filters', e);
      }
    }
    return {};
  }, []);

  const [searchTerm, setSearchTerm] = useState(initialState.searchTerm || '');
  const [selectedSectors, setSelectedSectors] = useState<string[]>(initialState.selectedSectors || []);
  const [selectedFYs, setSelectedFYs] = useState<string[]>(initialState.selectedFYs || []);
  const [selectedFYQtrs, setSelectedFYQtrs] = useState<string[]>(initialState.selectedFYQtrs || []);
  const [selectedSalesPersons, setSelectedSalesPersons] = useState<string[]>(initialState.selectedSalesPersons || []);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(initialState.selectedStatuses || []);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialState.selectedCategories || []);
  const [selectedWinRateOptions, setSelectedWinRateOptions] = useState<string[]>(() => {
    if (initialState.selectedWinRateOptions) {
      return initialState.selectedWinRateOptions;
    }
    if (initialState.selectedWinRates && Array.isArray(initialState.selectedWinRates)) {
      return initialState.selectedWinRates.map((val: number) => {
        if (val === 50) return 'ge50';
        if (val === 75) return 'ge75';
        if (val === 90) return 'ge90';
        return '';
      }).filter(Boolean);
    }
    return [];
  });
  const [startDate, setStartDate] = useState(initialState.startDate || '');
  const [endDate, setEndDate] = useState(initialState.endDate || '');
  
  // Persist filters to localStorage
  useEffect(() => {
    const filters = {
      searchTerm,
      selectedSectors,
      selectedFYs,
      selectedFYQtrs,
      selectedSalesPersons,
      selectedStatuses,
      selectedCategories,
      selectedWinRateOptions,
      startDate,
      endDate
    };
    localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(filters));
  }, [searchTerm, selectedSectors, selectedFYs, selectedFYQtrs, selectedSalesPersons, selectedStatuses, selectedCategories, selectedWinRateOptions, startDate, endDate]);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<SalesRecord | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<SalesRecord | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isRecycleBinOpen, setIsRecycleBinOpen] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showPurgeConfirm, setShowPurgeConfirm] = useState(false);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);
  const [undoToast, setUndoToast] = useState<{ id: string; name: string } | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Auto-dismiss undo toast after 8 seconds
  useEffect(() => {
    if (undoToast) {
      const timer = setTimeout(() => {
        setUndoToast(null);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [undoToast]);

  // Auto-dismiss success toast after 4 seconds
  useEffect(() => {
    if (successToast) {
      const timer = setTimeout(() => {
        setSuccessToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [successToast]);

  const handleExport = () => {
    if (filteredData.length === 0) return;

    // Define headers
    const headers = [
      'Category', 'FY', 'FYQtr', 'Half', 'Sales Person', 
      'Item Name', 'Customer Name', 'Sector', 'Partners', 
      'Product Type', 'Amount (k)', 'Date', 'Win Rate %', 'Status'
    ];

    // Convert data to CSV rows
    const rows = filteredData.map(record => [
      record.category,
      record.fy,
      record.fyQtr,
      record.half,
      `"${(record.salesPerson || '').replace(/"/g, '""')}"`,
      `"${(record.itemName || '').replace(/"/g, '""')}"`,
      `"${(record.customerName || '').replace(/"/g, '""')}"`,
      `"${(record.sector || '').replace(/"/g, '""')}"`,
      `"${(record.partners || '').replace(/"/g, '""')}"`,
      `"${(record.productType || '').replace(/"/g, '""')}"`,
      record.amountK,
      record.date,
      (record.winRate * 100).toFixed(0) + '%',
      record.status
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `sales_forecast_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEditRecord = (record: SalesRecord) => {
    setEditingRecord(record);
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
    setEditingRecord(null);
  };

  const toggleFilter = <T,>(current: T[], value: T, allValue: T) => {
    if (value === allValue) return [];
    if (current.includes(value)) {
      const next = current.filter(v => v !== value);
      return next;
    }
    return [...current, value];
  };

  const filteredData = useMemo(() => {
    let filtered = allData;

    // Apply categorical filters first
    filtered = filtered.filter(record => {
      const matchesSector = selectedSectors.length === 0 || selectedSectors.includes(record.sector);
      const matchesFY = selectedFYs.length === 0 || selectedFYs.includes(record.fy);
      const matchesFYQtr = selectedFYQtrs.length === 0 || selectedFYQtrs.includes(record.fyQtr);
      const matchesSalesPerson = selectedSalesPersons.length === 0 || (() => {
        if (!record.salesPerson) return false;
        const parts = record.salesPerson.split(/[,;&]|\band\b|\//gi).map(p => p.trim()).filter(Boolean);
        return selectedSalesPersons.some(sp => parts.includes(sp));
      })();
      const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(record.status);
      const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(record.category);
      const matchesWinRate = selectedWinRateOptions.length === 0 || selectedWinRateOptions.some(optId => {
        const option = WIN_RATE_OPTIONS.find(o => o.id === optId);
        return option ? option.test(record.winRate) : true;
      });
      const matchesDate = (!startDate || new Date(record.date) >= new Date(startDate)) &&
                         (!endDate || new Date(record.date) <= new Date(endDate));
      
      return matchesSector && matchesFY && matchesFYQtr && matchesSalesPerson && matchesStatus && matchesCategory && matchesWinRate && matchesDate;
    });

    // Apply fuzzy search if searchTerm exists
    if (searchTerm.trim()) {
      const fuse = new Fuse(filtered, {
        keys: ['itemName', 'customerName', 'salesPerson', 'partners', 'productType'],
        threshold: 0.35, // Balanced fuzziness
        location: 0,
        distance: 100,
        includeScore: true,
        useExtendedSearch: true
      });
      const results = fuse.search(searchTerm);
      filtered = results.map(result => result.item);
    }

    return [...filtered].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [allData, searchTerm, selectedSectors, selectedFYs, selectedFYQtrs, selectedSalesPersons, selectedStatuses, selectedCategories, selectedWinRateOptions, startDate, endDate]);

  const sectors = useMemo(() => [...new Set(allData.map(r => r.sector))].sort(), [allData]);
  const fyears = useMemo(() => [...new Set(allData.map(r => r.fy))].sort(), [allData]);
  const fyQtrs = useMemo(() => [...new Set(allData.map(r => r.fyQtr))].sort(), [allData]);
  const salesPeople = useMemo(() => {
    const people = new Set<string>();
    allData.forEach(r => {
      if (r.salesPerson) {
        const parts = r.salesPerson.split(/[,;&]|\band\b|\//gi).map(p => p.trim()).filter(Boolean);
        parts.forEach(p => people.add(p));
      }
    });
    return [...people].sort();
  }, [allData]);
  const statuses = ['Best', 'Likely', 'Worst'];
  const categories = ['Order', 'Rev'];

  const hasActiveFilters = searchTerm !== '' || 
    selectedSectors.length > 0 || 
    selectedFYs.length > 0 || 
    selectedFYQtrs.length > 0 || 
    selectedSalesPersons.length > 0 || 
    selectedStatuses.length > 0 || 
    selectedCategories.length > 0 || 
    selectedWinRateOptions.length > 0 ||
    startDate !== '' ||
    endDate !== '';

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedSectors([]);
    setSelectedFYs([]);
    setSelectedFYQtrs([]);
    setSelectedSalesPersons([]);
    setSelectedStatuses([]);
    setSelectedCategories([]);
    setSelectedWinRateOptions([]);
    setStartDate('');
    setEndDate('');
  };

  const [isAICopilotOpen, setIsAICopilotOpen] = useState(false);
  const [isFYQtrDropdownOpen, setIsFYQtrDropdownOpen] = useState(false);
  const [isSalesPersonDropdownOpen, setIsSalesPersonDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  
  const fyQtrRef = useRef<HTMLDivElement>(null);
  const salesPersonRef = useRef<HTMLDivElement>(null);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (fyQtrRef.current && !fyQtrRef.current.contains(event.target as Node)) {
        setIsFYQtrDropdownOpen(false);
      }
      if (salesPersonRef.current && !salesPersonRef.current.contains(event.target as Node)) {
        setIsSalesPersonDropdownOpen(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setIsStatusDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 pb-12 text-slate-800 font-sans selection:bg-indigo-100">
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md transition-all duration-300">
        <div className="max-w-7xl mx-auto h-16 md:h-20 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 shrink-0">
            <motion.div 
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="w-10 h-10 bg-gradient-to-br from-indigo-600 via-rose-500 to-amber-500 rounded-xl flex items-center justify-center text-white font-black shadow-lg text-base tracking-tighter"
            >
              FP
            </motion.div>
            <div>
              <h1 className="text-lg font-black tracking-tight font-display leading-none colorful-text-gradient">
                Forecast Pro 
              </h1>
              <p className="hidden xs:block text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">
                {t("Enterprise Intelligence", "企业级智能分析")} <span className="mx-1 text-slate-200">|</span> v4.2
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-slate-100 rounded-xl p-0.5 border border-slate-200 shadow-inner shrink-0">
              <button
                onClick={() => setLanguage('en')}
                className={cn(
                  "px-2.5 py-1.5 text-[9px] font-black rounded-lg uppercase transition-all tracking-wider cursor-pointer",
                  language === 'en' ? "bg-white text-indigo-700 shadow-sm" : "text-slate-400 hover:text-slate-700"
                )}
                title="English"
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('bilingual')}
                className={cn(
                  "px-2.5 py-1.5 text-[9px] font-black rounded-lg uppercase transition-all tracking-wider cursor-pointer",
                  language === 'bilingual' ? "bg-white text-indigo-700 shadow-sm" : "text-slate-400 hover:text-slate-700"
                )}
                title="Bilingual / 双语"
              >
                EN+中
              </button>
              <button
                onClick={() => setLanguage('zh')}
                className={cn(
                  "px-2.5 py-1.5 text-[9px] font-black rounded-lg uppercase transition-all tracking-wider cursor-pointer",
                  language === 'zh' ? "bg-white text-indigo-700 shadow-sm" : "text-slate-400 hover:text-slate-700"
                )}
                title="简体中文"
              >
                中文
              </button>
            </div>

            <button
              id="btn-refresh-data"
              disabled={isSalesLoading}
              onClick={async () => {
                await refreshData();
                setSuccessToast(t("Pipeline synchronized", "销售流水管道数据已同步"));
              }}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 disabled:opacity-50 text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-350 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 group"
              title={t("Manually re-fetch and update current sales data", "手动重新获取并更新当前销售数据")}
            >
              <RefreshCw className={cn("w-3.5 h-3.5 text-indigo-500 transition-transform duration-700", isSalesLoading ? "animate-spin" : "group-hover:rotate-180")} />
              <span>{isSalesLoading ? t("Refreshing...", "正在刷新...") : t("Refresh Data", "刷新数据")}</span>
            </button>

            <div key={lastUpdated} className="hidden lg:flex items-center gap-2 bg-slate-50 rounded-full px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest text-slate-500 border border-slate-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {t("Synced: ", "已同步: ")}{new Date(lastUpdated).toLocaleTimeString()}
            </div>
            
            <button 
              onClick={() => setIsAICopilotOpen(true)}
              className="hidden lg:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:shadow-lg hover:shadow-indigo-200 transition-all active:scale-95 shadow-sm"
            >
              <BrainCircuit className="w-3.5 h-3.5" />
              {t("AI Intelligence", "AI 智能")}
            </button>

            <button 
              onClick={() => setIsImportModalOpen(true)}
              className="hidden md:flex items-center gap-2 px-4 py-2 text-slate-500 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-colors"
            >
              <Database className="w-3.5 h-3.5" />
              {t("Sources", "数据源")}
            </button>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 active:scale-[0.98] transition-all"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">{t("Add Entry", "新增数据")}</span>
              <span className="sm:hidden">{t("Add", "新增")}</span>
            </button>
            <button 
              onClick={() => setIsRecycleBinOpen(true)}
              className="relative flex items-center justify-center w-10 h-10 border border-slate-200 bg-white text-slate-400 rounded-xl hover:text-rose-600 hover:border-rose-250 transition-all shrink-0"
              title="Recycle Bin & Recovery Hub"
            >
              <History className="w-4 h-4" />
              {deletedRecords.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[8px] font-black w-5 h-5 rounded-full flex items-center justify-center animate-pulse border-2 border-white">
                  {deletedRecords.length}
                </span>
              )}
            </button>
            <button 
              onClick={handleExport}
              className="flex items-center justify-center w-10 h-10 border border-slate-200 bg-white text-slate-400 rounded-xl hover:text-slate-900 hover:border-slate-300 transition-all"
              title={t("Export Data (CSV)", "导出数据 (CSV)")}
            >
              <Download className="w-4 h-4" />
            </button>
            <button 
              id="btn-clear-all-data-top"
              onClick={() => setShowClearAllConfirm(true)}
              className="flex items-center justify-center w-10 h-10 border border-slate-200 bg-white text-slate-400 hover:text-rose-600 hover:border-rose-250 rounded-xl transition-all shrink-0 cursor-pointer"
              title={t("Clear All Active & Historical Data", "彻底清空所有活动与历史数据")}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Modals */}
        <AddOpportunityModal 
          isOpen={isAddModalOpen} 
          onClose={handleCloseAddModal} 
          record={editingRecord}
        />
        <ImportDataModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} />

        {/* Recycle Bin & Vault Recovery Hub */}
        <Modal
          isOpen={isRecycleBinOpen}
          onClose={() => {
            setIsRecycleBinOpen(false);
            setShowResetConfirm(false);
            setShowPurgeConfirm(false);
            setShowClearAllConfirm(false);
          }}
          title="Recycle Bin & Data Vault Recovery"
        >
          <div className="space-y-6">
            <div className="p-4 bg-indigo-50 border border-indigo-100/50 rounded-2xl flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 animate-pulse shrink-0" />
              <div className="space-y-1">
                <p className="text-xs font-black text-indigo-900 uppercase tracking-wider font-display">System Restore Hub</p>
                <p className="text-xs font-bold text-indigo-700/80 leading-relaxed">
                  Lost a record or deleted one by accident? Recover custom edits, restore recently purged deals, or hard-reset the system state to default raw source sheets.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-[1.5rem] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] font-display text-slate-900">Recently Deleted ({deletedRecords.length})</h4>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Bring any record back to live forecast metrics instantly</p>
                </div>
                {deletedRecords.length > 0 && (
                  showPurgeConfirm ? (
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] font-black text-rose-500 uppercase tracking-wider">Empty Entire Bin?</span>
                      <button
                        onClick={() => {
                          clearRecycleBin();
                          setShowPurgeConfirm(false);
                        }}
                        className="text-[9px] text-rose-600 font-extrabold uppercase hover:underline"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setShowPurgeConfirm(false)}
                        className="text-[9px] text-slate-450 font-extrabold uppercase hover:underline"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          restoreAllRecords();
                          setIsRecycleBinOpen(false);
                        }}
                        className="text-[9px] text-indigo-600 hover:text-indigo-800 font-black uppercase tracking-widest transition-colors"
                        title="Restore all items to pipeline"
                      >
                        Restore All
                      </button>
                      <span className="text-slate-200">|</span>
                      <button
                        onClick={() => setShowPurgeConfirm(true)}
                        className="text-[9px] text-slate-450 hover:text-rose-600 font-black uppercase tracking-widest transition-colors"
                        title="Permanently empty recycle bin"
                      >
                        Empty Bin
                      </button>
                    </div>
                  )
                )}
              </div>

              {deletedRecords.length === 0 ? (
                <div className="py-8 text-center space-y-2">
                  <span className="text-2xl">🍃</span>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Recycle Bin is empty</p>
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto space-y-2.5 pr-1 select-none">
                  {deletedRecords.map(record => (
                    <div 
                      key={record.id}
                      className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl hover:border-indigo-150 hover:shadow-sm transition-all text-xs"
                    >
                      <div className="space-y-0.5 max-w-[65%]">
                        <span className="font-display font-bold text-slate-900 truncate block">{record.itemName}</span>
                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                          <span>{record.customerName}</span>
                          <span className="text-slate-200">|</span>
                          <span>RMB {record.amountK}k</span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          restoreRecord(record.id);
                          setUndoToast(null); // clear toast to avoid double confusion
                        }}
                        className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[9px] font-black uppercase tracking-widest rounded-lg transition-colors flex items-center gap-1 shrink-0"
                        title="Restore to active pipeline"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Restore
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border border-slate-200 rounded-[1.8rem] p-6 bg-slate-50 space-y-4">
              <div className="space-y-1">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] font-display text-slate-900">Database System Reversion</h4>
                <p className="text-[10px] font-bold text-slate-500 leading-relaxed">
                  Revert all edits, manually added opportunities, and CSV files, resetting your local database instances back to the corporate standard package of 189 default records.
                </p>
              </div>
              
              {showResetConfirm ? (
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex flex-col gap-3">
                  <p className="text-[10px] font-bold text-rose-700 leading-relaxed">
                    🚨 <strong>Are you absolutely sure?</strong> Doing this will instantly erase all custom edits, imports, and additions. There is no undo for this full system recovery.
                  </p>
                  <div className="flex items-center gap-3 justify-end">
                    <button
                      onClick={() => setShowResetConfirm(false)}
                      className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-500 text-[9px] font-black uppercase tracking-wider rounded-lg hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        hardResetData();
                        setShowResetConfirm(false);
                        setIsRecycleBinOpen(false);
                      }}
                      className="px-3.5 py-1.5 bg-rose-600 text-white text-[9px] font-black uppercase tracking-wider rounded-lg hover:bg-rose-700 transition-all shadow-sm"
                    >
                      Yes, Revert Database
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="w-full py-3.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-850 transition-colors border border-slate-700 hover:shadow-lg active:scale-95"
                >
                  Reset Database Instance to Defaults
                </button>
              )}
            </div>

             <div className="border border-slate-200 rounded-[1.8rem] p-6 bg-slate-50 space-y-4">
              <div className="space-y-1">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] font-display text-slate-900">{t("Purge All Data", "清除所有数据")}</h4>
                <p className="text-[10px] font-bold text-slate-500 leading-relaxed">
                  {t("Completely wipe out all active forecast rows, custom-built transactions, and items. This will empty the board fully and leave you with a blank pipeline canvas.", "彻底清除所有预测记录和自定义交易。这将清空整个仪表板，为您呈现一个全新的空白管线。")}
                </p>
              </div>
              
              <button
                onClick={() => {
                  setIsRecycleBinOpen(false);
                  setTimeout(() => {
                    setShowClearAllConfirm(true);
                  }, 150);
                }}
                className="w-full py-3.5 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all border border-rose-100/80 active:scale-95 cursor-pointer text-center"
              >
                {t("Clear All Active & Historical Data", "彻底清空所有活动与历史数据")}
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button 
                onClick={() => {
                  setIsRecycleBinOpen(false);
                  setShowResetConfirm(false);
                  setShowPurgeConfirm(false);
                  setShowClearAllConfirm(false);
                }}
                className="px-5 py-3 rounded-xl border border-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer"
              >
                {t("Close Hub", "关闭")}
              </button>
            </div>
          </div>
        </Modal>

        {/* Clear All Data Confirmation Modal */}
        <Modal
          isOpen={showClearAllConfirm}
          onClose={() => setShowClearAllConfirm(false)}
          title={t("Clear All Data", "彻底清空数据")}
        >
          <div className="space-y-6">
            <div className="p-5 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 mt-1 animate-pulse shrink-0" />
              <div className="space-y-1">
                <p className="text-xs font-black text-rose-950 uppercase tracking-widest font-display">
                  {t("Irreversible Operation", "不可逆的操作")}
                </p>
                <p className="text-xs font-bold text-rose-800 leading-relaxed">
                  {t("You are about to permanently erase all active pipeline records AND all history/recycle bin items.", "您即将永久删除所有当前的活动销售记录以及回收站中的历史记录。该操作无法恢复！")}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 text-xs text-slate-600 space-y-3">
              <p className="font-bold text-slate-800 uppercase tracking-wider text-[9px]">
                {t("This purge will execute the following:", "此清空操作将执行以下步骤：")}
              </p>
              <ul className="list-disc list-inside space-y-2 text-slate-600 pr-2">
                <li>{t("Wipe out all active pipeline deals fully", "彻底抹除所有正在进行的活跃交易流水")}</li>
                <li>{t("Empty the Recycle Bin, removing any chance of data recovery", "彻底排空回收站，不保留任何可恢复项目")}</li>
                <li>{t("Reset all local pipeline values to a clean canvas", "将整个工作区还原至空无一物的全新起始状态")}</li>
              </ul>
            </div>

            <div className="flex items-center gap-3 justify-end pt-2">
              <button
                onClick={() => setShowClearAllConfirm(false)}
                className="px-5 py-2.5 bg-white border border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-slate-100 cursor-pointer transition-all active:scale-95"
              >
                {t("Cancel", "取消")}
              </button>
              <button
                onClick={() => {
                  clearAllData();
                  setShowClearAllConfirm(false);
                  setSuccessToast(t("All active and historical dataset wiped", "所有活动与历史数据已被彻底清除"));
                }}
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all shadow-md hover:shadow-rose-100 active:scale-95 cursor-pointer font-display"
              >
                {t("Yes, Clear Everything", "是，彻底清除一切")}
              </button>
            </div>
          </div>
        </Modal>

        {/* Undo Toast */}
        <AnimatePresence>
          {undoToast && (
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              className="fixed bottom-6 right-6 z-[200] bg-slate-900 text-white px-5 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-slate-800"
            >
              <div className="flex flex-col gap-0.5 max-w-[200px] sm:max-w-xs">
                <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest">Opportunity Removed</span>
                <span className="text-xs font-bold text-slate-200 truncate block">{undoToast.name}</span>
              </div>
              <button 
                onClick={() => {
                  restoreRecord(undoToast.id);
                  setUndoToast(null);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 flex items-center gap-1.5 shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Undo
              </button>
              <button 
                onClick={() => setUndoToast(null)}
                className="text-[10px] font-black text-slate-400 hover:text-white px-2 py-1 uppercase tracking-wider shrink-0"
              >
                Dismiss
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success Toast Notification */}
        <AnimatePresence>
          {successToast && (
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              className="fixed bottom-6 left-6 z-[200] bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-800"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest leading-none">Intelligence Vault</span>
                <span className="text-[10px] font-bold text-slate-200 uppercase tracking-wider">{successToast}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <Modal
          isOpen={!!deletingRecord}
          onClose={() => setDeletingRecord(null)}
          title="Remove Opportunity"
        >
          <div className="space-y-6">
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 animate-pulse shrink-0" />
              <div className="space-y-1">
                <p className="text-xs font-black text-rose-900 uppercase tracking-wider font-display">Irreversible Operation</p>
                <p className="text-xs font-bold text-rose-700/80 leading-relaxed">
                  You are about to permanently purge this sales record from your live synchronization vault. This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-3">
              <div className="grid grid-cols-2 gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                <div>
                  <span className="block text-[8px] text-slate-400 mb-0.5 font-black uppercase">Item Name</span>
                  <span className="text-slate-900 font-display truncate block max-w-full text-xs font-bold">{deletingRecord?.itemName}</span>
                </div>
                <div>
                  <span className="block text-[8px] text-slate-400 mb-0.5 font-black uppercase">Customer Name</span>
                  <span className="text-slate-900 font-display truncate block max-w-full text-xs font-bold">{deletingRecord?.customerName}</span>
                </div>
                <div>
                  <span className="block text-[8px] text-slate-400 mb-0.5 font-black uppercase">Owner / Salesperson</span>
                  <span className="text-slate-900 font-display truncate block text-xs font-bold">{deletingRecord?.salesPerson}</span>
                </div>
                <div>
                  <span className="block text-[8px] text-slate-400 mb-0.5 font-black uppercase">Forecast Metric</span>
                  <span className="text-slate-900 font-display truncate block text-xs font-bold">RMB {deletingRecord?.amountK}k ({Math.round((deletingRecord?.winRate ?? 0) * 100)}%)</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button 
                onClick={() => setDeletingRecord(null)}
                className="px-5 py-3 rounded-xl border border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 hover:border-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  if (deletingRecord?.id) {
                    deleteRecord(deletingRecord.id);
                    setUndoToast({ id: deletingRecord.id, name: deletingRecord.itemName || 'Sales Record' });
                    setDeletingRecord(null);
                  }
                }}
                className="px-5 py-3 rounded-xl bg-rose-600 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-rose-700 hover:shadow-lg hover:shadow-rose-100 transition-all active:scale-95"
              >
                Confirm Deletion
              </button>
            </div>
          </div>
        </Modal>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center transition-all shrink-0",
              hasActiveFilters ? "bg-slate-900 text-white shadow-lg shadow-slate-200" : "bg-slate-100 text-slate-400"
            )}>
              <Filter className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-[12px] font-black text-slate-900 uppercase tracking-[0.2em] font-display">{t("Visibility Parameters", "可视性过滤参数")}</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t("Global data orchestration", "全局数据精确编排")}</p>
            </div>
            <AnimatePresence>
              {hasActiveFilters && (
                <motion.button 
                   id="btn-clear-all-filters"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={clearAllFilters}
                  className="ml-4 flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 border border-rose-200 hover:border-rose-300 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm"
                  title={t("Reset all active pipeline filters to their default state", "将所有当前过滤设置恢复到默认状态")}
                >
                  <RotateCcw className="w-3 h-3 text-rose-500" />
                  <span>{t("Clear All Filters", "重置所有过滤")}</span>
                </motion.button>
              )}
            </AnimatePresence>
          </div>
          <div className="bg-white/50 backdrop-blur-sm px-5 py-2 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-widest border border-slate-200 shadow-sm transition-all hover:border-slate-300">
            {filteredData.length} {t("active", "活跃条目")} <span className="mx-2 text-slate-200">|</span> {allData.length} {t("total", "总条目")}
          </div>
        </div>

        {/* Filters Bar - Styled as a Bento Card */}
        <div className="grid gap-6 mb-16">
          <div className="flex flex-col lg:flex-row gap-4 bg-white p-6 rounded-[2rem] border border-slate-200 shadow-[0_2px_15px_rgb(0,0,0,0.02)]">
            <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-300 group-focus-within:text-slate-900 transition-colors" />
              <input 
                type="text"
                placeholder={t("Search nomenclature, partners, or items...", "搜索项目名称、合作伙伴或细分领域...")}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl text-sm font-bold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100 focus:bg-white focus:border-slate-300 transition-all font-display"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex overflow-x-auto pb-2 lg:pb-0 gap-4 items-center no-scrollbar">
              <div className="flex gap-2 p-1.5 bg-slate-50 rounded-2xl border border-slate-200 shrink-0">
                <button
                  onClick={() => setSelectedSectors([])}
                  className={cn(
                    "px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                    selectedSectors.length === 0 
                      ? "bg-white text-slate-900 shadow-sm border border-slate-100" 
                      : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  {t("Global Sectors", "所有领域/业务板块")}
                </button>
                {sectors.slice(0, 3).map(s => (
                  <button
                    key={s}
                    onClick={() => setSelectedSectors(toggleFilter(selectedSectors, s, 'All'))}
                    className={cn(
                      "px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                      selectedSectors.includes(s) 
                        ? "bg-white text-slate-900 shadow-sm border border-slate-100" 
                        : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* AI Banner Suggestion */}
          {!isAICopilotOpen && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => setIsAICopilotOpen(true)}
              className="cursor-pointer bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-2xl hover:shadow-indigo-500/20 transition-all group overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:scale-150 transition-transform duration-700" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-500/5 rounded-full -ml-32 -mb-32 blur-3xl group-hover:scale-150 transition-transform duration-700" />
              
              <div className="flex items-center gap-6 relative z-10">
                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-indigo-400 backdrop-blur-md border border-white/10 group-hover:scale-110 transition-transform">
                  <Sparkles className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] font-display">{t("Intelligence Synthesis Ready", "智能洞察分析就绪")}</h3>
                  <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mt-1">{t("Ask AI to analyze risk, edit deals, or summarize Q4 performance", "向人工智能提问以分析风险、修改订单、或汇总季度预测表现")}</p>
                </div>
              </div>
              <button className="px-8 py-3 bg-white text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-indigo-50 hover:scale-105 active:scale-95 transition-all relative z-10 shadow-xl">
                {t("Launch Copilot", "启动智能助理")}
              </button>
            </motion.div>
          )}

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6"
          >
            {/* Quick Year Filters */}
            <div className="bg-white p-6 rounded-[2rem] border border-slate-200 space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Database className="w-3 h-3 text-slate-400" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-display">{t("Fiscal Period", "财政年度")}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {fyears.map(fy => (
                    <button
                      key={fy}
                      onClick={() => setSelectedFYs(toggleFilter(selectedFYs, fy, 'All'))}
                      className={cn(
                        "px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border",
                        selectedFYs.includes(fy) 
                          ? "bg-slate-900 text-white border-slate-900" 
                          : "bg-slate-50 text-slate-500 border-slate-100 hover:border-slate-200"
                      )}
                    >
                      {fy}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-display">{t("Interval Quarter", "区间季度")}</span>
                </div>
                <div className="relative" ref={fyQtrRef}>
                  <button
                    onClick={() => setIsFYQtrDropdownOpen(!isFYQtrDropdownOpen)}
                    className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:border-slate-200 transition-all group"
                  >
                    <span className="truncate max-w-[150px]">
                      {selectedFYQtrs.length === 0 
                        ? t("All Quarters", "所有季度") 
                        : selectedFYQtrs.length === 1 
                          ? selectedFYQtrs[0] 
                          : `${selectedFYQtrs.length} ${t("Selected", "个已选")}`}
                    </span>
                    <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-300", isFYQtrDropdownOpen ? "rotate-180" : "")} />
                  </button>
                  
                  <AnimatePresence>
                    {isFYQtrDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute z-20 bottom-full mb-2 w-full bg-white border border-slate-200 rounded-2xl shadow-xl p-2 space-y-1 min-w-[160px]"
                      >
                        <button
                          onClick={() => setSelectedFYQtrs([])}
                          className={cn(
                            "w-full flex items-center justify-between px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                            selectedFYQtrs.length === 0 ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-50"
                          )}
                        >
                          {t("All Quarters", "所有季度")}
                          {selectedFYQtrs.length === 0 && <Check className="w-3 h-3" />}
                        </button>
                        <div className="h-[1px] bg-slate-100 my-1" />
                        {fyQtrs.map(q => (
                          <button
                            key={q}
                            onClick={() => setSelectedFYQtrs(toggleFilter(selectedFYQtrs, q, 'All'))}
                            className={cn(
                              "w-full flex items-center justify-between px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                              selectedFYQtrs.includes(q) ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"
                            )}
                          >
                            {q}
                            {selectedFYQtrs.includes(q) && <Check className="w-3 h-3" />}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Date Range Filter */}
            <div className="bg-white p-6 rounded-[2rem] border border-slate-200">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-display">{t("Date Window", "时间周期")}</span>
              </div>
              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-1.5">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">{t("Start Bound", "起始日期")}</span>
                  <input 
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-100 focus:bg-white transition-all cursor-pointer"
                  />
                </div>
                <div className="space-y-1.5">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">{t("End Bound", "截止日期")}</span>
                  <input 
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-100 focus:bg-white transition-all cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Salesperson Filter */}
            <div className="bg-white p-6 rounded-[2rem] border border-slate-200">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-3 h-3 text-slate-400" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-display">Sales Leadership</span>
              </div>
              <div className="relative" ref={salesPersonRef}>
                <button
                  onClick={() => setIsSalesPersonDropdownOpen(!isSalesPersonDropdownOpen)}
                  className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:border-slate-200 transition-all group"
                >
                  <span className="truncate max-w-[150px]">
                    {selectedSalesPersons.length === 0 
                      ? "All Owners" 
                      : selectedSalesPersons.length === 1 
                        ? selectedSalesPersons[0] 
                        : `${selectedSalesPersons.length} Selected`}
                  </span>
                  <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-300", isSalesPersonDropdownOpen ? "rotate-180" : "")} />
                </button>
                
                <AnimatePresence>
                  {isSalesPersonDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute z-20 bottom-full mb-2 w-full bg-white border border-slate-200 rounded-2xl shadow-xl p-2 space-y-1 min-w-[180px] max-h-[300px] overflow-y-auto custom-scrollbar"
                    >
                      <button
                        onClick={() => setSelectedSalesPersons([])}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                          selectedSalesPersons.length === 0 ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-50"
                        )}
                      >
                        All Sales Persons
                        {selectedSalesPersons.length === 0 && <Check className="w-3 h-3" />}
                      </button>
                      <div className="h-[1px] bg-slate-100 my-1" />
                      {salesPeople.map(p => (
                        <button
                          key={p}
                          onClick={() => setSelectedSalesPersons(toggleFilter(selectedSalesPersons, p, 'All'))}
                          className={cn(
                            "w-full flex items-center justify-between px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                            selectedSalesPersons.includes(p) ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"
                          )}
                        >
                          {p}
                          {selectedSalesPersons.includes(p) && <Check className="w-3 h-3" />}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {selectedSalesPersons.slice(0, 2).map(p => (
                  <span key={p} className="px-2 py-1 bg-slate-100 text-slate-900 text-[8px] font-bold uppercase rounded-md border border-slate-200">
                    {p.split(' ')[0]}
                  </span>
                ))}
                {selectedSalesPersons.length > 2 && (
                  <span className="px-2 py-1 bg-slate-100 text-slate-500 text-[8px] font-bold uppercase rounded-md border border-slate-200">
                    +{selectedSalesPersons.length - 2} more
                  </span>
                )}
              </div>
            </div>

            {/* Expanded Win Rate & Probability Filter */}
            <div className="bg-white p-6 rounded-[2rem] border border-slate-200 sm:col-span-2 lg:col-span-3 xl:col-span-2 shadow-[0_2px_15px_rgb(0,0,0,0.01)] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Target className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-[0.15em] font-display">Win Rate & Probability</span>
                  </div>
                  {(selectedWinRateOptions.length > 0 || selectedStatuses.length > 0) && (
                    <button
                      onClick={() => {
                        setSelectedWinRateOptions([]);
                        setSelectedStatuses([]);
                      }}
                      className="text-[8px] font-black text-rose-500 hover:text-rose-700 uppercase tracking-widest leading-none bg-rose-50 px-2.5 py-1.5 rounded-lg border border-rose-100 transition-colors cursor-pointer"
                    >
                      Reset Filter
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Part 1: Minimum Thresholds */}
                  <div className="space-y-2.5">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Minimum Win Rate</span>
                    <div className="flex flex-col gap-1.5">
                      {WIN_RATE_OPTIONS.filter(o => o.id.startsWith('ge')).map(opt => {
                        const isSelected = selectedWinRateOptions.includes(opt.id);
                        return (
                          <button
                            key={opt.id}
                            onClick={() => setSelectedWinRateOptions(toggleFilter(selectedWinRateOptions, opt.id, ''))}
                            className={cn(
                              "px-2.5 py-1.5 rounded-xl border text-[9px] font-bold uppercase transition-all flex flex-col items-center justify-center text-center gap-0.5 cursor-pointer",
                              isSelected 
                                ? "bg-slate-900 text-white border-slate-900 shadow-sm" 
                                : "bg-slate-50 text-slate-500 border-slate-100 hover:border-slate-200"
                            )}
                          >
                            <span className="font-extrabold tracking-wider">{opt.label}</span>
                            <span className={cn("text-[7px]", isSelected ? "text-slate-300" : "text-slate-400")}>{opt.desc}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Part 2: Specific Range Bands */}
                  <div className="space-y-2.5">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Win Rate Bands</span>
                    <div className="flex flex-col gap-1.5">
                      {WIN_RATE_OPTIONS.filter(o => o.id.startsWith('r')).map(opt => {
                        const isSelected = selectedWinRateOptions.includes(opt.id);
                        return (
                          <button
                            key={opt.id}
                            onClick={() => setSelectedWinRateOptions(toggleFilter(selectedWinRateOptions, opt.id, ''))}
                            className={cn(
                              "px-2.5 py-1.5 rounded-xl border text-[9px] font-bold uppercase transition-all flex flex-col items-center justify-center text-center gap-0.5 cursor-pointer",
                              isSelected 
                                ? "bg-slate-900 text-white border-slate-900 shadow-sm" 
                                : "bg-slate-50 text-slate-500 border-slate-100 hover:border-slate-200"
                            )}
                          >
                            <span className="font-extrabold tracking-wider">{opt.label}</span>
                            <span className={cn("text-[7px]", isSelected ? "text-slate-300" : "text-slate-400")}>{opt.desc}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Part 3: Closing Probability */}
                  <div className="space-y-2.5">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Closing Probability</span>
                    <div className="flex flex-col gap-1.5">
                      {statuses.map(s => {
                        const isSelected = selectedStatuses.includes(s);
                        return (
                          <button
                            key={s}
                            onClick={() => setSelectedStatuses(toggleFilter(selectedStatuses, s, 'All'))}
                            className={cn(
                              "px-2.5 py-[11px] rounded-xl border text-[9px] font-bold uppercase transition-all flex flex-col items-center justify-center text-center gap-0.5 cursor-pointer",
                              isSelected 
                                ? "bg-slate-900 text-white border-slate-900 shadow-sm" 
                                : "bg-slate-50 text-slate-500 border-slate-100 hover:border-slate-200"
                            )}
                          >
                            <span className="font-extrabold tracking-wider">{s}</span>
                            <span className={cn("text-[7px]", isSelected ? "text-slate-300" : "text-slate-400")}>
                              {s === 'Best' ? t("Optimistic Target", "乐观目标") : s === 'Likely' ? t("Base Outlook", "基础展望") : t("Worst-case Risk", "极低预期")}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Category Filters */}
            <div id="filter-category-card" className="bg-white p-6 rounded-[2rem] border border-slate-200 select-none xl:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-3 h-3 text-indigo-500 animate-pulse" />
                <span className="text-[10px] font-bold text-slate-700 uppercase tracking-[0.1em] block font-display">Category (Order vs. Rev)</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {categories.map(c => {
                  const isSelected = selectedCategories.includes(c);
                  return (
                    <button
                      id={`btn-filter-category-${c.toLowerCase()}`}
                      key={c}
                      onClick={() => setSelectedCategories(toggleFilter(selectedCategories, c, 'All'))}
                      className={cn(
                        "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border cursor-pointer",
                        isSelected 
                          ? "bg-slate-900 text-white border-slate-900 shadow-sm transform hover:scale-[1.02]"
                          : "bg-slate-50 text-slate-500 border-slate-100 hover:border-slate-200"
                      )}
                    >
                      {c === 'Rev' ? t("Revenue", "合同营收") : t("Order", "采购订单")}
                    </button>
                  );
                })}
              </div>

              {/* Status Multi-Select Dropdown Filter */}
              <div className="h-[1px] bg-slate-100 my-4" />
              <div className="space-y-2 relative" ref={statusDropdownRef}>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Filter By Status</span>
                  {selectedStatuses.length > 0 && (
                    <button 
                      type="button"
                      onClick={() => setSelectedStatuses([])}
                      className="text-[8px] font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Clear Selection
                    </button>
                  )}
                </div>
                
                <button
                  id="status-dropdown-trigger"
                  type="button"
                  onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all group cursor-pointer border",
                    selectedStatuses.length > 0 
                      ? "bg-indigo-50/40 border-indigo-200/60 text-indigo-900 focus:ring-2 focus:ring-indigo-500/20" 
                      : "bg-slate-50 border-slate-100 text-slate-500 hover:border-slate-200"
                  )}
                >
                  <div className="flex-1 flex flex-wrap gap-1 px-0.5 py-0.5">
                    {selectedStatuses.length === 0 ? (
                      <span className="text-slate-400">All Statuses (Best, Likely, Worst)</span>
                    ) : (
                      selectedStatuses.map(s => (
                        <span 
                          key={s}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedStatuses(toggleFilter(selectedStatuses, s, 'All'));
                          }}
                          className="inline-flex items-center gap-1 bg-white text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800 text-[8px] font-black px-1.5 py-0.5 rounded-md border border-indigo-100/80 uppercase tracking-wide transition-all shadow-sm cursor-pointer shrink-0"
                        >
                          {s}
                          <X className="w-2.5 h-2.5 text-indigo-400 hover:text-indigo-600" />
                        </span>
                      ))
                    )}
                  </div>
                  <ChevronDown className={cn("w-3.5 h-3.5 ml-2 shrink-0 transition-transform duration-300", isStatusDropdownOpen ? "rotate-180" : "")} />
                </button>

                <AnimatePresence>
                  {isStatusDropdownOpen && (
                    <motion.div
                      id="status-dropdown-menu"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="absolute z-20 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 space-y-1"
                    >
                      {statuses.map(s => {
                        const isSelected = selectedStatuses.includes(s);
                        return (
                          <button
                            key={s}
                            id={`status-dropdown-option-${s.toLowerCase()}`}
                            type="button"
                            onClick={() => setSelectedStatuses(toggleFilter(selectedStatuses, s, 'All'))}
                            className={cn(
                              "w-full flex items-center justify-between px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer border",
                              isSelected 
                                ? "bg-indigo-50 text-indigo-700 border-indigo-100 shadow-sm font-extrabold" 
                                : "text-slate-500 hover:bg-slate-50 border-transparent"
                            )}
                          >
                            <span>{s}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-4 leading-relaxed">
                Filter and segment active forecasts by transactional type boundaries and categories.
              </div>
            </div>
          </motion.div>
        </div>

        {/* Dashboard Content */}
        <div className="space-y-12">
          <KPISection data={filteredData} />
          
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between px-2 gap-4">
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] font-display">Active Pipeline</h2>
                <div className="hidden sm:block h-[1px] w-12 bg-slate-200" />
                <button 
                  onClick={() => setIsAddModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all shadow-sm hover:shadow active:scale-95 cursor-pointer hover:translate-y-[-1px] duration-150"
                  title="Quickly add a new sales deal or transaction"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Add New Sale</span>
                </button>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-3 md:gap-4 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <span className="shrink-0">Sorted by Recency</span>
                <span className="text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 md:px-4 py-1.5 rounded-full transition-all hover:scale-105 cursor-default shrink-0">
                  {filteredData.length} records
                </span>
              </div>
            </div>
            <motion.div
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <DataGrid data={filteredData} onEdit={handleEditRecord} onDelete={setDeletingRecord} searchTerm={searchTerm} />
            </motion.div>
          </div>

          <ChartsSection data={filteredData} />

          <div className="pt-12 border-t border-slate-100/50">
            <QuotaCommissionHub 
              data={allData} 
              selectedCategories={selectedCategories}
              selectedSectors={selectedSectors}
              selectedStatuses={selectedStatuses}
              searchTerm={searchTerm}
              selectedFYs={selectedFYs}
            />
          </div>

          <div className="pt-12 border-t border-slate-100/50">
            <AIForecastHub data={filteredData} />
          </div>

          <div className="pt-12 border-t border-slate-100/50">
            <AdvancedAnalytics data={filteredData} />
          </div>
        </div>
      </main>

      <AICopilot isOpen={isAICopilotOpen} onClose={() => setIsAICopilotOpen(false)} />

      <footer className="w-full border-t border-slate-100 mt-20 py-12 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Real-time Sync: <span className="text-slate-900 font-display">Connected</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                Vault Version: <span className="text-slate-900 font-display">v4.2.0-STABLE</span>
              </div>
            </div>
            <div className="flex flex-col items-center md:items-end">
              <p className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] font-display mb-1">Forecast Pro</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Enterprise Intelligence Platform © 2026</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
