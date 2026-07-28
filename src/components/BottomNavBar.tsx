import React from 'react';
import { Home, LogIn, LogOut, ShoppingCart, Package, BarChart3 } from 'lucide-react';

interface BottomNavBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function BottomNavBar({ activeTab, onTabChange }: BottomNavBarProps) {
  const navItems = [
    { id: 'home', label: 'Beranda', icon: Home },
    { id: 'masuk', label: 'Masuk', icon: LogIn },
    { id: 'keluar', label: 'Keluar', icon: LogOut },
    { id: 'preorder', label: 'Pre Order', icon: ShoppingCart },
    { id: 'stok', label: 'Stok', icon: Package },
    { id: 'summary', label: 'Summary', icon: BarChart3 },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center pb-6 pt-2 bg-slate-50 border-t border-slate-200 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] px-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;

        return (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`flex flex-col items-center justify-center transition-all duration-150 py-1 px-3 rounded-full focus:outline-none ${
              isActive
                ? 'bg-blue-100 text-blue-600 scale-100 font-bold'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-150/40 active:scale-95'
            }`}
          >
            <Icon className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-wide font-medium">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
