import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Activity, Map, ClipboardList } from 'lucide-react';
import Home from './pages/Home.jsx';
import Results from './pages/Results.jsx';
import MapView from './pages/MapView.jsx';

function Navbar() {
  const location = useLocation();
  const navItems = [
    { path: '/', label: 'Search', icon: <Activity size={18} /> },
    { path: '/results', label: 'Dashboard', icon: <ClipboardList size={18} /> },
    { path: '/map', label: 'Routing Map', icon: <Map size={18} /> },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 py-4 px-6 transition-all duration-300" role="navigation" aria-label="Main navigation">
      <div className="max-w-6xl mx-auto glass rounded-2xl px-6 py-3 flex items-center justify-between border-white/10">
        <Link to="/" className="text-xl font-bold flex items-center gap-2 text-white hover:text-brand-accent transition-colors duration-300" aria-label="Saksham 2.0 Home">
          <span className="bg-brand-glow p-1.5 rounded-lg shadow-[0_0_15px_rgba(59,130,246,0.5)]">
            <Activity color="white" size={20} />
          </span>
          <span className="tracking-wide">Saksham 2.0</span>
        </Link>
        <div className="flex gap-2">
          {navItems.map(item => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${isActive
                    ? 'bg-white/10 text-brand-accent shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] border border-white/5'
                    : 'hover:bg-white/5 text-slate-300 hover:text-white'
                  }`}
                aria-current={isActive ? 'page' : undefined}
              >
                {item.icon}
                {item.label}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col pt-24">
      <Navbar />
      <main className="flex-grow max-w-6xl mx-auto px-4 py-8 w-full z-10 relative">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/results" element={<Results />} />
          <Route path="/map" element={<MapView />} />
        </Routes>
      </main>
      <footer className="text-center text-slate-500 text-xs py-10 mt-12 relative z-10 border-t border-white/5">
        <p className="mb-2">Saksham 2.0 — AI Powered Smart Healthcare Decision System</p>
        <p className="text-brand-accent/70 tracking-widest uppercase font-semibold">Built by Shrikrushn Bhise</p>
      </footer>
    </div>
  );
}
