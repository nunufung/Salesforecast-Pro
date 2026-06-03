
import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, FunnelChart, Funnel, LabelList } from 'recharts';
import { SalesRecord } from '../types';
import { motion, Variants } from 'motion/react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import PerformanceTrendsChart from './PerformanceTrendsChart';

interface Props {
  data: SalesRecord[];
}

const COLORS = ['#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6'];

export default function ChartsSection({ data }: Props) {
  const sectorData = useMemo(() => {
    const sectors: Record<string, number> = {};
    data.forEach(r => {
      sectors[r.sector] = (sectors[r.sector] || 0) + r.amountK;
    });
    return Object.entries(sectors)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [data]);

  const salespersonData = useMemo(() => {
    const people: Record<string, number> = {};
    data.forEach(r => {
      if (r.salesPerson) {
        const parts = r.salesPerson.split(/[,;&]|\band\b|\//gi).map(p => p.trim()).filter(Boolean);
        // Attribute full amount to each owner involved in a collaborative/multi-owner deal
        parts.forEach(p => {
          people[p] = (people[p] || 0) + r.amountK;
        });
      }
    });
    return Object.entries(people)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [data]);

  const statusData = useMemo(() => {
    const statuses: Record<string, number> = { 'Best': 0, 'Likely': 0, 'Worst': 0 };
    data.forEach(r => {
      const s = r.status || 'Other';
      statuses[s] = (statuses[s] || 0) + r.amountK;
    });
    return Object.entries(statuses).map(([name, value]) => ({ name, value }));
  }, [data]);

  const categoryData = useMemo(() => {
    const categories: Record<string, number> = { 'Order': 0, 'Rev': 0 };
    data.forEach(r => {
      if (r.category === 'Order' || r.category === 'Rev') {
        categories[r.category] = (categories[r.category] || 0) + r.amountK;
      }
    });
    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  }, [data]);

  const funnelData = useMemo(() => {
    // Determine current vs previous half period chronologically to calculate dynamic trend
    let currentRecords: SalesRecord[] = [];
    let previousRecords: SalesRecord[] = [];

    const recordsWithTime = data.map(r => {
      let timestamp = 0;
      if (r.date) {
        const parsed = Date.parse(r.date);
        if (!isNaN(parsed)) {
          timestamp = parsed;
        }
      }
      return { record: r, timestamp };
    }).filter(item => item.timestamp > 0);

    if (recordsWithTime.length >= 2) {
      const times = recordsWithTime.map(item => item.timestamp);
      const minTime = Math.min(...times);
      const maxTime = Math.max(...times);
      
      if (maxTime > minTime) {
        const midpoint = minTime + (maxTime - minTime) / 2;
        currentRecords = recordsWithTime.filter(item => item.timestamp >= midpoint).map(item => item.record);
        previousRecords = recordsWithTime.filter(item => item.timestamp < midpoint).map(item => item.record);
      } else {
        const halfIndex = Math.ceil(data.length / 2);
        currentRecords = data.slice(halfIndex);
        previousRecords = data.slice(0, halfIndex);
      }
    } else {
      const halfIndex = Math.ceil(data.length / 2);
      currentRecords = data.slice(halfIndex);
      previousRecords = data.slice(0, halfIndex);
    }

    const currentStages = [0, 0, 0];
    const previousStages = [0, 0, 0];

    currentRecords.forEach(r => {
      if (r.status === 'Best') currentStages[0]++;
      if (r.status === 'Likely') currentStages[1]++;
      if (r.category === 'Order') currentStages[2]++;
    });

    previousRecords.forEach(r => {
      if (r.status === 'Best') previousStages[0]++;
      if (r.status === 'Likely') previousStages[1]++;
      if (r.category === 'Order') previousStages[2]++;
    });

    const stages = [
      { name: 'Best', value: 0, fill: '#8b5cf6', trend: 'flat', pctChange: 0 }, // Violet
      { name: 'Likely', value: 0, fill: '#6366f1', trend: 'flat', pctChange: 0 }, // Indigo
      { name: 'Order', value: 0, fill: '#0ea5e9', trend: 'flat', pctChange: 0 } // Sky
    ];
    
    data.forEach(r => {
      if (r.status === 'Best') stages[0].value++;
      if (r.status === 'Likely') stages[1].value++;
      if (r.category === 'Order') stages[2].value++;
    });

    // Calculate trend details for each stage
    for (let i = 0; i < 3; i++) {
      const cur = currentStages[i];
      const prev = previousStages[i];
      
      if (prev > 0) {
        const change = ((cur - prev) / prev) * 100;
        stages[i].pctChange = parseFloat(change.toFixed(1));
        if (change > 0) {
          stages[i].trend = 'up';
        } else if (change < 0) {
          stages[i].trend = 'down';
        } else {
          stages[i].trend = 'flat';
        }
      } else if (cur > 0) {
        stages[i].pctChange = 100;
        stages[i].trend = 'up';
      } else {
        stages[i].pctChange = 0;
        stages[i].trend = 'flat';
      }
    }

    return stages;
  }, [data]);

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    show: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.4 + (i * 0.1),
        duration: 0.5,
        ease: "easeOut"
      }
    })
  };

  const renderCustomizedLabel = (props: any) => {
    const { x, y, width, height, value, index } = props;
    const stage = funnelData[index];
    if (!stage) return null;

    const xVal = (typeof x === 'number' && !isNaN(x)) ? x : 0;
    const yVal = (typeof y === 'number' && !isNaN(y)) ? y : 0;
    const heightVal = (typeof height === 'number' && !isNaN(height)) ? height : 0;

    const isUp = stage.trend === 'up';
    const isDown = stage.trend === 'down';
    const trendIcon = isUp ? '↑' : isDown ? '↓' : '→';
    const trendColor = isUp ? '#10b981' : isDown ? '#f43f5e' : '#64748b';
    const changeText = stage.pctChange !== 0 ? `${isUp ? '+' : ''}${stage.pctChange}%` : 'Stable';

    return (
      <g>
        <text 
          x={xVal + 10} 
          y={yVal + heightVal / 2 + 3} 
          fill="#0f172a" 
          fontWeight="900" 
          fontSize="10px" 
          letterSpacing="0.05em" 
          textAnchor="start"
          className="font-sans uppercase"
        >
          {stage.name}
        </text>
        <text 
          x={xVal + 75} 
          y={yVal + heightVal / 2 + 3} 
          fill={trendColor} 
          fontWeight="800" 
          fontSize="11px" 
          textAnchor="start"
          className="font-mono"
        >
          {trendIcon} {changeText}
        </text>
      </g>
    );
  };

  return (
    <div className="space-y-6 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* Sector Distribution */}
        <motion.div 
          custom={0}
          variants={cardVariants}
          initial="hidden"
          animate="show"
          className="bg-white border border-slate-200 p-6 rounded-[2rem] shadow-sm hover:shadow-md transition-all group"
        >
          <div className="flex items-center gap-2 mb-6">
            <div className="w-1.5 h-4 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
            <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em] font-display">
              Pipeline by Sector
            </h3>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sectorData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {sectorData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]} 
                      className="hover:opacity-80 transition-opacity cursor-pointer"
                    />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    padding: '12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(4px)'
                  }}
                  itemStyle={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}
                  formatter={(val: number) => `¥${val.toLocaleString()}k`}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  iconType="circle"
                  wrapperStyle={{ fontSize: '9px', textTransform: 'uppercase', fontWeight: '900', paddingTop: '20px' }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Forecast Status Distribution */}
        <motion.div 
          custom={1}
          variants={cardVariants}
          initial="hidden"
          animate="show"
          className="bg-white border border-slate-200 p-6 rounded-[2rem] shadow-sm hover:shadow-md transition-all group"
        >
          <div className="flex items-center gap-2 mb-6">
            <div className="w-1.5 h-4 bg-rose-500 rounded-full shadow-[0_0_10px_rgba(244,63,94,0.5)]" />
            <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em] font-display">
              Confidence Levels
            </h3>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <XAxis 
                  dataKey="name" 
                  axisLine={false}
                  tickLine={false}
                  style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', fill: '#94a3b8' }}
                  dy={10}
                />
                <YAxis hide />
                <Tooltip 
                  cursor={{ fill: '#f8fafc', radius: 12 }}
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    backgroundColor: 'white'
                  }}
                  itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                />
                <Bar dataKey="value" radius={[8, 8, 8, 8]} barSize={40}>
                  {statusData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.name === 'Best' ? '#10b981' : entry.name === 'Likely' ? '#f59e0b' : '#f43f5e'} 
                      className="hover:opacity-80 transition-opacity"
                      aria-label={`Confidence Level / 信心水平: ${entry.name}, ¥${entry.value.toLocaleString()}k`}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Order vs Rev Comparison */}
        <motion.div 
          custom={2}
          variants={cardVariants}
          initial="hidden"
          animate="show"
          className="bg-white border border-slate-200 p-6 rounded-[2rem] shadow-sm hover:shadow-md transition-all group"
        >
          <div className="flex items-center gap-2 mb-6">
            <div className="w-1.5 h-4 bg-teal-500 rounded-full shadow-[0_0_10px_rgba(20,184,166,0.5)]" />
            <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em] font-display">
              Order vs Revenue
            </h3>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <XAxis 
                  dataKey="name" 
                  axisLine={false}
                  tickLine={false}
                  style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', fill: '#94a3b8' }}
                  dy={10}
                />
                <YAxis hide />
                <Tooltip 
                  cursor={{ fill: '#f8fafc', radius: 12 }}
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    backgroundColor: 'white'
                  }}
                  itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                  formatter={(val: number) => [`¥${val.toLocaleString()}k`, 'Value']}
                />
                <Bar dataKey="value" radius={[8, 8, 8, 8]} barSize={40}>
                  {categoryData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.name === 'Order' ? '#0f172a' : '#64748b'} 
                      className="hover:opacity-80 transition-opacity"
                      aria-label={`Category / 类型: ${entry.name}, ¥${entry.value.toLocaleString()}k`}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Salesperson Performance */}
        <motion.div 
          custom={3}
          variants={cardVariants}
          initial="hidden"
          animate="show"
          className="bg-white border border-slate-200 p-6 rounded-[2rem] shadow-sm hover:shadow-md transition-all group"
        >
          <div className="flex items-center gap-2 mb-6">
            <div className="w-1.5 h-4 bg-amber-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
            <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em] font-display">
              Top Performance Metrics
            </h3>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salespersonData} layout="vertical" margin={{ left: 10, right: 30 }}>
                <XAxis type="number" hide />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  width={80} 
                  axisLine={false}
                  tickLine={false}
                  style={{ fontSize: '9px', textTransform: 'uppercase', fontWeight: '900', fill: '#64748b' }}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc', radius: 8 }}
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' 
                  }}
                />
                <Bar dataKey="value" fill="#0f172a" radius={[0, 8, 8, 0]} barSize={20}>
                  {salespersonData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill="#0f172a"
                      aria-label={`Salesperson / 销售人员: ${entry.name}, ¥${entry.value.toLocaleString()}k`}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Performance Trends Section (D3.js integration) */}
      <PerformanceTrendsChart data={data} />

      {/* Sales Funnel Section */}
      <motion.div 
        custom={4}
        variants={cardVariants}
        initial="hidden"
        animate="show"
        className="bg-white border border-slate-200 p-8 rounded-[3rem] shadow-sm hover:shadow-md transition-all group"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-4 bg-slate-900 rounded-full" />
            <div>
              <h3 className="text-[12px] font-black text-slate-900 uppercase tracking-[0.2em] font-display">
                Sales Conversion Funnel
              </h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Status Progression Efficiency</p>
            </div>
          </div>
          <div className="flex gap-8">
            {funnelData.slice(0, 2).map((stage, idx) => {
              const nextStage = funnelData[idx + 1];
              const conversion = nextStage && stage.value > 0 ? (nextStage.value / stage.value * 100).toFixed(1) : 0;
              return (
                <div key={stage.name} className="flex flex-col items-end">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{stage.name} → {nextStage?.name}</span>
                  <span className="text-xl font-mono font-black text-slate-900">{conversion}%</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <FunnelChart>
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '20px', 
                  border: 'none', 
                  boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
                  padding: '16px'
                }}
                itemStyle={{ fontSize: '12px', fontWeight: '900', textTransform: 'uppercase' }}
                formatter={(val: number, name: string) => [`${val} Opportunities`, name]}
              />
              <Funnel
                data={funnelData}
                dataKey="value"
                nameKey="name"
              >
                {funnelData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.fill} 
                    aria-label={`Stage: ${entry.name}, Volume: ${entry.value}, Change: ${entry.pctChange}% (${entry.trend === 'up' ? 'Increase' : entry.trend === 'down' ? 'Decrease' : 'Stable'})`}
                  />
                ))}
                <LabelList 
                  position="right" 
                  dataKey="name" 
                  content={renderCustomizedLabel} 
                />
                <LabelList 
                  position="center" 
                  fill="#fff" 
                  stroke="none" 
                  dataKey="value" 
                  style={{ fontSize: '14px', fontWeight: '900', fontFamily: 'monospace' }} 
                />
              </Funnel>
            </FunnelChart>
          </ResponsiveContainer>
        </div>

        {/* Detailed Trend Badges below the chart */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-slate-100">
          {funnelData.map(stage => {
            const isUp = stage.trend === 'up';
            const isDown = stage.trend === 'down';
            return (
              <div key={stage.name} className="flex items-center justify-between p-4 bg-slate-50/50 border border-slate-100 rounded-2xl hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: stage.fill }} />
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block leading-none">{stage.name} Stage</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1 block">Progression Level</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-black font-mono text-slate-900">{stage.value}</span>
                  <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-[10px] font-black rounded-lg border shadow-sm ${
                    isUp ? 'bg-emerald-50 text-emerald-700 border-emerald-100/80' : 
                    isDown ? 'bg-rose-50 text-rose-700 border-rose-100/80' : 
                    'bg-slate-100/80 text-slate-600 border-slate-200/50'
                  }`}>
                    {isUp && <TrendingUp className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />}
                    {isDown && <TrendingDown className="w-3.5 h-3.5 text-rose-600 stroke-[2.5]" />}
                    {stage.pctChange !== 0 ? `${stage.pctChange > 0 ? '+' : ''}${stage.pctChange}%` : 'Stable'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
