import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import MapViewer from './components/MapViewer';
import Dashboard from './components/Dashboard';
import PlotDetails from './components/PlotDetails';
import CaseManagement from './components/CaseManagement';
import DataManagement from './components/DataManagement';
import ManualAllotment from './components/ManualAllotment';
import Login from './components/Login';
import { Plot, EnforcementStage, PlotStatus, DetectionSeverity } from './types';
import { MOCK_PLOTS } from './mockData';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<'map' | 'dashboard' | 'cases' | 'registry' | 'manual'>('dashboard');
  const [selectedPlotId, setSelectedPlotId] = useState<string | null>(null);
  const [statePlots, setStatePlots] = useState<Plot[]>(MOCK_PLOTS);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const activePlot = useMemo(() => 
    selectedPlotId ? statePlots.find(p => p.id === selectedPlotId) || null : null
  , [selectedPlotId, statePlots]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleAddPlot = (newPlotData: Partial<Plot>) => {
    const newPlot: Plot = {
      id: `P-${Math.floor(1000 + Math.random() * 9000)}`,
      allotmentId: newPlotData.allotmentId || 'CSIDC-TEMP',
      industryName: newPlotData.industryName || 'New Industry',
      plotNumber: newPlotData.plotNumber || 'N/A',
      areaM2: newPlotData.areaM2 || 0,
      builtAreaM2: 0,
      status: PlotStatus.VACANT,
      encroached: false,
      encroachmentAreaM2: 0,
      lastSurveyDate: new Date().toISOString().split('T')[0],
      lastSurveySource: newPlotData.lastSurveySource || 'Manual',
      coordinates: newPlotData.coordinates || [[21.285, 81.650], [21.286, 81.650], [21.286, 81.651], [21.285, 81.651]],
      severity: DetectionSeverity.NORMAL,
      paymentStatus: 'Paid',
      statutoryDues: { leasePayments: 0, waterCharges: 0, otherDues: 0, totalOutstanding: 0 },
      lastPaymentDate: new Date().toISOString().split('T')[0],
      officerAssigned: 'Admin Console',
      enforcementStage: EnforcementStage.DETECTION,
      district: newPlotData.district || 'Raipur',
      zoneId: 'Z-R1',
      detectionConfidence: 1.0,
      ...newPlotData
    };

    setStatePlots(prev => [newPlot, ...prev]);
    setNotification({ message: "Asset successfully committed to state registry.", type: 'success' });
  };

  const handleResetData = () => {
    if (confirm("CRITICAL ACTION: This will wipe the current industrial data registry. Continue?")) {
      setStatePlots([]);
      setNotification({ message: "Current Data Registry Purged.", type: 'success' });
    }
  };

  const handleSyncData = () => {
    setNotification({ message: "Syncing with Central Master Server...", type: 'success' });
    setTimeout(() => {
      setNotification({ message: "Sync Complete. 0 Discrepancies found with Master Database.", type: 'success' });
    }, 2000);
  };

  const updatePlotStage = (plotId: string, direction: 'advance' | 'revert' | EnforcementStage) => {
    setStatePlots(prev => prev.map(p => {
      if (p.id === plotId) {
        const stages = Object.values(EnforcementStage);
        const currentIndex = stages.indexOf(p.enforcementStage);
        let nextIndex = currentIndex;

        if (direction === 'advance') {
          nextIndex = Math.min(currentIndex + 1, stages.length - 1);
        } else if (direction === 'revert') {
          nextIndex = Math.max(currentIndex - 1, 0);
        } else {
          return { ...p, enforcementStage: direction };
        }

        return { ...p, enforcementStage: stages[nextIndex] };
      }
      return p;
    }));
  };

  const handleUpdateStatus = (plotId: string, status: PlotStatus) => {
    setStatePlots(prev => prev.map(p => {
      if (p.id === plotId) {
        return { ...p, status };
      }
      return p;
    }));
  };

  const handleDeactivatePlot = (plotId: string) => {
    if (confirm("Deactivate this asset?")) {
      setStatePlots(prev => prev.filter(p => p.id !== plotId));
      setSelectedPlotId(null);
      setNotification({ message: "Asset Archived.", type: 'success' });
    }
  };

  const handleResolveDue = (plotId: string, dueType: 'leasePayments' | 'waterCharges' | 'otherDues') => {
    setStatePlots(prev => prev.map(p => {
      if (p.id === plotId) {
        const updatedDues = { ...p.statutoryDues, [dueType]: 0 };
        const total = updatedDues.leasePayments + updatedDues.waterCharges + updatedDues.otherDues;
        return {
          ...p,
          statutoryDues: { ...updatedDues, totalOutstanding: total },
          paymentStatus: total === 0 ? 'Paid' : p.paymentStatus
        };
      }
      return p;
    }));
  };

  const handleUnresolveDue = (plotId: string, dueType: 'leasePayments' | 'waterCharges' | 'otherDues') => {
    setStatePlots(prev => prev.map(p => {
      if (p.id === plotId) {
        const mockArrears = dueType === 'leasePayments' ? 85000 : (dueType === 'otherDues' ? 12000 : 5000);
        const updatedDues = { ...p.statutoryDues, [dueType]: mockArrears };
        const total = updatedDues.leasePayments + updatedDues.waterCharges + updatedDues.otherDues;
        return {
          ...p,
          statutoryDues: { ...updatedDues, totalOutstanding: total },
          paymentStatus: 'Overdue'
        };
      }
      return p;
    }));
    setNotification({ message: "Financial Record Re-opened for Audit.", type: 'success' });
  };

  const handlePlotSelect = (plot: Plot) => {
    setSelectedPlotId(plot.id);
    setActiveTab('map');
  };

  if (!isLoggedIn) {
    return <Login onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden font-sans text-slate-900">
      <Sidebar 
        activeTab={activeTab as any} 
        setActiveTab={setActiveTab as any} 
        onLogout={() => setIsLoggedIn(false)}
      />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {notification && (
          <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[5000] px-6 py-3 bg-[#003366] text-white rounded-lg shadow-xl font-bold uppercase text-[9px] tracking-widest animate-in slide-in-from-top-10 flex items-center gap-3">
             <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
             {notification.message}
          </div>
        )}

        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shadow-sm shrink-0 z-30">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[#003366] rounded flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-xl">C</span>
            </div>
            <div>
              <h1 className="text-[11px] font-black text-slate-800 tracking-tight uppercase leading-none">Chhattisgarh State Industrial Development Corporation</h1>
              <p className="text-[9px] text-slate-500 font-semibold uppercase tracking-widest mt-1">Government of Chhattisgarh</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="px-3 py-1 bg-slate-100 rounded text-[9px] font-black uppercase text-slate-500">Node: रायपुर-केंद्र</div>
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin&backgroundColor=b6e3f4" className="w-8 h-8 rounded border border-slate-200 shadow-sm" alt="Avatar" />
          </div>
        </header>

        <div className="flex-1 relative bg-slate-50 flex flex-col overflow-hidden">
          {activeTab === 'dashboard' && <Dashboard plots={statePlots} onPlotSelect={handlePlotSelect} />}
          {activeTab === 'map' && (
            <MapViewer 
              plots={statePlots} 
              selectedPlot={activePlot} 
              setSelectedPlot={(p) => setSelectedPlotId(p ? p.id : null)} 
              isPanelOpen={!!activePlot}
            />
          )}
          {activeTab === 'cases' && (
            <CaseManagement 
              plots={statePlots} 
              onUpdatePlotStage={updatePlotStage} 
              onViewDossier={(id) => { setSelectedPlotId(id); setActiveTab('map'); }}
            />
          )}
          {activeTab === 'registry' && (
            <DataManagement 
              plots={statePlots} 
              onAddPlot={handleAddPlot} 
              onViewDossier={(id) => { setSelectedPlotId(id); setActiveTab('map'); }}
              onResetData={handleResetData}
              onSyncData={handleSyncData}
            />
          )}
          {activeTab === 'manual' && (
            <ManualAllotment 
              onAddPlot={(p) => { handleAddPlot(p); setActiveTab('registry'); }}
            />
          )}
          
          {activePlot && (
            <div className="absolute top-6 right-6 bottom-6 w-[32rem] bg-white shadow-2xl rounded-2xl border border-slate-200 z-[1000] flex flex-col animate-in slide-in-from-right duration-500 overflow-hidden">
              <PlotDetails 
                plot={activePlot} 
                onClose={() => setSelectedPlotId(null)} 
                onUpdateStage={updatePlotStage}
                onResolveDue={handleResolveDue}
                onUnresolveDue={handleUnresolveDue}
                onUpdateStatus={handleUpdateStatus}
                onDeactivatePlot={handleDeactivatePlot}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
