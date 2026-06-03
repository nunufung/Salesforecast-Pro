import React, { useState } from 'react';
import { SalesRecord } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  CheckCircle2, 
  Brain, 
  ShieldCheck, 
  ArrowRight, 
  Loader2, 
  Activity, 
  Flame, 
  Lightbulb, 
  DollarSign 
} from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip, 
  Cell 
} from 'recharts';

interface Props {
  data: SalesRecord[];
}

interface ForecastResult {
  summary: string;
  overallConfidenceScore: number;
  overallConfidenceJustification: string;
  targetPeriod: string;
  baseForecastK: number;
  likelyForecastK: number;
  bullishForecastK: number;
  conservativeForecastK: number;
  categoryForecasts: Array<{
    categoryName: string;
    forecastedValueK: number;
    confidenceScore: number;
    criticalDriver: string;
    comparisonTrend: 'up' | 'down' | 'flat';
  }>;
  sectorForecasts: Array<{
    sectorName: string;
    forecastedValueK: number;
    confidenceScore: number;
    growthTrend: string;
  }>;
  keyTailwinds: string[];
  keyHeadwinds: string[];
  highImpactRecommendations: Array<{
    itemName: string;
    customerName: string;
    priority: string;
    actionableRecommendation: string;
    potentialImpactK: number;
  }>;
}

const SCENARIOS = [
  {
    id: 'Standard Market Baseline',
    name: 'Standard Baseline',
    description: 'Neutral pipeline conversions aligned with typical seasonal patterns.',
    icon: Activity,
    color: 'border-slate-200 text-slate-700 bg-slate-50/50'
  },
  {
    id: 'Bullish SaaS & Tech Acceleration',
    name: 'Bullish Expansion',
    description: 'High sector acceleration with software/tech win probabilities boosted (+15%).',
    icon: Flame,
    color: 'border-emerald-100 text-emerald-700 bg-emerald-50/30'
  },
  {
    id: 'Conservative Macro Pullback',
    name: 'Conservative Downside',
    description: 'Tightened global credit; 10% discount on raw pipeline closing rates.',
    icon: ShieldCheck,
    color: 'border-amber-100 text-amber-700 bg-amber-50/30'
  }
];

export default function AIForecastHub({ data }: Props) {
  const [selectedScenario, setSelectedScenario] = useState('Standard Market Baseline');
  const [forecast, setForecast] = useState<ForecastResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);

  const loadingSteps = [
    "Compiling active pipeline records and dates...",
    "Re-weighting current win rates across sectors...",
    "Applying chosen macro trend vectors...",
    "Reconciling against historical cycle averages...",
    "Orchestrating AI multi-scenario forecast..."
  ];

  const handleGenerateForecast = async () => {
    setLoading(true);
    setError(null);
    setLoadingStep(0);

    // Dynamic loading steps interval for visual aesthetic
    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => (prev < loadingSteps.length - 1 ? prev + 1 : prev));
    }, 1200);

    const maxRetries = 3;
    let delay = 1500;
    let lastErr: any = null;
    let completed = false;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch('/api/forecast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            records: data, 
            scenarioTrend: selectedScenario 
          })
        });

        if (!response.ok) {
          const errJson = await response.json().catch(() => ({}));
          throw new Error(errJson.error || `HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        setForecast(result);
        completed = true;
        break; // Success, exit retry loop
      } catch (err: any) {
        lastErr = err;
        console.warn(`Forecast generation attempt ${attempt} failed:`, err);
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 1.5;
        }
      }
    }

    if (!completed) {
      setError(lastErr?.message || 'An unexpected error occurred while forecasting');
    }
    clearInterval(stepInterval);
    setLoading(false);
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return { bg: 'bg-emerald-500', text: 'text-emerald-700', border: 'border-emerald-100', fill: '#10b981' };
    if (score >= 60) return { bg: 'bg-indigo-500', text: 'text-indigo-700', border: 'border-indigo-100', fill: '#6366f1' };
    return { bg: 'bg-amber-500', text: 'text-amber-700', border: 'border-amber-100', fill: '#f59e0b' };
  };

  return (
    <div id="ai-forecasting-hub" className="bg-slate-50 border border-slate-100 p-8 md:p-12 rounded-[3.2rem] space-y-12 shadow-[0_4px_30px_rgba(0,0,0,0.01)] transition-all">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 bg-gradient-to-tr from-indigo-600 to-violet-500 text-white rounded-2xl flex items-center justify-center shadow-md shadow-indigo-100 shrink-0">
            <Brain className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-indigo-600 text-white font-extrabold uppercase px-2.5 py-0.5 rounded-full tracking-widest">
                PREDICTIVE ENGINE
              </span>
              <span className="text-[10px] bg-slate-200 text-slate-700 font-extrabold uppercase px-2 py-0.5 rounded-full tracking-widest leading-none">
                GEMINI POWERED
              </span>
            </div>
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight font-display mt-2">
              AI Forecast Expert
            </h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
              Automated multi-period probabilistic projection modeling
            </p>
          </div>
        </div>
      </div>

      {/* Main Orchestrator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left Side Config: Scenario Selection */}
        <div className="lg:col-span-4 space-y-6">
          <div className="space-y-2">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] font-display text-slate-900">
              1. Macro Market Vector
            </h4>
            <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-widest">
              Choose a macro environmental trend to overlay onto your current active pipeline data.
            </p>
          </div>

          <div className="space-y-4">
            {SCENARIOS.map((sc) => {
              const IconComp = sc.icon;
              const isSelected = selectedScenario === sc.id;
              return (
                <button
                  key={sc.id}
                  onClick={() => setSelectedScenario(sc.id)}
                  className={`w-full text-left p-5 rounded-2xl border transition-all relative overflow-hidden flex gap-4 ${
                    isSelected 
                      ? 'bg-slate-900 border-slate-900 shadow-md transform -translate-y-[2px]' 
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                    isSelected 
                      ? 'bg-white/10 border-white/10 text-white' 
                      : 'bg-slate-50 border-slate-100 text-slate-500'
                  }`}>
                    <IconComp className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <p className={`text-xs font-black uppercase tracking-wider font-display ${
                      isSelected ? 'text-white' : 'text-slate-900'
                    }`}>
                      {sc.name}
                    </p>
                    <p className={`text-[10px] leading-relaxed font-bold ${
                      isSelected ? 'text-slate-300' : 'text-slate-400'
                    }`}>
                      {sc.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <button
            onClick={handleGenerateForecast}
            disabled={loading || data.length === 0}
            className="w-full py-4 px-6 bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 font-black text-[10px] uppercase tracking-[0.25em] rounded-2xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Synthesizing metrics...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Predictive Forecast
              </>
            )}
          </button>
          
          {data.length === 0 && (
            <p className="text-[9px] text-center font-bold text-rose-500 uppercase tracking-widest">
              * Pipeline is currently empty. Insert records first.
            </p>
          )}
        </div>

        {/* Right Side Result Output Panel */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden min-h-[350px] flex flex-col justify-center">
          
          <AnimatePresence mode="wait">
            {loading && (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center text-center space-y-6 py-12"
              >
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-slate-100 border-t-indigo-600 animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Brain className="w-5 h-5 text-indigo-500 animate-pulse" />
                  </div>
                </div>
                <div className="space-y-1.5 max-w-sm">
                  <p className="text-xs font-black uppercase tracking-widest text-indigo-600 font-display animate-pulse">
                    Orchestrating AI Forecasting Engine
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider h-5 transition-all duration-300">
                    {loadingSteps[loadingStep]}
                  </p>
                </div>
              </motion.div>
            )}

            {error && !loading && (
              <motion.div 
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center p-8 space-y-4 max-w-md mx-auto"
              >
                <div className="w-12 h-12 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-black uppercase tracking-wider text-rose-900 font-display">Synthesis Operation Failed</p>
                  <p className="text-[10px] font-bold text-rose-600 leading-relaxed uppercase tracking-wide">
                    {error}
                  </p>
                </div>
                <button 
                  onClick={handleGenerateForecast}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all"
                >
                  Retry Synthesis
                </button>
              </motion.div>
            )}

            {!loading && !error && !forecast && (
              <motion.div 
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-16 space-y-4 max-w-md mx-auto"
              >
                <div className="w-14 h-14 bg-slate-50 border border-slate-150 text-slate-400 rounded-3xl flex items-center justify-center mx-auto">
                  <Brain className="w-6 h-6" />
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-black text-slate-900 uppercase tracking-[0.15em] font-display">
                    Interactive Predictor Ready
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-widest">
                    Select your macro scenario on the left and run the model. The AI will inspect your {data.length} records, weighted win rates, and trends to build an advanced forecast report.
                  </p>
                </div>
              </motion.div>
            )}

            {forecast && !loading && !error && (
              <motion.div 
                key="forecast"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-10"
              >
                {/* Confidence & Headline */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-150 gap-6">
                  <div className="space-y-1.5 flex-1">
                    <span className="text-[9px] bg-indigo-50 border border-indigo-150 text-indigo-700 font-black uppercase px-2 py-0.5 rounded tracking-widest leading-none">
                      PERIOD: {forecast.targetPeriod}
                    </span>
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight font-display">
                      Forecast Synthesis Complete
                    </h4>
                    <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-wider">
                      {forecast.summary}
                    </p>
                  </div>
                  
                  {/* Gauge */}
                  <div className="flex items-center gap-3.5 shrink-0 self-center">
                    <div className="relative flex items-center justify-center">
                      <svg className="w-20 h-20 transform -rotate-90">
                        <circle cx="40" cy="40" r="34" className="stroke-slate-100 fill-none" strokeWidth="6" />
                        <circle 
                          cx="40" 
                          cy="40" 
                          r="34" 
                          className="stroke-indigo-600 fill-none transition-all duration-1000" 
                          strokeWidth="6"
                          strokeDasharray={2 * Math.PI * 34}
                          strokeDashoffset={2 * Math.PI * 34 * (1 - forecast.overallConfidenceScore / 100)}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-sm font-black text-slate-900 leading-none">{forecast.overallConfidenceScore}%</span>
                        <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Reliability</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Score Justification details */}
                <div className="text-[10px] font-bold text-slate-500 bg-indigo-50/40 border border-indigo-100 p-4 rounded-xl flex gap-2 items-start">
                  <Lightbulb className="w-4.5 h-4.5 text-indigo-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-extrabold text-indigo-900 uppercase tracking-wider">Reliability Justification</p>
                    <p className="leading-relaxed">{forecast.overallConfidenceJustification}</p>
                  </div>
                </div>

                {/* Scenario Metric Cards grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-center space-y-1.5 shadow-sm">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest block font-display">Weighted Pipe</p>
                    <p className="text-sm font-black text-slate-900 font-display">RMB {formatCurrency(forecast.baseForecastK)}k</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Raw Expectations</p>
                  </div>

                  <div className="p-4 bg-amber-50/50 border border-amber-100 text-amber-900 rounded-2xl text-center space-y-1.5 shadow-sm">
                    <p className="text-[8px] font-black text-amber-700/80 uppercase tracking-widest block font-display">Conservative</p>
                    <p className="text-sm font-black text-amber-900 font-display">RMB {formatCurrency(forecast.conservativeForecastK)}k</p>
                    <p className="text-[8px] font-extrabold text-amber-500 uppercase tracking-wider">Downside floor</p>
                  </div>

                  <div className="p-4 bg-indigo-50 border border-indigo-100 text-indigo-900 rounded-2xl text-center space-y-1.5 shadow-sm transform scale-[1.03] outline outline-2 outline-indigo-200 shadow-md">
                    <p className="text-[8px] font-black text-indigo-700 uppercase tracking-widest block font-display flex items-center justify-center gap-1">
                      <Sparkles className="w-2.5 h-2.5 text-indigo-500" /> Distinct Likely
                    </p>
                    <p className="text-md font-black text-indigo-950 font-display">RMB {formatCurrency(forecast.likelyForecastK)}k</p>
                    <p className="text-[8px] font-extrabold text-indigo-500 uppercase tracking-wider">AI Weighted Mean</p>
                  </div>

                  <div className="p-4 bg-emerald-50/50 border border-emerald-100 text-emerald-900 rounded-2xl text-center space-y-1.5 shadow-sm">
                    <p className="text-[8px] font-black text-emerald-700/80 uppercase tracking-widest block font-display">Bullish Upside</p>
                    <p className="text-sm font-black text-emerald-900 font-display">RMB {formatCurrency(forecast.bullishForecastK)}k</p>
                    <p className="text-[8px] font-extrabold text-emerald-500 uppercase tracking-wider">Perfect Closing</p>
                  </div>
                </div>

                {/* Scenario Projection Chart */}
                <div id="ai-scenario-chart" className="p-6 bg-slate-50 border border-slate-100 rounded-3xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h5 className="text-[10px] font-black uppercase tracking-[0.15em] font-display text-slate-800">
                        Visual Scenario Projections
                      </h5>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                        Variance from Downside Floor through AI Weighted Likely to Bullish Upside
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3 text-[8px] font-black uppercase tracking-widest text-slate-400">
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Conservative</span>
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-slate-500" /> Weighted Block</span>
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Likely Target</span>
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Bullish Peak</span>
                    </div>
                  </div>
                  
                  <div className="h-48 mt-4 text-xs font-sans">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={[
                          { name: 'Conservative Floor', amount: forecast.conservativeForecastK, color: '#f59e0b' },
                          { name: 'Weighted Expected', amount: forecast.baseForecastK, color: '#64748b' },
                          { name: 'Likely Realization', amount: forecast.likelyForecastK, color: '#6366f1' },
                          { name: 'Bullish Peak', amount: forecast.bullishForecastK, color: '#10b981' }
                        ]}
                        margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                      >
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false}
                          tick={{ fill: '#94a3b8', fontSize: 8, fontWeight: 700 }}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false}
                          tick={{ fill: '#94a3b8', fontSize: 8, fontWeight: 700 }}
                        />
                        <RechartsTooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const item = payload[0].payload;
                              return (
                                <div className="bg-slate-900 border border-slate-800 text-white p-3 rounded-xl shadow-lg text-[10px] font-bold uppercase tracking-wider">
                                  <p>{item.name}</p>
                                  <p className="text-indigo-400 font-black mt-1">RMB {formatCurrency(payload[0].value as number)}k</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar 
                          dataKey="amount" 
                          radius={[8, 8, 0, 0]}
                          barSize={40}
                        >
                          <Cell fill="#f59e0b" />
                          <Cell fill="#64748b" />
                          <Cell fill="#6366f1" />
                          <Cell fill="#10b981" />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Subsections: Tailwinds & Headwinds */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Tailwinds */}
                  <div className="bg-emerald-50/20 border border-emerald-100 p-5 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <h5 className="text-[9px] font-black uppercase tracking-wider text-emerald-950 font-display">Key Drivers & Tailwinds</h5>
                    </div>
                    <ul className="space-y-2 select-none">
                      {forecast.keyTailwinds.map((item, index) => (
                        <li key={index} className="flex gap-2 items-start text-[10px] text-slate-600 font-bold leading-relaxed">
                          <span className="text-emerald-500 mt-0.5">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Headwinds */}
                  <div className="bg-rose-50/20 border border-rose-100 p-5 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                      <h5 className="text-[9px] font-black uppercase tracking-wider text-rose-950 font-display">Headwinds & Risks</h5>
                    </div>
                    <ul className="space-y-2 select-none">
                      {forecast.keyHeadwinds.map((item, index) => (
                        <li key={index} className="flex gap-2 items-start text-[10px] text-slate-600 font-bold leading-relaxed">
                          <span className="text-rose-400 mt-0.5">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Category & Sector Volatility Breakdown */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.15em] font-display text-slate-900">
                    Category Breakdown
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {forecast.categoryForecasts.map((cat, i) => {
                      const colors = getConfidenceColor(cat.confidenceScore);
                      return (
                        <div key={i} className={`p-4 bg-white border ${colors.border} rounded-2xl flex justify-between items-center text-xs`}>
                          <div className="space-y-1 flex-1">
                            <span className="font-display font-black text-slate-900 uppercase tracking-wider block">
                              {cat.categoryName === 'Rev' ? 'Revenue Forecast' : cat.categoryName === 'Order' ? 'Orders Target' : cat.categoryName}
                            </span>
                            <span className="text-[10px] font-bold text-slate-500 leading-normal block">
                              Driver: {cat.criticalDriver}
                            </span>
                          </div>
                          <div className="text-right space-y-1.5 shrink-0 pl-4">
                            <span className="text-md font-black text-slate-900 flex items-center justify-end gap-1.5 font-display">
                              RMB {formatCurrency(cat.forecastedValueK)}k
                              {cat.comparisonTrend === 'up' && (
                                <span className="inline-flex items-center gap-0.5 text-xs text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100" title="Increased vs Previous Quarter">
                                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500 stroke-[3]" />
                                  <span className="text-[8px] font-extrabold uppercase tracking-widest">QoQ</span>
                                </span>
                              )}
                              {cat.comparisonTrend === 'down' && (
                                <span className="inline-flex items-center gap-0.5 text-xs text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-md border border-rose-100" title="Decreased vs Previous Quarter">
                                  <TrendingDown className="w-3.5 h-3.5 text-rose-500 stroke-[3]" />
                                  <span className="text-[8px] font-extrabold uppercase tracking-widest">QoQ</span>
                                </span>
                              )}
                              {(cat.comparisonTrend === 'flat' || !cat.comparisonTrend) && (
                                <span className="inline-flex items-center gap-0.5 text-xs text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded-md border border-slate-100" title="Flat vs Previous Quarter">
                                  <span className="text-[12px] font-black leading-none text-slate-400">→</span>
                                  <span className="text-[8px] font-extrabold uppercase tracking-widest">QoQ</span>
                                </span>
                              )}
                            </span>
                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${colors.bg} text-white`}>
                              {cat.confidenceScore}% Confidence
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Sector Performance Grid */}
                <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl space-y-3">
                  <h5 className="text-[9px] font-black uppercase tracking-wider text-slate-900 font-display">Sector Reliability Metrics</h5>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="py-2 text-[8px] font-black text-slate-400 uppercase tracking-widest">Sector Name</th>
                          <th className="py-2 text-[8px] font-black text-slate-400 uppercase tracking-widest text-right">Forecast (RMB)</th>
                          <th className="py-2 text-[8px] font-black text-slate-400 uppercase tracking-widest text-center">Stability Check</th>
                          <th className="py-2 text-[8px] font-black text-slate-400 uppercase tracking-widest text-right">Momentum Tag</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {forecast.sectorForecasts.slice(0, 6).map((sect, i) => {
                          const colors = getConfidenceColor(sect.confidenceScore);
                          return (
                            <tr key={i} className="hover:bg-slate-100/50">
                              <td className="py-3 text-[10px] font-black text-slate-900 uppercase tracking-wider">{sect.sectorName}</td>
                              <td className="py-3 text-[10px] font-bold text-slate-600 text-right">RMB {formatCurrency(sect.forecastedValueK)}k</td>
                              <td className="py-3 text-center">
                                <span className={`inline-block py-0.5 px-2 rounded-[4px] text-[8px] font-black text-white ${colors.bg}`}>
                                  {sect.confidenceScore}% Volatility Protection
                                </span>
                              </td>
                              <td className="py-3 text-right">
                                <span className={`text-[8px] font-semibold uppercase ${
                                  sect.growthTrend.toLowerCase().includes('rise') || sect.growthTrend.toLowerCase().includes('accel') 
                                    ? 'text-emerald-700 font-black' 
                                    : sect.growthTrend.toLowerCase().includes('decel') || sect.growthTrend.toLowerCase().includes('fall')
                                      ? 'text-rose-600 font-black'
                                      : 'text-slate-500 font-bold'
                                }`}>
                                  {sect.growthTrend}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Strategic Interventions Recommendations */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                    <h4 className="text-[10px] font-black uppercase tracking-[0.15em] font-display text-slate-900">
                      Top Strategic Interventions for Forecast Realization
                    </h4>
                  </div>
                  
                  <div className="space-y-3">
                    {forecast.highImpactRecommendations.slice(0, 3).map((rec, i) => (
                      <div key={i} className="p-5 border border-slate-150 rounded-2xl bg-white hover:border-indigo-150 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-display font-black text-slate-900 truncate block">
                              {rec.itemName}
                            </span>
                            <span className="text-[8px] text-slate-300">|</span>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                              {rec.customerName}
                            </span>
                            {rec.priority === 'High' && (
                              <span className="px-2 py-0.5 bg-rose-50 border border-rose-100 text-rose-600 font-black text-[7px] uppercase rounded tracking-wider leading-none">
                                HIGH IMPACT
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] font-medium text-slate-500 leading-normal">
                            💼 {rec.actionableRecommendation}
                          </p>
                        </div>
                        <div className="text-right shrink-0 pl-0 md:pl-4">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Potential Lift</span>
                          <span className="text-xs font-black text-indigo-600 font-display">
                            +RMB {formatCurrency(rec.potentialImpactK)}k
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </motion.div>
            )}
          </AnimatePresence>

        </div>

      </div>

    </div>
  );
}
