/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { MapPin, ZoomIn, ZoomOut, Compass, Navigation, ShoppingBag, ShieldCheck, Star } from 'lucide-react';
import { Shop, MarketplaceItem, RentalItem, ServiceRequest } from '../types';
import { CITIES, SHIFT_COORDINATES_FOR_CITY } from '../data/indiaData';

interface InteractiveMapProps {
  activeCategory: string;
  distanceRadius: number;
  shops: Shop[];
  marketplace: MarketplaceItem[];
  rentals: RentalItem[];
  requests: ServiceRequest[];
  onSelectItem: (type: 'shop' | 'marketplace' | 'rental' | 'request', item: any) => void;
  selectedItem: { type: 'shop' | 'marketplace' | 'rental' | 'request'; data: any } | null;
  userArea: string;
  cityId: string;
}

export default function InteractiveMap({
  activeCategory,
  distanceRadius,
  shops,
  marketplace,
  rentals,
  requests,
  onSelectItem,
  selectedItem,
  userArea,
  cityId,
}: InteractiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [pan, setPan] = useState({ x: -150, y: -200 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1.0);

  // Active city info from India dataset
  const currentCity = CITIES.find(c => c.id === cityId) || CITIES[0];

  // User coordinate on our 1200x1200px map is centered around (600, 550)
  const userCoords = { x: 600, y: 550 };

  // Setup dynamic pins on map coordinate space based on selected city's center
  const dynamicPins: any[] = [];

  // 1. Shops (Orange/Green)
  shops.forEach(s => {
    let px = 600;
    let py = 550;
    if (s.lat && s.lng) {
      const proj = SHIFT_COORDINATES_FOR_CITY(s.lat, s.lng, currentCity);
      px = proj.x;
      py = proj.y;
    } else {
      const seed = s.id.charCodeAt(s.id.length - 1) || 0;
      px = 600 + (seed % 10 - 5) * 45;
      py = 550 + (seed % 10 - 5) * 35;
    }
    dynamicPins.push({
      id: s.id,
      type: "shop",
      category: s.category === 'tailor' ? 'tailor' : 'food',
      name: s.name,
      color: s.category === 'tailor' ? '#10B981' : '#FF5722',
      x: px,
      y: py,
      distance: s.distance,
      data: s
    });
  });

  // 2. Marketplace (Blue)
  marketplace.forEach(m => {
    let px = 600;
    let py = 550;
    if (m.lat && m.lng) {
      const proj = SHIFT_COORDINATES_FOR_CITY(m.lat, m.lng, currentCity);
      px = proj.x;
      py = proj.y;
    } else {
      const seed = m.id.charCodeAt(m.id.length - 1) || 0;
      px = 600 + (seed % 7 - 3) * 60;
      py = 550 + (seed % 5 - 2) * 55;
    }
    dynamicPins.push({
      id: m.id,
      type: "marketplace",
      category: "marketplace",
      name: m.title,
      color: "#3B82F6",
      x: px,
      y: py,
      distance: m.distance,
      data: m
    });
  });

  // 3. Rentals (Purple)
  rentals.forEach(r => {
    let px = 600;
    let py = 550;
    if (r.lat && r.lng) {
      const proj = SHIFT_COORDINATES_FOR_CITY(r.lat, r.lng, currentCity);
      px = proj.x;
      py = proj.y;
    } else {
      const seed = r.id.charCodeAt(r.id.length - 1) || 0;
      px = 600 + (seed % 8 - 4) * 50;
      py = 550 + (seed % 6 - 3) * 45;
    }
    dynamicPins.push({
      id: r.id,
      type: "rental",
      category: "rent",
      name: r.title,
      color: "#8B5CF6",
      x: px,
      y: py,
      distance: r.distance,
      data: r
    });
  });

  // 4. Requests (Green)
  requests.forEach(req => {
    let px = 600;
    let py = 550;
    if (req.lat && req.lng) {
      const proj = SHIFT_COORDINATES_FOR_CITY(req.lat, req.lng, currentCity);
      px = proj.x;
      py = proj.y;
    } else {
      const seed = req.id.charCodeAt(req.id.length - 1) || 0;
      px = 600 + (seed % 9 - 4) * 40;
      py = 550 + (seed % 7 - 3) * 50;
    }
    dynamicPins.push({
      id: req.id,
      type: "request",
      category: "services",
      name: req.title,
      color: "#10B981",
      x: px,
      y: py,
      distance: req.distance,
      data: req
    });
  });

  // Filter based on selected category & distance radius
  const filteredPins = dynamicPins.filter(pin => {
    if (pin.distance > distanceRadius) return false;

    if (activeCategory === 'all') return true;
    if (activeCategory === pin.category) return true;
    
    // category groupings
    if (activeCategory === 'food' && (pin.category === 'food' || pin.data?.category === 'restaurant' || pin.data?.category === 'cafe')) return true;
    if (activeCategory === 'services' && (pin.category === 'services' || pin.category === 'tailor')) return true;
    if (activeCategory === 'marketplace' && pin.type === 'marketplace') return true;
    if (activeCategory === 'rent' && pin.type === 'rental') return true;

    return false;
  });

  // Drag pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPan({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.15, 2.0));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.15, 0.6));
  const handleRecenter = () => {
    if (mapRef.current) {
      const rect = mapRef.current.getBoundingClientRect();
      const cx = rect.width / 2 - userCoords.x * zoom;
      const cy = rect.height / 2 - userCoords.y * zoom;
      setPan({ x: cx, y: cy });
    } else {
      setPan({ x: -150, y: -200 });
    }
  };

  // Recenter on load and when zoom changes or city shifts
  useEffect(() => {
    handleRecenter();
  }, [zoom, cityId]);

  return (
    <div id="nearme_map_view_container" className="relative w-full h-[55vh] md:h-[65vh] overflow-hidden bg-slate-50 border border-slate-100 rounded-3xl shadow-sm select-none">
      
      {/* Map Drag Layer */}
      <div
        ref={mapRef}
        id="nearme_map_canvas"
        className={`w-full h-full cursor-grab ${isDragging ? 'cursor-grabbing' : ''}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <svg
          width={1200}
          height={1200}
          viewBox="0 0 1200 1200"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            transition: isDragging ? 'none' : 'transform 0.1s ease-out',
          }}
          className="absolute top-0 left-0"
        >
          {/* DEFINITIONS for Gradients/Patterns */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e2e8f0" strokeWidth="0.5" />
            </pattern>
            <radialGradient id="user-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#EA4335" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#EA4335" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* GRID BACKGROUND */}
          <rect width="1200" height="1200" fill="#f8fafc" />
          <rect width="1200" height="1200" fill="url(#grid)" />

          {/* DYNAMIC PARKS (Green Areas) */}
          {currentCity.landmarks.parks.map((park, i) => (
            <g key={`park-${i}`} opacity="0.85">
              <rect x={park.x} y={park.y} width={park.w} height={park.h} rx="20" fill={park.bgColor} />
              <text x={park.x + park.w / 2} y={park.y + park.h / 2 + 5} fill={park.textColor} fontSize="12" fontWeight="bold" fontFamily="Poppins" textAnchor="middle">
                {park.name}
              </text>
            </g>
          ))}

          {/* DYNAMIC LAKE (Blue Water body) */}
          {currentCity.landmarks.lake && (
            <g opacity="0.9">
              <path d={currentCity.landmarks.lake.path} fill={currentCity.landmarks.lake.pathColor} stroke="#bae6fd" strokeWidth="2" />
              <text x={currentCity.landmarks.lake.x} y={currentCity.landmarks.lake.y} fill={currentCity.landmarks.lake.textColor} fontSize="14" fontWeight="bold" fontFamily="Poppins">
                {currentCity.landmarks.lake.name}
              </text>
            </g>
          )}

          {/* DYNAMIC STREETS / ROADS */}
          {currentCity.landmarks.streets.map((street, i) => (
            <g key={`street-${i}`}>
              <path d={street.path} fill="none" stroke="#e2e8f0" strokeWidth="32" strokeLinecap="round" opacity="0.9" />
              <path d={street.path} fill="none" stroke="#ffffff" strokeWidth="24" strokeLinecap="round" />
              <text
                x={street.textX}
                y={street.textY}
                fill="#64748b"
                fontSize="10"
                fontWeight="black"
                fontFamily="JetBrains Mono"
                letterSpacing="1"
                transform={street.rotate ? `rotate(${street.rotate}, ${street.textX}, ${street.textY})` : undefined}
                textAnchor="middle"
              >
                {street.name}
              </text>
            </g>
          ))}

          {/* DYNAMIC METRO / TRANSIT SYSTEM */}
          {currentCity.landmarks.transit && (
            <g>
              <path d={currentCity.landmarks.transit.linePath} fill="none" stroke={currentCity.landmarks.transit.color} strokeWidth="6" strokeDasharray="10 5" opacity="0.8" />
              <rect
                x={currentCity.landmarks.transit.stationX}
                y={currentCity.landmarks.transit.stationY}
                width={currentCity.landmarks.transit.stationW}
                height={currentCity.landmarks.transit.stationH}
                rx="8"
                fill={currentCity.landmarks.transit.color}
                opacity="0.95"
              />
              <text
                x={currentCity.landmarks.transit.stationX + currentCity.landmarks.transit.stationW / 2}
                y={currentCity.landmarks.transit.stationY + 18}
                fill="#ffffff"
                fontSize="11"
                fontWeight="extrabold"
                fontFamily="Poppins"
                textAnchor="middle"
              >
                {currentCity.landmarks.transit.name}
              </text>
            </g>
          )}

          {/* DYNAMIC NEIGHBORHOOD LABELS */}
          {currentCity.landmarks.neighborhoodLabels.map((lbl, i) => (
            <text
              key={`label-${i}`}
              x={lbl.x}
              y={lbl.y}
              fill="#cbd5e1"
              fontSize={lbl.size}
              fontWeight="extrabold"
              fontFamily="Poppins"
              textAnchor="middle"
              letterSpacing="4"
              opacity="0.55"
            >
              {lbl.name}
            </text>
          ))}

          {/* --- USER LIVE LOCATION PIN (PULSING) --- */}
          <circle cx={userCoords.x} cy={userCoords.y} r="35" fill="url(#user-glow)">
            <animate attributeName="r" values="12;45;12" dur="3s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.8;0.1;0.8" dur="3s" repeatCount="indefinite" />
          </circle>
          <circle cx={userCoords.x} cy={userCoords.y} r="10" fill="#EA4335" opacity="0.2" />
          <circle cx={userCoords.x} cy={userCoords.y} r="5" fill="#EA4335" stroke="#ffffff" strokeWidth="1.5" />
          <circle cx={userCoords.x} cy={userCoords.y} r="2" fill="#ffffff" />
          
          <g transform={`translate(${userCoords.x - 55}, ${userCoords.y - 38})`}>
            <rect x="0" y="0" width="110" height="22" rx="11" fill="#EA4335" />
            <text x="55" y="14" fill="#ffffff" fontSize="9" fontWeight="bold" fontFamily="Poppins" textAnchor="middle">
              YOU ARE HERE
            </text>
            <path d="M 50 22 L 55 26 L 60 22 Z" fill="#EA4335" />
          </g>

          {/* --- CATEGORY-COLORED PINS --- */}
          {filteredPins.map((pin) => {
            const isSelected = selectedItem?.data?.id === pin.id;
            return (
              <g
                key={pin.id}
                transform={`translate(${pin.x}, ${pin.y})`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectItem(pin.type as any, pin.data);
                }}
                className="cursor-pointer group"
              >
                {/* Highlight rings if selected */}
                {isSelected && (
                  <circle cx="0" cy="-18" r="26" fill="none" stroke={pin.color} strokeWidth="2" opacity="0.6">
                    <animate attributeName="r" values="16;28;16" dur="1.5s" repeatCount="indefinite" />
                  </circle>
                )}

                {/* Pin hover drop shadow */}
                <ellipse cx="0" cy="0" rx="6" ry="2" fill="#000000" opacity="0.15" className="group-hover:opacity-30 transition-opacity" />

                {/* SVG Pin Path (smooth drop shape) */}
                <path
                  d="M 0 0 C -12 -12, -14 -24, 0 -34 C 14 -24, 12 -12, 0 0 Z"
                  fill={pin.color}
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  className="transition-transform duration-200 group-hover:scale-110"
                  style={{
                    transformOrigin: '0px 0px',
                    filter: isSelected ? 'drop-shadow(0px 4px 6px rgba(0, 0, 0, 0.25))' : 'drop-shadow(0px 2px 3px rgba(0, 0, 0, 0.15))'
                  }}
                />

                {/* Pin Icon Label or Category Marker */}
                <circle cx="0" cy="-19" r="6" fill="#ffffff" />
                
                {/* Specific custom micro-markers */}
                <circle cx="0" cy="-19" r="3" fill={pin.color} />

                {/* Miniature clean tooltip text when hovering on desktop */}
                <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" transform="translate(0, -42)">
                  <rect x="-60" y="0" width="120" height="20" rx="4" fill="#0f172a" opacity="0.9" />
                  <text x="0" y="13" fill="#ffffff" fontSize="9" fontFamily="Poppins" fontWeight="medium" textAnchor="middle">
                    {pin.name.length > 18 ? pin.name.substring(0, 16) + '..' : pin.name}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>
      </div>

      {/* FLOAT MAP CONTROLS */}
      <div id="nearme_map_float_controls" className="absolute top-4 right-4 flex flex-col gap-2 z-10">
        <button
          id="btn_map_zoom_in"
          onClick={handleZoomIn}
          className="p-2.5 bg-white rounded-xl shadow-lg hover:bg-zinc-50 transition-colors border border-zinc-200 flex items-center justify-center text-zinc-800"
          title="Zoom In"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        <button
          id="btn_map_zoom_out"
          onClick={handleZoomOut}
          className="p-2.5 bg-white rounded-xl shadow-lg hover:bg-zinc-50 transition-colors border border-zinc-200 flex items-center justify-center text-zinc-800"
          title="Zoom Out"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
        <button
          id="btn_map_recenter"
          onClick={handleRecenter}
          className="p-2.5 bg-white rounded-xl shadow-lg hover:bg-zinc-50 transition-colors border border-zinc-200 flex items-center justify-center text-orange-600"
          title="Recenter Location"
        >
          <Navigation className="w-5 h-5 fill-current" />
        </button>
      </div>

      {/* COMPASS ROSY */}
      <div className="absolute bottom-4 left-4 p-2 bg-white/95 backdrop-blur-sm rounded-xl shadow-md border border-zinc-200 flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 tracking-wide z-10">
        <Compass className="w-4 h-4 text-orange-600 animate-spin-slow" />
        <span>{currentCity.name.toUpperCase()} REGION</span>
      </div>

      {/* GENTLE FLOATING INSTRUCTION */}
      <div className="absolute bottom-4 right-4 bg-zinc-900/80 backdrop-blur-sm text-[10px] text-white px-2.5 py-1.5 rounded-lg font-medium pointer-events-none z-10">
        Drag map to pan • Tap pins to view
      </div>

      {/* MAP DETAIL BOTTOM SHEET PREVIEW CARD */}
      {selectedItem && (
        <div
          id="nearme_map_preview_bottom_sheet"
          className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-zinc-200 rounded-t-3xl shadow-[0_-8px_30px_rgb(0,0,0,0.12)] z-20 animate-slide-up"
        >
          {/* Small notch bar */}
          <div className="w-10 h-1 bg-zinc-200 rounded-full mx-auto mb-3" />

          {selectedItem.type === 'shop' && (
            <div className="flex gap-4">
              <img
                src={selectedItem.data.logo}
                alt={selectedItem.data.name}
                className="w-14 h-14 rounded-xl object-cover border border-zinc-200 shadow-sm"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 px-1.5 py-0.5 bg-orange-50 rounded">
                    {selectedItem.data.category}
                  </span>
                  {selectedItem.data.verified && (
                    <span className="flex items-center text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                      <ShieldCheck className="w-3 h-3 mr-0.5 fill-current" /> Verified
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-bold text-zinc-900 truncate mt-0.5">{selectedItem.data.name}</h4>
                <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500">
                  <span className="flex items-center text-amber-500 font-semibold">
                    <Star className="w-3.5 h-3.5 fill-current mr-0.5" /> {selectedItem.data.rating}
                  </span>
                  <span>•</span>
                  <span>{selectedItem.data.distance} km away</span>
                  <span>•</span>
                  <span className="text-zinc-400 truncate">{selectedItem.data.area}</span>
                </div>
              </div>
              <button
                onClick={() => onSelectItem(selectedItem.type, selectedItem.data)}
                className="self-center px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow transition-all"
              >
                View
              </button>
            </div>
          )}

          {selectedItem.type === 'marketplace' && (
            <div className="flex gap-4">
              <img
                src={selectedItem.data.images[0]}
                alt={selectedItem.data.title}
                className="w-14 h-14 rounded-xl object-cover border border-zinc-200 shadow-sm"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500 px-1.5 py-0.5 bg-blue-50 rounded">
                    2nd Hand • {selectedItem.data.category}
                  </span>
                  <span className="text-[10px] font-bold text-zinc-600 bg-zinc-100 px-1.5 py-0.5 rounded">
                    {selectedItem.data.condition}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-zinc-900 truncate mt-0.5">{selectedItem.data.title}</h4>
                <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500">
                  <span className="text-orange-600 font-bold text-sm">₹{selectedItem.data.price.toLocaleString('en-IN')}</span>
                  <span>•</span>
                  <span>{selectedItem.data.distance} km away</span>
                </div>
              </div>
              <button
                onClick={() => onSelectItem(selectedItem.type, selectedItem.data)}
                className="self-center px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow transition-all"
              >
                Inspect
              </button>
            </div>
          )}

          {selectedItem.type === 'rental' && (
            <div className="flex gap-4">
              <img
                src={selectedItem.data.images[0]}
                alt={selectedItem.data.title}
                className="w-14 h-14 rounded-xl object-cover border border-zinc-200 shadow-sm"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-500 px-1.5 py-0.5 bg-purple-50 rounded">
                    {selectedItem.data.type === 'rent' ? 'To Rent' : 'For Sale'}
                  </span>
                  <span className="text-[10px] font-bold text-zinc-600 bg-zinc-100 px-1.5 py-0.5 rounded">
                    {selectedItem.data.propertyType}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-zinc-900 truncate mt-0.5">{selectedItem.data.title}</h4>
                <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500">
                  <span className="text-orange-600 font-bold text-sm">₹{selectedItem.data.price.toLocaleString('en-IN')}{selectedItem.data.type === 'rent' ? '/mo' : ''}</span>
                  <span>•</span>
                  <span>{selectedItem.data.distance} km away</span>
                </div>
              </div>
              <button
                onClick={() => onSelectItem(selectedItem.type, selectedItem.data)}
                className="self-center px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow transition-all"
              >
                Inspect
              </button>
            </div>
          )}

          {selectedItem.type === 'request' && (
            <div className="flex gap-4">
              <div className="w-14 h-14 rounded-xl bg-emerald-50 border border-emerald-100 flex flex-col items-center justify-center p-1 text-emerald-600 font-mono">
                <span className="text-[8px] font-bold uppercase tracking-wider text-emerald-500">OFFER</span>
                <span className="text-xs font-black">₹{selectedItem.data.price}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 px-1.5 py-0.5 bg-emerald-50 rounded">
                    Service Request • {selectedItem.data.category}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-medium">
                    {selectedItem.data.createdAt}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-zinc-900 truncate mt-0.5">{selectedItem.data.title}</h4>
                <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500">
                  <span>By {selectedItem.data.userName}</span>
                  <span>•</span>
                  <span>{selectedItem.data.distance} km away</span>
                </div>
              </div>
              <button
                onClick={() => onSelectItem(selectedItem.type, selectedItem.data)}
                className="self-center px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow transition-all"
              >
                Review
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
