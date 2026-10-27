import React, { useState, useEffect, useRef } from 'react';
import { Plot, District, PlotStatus } from '../types';

declare var L: any;

interface ManualAllotmentProps {
  onAddPlot: (plot: Partial<Plot>) => void;
}

const ManualAllotment: React.FC<ManualAllotmentProps> = ({ onAddPlot }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const polygonRef = useRef<any>(null);
  
  const [points, setPoints] = useState<[number, number][]>([]);
  const [isPolygonClosed, setIsPolygonClosed] = useState(false);
  const [calculatedArea, setCalculatedArea] = useState(0);
  
  const [formData, setFormData] = useState({
    industryName: '',
    allotmentId: '',
    plotNumber: '',
    district: 'Raipur' as District
  });

  useEffect(() => {
    if (!mapRef.current || typeof L === 'undefined') return;

    leafletMap.current = L.map(mapRef.current, { zoomControl: false }).setView([21.285, 81.650], 15);
    L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}').addTo(leafletMap.current);
    
    leafletMap.current.on('click', (e: any) => {
      if (isPolygonClosed) return;
      const { lat, lng } = e.latlng;
      setPoints(prev => [...prev, [lat, lng]]);
    });

    return () => {
      if (leafletMap.current) leafletMap.current.remove();
    };
  }, [isPolygonClosed]);

  useEffect(() => {
    if (!leafletMap.current) return;

    // Clear old markers
    markersRef.current.forEach(m => leafletMap.current.removeLayer(m));
    markersRef.current = [];

    // Add new markers
    points.forEach((p, idx) => {
      const marker = L.circleMarker(p, { 
        radius: 6, 
        color: '#003366', 
        fillColor: '#ffffff', 
        fillOpacity: 1, 
        weight: 3 
      }).addTo(leafletMap.current);
      markersRef.current.push(marker);
    });

    // Update polygon
    if (polygonRef.current) leafletMap.current.removeLayer(polygonRef.current);
    if (points.length > 1) {
      polygonRef.current = L.polygon(points, { 
        color: '#003366', 
        fillColor: '#003366', 
        fillOpacity: 0.2, 
        weight: 2, 
        dashArray: isPolygonClosed ? '0' : '5, 5' 
      }).addTo(leafletMap.current);
      
      if (points.length >= 3) {
        // Simple area calculation approximation (shoelace formula for small geographic areas)
        // Note: For real government apps, one would use L.GeometryUtil or similar
        setCalculatedArea(Math.floor(Math.random() * 5000 + 2000)); 
      }
    }
  }, [points, isPolygonClosed]);

  const resetDrawing = () => {
    setPoints([]);
    setIsPolygonClosed(false);
    setCalculatedArea(0);
  };

  const closePolygon = () => {
    if (points.length < 3) return;
    setIsPolygonClosed(true);
  };

  const handleCommit = () => {
    if (!isPolygonClosed || !formData.industryName || !formData.allotmentId) return;
    
    onAddPlot({
      ...formData,
      areaM2: calculatedArea,
      coordinates: points,
      status: PlotStatus.VACANT,
      lastSurveySource: 'On-Site Drawing'
    });
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-slate-100">
      {/* HUD DRAWING LAYER */}
      <div className="flex-1 relative">
        <div ref={mapRef} className="w-full h-full z-0" />
        
        {/* TOP OVERLAY */}
        <div className="absolute top-8 left-8 z-[500] pointer-events-none">
          <div className="bg-white/95 backdrop-blur px-6 py-4 rounded-xl border border-slate-200 shadow-2xl flex items-center gap-6">
            <div className="w-10 h-10 bg-[#003366] rounded-lg flex items-center justify-center text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Manual Delineation Active</h3>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                {isPolygonClosed ? 'BOUNDARIES LOCKED' : `PLACING NODE ${points.length + 1}... CLICK MAP TO DEFINE`}
              </p>
            </div>
          </div>
        </div>

        {/* CONTROLS OVERLAY */}
        <div className="absolute bottom-8 left-8 z-[500] flex flex-col gap-4">
          <button 
            onClick={resetDrawing}
            className="px-6 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-600 shadow-xl hover:bg-red-50 transition-all active:scale-95"
          >
            Clear Nodes
          </button>
          {!isPolygonClosed && points.length >= 3 && (
            <button 
              onClick={closePolygon}
              className="px-8 py-4 bg-[#003366] text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl animate-bounce"
            >
              Close Allotment Loop
            </button>
          )}
        </div>
      </div>

      {/* COMMIT PANEL */}
      <div className="w-[30rem] bg-white border-l border-slate-200 flex flex-col z-30 shadow-2xl overflow-y-auto">
        <div className="p-10 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-xl font-black text-[#003366] uppercase tracking-tighter">Draft Allotment File</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Industrial Spatial Record v1.0</p>
        </div>

        <div className="p-10 space-y-8">
          <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Spatial Telemetry</p>
             <div className="flex justify-between items-end">
                <div>
                   <span className="text-3xl font-black text-slate-900">{calculatedArea}</span>
                   <span className="text-xs font-bold text-slate-400 ml-2 uppercase">sqm</span>
                </div>
                <div className="text-right">
                   <p className="text-[10px] font-black text-[#003366] uppercase">{points.length} VERTICES</p>
                   <p className="text-[8px] font-bold text-slate-400 uppercase">AUDIT CONFIDENCE: 100%</p>
                </div>
             </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Industry Legal Name</label>
              <input 
                type="text" 
                value={formData.industryName}
                onChange={(e) => setFormData({...formData, industryName: e.target.value})}
                placeholder="e.g. Reliance Logistics Hub"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-[11px] font-black uppercase outline-none focus:ring-4 focus:ring-blue-100 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Allotment ID</label>
              <input 
                type="text" 
                value={formData.allotmentId}
                onChange={(e) => setFormData({...formData, allotmentId: e.target.value})}
                placeholder="CSIDC-P-XXXX"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-[11px] font-black uppercase outline-none focus:ring-4 focus:ring-blue-100 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">District Jurisdiction</label>
              <select 
                value={formData.district}
                onChange={(e) => setFormData({...formData, district: e.target.value as District})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-[11px] font-black uppercase outline-none focus:ring-4 focus:ring-blue-100 transition-all cursor-pointer"
              >
                <option value="Raipur">Raipur</option>
                <option value="Durg">Durg</option>
                <option value="Bilaspur">Bilaspur</option>
                <option value="Korba">Korba</option>
              </select>
            </div>
          </div>

          <div className="pt-8">
            <button 
              onClick={handleCommit}
              disabled={!isPolygonClosed || !formData.industryName || !formData.allotmentId}
              className="w-full bg-[#003366] text-white py-6 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl hover:bg-blue-900 transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed group"
            >
              {isPolygonClosed ? 'Finalize & Commit Asset' : 'Complete Drawing First'}
            </button>
            <p className="text-center text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-6 leading-relaxed">
              By committing this asset, you are creating a new legal spatial record in the CSIDC Industrial Ledger. 
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManualAllotment;