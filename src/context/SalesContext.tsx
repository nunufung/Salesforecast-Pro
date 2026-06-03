
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { SalesRecord } from '../types';
import { parseSalesData } from '../data';

function hashCode(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(16);
}

function deduplicateData(records: SalesRecord[]): SalesRecord[] {
  const seenIds = new Set<string>();
  return records.filter(r => {
    if (!r.id) return false;
    if (seenIds.has(r.id)) {
      return false;
    }
    seenIds.add(r.id);
    return true;
  });
}

interface SalesContextType {
  data: SalesRecord[];
  deletedRecords: SalesRecord[];
  addRecord: (record: SalesRecord) => void;
  updateRecord: (record: SalesRecord) => void;
  deleteRecord: (id: string) => void;
  restoreRecord: (id: string) => void;
  restoreAllRecords: () => void;
  hardResetData: () => void;
  clearRecycleBin: () => void;
  clearAllData: () => void;
  importCSV: (csvText: string) => void;
  fetchGoogleSheet: (url: string) => Promise<void>;
  refreshData: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  lastUpdated: number;
  language: 'en' | 'zh' | 'bilingual';
  setLanguage: (lang: 'en' | 'zh' | 'bilingual') => void;
  t: (en: string, zh: string) => string;
}

const SalesContext = createContext<SalesContextType | undefined>(undefined);

export function SalesProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<SalesRecord[]>([]);
  const [language, setLanguageState] = useState<'en' | 'zh' | 'bilingual'>(() => {
    const saved = localStorage.getItem('forecast_pro_language');
    return (saved as 'en' | 'zh' | 'bilingual') || 'bilingual';
  });

  const setLanguage = useCallback((lang: 'en' | 'zh' | 'bilingual') => {
    setLanguageState(lang);
    localStorage.setItem('forecast_pro_language', lang);
  }, []);

  const t = useCallback((en: string, zh: string) => {
    if (language === 'en') return en;
    if (language === 'zh') return zh;
    if (!en && !zh) return '';
    if (!en) return zh;
    if (!zh) return en;
    return `${en} / ${zh}`;
  }, [language]);
  const [deletedRecords, setDeletedRecords] = useState<SalesRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState(Date.now());
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize with hardcoded data or localStorage
  useEffect(() => {
    const savedData = localStorage.getItem('sales_inventory');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setData(deduplicateData(parsed));
      } catch (e) {
        setData(deduplicateData(parseSalesData()));
      }
    } else {
      setData(deduplicateData(parseSalesData()));
    }

    const savedDeletedData = localStorage.getItem('deleted_sales_records');
    if (savedDeletedData) {
      try {
        setDeletedRecords(JSON.parse(savedDeletedData));
      } catch (e) {
        setDeletedRecords([]);
      }
    }

    setIsInitialized(true);
  }, []);

  // Save to localStorage whenever data changes (only after initialized)
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('sales_inventory', JSON.stringify(data));
    }
  }, [data, isInitialized]);

  // Save deleted records whenever they change
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('deleted_sales_records', JSON.stringify(deletedRecords));
    }
  }, [deletedRecords, isInitialized]);

  const addRecord = useCallback((record: SalesRecord) => {
    const newRecord = {
      ...record,
      id: record.id || `manual-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    setData(prev => deduplicateData([newRecord, ...prev]));
    setLastUpdated(Date.now());
  }, []);

  const updateRecord = useCallback((record: SalesRecord) => {
    setData(prev => prev.map(r => r.id === record.id ? record : r));
    setLastUpdated(Date.now());
  }, []);

  const deleteRecord = useCallback((id: string) => {
    let toDelete: SalesRecord | undefined;
    setData(prev => {
      toDelete = prev.find(r => r.id === id);
      return prev.filter(r => r.id !== id);
    });
    if (toDelete) {
      setDeletedRecords(prevDeleted => [toDelete!, ...prevDeleted.filter(d => d.id !== id)]);
    }
    setLastUpdated(Date.now());
  }, []);

  const restoreRecord = useCallback((id: string) => {
    let toRestore: SalesRecord | undefined;
    setDeletedRecords(prev => {
      toRestore = prev.find(r => r.id === id);
      return prev.filter(r => r.id !== id);
    });
    if (toRestore) {
      setData(prev => {
        if (prev.some(r => r.id === id)) return prev;
        return [toRestore!, ...prev];
      });
    }
    setLastUpdated(Date.now());
  }, []);

  const restoreAllRecords = useCallback(() => {
    setDeletedRecords(prev => {
      setData(prevData => {
        const uniquePrev = [...prevData];
        prev.forEach(record => {
          if (!uniquePrev.some(r => r.id === record.id)) {
            uniquePrev.unshift(record);
          }
        });
        return uniquePrev;
      });
      return [];
    });
    setLastUpdated(Date.now());
  }, []);

  const hardResetData = useCallback(() => {
    localStorage.removeItem('sales_inventory');
    localStorage.removeItem('deleted_sales_records');
    setData(deduplicateData(parseSalesData()));
    setDeletedRecords([]);
    setLastUpdated(Date.now());
  }, []);

  const clearRecycleBin = useCallback(() => {
    setDeletedRecords([]);
    setLastUpdated(Date.now());
  }, []);

  const clearAllData = useCallback(() => {
    localStorage.setItem('sales_inventory', '[]');
    localStorage.setItem('deleted_sales_records', '[]');
    setData([]);
    setDeletedRecords([]);
    setLastUpdated(Date.now());
  }, []);

  const importCSV = useCallback((csvText: string) => {
    const lines = csvText.split('\n').filter(line => line.trim() !== '');
    if (lines.length < 2) return;

    const newRecords: SalesRecord[] = lines.slice(1).map((line, idx) => {
      const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
      const cleaned = parts.map(p => p.replace(/"/g, '').trim());
      
      const amountK = parseFloat(cleaned[10]?.replace(/,/g, '')) || 0;
      const winRate = (parseFloat(cleaned[13]?.replace('%', '')) || 0) / 100;

      const contentKey = `${cleaned[0] || ''}-${cleaned[1] || ''}-${cleaned[2] || ''}-${cleaned[3] || ''}-${cleaned[4] || ''}-${(cleaned[5] || '').trim().toLowerCase()}-${(cleaned[6] || '').trim().toLowerCase()}-${cleaned[7] || ''}-${amountK}-${cleaned[11] || ''}`;
      const stableId = `csv-${hashCode(contentKey)}-${idx}`;

      return {
        id: stableId,
        category: cleaned[0] || 'Order',
        fy: cleaned[1] || 'FY26',
        fyQtr: cleaned[2] || '',
        half: cleaned[3] || '',
        salesPerson: cleaned[4] || '',
        itemName: cleaned[5] || '',
        customerName: cleaned[6] || '',
        sector: cleaned[7] || '',
        partners: cleaned[8] || '',
        productType: cleaned[9] || '',
        amountK,
        date: cleaned[11] || new Date().toLocaleDateString(),
        winRate,
        status: cleaned[14] || 'Likely',
        productType2: cleaned[15] || ''
      };
    });

    // Putting existing processed (prev) elements first so user modifications take priority over new CSV imports
    setData(prev => deduplicateData([...prev, ...newRecords]));
    setLastUpdated(Date.now());
  }, []);

  const fetchGoogleSheet = useCallback(async (url: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // Expecting a public CSV export URL
      // e.g. https://docs.google.com/spreadsheets/d/ID/export?format=csv
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch Google Sheet CSV. Ensure it is published as CSV.');
      const text = await response.text();
      importCSV(text);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [importCSV]);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Simulating a real enterprise data API check & refetching sequence
      await new Promise(resolve => setTimeout(resolve, 800));
      const savedData = localStorage.getItem('sales_inventory');
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          setData(deduplicateData(parsed));
        } catch (e) {
          setData(deduplicateData(parseSalesData()));
        }
      } else {
        setData(deduplicateData(parseSalesData()));
      }
      setLastUpdated(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Synchronization failed.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <SalesContext.Provider value={{ 
      data, 
      deletedRecords, 
      addRecord, 
      updateRecord, 
      deleteRecord, 
      restoreRecord, 
      restoreAllRecords, 
      hardResetData, 
      clearRecycleBin, 
      clearAllData, 
      importCSV, 
      fetchGoogleSheet, 
      refreshData, 
      isLoading, 
      error, 
      lastUpdated,
      language,
      setLanguage,
      t
    }}>
      {children}
    </SalesContext.Provider>
  );
}

export function useSales() {
  const context = useContext(SalesContext);
  if (context === undefined) {
    throw new Error('useSales must be used within a SalesProvider');
  }
  return context;
}
