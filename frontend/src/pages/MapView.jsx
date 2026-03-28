import React, { useEffect, useRef, useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, MapPin, Activity, Navigation, Compass, AlertCircle, Phone } from 'lucide-react';
import { fetchRecommendation } from '../api/client.js';

export default function MapView() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [routeData, setRouteData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const hospital = state?.hospital;
  const treatment = state?.treatment;
  const userLat = state?.userLat || (hospital ? hospital.lat - 0.05 : 12.9716);
  const userLng = state?.userLng || (hospital ? hospital.lng - 0.05 : 77.5946);

  useEffect(() => {
    if (!hospital) return;

    async function initMap() {
      const L = (await import('leaflet')).default;

      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      const centerLat = (userLat + hospital.lat) / 2;
      const centerLng = (userLng + hospital.lng) / 2;

      const map = L.map(mapRef.current, {
        center: [centerLat, centerLng],
        zoom: 13,
        zoomControl: true,
      });
      mapInstanceRef.current = map;

      // Dark theme map tiles (CartoDB Dark Matter)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(map);

      // User marker
      const userIcon = L.divIcon({
        html: '<div style="background:#06b6d4;width:14px;height:14px;border-radius:50%;border:2px solid #0B1120;box-shadow:0 0 10px rgba(6,182,212,0.8)"></div>',
        iconSize: [14, 14],
        iconAnchor: [7, 7],
        className: '',
      });
      L.marker([userLat, userLng], { icon: userIcon })
        .addTo(map)
        .bindPopup('<b style="color:#0B1120;">📍 User Origin</b>')
        .openPopup();

      // Hospital marker
      const hospitalIcon = L.divIcon({
        html: '<div style="background:#3b82f6;width:20px;height:20px;border-radius:50%;border:2px solid #0B1120;box-shadow:0 0 15px rgba(59,130,246,0.8);display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:12px;">H</div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
        className: '',
      });
      L.marker([hospital.lat, hospital.lng], { icon: hospitalIcon })
        .addTo(map)
        .bindPopup(`<b style="color:#0B1120;">${hospital.name}</b>`);

      // Draw route
      if (routeData?.waypoints?.length > 1) {
        const latlngs = routeData.waypoints;
        L.polyline(latlngs, {
          color: '#3b82f6',
          weight: 4,
          opacity: 0.9,
          dashArray: routeData.type === 'euclidean' ? '8, 8' : null,
        }).addTo(map);
      } else {
        // Fallback straight line
        L.polyline([[userLat, userLng], [hospital.lat, hospital.lng]], {
          color: '#06b6d4',
          weight: 3,
          opacity: 0.5,
          dashArray: '8, 8',
        }).addTo(map);
      }

      const bounds = L.latLngBounds(
        [userLat, userLng],
        [hospital.lat, hospital.lng]
      );
      map.fitBounds(bounds.pad(0.2));
    }

    initMap().catch(console.error);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [hospital, routeData, userLat, userLng]);

  useEffect(() => {
    if (!hospital) return;
    setLoading(true);
    fetchRecommendation({
      lat: userLat,
      lng: userLng,
      treatment,
      city: hospital.city,
    })
      .then(data => {
        setRouteData(data.route);
      })
      .catch(err => {
        console.warn('Route fetch failed:', err.message);
        setRouteData({
          waypoints: [[userLat, userLng], [hospital.lat, hospital.lng]],
          total_distance_km: null,
          type: 'euclidean',
        });
        setError('Routing matrix offline — rendering euclidean approximation.');
      })
      .finally(() => setLoading(false));
  }, [hospital]);

  if (!hospital) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Compass size={48} className="text-slate-600 mb-4 opacity-50" />
        <h2 className="text-2xl font-bold text-white mb-2">No Target Selected</h2>
        <p className="text-slate-400 mb-6">Select a hospital from the results dashboard.</p>
        <button onClick={() => navigate(-1)} className="btn-glow inline-flex items-center gap-2">
          <ChevronLeft size={18} /> Return
        </button>
      </div>
    );
  }

  const distanceKm = routeData?.total_distance_km ?? null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-5xl mx-auto"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs font-semibold text-brand-accent mb-3">
            <Navigation size={14} /> Operations Center
          </div>
          <h2 className="text-2xl font-extrabold text-white mb-1 flex items-center gap-2">
            Target: {hospital.name}
          </h2>
          <p className="text-sm text-slate-400 flex items-center gap-1">
            <MapPin size={14} /> {hospital.city} Sector
          </p>
        </div>
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors text-sm font-medium border border-slate-700">
          <ChevronLeft size={16} /> Back to Dashboard
        </button>
      </div>

      {/* Telemetry Bar */}
      <div className="glass rounded-xl p-4 mb-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-black/30 rounded-lg p-3 border border-white/5">
          <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Vector Distance</div>
          <div className="font-bold text-white text-lg">
            {loading ? <span className="animate-pulse">Calculating...</span> : distanceKm ? `${distanceKm} km` : 'Approximating'}
          </div>
        </div>
        <div className="bg-black/30 rounded-lg p-3 border border-white/5">
          <div className="text-xs text-slate-500 uppercase font-semibold mb-1">
            {treatment ? `${treatment.substring(0, 8)} Cost` : 'Est. Cost'}
          </div>
          <div className="font-bold text-emerald-400 text-lg">
            {hospital.estimated_cost ? `₹${Number(hospital.estimated_cost).toLocaleString('en-IN')}` : 'N/A'}
          </div>
        </div>
        <div className="bg-black/30 rounded-lg p-3 border border-white/5">
          <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Quality Index</div>
          <div className="font-bold text-yellow-400 text-lg">{hospital.rating} ★</div>
        </div>
        <div className="bg-black/30 rounded-lg p-3 border border-white/5">
          <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Capacity</div>
          <div className={`font-bold text-lg ${hospital.beds_available > 0 ? 'text-blue-400' : 'text-rose-500'}`}>
            {hospital.beds_available > 0 ? `${hospital.beds_available} Active Units` : 'Critical/Full'}
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 text-sm text-amber-300 flex items-center gap-3">
          <AlertCircle size={18} className="text-amber-500 shrink-0" /> {error}
        </div>
      )}

      {/* Embedded Terminal Map */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-700 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
        <div className="absolute top-4 left-4 z-[400] bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-xs font-mono text-brand-accent flex items-center gap-2">
          {routeData ? (routeData.type === 'euclidean' ? <><Activity size={12} className="text-rose-400" /> VSL Protocol (Approximation)</> : <><Activity size={12} /> Routing Engine Linked: {routeData.type}</>) : <><Activity size={12} className="animate-spin" /> Uplink established...</>}
        </div>

        <div
          ref={mapRef}
          className="map-container"
          style={{ height: '550px', width: '100%', borderRadius: '0' }}
        />
      </div>

      {hospital.phone && (
        <div className="mt-6 flex justify-center">
          <a
            href={`tel:${hospital.phone}`}
            className="inline-flex items-center justify-center gap-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-medium px-8 py-4 rounded-xl transition-all shadow-lg hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]"
          >
            <div className="bg-blue-500/20 p-2 rounded-full text-blue-400">
              <Phone size={20} />
            </div>
            Initialize Secure Comms ({hospital.phone})
          </a>
        </div>
      )}
    </motion.div>
  );
}
