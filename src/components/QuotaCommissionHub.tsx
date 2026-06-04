import React, { useState, useMemo } from 'react';
import { useSales } from '../context/SalesContext';
import { SalesRecord } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Target, 
  Users, 
  Percent, 
  TrendingUp, 
  CheckCircle2, 
  Sliders, 
  ShieldAlert, 
  UserCheck, 
  Sparkles, 
  Award, 
  ChevronRight, 
  Plus, 
  RefreshCw,
  Search,
  Zap,
  Building2,
  DollarSign
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';

interface Props {
  data: SalesRecord[];
  selectedCategories?: string[];
  selectedSectors?: string[];
  selectedStatuses?: string[];
  searchTerm?: string;
  selectedFYs?: string[];
}

interface SalesRepPerformance {
  name: string;
  quota: number;
  totalPipeline: number;
  closedWon: number;
  attainmentRate: number;
  coverageRatio: number;
  commission: number;
  targetAccounts: number;
  wonAccounts: number;
  totalAccounts: number;
  accountAttainment: number;
  roleTag: string;
  descriptionCh: string;
  descriptionEn: string;
}

export default function QuotaCommissionHub({ 
  data,
  selectedCategories = [],
  selectedSectors = [],
  selectedStatuses = [],
  searchTerm = '',
  selectedFYs = []
}: Props) {
  const { t, updateRecord, language } = useSales();
  
  // Active focused FY selected filter (from FY24 to FY30)
  const [selectedFY, setSelectedFY] = useState<string>(() => {
    const saved = localStorage.getItem('quota_selected_fy');
    return saved || 'FY26'; // Default to FY26 (current default year)
  });

  // Sync selectedFY with dashboard's selectedFYs
  React.useEffect(() => {
    if (selectedFYs && selectedFYs.length === 1) {
      setSelectedFY(selectedFYs[0]);
    }
  }, [selectedFYs]);

  // Nested structure of quotas by fiscal year
  const [quotasByFY, setQuotasByFY] = useState<Record<string, Record<string, number>>>(() => {
    const defaultQuotas: Record<string, Record<string, number>> = {
      'FY24': { 'Julian': 20000, 'Joey': 35000, 'Elisa': 35000, 'Jackie': 5000 },
      'FY25': { 'Julian': 23000, 'Joey': 41000, 'Elisa': 41000, 'Jackie': 5000 },
      'FY26': { 'Julian': 25000, 'Joey': 45000, 'Elisa': 45000, 'Jackie': 5000 }, // Default 75000k total (Joey & Elisa share 45000k once)
      'FY27': { 'Julian': 27000, 'Joey': 49000, 'Elisa': 49000, 'Jackie': 5000 },
      'FY28': { 'Julian': 29000, 'Joey': 53000, 'Elisa': 53000, 'Jackie': 5000 },
      'FY29': { 'Julian': 31000, 'Joey': 57000, 'Elisa': 57000, 'Jackie': 5000 },
      'FY30': { 'Julian': 33000, 'Joey': 61000, 'Elisa': 61000, 'Jackie': 5000 },
    };

    const saved = localStorage.getItem('sales_quotas_by_fy_allocations');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Record<string, Record<string, number>>;
        // If the loaded structure is using old small scales (e.g., total sum < 15,000k), old Jackie high quotas, or un-reconsidered Joey/Elisa half-quotas, migrate it
        let needsMigration = false;
        Object.keys(parsed).forEach(fy => {
          const sum = Object.values(parsed[fy] || {}).reduce((a: number, b: number) => a + b, 0);
          if (sum < 15000) {
            needsMigration = true;
          }
          if (parsed[fy] && parsed[fy]['Jackie'] && parsed[fy]['Jackie'] > 5000 && 
              (parsed[fy]['Jackie'] === 10000 || parsed[fy]['Jackie'] === 12000 || parsed[fy]['Jackie'] === 13000 || parsed[fy]['Jackie'] === 14000 || parsed[fy]['Jackie'] === 15000 || parsed[fy]['Jackie'] === 16000 || parsed[fy]['Jackie'] === 17000)) {
            needsMigration = true;
          }
          // If Joey/Elisa has the old 22,500k target on FY26 (meaning they were split), we migrate it to the correct 45,000k single-counted shared target
          if (parsed[fy] && parsed[fy]['Joey'] && parsed[fy]['Joey'] < 30000 && fy === 'FY26') {
            needsMigration = true;
          }
        });
        if (needsMigration) {
          const migrated = { ...defaultQuotas };
          localStorage.setItem('sales_quotas_by_fy_allocations', JSON.stringify(migrated));
          return migrated;
        }
        return parsed;
      } catch (e) {
        // ignore
      }
    }
    return defaultQuotas;
  });

  const quotas = useMemo(() => {
    return quotasByFY[selectedFY] || {
      'Julian': 25000,
      'Joey': 45000,
      'Elisa': 45000,
      'Jackie': 5000
    };
  }, [quotasByFY, selectedFY]);

  // Nested structure of account count quotas by fiscal year (all sales quota measure by account)
  const [accountQuotasByFY, setAccountQuotasByFY] = useState<Record<string, Record<string, number>>>(() => {
    const saved = localStorage.getItem('sales_account_quotas_by_fy_allocations');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    // Standard account quotas mapping by Fiscal Year
    return {
      'FY24': { 'Julian': 3, 'Joey': 3, 'Elisa': 3, 'Jackie': 2 },
      'FY25': { 'Julian': 4, 'Joey': 4, 'Elisa': 4, 'Jackie': 3 },
      'FY26': { 'Julian': 5, 'Joey': 4, 'Elisa': 4, 'Jackie': 4 }, // Standard baseline FY26 Target Accounts
      'FY27': { 'Julian': 5, 'Joey': 5, 'Elisa': 5, 'Jackie': 4 },
      'FY28': { 'Julian': 6, 'Joey': 5, 'Elisa': 5, 'Jackie': 4 },
      'FY29': { 'Julian': 6, 'Joey': 6, 'Elisa': 6, 'Jackie': 5 },
      'FY30': { 'Julian': 7, 'Joey': 6, 'Elisa': 6, 'Jackie': 5 },
    };
  });

  const accountQuotas = useMemo(() => {
    return accountQuotasByFY[selectedFY] || {
      'Julian': 5,
      'Joey': 4,
      'Elisa': 4,
      'Jackie': 4
    };
  }, [accountQuotasByFY, selectedFY]);

  const handleAccountQuotaChange = (rep: string, newVal: number) => {
    setAccountQuotasByFY(prev => {
      const activeAccountQuotas = { ...(prev[selectedFY] || { 'Julian': 5, 'Joey': 4, 'Elisa': 4, 'Jackie': 4 }) };
      activeAccountQuotas[rep] = newVal;
      
      // Keep Joey & Elisa linked if the matching formula checkbox is enabled
      if (linkJoeyElisa) {
        if (rep === 'Joey') {
          activeAccountQuotas['Elisa'] = newVal;
        } else if (rep === 'Elisa') {
          activeAccountQuotas['Joey'] = newVal;
        }
      }

      const updated = {
        ...prev,
        [selectedFY]: activeAccountQuotas
      };
      localStorage.setItem('sales_account_quotas_by_fy_allocations', JSON.stringify(updated));
      return updated;
    });
  };

  const [commissionRates, setCommissionRates] = useState({
    baseRate: 2.0,      // 2% base commission rate
    accelerator: 4.0,   // 4% for over-attainment
    newBrandBonus: 1.5, // 1.5% premium for driving new client domains
  });

  // Track state of search/toggle/active tabs in the hub
  const [activeTab, setActiveTab] = useState<'quotas' | 'allocator' | 'commissions'>('quotas');
  const [allocationSuccessMsg, setAllocationSuccessMsg] = useState<string | null>(null);

  const [linkJoeyElisa, setLinkJoeyElisa] = useState<boolean>(() => {
    const saved = localStorage.getItem('link_joey_elisa_quota');
    return saved !== 'false'; // defaults to true
  });

  const handleLinkJoeyElisaToggle = (checked: boolean) => {
    setLinkJoeyElisa(checked);
    localStorage.setItem('link_joey_elisa_quota', String(checked));
    
    // Auto-normalize active year if enabled
    if (checked) {
      setQuotasByFY(prev => {
        const activeQuotas = { ...(prev[selectedFY] || { 'Julian': 25000, 'Joey': 45000, 'Elisa': 45000, 'Jackie': 5000 }) };
        activeQuotas['Elisa'] = activeQuotas['Joey'];
        const updated = { ...prev, [selectedFY]: activeQuotas };
        localStorage.setItem('sales_quotas_by_fy_allocations', JSON.stringify(updated));
        return updated;
      });
    }
  };

  // Sync quota updates with local storage
  const handleQuotaChange = (rep: string, newVal: number) => {
    setQuotasByFY(prev => {
      const activeQuotas = { ...(prev[selectedFY] || { 'Julian': 25000, 'Joey': 45000, 'Elisa': 45000, 'Jackie': 5000 }) };
      activeQuotas[rep] = newVal;
      
      // Joey and Elisa are locked to have the SAME quota if linkJoeyElisa is enabled
      if (linkJoeyElisa) {
        if (rep === 'Joey') {
          activeQuotas['Elisa'] = newVal;
        } else if (rep === 'Elisa') {
          activeQuotas['Joey'] = newVal;
        }
      }
      
      const updated = {
        ...prev,
        [selectedFY]: activeQuotas
      };
      localStorage.setItem('sales_quotas_by_fy_allocations', JSON.stringify(updated));
      return updated;
    });
  };

  // Helper: auto-balance quotas to meet target for active year
  const handleResetToStandardAdminPlan = () => {
    const standards: Record<string, Record<string, number>> = {
      'FY24': { 'Julian': 20000, 'Joey': 35000, 'Elisa': 35000, 'Jackie': 5000 },
      'FY25': { 'Julian': 23000, 'Joey': 41000, 'Elisa': 41000, 'Jackie': 5000 },
      'FY26': { 'Julian': 25000, 'Joey': 45000, 'Elisa': 45000, 'Jackie': 5000 },
      'FY27': { 'Julian': 27000, 'Joey': 49000, 'Elisa': 49000, 'Jackie': 5000 },
      'FY28': { 'Julian': 29000, 'Joey': 53000, 'Elisa': 53000, 'Jackie': 5000 },
      'FY29': { 'Julian': 31000, 'Joey': 57000, 'Elisa': 57000, 'Jackie': 5000 },
      'FY30': { 'Julian': 33000, 'Joey': 61000, 'Elisa': 61000, 'Jackie': 5000 },
    };
    
    const standard = standards[selectedFY] || {
      'Julian': 25000,
      'Joey': 45000,
      'Elisa': 45000,
      'Jackie': 5000
    };

    const standardsAccounts: Record<string, Record<string, number>> = {
      'FY24': { 'Julian': 3, 'Joey': 3, 'Elisa': 3, 'Jackie': 2 },
      'FY25': { 'Julian': 4, 'Joey': 4, 'Elisa': 4, 'Jackie': 3 },
      'FY26': { 'Julian': 5, 'Joey': 4, 'Elisa': 4, 'Jackie': 4 },
      'FY27': { 'Julian': 5, 'Joey': 5, 'Elisa': 5, 'Jackie': 4 },
      'FY28': { 'Julian': 6, 'Joey': 5, 'Elisa': 5, 'Jackie': 4 },
      'FY29': { 'Julian': 6, 'Joey': 6, 'Elisa': 6, 'Jackie': 5 },
      'FY30': { 'Julian': 7, 'Joey': 6, 'Elisa': 6, 'Jackie': 5 },
    };

    const standardAccts = standardsAccounts[selectedFY] || {
      'Julian': 5,
      'Joey': 4,
      'Elisa': 4,
      'Jackie': 4
    };
    
    setQuotasByFY(prev => {
      const updated = {
        ...prev,
        [selectedFY]: standard
      };
      localStorage.setItem('sales_quotas_by_fy_allocations', JSON.stringify(updated));
      return updated;
    });

    setAccountQuotasByFY(prev => {
      const updated = {
        ...prev,
        [selectedFY]: standardAccts
      };
      localStorage.setItem('sales_account_quotas_by_fy_allocations', JSON.stringify(updated));
      return updated;
    });
    
    const targetScale = Object.keys(standard).reduce((sum, key) => {
      if (key === 'Elisa' && (standard['Joey'] !== undefined)) {
        return sum; // Shared, don't double count
      }
      return sum + standard[key];
    }, 0);
    setAllocationSuccessMsg(
      t(
        `Reverted ${selectedFY} both financial & account targets to standards successfully (Total Target: ${targetScale.toLocaleString()}k).`, 
        `已成功将 ${selectedFY} 财年的资金配额（总额 ${targetScale.toLocaleString()}k）与目标客户数指标一并还原至标准指引。`
      )
    );
    setTimeout(() => setAllocationSuccessMsg(null), 4500);
  };

  const handleFYChange = (fy: string) => {
    setSelectedFY(fy);
    localStorage.setItem('quota_selected_fy', fy);
  };

  // State to manage calculated target eligibility for the Scoreboard based on multiple combination selection
  const [scoreboardQuarters, setScoreboardQuarters] = useState<string[]>(['Q1', 'Q2', 'Q3', 'Q4']);
  const [scoreboardWinRates, setScoreboardWinRates] = useState<string[]>(['won_100', 'high_75_99']);
  const [scoreboardWeighted, setScoreboardWeighted] = useState<boolean>(false);

  // Calculate stats based on live context database records
  const performances = useMemo(() => {
    const reps = ['Julian', 'Joey', 'Elisa', 'Jackie'];
    
    return reps.map(name => {
      // Determine target calendar year based on selected fiscal year (e.g. "FY26" -> 2026)
      const targetYearStr = selectedFY.replace(/\D/g, '');
      const targetYearNum = parseInt(targetYearStr, 10);
      const fullTargetYear = targetYearNum >= 100 ? targetYearNum : 2000 + targetYearNum;

      // Filter transactions matching the sales representative's name AND selected Calendar Year (Jan - Dec)
      // Handles individual or collaborative/split deals (e.g. Joey & Jackie)
      const repDeals = data.filter(r => {
        const dateStr = r.date || '';
        const yearMatch = dateStr.match(/\b(20\d{2})\b/);
        const recordYear = yearMatch ? parseInt(yearMatch[1], 10) : null;
        
        if (recordYear) {
          if (recordYear !== fullTargetYear) return false;
        } else {
          if (!r.fy || r.fy.toUpperCase() !== selectedFY.toUpperCase()) return false;
        }

        if (!r.salesPerson) return false;
        const parts = r.salesPerson.split(/[,;&]|\band\b|\//gi).map(p => p.trim());
        if (!parts.includes(name)) return false;

        // Apply global categories filter
        if (selectedCategories && selectedCategories.length > 0) {
          if (!selectedCategories.includes(r.category)) return false;
        }

        // Apply global sectors filter
        if (selectedSectors && selectedSectors.length > 0) {
          if (!selectedSectors.includes(r.sector)) return false;
        }

        // Apply global statuses filter
        if (selectedStatuses && selectedStatuses.length > 0) {
          if (!selectedStatuses.includes(r.status)) return false;
        }

        // Apply global search query filter
        if (searchTerm) {
          const query = searchTerm.toLowerCase().trim();
          const matchesSearch = 
            r.itemName?.toLowerCase().includes(query) ||
            r.customerName?.toLowerCase().includes(query) ||
            r.sector?.toLowerCase().includes(query) ||
            r.salesPerson?.toLowerCase().includes(query) ||
            r.partners?.toLowerCase().includes(query);
          if (!matchesSearch) return false;
        }

        return true;
      });

      const totalPipeline = repDeals.reduce((sum, r) => sum + r.amountK, 0);
      
      // Closed Won deals are defined by 100% win rate or Won status
      const closedWonDeals = repDeals.filter(r => r.winRate >= 0.99 || r.status === 'Won');
      const closedWon = closedWonDeals.reduce((sum, r) => sum + r.amountK, 0);

      const quota = quotas[name] || 15000;
      const attainmentRate = quota > 0 ? parseFloat(((closedWon / quota) * 100).toFixed(1)) : 0;
      const coverageRatio = quota > 0 ? parseFloat(((totalPipeline / quota)).toFixed(2)) : 0;

      // Unique key account metric calculations ("all sales quota measure by account")
      const targetAccounts = accountQuotas[name] || 4;
      const wonAccountsSet = new Set(closedWonDeals.map(r => r.customerName?.trim()).filter(Boolean));
      const wonAccounts = wonAccountsSet.size;
      const totalAccountsSet = new Set(repDeals.map(r => r.customerName?.trim()).filter(Boolean));
      const totalAccounts = totalAccountsSet.size;
      const accountAttainment = targetAccounts > 0 ? parseFloat(((wonAccounts / targetAccounts) * 100).toFixed(1)) : 0;

      // Role tag metadata based on user description factors:
      let roleTag = "";
      let descriptionEn = "";
      let descriptionCh = "";

      if (name === 'Julian') {
        roleTag = "Key Accounts & Core Active";
        descriptionEn = "Responsible for handling current stable install-base accounts to ensure recurring revenue safety.";
        descriptionCh = "骨干主力，守候长期存量/已装机高额大客户，坚实稳健确保核心安全。";
      } else if (name === 'Joey') {
        roleTag = "Co-Quota Leader";
        descriptionEn = "Shares a joint family-quota goal. Acts as the senior mentor for Elisa who just joined the team.";
        descriptionCh = "联合指标线元老，与新晋成员 Elisa 等额对敲锁定，帮助新人融入联合盘子。";
      } else if (name === 'Elisa') {
        roleTag = "Co-Quota New Joiner";
        descriptionEn = "Elisa just joined the team; shares cooperative team quota with Joey to drive shared account growth.";
        descriptionCh = "新加入团队，与 Joey 在对等配额及等额绑定机制下共担共享相同的激励包。";
      } else if (name === 'Jackie') {
        roleTag = "New Star: Channels & New Logos";
        descriptionEn = "New representative developing channel proxies & brand new accounts; boosted by existing deal handovers.";
        descriptionCh = "新晋销售，受赐既有装机项目作为垫脚石，主攻分销渠道拓展及全新增量市场。";
      }

      // Commission Expert Formulation:
      // - If closedWon <= quota: closedWon * baseRate%
      // - If closedWon > quota: (quota * baseRate%) + ((closedWon - quota) * accelerator%)
      let commission = 0;
      const baseR = commissionRates.baseRate / 100;
      const accelR = commissionRates.accelerator / 100;
      
      if (closedWon <= quota) {
        commission = closedWon * baseR;
      } else {
        commission = (quota * baseR) + ((closedWon - quota) * accelR);
      }

      // Add New Accounts premium bonus: (Deals containing "new" or involving channel sectors get bonus)
      const premiumDeals = repDeals.filter(r => {
        const isClosed = r.winRate >= 0.99 || r.status === 'Won';
        const isNewAccount = r.itemName.toLowerCase().includes('new') || 
                            r.customerName.toLowerCase().includes('tech') || 
                            r.sector.toLowerCase().includes('edu') ||
                            r.itemName.toLowerCase().includes('phase 3') ||
                            r.itemName.toLowerCase().includes('popular') ||
                            r.itemName.toLowerCase().includes('channel') ||
                            r.itemName.toLowerCase().includes('partner');
        return isClosed && isNewAccount;
      });
      const premiumAmt = premiumDeals.reduce((sum, r) => sum + r.amountK, 0);
      commission += premiumAmt * (commissionRates.newBrandBonus / 100);

      return {
        name,
        quota,
        totalPipeline: parseFloat(totalPipeline.toFixed(1)),
        closedWon: parseFloat(closedWon.toFixed(1)),
        attainmentRate,
        coverageRatio,
        commission: parseFloat(commission.toFixed(1)),
        targetAccounts,
        wonAccounts,
        totalAccounts,
        accountAttainment,
        roleTag,
        descriptionEn,
        descriptionCh
      };
    });
  }, [data, quotas, accountQuotas, commissionRates, selectedFY, linkJoeyElisa, selectedCategories, selectedSectors, selectedStatuses, searchTerm]);

  // Scoreboard lock values are dynamically aligned with quota planners
  const scoreboardPerformances = useMemo(() => {
    const reps = ['Julian', 'Joey', 'Elisa', 'Jackie'];
    const targetYearStr = selectedFY.replace(/\D/g, '');
    const targetYearNum = parseInt(targetYearStr, 10);
    const fullTargetYear = targetYearNum >= 100 ? targetYearNum : 2000 + targetYearNum;
    const targetFY = selectedFY;

    const getQuarterFromRecord = (r: SalesRecord): string => {
      if (r.fyQtr) {
        const qStr = r.fyQtr.trim().toUpperCase();
        if (qStr.includes('Q1') || qStr === '1') return 'Q1';
        if (qStr.includes('Q2') || qStr === '2') return 'Q2';
        if (qStr.includes('Q3') || qStr === '3') return 'Q3';
        if (qStr.includes('Q4') || qStr === '4') return 'Q4';
      }
      if (r.date) {
        const dateStr = r.date.trim();
        const isoMatch = dateStr.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
        if (isoMatch) {
          const month = parseInt(isoMatch[2], 10);
          if (month >= 1 && month <= 3) return 'Q1';
          if (month >= 4 && month <= 6) return 'Q2';
          if (month >= 7 && month <= 9) return 'Q3';
          if (month >= 10 && month <= 12) return 'Q4';
        }
        
        const usMatch = dateStr.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
        if (usMatch) {
          const month = parseInt(usMatch[1], 10);
          if (month >= 1 && month <= 3) return 'Q1';
          if (month >= 4 && month <= 6) return 'Q2';
          if (month >= 7 && month <= 9) return 'Q3';
          if (month >= 10 && month <= 12) return 'Q4';
        }

        try {
          const d = new Date(dateStr);
          if (!isNaN(d.getTime())) {
            const m = d.getMonth() + 1;
            if (m >= 1 && m <= 3) return 'Q1';
            if (m >= 4 && m <= 6) return 'Q2';
            if (m >= 7 && m <= 9) return 'Q3';
            if (m >= 10 && m <= 12) return 'Q4';
          }
        } catch (_) {}
      }
      return 'Q1';
    };

    return reps.map(name => {
      // Filter transactions matching the sales representative's name AND selected Calendar Year (Jan - Dec)
      const repDeals = data.filter(r => {
        const dateStr = r.date || '';
        const yearMatch = dateStr.match(/\b(20\d{2})\b/);
        const recordYear = yearMatch ? parseInt(yearMatch[1], 10) : null;
        
        if (recordYear) {
          if (recordYear !== fullTargetYear) return false;
        } else {
          if (!r.fy || r.fy.toUpperCase() !== targetFY.toUpperCase()) return false;
        }

        // Apply dynamic multiple quarter select filter
        const rQtr = getQuarterFromRecord(r);
        if (!scoreboardQuarters.includes(rQtr)) return false;

        if (!r.salesPerson) return false;
        const parts = r.salesPerson.split(/[,;&]|\band\b|\//gi).map(p => p.trim());
        if (!parts.includes(name)) return false;

        // Apply global categories filter
        if (selectedCategories && selectedCategories.length > 0) {
          if (!selectedCategories.includes(r.category)) return false;
        }

        // Apply global sectors filter
        if (selectedSectors && selectedSectors.length > 0) {
          if (!selectedSectors.includes(r.sector)) return false;
        }

        // Apply global statuses filter
        if (selectedStatuses && selectedStatuses.length > 0) {
          if (!selectedStatuses.includes(r.status)) return false;
        }

        // Apply global search query filter
        if (searchTerm) {
          const query = searchTerm.toLowerCase().trim();
          const matchesSearch = 
            r.itemName?.toLowerCase().includes(query) ||
            r.customerName?.toLowerCase().includes(query) ||
            r.sector?.toLowerCase().includes(query) ||
            r.salesPerson?.toLowerCase().includes(query) ||
            r.partners?.toLowerCase().includes(query);
          if (!matchesSearch) return false;
        }

        return true;
      });

      const totalPipeline = repDeals.reduce((sum, r) => sum + r.amountK, 0);
      
      // Calculate Closed Won (within selected quarters)
      const closedWonDeals = repDeals.filter(r => r.winRate >= 0.99 || r.status === 'Won');
      const closedWon = closedWonDeals.reduce((sum, r) => sum + r.amountK, 0);

      // Determine dynamic evaluated attainment based on active multiple combination win rate bands selection
      const matchedDeals = repDeals.filter(r => {
        const winRate = r.winRate;
        const isWon = winRate >= 0.99 || r.status === 'Won';
        
        let subCategory = 'lost_0_24';
        if (isWon) {
          subCategory = 'won_100';
        } else if (winRate >= 0.75) {
          subCategory = 'high_75_99';
        } else if (winRate >= 0.50) {
          subCategory = 'mid_50_74';
        } else if (winRate >= 0.25) {
          subCategory = 'low_25_49';
        } else {
          subCategory = 'lost_0_24';
        }
        
        return scoreboardWinRates.includes(subCategory);
      });

      let evaluatedAttainment = 0;
      if (scoreboardWeighted) {
        evaluatedAttainment = matchedDeals.reduce((sum, r) => sum + (r.amountK * r.winRate), 0);
      } else {
        evaluatedAttainment = matchedDeals.reduce((sum, r) => sum + r.amountK, 0);
      }

      // Generate dynamic descriptive label indicating selected segments & options
      let evaluatedLabel = "";
      const selectedLabels: string[] = [];
      if (scoreboardWinRates.includes('won_100')) selectedLabels.push(language !== 'en' ? '已签约(100%)' : 'Won(100%)');
      if (scoreboardWinRates.includes('high_75_99')) selectedLabels.push(language !== 'en' ? '高区间(75-99%)' : 'High(75-99%)');
      if (scoreboardWinRates.includes('mid_50_74')) selectedLabels.push(language !== 'en' ? '中区间(50-74%)' : 'Mid(50-74%)');
      if (scoreboardWinRates.includes('low_25_49')) selectedLabels.push(language !== 'en' ? '低区间(25-49%)' : 'Low(25-49%)');
      if (scoreboardWinRates.includes('lost_0_24')) selectedLabels.push(language !== 'en' ? '丢单/风险(0-24%)' : 'Lost/Risk(0-24%)');
      
      const criteriaStr = selectedLabels.join(' + ');
      evaluatedLabel = scoreboardWeighted 
        ? `${criteriaStr || 'None'} (${language !== 'en' ? '以赢率折算' : 'Weighted Forecast'})`
        : criteriaStr || (language !== 'en' ? '未选业绩口径' : 'No Segment Selected');

      // Automatically adjust target quota and account quotas dynamically based on count of selected quarters (e.g., 2 quarters = 50% target)
      let baseQuota = quotas[name] || 15000;
      let targetAccounts = accountQuotas[name] || 4;
      
      const quartersCount = scoreboardQuarters.length;
      baseQuota = parseFloat(((baseQuota / 4) * quartersCount).toFixed(1));
      targetAccounts = parseFloat(((targetAccounts / 4) * quartersCount).toFixed(1));

      const quota = baseQuota;
      const attainmentRate = quota > 0 ? parseFloat(((evaluatedAttainment / quota) * 100).toFixed(1)) : 0;
      const coverageRatio = quota > 0 ? parseFloat(((totalPipeline / quota)).toFixed(2)) : 0;

      // Status of quota to align with current win rate & attainment performance
      let quotaStatusLabelEn = "";
      let quotaStatusLabelCh = "";
      let quotaStatusColor = ""; // Tailwind classes

      if (attainmentRate >= 100) {
        quotaStatusLabelEn = "Quota Secured";
        quotaStatusLabelCh = "超额达标";
        quotaStatusColor = "bg-emerald-500/10 text-emerald-700 border-emerald-200";
      } else if (attainmentRate >= 80) {
        quotaStatusLabelEn = "Tracking Strong";
        quotaStatusLabelCh = "健康推进";
        quotaStatusColor = "bg-teal-500/10 text-teal-755 border-teal-205";
      } else if (attainmentRate >= 50) {
        quotaStatusLabelEn = "In Progress";
        quotaStatusLabelCh = "积极赶进";
        quotaStatusColor = "bg-indigo-500/10 text-indigo-750 border-indigo-205";
      } else {
        quotaStatusLabelEn = "Pipeline Risk";
        quotaStatusLabelCh = "额度告急";
        quotaStatusColor = "bg-amber-500/10 text-amber-700 border-amber-205";
      }

      const wonAccountsSet = new Set(closedWonDeals.map(r => r.customerName?.trim()).filter(Boolean));
      const wonAccounts = wonAccountsSet.size;
      const totalAccountsSet = new Set(repDeals.map(r => r.customerName?.trim()).filter(Boolean));
      const totalAccounts = totalAccountsSet.size;
      const accountAttainment = targetAccounts > 0 ? parseFloat(((wonAccounts / targetAccounts) * 100).toFixed(1)) : 0;

      let roleTag = "";
      let descriptionEn = "";
      let descriptionCh = "";

      if (name === 'Julian') {
        roleTag = "Key Accounts & Core Active";
        descriptionEn = "Responsible for handling current stable install-base accounts to ensure recurring revenue safety.";
        descriptionCh = "骨干主力，守候长期存量/已装机高额大客户，坚实稳健确保核心安全。";
      } else if (name === 'Joey') {
        roleTag = "Co-Quota Leader";
        descriptionEn = "Shares a joint family-quota goal. Acts as the senior mentor for Elisa who just joined the team.";
        descriptionCh = "联合指标线元老，与新晋成员 Elisa 等额对敲锁定，帮助新人融入联合盘子。";
      } else if (name === 'Elisa') {
        roleTag = "Co-Quota New Joiner";
        descriptionEn = "Elisa just joined the team; shares cooperative team quota with Joey to drive shared account growth.";
        descriptionCh = "新加入团队，与 Joey 在对等配额及等额绑定机制下共担共享相同的激励包。";
      } else if (name === 'Jackie') {
        roleTag = "New Star: Channels & New Logos";
        descriptionEn = "New representative developing channel proxies & brand new accounts; boosted by existing deal handovers.";
        descriptionCh = "新晋销售，受赐既有装机项目作为垫脚石，主攻分销渠道拓展及全新增量市场。";
      }

      let commission = 0;
      const baseR = commissionRates.baseRate / 100;
      const accelR = commissionRates.accelerator / 100;
      
      if (closedWon <= quota) {
        commission = closedWon * baseR;
      } else {
        commission = (quota * baseR) + ((closedWon - quota) * accelR);
      }

      const premiumDeals = repDeals.filter(r => {
        const isClosed = r.winRate >= 0.99 || r.status === 'Won';
        const isNewAccount = r.itemName.toLowerCase().includes('new') || 
                            r.customerName.toLowerCase().includes('tech') || 
                            r.sector.toLowerCase().includes('edu') ||
                            r.itemName.toLowerCase().includes('phase 3') ||
                            r.itemName.toLowerCase().includes('popular') ||
                            r.itemName.toLowerCase().includes('channel') ||
                            r.itemName.toLowerCase().includes('partner');
        return isClosed && isNewAccount;
      });
      const premiumAmt = premiumDeals.reduce((sum, r) => sum + r.amountK, 0);
      commission += premiumAmt * (commissionRates.newBrandBonus / 100);

      return {
        name,
        quota,
        totalPipeline: parseFloat(totalPipeline.toFixed(1)),
        closedWon: parseFloat(closedWon.toFixed(1)),
        evaluatedAttainment: parseFloat(evaluatedAttainment.toFixed(1)),
        evaluatedLabel,
        attainmentRate,
        quotaStatusLabelEn,
        quotaStatusLabelCh,
        quotaStatusColor,
        coverageRatio,
        commission: parseFloat(commission.toFixed(1)),
        targetAccounts,
        wonAccounts,
        totalAccounts,
        accountAttainment,
        roleTag,
        descriptionEn,
        descriptionCh
      };
    });
  }, [data, quotas, accountQuotas, commissionRates, scoreboardQuarters, scoreboardWinRates, scoreboardWeighted, selectedFY, selectedCategories, selectedSectors, selectedStatuses, searchTerm]);

  const totalAllocatedQuota = useMemo(() => {
    // Elisa and Joey share a single quota pool, so we only count one of them
    const keys = Object.keys(quotas);
    let sum = 0;
    let countedShared = false;
    keys.forEach(k => {
      if (k === 'Joey' || k === 'Elisa') {
        if (!countedShared) {
          sum += quotas[k];
          countedShared = true;
        }
      } else {
        sum += quotas[k];
      }
    });
    return sum;
  }, [quotas]);

  const totalTeamTarget = useMemo(() => {
    const targets: Record<string, number> = {
      'FY24': 60000,
      'FY25': 69000,
      'FY26': 75000, // scaled to 75000k total target
      'FY27': 81000,
      'FY28': 87000,
      'FY29': 93000,
      'FY30': 99000,
    };
    return targets[selectedFY] || 75000;
  }, [selectedFY]);

  const allocationDelta = totalAllocatedQuota - totalTeamTarget;

  // Locate resources / Install-base accounts currently belonging to others or unassigned 
  // that have over 50% win rate and are excellent baseline deals to transfer to Jackie.
  const allocatableDeals = useMemo(() => {
    const targetYearStr = selectedFY.replace(/\D/g, '');
    const targetYearNum = parseInt(targetYearStr, 10);
    const fullTargetYear = targetYearNum >= 100 ? targetYearNum : 2000 + targetYearNum;

    return data.filter(r => {
      // Must match selected calendar year basis (Jan to Dec)
      const dateStr = r.date || '';
      const yearMatch = dateStr.match(/\b(20\d{2})\b/);
      const recordYear = yearMatch ? parseInt(yearMatch[1], 10) : null;
      
      if (recordYear) {
        if (recordYear !== fullTargetYear) return false;
      } else {
        if (!r.fy || r.fy.toUpperCase() !== selectedFY.toUpperCase()) return false;
      }

      // Find high win rate (> 50%) deals
      const isHighWin = r.winRate >= 0.50 && r.winRate < 1.0;
      // Not already assigned to Jackie
      const hasJackie = r.salesPerson && r.salesPerson.toLowerCase().includes('jackie');
      
      // Install base attributes (government sectors, utility sectors, key education programs, or containing replenishment keywords)
      const isInstallBase = r.sector === 'Govt' || 
                            r.sector === 'Utilities' || 
                            r.sector === 'Education' || 
                            r.itemName.toLowerCase().includes('replenishment') ||
                            r.itemName.toLowerCase().includes('main') ||
                            r.itemName.toLowerCase().includes('phase 2') ||
                            r.itemName.toLowerCase().includes('addon');

      return isHighWin && !hasJackie && isInstallBase;
    });
  }, [data, selectedFY]);

  // Handle auto allocating baseline deals to Jackie
  const handleAutoAllocateToJackie = () => {
    let allocatedCount = 0;
    let allocatedVolume = 0;

    // Pick top high win rate install-base deals to transition to Jackie
    const targetDeals = allocatableDeals.slice(0, 6); // Take up to 6 key starter deals

    targetDeals.forEach(record => {
      const updatedRecord = {
        ...record,
        // Mark as co-owned or assigned to Jackie to let her inherit some existing customer install base relation
        salesPerson: 'Jackie',
        // Add a trace record and tag to distinguish
        itemName: `${record.itemName} (IB Transfer)`,
      };
      updateRecord(updatedRecord);
      allocatedCount++;
      allocatedVolume += record.amountK;
    });

    if (allocatedCount > 0) {
      setAllocationSuccessMsg(
        t(
          `Sales Admin Action: Successfully allocated ${allocatedCount} high probability Install-Base deals (totaling ¥${allocatedVolume}k) directly to Jackie.`,
          `销售管理部行动：成功将 ${allocatedCount} 个高概率已装机客户项目（总额 ¥${allocatedVolume}k）直接划转分配给杰基 (Jackie)。`
        )
      );
    } else {
      setAllocationSuccessMsg(
        t(
          "All appropriate install-base qualifier deals already successfully mapped to Jackie.",
          "所有适用的高预估装机客户交易均已被分配在杰基 (Jackie) 名下。"
        )
      );
    }

    setTimeout(() => {
      setAllocationSuccessMsg(null);
    }, 5000);
  };

  // Dedicated single-deal custom transfer trigger
  const handleAssignSingleDeal = (record: SalesRecord) => {
    const updated = {
      ...record,
      salesPerson: 'Jackie',
      itemName: record.itemName.includes('Transfer') ? record.itemName : `${record.itemName} (IB/Key Account Transfer)`
    };
    updateRecord(updated);
    
    setAllocationSuccessMsg(
      t(
        `Successfully transferred "${record.itemName}" (¥${record.amountK}k) to Jackie.`,
        `成功将项目「${record.itemName}」（¥${record.amountK}k）重新指派给 Jackie 负责。`
      )
    );
    setTimeout(() => setAllocationSuccessMsg(null), 4000);
  };

  // Memoized general FY deals for relocation
  const activeFYDeals = useMemo(() => {
    const targetYearStr = selectedFY.replace(/\D/g, '');
    const targetYearNum = parseInt(targetYearStr, 10);
    const fullTargetYear = targetYearNum >= 100 ? targetYearNum : 2000 + targetYearNum;

    return data.filter(r => {
      const dateStr = r.date || '';
      const yearMatch = dateStr.match(/\b(20\d{2})\b/);
      const recordYear = yearMatch ? parseInt(yearMatch[1], 10) : null;
      
      if (recordYear) {
        return recordYear === fullTargetYear;
      } else {
        return r.fy && r.fy.toUpperCase() === selectedFY.toUpperCase();
      }
    });
  }, [data, selectedFY]);

  // Universal custom relocation of any deal to any rep
  const handleAssignDealToRep = (record: SalesRecord, repName: string) => {
    const prevSalesPerson = record.salesPerson || 'Unassigned';
    const updated = {
      ...record,
      salesPerson: repName
    };
    updateRecord(updated);

    setAllocationSuccessMsg(
      t(
        `Administrative Action: Reallocated "${record.itemName}" (¥${record.amountK}k) from ${prevSalesPerson} to ${repName} successfully.`,
        `管线策略调配：已成功将「${record.itemName}」（金额 ¥${record.amountK}k）由原跟进人 ${prevSalesPerson} 划归至 ${repName} 负责。`
      )
    );
    setTimeout(() => setAllocationSuccessMsg(null), 5000);
  };

  // State search queries for the deal table in allocator
  const [dealSearchQuery, setDealSearchQuery] = useState('');

  const filteredActiveFYDeals = useMemo(() => {
    return activeFYDeals.filter(d => {
      const q = dealSearchQuery.trim().toLowerCase();
      if (!q) return true;
      return (d.itemName || '').toLowerCase().includes(q) ||
             (d.customerName || '').toLowerCase().includes(q) ||
             (d.salesPerson || '').toLowerCase().includes(q) ||
             (d.sector || '').toLowerCase().includes(q);
    });
  }, [activeFYDeals, dealSearchQuery]);

  return (
    <div 
      id="quota-commission-expert-section" 
      className="bg-white border border-slate-200/90 rounded-[3rem] p-6 md:p-8 shadow-sm hover:shadow-md transition-all select-none overflow-hidden relative"
    >
      {/* Visual background sparkles */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-44 h-44 bg-indigo-50/50 rounded-full blur-[60px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-44 h-44 bg-teal-50/50 rounded-full blur-[60px] pointer-events-none" />

      {/* Header & Section Title */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 border-b border-slate-100 pb-6 mb-8 items-start">
        <div className="lg:col-span-12 xl:col-span-7 flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100/60 flex items-center justify-center shrink-0 shadow-sm">
            <Award className="w-6 h-6 text-indigo-600 animate-pulse" />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] md:text-xs font-semibold text-slate-500 leading-relaxed max-w-3xl">
              {t("Execute organizational strategy, manage commission models, and optimize onboarding for new representatives.", "深度践行组织规划，制定灵活佣金等级，辅助新星销售快速切入核心装机客户及重点渠道客群。")}
            </p>
          </div>
        </div>

        {/* Dynamic Navigation Controls & FY Filter Group */}
        <div className="lg:col-span-12 xl:col-span-5 flex flex-col sm:flex-row items-stretch sm:items-end gap-3 justify-start xl:justify-end mt-4 xl:mt-0 shrink-0">
          {/* Dynamic Financial Year Filter */}
          <div className="flex flex-col gap-1 bg-slate-50/85 p-2 rounded-2xl border border-slate-150 shrink-0">
            <span className="text-[7px] font-black text-slate-450 uppercase tracking-widest px-1">
              {t("Select Fiscal Year Target", "选择执行财年目标")}
            </span>
            <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200/60 gap-1 flex-wrap">
              {['FY24', 'FY25', 'FY26', 'FY27', 'FY28', 'FY29', 'FY30'].map((fy) => (
                <button
                  key={fy}
                  onClick={() => handleFYChange(fy)}
                  className={cn(
                    "px-2 md:px-2.5 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all cursor-pointer",
                    selectedFY === fy 
                      ? "bg-indigo-600 text-white shadow-sm" 
                      : "text-slate-600 hover:text-slate-950 hover:bg-slate-50"
                  )}
                >
                  {fy}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Navigation Tabs */}
          <div className="flex flex-col gap-1 bg-slate-50/85 p-2 rounded-2xl border border-slate-150 shrink-0">
            <span className="text-[7px] font-black text-slate-450 uppercase tracking-widest px-1">
              {t("Module Segment Navigation", "功能板块快速切换")}
            </span>
            <div className="flex bg-white p-1 rounded-xl border border-slate-200/60 gap-1.5 flex-wrap">
              <button
                onClick={() => setActiveTab('quotas')}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer",
                  activeTab === 'quotas' 
                    ? "bg-indigo-50 text-indigo-700 shadow-none border-none" 
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                )}
              >
                <Sliders className="w-3 h-3" />
                <span>{t("Quota Planners", "指标配置器")}</span>
              </button>

              <button
                onClick={() => setActiveTab('allocator')}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer",
                  activeTab === 'allocator' 
                    ? "bg-teal-50 text-teal-700 shadow-none border-none" 
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                )}
              >
                <UserCheck className="w-3 h-3" />
                <span>{t("Jackie's Starter Vault", "杰基专享装机划转")}</span>
              </button>

              <button
                onClick={() => setActiveTab('commissions')}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer",
                  activeTab === 'commissions' 
                    ? "bg-emerald-50 text-emerald-700 shadow-none border-none" 
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                )}
              >
                <Award className="w-3 h-3" />
                <span>{t("Ledger & Commission", "结算提成明细")}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Trigger Success Toast Alert inside panel */}
      <AnimatePresence>
        {allocationSuccessMsg && (
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-start gap-3.5"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-[10px] font-black text-emerald-950 uppercase tracking-widest">
                {t("Sales Operations Success", "销售管理行为已生效")}
              </p>
              <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest mt-1 leading-relaxed">
                {allocationSuccessMsg}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Render Main Selected Section content */}
      <div className="grid grid-cols-1 gap-8">
        
        {/* TAB 1: Quota Planners Configurator */}
        {activeTab === 'quotas' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Dynamic visual warning of target compliance */}
            <div className={cn(
              "p-5 rounded-[2rem] border transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-5",
              Math.abs(allocationDelta) < 1 
                ? "bg-slate-50 border-slate-200/80" 
                : allocationDelta > 0 
                  ? "bg-amber-50/50 border-amber-100" 
                  : "bg-rose-50/50 border-rose-100"
            )}>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-slate-900 uppercase tracking-[0.15em] font-display">
                    {t("Team Quota Allocation Compliance Rule", "团队指标配额合规审计栏")}
                  </span>
                  {Math.abs(allocationDelta) < 1 ? (
                    <span className="px-2.5 py-0.5 bg-emerald-500 text-white rounded-md text-[7px] font-black uppercase tracking-widest">
                      {t("Balanced", "配额完美对齐")}
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 bg-rose-500 text-white rounded-md text-[7px] font-black uppercase tracking-widest">
                      {t("Imbalanced", "存在金额偏误")}
                    </span>
                  )}
                </div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                  {t(
                    `Firm constraint: Full year target assigned by organization must match exactly ¥${(totalTeamTarget).toLocaleString()}k.`,
                    `政策刚性红线：公司下达的全年总团队指标必须保持锁死在 ¥${(totalTeamTarget).toLocaleString()}k。`
                  )}
                </p>
              </div>

              {/* Compliance ledger numbers */}
              <div className="flex gap-6 sm:gap-10 shrink-0">
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{t("Corporate Goal", "公司目标")}</span>
                  <span className="text-lg font-mono font-black text-slate-900">¥ {totalTeamTarget.toLocaleString()} k</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{t("Sum Allocated", "当前配额总和")}</span>
                  <span className={cn(
                    "text-lg font-mono font-black",
                    Math.abs(allocationDelta) < 1 ? "text-emerald-600" : "text-amber-500"
                  )}>
                    ¥ {totalAllocatedQuota.toLocaleString()} k
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{t("Variance Delta", "指标存续差额")}</span>
                  {allocationDelta === 0 ? (
                    <span className="text-lg font-mono font-black text-emerald-600">¥ 0 k</span>
                  ) : (
                    <span className={cn("text-lg font-mono font-black", allocationDelta > 0 ? "text-amber-500" : "text-rose-500")}>
                      {allocationDelta > 0 ? `+¥ ${allocationDelta}` : `-¥ ${Math.abs(allocationDelta)}`} k
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quota slider config panel */}
            <div className="w-full">
              
              {/* SLIDERS & NUMBERS FOR REPS */}
              <div className="bg-slate-50/50 border border-slate-150 p-6 md:p-8 rounded-[2rem] space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-slate-500" />
                    <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest font-display">
                      {t("Quota Planners (Manual Edit & Sliders)", "实时业绩指标配置中心")}
                    </span>
                  </div>
                  <button
                    onClick={handleResetToStandardAdminPlan}
                    className="text-[8px] font-black text-indigo-600 hover:text-indigo-800 bg-white border border-slate-200 px-3 py-1.5 rounded-lg uppercase tracking-wider transition-all shadow-sm hover:translate-y-[-1px] cursor-pointer"
                  >
                    {t("Reset to Standard Plan", "还原标准推荐指引")}
                  </button>
                </div>

                {/* Quota linkage control */}
                <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <input 
                      type="checkbox"
                      id="link-joey-elisa-checkbox"
                      checked={linkJoeyElisa}
                      onChange={(e) => handleLinkJoeyElisaToggle(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-550 border-slate-300 cursor-pointer accent-indigo-600"
                    />
                    <label htmlFor="link-joey-elisa-checkbox" className="text-[9px] font-black text-slate-700 uppercase tracking-wider cursor-pointer">
                      {t("Bind Joey & Elisa equal quotas", "绑定 Joey 与 Elisa 等额分配惯例")}
                    </label>
                  </div>
                  <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${linkJoeyElisa ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-450'}`}>
                    {linkJoeyElisa ? t("LINKED", "联动锁定中") : t("MUTABLE", "允许差异化")}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-2">
                  {/* JULIAN PLAN */}
                  <div className="space-y-2 p-4 bg-white rounded-xl border border-slate-100">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">
                        Julian <span className="text-[8px] font-bold text-indigo-600 font-sans ml-1">({t("Installed Base Key AE", "资深老存量大客户")})</span>
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[10px] font-bold text-slate-400 font-mono">¥</span>
                        <input 
                          type="number"
                          min="0"
                          max="100000"
                          value={quotas['Julian'] || 0}
                          onChange={(e) => handleQuotaChange('Julian', parseInt(e.target.value) || 0)}
                          className="w-18 px-1.5 py-1 text-right text-xs font-mono font-black text-slate-800 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <span className="text-[10px] font-bold text-slate-400 font-mono">k</span>
                      </div>
                    </div>
                    <input 
                      type="range" 
                      min="5000" 
                      max="50000" 
                      step="500"
                      value={Math.min(50000, Math.max(5000, quotas['Julian'] || 10000))} 
                      onChange={(e) => handleQuotaChange('Julian', parseInt(e.target.value))}
                      className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <div className="flex justify-between text-[7px] text-slate-400 font-bold tracking-widest uppercase">
                      <span>MIN: 5,000k</span>
                      <span>{t("Julian: Handles current stable major accounts", "Julian负责当前主要在手活跃老客户")}</span>
                      <span>MAX: 50,000k</span>
                    </div>

                    {/* Account Count quota target for Julian */}
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider block">
                          {t("Account-count Target", "目标签约客户商户数 (Account Quota)")}
                        </span>
                        <span className="text-[7.5px] font-bold text-slate-400 uppercase tracking-widest">
                          {t("Julian Key Stable Accounts Target", "Julian 在手重点存续客户开发指标")}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-lg border border-slate-200/50">
                        <button 
                          onClick={() => handleAccountQuotaChange('Julian', Math.max(1, (accountQuotas['Julian'] || 1) - 1))}
                          className="w-5 h-5 rounded bg-white border border-slate-200/80 flex items-center justify-center text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer shadow-sm"
                        > - </button>
                        <span className="text-xs font-mono font-black text-slate-850 w-6 text-center">{accountQuotas['Julian'] || 5}</span>
                        <button 
                          onClick={() => handleAccountQuotaChange('Julian', Math.min(15, (accountQuotas['Julian'] || 1) + 1))}
                          className="w-5 h-5 rounded bg-white border border-slate-200/80 flex items-center justify-center text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer shadow-sm"
                        > + </button>
                      </div>
                    </div>
                  </div>

                  {/* JOEY PLAN */}
                  <div className="space-y-2 p-4 bg-white rounded-xl border border-slate-100 relative overflow-hidden">
                    {linkJoeyElisa && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500" />}
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">
                        Joey <span className="text-[8px] font-bold text-teal-600 font-sans ml-1">({t("Team Go-To-Market Leader", "联合团队激励主导 AE")})</span>
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[10px] font-bold text-slate-400">¥</span>
                        <input 
                          type="number"
                          min="0"
                          max="100000"
                          value={quotas['Joey'] || 0}
                          onChange={(e) => handleQuotaChange('Joey', parseInt(e.target.value) || 0)}
                          className="w-18 px-1.5 py-1 text-right text-xs font-mono font-black text-slate-800 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <span className="text-[10px] font-bold text-slate-400 font-mono">k</span>
                      </div>
                    </div>
                    <input 
                      type="range" 
                      min="5000" 
                      max="80000" 
                      step="500"
                      value={Math.min(80000, Math.max(5000, quotas['Joey'] || 10000))} 
                      onChange={(e) => handleQuotaChange('Joey', parseInt(e.target.value))}
                      className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-teal-500"
                    />
                    <div className="flex justify-between text-[7px] text-teal-650 font-bold tracking-widest uppercase">
                      <span>MIN: 5,000k</span>
                      <span>{linkJoeyElisa ? t("Linked with Elisa joint formula", "联动等额机制中 - 协同组队打单") : t("Independent setting", "已由专家拆离独立设置")}</span>
                      <span>MAX: 80,000k</span>
                    </div>

                    {/* Account Count quota target for Joey */}
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider block">
                          {t("Account-count Target", "目标签约客户商户数 (Account Quota)")}
                        </span>
                        <span className="text-[7.5px] font-bold text-slate-400 uppercase tracking-widest">
                          {t("Joey Co-Quota Accounts Weight", "Joey 与 Elisa 等额机制同步")}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-lg border border-slate-200/50">
                        <button 
                          onClick={() => handleAccountQuotaChange('Joey', Math.max(1, (accountQuotas['Joey'] || 1) - 1))}
                          className="w-5 h-5 rounded bg-white border border-slate-200/80 flex items-center justify-center text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer shadow-sm"
                        > - </button>
                        <span className="text-xs font-mono font-black text-slate-850 w-6 text-center">{accountQuotas['Joey'] || 4}</span>
                        <button 
                          onClick={() => handleAccountQuotaChange('Joey', Math.min(15, (accountQuotas['Joey'] || 1) + 1))}
                          className="w-5 h-5 rounded bg-white border border-slate-200/80 flex items-center justify-center text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer shadow-sm"
                        > + </button>
                      </div>
                    </div>
                  </div>

                  {/* ELISA PLAN */}
                  <div className="space-y-2 p-4 bg-white rounded-xl border border-slate-100 relative overflow-hidden">
                    {linkJoeyElisa && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500" />}
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-indigo-950 uppercase tracking-widest">
                        Elisa <span className="text-[8px] font-extrabold text-indigo-600 bg-indigo-50/80 px-2 py-0.5 rounded ml-1">({t("New Team Joiner", "刚加入团队成员")})</span>
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[10px] font-bold text-slate-400">¥</span>
                        <input 
                          type="number"
                          min="0"
                          max="100000"
                          value={quotas['Elisa'] || 0}
                          onChange={(e) => handleQuotaChange('Elisa', parseInt(e.target.value) || 0)}
                          className="w-18 px-1.5 py-1 text-right text-xs font-mono font-black text-slate-800 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <span className="text-[10px] font-bold text-slate-400 font-mono">k</span>
                      </div>
                    </div>
                    <input 
                      type="range" 
                      min="5000" 
                      max="80000" 
                      step="500"
                      value={Math.min(80000, Math.max(5000, quotas['Elisa'] || 10000))} 
                      onChange={(e) => handleQuotaChange('Elisa', parseInt(e.target.value))}
                      className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-teal-500"
                    />
                    <div className="flex justify-between text-[7px] text-teal-650 font-bold tracking-widest uppercase">
                      <span>MIN: 5,000k</span>
                      <span>{t("Elisa: Just joined, shares Team Quota with Joey", "Elisa刚刚入职：与主力队员 Joey 共用一套机制")}</span>
                      <span>MAX: 80,000k</span>
                    </div>

                    {/* Account Count quota target for Elisa */}
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider block">
                          {t("Account-count Target", "目标签约客户商户数 (Account Quota)")}
                        </span>
                        <span className="text-[7.5px] font-bold text-slate-450 uppercase tracking-widest">
                          {t("Elisa Team Quota Alignment Target", "新秀激励锁定，与 Joey 指标同步对齐")}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-lg border border-slate-200/50">
                        <button 
                          onClick={() => handleAccountQuotaChange('Elisa', Math.max(1, (accountQuotas['Elisa'] || 1) - 1))}
                          className="w-5 h-5 rounded bg-white border border-slate-200/80 flex items-center justify-center text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer shadow-sm lg:pointer-events-none lg:opacity-50"
                          disabled={linkJoeyElisa}
                        > - </button>
                        <span className="text-xs font-mono font-black text-slate-850 w-6 text-center">{accountQuotas['Elisa'] || 4}</span>
                        <button 
                          onClick={() => handleAccountQuotaChange('Elisa', Math.min(15, (accountQuotas['Elisa'] || 1) + 1))}
                          className="w-5 h-5 rounded bg-white border border-slate-200/80 flex items-center justify-center text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer shadow-sm lg:pointer-events-none lg:opacity-50"
                          disabled={linkJoeyElisa}
                        > + </button>
                      </div>
                    </div>
                  </div>

                  {/* JACKIE PLAN */}
                  <div className="space-y-2 p-4 bg-white rounded-xl border border-slate-100 relative border-l-2 border-l-emerald-500">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">
                        Jackie <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded ml-1">({t("Channel / New Biz AE", "新星-重点新客与渠道开发")})</span>
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[10px] font-bold text-slate-400">¥</span>
                        <input 
                          type="number"
                          min="0"
                          max="100000"
                          value={quotas['Jackie'] || 0}
                          onChange={(e) => handleQuotaChange('Jackie', parseInt(e.target.value) || 0)}
                          className="w-18 px-1.5 py-1 text-right text-xs font-mono font-black text-slate-800 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <span className="text-[10px] font-bold text-slate-400 font-mono">k</span>
                      </div>
                    </div>
                    <input 
                      type="range" 
                      min="2000" 
                      max="30000" 
                      step="500"
                      value={Math.min(30000, Math.max(2000, quotas['Jackie'] || 10000))} 
                      onChange={(e) => handleQuotaChange('Jackie', parseInt(e.target.value))}
                      className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                    <div className="flex justify-between text-[7px] text-emerald-600/80 font-bold tracking-widest uppercase">
                      <span>MIN: 2,000k</span>
                      <span>{t("Jackie: New representative; tasked to develop channels & explore new deals", "新晋业务：开拓全新合作伙伴与新成交商机并存续承接划转项目")}</span>
                      <span>MAX: 30,000k</span>
                    </div>

                    {/* Account Count quota target for Jackie */}
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider block">
                          {t("Account-count Target", "目标签约客户商户数 (Account Quota)")}
                        </span>
                        <span className="text-[7.5px] font-bold text-slate-400 uppercase tracking-widest">
                          {t("Jackie Channels & Leads Count", "Jackie 考核的纯独立核心合作账户数")}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-lg border border-slate-200/50">
                        <button 
                          onClick={() => handleAccountQuotaChange('Jackie', Math.max(1, (accountQuotas['Jackie'] || 1) - 1))}
                          className="w-5 h-5 rounded bg-white border border-slate-200/80 flex items-center justify-center text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer shadow-sm"
                        > - </button>
                        <span className="text-xs font-mono font-black text-slate-850 w-6 text-center">{accountQuotas['Jackie'] || 4}</span>
                        <button 
                          onClick={() => handleAccountQuotaChange('Jackie', Math.min(15, (accountQuotas['Jackie'] || 1) + 1))}
                          className="w-5 h-5 rounded bg-white border border-slate-200/80 flex items-center justify-center text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer shadow-sm"
                        > + </button>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

            </div>

            {/* PERFORMANCE READOUT ROW */}
            <div className="space-y-6">
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-900 uppercase tracking-[0.15em] font-display block">
                    {t(`${selectedFY} Attainment Scoreboard (Live Synchronized)`, `${selectedFY} 业绩达成公告牌 (实物流数据实时结算)`)}
                  </span>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                    {t("Interactive quota performance and status alignment based on dynamic win-rate parameters", "支持根据赢率概率特征交互式分析团队指标达标状况与预估水平")}
                  </p>
                </div>
                <div className="flex flex-col lg:flex-row lg:items-center gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100 w-full">
                  {/* QUARTER FILTER WITH MULTI-SELECT */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[8px] font-black text-slate-450 uppercase tracking-widest block mr-1">
                      {t("Quarters (Multi-Select):", "季度周期多选:")}
                    </span>
                    <div className="inline-flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                      {[
                        { key: 'Q1', labelEn: 'Q1', labelCh: 'Q1' },
                        { key: 'Q2', labelEn: 'Q2', labelCh: 'Q2' },
                        { key: 'Q3', labelEn: 'Q3', labelCh: 'Q3' },
                        { key: 'Q4', labelEn: 'Q4', labelCh: 'Q4' }
                      ].map(opt => {
                        const isActive = scoreboardQuarters.includes(opt.key);
                        return (
                          <button
                            key={opt.key}
                            onClick={() => {
                              if (isActive) {
                                setScoreboardQuarters(scoreboardQuarters.filter(q => q !== opt.key));
                              } else {
                                setScoreboardQuarters([...scoreboardQuarters, opt.key]);
                              }
                            }}
                            className={cn(
                              "px-2.5 py-1 rounded-lg text-[7.5px] font-black uppercase tracking-wider transition-all cursor-pointer",
                              isActive 
                                ? "bg-indigo-600 text-white shadow-sm font-black"
                                : "hover:bg-white text-slate-400 hover:text-slate-700"
                            )}
                          >
                            {opt.key}
                          </button>
                        );
                      })}
                    </div>
                    {/* Quarters presets */}
                    <div className="flex gap-1">
                      <button 
                        onClick={() => setScoreboardQuarters(['Q1', 'Q2', 'Q3', 'Q4'])} 
                        className="px-1.5 py-0.5 rounded text-[6.5px] font-bold uppercase tracking-wider border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 cursor-pointer"
                      >
                        {t("All", "全选")}
                      </button>
                      <button 
                        onClick={() => setScoreboardQuarters([])} 
                        className="px-1.5 py-0.5 rounded text-[6.5px] font-bold uppercase tracking-wider border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 cursor-pointer"
                      >
                        {t("Clear", "清空")}
                      </button>
                    </div>
                  </div>

                  {/* WIN-RATE CRITERIA MULTI-SELECT */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[8px] font-black text-slate-450 uppercase tracking-widest block mr-1">
                      {t("Win-Rate Bands (Multi-Select):", "赢率区间多选:")}
                    </span>
                    <div className="inline-flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                      {[
                        { key: 'won_100', labelEn: 'Won (100%)', labelCh: '已签约 (100%)' },
                        { key: 'high_75_99', labelEn: 'Band A (75-99%)', labelCh: '高区间 (75-99%)' },
                        { key: 'mid_50_74', labelEn: 'Band B (50-74%)', labelCh: '中区间 (50-74%)' },
                        { key: 'low_25_49', labelEn: 'Band C (25-49%)', labelCh: '低区间 (25-49%)' },
                        { key: 'lost_0_24', labelEn: 'Risk (0-24%)', labelCh: '低押丢单 (0-24%)' }
                      ].map(opt => {
                        const isActive = scoreboardWinRates.includes(opt.key);
                        return (
                          <button
                            key={opt.key}
                            onClick={() => {
                              if (isActive) {
                                setScoreboardWinRates(scoreboardWinRates.filter(wr => wr !== opt.key));
                              } else {
                                setScoreboardWinRates([...scoreboardWinRates, opt.key]);
                              }
                            }}
                            className={cn(
                              "px-2.5 py-1 rounded-lg text-[7.5px] font-black uppercase tracking-wider transition-all cursor-pointer",
                              isActive 
                                ? "bg-slate-900 text-white shadow-sm font-black"
                                : "hover:bg-white text-slate-400 hover:text-slate-700"
                            )}
                          >
                            {language !== 'en' ? opt.labelCh : opt.labelEn}
                          </button>
                        );
                      })}
                    </div>
                    {/* Presets for Win-Rate */}
                    <div className="flex gap-1">
                      <button 
                        onClick={() => setScoreboardWinRates(['won_100', 'high_75_99', 'mid_50_74', 'low_25_49'])} 
                        className="px-1.5 py-0.5 rounded text-[6.5px] font-bold uppercase tracking-wider border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 cursor-pointer"
                      >
                        {t("All Active", "所有在途")}
                      </button>
                      <button 
                        onClick={() => setScoreboardWinRates(['won_100'])} 
                        className="px-1.5 py-0.5 rounded text-[6.5px] font-bold uppercase tracking-wider border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 cursor-pointer"
                      >
                        {t("Won Only", "仅签约")}
                      </button>
                    </div>
                  </div>

                  {/* WEIGHTED TOGGLE SWITCH */}
                  <div className="flex items-center gap-2 bg-indigo-50/50 px-3 py-1.5 rounded-xl border border-indigo-100/50">
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={scoreboardWeighted} 
                        onChange={(e) => setScoreboardWeighted(e.target.checked)}
                        className="rounded border-indigo-300 text-indigo-650 focus:ring-indigo-550 w-3 h-3"
                      />
                      <span className="text-[7.5px] font-black uppercase text-indigo-850 tracking-wider">
                        {t("Weighted Forecast", "赢率折算期望值")}
                      </span>
                    </label>
                  </div>

                  {/* INDICATOR */}
                  <div className="lg:ml-auto shrink-0">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-50 border border-indigo-100 text-[8px] font-black text-indigo-750 uppercase tracking-wider font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse"></span>
                      {scoreboardQuarters.length === 4 
                        ? `${selectedFY} ${t("Full Annual Cycle", "全年总揽")}`
                        : scoreboardQuarters.length === 0 
                          ? t("No quarters selected", "未选择季度范围")
                          : `${scoreboardQuarters.slice().sort().join(', ')} ${t("Performance Snapshot", "周期专项结算")}`}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {scoreboardPerformances.map((rep) => (
                  <div key={rep.name} className="bg-white border border-slate-150 p-5 rounded-2xl relative shadow-sm hover:shadow-md transition-all group duration-300">
                    <div className={cn(
                      "absolute top-5 right-5 w-7.5 h-7.5 rounded-full flex items-center justify-center text-xs font-black",
                      rep.attainmentRate >= 100 
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                        : rep.attainmentRate > 50 
                          ? "bg-indigo-50 text-indigo-600 border border-indigo-100" 
                          : "bg-slate-50 text-slate-500 border border-slate-100"
                    )}>
                      {rep.attainmentRate >= 100 ? "🏆" : "📈"}
                    </div>

                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">
                      REP SCORE
                    </span>
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider font-display mt-0.5">
                      {rep.name}
                    </h4>

                    {/* Dynamic status badge aligning with their current win rate performance */}
                    <div className="mt-1.5">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[7.5px] font-black uppercase tracking-widest border transition-all duration-300",
                        rep.quotaStatusColor
                      )}>
                        <span className="w-1 h-1 rounded-full bg-current animate-pulse" />
                        {language !== 'en' ? rep.quotaStatusLabelCh : rep.quotaStatusLabelEn}
                      </span>
                    </div>

                    <div className="h-[1px] bg-slate-100 my-3" />

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div>
                        <span className="text-[7px] font-black text-slate-450 uppercase tracking-widest block mb-0.5">
                          {scoreboardQuarters.length === 4 
                            ? t("Annual Quota", "年度保障配额指标") 
                            : scoreboardQuarters.length === 0
                              ? t("No Target", "请选择季度")
                              : `${scoreboardQuarters.slice().sort().join('+')} ${t("Scaled Quota", "等比配额")}`}
                        </span>
                        <span className="text-[11px] font-mono font-black text-slate-850">¥ {rep.quota.toLocaleString()} k</span>
                      </div>
                      <div>
                        <span className="text-[7px] font-black text-slate-455 uppercase tracking-widest block mb-0.5">
                          {rep.evaluatedLabel}
                        </span>
                        <span className="text-[11px] font-mono font-black text-indigo-600 bg-indigo-50/50 px-1.5 py-0.2 rounded-md">
                          ¥ {rep.evaluatedAttainment.toLocaleString()} k
                        </span>
                      </div>
                    </div>

                    {/* Progress tracking */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[8px] font-black uppercase text-slate-450 tracking-wider">
                        <span>Attainment</span>
                        <span className="font-mono text-slate-900">{rep.attainmentRate}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                        <div 
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            rep.attainmentRate >= 100 
                              ? "bg-emerald-500" 
                              : rep.attainmentRate > 50 
                                ? "bg-indigo-500" 
                                : "bg-amber-500"
                          )}
                          style={{ width: `${Math.min(100, rep.attainmentRate)}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex justify-between text-[7px] font-bold text-slate-400 mt-3.5 uppercase tracking-wider bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <span>Pipeline: ¥ {rep.totalPipeline.toLocaleString()} k</span>
                      <span>Cov: {rep.coverageRatio}x</span>
                    </div>

                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: Smart Tracker / Quota Optimizer and Transition Vault */}
        {activeTab === 'allocator' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="bg-slate-900 text-white rounded-3xl p-6 md:p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-emerald-500/20 rounded-full blur-[50px] pointer-events-none" />
              
              <div className="max-w-2xl space-y-4">
                <span className="px-2.5 py-0.5 bg-emerald-500 text-white rounded-full text-[8px] font-black uppercase tracking-widest font-mono">
                  {t("Interactive Deal Handover Tool", "客户交接与优质项目划配核心器")}
                </span>
                <h3 className="text-lg font-black uppercase tracking-wider font-display">
                  {t("Bootstrap Jackie's Starter Portfolio", "一键极速注入首期装机质优基建池")}
                </h3>
                <p className="text-[10px] text-zinc-300 uppercase tracking-widest leading-relaxed">
                  {t(
                    "To ensure our new hire representative Jackie succeeds, sales operations will transfer existing account portfolios containing pre-installed infrastructure with verified buyer metrics and a win probability ABOVE 50% to her pipeline book.",
                    "秉承销售发展策略，为了支持杰基 (Jackie) 快速融入，我们将系统内存储的现成大批「装机客户/老系统增补」且「赢率大于50%」的主力项目进行指派变更，从而迅速充实其业绩管线，确保顺利进入成交周期。"
                  )}
                </p>

                <div className="pt-4 flex flex-wrap gap-4">
                  <button
                    onClick={handleAutoAllocateToJackie}
                    disabled={allocatableDeals.length === 0}
                    className="flex items-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 disabled:cursor-not-allowed text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md active:scale-95 duration-100 cursor-pointer"
                  >
                    <Zap className="w-4 h-4 fill-white" />
                    <span>{t("Auto-Allocate Qualifiers to Jackie", "一键配额划转：批量注入杰基名下")}</span>
                  </button>
                  
                  <div className="flex items-center gap-2.5 text-[9px] font-extrabold text-zinc-400 uppercase tracking-widest self-center">
                    <Building2 className="w-4 h-4" />
                    <span>
                      {t(
                        `Found ${allocatableDeals.length} compatible Install-Base deals currently assigned to others`,
                        `发现全队管线中共有 ${allocatableDeals.length} 个属于装机老客的待成交项目可用`
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* DYNAMIC COMPREHENSIVE DEAL BROKER / ALL-REPS REASSIGN BOARD */}
            <div className="bg-slate-50/50 border border-slate-150 p-6 md:p-8 rounded-[2.5rem] space-y-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200/60 pb-5">
                <div className="space-y-1">
                  <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest font-display flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-indigo-600" />
                    {t(`General ${selectedFY} Deal Broker & Interactive Relocator`, `通用 ${selectedFY} 交易管线调配与跨地划归工作板`)}
                  </span>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                    {t(
                      "Review current financial year deals and relocate to Julian, Joey, Elisa, or Jackie based on operational rules.",
                      "盘点并审阅当前财年内的全部商机账目，支持根据销售职责将任意客户项目瞬间转移指教或重派给 Julian/Joey/Elisa/Jackie。"
                    )}
                  </p>
                </div>
                
                {/* Embedded Mini Role Audit Legend */}
                <div className="flex flex-wrap gap-2 text-[8px] font-black tracking-wider uppercase text-slate-500 self-start">
                  <span className="px-2 py-1 bg-indigo-50 border border-indigo-150 rounded text-indigo-700">Julian: Install Base</span>
                  <span className="px-2 py-1 bg-purple-50 border border-purple-150 rounded text-purple-700">Joey/Elisa: Team Quota</span>
                  <span className="px-2 py-1 bg-emerald-50 border border-emerald-150 rounded text-emerald-700">Jackie: Channel & New Logos</span>
                </div>
              </div>

              {/* Deal Broker Search Engine Bar */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder={t("Filter by customer, deal item, original salesperson, sector...", "通过输入客户姓名、项目类型、原属责任人、应用行业快速筛选目标交易进行微调指拨...")}
                  value={dealSearchQuery}
                  onChange={(e) => setDealSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-sm"
                />
              </div>

              {filteredActiveFYDeals.length === 0 ? (
                <div className="p-10 text-center bg-white border border-slate-200/60 rounded-2xl space-y-2">
                  <Search className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-black text-rose-500 uppercase tracking-widest animate-bounce">
                    {t("No matches found for active year filter", "在当前筛项下未能匹配到任何对应的交易项目")}
                  </p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                    {t("Check the Search input or switch Financial Year filter in the top-right toolbar.", "请重新核验搜索框输入，或尝试在右上角年份工具栏中更换执行财年。")}
                  </p>
                </div>
              ) : (
                <div className="bg-white border border-slate-150 rounded-2xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-120 text-[8px] font-black uppercase text-slate-450 tracking-widest font-mono">
                          <th className="py-3 px-4">{t("Item/Deal", "项目详情")}</th>
                          <th className="py-3 px-4">{t("Customer Name", "商户客户")}</th>
                          <th className="py-3 px-4">{t("Sector/Stage", "行业因素 & 策略提示")}</th>
                          <th className="py-3 px-4 text-right">{t("Expected Volume", "预算金额 (k)")}</th>
                          <th className="py-3 px-4 text-center">{t("Current Sales Owner", "当期跟进伙伴")}</th>
                          <th className="py-3 px-4 text-center">{t("Change Owner Assignee", "实时业绩指调变更专区")}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-[10px] font-medium text-slate-600">
                        {filteredActiveFYDeals.map((deal) => {
                          const currentOwner = (deal.salesPerson || 'Unassigned').trim();
                          
                          // Strategic recommendations helper
                          let suggestLabel = "";
                          const lowerItem = deal.itemName.toLowerCase();
                          const lowerSector = deal.sector.toLowerCase();
                          const isWon = deal.winRate >= 0.99 || deal.status === 'Won';

                          if (lowerSector === 'govt' || lowerSector === 'utilities') {
                            suggestLabel = t("Assign to Julian (Install-Base core)", "老客户或高客单基建存续 - 建议指派主力 Julian 稳打稳扎");
                          } else if (lowerItem.includes('channel') || lowerItem.includes('partner')) {
                            suggestLabel = t("Assign to Jackie (Channel & Partner specialized)", "渠道、分销或外部Logo拓展型 - 建议指派 Jackie 开发");
                          } else {
                            suggestLabel = t("Suitable for Elisa & Joey (Shared Quota Plan)", "常规老客续签 - 适合 Joey 与 Elisa 承揽大盘");
                          }

                          return (
                            <tr key={deal.id} className="hover:bg-slate-50/40 transition-colors">
                              <td className="py-3 px-4">
                                <div className="space-y-0.5">
                                  <div className="font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-1.5 flex-wrap">
                                    <span>{deal.itemName}</span>
                                    {isWon && (
                                      <span className="px-1.5 py-0.2 bg-emerald-500 text-[6.5px] font-black text-white rounded-md uppercase tracking-widest">
                                        Won
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest block font-mono">ID: {deal.id}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4 font-bold uppercase tracking-wider text-slate-500">
                                {deal.customerName}
                              </td>
                              <td className="py-3 px-4 space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[7px] font-black text-slate-500 uppercase tracking-wide">
                                    {deal.sector}
                                  </span>
                                  <span className="font-mono text-[8px] font-extrabold text-indigo-600 bg-indigo-50 px-1 py-0.2 rounded">
                                    {(deal.winRate * 100).toFixed(0)}% Win
                                  </span>
                                </div>
                                <span className="block text-[7.5px] font-bold text-slate-450 uppercase tracking-wider mt-0.5">
                                  💡 {suggestLabel}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right font-mono font-black text-slate-900">
                                ¥ {deal.amountK.toLocaleString()} k
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className={cn(
                                  "px-3 py-1 rounded-full text-[8.5px] font-black uppercase tracking-widest inline-block border",
                                  currentOwner === 'Julian' && "bg-blue-50 text-blue-700 border-blue-150",
                                  currentOwner === 'Joey' && "bg-purple-50 text-purple-700 border-purple-150",
                                  currentOwner === 'Elisa' && "bg-pink-50 text-pink-700 border-pink-150",
                                  currentOwner === 'Jackie' && "bg-emerald-50 text-emerald-700 border-emerald-150",
                                  currentOwner === 'Unassigned' && "bg-slate-100 text-slate-450 border-slate-200"
                                )}>
                                  {currentOwner}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <div className="inline-flex gap-1 bg-slate-150 p-1 rounded-xl border border-slate-205">
                                  {['Julian', 'Joey', 'Elisa', 'Jackie'].map((rep) => {
                                    const isCurrent = currentOwner === rep;
                                    return (
                                      <button
                                        key={rep}
                                        onClick={() => handleAssignDealToRep(deal, rep)}
                                        className={cn(
                                          "px-2.5 py-1 rounded-lg text-[7px] font-black uppercase tracking-wider transition-all cursor-pointer",
                                          isCurrent 
                                            ? rep === 'Julian' ? "bg-blue-600 text-white shadow-sm"
                                              : rep === 'Joey' ? "bg-purple-600 text-white shadow-sm"
                                              : rep === 'Elisa' ? "bg-pink-600 text-white shadow-sm"
                                              : "bg-emerald-600 text-white shadow-sm"
                                            : "hover:bg-white text-slate-500 hover:text-slate-900"
                                        )}
                                      >
                                        {rep}
                                      </button>
                                    );
                                  })}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* JACKIE'S COMPREHENSIVE ROADMAP VISUAL */}
            <div className="bg-slate-50/40 border border-slate-150 p-6 md:p-8 rounded-[2rem] grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <span className="text-[10px] font-black text-indigo-950 uppercase tracking-[0.12em] font-display block">
                  {t("1. Baseline Consolidation Target", "第一目标：打牢老装机客户基底")}
                </span>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                  {t(
                    "Transitioning verified install base accounts ensures immediate validation of channel frameworks, providing dependable transaction runs and solidifying Jackie's initial quota baseline up to 70% of target.",
                    "交接优质老用户项目以作为稳定存续池，能在确保渠道佣金框架经受实战检验的同时，为 Jackie 斩获极高的闭环胜算，在稳健中支撑其个人初设绩效达标线的 70% 额度。"
                  )}
                </p>
                <div className="p-4 bg-white rounded-xl border border-slate-100 flex items-center justify-between">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[8px] font-black text-slate-450 uppercase tracking-widest">Base Target Scope</span>
                    <span className="text-xs font-mono font-black text-slate-800">¥ 900k +</span>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-teal-50 text-[8px] font-black text-teal-700 uppercase tracking-widest border border-teal-100">
                    {t("Minimal Risk Profile", "风险极低板块")}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <span className="text-[10px] font-black text-indigo-950 uppercase tracking-[0.12em] font-display block">
                  {t("2. Driving New Segments & New Logos", "第二目标：破浪开打新增量版图")}
                </span>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                  {t(
                    "Concurrently, Jackie is tasked to extend new sector frontiers (AI Publishing, Advanced Health-Tech partners) to scale higher accelerators and obtain maximum quarterly commission increments.",
                    "与此同时，Jackie 必须发挥主观能动性，在新领域（如大模型出版应用、全新合作经销机构等）攻城略地，以此激活超额业绩提成器，博取极为丰厚的高额季度佣金加成。"
                  )}
                </p>
                <div className="p-4 bg-white rounded-xl border border-slate-100 flex items-center justify-between">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[8px] font-black text-slate-450 uppercase tracking-widest">Expansion Target</span>
                    <span className="text-xs font-mono font-black text-slate-800">¥ 400k +</span>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-indigo-50 text-[8px] font-black text-indigo-700 uppercase tracking-widest border border-indigo-100">
                    {t("High Accelerator Yield", "丰厚提成爆发点")}
                  </span>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: COMMISSION ANALYSIS AND LEDGER REPORT */}
        {activeTab === 'commissions' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Commission Formula Panel */}
            <div className="bg-slate-50/50 border border-slate-150 p-6 md:p-8 rounded-[2rem] space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Percent className="w-4.5 h-4.5 text-indigo-600" />
                <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest font-display">
                  {t("Official Corporate Multi-rep Commission Formulation Rules", "销售运营后台通用佣金结算计重指标公式")}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 bg-white rounded-xl border border-slate-100">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                    {t("BASE QUOTA COMMISSION RATE", "基准指标期内销售提成")}
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-mono font-black text-slate-900">{commissionRates.baseRate}%</span>
                    <span className="text-[8px] font-bold text-slate-450 uppercase tracking-widest">closed sales</span>
                  </div>
                  <p className="text-[8.5px] font-medium text-slate-400 uppercase tracking-widest leading-relaxed mt-1.5">
                    {t("Applied to all closed-won volume within defined limits.", "在基准配额区间内达成的有效闭环保底销售业绩，一律按定率结算。")}
                  </p>
                </div>

                <div className="p-4 bg-white rounded-xl border border-slate-100">
                  <span className="text-[8px] font-black text-indigo-600 uppercase tracking-widest block mb-1">
                    {t("ACCELERATOR MULTIPLIER BONUS", "超出定额高能超频加速提成")}
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-mono font-black text-indigo-600">{commissionRates.accelerator}%</span>
                    <span className="text-[8px] font-bold text-indigo-500 uppercase tracking-widest">on excess</span>
                  </div>
                  <p className="text-[8.5px] font-medium text-indigo-500/80 uppercase tracking-widest leading-relaxed mt-1.5">
                    {t("Applies over 100% quota attainment to reward hyper performance.", "凡闭环营业额突破个人指标额度 100% 后，溢出边界的部分自动飙升加速。")}
                  </p>
                </div>

                <div className="p-4 bg-white rounded-xl border border-slate-100">
                  <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest block mb-1">
                    {t("NEW BRAND LOGO PREMIUM", "精锐开疆破冰新客专项溢价")}
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-mono font-black text-emerald-600">+{commissionRates.newBrandBonus}%</span>
                    <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest">on deal amount</span>
                  </div>
                  <p className="text-[8.5px] font-medium text-emerald-500/80 uppercase tracking-widest leading-relaxed mt-1.5">
                    {t("A reward premium for driving newly discovered accounts & segments.", "针对成功开拓新业务、突破外部从未触及领域（如大模型出版应用）的专项返佣。")}
                  </p>
                </div>
              </div>
            </div>

            {/* COMMISSION STATEMENT TABLE */}
            <div className="space-y-4">
              <span className="text-[10px] font-black text-slate-900 uppercase tracking-[0.15em] font-display block">
                {t("Quarterly Commission Payroll projection (¥)", "季度奖佣金兑结算预测对账单 (¥)")}
              </span>

              <div className="bg-white border border-slate-150 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100 text-[8px] font-black uppercase text-slate-450 tracking-widest">
                        <th className="py-3.5 px-4">{t("Sales Representative", "结算名下销售")}</th>
                        <th className="py-3.5 px-4 text-right">{t("Assigned Quota", "绑定业绩压力线")}</th>
                        <th className="py-3.5 px-4 text-right">{t("Closed Won Realized", "已获单闭环签额")}</th>
                        <th className="py-3.5 px-4 text-right">{t("Attainment", "达成比率")}</th>
                        <th className="py-3.5 px-4 text-right">{t("Standard commission (Base)", "基础提成所得")}</th>
                        <th className="py-3.5 px-4 text-right">{t("Accelerator Bonus", "超标溢出奖佣")}</th>
                        <th className="py-3.5 px-4 text-right">{t("Est. Net Payout", "最终应纳佣提 (含新客溢价)")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[10px] font-medium text-slate-600">
                      {performances.map((rep) => {
                        const standardQuota = quotas[rep.name] || 15000;
                        const won = rep.closedWon;
                        
                        // Break down commission details for clarity
                        const baseVal = Math.min(won, standardQuota);
                        const baseCommission = baseVal * (commissionRates.baseRate / 100);
                        
                        const overVal = Math.max(0, won - standardQuota);
                        const overCommission = overVal * (commissionRates.accelerator / 100);

                        return (
                          <tr key={rep.name} className="hover:bg-slate-50/30 transition-colors">
                            <td className="py-3.5 px-4 font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                              {rep.name}
                              {rep.attainmentRate >= 100 && (
                                <span className="inline-flex bg-amber-100 text-amber-800 border border-amber-200 text-[6.5px] font-black px-1.5 py-0.2 rounded uppercase tracking-widest font-mono">
                                  ELITE OVERACHIEVER
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-500">
                              ¥ {rep.quota.toLocaleString()} k
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900">
                              ¥ {rep.closedWon.toLocaleString()} k
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <span className={cn(
                                "font-mono font-black px-2 py-0.5 rounded-md",
                                rep.attainmentRate >= 100 
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                                  : rep.attainmentRate > 50 
                                    ? "bg-indigo-50 text-indigo-700 border border-indigo-100" 
                                    : "bg-slate-50 text-slate-400 border border-slate-100"
                              )}>
                                {rep.attainmentRate}%
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono text-slate-500">
                              ¥ {baseCommission.toFixed(1)}k
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono text-slate-500">
                              ¥ {overCommission > 0 ? `${overCommission.toFixed(1)}k` : '—'}
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono font-black text-emerald-600 bg-emerald-50/20">
                              ¥ {rep.commission.toFixed(1)} k
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Strategic highlights footer */}
            <div className="bg-slate-50 border border-slate-150 p-6 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-5">
              <div className="flex gap-3 items-start">
                <Award className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[9px] font-black text-slate-900 uppercase tracking-widest block">
                    {t("Sales Admin Expert Verdict", "佣金行政部最终审计评估意见")}
                  </span>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed mt-1">
                    {t(
                      "This framework successfully balances individual motivation and total financial safety rules, restricting potential corporate burn while assuring high accelerators for groundbreaking performance achievements.",
                      "当前佣金制定方案在最大程度保障企业财税开支底线的同时，提供了阶梯式、具高爆发力的新领域超频返还政策，对于Jackie等新晋力量能够提供充足的起步护航和长尾溢利驱动。"
                    )}
                  </p>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
