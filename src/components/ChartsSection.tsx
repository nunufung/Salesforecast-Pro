
import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LineChart, Line, CartesianGrid } from 'recharts';
import { SalesRecord } from '../types';
import { motion, Variants } from 'motion/react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface Props {
  data: SalesRecord[];
}

const COLORS = ['#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6'];

export default function ChartsSection({ data }: Props) {
  // Helper to parse dates in various formats
  const parseDateString = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    const parsed = Date.parse(dateStr);
    if (!isNaN(parsed)) {
      return new Date(parsed);
    }
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const months: Record<string, number> = {
        jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
        jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
      };
      const monthStr = parts[1].toLowerCase().slice(0, 3);
      const year = parseInt(parts[2], 10);
      if (!isNaN(day) && year > 0 && monthStr in months) {
        return new Date(year, months[monthStr], day);
      }
    }
    return null;
  };

  const monthlyTrendsData = useMemo(() => {
    const monthlyMap: Record<string, { year: number; month: number; revenue: number; orders: number }> = {};
    
    data.forEach(r => {
      const dateObj = parseDateString(r.date);
      if (!dateObj) return;
      
      const year = dateObj.getFullYear();
      const month = dateObj.getMonth();
      const key = `${year}-${String(month + 1).padStart(2, '0')}`;
      
      if (!monthlyMap[key]) {
        monthlyMap[key] = {
          year,
          month,
          revenue: 0,
          orders: 0
        };
      }
      
      if (r.category === 'Rev') {
        monthlyMap[key].revenue += r.amountK;
      } else if (r.category === 'Order') {
        monthlyMap[key].orders += r.amountK;
      }
    });

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return Object.entries(monthlyMap)
      .map(([key, value]) => ({
        key,
        dateLabel: `${monthNames[value.month]} '${String(value.year).slice(-2)}`,
        revenue: Math.round(value.revenue),
        orders: Math.round(value.orders),
        year: value.year,
        month: value.month
      }))
      .sort((a, b) => a.key.localeCompare(b.key));
  }, [data]);

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

      {/* Monthly Revenue Trends Analysis */}
      <motion.div 
        custom={4}
        variants={cardVariants}
        initial="hidden"
        animate="show"
        className="bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-sm hover:shadow-md transition-all group"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-2.5">
            <div className="w-1.5 h-4 bg-indigo-600 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
            <div>
              <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em] font-display">
                Monthly Revenue & Order Trends
              </h3>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                Month-over-month chronological progression analysis
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-indigo-600 shadow-sm" />
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Revenue (Rev)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-1 border-t-2 border-dashed border-slate-400" />
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Orders (Order)</span>
            </div>
          </div>
        </div>
        
        <div className="h-[320px] w-full">
          {monthlyTrendsData.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-2 text-slate-400">
              <span className="text-3xl">📊</span>
              <p className="text-xs font-bold uppercase tracking-widest">No monthly trend data matches filtration</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrendsData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis 
                  dataKey="dateLabel" 
                  axisLine={false}
                  tickLine={false}
                  style={{ fontSize: '9px', fontWeight: '800', textTransform: 'uppercase', fill: '#94a3b8' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  style={{ fontSize: '9px', fontWeight: '800', fill: '#94a3b8' }}
                  tickFormatter={(val) => `¥${val.toLocaleString()}k`}
                  width={65}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 15px 25px -4px rgb(0 0 0 / 0.1)',
                    backgroundColor: 'rgba(255, 255, 255, 0.98)',
                    backdropFilter: 'blur(8px)',
                    padding: '14px',
                    borderLeft: '4px solid #6366f1'
                  }}
                  labelStyle={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', color: '#1e293b', marginBottom: '6px' }}
                  itemStyle={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', padding: '2px 0' }}
                  formatter={(val: number, name: string) => [`¥${val.toLocaleString()}k`, name === 'revenue' ? 'Revenue' : 'Orders']}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#6366f1" 
                  strokeWidth={3} 
                  dot={{ r: 4, strokeWidth: 1, fill: '#ffffff' }}
                  activeDot={{ r: 6, strokeWidth: 2, fill: '#6366f1', stroke: '#ffffff' }} 
                  name="revenue"
                />
                <Line 
                  type="monotone" 
                  dataKey="orders" 
                  stroke="#94a3b8" 
                  strokeWidth={2} 
                  strokeDasharray="5 5"
                  dot={{ r: 3, strokeWidth: 1, fill: '#ffffff' }}
                  activeDot={{ r: 5, strokeWidth: 2, fill: '#94a3b8', stroke: '#ffffff' }} 
                  name="orders"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </motion.div>
    </div>
  );
}
