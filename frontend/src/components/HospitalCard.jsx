import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Star, Phone, Navigation, ShieldCheck, Activity } from 'lucide-react';

export default function HospitalCard({ hospital, isRecommended, treatment }) {
  const navigate = useNavigate();

  const {
    name,
    city,
    rating,
    beds_available,
    estimated_cost,
    distance_km,
    score,
    phone,
    lat,
    lng,
  } = hospital;

  const costDisplay = estimated_cost != null
    ? `₹${Number(estimated_cost).toLocaleString('en-IN')}`
    : 'N/A';

  const scoreDisplay = score != null ? `${(score * 100).toFixed(1)}%` : null;

  function handleDirections() {
    navigate('/map', {
      state: {
        hospital,
        treatment,
        userLat: lat - 0.05,
        userLng: lng - 0.05,
      },
    });
  }

  return (
    <article
      className={`relative group overflow-hidden rounded-2xl transition-all duration-300 ${isRecommended
          ? 'bg-gradient-to-br from-blue-900/40 to-slate-900 border border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.15)] ring-1 ring-blue-500/20'
          : 'bg-slate-800/60 border border-slate-700/60 hover:border-slate-500/50 hover:bg-slate-800'
        }`}
    >
      {/* Background glow effect on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none" />

      <div className="p-6 relative z-10">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {isRecommended && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-brand-accent border border-blue-500/30">
                  <ShieldCheck size={14} /> AI Top Pick
                </span>
              )}
              {beds_available === 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  <Activity size={14} /> Full Capacity
                </span>
              )}
            </div>

            <h3 className="text-xl font-bold text-white mb-1 group-hover:text-blue-300 transition-colors">{name}</h3>
            <p className="text-sm text-slate-400 flex items-center gap-1">
              <MapPin size={14} /> {city}
            </p>
          </div>

          {scoreDisplay && (
            <div className="flex flex-col items-end shrink-0 bg-black/30 rounded-xl p-3 border border-white/5">
              <div className={`text-2xl font-black ${isRecommended ? 'text-brand-accent drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]' : 'text-slate-300'}`}>
                {scoreDisplay}
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Match Score</div>
            </div>
          )}
        </div>

        {/* Stats metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-700/50">
            <div className="text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">
              {treatment ? `${treatment.substring(0, 6)}.. Cost` : 'Cost'}
            </div>
            <div className={`text-lg font-bold ${estimated_cost ? 'text-emerald-400' : 'text-slate-500'}`}>
              {costDisplay}
            </div>
          </div>

          <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-700/50">
            <div className="text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">Rating</div>
            <div className="text-lg font-bold text-white flex items-center gap-1">
              {rating} <Star fill="currentColor" className="text-yellow-400" size={16} />
            </div>
          </div>

          <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-700/50">
            <div className="text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">Distance</div>
            <div className="text-lg font-bold text-white">
              {distance_km > 0 ? `${distance_km} km` : '—'}
            </div>
          </div>

          <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-700/50 flex flex-col justify-center">
            <div className="text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">Beds</div>
            <div className={`text-lg font-bold ${beds_available > 0 ? 'text-blue-400' : 'text-rose-500'}`}>
              {beds_available > 0 ? `${beds_available} Available` : '0 Available'}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-700/50 pt-4 gap-4">
          <div className="flex-1">
            {phone && (
              <a href={`tel:${phone}`} className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors">
                <div className="p-2 rounded-full bg-slate-800 border border-slate-700"><Phone size={14} /></div>
                {phone}
              </a>
            )}
          </div>

          <button
            onClick={handleDirections}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all duration-300 ${isRecommended
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_4px_15px_rgba(37,99,235,0.4)]'
                : 'bg-slate-700 hover:bg-slate-600 text-white border border-slate-600'
              }`}
          >
            <Navigation size={18} /> View Routing
          </button>
        </div>
      </div>
    </article>
  );
}
