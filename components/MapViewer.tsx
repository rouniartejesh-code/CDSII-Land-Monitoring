
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Plot, PlotStatus, EnforcementStage } from '../types';

declare var L: any;

interface MapViewerProps {
  plots: Plot[];
  selectedPlot: Plot | null;
  setSelectedPlot: (plot: Plot | null) => void;
  isPanelOpen: boolean;
}

const MapViewer: React.FC<MapViewerProps> = ({ plots, selectedPlot, setSelectedPlot, isPanelOpen }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);
  const layersRef = useRef<any>([]);
  const [activeLayer, setActiveLayer] = useState<'standard' | 'satellite' | 'hybrid'>('satellite');
  const [isMapReady, setIsMapReady] = useState(false);
  const [showLayerPanel, setShowLayerPanel] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  
  const [filters, setFilters] = useState({
    compliant: true,
    encroached: true,
    partial: true,
    vacant: true,
    idle: true,
    litigation: true,
    closed: true
  });

  useEffect(() => {
    if (!mapRef.current || typeof L === 'undefined') return;

    const CG_BOUNDS = L.latLngBounds([17.0, 78.0], [25.0, 85.0]);

    leafletMap.current = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false,
      maxBounds: CG_BOUNDS,
      maxBoundsViscosity: 1.0,
      fadeAnimation: true
    }).setView([21.285, 81.650], 12);

    L.control.zoom({ position: 'bottomright' }).addTo(leafletMap.current);
    setIsMapReady(true);

    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!leafletMap.current || !isMapReady) return;
    
    leafletMap.current.eachLayer((layer: any) => {
      if (layer instanceof L.TileLayer) {
        leafletMap.current.removeLayer(layer);
      }
    });

    let url = '';
    if (activeLayer === 'satellite') {
      url = 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}';
    } else if (activeLayer === 'hybrid') {
      url = 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';
    } else {
      url = 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';
    }

    L.tileLayer(url, {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
    }).addTo(leafletMap.current);
  }, [activeLayer, isMapReady]);

  const getPlotVariation = (p: Plot) => {
    if (p.enforcementStage === EnforcementStage.LEGAL_ACTION) return 'litigation';
    if (p.encroached && p.enforcementStage !== EnforcementStage.RESOLVED) return 'encroached';
    if (p.status === PlotStatus.IDLE) return 'idle';
    if (p.status === PlotStatus.PARTIAL) return 'partial';
    if (p.status === PlotStatus.VACANT) return 'vacant';
    if (p.status === PlotStatus.CLOSED) return 'closed';
    return 'compliant';
  };

  const visiblePlots = useMemo(() => {
    return plots.filter(p => filters[getPlotVariation(p) as keyof typeof filters]);
  }, [plots, filters]);

  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const term = searchTerm.toLowerCase();
    return plots.filter(p => 
      p.industryName.toLowerCase().includes(term) || 
      p.allotmentId.toLowerCase().includes(term)
    ).slice(0, 5);
  }, [plots, searchTerm]);

  useEffect(() => {
    if (!leafletMap.current || !isMapReady) return;

    layersRef.current.forEach((layer: any) => leafletMap.current.removeLayer(layer));
    layersRef.current = [];

    visiblePlots.forEach(plot => {
      const isSelected = selectedPlot?.id === plot.id;
      const variation = getPlotVariation(plot);
      
      let color = '#004a99'; 
      if (variation === 'encroached') color = '#ef4444';
      if (variation === 'partial') color = '#f59e0b';
      if (variation === 'vacant') color = '#94a3b8';
      if (variation === 'idle') color = '#10b981';
      if (variation === 'litigation') color = '#8b5cf6';
      if (variation === 'closed') color = '#475569';
      
      const polygon = L.polygon(plot.coordinates, {
        color: isSelected ? '#ffffff' : color,
        fillColor: color,
        fillOpacity: isSelected ? 0.75 : 0.45,
        weight: isSelected ? 4 : 2,
        dashArray: isSelected ? '6, 6' : '0'
      }).addTo(leafletMap.current);

      polygon.on('click', (e: any) => {
        L.DomEvent.stopPropagation(e);
        setSelectedPlot(plot);
      });
      
      layersRef.current.push(polygon);

      if (isSelected && plot.builtCoordinates) {
        const builtPoly = L.polygon(plot.builtCoordinates, {
          color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.5, weight: 2, className: 'animate-pulse'
        }).addTo(leafletMap.current);
        layersRef.current.push(builtPoly);
      }
    });

    if (selectedPlot) {
      const paddingOptions = isPanelOpen 
        ? { paddingBottomRight: [520, 50], paddingTopLeft: [50, 50], animate: true, duration: 1.2 } 
        : { padding: [100, 100], animate: true, duration: 1.2 };
      
      const bounds = L.latLngBounds(selectedPlot.coordinates);
      leafletMap.current.fitBounds(bounds, paddingOptions);
    }
  }, [visiblePlots, selectedPlot, setSelectedPlot, isMapReady, isPanelOpen]);

  const toggleFilter = (key: keyof typeof filters) => {
    setFilters(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSelectSearchResult = (plot: Plot) => {
    setSelectedPlot(plot);
    setSearchTerm('');
    setIsSearchActive(false);
  };

  const variations = [
    { id: 'compliant', label: 'Authorized Build', color: 'bg-[#004a99]', count: plots.filter(p => getPlotVariation(p) === 'compliant').length },
    { id: 'encroached', label: 'Boundary Variance', color: 'bg-[#ef4444]', count: plots.filter(p => getPlotVariation(p) === 'encroached').length },
    { id: 'partial', label: 'Incomplete Dev', color: 'bg-[#f59e0b]', count: plots.filter(p => getPlotVariation(p) === 'partial').length },
    { id: 'vacant', label: 'Vacant Allotment', color: 'bg-[#94a3b8]', count: plots.filter(p => getPlotVariation(p) === 'vacant').length },
    { id: 'idle', label: 'State Reserve', color: 'bg-[#10b981]', count: plots.filter(p => getPlotVariation(p) === 'idle').length },
    { id: 'litigation', label: 'Legal Pipeline', color: 'bg-[#8b5cf6]', count: plots.filter(p => getPlotVariation(p) === 'litigation').length },
    { id: 'closed', label: 'Defunct Unit', color: 'bg-[#475569]', count: plots.filter(p => getPlotVariation(p) === 'closed').length },
  ];

  return (
    <div className="w-full h-full relative">
      <div ref={mapRef} className="w-full h-full z-0 bg-slate-200" />
      
      {/* Search Interface */}
      <div className="absolute top-8 left-8 z-[500] w-96 animate-in slide-in-from-top-6 duration-700">
        <div className={`bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200 transition-all duration-300 ${isSearchActive ? 'ring-4 ring-[#003366]/10' : ''}`}>
          <div className="flex items-center px-6 py-4 gap-4">
            <svg className={`w-5 h-5 transition-colors ${isSearchActive ? 'text-[#003366]' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input 
              type="text" 
              placeholder="SEARCH ASSET OR INDUSTRY..." 
              value={searchTerm}
              onFocus={() => setIsSearchActive(true)}
              onBlur={() => setTimeout(() => setIsSearchActive(false), 200)}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-[11px] font-black uppercase tracking-widest text-slate-800 placeholder:text-slate-300"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="text-slate-300 hover:text-slate-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}
          </div>

          {isSearchActive && searchResults.length > 0 && (
            <div className="border-t border-slate-100 py-3 animate-in fade-in slide-in-from-top-2">
              {searchResults.map((p) => (
                <button 
                  key={p.id}
                  onClick={() => handleSelectSearchResult(p)}
                  className="w-full px-6 py-4 hover:bg-slate-50 flex items-center justify-between group transition-all"
                >
                  <div className="text-left">
                    <p className="text-[10px] font-black text-slate-800 uppercase tracking-tight group-hover:text-[#003366]">{p.industryName}</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">{p.allotmentId}</p>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${p.encroached ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                </button>
              ))}
            </div>
          )}
          {isSearchActive && searchTerm.trim() && searchResults.length === 0 && (
            <div className="border-t border-slate-100 py-6 text-center">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">No matching assets found</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="absolute bottom-10 left-10 z-[500]">
        <button 
          onClick={() => setShowLayerPanel(!showLayerPanel)}
          className={`w-16 h-16 rounded-xl shadow-2xl border-4 transition-all active:scale-95 overflow-hidden flex flex-col ${activeLayer === 'standard' ? 'bg-white border-white' : 'bg-[#003366] border-[#002244]'}`}
        >
          <div className="flex-1 flex items-center justify-center">
            <svg className={`w-8 h-8 ${activeLayer === 'standard' ? 'text-blue-600' : 'text-blue-200'}`} fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/></svg>
          </div>
          <div className="bg-slate-50 py-1 text-[8px] font-black uppercase tracking-[0.2em] text-center text-slate-800 border-t">Base Layers</div>
        </button>
        {showLayerPanel && (
          <div className="absolute bottom-20 left-0 bg-white p-5 rounded-2xl shadow-2xl border border-slate-200 flex gap-5 animate-in slide-in-from-bottom-6 duration-300">
            {['standard', 'satellite', 'hybrid'].map((id) => (
              <button key={id} onClick={() => { setActiveLayer(id as any); setShowLayerPanel(false); }} className="flex flex-col items-center gap-2">
                <div className={`w-16 h-16 rounded-xl border-4 transition-all ${activeLayer === id ? 'border-[#003366] scale-105' : 'border-slate-50'}`}>
                  <div className={`w-full h-full rounded-lg ${id === 'standard' ? 'bg-blue-50' : id === 'satellite' ? 'bg-slate-800' : 'bg-emerald-50'}`}></div>
                </div>
                <span className={`text-[9px] font-black uppercase tracking-widest ${activeLayer === id ? 'text-[#003366]' : 'text-slate-400'}`}>{id}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {!isPanelOpen && (
        <div className="absolute top-8 right-8 z-[500] animate-in fade-in slide-in-from-right duration-500">
          <div className="bg-white/95 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-slate-200 w-80">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-1.5 h-4 bg-[#003366] rounded-full"></div>
              <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.25em]">Spatial Filter</h4>
            </div>
            <div className="space-y-4">
              {variations.map((item) => (
                <label key={item.id} className="flex items-center justify-between group cursor-pointer hover:bg-slate-50 -mx-2 px-2 py-1.5 rounded-lg transition-all">
                  <div className="flex items-center gap-3">
                    <input type="checkbox" checked={filters[item.id as keyof typeof filters]} onChange={() => toggleFilter(item.id as keyof typeof filters)} className="w-4 h-4 rounded text-[#003366] focus:ring-[#003366]" />
                    <div className={`w-2.5 h-2.5 ${item.color} rounded-full`}></div>
                    <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${filters[item.id as keyof typeof filters] ? 'text-slate-800' : 'text-slate-400'}`}>{item.label}</span>
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-tighter ${filters[item.id as keyof typeof filters] ? 'text-slate-900' : 'text-slate-300'}`}>{item.count}</span>
                </label>
              ))}
            </div>
            <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
               <div className="flex flex-col">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Active Monitoring</span>
                  <span className="text-xs font-black text-[#003366]">{(visiblePlots.reduce((acc, p) => acc + p.areaM2, 0) / 10000).toFixed(2)} Ha</span>
               </div>
               <button onClick={() => setFilters({compliant:true,encroached:true,partial:true,vacant:true,idle:true,litigation:true,closed:true})} className="px-4 py-2 bg-slate-50 text-[9px] font-black text-slate-400 rounded-lg uppercase tracking-widest border border-slate-100 hover:bg-slate-100 transition-all">Reset</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapViewer;
