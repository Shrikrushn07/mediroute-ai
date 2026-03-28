import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Filter, AlertCircle, Activity, Lightbulb } from 'lucide-react';
import HospitalCard from '../components/HospitalCard.jsx';
import { fetchHospitals } from '../api/client.js';

export default function Results() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const [sortBy, setSortBy] = useState(state?.searchParams?.sort || 'score');
  const [hospitals, setHospitals] = useState(state?.hospitals || []);
  const [loading, setLoading] = useState(false);

  if (!state?.hospitals) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Activity size={48} className="text-slate-600 mb-4 opacity-50" />
        <h2 className="text-2xl font-bold text-white mb-2">No AI Analysis Found</h2>
        <p className="text-slate-400 mb-6">Start a new search to generate healthcare routes.</p>
        <Link to="/" className="btn-glow inline-flex items-center gap-2">
          <ChevronLeft size={18} /> Return to Search
        </Link>
      </div>
    );
  }

  const { dataSource, liveAvailable, searchParams, userLat, userLng } = state;
  const treatment = searchParams?.treatment;

  const recommended = hospitals[0];

  async function handleSortChange(newSort) {
    setSortBy(newSort);
    setLoading(true);
    try {
      const data = await fetchHospitals({
        ...searchParams,
        sort: newSort,
        lat: userLat,
        lng: userLng,
      });
      setHospitals(data.hospitals);
    } catch (err) {
      console.error('Re-sort error:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs font-semibold text-brand-accent mb-3">
            <Activity size={14} /> AI Analysis Complete
          </div>
          <h2 className="text-3xl font-extrabold text-white mb-1">
            {hospitals.length} Optimal Routes Found
          </h2>
          <p className="text-sm text-slate-400 flex items-center gap-2">
            <span>{searchParams.city}</span> &middot;
            <span className="capitalize">{treatment} Surgery</span> &middot;
            <span className={`font-medium flex items-center gap-1 ${dataSource === 'live' ? 'text-blue-400' : 'text-amber-400'}`}>
              <span className={`w-2 h-2 rounded-full ${dataSource === 'live' ? 'bg-blue-400 animate-pulse' : 'bg-amber-400'}`} />
              {dataSource === 'live' ? 'Live Data Sync' : 'Static Dataset'}
            </span>
          </p>
        </div>

        <Link to="/" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors text-sm font-medium border border-slate-700">
          <ChevronLeft size={16} /> Modify Search
        </Link>
      </div>

      {searchParams.emergency && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="mb-6 bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-sm text-rose-300 flex items-start gap-3 backdrop-blur-md shadow-[0_0_15px_rgba(244,63,94,0.1)]"
        >
          <AlertCircle size={20} className="text-rose-500 shrink-0 mt-0.5" />
          <div>
            <strong className="block text-rose-500 mb-1">Emergency Protocol Active</strong>
            Filtering restricted to facilities with confirmed immediate bed availability and trauma capability.
          </div>
        </motion.div>
      )}

      {/* Control Bar */}
      <div className="glass rounded-xl p-2 mb-8 flex flex-col sm:flex-row items-center gap-2 overflow-x-auto border-white/10">
        <div className="flex items-center gap-2 px-3 text-slate-400 text-sm font-medium border-r border-slate-700/50">
          <Filter size={16} /> Sort Priority
        </div>
        <div className="flex items-center gap-2 p-1">
          {[
            { value: 'score', label: '🧠 AI Best Match' },
            { value: 'cost', label: '💰 Lowest Cost' },
            { value: 'distance', label: '📍 Nearest' },
            { value: 'rating', label: '⭐ Top Rated' },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => handleSortChange(opt.value)}
              disabled={loading}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${sortBy === opt.value
                  ? 'bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)] text-white'
                  : 'bg-transparent text-slate-400 hover:bg-slate-800'
                }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {loading && <div className="text-xs text-brand-accent ml-auto animate-pulse px-4">Recalculating routing matrix...</div>}
      </div>

      {/* AI Recommendation Banner */}
      {recommended && treatment && recommended.estimated_cost && (
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="relative overflow-hidden bg-gradient-to-r from-blue-900/40 to-cyan-900/40 border border-blue-500/30 rounded-2xl p-6 mb-8 shadow-[0_0_30px_rgba(59,130,246,0.15)]"
        >
          <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-blue-500/20 blur-3xl rounded-full pointer-events-none" />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
            <div>
              <div className="flex items-center gap-2 text-brand-accent font-bold mb-2">
                <Lightbulb size={20} className="text-yellow-400 animate-pulse" /> Primary AI Recommendation
              </div>
              <h3 className="text-2xl font-extrabold text-white mb-1">{recommended.name}</h3>
              <div className="flex items-center gap-3 text-slate-300 text-sm">
                <span>Confidence Score: <strong className="text-white">{(recommended.score * 100).toFixed(1)}%</strong></span>
                <span className="w-1 h-1 rounded-full bg-slate-600" />
                <span>{recommended.distance_km} km Away</span>
                <span className="w-1 h-1 rounded-full bg-slate-600" />
                <span>{recommended.rating}★ Rating</span>
              </div>
            </div>

            <div className="bg-black/40 border border-white/10 rounded-xl px-6 py-4 text-center min-w-[140px] shadow-inner">
              <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Est. Procedure Cost</div>
              <div className="text-2xl font-bold text-emerald-400">
                ₹{Number(recommended.estimated_cost).toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Hospital List */}
      <div className="space-y-4">
        {hospitals.map((hospital, i) => (
          <motion.div
            key={hospital.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <HospitalCard
              hospital={hospital}
              isRecommended={i === 0 && sortBy === 'score'}
              treatment={treatment}
            />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
