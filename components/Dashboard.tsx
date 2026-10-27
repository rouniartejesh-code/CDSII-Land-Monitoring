
import React, { useState, useMemo } from 'react';
import { Plot, District, EnforcementStage, DetectionSeverity } from '../types';
import { ZONES } from '../mockData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardProps {
  plots: Plot[];
  onPlotSelect: (plot) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ plots, onPlotSelect }) => {
  const [selectedDistrict, setSelectedDistrict] = useState<District | 'All'>('All');

  const filteredPlots = useMemo(() => {
    return selectedDistrict === 'All' ? plots : plots.filter(p => p.district === selectedDistrict);
  }, [selectedDistrict, plots]);

  const activeZones = useMemo(() => {
    return selectedDistrict === 'All' ? ZONES : ZONES.filter(z => z.district === selectedDistrict);
  }, [selectedDistrict]);

  const criticalAssets = useMemo(() => {
    return [...plots]
      .filter(p => (p.encroached && p.enforcementStage !== EnforcementStage.RESOLVED) || p.statutoryDues.totalOutstanding > 200000)
      .sort((a, b) => b.statutoryDues.totalOutstanding - a.statutoryDues.totalOutstanding)
      .slice(0, 5);
  }, [plots]);

  const statsCalculation = useMemo(() => {
    let totalExposure = 0;
    let totalStatutoryOutstanding = 0;
    
    const alerts = {
      critical: 0,
      warning: 0,
      total: 0
    };

    filteredPlots.forEach(plot => {
      totalStatutoryOutstanding += plot.statutoryDues.totalOutstanding;

      if (plot.encroached && plot.enforcementStage !== EnforcementStage.RESOLVED) {
        alerts.total++;
        if (plot.severity === DetectionSeverity.CRITICAL) alerts.critical++;
        else alerts.warning++;

        const zone = ZONES.find(z => z.id === plot.zoneId);
        if (zone) {
          const basePenalty = (plot.encroachmentAreaM2 * zone.leaseRatePerSqm) * zone.penaltyMultiplier;
          totalExposure += basePenalty;
        }
      }
    });

    return {
      exposure: (totalExposure / 10000000).toFixed(2),
      statutory: (totalStatutoryOutstanding / 10000000).toFixed(2),
      alerts,
      utilization: 88.4,
      recoveryRate: 64
    };
  }, [filteredPlots]);

  const chartData = useMemo(() => {
    return activeZones.map(z => {
      const zonePlots = plots.filter(p => p.zoneId === z.id);
      const activeViolations = zonePlots.filter(p => p.encroached && p.enforcementStage !== EnforcementStage.RESOLVED).length;
      return {
        name: z.name.split(' ')[0],
        Violations: activeViolations,
        Risk: Math.round((activeViolations / (zonePlots.length || 1)) * 100)
      };
    });
  }, [activeZones, plots]);

  return (
    <div className="flex-1 overflow-y-auto bg-[#f8fafc] pb-20 scroll-smooth">
      <div className="p-10 space-y-10 max-w-[1600px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-200 pb-10 gap-6 animate-in fade-in duration-700">
           <div>
              <div className="flex items-center gap-2 mb-3">
                 <div className="w-1.5 h-4 bg-[#003366] rounded-full shadow-[0_0_8px_#003366]"></div>
                 <p className="text-[#003366] text-[10px] font-black uppercase tracking-[0.4em]">Administrative Center</p>
              </div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">Industrial Intelligence Overview</h2>
           </div>
           <div className="flex items-center gap-4">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Division Focus:</span>
              <select 
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value as any)}
                className="bg-white border border-slate-200 px-6 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-[#003366]/5 transition-all shadow-sm cursor-pointer"
              >
                <option value="All">State-Wide Dashboard</option>
                <option value="Raipur">Raipur District</option>
                <option value="Durg">Durg District</option>
                <option value="Bilaspur">Bilaspur District</option>
                <option value="Korba">Korba District</option>
              </select>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Space Utilization', val: `${statsCalculation.utilization}%`, border: 'border-[#003366]', text: 'text-[#003366]', sub: 'State Industrial Land', trend: '+1.2% Gain', trendCol: 'text-green-600' },
            { label: 'Variance Alerts', val: statsCalculation.alerts.total, border: 'border-red-600', text: 'text-red-600', sub: 'Detection Pipeline', trend: `${statsCalculation.alerts.critical} Critical`, trendCol: 'text-red-700 bg-red-50 px-2 py-0.5 rounded' },
            { label: 'Estimated Penalty', val: `₹${statsCalculation.exposure}Cr`, border: 'border-slate-800', text: 'text-slate-900', sub: 'Potential Recovery', trend: 'Audit Confirmed', trendCol: 'text-blue-600' },
            { label: 'Statutory Arrears', val: `₹${statsCalculation.statutory}Cr`, border: 'border-[#003366]', text: 'text-[#003366]', sub: 'Outstanding Dues', trend: 'Recovery Mode', trendCol: 'text-orange-600 bg-orange-50 px-2 py-0.5 rounded' },
          ].map((item, idx) => (
            <div key={item.label} className={`bg-white p-8 rounded-2xl border border-slate-200 shadow-sm border-t-4 ${item.border} transition-all duration-500 hover:shadow-xl hover:-translate-y-1 stagger-${idx + 1}`}>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">{item.label}</p>
              <h3 className={`text-4xl font-black ${item.text} mb-4 tracking-tighter`}>{item.val}</h3>
              <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                 <span className="text-[9px] font-black text-slate-400 uppercase">{item.sub}</span>
                 <span className={`text-[9px] font-black uppercase tracking-widest ${item.trendCol}`}>{item.trend}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-10 rounded-2xl border border-slate-200 shadow-sm animate-in zoom-in-95 duration-700">
              <div className="flex items-center justify-between mb-10">
                <h3 className="text-[11px] font-black text-slate-900 tracking-[0.3em] uppercase">Variance Index by Industrial Zone</h3>
                <div className="flex gap-4">
                   <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-[#003366]"></div><span className="text-[8px] font-black text-slate-400 uppercase">Risk Value</span></div>
                   <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-red-600"></div><span className="text-[8px] font-black text-slate-400 uppercase">Violations</span></div>
                </div>
              </div>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#94a3b8', fontWeight: 900}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#94a3b8', fontWeight: 900}} />
                    <Tooltip 
                      cursor={{fill: '#f8fafc'}} 
                      contentStyle={{backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'}} 
                      labelStyle={{fontSize: '10px', fontWeight: '900', color: '#003366', textTransform: 'uppercase', marginBottom: '8px'}}
                    />
                    <Bar dataKey="Risk" fill="#003366" radius={[6, 6, 0, 0]} barSize={32} />
                    <Bar dataKey="Violations" fill="#dc2626" radius={[6, 6, 0, 0]} barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-10 rounded-2xl border border-slate-200 shadow-sm stagger-3">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-[11px] font-black text-slate-900 tracking-[0.3em] uppercase">High Priority Enforcement</h3>
                <span className="text-[9px] font-black bg-blue-50 text-[#003366] px-4 py-1.5 rounded-md border border-blue-100 uppercase tracking-widest animate-pulse">Audit Active</span>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {criticalAssets.map((p, idx) => (
                  <button 
                    key={p.id}
                    onClick={() => onPlotSelect(p)}
                    className={`flex items-center justify-between p-6 bg-slate-50 hover:bg-white border border-slate-200 hover:border-[#003366] rounded-xl transition-all duration-300 group hover:shadow-lg hover:-translate-x-1 stagger-${(idx % 5) + 1}`}
                  >
                    <div className="flex items-center gap-5">
                      <div className={`w-3.5 h-3.5 rounded-full ${p.encroached ? 'bg-red-600 animate-pulse shadow-[0_0_8px_#dc2626]' : 'bg-[#003366]'}`}></div>
                      <div className="text-left">
                        <p className="text-[11px] font-black text-slate-800 uppercase truncate max-w-[200px]">{p.industryName}</p>
                        <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-1">{p.allotmentId}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-12">
                      <div className="text-right">
                        <p className="text-[11px] font-black text-red-600 tracking-widest uppercase">₹{(p.statutoryDues.totalOutstanding/100000).toFixed(1)}L</p>
                        <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Arrears</p>
                      </div>
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-slate-300 group-hover:text-[#003366] border border-slate-200 group-hover:border-[#003366] transition-all transform group-hover:rotate-90">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M9 5l7 7-7 7"/></svg>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-[#003366] p-10 rounded-2xl text-white shadow-2xl flex flex-col justify-between relative overflow-hidden stagger-4 animate-soft-pulse">
            <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
              <svg className="w-48 h-48" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <div className="relative z-10">
              <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-blue-200 mb-10">Integration Health</h3>
              <div className="space-y-8">
                 {[
                   { label: 'Satellite Feed', val: 100, col: 'bg-blue-400' },
                   { label: 'Drone Validation', val: 98, col: 'bg-emerald-400' },
                   { label: 'Sync Latency', val: 0.4, col: 'bg-orange-400', unit: 'ms' },
                 ].map(item => (
                   <div key={item.label}>
                      <div className="flex justify-between text-[10px] font-black uppercase mb-2.5 tracking-widest">
                        <span className="text-blue-100/60">{item.label}</span>
                        <span>{item.unit ? `${item.val}${item.unit}` : `${item.val}%`}</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className={`h-full ${item.col} transition-all duration-1000 shadow-[0_0_8px_currentColor]`} style={{width: item.unit ? '10%' : `${item.val}%`}}></div>
                      </div>
                   </div>
                 ))}
              </div>
            </div>
            
            <div className="mt-12 p-6 bg-white/5 rounded-xl border border-white/10 relative z-10 hover:bg-white/10 transition-colors duration-500 cursor-default">
               <div className="flex items-center gap-2 mb-3">
                 <div className="w-2 h-2 bg-blue-300 rounded-full animate-pulse shadow-[0_0_10px_#93c5fd]"></div>
                 <p className="text-[9px] font-black text-blue-100 uppercase tracking-[0.2em]">Butterscotch Active</p>
               </div>
               <p className="text-[10px] text-blue-100/50 font-medium leading-relaxed uppercase tracking-tight">
                 Operational status: OPTIMAL. Spatial telemetry synchronized across all sectors.
               </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;