
import React, { useMemo } from 'react';
import { SalesRecord } from '../types';
import { motion } from 'motion/react';
import { Sparkles, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import Fuse from 'fuse.js';

interface Props {
  data: SalesRecord[];
  allData?: SalesRecord[];
  selectedSectors?: string[];
  selectedFYs?: string[];
  selectedFYQtrs?: string[];
  selectedSalesPersons?: string[];
  selectedStatuses?: string[];
  selectedCategories?: string[];
  selectedWinRateOptions?: string[];
  startDate?: string;
  endDate?: string;
  searchTerm?: string;
}

const WIN_RATE_OPTIONS_LOCAL = [
  { id: 'ge90', test: (w: number) => w >= 0.9 },
  { id: 'ge75', test: (w: number) => w >= 0.75 },
  { id: 'ge50', test: (w: number) => w >= 0.5 },
  { id: 'ge25', test: (w: number) => w >= 0.25 },
  { id: 'r75-100', test: (w: number) => w >= 0.75 && w <= 1.0 },
  { id: 'r50-75', test: (w: number) => w >= 0.5 && w < 0.75 },
  { id: 'r25-50', test: (w: number) => w >= 0.25 && w < 0.50 },
  { id: 'r0-25', test: (w: number) => w >= 0.0 && w < 0.25 }
];

export default function AdvancedAnalytics({ 
  data, 
  allData = [], 
  selectedSectors = [], 
  selectedFYs = [], 
  selectedFYQtrs = [], 
  selectedSalesPersons = [], 
  selectedStatuses = [], 
  selectedCategories = [], 
  selectedWinRateOptions = [], 
  startDate = '', 
  endDate = '', 
  searchTerm = '' 
}: Props) {
  const yoyMetrics = useMemo(() => {
    // 1. Determine active latest year (e.g. FY26)
    const activeYears = selectedFYs && selectedFYs.length > 0
      ? selectedFYs
      : [...new Set(data.map(r => r.fy))].sort();
    
    const latestYear = activeYears[activeYears.length - 1] || 'FY26';
    
    // We compare with the preceding year dynamically (e.g. FY26 -> FY25, FY25 -> FY24, etc.)
    const currentYearNum = parseInt(latestYear.replace(/\D/g, '')) || 26;
    const comparisonYear = `FY${currentYearNum - 1}`;
    
    // 2. Current year Total matching active selection
    const currentYearData = data.filter(r => r.fy === latestYear);
    const yearTotal = currentYearData.reduce((sum, r) => sum + r.amountK, 0);
    
    // Find all distinct calendar months present in the active dataset to enable "same month" comparison
    const activeMonths = [...new Set(currentYearData.map(r => {
      const d = new Date(r.date);
      return isNaN(d.getTime()) ? null : d.getMonth(); // 0-11
    }))].filter(m => m !== null) as number[];

    // 3. Find same period/filters in comparison year
    let compData = allData.length > 0 ? allData.filter(r => r.fy === comparisonYear) : [];
    
    if (allData.length > 0) {
      compData = compData.filter(record => {
        // Sector
        const matchesSector = selectedSectors.length === 0 || selectedSectors.includes(record.sector);
        
        // Quarter: e.g. FY26Q2 -> FY25Q2
        const matchesFYQtr = selectedFYQtrs.length === 0 || (() => {
          const fyCompEquivalentQtrs = selectedFYQtrs.map(q => q.replace(/FY\d+/, comparisonYear));
          return fyCompEquivalentQtrs.includes(record.fyQtr);
        })();
        
        // Salesperson
        const matchesSalesPerson = selectedSalesPersons.length === 0 || (() => {
          if (!record.salesPerson) return false;
          const parts = record.salesPerson.split(/[,;&]|\band\b|\//gi).map(p => p.trim()).filter(Boolean);
          return selectedSalesPersons.some(sp => parts.includes(sp));
        })();
        
        // Status
        const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(record.status);
        
        // Category
        const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(record.category);
        
        // Win Rate Options
        const matchesWinRate = selectedWinRateOptions.length === 0 || selectedWinRateOptions.some(optId => {
          const option = WIN_RATE_OPTIONS_LOCAL.find(o => o.id === optId);
          return option ? option.test(record.winRate) : true;
        });
        
        // Date: Shift the startDate and endDate to the comparison year
        const matchesDate = (() => {
          let matches = true;
          const curYVal = parseInt(latestYear.replace('FY', '')) || 26;
          const compYVal = parseInt(comparisonYear.replace('FY', '')) || 25;
          const yearDiff = curYVal - compYVal;
          
          if (startDate) {
            const d = new Date(startDate);
            d.setFullYear(d.getFullYear() - yearDiff);
            matches = matches && (new Date(record.date) >= d);
          }
          if (endDate) {
            const d = new Date(endDate);
            d.setFullYear(d.getFullYear() - yearDiff);
            matches = matches && (new Date(record.date) <= d);
          }
          return matches;
        })();
        
        // Month matching: YoY same calendar months
        const matchesMonth = (() => {
          if (activeMonths.length > 0 && activeMonths.length < 12) {
            const rDate = new Date(record.date);
            if (!isNaN(rDate.getTime())) {
              return activeMonths.includes(rDate.getMonth());
            }
          }
          return true;
        })();

        return matchesSector && matchesFYQtr && matchesSalesPerson && matchesStatus && matchesCategory && matchesWinRate && matchesDate && matchesMonth;
      });
      
      // Apply fuzzy search on comparison year if searchTerm exists
      if (searchTerm && searchTerm.trim()) {
        const fuse = new Fuse(compData, {
          keys: ['itemName', 'customerName', 'salesPerson', 'partners', 'productType'],
          threshold: 0.35,
          location: 0,
          distance: 100,
          includeScore: true,
          useExtendedSearch: true
        });
        const results = fuse.search(searchTerm);
        compData = results.map(result => result.item);
      }
    } else {
      // Fallback if allData not supplied (revert to original basic filter of data)
      compData = data.filter(r => r.fy === comparisonYear);
    }
    
    const compTotal = compData.reduce((sum, r) => sum + r.amountK, 0);
    const growth = compTotal > 0 ? ((yearTotal - compTotal) / compTotal) * 100 : 0;
    
    return {
      latestYear,
      comparisonYear,
      yearTotal,
      fy25Total: compTotal,
      growth,
      currentYearCount: currentYearData.length,
      isSpecificPeriod: selectedFYQtrs.length > 0 || !!startDate || !!endDate || (activeMonths.length > 0 && activeMonths.length < 12)
    };
  }, [
    data, 
    allData, 
    selectedSectors, 
    selectedFYs, 
    selectedFYQtrs, 
    selectedSalesPersons, 
    selectedStatuses, 
    selectedCategories, 
    selectedWinRateOptions, 
    startDate, 
    endDate, 
    searchTerm
  ]);

  const insights = useMemo(() => {
    if (data.length === 0) return [];
    
    const results: string[] = [];
    const latestQtr = [...new Set(data.map(r => r.fyQtr))].sort().pop() || '';
    const { latestYear, yearTotal, fy25Total, growth, currentYearCount } = yoyMetrics;
    
    const currentQtrData = data.filter(r => r.fyQtr === latestQtr);
    const qtrTotal = currentQtrData.reduce((sum, r) => sum + r.amountK, 0);
    
    // Insights
    results.push(`${latestYear} Performance: Currently at ${formatCurrency(yearTotal)}k with ${currentYearCount} active opportunities across all sectors.`);
    
    if (fy25Total > 0) {
      const growthLabel = growth >= 0 ? '+' : '';
      const periodLabel = yoyMetrics.isSpecificPeriod ? "same period" : "full year";
      results.push(`YoY vs ${yoyMetrics.comparisonYear} (${periodLabel}): Growth is tracking at ${growthLabel}${growth.toFixed(1)}% compared to ${formatCurrency(fy25Total)}k total volume in ${yoyMetrics.comparisonYear}.`);
    } else {
      if (yearTotal > 0) {
        results.push(`YoY vs ${yoyMetrics.comparisonYear}: Net-new revenue tracked for this selection (No prior ${yoyMetrics.comparisonYear} comparative baseline matches).`);
      }
    }

    results.push(`${latestQtr} Snapshot: Period revenue is ${formatCurrency(qtrTotal)}k, representing ${Math.round((qtrTotal/Math.max(1, yearTotal))*100)}% of current fiscal year target.`);
    
    const committed = currentQtrData.filter(r => r.winRate >= 0.75).length;
    if (committed > 0) {
      results.push(`Pipeline Integrity: ${committed} deals in the current cycle are verified as 'Committed' (>=75% Win Rate), ensuring period stability.`);
    }

    return results;
  }, [data, yoyMetrics]);

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    show: { opacity: 1, scale: 1, transition: { duration: 0.5 } }
  };

  return (
    <div className="mb-12">
      {/* Insights */}
      <motion.div 
        variants={cardVariants}
        initial="hidden"
        animate="show"
        className="bg-white border border-slate-200 p-8 md:p-10 rounded-[2.5rem] shadow-sm flex flex-col max-w-3xl mx-auto"
      >
        <div className="flex items-center gap-4 mb-10">
          <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center text-slate-900">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] font-display">Intelligence Synthesis</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 whitespace-nowrap">Proprietary performance heuristics</p>
          </div>
        </div>

        <div className="space-y-8 flex-1">
          {insights.map((insight, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + (i * 0.1) }}
              className="flex gap-5 group"
            >
              <div className="shrink-0 mt-1">
                <div className="w-2 h-2 rounded-full bg-slate-200 mt-1.5 group-hover:bg-slate-900 transition-colors" />
              </div>
              <p className="text-[13px] font-bold text-slate-500 leading-relaxed group-hover:text-slate-900 transition-colors">
                {insight}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="mt-10 pt-10 border-t border-slate-100">
          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
            <span className="text-slate-400 tracking-[0.3em]">Operational Readiness Report</span>
            <span className="text-slate-900 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Real-time update active
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
