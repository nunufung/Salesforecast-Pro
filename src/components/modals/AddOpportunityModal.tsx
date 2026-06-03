
import React, { useState, useMemo, useEffect, useRef } from 'react';
import Modal from '../ui/Modal';
import { useSales } from '../../context/SalesContext';
import { SalesRecord } from '../../types';
import { X, Check, ChevronDown, Plus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  record?: SalesRecord | null;
}

export default function AddOpportunityModal({ isOpen, onClose, record }: Props) {
  const { addRecord, updateRecord, data } = useSales();
  const [formData, setFormData] = useState<Partial<SalesRecord>>({
    category: 'Order',
    fy: 'FY26',
    fyQtr: 'FY26Q1',
    half: 'H1',
    status: 'Likely',
    amountK: 0,
    winRate: 0.5,
    date: new Date().toISOString().split('T')[0]
  });
  const [winRatePctString, setWinRatePctString] = useState<string>('50');

  // Multi-select state for sales owners
  const [selectedOwners, setSelectedOwners] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const allSalesPeople = useMemo(() => {
    const people = new Set<string>();
    (data || []).forEach(r => {
      if (r.salesPerson) {
        const parts = r.salesPerson.split(/[,;&]|\band\b|\//gi).map(p => p.trim()).filter(Boolean);
        parts.forEach(p => people.add(p));
      }
    });
    return [...people].sort();
  }, [data]);

  const filteredSalesPeople = useMemo(() => {
    const cleanSearch = searchQuery.toLowerCase().trim();
    if (!cleanSearch) return allSalesPeople;
    return allSalesPeople.filter(p => p.toLowerCase().includes(cleanSearch));
  }, [allSalesPeople, searchQuery]);

  const calculateFiscalPeriod = (dateVal: string) => {
    if (!dateVal) return null;
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return null;
    
    const year = d.getFullYear();
    const month = d.getMonth(); // 0-11
    
    const fy = `FY${String(year).slice(-2)}`;
    let qtr = 'Q1';
    let half = 'H1';
    
    if (month >= 0 && month <= 2) {
      qtr = 'Q1';
      half = 'H1';
    } else if (month >= 3 && month <= 5) {
      qtr = 'Q2';
      half = 'H1';
    } else if (month >= 6 && month <= 8) {
      qtr = 'Q3';
      half = 'H2';
    } else {
      qtr = 'Q4';
      half = 'H2';
    }
    
    return { fy, fyQtr: `${fy}${qtr}`, half };
  };

  const handleDateChange = (dateVal: string) => {
    const period = calculateFiscalPeriod(dateVal);
    if (period) {
      setFormData(prev => ({
        ...prev,
        date: dateVal,
        fy: period.fy,
        fyQtr: period.fyQtr,
        half: period.half
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        date: dateVal
      }));
    }
  };

  const toggleOwner = (owner: string) => {
    setSelectedOwners(prev => {
      if (prev.includes(owner)) {
        return prev.filter(p => p !== owner);
      } else {
        return [...prev, owner];
      }
    });
  };

  const removeOwner = (ownerToRemove: string) => {
    setSelectedOwners(prev => prev.filter(p => p !== ownerToRemove));
  };

  const addCustomOwner = (customOwnerName: string) => {
    const cleaned = customOwnerName.trim();
    if (!cleaned) return;
    
    setSelectedOwners(prev => {
      if (prev.some(p => p.toLowerCase() === cleaned.toLowerCase())) {
        return prev;
      }
      return [...prev, cleaned];
    });
    setSearchQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const cleaned = searchQuery.trim();
      if (cleaned) {
        const matched = allSalesPeople.find(p => p.toLowerCase() === cleaned.toLowerCase());
        addCustomOwner(matched || cleaned);
      }
    } else if (e.key === 'Backspace' && searchQuery === '' && selectedOwners.length > 0) {
      setSelectedOwners(prev => prev.slice(0, -1));
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (record) {
      setFormData(record);
      setWinRatePctString(String(Math.round((record.winRate ?? 0) * 100)));
      if (record.salesPerson) {
        const owners = record.salesPerson.split(/[,;&]|\band\b|\//gi).map(p => p.trim()).filter(Boolean);
        setSelectedOwners(owners);
      } else {
        setSelectedOwners([]);
      }
    } else {
      const todayString = new Date().toISOString().split('T')[0];
      const period = calculateFiscalPeriod(todayString) || { fy: 'FY26', fyQtr: 'FY26Q1', half: 'H1' };
      setFormData({
        category: 'Order',
        fy: period.fy,
        fyQtr: period.fyQtr,
        half: period.half,
        status: 'Likely',
        amountK: 0,
        winRate: 0.5,
        date: todayString
      });
      setWinRatePctString('50');
      setSelectedOwners([]);
    }
    setSearchQuery('');
    setIsDropdownOpen(false);
  }, [record, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.itemName || !formData.customerName) return;
    
    const finalWinRate = isNaN(parseFloat(winRatePctString)) ? 0 : parseFloat(winRatePctString) / 100;
    const finalData = {
      ...formData,
      salesPerson: selectedOwners.join(', '),
      winRate: finalWinRate
    };

    if (record?.id) {
      updateRecord(finalData as SalesRecord);
    } else {
      addRecord(finalData as SalesRecord);
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={record ? "Edit Opportunity" : "New Sales Opportunity"}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type</label>
            <select 
              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              value={formData.category}
              onChange={e => setFormData({...formData, category: e.target.value})}
            >
              <option value="Order">Order</option>
              <option value="Rev">Revenue</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</label>
            <select 
              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              value={formData.status}
              onChange={e => setFormData({...formData, status: e.target.value})}
            >
              <option value="Best">Best</option>
              <option value="Likely">Likely</option>
              <option value="Worst">Worst</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Item Name</label>
          <input 
            required
            type="text"
            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            placeholder="e.g. AI Private Cloud Expansion"
            value={formData.itemName || ''}
            onChange={e => setFormData({...formData, itemName: e.target.value})}
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Customer</label>
          <input 
            required
            type="text"
            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            placeholder="e.g. Govt Dept X"
            value={formData.customerName || ''}
            onChange={e => setFormData({...formData, customerName: e.target.value})}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2 relative" ref={dropdownRef}>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sales Owners</label>
            
            <div 
              onClick={() => setIsDropdownOpen(true)}
              className={cn(
                "w-full flex flex-wrap gap-1.5 items-center bg-slate-50 border border-slate-100 rounded-xl p-2 min-h-[42px] cursor-text transition-all focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:bg-white focus-within:border-indigo-500/50",
                isDropdownOpen && "bg-white border-indigo-500/50 ring-2 ring-indigo-500/20"
              )}
            >
              {selectedOwners.map(owner => (
                <span 
                  key={owner} 
                  className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-lg border border-indigo-100/80 uppercase tracking-wide shrink-0"
                >
                  {owner}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeOwner(owner);
                    }}
                    className="text-indigo-400 hover:text-indigo-600 focus:outline-none rounded-full p-0.5"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
              
              <input 
                type="text"
                placeholder={selectedOwners.length === 0 ? "Select/add owner..." : ""}
                className="flex-1 bg-transparent border-none text-xs font-bold outline-none placeholder:text-slate-400 min-w-[60px] p-0 focus:ring-0"
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setIsDropdownOpen(true);
                }}
                onFocus={() => setIsDropdownOpen(true)}
                onKeyDown={handleKeyDown}
              />

              <div className="flex items-center gap-1 text-slate-400 pr-1 select-none">
                <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", isDropdownOpen ? "rotate-180" : "")} />
              </div>
            </div>

            <input 
              type="hidden" 
              required 
              value={selectedOwners.join(', ')} 
            />

            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 max-h-[180px] overflow-y-auto custom-scrollbar flex flex-col gap-0.5"
                >
                  {filteredSalesPeople.length > 0 ? (
                    filteredSalesPeople.map(p => {
                      const isSelected = selectedOwners.includes(p);
                      return (
                        <button
                          type="button"
                          key={p}
                          onClick={() => toggleOwner(p)}
                          className={cn(
                            "w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all text-left",
                            isSelected ? "bg-indigo-50 text-indigo-700 shadow-sm" : "text-slate-600 hover:bg-slate-50"
                          )}
                        >
                          <span className="truncate">{p}</span>
                          {isSelected && <Check className="w-3 h-3 text-indigo-600" />}
                        </button>
                      );
                    })
                  ) : searchQuery.trim() === '' ? (
                    <div className="px-3 py-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">
                      No owners found
                    </div>
                  ) : null}

                  {searchQuery.trim() !== '' && !allSalesPeople.some(p => p.toLowerCase() === searchQuery.trim().toLowerCase()) && !selectedOwners.some(p => p.toLowerCase() === searchQuery.trim().toLowerCase()) && (
                    <button
                      type="button"
                      onClick={() => addCustomOwner(searchQuery)}
                      className="w-full flex items-center gap-1.5 px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider text-indigo-600 hover:bg-indigo-50 transition-all border border-dashed border-indigo-200 mt-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add "{searchQuery.trim()}"</span>
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sector</label>
            <input 
              required
              type="text"
              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              placeholder="Govt"
              value={formData.sector || ''}
              onChange={e => setFormData({...formData, sector: e.target.value})}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Amount (k)</label>
            <input 
              required
              type="number"
              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              value={formData.amountK || 0}
              onChange={e => setFormData({...formData, amountK: parseFloat(e.target.value)})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Win Rate %</label>
            <select 
              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
              value={winRatePctString}
              onChange={e => {
                const val = e.target.value;
                setWinRatePctString(val);
                const parsed = parseFloat(val);
                if (!isNaN(parsed)) {
                  setFormData(prev => ({ ...prev, winRate: parsed / 100 }));
                } else {
                  setFormData(prev => ({ ...prev, winRate: 0 }));
                }
              }}
            >
              {(() => {
                const currentValNum = Math.round((formData.winRate ?? 0) * 100);
                const options = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
                if (!options.includes(currentValNum)) {
                  options.push(currentValNum);
                  options.sort((a, b) => a - b);
                }
                return options.map(opt => {
                  let label = `${opt}%`;
                  if (opt === 100) label = "100% (Closed Won / Committed)";
                  else if (opt === 90) label = "90% (Approved / Contracting)";
                  else if (opt === 80) label = "80% (Negotiation)";
                  else if (opt === 70) label = "70% (Decision Engaged)";
                  else if (opt === 60) label = "60% (Consensus Building)";
                  else if (opt === 50) label = "50% (Evaluation)";
                  else if (opt === 40) label = "40% (Proposal Submitted)";
                  else if (opt === 30) label = "30% (Proposal / Discovery)";
                  else if (opt === 20) label = "20% (Qualification)";
                  else if (opt === 10) label = "10% (Lead / Prospecting)";
                  else if (opt === 0) label = "0% (Closed Lost)";
                  return (
                    <option key={opt} value={String(opt)}>
                      {label}
                    </option>
                  );
                });
              })()}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fiscal Year</label>
            <select 
              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              value={formData.fy}
              onChange={e => {
                const newFy = e.target.value;
                const prevQtrNum = formData.fyQtr?.slice(-2) || 'Q1';
                setFormData(prev => ({
                  ...prev,
                  fy: newFy,
                  fyQtr: `${newFy}${prevQtrNum}`
                }));
              }}
            >
              <option value="FY24">FY24</option>
              <option value="FY25">FY25</option>
              <option value="FY26">FY26</option>
              <option value="FY27">FY27</option>
              <option value="FY28">FY28</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Quarter</label>
            <select 
              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              value={formData.fyQtr}
              onChange={e => {
                const qValue = e.target.value;
                const qNum = qValue.slice(-2);
                const newHalf = (qNum === 'Q1' || qNum === 'Q2') ? 'H1' : 'H2';
                setFormData(prev => ({
                  ...prev,
                  fyQtr: qValue,
                  half: newHalf
                }));
              }}
            >
              <option value={`${formData.fy || 'FY26'}Q1`}>Q1</option>
              <option value={`${formData.fy || 'FY26'}Q2`}>Q2</option>
              <option value={`${formData.fy || 'FY26'}Q3`}>Q3</option>
              <option value={`${formData.fy || 'FY26'}Q4`}>Q4</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Half</label>
            <select 
              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              value={formData.half}
              onChange={e => setFormData({...formData, half: e.target.value})}
            >
              <option value="H1">H1</option>
              <option value="H2">H2</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Partners</label>
            <input 
              type="text"
              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              placeholder="Partner Name"
              value={formData.partners || ''}
              onChange={e => setFormData({...formData, partners: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Product Type</label>
            <input 
              type="text"
              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              placeholder="e.g. Cloud"
              value={formData.productType || ''}
              onChange={e => setFormData({...formData, productType: e.target.value})}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Expected Close Date</label>
          <input 
            type="date"
            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            value={formData.date || ''}
            onChange={e => handleDateChange(e.target.value)}
          />
        </div>

        <div className="pt-4">
          <button 
            type="submit"
            className="w-full bg-indigo-600 text-white font-bold py-3 rounded-2xl shadow-lg hover:bg-indigo-700 transition-all active:scale-[0.98]"
          >
            {record ? "Update Opportunity" : "Create Opportunity"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
