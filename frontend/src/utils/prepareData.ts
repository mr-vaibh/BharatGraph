// utils/prepareData.ts
import stock_query from '@/data/stock_query.json';

export function prepareCompanyData() {
  return Object.entries(stock_query).map(([name, details]) => ({
    name,
    ...details
  }));
}
