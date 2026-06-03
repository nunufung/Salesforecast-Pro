
import React, { useMemo } from 'react';
import { SalesRecord } from '../types';
import { motion } from 'motion/react';
import { Sparkles, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '../lib/utils';

interface Props {
  data: SalesRecord[];
}

export default function AdvancedAnalytics({ data }: Props) {
  const yoyMetrics = useMemo(() => {
    const latestYear = [...new Set(data.map(r => r.fy))].sort().pop() || '';
    const fy25Total = data.filter(r => r.fy === 'FY25').reduce((sum, r) => sum + r.amountK, 0);
    const currentYearData = data.filter(r => r.fy === latestYear);
    const yearTotal = currentYearData.reduce((sum, r) => sum + r.amountK, 0);
    
    const growth = fy25Total > 0 ? ((yearTotal - fy25Total) / fy25Total) * 100 : 0;
    
    return {
      latestYear,
      yearTotal,
      fy25Total,
      growth,
      currentYearCount: currentYearData.length
    };
  }, [data]);

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
      results.push(`YoY vs FY25: Growth is tracking at ${growthLabel}${growth.toFixed(1)}% compared to ${formatCurrency(fy25Total)}k total volume in FY25.`);
    }

    results.push(`${latestQtr} Snapshot: Period revenue is ${formatCurrency(qtrTotal)}k, representing ${Math.round((qtrTotal/yearTotal)*100)}% of current fiscal year target.`);
    
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
