
import React, { useState, useMemo } from 'react';
import { SalesRecord } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { ChevronLeft, ChevronRight, Edit2, Trash2, TrendingUp, TrendingDown, Minus, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  data: SalesRecord[];
  onEdit: (record: SalesRecord) => void;
  onDelete?: (record: SalesRecord) => void;
  searchTerm?: string;
}

const ITEMS_PER_PAGE = 10;

function Highlight({ text, highlight }: { text: string; highlight?: string }) {
  if (!highlight || !highlight.trim()) {
    return <span>{text}</span>;
  }

  // Escape special characters for regex
  const escapedHighlight = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escapedHighlight})`, 'gi'));
  
  return (
    <span>
      {parts.map((part, i) => (
        part.toLowerCase() === highlight.toLowerCase() ? (
          <mark key={i} className="bg-amber-100 text-amber-900 rounded-sm px-0.5 font-bold border-b-2 border-amber-400">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      ))}
    </span>
  );
}

type SortConfig = {
  key: keyof SalesRecord;
  direction: 'asc' | 'desc';
} | null;

export default function DataGrid({ data, onEdit, onDelete, searchTerm }: Props) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);

  // Reset pagination when data changes or sort changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [data.length, data[0]?.id, sortConfig]);

  const sortedData = useMemo(() => {
    if (!sortConfig) return data;

    return [...data].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      if (sortConfig.key === 'date') {
        const aDate = new Date(aVal as string).getTime();
        const bDate = new Date(bVal as string).getTime();
        return sortConfig.direction === 'asc' ? aDate - bDate : bDate - aDate;
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }

      const aString = String(aVal).toLowerCase();
      const bString = String(bVal).toLowerCase();
      
      if (aString < bString) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aString > bString) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig]);

  const totalPages = Math.ceil(sortedData.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedData = sortedData.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const goToPage = (page: number) => {
    setCurrentPage(Math.min(Math.max(1, page), totalPages));
  };

  const handleSort = (key: keyof SalesRecord) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const SortIndicator = ({ columnKey }: { columnKey: keyof SalesRecord }) => {
    if (sortConfig?.key !== columnKey) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-20 group-hover:opacity-100 transition-opacity" />;
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="w-3 h-3 ml-1 text-slate-900" /> 
      : <ArrowDown className="w-3 h-3 ml-1 text-slate-900" />;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm flex flex-col">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[1200px]">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="p-3 md:p-5 text-[10px] text-slate-400 font-black uppercase tracking-[0.15em] font-display whitespace-nowrap">Category</th>
              <th 
                className="p-3 md:p-5 text-[10px] text-slate-400 font-black uppercase tracking-[0.15em] font-display whitespace-nowrap cursor-pointer group hover:bg-slate-100/50 transition-colors"
                onClick={() => handleSort('date')}
              >
                <div className="flex items-center">
                  Fiscal / Date
                  <SortIndicator columnKey="date" />
                </div>
              </th>
              <th className="p-3 md:p-5 text-[10px] text-slate-400 font-black uppercase tracking-[0.15em] font-display whitespace-nowrap">Item / Client</th>
              <th className="p-5 text-[10px] text-slate-400 font-black uppercase tracking-[0.15em] font-display whitespace-nowrap">Sector</th>
              <th className="p-5 text-[10px] text-slate-400 font-black uppercase tracking-[0.15em] font-display whitespace-nowrap">Product</th>
              <th className="p-5 text-[10px] text-slate-400 font-black uppercase tracking-[0.15em] font-display whitespace-nowrap">Partner</th>
              <th className="p-5 text-[10px] text-slate-400 font-black uppercase tracking-[0.15em] font-display whitespace-nowrap">Sales Owner</th>
              <th 
                className="p-3 md:p-5 text-[10px] text-slate-400 font-black uppercase tracking-[0.15em] font-display text-right whitespace-nowrap cursor-pointer group hover:bg-slate-100/50 transition-colors"
                onClick={() => handleSort('amountK')}
              >
                <div className="flex items-center justify-end">
                  Value (k)
                  <SortIndicator columnKey="amountK" />
                </div>
              </th>
              <th className="p-3 md:p-5 text-[10px] text-slate-400 font-black uppercase tracking-[0.15em] font-display text-center whitespace-nowrap">Win Rate</th>
              <th className="p-3 md:p-5 text-[10px] text-slate-400 font-black uppercase tracking-[0.15em] font-display text-center whitespace-nowrap">Status</th>
              <th className="p-3 md:p-5 text-[10px] text-slate-400 font-black uppercase tracking-[0.15em] font-display text-right whitespace-nowrap">Edit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            <AnimatePresence mode="popLayout">
              {paginatedData.map((record, i) => (
                <motion.tr 
                  key={record.id || i + startIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="hover:bg-slate-50/80 transition-all duration-200 group"
                >
                  <td className="p-3 md:p-5 whitespace-nowrap">
                    <span className={cn(
                      "text-[9px] md:text-[10px] font-mono font-black px-2 md:px-3 py-1 rounded-full border shadow-sm inline-block uppercase tracking-widest",
                      record.category === 'Order' 
                        ? "bg-indigo-500 text-white border-indigo-400" 
                        : "bg-teal-500 text-white border-teal-400"
                    )}>
                      {record.category}
                    </span>
                  </td>
                  <td className="p-3 md:p-5 whitespace-nowrap">
                    <div className="text-[10px] font-black text-slate-400">{record.fy} | {record.date}</div>
                    <div className="text-[11px] font-bold text-slate-900 mt-0.5">{record.fyQtr}</div>
                  </td>
                  <td className="p-3 md:p-5 min-w-[200px]">
                    <div className="text-[11px] md:text-xs font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight line-clamp-1">
                      <Highlight text={record.itemName} highlight={searchTerm} />
                    </div>
                    <div className="text-[9px] md:text-[10px] text-slate-400 font-bold mt-0.5 uppercase tracking-wider truncate">
                      <Highlight text={record.customerName} highlight={searchTerm} />
                    </div>
                  </td>
                  <td className="p-5 whitespace-nowrap">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full border border-slate-200 shadow-sm group-hover:border-indigo-200 transition-colors">
                      {record.sector}
                    </span>
                  </td>
                  <td className="p-5 whitespace-nowrap">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{record.productType || '-'}</div>
                  </td>
                  <td className="p-5 whitespace-nowrap">
                    <div className="text-[10px] font-bold text-slate-400 italic">{record.partners || 'Direct'}</div>
                  </td>
                  <td className="p-5 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-1.5 overflow-hidden">
                        {(() => {
                          const parts = record.salesPerson ? record.salesPerson.split(/[,;&]|\band\b|\//gi).map(p => p.trim()).filter(Boolean) : [];
                          if (parts.length === 0) {
                            return (
                              <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-400 uppercase">
                                -
                              </div>
                            );
                          }
                          return parts.slice(0, 3).map((p, idx) => {
                            const textColors = ["text-slate-600", "text-slate-500", "text-indigo-600"];
                            const colorIndex = p.charCodeAt(0) % textColors.length;
                            return (
                              <div 
                                key={p + idx} 
                                className={`w-7 h-7 rounded-lg bg-gradient-to-br from-white to-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-black uppercase shadow-sm group-hover:from-indigo-500 group-hover:to-indigo-600 group-hover:text-white group-hover:border-indigo-400 transition-all duration-300 ring-2 ring-white ${textColors[colorIndex]}`}
                                title={p}
                              >
                                {p.charAt(0)}
                              </div>
                            );
                          });
                        })()}
                      </div>
                      <span className="text-[11px] font-bold text-slate-700 group-hover:text-indigo-900 transition-colors">{record.salesPerson}</span>
                    </div>
                  </td>
                  <td className="p-3 md:p-5 text-right whitespace-nowrap">
                    <div className="flex flex-col items-end">
                      <span className="font-mono font-black text-slate-900 tabular-nums text-[11px] md:text-base group-hover:text-indigo-600 transition-colors">
                        {formatCurrency(record.amountK)}
                      </span>
                      {record.winRate >= 0.75 && (
                        <span className="text-[7px] md:text-[8px] text-white bg-amber-500 border border-amber-400 px-2 py-0.5 rounded-full font-black uppercase tracking-widest mt-1 shadow-sm">
                          Committed
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-3 md:p-5 text-center whitespace-nowrap">
                    <div className={cn(
                      "text-[11px] font-mono font-black px-2 py-1 rounded-lg inline-block",
                      record.winRate >= 0.8 ? "text-emerald-600 bg-emerald-50" : record.winRate >= 0.5 ? "text-amber-600 bg-amber-50" : "text-rose-600 bg-rose-50"
                    )}>
                      {Math.round(record.winRate * 100)}%
                    </div>
                  </td>
                  <td className="p-3 md:p-5 whitespace-nowrap">
                    <div className="flex justify-center">
                      <span className={cn(
                        "text-[8px] md:text-[9px] font-black px-2 md:px-3 py-1.5 md:py-2 rounded-full uppercase tracking-widest border shadow-sm flex items-center gap-1 md:gap-1.5 transition-all",
                        record.status === 'Worst' ? "bg-rose-500 text-white border-rose-400" :
                        record.status === 'Likely' ? "bg-amber-500 text-white border-amber-400" :
                        "bg-emerald-500 text-white border-emerald-400"
                      )}>
                        {record.status === 'Worst' ? <TrendingDown className="w-2.5 md:w-3 h-2.5 md:h-3" /> : 
                         record.status === 'Likely' ? <Minus className="w-2.5 md:w-3 h-2.5 md:h-3" /> : 
                         <TrendingUp className="w-2.5 md:w-3 h-2.5 md:h-3" />}
                        <span>{record.status}</span>
                      </span>
                    </div>
                  </td>
                  <td className="p-3 md:p-5 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button 
                        onClick={() => onEdit(record)}
                        className="p-1.5 md:p-2 hover:bg-slate-900 rounded-xl text-slate-400 hover:text-white transition-all border border-transparent hover:border-slate-900 hover:shadow-sm"
                        title="Edit Entry"
                      >
                        <Edit2 className="w-3 md:w-3.5 h-3 md:h-3.5" />
                      </button>
                      {onDelete && (
                        <button 
                          onClick={() => onDelete(record)}
                          className="p-1.5 md:p-2 hover:bg-rose-50 rounded-xl text-slate-400 hover:text-rose-600 transition-all border border-transparent hover:border-rose-100 hover:shadow-sm"
                          title="Delete Entry"
                        >
                          <Trash2 className="w-3 md:w-3.5 h-3 md:h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="px-6 py-4 bg-slate-50/30 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-display">
          Page {currentPage} of {totalPages} <span className="mx-2 text-slate-200">/</span> {data.length} records
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 hover:border-slate-300 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <div className="flex items-center gap-1.5 px-2">
            {[...Array(Math.min(5, totalPages))].map((_, i) => {
              let pageNum = currentPage;
              if (currentPage <= 3 || totalPages <= 5) pageNum = i + 1;
              else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
              else pageNum = currentPage - 2 + i;

              if (pageNum < 1 || pageNum > totalPages) return null;

              return (
                <button
                  key={pageNum}
                  onClick={() => goToPage(pageNum)}
                  className={cn(
                    "w-8 h-8 rounded-xl text-[11px] font-black transition-all border",
                    currentPage === pageNum 
                      ? "bg-slate-900 text-white border-slate-900" 
                      : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                  )}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 hover:border-slate-300 transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
