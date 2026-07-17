/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Utensils, Coffee, Scissors, Shirt, ShoppingCart, Key, Home, HeartHandshake, ShieldCheck } from 'lucide-react';

interface CategoriesTabProps {
  onSelectCategory: (category: string) => void;
  activeCategory: string;
}

export default function CategoriesTab({ onSelectCategory, activeCategory }: CategoriesTabProps) {
  const categoriesList = [
    {
      id: "restaurant",
      label: "Restaurants",
      desc: "Local eateries & food points",
      icon: <Utensils className="w-6 h-6 text-orange-500" />,
      colorClass: "bg-orange-50 border-orange-100 text-orange-600"
    },
    {
      id: "cafe",
      label: "Hotels & Cafes",
      desc: "Bakehouses, breakfast & chai point hubs",
      icon: <Coffee className="w-6 h-6 text-amber-500" />,
      colorClass: "bg-amber-50 border-amber-100 text-amber-600"
    },
    {
      id: "tailor",
      label: "Bespoke Tailors",
      desc: "Custom fitting & alterations",
      icon: <Scissors className="w-6 h-6 text-emerald-500" />,
      colorClass: "bg-emerald-50 border-emerald-100 text-emerald-600"
    },
    {
      id: "cloth_store",
      label: "Cloth Stores",
      desc: "Traditional silk boutiques & sarees",
      icon: <Shirt className="w-6 h-6 text-indigo-500" />,
      colorClass: "bg-indigo-50 border-indigo-100 text-indigo-600"
    },
    {
      id: "marketplace",
      label: "Marketplace (2nd Hand)",
      desc: "Electronics, cycles, books nearby",
      icon: <ShoppingCart className="w-6 h-6 text-blue-500" />,
      colorClass: "bg-blue-50 border-blue-100 text-blue-600"
    },
    {
      id: "rent",
      label: "Room Rentals",
      desc: "1 BHK, PGs, shared flats near Indiranagar",
      icon: <Key className="w-6 h-6 text-purple-500" />,
      colorClass: "bg-purple-50 border-purple-100 text-purple-600"
    },
    {
      id: "sale",
      label: "Property Sales",
      desc: "Apartments, heavy furniture, vehicles outright",
      icon: <Home className="w-6 h-6 text-orange-500" />,
      colorClass: "bg-orange-50 border-orange-100 text-orange-600"
    },
    {
      id: "services",
      label: "Requests & Gigs",
      desc: "Plumbers, cleaners, errand runners",
      icon: <HeartHandshake className="w-6 h-6 text-teal-500" />,
      colorClass: "bg-teal-50 border-teal-100 text-teal-600"
    }
  ];

  return (
    <div id="categories_tab_grid" className="w-full bg-zinc-50 min-h-screen p-4 pb-24">
      {/* Page Header */}
      <div className="mb-5 max-w-md mx-auto">
        <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 px-2.5 py-1 bg-orange-50 rounded-xl">
          nearme catalogs
        </span>
        <h2 className="text-base font-extrabold text-zinc-900 mt-2 font-sans">Browse Categories</h2>
        <p className="text-xs text-zinc-400 mt-1">Explore curated local business menus or post directly to local groups.</p>
      </div>

      {/* Grid of category tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto">
        {categoriesList.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              id={`category_tile_btn_${cat.id}`}
              onClick={() => onSelectCategory(cat.id)}
              className={`flex items-start gap-4 p-4 rounded-3xl border text-left transition-all hover:shadow-md ${
                isActive 
                  ? 'border-orange-600 bg-orange-50/20 ring-2 ring-orange-500/10' 
                  : 'bg-white border-zinc-200'
              }`}
            >
              {/* Category Icon */}
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0 ${cat.colorClass}`}>
                {cat.icon}
              </div>

              {/* Text content */}
              <div className="min-w-0">
                <h3 className="text-xs font-black text-zinc-900 font-sans">{cat.label}</h3>
                <p className="text-[10px] text-zinc-500 mt-0.5 leading-relaxed">{cat.desc}</p>
                
                <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-orange-600 mt-2 hover:underline">
                  Browse list ➔
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Trust notice */}
      <div className="max-w-md mx-auto mt-6 p-4 bg-zinc-950 text-white rounded-3xl border border-zinc-800 shadow-sm flex items-start gap-3.5">
        <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
        <div className="text-[11px] leading-relaxed text-zinc-300">
          <span className="font-bold text-white">Manual Merchant Onboarding:</span> Every restaurant menu and product catalog is verified physically by our team before listing. Contact shops with absolute confidence!
        </div>
      </div>
    </div>
  );
}
