
export interface SalesRecord {
  id: string;
  category: string; // Order or Rev
  fy: string;
  fyQtr: string;
  half: string;
  salesPerson: string;
  itemName: string;
  customerName: string;
  sector: string;
  partners: string;
  productType: string;
  amountK: number;
  date: string;
  winRate: number;
  status: string; // Best, Likely, Worst
  productType2: string;
}

export interface DashboardMetrics {
  totalPipeline: number;
  weightedForecast: number;
  topSector: string;
  topSalesperson: string;
}
