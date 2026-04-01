
import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Home, Users, User, Building, Search, Hash } from 'lucide-react';
import { isDemoMode } from '../lib/supabase';
import { Madrasah } from '../types';

interface LayoutProps {
  madrasah: Madrasah | null;
}

const Layout: React.FC<LayoutProps> = ({ madrasah }) => {
  const avatar = madrasah?.avatar_url;
  const madrasahName = madrasah?.name || 'মাদরাসা';
  const madrasahCode = madrasah?.madrasah_code;

  return (
    <div className="min-h-screen flex flex-col pb-28 bg-[#f8fafc]">
      {/* Premium Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 flex flex-col safe-top shadow-[0_1px_3px_rgba(0,0,0,0.02)] border-b border-slate-100">
        <div className="px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3 truncate">
            <div className="w-12 h-12 bg-green-600 rounded-2xl flex items-center justify-center text-white overflow-hidden shadow-lg shadow-green-100 flex-shrink-0 border border-green-500/20">
              {avatar ? (
                <img src={avatar} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <Building size={24} />
              )}
            </div>
            <div className="flex flex-col truncate">
              <h1 className="text-xl font-black text-slate-900 truncate tracking-tight">{madrasahName}</h1>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {madrasahCode ? `কোড: ${madrasahCode}` : 'একটিভ সেশন'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isDemoMode && (
              <span className="bg-amber-50 text-amber-600 text-[10px] font-black px-2 py-1 rounded-lg border border-amber-100">
                DEMO
              </span>
            )}
            <button className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center border border-slate-100">
              <Search size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow p-5 max-w-2xl mx-auto w-full animate-slide-up">
        <Outlet />
      </main>

      {/* Floating Bottom Navigation */}
      <div className="fixed bottom-6 left-6 right-6 z-[60] max-w-md mx-auto">
        <nav className="glass rounded-[2rem] shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-white/50 px-4 flex justify-around items-center h-20">
          <NavLink 
            to="/" 
            className={({ isActive }) => `flex flex-col items-center justify-center w-20 h-14 rounded-2xl transition-all duration-300 ${isActive ? 'text-green-600' : 'text-slate-400'}`}
          >
            {({ isActive }) => (
              <>
                <div className={`p-2 rounded-xl transition-all duration-300 ${isActive ? 'bg-green-50 scale-110' : ''}`}>
                  <Home size={24} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={`text-[10px] font-bold mt-1 transition-all ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'}`}>হোম</span>
              </>
            )}
          </NavLink>
          
          <NavLink 
            to="/classes" 
            className={({ isActive }) => `flex flex-col items-center justify-center w-20 h-14 rounded-2xl transition-all duration-300 ${isActive ? 'text-green-600' : 'text-slate-400'}`}
          >
            {({ isActive }) => (
              <>
                <div className={`p-2 rounded-xl transition-all duration-300 ${isActive ? 'bg-green-50 scale-110' : ''}`}>
                  <Users size={24} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={`text-[10px] font-bold mt-1 transition-all ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'}`}>ক্লাস</span>
              </>
            )}
          </NavLink>

          <NavLink 
            to="/account" 
            className={({ isActive }) => `flex flex-col items-center justify-center w-20 h-14 rounded-2xl transition-all duration-300 ${isActive ? 'text-green-600' : 'text-slate-400'}`}
          >
            {({ isActive }) => (
              <>
                <div className={`p-2 rounded-xl transition-all duration-300 ${isActive ? 'bg-green-50 scale-110' : ''}`}>
                  <User size={24} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={`text-[10px] font-bold mt-1 transition-all ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'}`}>প্রোফাইল</span>
              </>
            )}
          </NavLink>
        </nav>
      </div>
    </div>
  );
};

export default Layout;
