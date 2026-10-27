import React, { useState, useEffect } from 'react';

interface SidebarProps {
  activeTab: 'map' | 'dashboard' | 'cases' | 'registry' | 'manual';
  setActiveTab: (tab: 'map' | 'dashboard' | 'cases' | 'registry' | 'manual') => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onLogout }) => {
  const [dataRate, setDataRate] = useState(64.2);

  useEffect(() => {
    const interval = setInterval(() => {
      setDataRate(prev => {
        const delta = (Math.random() - 0.5) * 8;
        const newVal = prev + delta;
        return newVal < 40 ? 45 : newVal > 95 ? 90 : newVal;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const menuItems = [
    { id: 'dashboard', label: 'State Overview', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    )},
    { id: 'map', label: 'Enforcement Map', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    )},
    { id: 'cases', label: 'Audit Pipeline', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    )},
    { id: 'registry', label: 'Asset Registry', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
      </svg>
    )},
    { id: 'manual', label: 'Manual Allotment', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    )},
  ];

  return (
    <aside className="w-64 bg-white flex flex-col shrink-0 border-r border-slate-200 z-30 shadow-sm relative overflow-hidden">
      <div className="p-8 relative z-10">
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-3">
             <div className="w-1.5 h-4 bg-[#003366] rounded-full animate-pulse shadow-[0_0_8px_#003366]"></div>
             <span className="text-[9px] font-black text-[#003366] uppercase tracking-[0.25em]">Portal Active</span>
          </div>
          <span className="text-xl font-black text-slate-900 tracking-tight uppercase leading-tight">Land Monitor<br/>Portal</span>
        </div>
        
        <nav className="space-y-1.5">
          {menuItems.map((item, idx) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-lg text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-300 transform active:scale-95 ${
                activeTab === item.id 
                ? 'bg-[#003366] text-white shadow-lg' 
                : 'text-slate-400 hover:text-[#003366] hover:bg-slate-50'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-6 space-y-4">
        <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl">
           <div className="flex justify-between text-[7px] font-black text-slate-500 uppercase mb-1.5 tracking-widest">
              <span>Feed Sync</span>
              <span className="font-mono">{dataRate.toFixed(1)}%</span>
           </div>
           <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
             <div className="bg-[#003366] h-full transition-all duration-500" style={{ width: `${dataRate}%` }}></div>
           </div>
        </div>
        <button onClick={onLogout} className="w-full flex items-center justify-between px-5 py-4 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all border border-slate-100">
          Close Session
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;