import React, { useState } from 'react';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const validateEmail = (emailStr: string) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const allowedDomains = ['gmail.com', 'outlook.com', 'csidc.gov.in', 'chhattisgarh.gov.in'];
    const domain = emailStr.split('@')[1]?.toLowerCase();

    if (!emailRegex.test(emailStr)) {
      return { valid: false, message: 'Invalid email format detected.' };
    }
    if (domain && !allowedDomains.includes(domain)) {
      return { valid: false, message: 'Please use an official domain (@gmail.com, @outlook.com, or @csidc.gov.in).' };
    }
    return { valid: true };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Credentials required for portal synchronization.');
      return;
    }

    const validation = validateEmail(email);
    if (!validation.valid) {
      setError(validation.message || 'Invalid credentials.');
      return;
    }

    setIsLoading(true);
    // Simulating secure authentication with CSIDC servers
    setTimeout(() => {
      onLogin();
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans selection:bg-[#003366] selection:text-white">
      {/* Official Top Bar */}
      <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-[#003366] rounded flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-xl">C</span>
          </div>
          <div>
            <h1 className="text-[11px] font-bold text-slate-800 tracking-tight uppercase leading-none">Chhattisgarh State Industrial Development Corporation</h1>
            <p className="text-[9px] text-slate-500 font-semibold uppercase tracking-widest mt-1">Government of Chhattisgarh</p>
          </div>
        </div>
        <div className="flex items-center gap-6 text-[9px] font-bold uppercase tracking-[0.2em]">
          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-slate-100 rounded text-slate-500 border border-slate-200">
            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
            Butterscotch
          </div>
          <div className="hidden lg:flex items-center gap-4 text-slate-400">
            <span>Hackathon Edition 2025</span>
            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
            <span>Pilot Cluster: Raipur</span>
          </div>
        </div>
      </header>
      
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50 relative overflow-hidden">
        {/* Subtle Watermark */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none select-none flex items-center justify-center overflow-hidden">
          <span className="text-[20vw] font-black uppercase rotate-[-15deg]">Prototype</span>
        </div>

        <div className="w-full max-w-md relative z-10">
          <div className="bg-white p-10 rounded-xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] border border-slate-200">
            <div className="mb-10">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-4 bg-[#003366] rounded-full"></div>
                <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#003366]">Xcelera Hackathon Submission</p>
              </div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight leading-tight uppercase">Industrial Land Monitoring System</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded text-[10px] font-bold text-red-600 uppercase tracking-widest animate-in slide-in-from-top-2">
                  {error}
                </div>
              )}
              
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500 block">Official Email Address</label>
                <div className="relative">
                  <input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    className="w-full bg-slate-50 border border-slate-300 rounded-md py-4 px-4 text-sm text-slate-900 font-medium focus:ring-2 focus:ring-[#003366]/10 focus:border-[#003366] transition-all outline-none placeholder:text-slate-300" 
                    placeholder="officer@gmail.com"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Secure Passkey</label>
                  <a href="#" className="text-[8px] font-bold text-[#003366] uppercase tracking-widest hover:underline">Forgot?</a>
                </div>
                <div className="relative">
                  <input 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    className="w-full bg-slate-50 border border-slate-300 rounded-md py-4 px-4 text-sm text-slate-900 font-medium focus:ring-2 focus:ring-[#003366]/10 focus:border-[#003366] transition-all outline-none placeholder:text-slate-300" 
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 py-2">
                <input type="checkbox" id="station" className="w-3.5 h-3.5 rounded border-slate-300 text-[#003366] focus:ring-[#003366]" />
                <label htmlFor="station" className="text-[9px] font-bold text-slate-500 uppercase tracking-widest cursor-pointer select-none">Remember this station</label>
              </div>

              <button 
                type="submit" 
                disabled={isLoading} 
                className="w-full bg-[#003366] text-white py-4 rounded-md font-bold text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-blue-900/20 active:translate-y-px disabled:opacity-50 transition-all hover:bg-[#002244] flex items-center justify-center"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-3">
                    <svg className="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <span>Verifying Prototype...</span>
                  </div>
                ) : 'Launch Monitoring Node'}
              </button>
            </form>
          </div>
          
          <div className="mt-10 flex flex-col items-center gap-6">
            <p className="text-slate-400 text-[8px] font-bold uppercase tracking-[0.3em] text-center max-w-xs leading-relaxed">
              Prototype Disclaimer: This system is a proof-of-concept for industrial plot monitoring and encroachment detection. All data shown is simulated for demonstration.
            </p>
            <div className="flex items-center gap-6 opacity-30">
              <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">v1.0.0 Alpha</span>
              <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
              <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">Xcelera 2025 Submission</span>
            </div>
          </div>
        </div>
      </div>

      <footer className="h-10 bg-white border-t border-slate-200 px-8 flex items-center justify-center text-[8px] font-bold text-slate-400 uppercase tracking-widest">
        Chhattisgarh State Industrial Development Corporation (CSIDC) • Built for Xcelera 2025
      </footer>
    </div>
  );
};

export default Login;