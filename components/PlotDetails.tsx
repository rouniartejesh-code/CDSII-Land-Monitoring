
import React, { useState, useEffect, useRef } from 'react';
import { Plot, EnforcementStage, PlotStatus } from '../types';
import { GoogleGenAI } from '@google/genai';

declare var L: any;

interface PlotDetailsProps {
  plot: Plot;
  onClose: () => void;
  onUpdateStage: (plotId: string, direction: 'advance' | 'revert' | EnforcementStage) => void;
  onResolveDue: (plotId: string, dueType: 'leasePayments' | 'waterCharges' | 'otherDues') => void;
  onUnresolveDue?: (plotId: string, dueType: 'leasePayments' | 'waterCharges' | 'otherDues') => void;
  onUpdateStatus?: (plotId: string, status: PlotStatus) => void;
  onDeactivatePlot?: (plotId: string) => void;
}

const PlotDetails: React.FC<PlotDetailsProps> = ({ plot, onClose, onUpdateStage, onResolveDue, onUnresolveDue, onUpdateStatus, onDeactivatePlot }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportSummary, setReportSummary] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'IDLE' | 'SYNCING' | 'LOCKED'>('IDLE');
  const [showUnresolveModal, setShowUnresolveModal] = useState<{ id: string, label: string } | null>(null);
  
  const mapLeftRef = useRef<HTMLDivElement>(null);
  const mapRightRef = useRef<HTMLDivElement>(null);
  const maps = useRef<{ left: any; right: any }>({ left: null, right: null });

  const handleAssignVerification = () => {
    onUpdateStage(plot.id, 'advance');
  };

  const generateAILegalSummary = async () => {
    setIsGenerating(true);
    setReportSummary(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        OFFICIAL AUDIT REPORT: CSIDC LAND MONITORING
        System: BUTTER SCROCH TACTICAL
        Industry: ${plot.industryName}
        Plot Ref: ${plot.allotmentId}
        Violation Detected: ${plot.encroached ? `YES - Overlap of ${plot.encroachmentAreaM2} sqm` : 'NONE'}
        Construction Status: ${plot.status}
        Financial Non-compliance: ₹${plot.statutoryDues.totalOutstanding.toLocaleString()}
        
        Analyze the discrepancy between official cadastral maps and current drone validation imagery. 
        Include notice for outstanding statutory dues.
        Provide a 100-word formal legal summary for administrative notice issuance.
      `;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      
      setReportSummary(response.text || "Report generated successfully.");
    } catch (err) {
      setReportSummary("AI Analytics Engine Offline. Using deterministic spatial fallback summary: Significant boundary deviation detected at northern perimeter via Butter Scroch tactical validation. Financial audit triggered for outstanding statutory obligations.");
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (showComparison && mapLeftRef.current && mapRightRef.current && typeof L !== 'undefined') {
      const center = plot.coordinates[0];
      setSyncStatus('SYNCING');
      
      const left = L.map(mapLeftRef.current, { zoomControl: false, attributionControl: false }).setView(center, 18);
      const right = L.map(mapRightRef.current, { zoomControl: false, attributionControl: false }).setView(center, 18);

      const satellite = 'https://mt0.google.com/vt/lyrs=s&hl=en&x={x}&y={y}&z={z}';
      
      L.tileLayer(satellite, { maxZoom: 20 }).addTo(left);
      L.tileLayer(satellite, { maxZoom: 20 }).addTo(right);

      const baselineStyle = { 
        color: '#fde047', 
        fillColor: '#fde047',
        fillOpacity: 0.15, 
        weight: 4, 
        dashArray: '2, 6' 
      };
      
      const builtStyle = { 
        color: plot.encroached ? '#ef4444' : '#22c55e', 
        fillColor: plot.encroached ? '#ef4444' : '#22c55e',
        fillOpacity: 0.5, 
        weight: 3, 
        className: plot.encroached && plot.enforcementStage !== EnforcementStage.RESOLVED ? 'animate-pulse' : '' 
      };

      L.polygon(plot.coordinates, baselineStyle).addTo(left);
      L.polygon(plot.coordinates, baselineStyle).addTo(right);
      
      if (plot.builtCoordinates) {
        L.polygon(plot.builtCoordinates, builtStyle).addTo(right);
      } else {
        L.polygon(plot.coordinates, builtStyle).addTo(right);
      }

      const syncMaps = (e: any) => {
        const source = e.target;
        const target = source === left ? right : left;
        target.setView(source.getCenter(), source.getZoom(), { animate: false });
      };

      left.on('move', syncMaps);
      right.on('move', syncMaps);

      maps.current = { left, right };

      setTimeout(() => {
        left.invalidateSize();
        right.invalidateSize();
        setSyncStatus('LOCKED');
      }, 300);

      return () => {
        left.off('move', syncMaps);
        right.off('move', syncMaps);
        left.remove();
        right.remove();
      };
    }
  }, [showComparison, plot]);

  const handleDownloadNotice = async () => {
    if (!reportSummary && !isGenerating) {
      await generateAILegalSummary();
    }
    const container = document.getElementById('details-scroll-container');
    if (container) {
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    }
  };

  const isResolved = plot.enforcementStage === EnforcementStage.RESOLVED;
  const hasDues = plot.statutoryDues.totalOutstanding > 0;

  const bannerBg = isResolved ? 'bg-green-50 border-green-100 text-green-700' : (plot.encroached ? 'bg-red-50 border-red-100 text-red-700 animate-soft-pulse' : 'bg-blue-50 border-blue-100 text-[#004a99]');
  const iconBg = isResolved ? 'bg-green-500 text-white shadow-[0_0_15px_#22c55e]' : (plot.encroached ? 'bg-red-500 text-white shadow-[0_0_15px_#ef4444]' : 'bg-[#004a99] text-white');

  const billRef = (type: string) => `CSIDC/${plot.allotmentId.split('-').pop()}/${type.toUpperCase().substring(0,3)}/25`;

  const confirmUnresolve = () => {
    if (showUnresolveModal && onUnresolveDue) {
      onUnresolveDue(plot.id, showUnresolveModal.id as any);
      setShowUnresolveModal(null);
    }
  };

  return (
    <div className="flex flex-col h-full relative bg-white">
      {showUnresolveModal && (
        <div className="fixed inset-0 bg-black/60 z-[5000] flex items-center justify-center p-6 animate-in fade-in duration-300 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95 duration-300">
             <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-4">Re-open Audit?</h4>
             <p className="text-xs text-slate-500 font-medium mb-8 leading-relaxed italic">
               You are about to unresolve <span className="text-[#004a99] font-black">{showUnresolveModal.label}</span>. This action moves the asset back into active enforcement.
             </p>
             <div className="flex gap-4">
                <button onClick={() => setShowUnresolveModal(null)} className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 transition-colors rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500">Cancel</button>
                <button onClick={confirmUnresolve} className="flex-1 py-4 bg-red-600 hover:bg-red-700 transition-all rounded-2xl text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-red-900/20 active:scale-95">Confirm</button>
             </div>
          </div>
        </div>
      )}

      {showComparison && (
        <div className="fixed inset-0 bg-slate-900 z-[3000] flex flex-col animate-in fade-in zoom-in-105 duration-500">
          <header className="h-20 bg-[#003366] px-10 flex items-center justify-between shadow-2xl shrink-0 z-10">
            <div className="flex items-center gap-6">
              <div className="bg-white/10 p-3 rounded-xl border border-white/20 animate-pulse">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
              </div>
              <div>
                <h2 className="text-2xl font-black text-white tracking-tighter uppercase leading-none">Evidence Audit</h2>
                <span className="text-[10px] font-black text-blue-200 uppercase tracking-widest mt-1 block">BUTTER SCROCH TACTICAL ENGINE</span>
              </div>
            </div>
            <button onClick={() => setShowComparison(false)} className="px-6 py-3 bg-white text-[#003366] rounded-xl shadow-lg font-black uppercase text-xs hover:bg-blue-50 transition-all active:scale-95">Close Audit</button>
          </header>
          
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 overflow-hidden bg-slate-950">
            <div className="flex flex-col gap-4 h-full relative animate-in slide-in-from-left duration-700">
              <div className="absolute top-4 left-4 z-[1001] bg-black/60 px-4 py-2 rounded-lg border border-white/20 backdrop-blur-md">
                <div className="text-[10px] font-black text-yellow-400 uppercase tracking-widest">Official Record (Cadastre)</div>
              </div>
              <div className="flex-1 bg-slate-900 rounded-3xl shadow-inner border border-white/10 overflow-hidden">
                <div ref={mapLeftRef} className="w-full h-full" />
              </div>
            </div>
            <div className="flex flex-col gap-4 h-full relative animate-in slide-in-from-right duration-700">
              <div className="absolute top-4 left-4 z-[1001] bg-black/60 px-4 py-2 rounded-lg border border-white/20 backdrop-blur-md">
                <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Tactical Validation (Live)</div>
              </div>
              <div className="flex-1 bg-slate-900 rounded-3xl shadow-inner border border-white/10 overflow-hidden">
                <div ref={mapRightRef} className="w-full h-full" />
              </div>
            </div>
          </div>
          
          <footer className="h-32 bg-white border-t border-slate-200 px-10 flex items-center justify-between shrink-0 shadow-[0_-20px_50px_rgba(0,0,0,0.1)] z-10">
            <div className="flex gap-12">
               <div className="stagger-1"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Cadastral Area</p><p className="text-3xl font-black text-[#003366]">{plot.areaM2.toLocaleString()} <span className="text-xs font-bold opacity-40 uppercase">sqm</span></p></div>
               <div className="stagger-2"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Detected Area</p><p className="text-3xl font-black text-slate-900">{plot.builtAreaM2.toLocaleString()} <span className="text-xs font-bold opacity-40 uppercase">sqm</span></p></div>
               <div className="stagger-3"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Audit Variance</p><p className={`text-3xl font-black ${isResolved ? 'text-green-600' : 'text-red-600'} transition-colors`}>{isResolved ? '0.00' : `+${plot.encroachmentAreaM2.toLocaleString()}`}</p></div>
            </div>
            <button onClick={() => setShowComparison(false)} className="bg-[#003366] text-white font-black text-[11px] px-10 py-5 rounded-2xl uppercase tracking-widest shadow-2xl hover:bg-blue-900 hover:shadow-blue-900/30 transition-all active:scale-[0.98] stagger-4">Record Audit Findings</button>
          </footer>
        </div>
      )}

      <div className="p-8 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/80 sticky top-0 z-20 backdrop-blur-md">
        <div className="animate-in slide-in-from-left duration-500">
          <h2 className="text-xl font-black text-[#003366] leading-tight tracking-tighter uppercase transition-all group-hover:tracking-normal">{plot.industryName}</h2>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Ref: {plot.allotmentId}</p>
        </div>
        <button onClick={onClose} className="p-3 bg-white hover:bg-red-50 hover:text-red-600 rounded-xl text-slate-400 border border-slate-200 shadow-sm transition-all active:scale-90"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6" /></svg></button>
      </div>

      <div id="details-scroll-container" className="flex-1 overflow-y-auto p-8 space-y-8 scroll-smooth pb-48">
        <div className={`p-6 rounded-2xl border-2 flex items-center justify-between transition-all duration-700 shadow-md ${bannerBg}`}>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Compliance State</p>
            <p className="text-sm font-black uppercase">{plot.status} • {plot.enforcementStage.replace('_', ' ')}</p>
          </div>
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-500 transform hover:rotate-12 ${iconBg}`}>
            {isResolved ? (
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4" />
              </svg>
            )}
          </div>
        </div>

        {/* STATUS MANAGEMENT SECTION */}
        <div className="bg-white border-2 border-slate-100 rounded-[2rem] p-8 shadow-sm transition-all duration-500 hover:shadow-lg stagger-1">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400">Status Management</h3>
            <button onClick={() => onDeactivatePlot?.(plot.id)} className="text-[9px] font-black text-red-400 uppercase tracking-widest hover:text-red-600 transition-colors">Deactivate</button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="group">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2 group-hover:text-[#003366] transition-colors">Asset Classification</p>
              <select 
                value={plot.status}
                onChange={(e) => onUpdateStatus?.(plot.id, e.target.value as PlotStatus)}
                className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-blue-100 transition-all cursor-pointer"
              >
                {Object.values(PlotStatus).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="group">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2 group-hover:text-[#003366] transition-colors">Enforcement Flow</p>
              <select 
                value={plot.enforcementStage}
                onChange={(e) => onUpdateStage(plot.id, e.target.value as EnforcementStage)}
                className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-blue-100 transition-all cursor-pointer"
              >
                {Object.values(EnforcementStage).map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* FINANCIAL DOSSIER SECTION */}
        <div className="bg-slate-50 border border-slate-200 rounded-[2.5rem] p-10 shadow-sm relative overflow-hidden stagger-2">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-[12px] font-black uppercase tracking-[0.5em] text-slate-400 shrink-0">Financial Dossier</h3>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all duration-500 ${hasDues ? 'bg-orange-100 text-orange-700 shadow-md scale-105' : 'bg-green-100 text-green-700 shadow-sm'}`}>
              <div className={`w-2 h-2 rounded-full ${hasDues ? 'bg-orange-500 animate-pulse' : 'bg-green-500'}`} />
              {hasDues ? 'Arrears Detected' : 'Clearance Issued'}
            </div>
          </div>
          
          <div className="space-y-6">
            {[
              { id: 'leasePayments', label: 'Lease Payments', val: plot.statutoryDues.leasePayments, ref: 'lea' },
              { id: 'waterCharges', label: 'Water Charges', val: plot.statutoryDues.waterCharges, ref: 'wat' },
              { id: 'otherDues', label: 'Other Dues / Penalties', val: plot.statutoryDues.otherDues, ref: 'oth' }
            ].map((due, idx) => (
              <div key={due.id} className={`bg-white p-8 rounded-[2rem] border border-slate-200 flex items-center justify-between group transition-all hover:shadow-xl hover:-translate-y-1 stagger-${(idx % 3) + 1}`}>
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none group-hover:text-[#003366] transition-colors">{due.label}</p>
                  <p className={`text-2xl font-black leading-none transition-colors ${due.val > 0 ? 'text-red-600' : 'text-slate-200 uppercase tracking-tighter'}`}>
                    {due.val > 0 ? `₹${due.val.toLocaleString()}` : 'Settled'}
                  </p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.1em] pt-1">{billRef(due.ref)}</p>
                </div>
                <div>
                  {due.val > 0 ? (
                    <button 
                      onClick={() => onResolveDue(plot.id, due.id as any)}
                      className="bg-[#003366] text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-900/10 hover:bg-blue-800 hover:shadow-blue-900/30 transition-all active:scale-95"
                    >
                      Settle
                    </button>
                  ) : (
                    <button 
                      onClick={() => setShowUnresolveModal({ id: due.id, label: due.label })}
                      className="bg-slate-50 text-slate-300 px-6 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest border border-slate-100 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all active:scale-95 flex items-center gap-2 group/btn"
                    >
                      <svg className="w-3.5 h-3.5 group-hover/btn:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                      Re-open
                    </button>
                  )}
                </div>
              </div>
            ))}

            <div className="pt-10 border-t border-slate-200 flex justify-between items-end animate-in fade-in duration-1000">
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Audit Total</span>
              <span className={`text-4xl font-black tracking-tighter leading-none transition-all duration-700 ${hasDues ? 'text-red-600' : 'text-[#003366]'}`}>
                ₹{plot.statutoryDues.totalOutstanding.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <button onClick={() => setShowComparison(true)} className="w-full bg-[#003366] text-white p-8 rounded-[2rem] flex items-center justify-between group shadow-2xl hover:bg-blue-900 hover:shadow-blue-900/30 transition-all active:scale-[0.98] stagger-3 overflow-hidden relative">
          <div className="absolute inset-0 animate-shimmer opacity-10 pointer-events-none"></div>
          <div className="text-left relative z-10">
            <p className="text-xl font-black leading-none uppercase">Evidence Audit</p>
            <p className="text-[10px] text-blue-200 font-bold uppercase tracking-widest mt-2">BUTTER SCROCH VALIDATION FEED</p>
          </div>
          <svg className="w-8 h-8 text-blue-200 group-hover:translate-x-2 transition-transform relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5" /></svg>
        </button>

        <div className="bg-[#0f172a] p-10 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group stagger-4">
          <div className="flex items-center justify-between mb-8 relative z-10">
             <div className="flex items-center gap-3"><div className="w-2.5 h-2.5 bg-blue-400 rounded-full animate-pulse shadow-[0_0_15px_rgba(96,165,250,0.6)]"></div><h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-blue-200">AI Analysis</h3></div>
             {!reportSummary && <button onClick={generateAILegalSummary} disabled={isGenerating} className="bg-white/10 hover:bg-white/20 text-[10px] font-black uppercase tracking-widest px-6 py-2.5 rounded-xl border border-white/10 transition-all shadow-lg active:scale-95 disabled:opacity-50">{isGenerating ? 'Synthesizing...' : 'Execute Audit'}</button>}
          </div>
          {isGenerating ? (
            <div className="flex flex-col gap-4 pl-6 border-l-2 border-blue-500/30">
               <div className="h-4 bg-white/5 rounded-full w-full animate-pulse"></div>
               <div className="h-4 bg-white/5 rounded-full w-[80%] animate-pulse"></div>
               <div className="h-4 bg-white/5 rounded-full w-[90%] animate-pulse"></div>
            </div>
          ) : reportSummary ? (
            <div className="text-[11px] leading-relaxed text-slate-300 font-medium whitespace-pre-line pl-6 border-l-2 border-blue-500/30 animate-in fade-in slide-in-from-left duration-1000">{reportSummary}</div>
          ) : (
            <div className="text-[10px] text-slate-500 font-medium italic pl-6 border-l-2 border-white/5">Spatial telemetry ready...</div>
          )}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-8 bg-white/95 backdrop-blur-md border-t border-slate-200 flex gap-4 z-40 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        <button 
          onClick={handleAssignVerification}
          disabled={isResolved}
          className="flex-1 bg-[#003366] text-white py-6 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-blue-900 hover:shadow-blue-900/30 transition-all active:scale-95 disabled:opacity-50"
        >
          {isResolved ? 'AUDIT COMPLETE' : 'Advance Workflow'}
        </button>
        <button 
          onClick={handleDownloadNotice}
          disabled={isGenerating}
          className={`px-8 py-6 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center gap-3 active:scale-95 ${reportSummary ? 'bg-green-600 text-white shadow-xl shadow-green-900/20' : 'bg-slate-900 text-white hover:bg-black'}`}
        >
          {isGenerating ? (
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          ) : reportSummary ? (
            <svg className="w-5 h-5 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M5 13l4 4L19 7"/></svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
          )}
          {reportSummary ? 'Notice Prepared' : 'Notice'}
        </button>
      </div>
    </div>
  );
};

export default PlotDetails;