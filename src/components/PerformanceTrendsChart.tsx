import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { useSales } from '../context/SalesContext';
import { SalesRecord } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { TrendingUp, Calendar, Info, BarChart3, LineChart, CheckCircle2 } from 'lucide-react';

interface Props {
  data: SalesRecord[];
}

interface RollingMetric {
  date: Date;
  monthStr: string; // "YYYY-MM"
  monthLabel: string; // Display month name "Jan '26" or similar
  
  // Monthly Raw Sums
  monthlyTotal: number;
  monthlyWeighted: number;
  monthlyActual: number;
  
  // Rolling 3-Month Cumulative Sums
  rollingWeighted: number;
  rollingActual: number;
  rollingTotal: number;
  
  // Metrics
  rollingClosureRate: number; // Rolling Actual Closed / Rolling Total Pipeline * 100
  accuracyRate: number; // Rolling Actual / Rolling Weighted Forecast (attainment) * 100
}

export default function PerformanceTrendsChart({ data }: Props) {
  const { t, language } = useSales();
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  
  // Sizes tracked via ResizeObserver
  const [dimensions, setDimensions] = useState({ width: 0, height: 320 });
  const [hoveredData, setHoveredData] = useState<RollingMetric | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Custom date string parser
  const parseRecordDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    const parsed = Date.parse(dateStr);
    if (!isNaN(parsed)) {
      return new Date(parsed);
    }
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const year = parseInt(parts[2], 10);
      const monthNames: Record<string, number> = {
        jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
        jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
      };
      const monthStr = parts[1].toLowerCase().substring(0, 3);
      const month = monthNames[monthStr];
      if (!isNaN(day) && !isNaN(year) && month !== undefined) {
        return new Date(year, month, day);
      }
    }
    return null;
  };

  // Compile billing and timeline metrics
  const rollingData = useMemo(() => {
    if (data.length === 0) return [];

    // Parse dates and extract properties
    const recordsWithDates = data
      .map(r => ({
        record: r,
        parsedDate: parseRecordDate(r.date)
      }))
      .filter((item): item is { record: SalesRecord; parsedDate: Date } => item.parsedDate !== null)
      .sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime());

    if (recordsWithDates.length === 0) return [];

    // Find chronological span
    const minDate = recordsWithDates[0].parsedDate;
    const maxDate = recordsWithDates[recordsWithDates.length - 1].parsedDate;

    const startYear = minDate.getFullYear();
    const startMonth = minDate.getMonth();
    const endYear = maxDate.getFullYear();
    const endMonth = maxDate.getMonth();

    // Create a contiguous month sequence to prevent gaps on the timeline
    const monthsTimeline: { year: number; month: number; key: string }[] = [];
    let curYear = startYear;
    let curMonth = startMonth;

    while (curYear < endYear || (curYear === endYear && curMonth <= endMonth)) {
      const key = `${curYear}-${String(curMonth + 1).padStart(2, '0')}`;
      monthsTimeline.push({ year: curYear, month: curMonth, key });
      curMonth++;
      if (curMonth > 11) {
        curMonth = 0;
        curYear++;
      }
    }

    // Hash totals per key
    const totalsByMonth: Record<string, { total: number; weighted: number; actual: number }> = {};
    monthsTimeline.forEach(({ key }) => {
      totalsByMonth[key] = { total: 0, weighted: 0, actual: 0 };
    });

    recordsWithDates.forEach(({ record, parsedDate }) => {
      const year = parsedDate.getFullYear();
      const month = parsedDate.getMonth();
      const key = `${year}-${String(month + 1).padStart(2, '0')}`;
      
      if (totalsByMonth[key]) {
        totalsByMonth[key].total += record.amountK;
        totalsByMonth[key].weighted += record.amountK * record.winRate;
        // Check if won / closed (won indicates 100% win rate)
        if (record.winRate >= 0.99) {
          totalsByMonth[key].actual += record.amountK;
        }
      }
    });

    const monthNamesEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthNamesZh = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];

    // Map into metrics
    const monthlyMetricsMap = monthsTimeline.map(({ year, month, key }) => {
      const label = language === 'zh' 
        ? `${monthNamesZh[month]} '${String(year).substring(2)}`
        : `${monthNamesEn[month]} '${String(year).substring(2)}`;
      
      const sums = totalsByMonth[key] || { total: 0, weighted: 0, actual: 0 };
      
      return {
        date: new Date(year, month, 15), // center in month
        monthStr: key,
        monthLabel: label,
        monthlyTotal: sums.total,
        monthlyWeighted: sums.weighted,
        monthlyActual: sums.actual,
      };
    });

    // Compute Rolling 3-Month metrics
    const results: RollingMetric[] = [];
    
    for (let i = 0; i < monthlyMetricsMap.length; i++) {
      const lookbackArr = monthlyMetricsMap.slice(Math.max(0, i - 2), i + 1);
      
      const rollingWeighted = d3.sum(lookbackArr, d => d.monthlyWeighted);
      const rollingActual = d3.sum(lookbackArr, d => d.monthlyActual);
      const rollingTotal = d3.sum(lookbackArr, d => d.monthlyTotal);

      // Closure rate: Actual won vs Total Pipeline in the same rolling window (%)
      const rollingClosureRate = rollingTotal > 0 
        ? parseFloat(((rollingActual / rollingTotal) * 100).toFixed(1))
        : 0;

      // Accuracy/Attainment: Actual won achieved vs Weighted Forecast predicted (%)
      const accuracyRate = rollingWeighted > 0
        ? parseFloat(((rollingActual / rollingWeighted) * 100).toFixed(1))
        : 0;

      results.push({
        ...monthlyMetricsMap[i],
        rollingWeighted: parseFloat(rollingWeighted.toFixed(1)),
        rollingActual: parseFloat(rollingActual.toFixed(1)),
        rollingTotal: parseFloat(rollingTotal.toFixed(1)),
        rollingClosureRate,
        accuracyRate
      });
    }

    return results;
  }, [data, language]);

  const averageClosureRate = useMemo(() => {
    if (rollingData.length === 0) return 0;
    const avg = d3.mean(rollingData, d => d.rollingClosureRate) || 0;
    return parseFloat(avg.toFixed(1));
  }, [rollingData]);

  const averageAttainment = useMemo(() => {
    if (rollingData.length === 0) return 0;
    const avg = d3.mean(rollingData, d => d.accuracyRate) || 0;
    return parseFloat(avg.toFixed(1));
  }, [rollingData]);

  // Responsive resizing observer context
  useEffect(() => {
    if (!containerRef.current) return;
    
    const observer = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width } = entries[0].contentRect;
      setDimensions(prev => ({ ...prev, width }));
    });
    
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Render SVG utilizing elegant pure d3
  useEffect(() => {
    if (!svgRef.current || rollingData.length < 2 || dimensions.width === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Thorough scrubbing

    const margin = { top: 25, right: 35, bottom: 40, left: 55 };
    const chartWidth = dimensions.width - margin.left - margin.right;
    const chartHeight = dimensions.height - margin.top - margin.bottom;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Scale mapping Setup
    const xScale = d3.scaleTime()
      .domain(d3.extent(rollingData, d => d.date) as [Date, Date])
      .range([0, chartWidth]);

    const maxVal = d3.max(rollingData, d => Math.max(d.rollingWeighted, d.rollingActual, d.monthlyTotal * 0.1)) || 100;
    const yScale = d3.scaleLinear()
      .domain([0, maxVal * 1.15]) // Padding for visual breathe
      .nice()
      .range([chartHeight, 0]);

    // horizontal gridlines (Dotted canvas grid)
    const gridTicks = yScale.ticks(5);
    g.append('g')
      .attr('class', 'grid')
      .selectAll('line')
      .data(gridTicks)
      .enter()
      .append('line')
      .attr('x1', 0)
      .attr('x2', chartWidth)
      .attr('y1', d => yScale(d))
      .attr('y2', d => yScale(d))
      .attr('stroke', '#f1f5f9')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '4,4');

    // Gradient definitions for full atmospheric overlay
    const defs = svg.append('defs');
    
    // Weighted forecast gradient
    const forecastGradient = defs.append('linearGradient')
      .attr('id', 'forecast-area-grad')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%');
    forecastGradient.append('stop')
      .attr('offset', '0%').attr('stop-color', '#6366f1').attr('stop-opacity', 0.12);
    forecastGradient.append('stop')
      .attr('offset', '100%').attr('stop-color', '#6366f1').attr('stop-opacity', 0.0);

    // Actual Closed gradient
    const actualGradient = defs.append('linearGradient')
      .attr('id', 'actual-area-grad')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%');
    actualGradient.append('stop')
      .attr('offset', '0%').attr('stop-color', '#10b981').attr('stop-opacity', 0.18);
    actualGradient.append('stop')
      .attr('offset', '100%').attr('stop-color', '#10b981').attr('stop-opacity', 0.0);

    // X Axis formatting
    const xAxisGenerator = d3.axisBottom(xScale)
      .ticks(Math.min(rollingData.length, Math.ceil(dimensions.width / 85)))
      .tickFormat((domainVal) => {
        const d = domainVal as Date;
        const index = d3.bisectLeft(rollingData.map(item => item.date), d);
        const item = rollingData[index];
        return item ? item.monthLabel : '';
      })
      .tickSize(0);

    const xAxis = g.append('g')
      .attr('transform', `translate(0, ${chartHeight})`)
      .call(xAxisGenerator);
    
    xAxis.select('.domain').attr('stroke', '#e2e8f0').attr('stroke-width', 1.5);
    xAxis.selectAll('text')
      .attr('fill', '#94a3b8')
      .attr('font-size', '9px')
      .attr('font-weight', '900')
      .attr('class', 'font-sans uppercase')
      .attr('dy', 12);

    // Y Axis formatting
    const yAxisGenerator = d3.axisLeft(yScale)
      .ticks(5)
      .tickFormat(d => `¥${d}k`)
      .tickSize(0);

    const yAxis = g.append('g')
      .call(yAxisGenerator);

    yAxis.select('.domain').remove(); // Suppress vertical line
    yAxis.selectAll('text')
      .attr('fill', '#94a3b8')
      .attr('font-size', '9px')
      .attr('font-weight', '900')
      .attr('class', 'font-mono')
      .attr('dx', -8);

    // Curve area functions
    const areaForecastGen = d3.area<RollingMetric>()
      .x(d => xScale(d.date))
      .y0(chartHeight)
      .y1(d => yScale(d.rollingWeighted))
      .curve(d3.curveMonotoneX);

    const areaActualGen = d3.area<RollingMetric>()
      .x(d => xScale(d.date))
      .y0(chartHeight)
      .y1(d => yScale(d.rollingActual))
      .curve(d3.curveMonotoneX);

    // Line paths functions
    const lineForecastGen = d3.line<RollingMetric>()
      .x(d => xScale(d.date))
      .y(d => yScale(d.rollingWeighted))
      .curve(d3.curveMonotoneX);

    const lineActualGen = d3.line<RollingMetric>()
      .x(d => xScale(d.date))
      .y(d => yScale(d.rollingActual))
      .curve(d3.curveMonotoneX);

    // Add forecast area
    g.append('path')
      .datum(rollingData)
      .attr('fill', 'url(#forecast-area-grad)')
      .attr('d', areaForecastGen);

    // Add actual area
    g.append('path')
      .datum(rollingData)
      .attr('fill', 'url(#actual-area-grad)')
      .attr('d', areaActualGen);

    // Add Forecast Line (dashed subtle guide)
    const forecastPath = g.append('path')
      .datum(rollingData)
      .attr('fill', 'none')
      .attr('stroke', '#818cf8') // lighter violet
      .attr('stroke-width', 2.5)
      .attr('stroke-dasharray', '5,3')
      .attr('d', lineForecastGen);

    // Add Actual Line (bold sharp curve)
    const actualPath = g.append('path')
      .datum(rollingData)
      .attr('fill', 'none')
      .attr('stroke', '#10b981') // emerald primary
      .attr('stroke-width', 3.5)
      .attr('stroke-linecap', 'round')
      .attr('d', lineActualGen);

    // Line drawing transitions
    const animatePath = (pathNode: d3.Selection<SVGPathElement, unknown, null, undefined>) => {
      const node = pathNode.node();
      if (!node) return;
      const totalLength = node.getTotalLength();
      pathNode
        .attr('stroke-dasharray', `${totalLength} ${totalLength}`)
        .attr('stroke-dashoffset', totalLength)
        .transition()
        .duration(1000)
        .ease(d3.easeCubicOut)
        .attr('stroke-dashoffset', 0)
        .on('end', () => {
          // Re-establish custom styling
          if (pathNode === forecastPath) {
            pathNode.attr('stroke-dasharray', '5,3');
          } else {
            pathNode.attr('stroke-dasharray', 'none');
          }
        });
    };

    animatePath(forecastPath);
    animatePath(actualPath);

    // Dynamic Tracking Scrubber Nodes
    const scrubberLine = g.append('line')
      .attr('y1', 0)
      .attr('y2', chartHeight)
      .attr('stroke', '#cbd5e1')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '3,3')
      .style('opacity', 0);

    const actualTrackingDot = g.append('circle')
      .attr('r', 6)
      .attr('fill', '#10b981')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2)
      .style('box-shadow', '0 4px 6px -1px rgb(0 0 0 / 0.1)')
      .style('opacity', 0);

    const forecastTrackingDot = g.append('circle')
      .attr('r', 5)
      .attr('fill', '#6366f1')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 1.8)
      .style('opacity', 0);

    // Mouse scrubber overlay panel
    g.append('rect')
      .attr('width', chartWidth)
      .attr('height', chartHeight)
      .attr('fill', 'transparent')
      .attr('class', 'cursor-crosshair')
      .on('mouseenter', () => {
        scrubberLine.style('opacity', 1);
        actualTrackingDot.style('opacity', 1);
        forecastTrackingDot.style('opacity', 1);
      })
      .on('mousemove', function(event) {
        const [mx] = d3.pointer(event, this);
        const mouseDate = xScale.invert(mx);
        
        // Locate closest target element chronologically
        const bisector = d3.bisector((d: RollingMetric) => d.date).center;
        const index = bisector(rollingData, mouseDate);
        const item = rollingData[index];
        
        if (item) {
          const cx = xScale(item.date);
          const cyActual = yScale(item.rollingActual);
          const cyForecast = yScale(item.rollingWeighted);
          
          scrubberLine.attr('x1', cx).attr('x2', cx);
          actualTrackingDot.attr('cx', cx).attr('cy', cyActual);
          forecastTrackingDot.attr('cx', cx).attr('cy', cyForecast);
          
          setHoveredData(item);
          // Tooltip screen layout adjustment
          setTooltipPos({
            x: cx + margin.left,
            y: Math.min(cyActual, cyForecast) + margin.top
          });
        }
      })
      .on('mouseleave', () => {
        scrubberLine.style('opacity', 0);
        actualTrackingDot.style('opacity', 0);
        forecastTrackingDot.style('opacity', 0);
        setHoveredData(null);
      });

  }, [rollingData, dimensions.width, dimensions.height]);

  // Fallback visual state if telemetry lacks historical context
  if (rollingData.length < 2) {
    return (
      <div 
        id="perf-trends-empty-card"
        className="bg-white border border-slate-200 p-8 rounded-[3rem] shadow-sm hover:shadow-md transition-all h-[360px] flex flex-col items-center justify-center text-center gap-4"
      >
        <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
          <LineChart className="w-6 h-6 animate-pulse" />
        </div>
        <div className="space-y-1 max-w-sm">
          <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider font-display">
            {t("Insufficient Timeline Span", "时间跨度不足")}
          </h4>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
            {t("Requires deals spanning at least 2 consecutive calendar months to compute a rolling 3-month comparison.", "需包含至少2个连续月度的交易数据以生成3个月滚动业绩走势。")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      id="perf-trends-dashboard-card"
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.5 }}
      className="bg-white border border-slate-200 p-6 md:p-8 rounded-[3rem] shadow-sm hover:shadow-md transition-all group relative"
    >
      {/* Card Header information panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-4 bg-emerald-500 rounded-full" />
          <div>
            <h3 className="text-[12px] font-black text-slate-900 uppercase tracking-[0.2em] font-display">
              {t("Performance & Closure Trends", "业绩达成率与销售闭环趋势")}
            </h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              {t("Rolling 3-Month Forecasted Volume Against Actual Revenue Closure", "滚动 3 个月预测量与实际合同回款对比")}
            </p>
          </div>
        </div>

        {/* Aggregate telemetry highlights */}
        <div className="flex gap-6 sm:gap-8 items-center border-l border-slate-100 pl-6 shrink-0">
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">
              {t("Avg Pipeline Win Rate", "整体管线转化率")}
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-mono font-black text-slate-900">{averageClosureRate}%</span>
              <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-normal">({t("of Pipeline", "占总管线")})</span>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">
              {t("Avg Forecast Attainment", "平均预测达成率")}
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-mono font-black text-indigo-600">{averageAttainment}%</span>
              <span className="text-[8px] font-bold text-slate-450 uppercase tracking-normal">({t("vs predicted", "相较预测")})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main interactive visualization canvas */}
      <div className="relative w-full" ref={containerRef}>
        <svg 
          ref={svgRef} 
          width="100%" 
          height={dimensions.height}
          className="overflow-visible select-none"
        />

        {/* Rich HTML-based Overlay Tooltip */}
        <AnimatePresence>
          {hoveredData && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute z-50 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200/80 shadow-[0_12px_24px_-10px_rgba(0,0,0,0.15)] flex flex-col gap-3 min-w-[200px]"
              style={{
                left: `${Math.min(dimensions.width - 220, Math.max(10, tooltipPos.x - 100))}px`,
                top: `${Math.max(0, tooltipPos.y - 120)}px`
              }}
            >
              {/* Date Title header */}
              <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-2">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest font-display">
                    {hoveredData.monthLabel}
                  </span>
                </div>
                <span className="px-1.5 py-0.5 rounded bg-zinc-50 border border-slate-100 text-[8px] font-extrabold text-slate-400 uppercase tracking-widest">
                  {t("3M Rolling", "滑动 3 月")}
                </span>
              </div>

              {/* Core metrics readout */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                    <span>{t("Pred Forecast", "加权预测量")}</span>
                  </div>
                  <span className="font-mono font-black text-slate-800">¥{hoveredData.rollingWeighted.toLocaleString()}k</span>
                </div>

                <div className="flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span>{t("Actual Closed", "实际获单回款")}</span>
                  </div>
                  <span className="font-mono font-black text-emerald-600">¥{hoveredData.rollingActual.toLocaleString()}k</span>
                </div>
              </div>

              {/* Completion indexes */}
              <div className="border-t border-slate-100 pt-2 flex flex-col gap-1.5 bg-slate-50/50 p-2 rounded-xl border border-slate-100">
                <div className="flex items-center justify-between gap-4 text-[9px] font-black uppercase text-slate-450 tracking-wider">
                  <span>{t("Forecast Realization", "预测达成率")}</span>
                  <span className={`font-mono text-[10px] ${hoveredData.accuracyRate >= 100 ? 'text-emerald-600' : 'text-indigo-600'}`}>
                    {hoveredData.accuracyRate}%
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4 text-[9px] font-black uppercase text-slate-450 tracking-wider">
                  <span>{t("Pipeline Win Rate", "实际销售转化率")}</span>
                  <span className="font-mono text-[10px] text-slate-800">
                    {hoveredData.rollingClosureRate}%
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Explanatory Legend Guide */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-100 mt-6 select-none">
        <div className="flex items-start gap-3">
          <div className="w-4 h-4 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0 mt-0.5 border border-indigo-100">
            <LineChart className="w-2.5 h-2.5 text-indigo-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-indigo-950 uppercase tracking-widest font-display">{t("Weighted Rolling forecast", "滑动预测线")}</span>
              <span className="w-2.5 h-0.5 bg-indigo-400 border border-dashed border-indigo-400 shrink-0" />
            </div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed mt-1">
              {t("Calculates sum(amount * win_rate) for the current month and its preceding 2 months.", "统计当前月份与前两个月份的总加权金额。代表根据赢率评估得出的期望销售目标。")}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-4 h-4 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-100">
            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-emerald-950 uppercase tracking-widest font-display">{t("Actual Sales Realized", "实际获单回款")}</span>
              <span className="w-3 h-1 bg-emerald-500 rounded shrink-0" />
            </div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed mt-1">
              {t("Sums up raw amount for deals successfully advanced to 100% win-rate in that 3-month cycle.", "在 3 个月周期内，累计赢率为 100% (即已签单回款) 的总销售额。")}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-4 h-4 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 mt-0.5 border border-slate-200">
            <Info className="w-2.5 h-2.5 text-slate-500" />
          </div>
          <div>
            <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest font-display">{t("Operational insight", "核心经营指标")}</span>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed mt-1">
              {t("A narrowing gap between prediction & realization indicates high forecasting validation modeling.", "预测曲线与实际达成线之间的距离越窄，表明团队对销售周期的预判和合同转化把控越精准。")}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
