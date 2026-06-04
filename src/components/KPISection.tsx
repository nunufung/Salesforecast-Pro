
import React, { useMemo } from 'react';
import { SalesRecord } from '../types';
import { formatCurrency, formatNumber, cn } from '../lib/utils';
import { TrendingUp, Users, Target, ArrowUpRight, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import Fuse from 'fuse.js';

interface Props {
  data: SalesRecord[];
  allData?: SalesRecord[];
  selectedFYs?: string[];
  selectedFYQtrs?: string[];
  selectedSectors?: string[];
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

export default function KPISection({ 
  data,
  allData = [],
  selectedFYs = [],
  selectedFYQtrs = [],
  selectedSectors = [],
  selectedSalesPersons = [],
  selectedStatuses = [],
  selectedCategories = [],
  selectedWinRateOptions = [],
  startDate = '',
  endDate = '',
  searchTerm = ''
}: Props) {
  const metrics = useMemo(() => {
    const totalPipeline = data.reduce((sum, r) => sum + r.amountK, 0);
    
    // Count unique customers
    const customers = new Set(data.map(r => r.customerName));
    
    // Committed items count (>=75%) and value
    const committedDeals = data.filter(r => r.winRate >= 0.75);
    const committedCount = committedDeals.length;
    const committedValue = committedDeals.reduce((sum, r) => sum + r.amountK, 0);

    // Churn Risk calculation (Heuristic: % of value in 'Worst' status or <20% win rate)
    const atRiskValue = data
      .filter(r => r.winRate < 0.2 || r.status === 'Worst')
      .reduce((sum, r) => sum + r.amountK, 0);
    const churnRisk = totalPipeline > 0 ? (atRiskValue / totalPipeline) * 100 : 0;
    
    const riskReason = churnRisk > 25 
      ? "High volume of low-probability deals detected."
      : churnRisk > 10
      ? "Stagnation in 'Worst' category deals."
      : "Pipeline performance is stable.";

    // YoY computations
    let compTotalPipeline = 0;
    let growth = 0;
    let hasCompData = false;

    const activeYears = selectedFYs && selectedFYs.length > 0
      ? selectedFYs
      : [...new Set(data.map(r => r.fy))].sort();
    
    const latestYear = activeYears[activeYears.length - 1] || 'FY26';
    const currentYearNum = parseInt(latestYear.replace(/\D/g, '')) || 26;
    const comparisonYear = `FY${currentYearNum - 1}`;

    const currentYearData = data.filter(r => r.fy === latestYear);
    
    const activeMonths = [...new Set(currentYearData.map(r => {
      const d = new Date(r.date);
      return isNaN(d.getTime()) ? null : d.getMonth(); // 0-11
    }))].filter(m => m !== null) as number[];

    if (allData && allData.length > 0) {
      let compData = allData.filter(r => r.fy === comparisonYear);
      
      compData = compData.filter(record => {
        const matchesSector = selectedSectors.length === 0 || selectedSectors.includes(record.sector);
        
        const matchesFYQtr = selectedFYQtrs.length === 0 || (() => {
          const fyCompEquivalentQtrs = selectedFYQtrs.map(q => q.replace(/FY\d+/, comparisonYear));
          return fyCompEquivalentQtrs.includes(record.fyQtr);
        })();
        
        const matchesSalesPerson = selectedSalesPersons.length === 0 || (() => {
          if (!record.salesPerson) return false;
          const parts = record.salesPerson.split(/[,;&]|\band\b|\//gi).map(p => p.trim()).filter(Boolean);
          return selectedSalesPersons.some(sp => parts.includes(sp));
        })();
        
        const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(record.status);
        
        const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(record.category);
        
        const matchesWinRate = selectedWinRateOptions.length === 0 || selectedWinRateOptions.some(optId => {
          const option = WIN_RATE_OPTIONS_LOCAL.find(o => o.id === optId);
          return option ? option.test(record.winRate) : true;
        });
        
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

      compTotalPipeline = compData.reduce((sum, r) => sum + r.amountK, 0);
      hasCompData = compData.length > 0;
      growth = compTotalPipeline > 0 ? ((totalPipeline - compTotalPipeline) / compTotalPipeline) * 100 : 0;
    }

    return {
      totalPipeline,
      customerCount: customers.size,
      committedCount,
      committedValue,
      churnRisk,
      riskReason,
      growth,
      compTotalPipeline,
      hasCompData
    };
  }, [
    data,
    allData,
    selectedFYs,
    selectedFYQtrs,
    selectedSectors,
    selectedSalesPersons,
    selectedStatuses,
    selectedCategories,
    selectedWinRateOptions,
    startDate,
    endDate,
    searchTerm
  ]);

  const trendText = useMemo(() => {
    if (!metrics.hasCompData || metrics.compTotalPipeline === 0) {
      return undefined;
    }
    const growthVal = metrics.growth;
    const sign = growthVal >= 0 ? '+' : '';
    return `${sign}${growthVal.toFixed(1)}% YoY`;
  }, [metrics.growth, metrics.hasCompData, metrics.compTotalPipeline]);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 mb-8"
    >
      <motion.div variants={item}>
        <KPICard
          title="Total Pipeline"
          value={formatCurrency(metrics.totalPipeline)}
          sub={`${formatNumber(data.length)} Active Deals`}
          icon={<TrendingUp className="w-5 h-5" />}
          trend={trendText}
          accentColor="indigo"
        />
      </motion.div>
      <motion.div variants={item}>
        <KPICard
          title="Top Accounts"
          value={formatNumber(metrics.customerCount)}
          sub="Unique Partners"
          icon={<Users className="w-5 h-5" />}
          accentColor="emerald"
        />
      </motion.div>
      <motion.div variants={item}>
        <KPICard
          title="Committed Pipeline"
          value={formatCurrency(metrics.committedValue)}
          sub={`${formatNumber(metrics.committedCount)} Deals @ 75%+`}
          icon={<Target className="w-5 h-5" />}
          accentColor="amber"
        />
      </motion.div>
      <motion.div variants={item}>
        <KPICard
          title="Churn Risk Score"
          value={`${metrics.churnRisk.toFixed(1)}%`}
          sub={metrics.riskReason}
          icon={<AlertCircle className={cn("w-5 h-5", metrics.churnRisk > 20 ? "text-red-500" : "text-amber-500")} />}
          accentColor={metrics.churnRisk > 20 ? "red" : "amber"}
        />
      </motion.div>
    </motion.div>
  );
}

const colorMap = {
  indigo: { 
    bg: 'bg-indigo-50/50', 
    iconBg: 'bg-indigo-600', 
    iconText: 'text-indigo-600', 
    border: 'border-indigo-100', 
    text: 'text-indigo-900',
    title: 'text-indigo-400',
    blob: 'bg-indigo-500/10'
  },
  blue: { 
    bg: 'bg-blue-50/50', 
    iconBg: 'bg-blue-600', 
    iconText: 'text-blue-600', 
    border: 'border-blue-100', 
    text: 'text-blue-900',
    title: 'text-blue-400',
    blob: 'bg-blue-500/10'
  },
  emerald: { 
    bg: 'bg-emerald-50/50', 
    iconBg: 'bg-emerald-600', 
    iconText: 'text-emerald-600', 
    border: 'border-emerald-100', 
    text: 'text-emerald-900',
    title: 'text-emerald-400',
    blob: 'bg-emerald-500/10'
  },
  amber: { 
    bg: 'bg-amber-50/50', 
    iconBg: 'bg-amber-600', 
    iconText: 'text-amber-600', 
    border: 'border-amber-100', 
    text: 'text-amber-900',
    title: 'text-amber-400',
    blob: 'bg-amber-500/10'
  },
  red: { 
    bg: 'bg-red-50/50', 
    iconBg: 'bg-red-600', 
    iconText: 'text-red-600', 
    border: 'border-red-100', 
    text: 'text-red-900',
    title: 'text-red-400',
    blob: 'bg-red-500/10'
  },
};

function KPICard({ title, value, sub, icon, trend, accentColor = "indigo" }: { 
  title: string, value: string, sub: string, icon: React.ReactNode, trend?: string, accentColor?: keyof typeof colorMap
}) {
  const c = colorMap[accentColor];

  return (
    <div className={`group relative overflow-hidden bg-white border border-slate-200 p-6 rounded-[2rem] transition-all duration-500 hover:shadow-2xl hover:border-transparent hover:-translate-y-1`}>
      {/* Decorative Blob */}
      <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-3xl transition-all duration-500 group-hover:scale-150 ${c.blob}`} />
      
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className={`p-3 rounded-2xl ${c.bg} ${c.iconText} border ${c.border} flex items-center justify-center transition-transform duration-500 group-hover:scale-110`}>
          {icon}
        </div>
        {trend && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-900 text-[10px] text-white rounded-full font-bold uppercase tracking-widest shrink-0 shadow-lg">
            <ArrowUpRight className="w-3 h-3" />
            {trend}
          </div>
        )}
      </div>

      <div className="space-y-1 relative z-10">
        <h3 className={`text-[10px] font-bold uppercase tracking-[0.2em] font-display ${c.title}`}>
          {title}
        </h3>
        <div className="text-3xl font-black font-display tracking-tighter text-slate-900">
          {value}
        </div>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest pt-2 flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${c.iconBg}`} />
          {sub}
        </p>
      </div>
    </div>
  );
}
