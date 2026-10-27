
import React, { useState, useEffect } from 'react';
import { Plot, EnforcementStage } from '../types';
import { ZONES } from '../mockData';

interface CaseManagementProps {
  plots: Plot[];
  onUpdatePlotStage: (plotId: string, direction: 'advance' | 'revert') => void;
  onViewDossier: (plotId: string) => void;
}

const CaseManagement: React.FC<CaseManagementProps> = ({ plots, onUpdatePlotStage, onViewDossier }) => {
  const [notifications, setNotifications] = useState<{id: string, text: string}[]>([]);

  const auditFiles = plots.filter(p => p.encroached || p.enforcementStage !== EnforcementStage.DETECTION);

  useEffect(() => {
    const timer = setInterval(() => {
      if (Math.random() > 0.8) {
        const zone = ZONES[Math.floor(Math.random() * ZONES.length)];
        const newNotif = { 
          id: Date.now().toString(), 
          text: `InSAR Alert: Potential boundary shift in ${zone.district} sector.` 
        };
        setNotifications(prev => [newNotif, ...prev].slice(0, 3));
        setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== newNotif.id)), 6000);
      }
    }, 12000);
    return () => clearInterval(timer);
  }, []);

  const getStageStyle = (stage: EnforcementStage) => {
    switch (stage) {
      case EnforcementStage.DETECTION: return 'bg-red-50 text-red-700 border-red-200';
      case EnforcementStage.VERIFICATION: return 'bg-orange-50 text-orange-700 border-orange-200';
      case EnforcementStage.NOTICE_ISSUED: return 'bg-blue-50 text-blue-700 border-blue-200';
      case EnforcementStage.LEGAL_ACTION: return 'bg-slate-900 text-white border-slate-800';
      case EnforcementStage.RESOLVED: return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col bg-[#f8fafc]">
      <div className="p-10 border-b border-slate-200 bg-white flex items-center justify-between shadow-sm shrink-0 z-10">
        <div className="animate-in slide-in-from-left duration-700">
           <div className="flex items-center gap-2 mb-3">
             <div className="w-1.5 h-4 bg-[#003366] rounded-full shadow-[0_0_8px_#003366]"></div>
             <p className="text-[#003366] text-[10px] font-black uppercase tracking-[0.4em]">Enforcement Operations</p>
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">Audit Compliance Pipeline</h2>
        </div>
        
        <div className="flex flex-col items-end gap-2 overflow-hidden h-12 w-[380px]">
           {notifications.map(n => (
             <div key={n.id} className="text-[9px] font-black text-[#003366] animate-in slide-in-from-right duration-500 bg-blue-50 px-4 py-2 rounded-md border border-blue-100 whitespace-nowrap shadow-sm hover:shadow-md transition-shadow cursor-default">
               <span className="opacity-50 mr-2 animate-pulse">SIGNAL:</span> {n.text}
             </div>
           ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-10 scroll-smooth">
        <div className="max-w-6xl mx-auto space-y-6">
          {auditFiles.map((plot, idx) => {
            const zone = ZONES.find(z => z.id === plot.zoneId);
            const penaltyVal = (plot.encroachmentAreaM2 * (zone?.leaseRatePerSqm || 0) * (zone?.penaltyMultiplier || 1));
            const isResolved = plot.enforcementStage === EnforcementStage.RESOLVED;

            return (
              <div key={plot.id} 
                className={`bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden hover:-translate-y-1 stagger-${(idx % 5) + 1} group ${isResolved ? 'opacity-75 grayscale-[0.3]' : ''}`}
              >
                <div className="flex h-full">
                  <div className={`w-2 shrink-0 transition-colors duration-500 ${isResolved ? 'bg-green-500' : (plot.severity === 'CRITICAL' ? 'bg-red-600 shadow-[2px_0_15px_rgba(220,38,38,0.4)]' : 'bg-orange-500 shadow-[2px_0_15px_rgba(249,115,22,0.4)]')}`} />
                  <div className="flex-1 p-8 flex flex-col lg:flex-row items-center justify-between gap-10 relative">
                    <div className="absolute inset-0 bg-slate-50 translate-y-full group-hover:translate-y-0 transition-transform duration-500 opacity-30 pointer-events-none"></div>
                    
                    <div className="flex-1 relative z-10">
                      <div className="flex items-center gap-4 mb-5">
                        <span className={`px-4 py-1.5 rounded text-[9px] font-black uppercase border transition-all duration-500 shadow-sm ${getStageStyle(plot.enforcementStage)}`}>
                          {plot.enforcementStage.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase hover:text-slate-600 transition-colors">{plot.district} • {plot.allotmentId}</span>
                      </div>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight mb-3 uppercase group-hover:text-[#003366] transition-colors">{plot.industryName}</h3>
                      <div className="flex flex-wrap gap-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-md border border-slate-100 shadow-sm group-hover:border-[#003366]/20 transition-all">
                          <svg className="w-3.5 h-3.5 text-[#003366]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                          {zone?.name}
                        </div>
                        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-md border border-slate-100 shadow-sm group-hover:border-[#003366]/20 transition-all">
                          <svg className="w-3.5 h-3.5 text-[#003366]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                          Officer: <span className="text-slate-600">{plot.officerAssigned}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-10 text-center shrink-0 relative z-10">
                      <div className="transition-transform group-hover:scale-110 duration-500">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Fiscal Impact</p>
                        <p className={`text-xl font-black ${isResolved ? 'text-green-600' : 'text-red-600'}`}>
                          {isResolved ? 'SETTLED' : `₹${(penaltyVal / 100000).toFixed(1)}L`}
                        </p>
                      </div>
                      <div className="transition-transform group-hover:scale-110 duration-500">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Audit Score</p>
                        <p className="text-xl font-black text-slate-800">{(plot.detectionConfidence * 100).toFixed(0)}%</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2.5 min-w-[180px] relative z-10">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => onUpdatePlotStage(plot.id, 'advance')}
                          disabled={isResolved}
                          className="flex-1 py-4 bg-[#003366] text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-900/10 hover:bg-blue-800 hover:shadow-blue-900/30 transition-all active:scale-95 disabled:opacity-50"
                        >
                          {isResolved ? 'ARCHIVED' : 'Advance'}
                        </button>
                        <button 
                          onClick={() => onUpdatePlotStage(plot.id, 'revert')}
                          disabled={plot.enforcementStage === EnforcementStage.DETECTION}
                          className="px-5 py-4 bg-white text-slate-400 border border-slate-200 rounded-lg hover:text-[#003366] hover:bg-slate-50 hover:border-[#003366]/30 transition-all active:scale-95 disabled:opacity-20"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        </button>
                      </div>
                      <button 
                        onClick={() => onViewDossier(plot.id)}
                        className="w-full py-4 bg-white border border-slate-300 text-slate-800 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-[#003366] hover:text-white hover:border-[#003366] transition-all shadow-sm active:scale-[0.98]"
                      >
                        File Dossier
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {auditFiles.length === 0 && (
            <div className="py-24 text-center bg-white rounded-2xl border border-dashed border-slate-300 animate-pulse">
               <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-100">
                  <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
               </div>
               <p className="text-slate-400 font-black uppercase tracking-widest text-xs">All industrial sectors synchronized • No variance detected</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CaseManagement;