import React, { useState, useRef } from 'react';
import { Plot, District, PlotStatus } from '../types';

interface DataManagementProps {
  plots: Plot[];
  onAddPlot: (plot: Partial<Plot>) => void;
  onViewDossier: (plotId: string) => void;
  onResetData: () => void;
  onSyncData: () => void;
}

const DataManagement: React.FC<DataManagementProps> = ({ plots, onAddPlot, onViewDossier, onResetData, onSyncData }) => {
  const [formData, setFormData] = useState({
    industryName: '',
    allotmentId: '',
    plotNumber: '',
    district: 'Raipur' as District,
    areaM2: '',
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    fileName: string,
    fileType: string,
    discoveredPlots: number,
    conflicts: number
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.industryName || !formData.allotmentId) return;

    onAddPlot({
      ...formData,
      areaM2: Number(formData.areaM2),
      status: PlotStatus.VACANT
    });

    setFormData({
      industryName: '',
      allotmentId: '',
      plotNumber: '',
      district: 'Raipur',
      areaM2: '',
    });
  };

  const triggerSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      onSyncData();
      setIsSyncing(false);
    }, 1500);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadResult(null);

    // Simulated Government Data Extraction (PDF OCR / GeoJSON Parsing)
    setTimeout(() => {
      setIsUploading(false);
      setUploadResult({
        fileName: file.name,
        fileType: file.name.split('.').pop()?.toUpperCase() || 'UNKNOWN',
        discoveredPlots: Math.floor(Math.random() * 5) + 1,
        conflicts: Math.floor(Math.random() * 2)
      });
    }, 2500);
  };

  const commitImportedData = () => {
    if (uploadResult) {
      // Simulate adding the discovered plots
      for (let i = 0; i < uploadResult.discoveredPlots; i++) {
        onAddPlot({
          industryName: `Extracted Govt Asset ${Math.floor(Math.random() * 100)}`,
          allotmentId: `CSIDC-EXT-${Math.floor(1000 + Math.random() * 9000)}`,
          district: 'Raipur',
          areaM2: Math.floor(Math.random() * 10000 + 5000),
          status: PlotStatus.VACANT
        });
      }
      setUploadResult(null);
    }
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col bg-[#f8fafc]">
      <div className="p-10 border-b border-slate-200 bg-white flex items-center justify-between shadow-sm shrink-0 z-10">
        <div>
           <div className="flex items-center gap-2 mb-3">
             <div className="w-1.5 h-4 bg-[#003366] rounded-full shadow-[0_0_8px_#003366]"></div>
             <p className="text-[#003366] text-[10px] font-black uppercase tracking-[0.4em]">Master Asset Registry</p>
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">Industrial Ledger Management</h2>
        </div>
        <div className="flex gap-4">
           <button 
             onClick={triggerSync}
             disabled={isSyncing}
             className="px-6 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm"
           >
             <svg className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
             {isSyncing ? 'Syncing...' : 'Compare with Master'}
           </button>
           <button 
             onClick={onResetData}
             className="px-6 py-3 bg-red-50 border border-red-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-sm"
           >
             Wipe Current Data
           </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-10 scroll-smooth">
        <div className="max-w-6xl mx-auto space-y-10">
          
          {/* Top Grid: Direct Entry + File Import */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Government Data Import Panel */}
            <section className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden flex flex-col">
              <div className="bg-[#003366] px-8 py-6">
                <h3 className="text-[11px] font-black text-white uppercase tracking-[0.3em]">Official Data Ingestion</h3>
                <p className="text-[8px] font-black text-blue-200 uppercase tracking-widest mt-1">PDF • SHP • GEOJSON</p>
              </div>
              <div className="p-8 flex-1 flex flex-col items-center justify-center text-center">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  className="hidden" 
                  accept=".pdf,.shp,.geojson,.json"
                />
                
                {isUploading ? (
                  <div className="space-y-4 animate-pulse">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto text-[#003366]">
                      <svg className="w-8 h-8 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    </div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Parsing Telemetry Layers...</p>
                  </div>
                ) : uploadResult ? (
                  <div className="w-full space-y-6">
                    <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl text-left">
                       <div className="flex items-center justify-between mb-4">
                          <span className="text-[8px] font-black bg-[#003366] text-white px-2 py-1 rounded">{uploadResult.fileType}</span>
                          <span className="text-[8px] font-black text-slate-400 uppercase truncate max-w-[120px]">{uploadResult.fileName}</span>
                       </div>
                       <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-[9px] font-black text-slate-500 uppercase">New Assets Discovered:</span>
                            <span className="text-[9px] font-black text-[#003366]">{uploadResult.discoveredPlots}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[9px] font-black text-slate-500 uppercase">Boundary Conflicts:</span>
                            <span className={`text-[9px] font-black ${uploadResult.conflicts > 0 ? 'text-red-600' : 'text-green-600'}`}>{uploadResult.conflicts}</span>
                          </div>
                       </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setUploadResult(null)} className="flex-1 py-3 bg-slate-100 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-500">Discard</button>
                      <button onClick={commitImportedData} className="flex-[2] py-3 bg-[#003366] text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">Merge Data</button>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full group"
                  >
                    <div className="w-20 h-20 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-50 group-hover:border-[#003366]/30 transition-all duration-500">
                      <svg className="w-8 h-8 text-slate-300 group-hover:text-[#003366] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                    </div>
                    <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest group-hover:text-[#003366]">Import Gov File</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-2">Click to select spatial assets</p>
                  </button>
                )}
              </div>
            </section>

            {/* Direct Ledger Entry (The Form) */}
            <section className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
              <div className="bg-slate-50 px-10 py-6 flex justify-between items-center border-b border-slate-100">
                <h3 className="text-[11px] font-black text-slate-600 uppercase tracking-[0.3em]">Manual Ledger Overwrite</h3>
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Admin Authorization Layer</span>
              </div>
              
              <form onSubmit={handleSubmit} className="p-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Industry Legal Name</label>
                    <input 
                      type="text" 
                      required
                      value={formData.industryName}
                      onChange={(e) => setFormData({...formData, industryName: e.target.value})}
                      placeholder="Enter full legal name"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-[11px] font-black uppercase outline-none focus:ring-4 focus:ring-blue-100 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Allotment UID</label>
                    <input 
                      type="text" 
                      required
                      value={formData.allotmentId}
                      onChange={(e) => setFormData({...formData, allotmentId: e.target.value})}
                      placeholder="CSIDC-P-XXX"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-[11px] font-black uppercase outline-none focus:ring-4 focus:ring-blue-100 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Survey Area (sqm)</label>
                    <input 
                      type="number" 
                      required
                      value={formData.areaM2}
                      onChange={(e) => setFormData({...formData, areaM2: e.target.value})}
                      placeholder="Total area in m2"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-[11px] font-black uppercase outline-none focus:ring-4 focus:ring-blue-100 transition-all"
                    />
                  </div>
                  <div className="flex items-end">
                    <button type="submit" className="w-full bg-[#003366] text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:shadow-blue-900/20 active:scale-95 transition-all">
                      Update Central Ledger
                    </button>
                  </div>
                </div>
              </form>
            </section>
          </div>

          {/* Detailed Registry Table */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <h3 className="text-[11px] font-black text-slate-900 tracking-[0.3em] uppercase">Active Ledger Records</h3>
                 <span className="px-3 py-1 bg-[#003366] text-white text-[9px] font-black rounded-full shadow-lg">{plots.length} Total</span>
              </div>
              <div className="flex items-center gap-6">
                 <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500"></div><span className="text-[8px] font-black text-slate-400 uppercase">Registry Verified</span></div>
                 <div className="h-4 w-px bg-slate-200"></div>
                 <button onClick={onResetData} className="text-[9px] font-black text-red-400 uppercase tracking-widest hover:text-red-600 transition-colors">Emergency Clear</button>
              </div>
            </div>
            
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200">
                    <th className="px-10 py-6 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Asset Asset Details</th>
                    <th className="px-10 py-6 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Spatial Area</th>
                    <th className="px-10 py-6 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Data Origin</th>
                    <th className="px-10 py-6 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] text-right">Administrative Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {plots.map((plot) => (
                    <tr key={plot.id} className="hover:bg-slate-50 transition-all group">
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-6">
                           <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xs font-black shadow-inner ${plot.encroached ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                             {plot.industryName.charAt(0)}
                           </div>
                           <div>
                              <p className="text-[11px] font-black text-slate-800 uppercase leading-none group-hover:text-[#003366] transition-colors">{plot.industryName}</p>
                              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.15em] mt-2 group-hover:text-slate-500">{plot.allotmentId}</p>
                           </div>
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <div className="space-y-1">
                          <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight">{plot.areaM2.toLocaleString()} <span className="text-slate-300">sqm</span></p>
                          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{plot.district} Jurisdiction</p>
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <span className={`px-4 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest shadow-sm ${plot.lastSurveySource === 'On-Site Drawing' ? 'bg-orange-50 text-orange-600 border border-orange-100' : 'bg-slate-50 text-slate-500 border border-slate-200'}`}>
                          {plot.lastSurveySource}
                        </span>
                      </td>
                      <td className="px-10 py-8 text-right">
                        <button 
                          onClick={() => onViewDossier(plot.id)}
                          className="px-8 py-3.5 bg-white border-2 border-[#003366] text-[#003366] rounded-xl text-[9px] font-black uppercase tracking-widest transition-all hover:bg-[#003366] hover:text-white active:scale-95 shadow-lg shadow-blue-900/5 group-hover:shadow-blue-900/10"
                        >
                          Access File
                        </button>
                      </td>
                    </tr>
                  ))}
                  {plots.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-10 py-32 text-center">
                        <div className="flex flex-col items-center gap-4 opacity-30">
                          <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                          <p className="text-[11px] font-black uppercase tracking-[0.5em]">Central Registry Offline • Ingest Data to Start</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default DataManagement;
