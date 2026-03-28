import React from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, Stethoscope, AlertTriangle, Activity } from 'lucide-react';

const CITIES = ['Bangalore', 'Mumbai', 'Delhi'];
const TREATMENTS = ['kidney', 'heart', 'appendix', 'fracture', 'c-section'];

export default function SearchBar({ values = {}, onChange, onSearch, loading }) {
  function handleSubmit(e) {
    e.preventDefault();
    if (onSearch) onSearch();
  }

  return (
    <motion.form
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      onSubmit={handleSubmit}
      className="glass-panel p-8 space-y-6 relative overflow-hidden"
      aria-label="Hospital search form"
      role="search"
    >
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
        <Activity size={100} />
      </div>

      <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
        <Search className="text-brand-accent" size={24} />
        Find Alternative Care
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
        {/* City selector */}
        <div>
          <label htmlFor="city-select" className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
            <MapPin size={16} className="text-brand-accent" /> City <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <select
              id="city-select"
              className="w-full bg-slate-800/50 border border-slate-600 rounded-xl px-4 py-3 text-sm text-white appearance-none focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent transition-all"
              value={values.city || ''}
              onChange={e => onChange({ field: 'city', value: e.target.value })}
              required
            >
              <option value="" disabled className="text-gray-500">Select city...</option>
              {CITIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Treatment selector */}
        <div>
          <label htmlFor="treatment-select" className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
            <Stethoscope size={16} className="text-brand-accent" /> Treatment <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <select
              id="treatment-select"
              className="w-full bg-slate-800/50 border border-slate-600 rounded-xl px-4 py-3 text-sm text-white appearance-none focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent transition-all"
              value={values.treatment || ''}
              onChange={e => onChange({ field: 'treatment', value: e.target.value })}
              required
            >
              <option value="" disabled className="text-gray-500">Select treatment...</option>
              {TREATMENTS.map(t => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)} Surgery</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-4 border-t border-slate-700/50 relative z-10">
        {/* Sort selector */}
        <div className="w-full sm:w-auto">
          <label htmlFor="sort-select" className="block text-xs font-medium text-slate-400 mb-1">
            Sort Priority
          </label>
          <select
            id="sort-select"
            className="bg-transparent border-b border-slate-600 pb-1 text-sm text-brand-accent focus:outline-none focus:border-brand-accent transition-colors"
            value={values.sort || 'score'}
            onChange={e => onChange({ field: 'sort', value: e.target.value })}
          >
            <option value="score" className="text-black">Best Match (AI Score)</option>
            <option value="cost" className="text-black">Lowest Cost</option>
            <option value="distance" className="text-black">Nearest</option>
            <option value="rating" className="text-black">Highest Rated</option>
          </select>
        </div>

        {/* Checkboxes row */}
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer group">
            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${values.emergency ? 'bg-rose-500 border-rose-500' : 'border-slate-500 group-hover:border-rose-400'}`}>
              {values.emergency && <div className="w-2.5 h-2.5 bg-white rounded-sm" />}
            </div>
            <input
              type="checkbox"
              className="hidden"
              checked={values.emergency || false}
              onChange={e => onChange({ field: 'emergency', value: e.target.checked })}
            />
            <AlertTriangle size={16} className={`${values.emergency ? 'text-rose-500 animate-pulse' : 'text-slate-500 group-hover:text-rose-400'}`} />
            <span className={`font-medium transition-colors ${values.emergency ? 'text-rose-500' : ''}`}>Emergency</span>
          </label>

          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer group">
            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${values.live ? 'bg-blue-500 border-blue-500' : 'border-slate-500 group-hover:border-blue-400'}`}>
              {values.live && <div className="w-2.5 h-2.5 bg-white rounded-sm" />}
            </div>
            <input
              type="checkbox"
              className="hidden"
              checked={values.live || false}
              onChange={e => onChange({ field: 'live', value: e.target.checked })}
            />
            <span className={`transition-colors ${values.live ? 'text-blue-400 font-medium' : ''}`}>Live Data Mode</span>
          </label>
        </div>
      </div>

      {/* Submit */}
      <div className="pt-4 relative z-10 w-full mt-4">
        <button
          type="submit"
          disabled={loading || !values.city || !values.treatment}
          className="w-full btn-glow disabled:opacity-50 disabled:cursor-not-allowed group"
          aria-label="Search for hospitals"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Processing AI Recommendations...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2 text-lg">
              <Activity size={20} className="group-hover:animate-bounce" /> Analyze & Route
            </span>
          )}
        </button>
      </div>
    </motion.form>
  );
}
