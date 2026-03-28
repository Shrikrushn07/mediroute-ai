import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial } from '@react-three/drei';
import { Zap, Shield, TrendingUp, AlertTriangle } from 'lucide-react';

import SearchBar from '../components/SearchBar.jsx';
import { fetchHospitals } from '../api/client.js';

function AnimatedSphere({ color, position, speed, distort }) {
  const meshRef = useRef();
  useFrame((state) => {
    meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * speed) * 0.5;
    meshRef.current.rotation.x = state.clock.elapsedTime * 0.2;
    meshRef.current.rotation.y = state.clock.elapsedTime * 0.3;
  });

  return (
    <Sphere ref={meshRef} position={position} args={[1, 64, 64]}>
      <MeshDistortMaterial color={color} distort={distort} speed={speed} roughness={0} metalness={0.8} />
    </Sphere>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [searchValues, setSearchValues] = useState({
    city: '',
    treatment: '',
    sort: 'score',
    emergency: false,
    live: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  function handleChange({ field, value }) {
    setSearchValues(prev => ({ ...prev, [field]: value }));
    setError(null);
  }

  async function handleSearch() {
    if (!searchValues.city || !searchValues.treatment) {
      setError('Please select both a city and a treatment to perform AI analysis.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let lat, lng;
      try {
        const pos = await new Promise((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 })
        );
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch { }

      const data = await fetchHospitals({
        ...searchValues,
        lat,
        lng,
      });

      navigate('/results', {
        state: {
          hospitals: data.hospitals,
          dataSource: data.dataSource,
          liveAvailable: data.liveAvailable,
          searchParams: searchValues,
          userLat: lat,
          userLng: lng,
        },
      });
    } catch (err) {
      console.error('Search error:', err);
      setError(err.response?.data?.error || 'Failed to fetch AI recommendations. Backend offline?');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative w-full max-w-4xl mx-auto min-h-[80vh] flex flex-col items-center justify-center">

      {/* 3D Background Canvas */}
      <div className="absolute inset-0 -z-10 opacity-60">
        <Canvas camera={{ position: [0, 0, 5] }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 10]} intensity={1.5} />
          <AnimatedSphere position={[-3, 1, -2]} color="#06b6d4" speed={2} distort={0.4} />
          <AnimatedSphere position={[3, -1, -3]} color="#3b82f6" speed={1.5} distort={0.6} />
        </Canvas>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="text-center mb-12 relative z-10 mt-10"
      >
        <div className="inline-block px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-brand-accent text-xs font-bold tracking-widest uppercase mb-6 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
          Intelligent Healthcare Routing
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-slate-400 mb-6 tracking-tight">
          Saksham 2.0
        </h1>
        <p className="text-slate-300 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
          AI-Powered Smart Decision System. Find the safest, most cost-effective medical treatments instantly with our intelligent routing engine.
        </p>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 w-full max-w-2xl bg-rose-500/10 border border-rose-500/50 text-rose-200 rounded-xl px-6 py-4 flex items-center gap-3 backdrop-blur-md"
        >
          <AlertTriangle size={20} className="text-rose-400" /> {error}
        </motion.div>
      )}

      <div className="w-full max-w-2xl relative z-10 mb-16">
        <SearchBar
          values={searchValues}
          onChange={handleChange}
          onSearch={handleSearch}
          loading={loading}
        />
      </div>

      {/* Feature highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-center relative z-10">
        {[
          { icon: <Zap size={28} className="text-brand-accent" />, title: 'Real-time AI Routing', desc: 'Dijkstra-powered shortest paths.' },
          { icon: <TrendingUp size={28} className="text-blue-400" />, title: 'Cost Optimization', desc: 'Ranked by transparent pricing.' },
          { icon: <Shield size={28} className="text-indigo-400" />, title: 'Quality Assured', desc: 'Top-tier ratings and verified beds.' },
        ].map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + (i * 0.1), duration: 0.5 }}
            className="glass rounded-2xl p-6 hover:-translate-y-1 transition-transform duration-300 group"
          >
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-slate-800/50 border border-slate-700/50 mb-4 group-hover:scale-110 transition-transform">
              {f.icon}
            </div>
            <h3 className="text-base font-bold text-white mb-2">{f.title}</h3>
            <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
