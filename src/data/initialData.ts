import { WarehouseItem, StockMutation, PreOrder } from '../types';

export const INITIAL_ITEMS: WarehouseItem[] = [
  { id: '1', name: 'Box 35 ML', sku: 'SKU-2044', rack: 'Rak A-12', stock: 0, category: 'Kemasan' },
  { id: '2', name: 'Bubble Wrap', sku: 'SKU-1102', rack: 'Rak B-04', stock: 0, category: 'Proteksi' },
  { id: '3', name: 'Lakban Bening', sku: 'SKU-5591', rack: 'Rak C-01', stock: 0, category: 'Perekat' },
  { id: '4', name: 'Fragile', sku: 'SKU-3022', rack: 'Rak B-02', stock: 0, category: 'Sticker' },
  { id: '5', name: 'Box 10 ML', sku: 'SKU-9901', rack: 'Rak A-02', stock: 0, category: 'Kemasan' },
  { id: '6', name: 'Plastik Polymail 20x30', sku: 'SKU-8821', rack: 'Rak C-05', stock: 0, category: 'Kurir' },
  { id: '7', name: 'Plastik Polymail 30x40', sku: 'SKU-8822', rack: 'Rak C-06', stock: 0, category: 'Kurir' },
  { id: '8', name: 'Sticker Warning', sku: 'SKU-4412', rack: 'Rak B-08', stock: 0, category: 'Sticker' },
  { id: '9', name: 'Shieldtag', sku: 'SKU-7751', rack: 'Rak D-04', stock: 0, category: 'Keamanan' },
  { id: '10', name: 'NFC Card', sku: 'SKU-7752', rack: 'Rak D-05', stock: 0, category: 'Kartu' },
  { id: '11', name: 'Privillage Card', sku: 'SKU-7753', rack: 'Rak D-06', stock: 0, category: 'Kartu' },
  { id: '12', name: 'Resi Thermal', sku: 'SKU-8823', rack: 'Rak C-07', stock: 0, category: 'Kertas' },
];

export const INITIAL_MUTATIONS: StockMutation[] = [];

export const INITIAL_PRE_ORDERS: PreOrder[] = [];
