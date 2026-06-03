
import React, { useMemo } from 'react';
import { SalesRecord } from '../types';
import { formatCurrency, formatNumber, cn } from '../lib/utils';
import { TrendingUp, Users, Target, ArrowUpRight, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  data: SalesRecord[];
}

export default function KPISection({ data }: Props) {
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

    return {
      totalPipeline,
      customerCount: customers.size,
      committedCount,
      committedValue,
      churnRisk,
      riskReason
    };
  }, [data]);

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
          trend="+12% / FY"
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
