/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MapPin, ShoppingBag, MessageSquare, Bike, CheckCircle2, ChevronRight, HelpCircle, X } from 'lucide-react';

export default function OnboardingExplainer() {
  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen) {
    return (
      <button
        id="btn_open_explainer"
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-between p-3.5 bg-orange-50 border border-orange-100 rounded-2xl text-orange-600 hover:opacity-95 transition-opacity"
      >
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-orange-600 animate-pulse" />
          <span className="text-xs font-bold text-zinc-800 text-left">
            How nearme.show works: Map ➔ WhatsApp ➔ Rapido
          </span>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider bg-white px-2 py-0.5 rounded-lg border border-orange-100 shadow-sm text-orange-600">
          Learn
        </span>
      </button>
    );
  }

  const steps = [
    {
      id: 1,
      title: "Discover Nearby",
      desc: "Find verified local shops, property listings, or requests pinned near your street.",
      icon: <MapPin className="w-6 h-6 text-orange-500" />,
      colorClass: "bg-orange-50 border-orange-100 text-orange-600",
      accent: "1"
    },
    {
      id: 2,
      title: "Browse Catalog",
      desc: "Explore fresh food menus, tailor pricing, or seller product items in 1-tap.",
      icon: <ShoppingBag className="w-6 h-6 text-blue-500" />,
      colorClass: "bg-blue-50 border-blue-100 text-blue-600",
      accent: "2"
    },
    {
      id: 3,
      title: "WhatsApp Deal",
      desc: "Tap 'Chat' to close the deal & negotiate on WhatsApp directly with the owner.",
      icon: <MessageSquare className="w-6 h-6 text-emerald-500 fill-current" />,
      colorClass: "bg-emerald-50 border-emerald-100 text-emerald-600",
      accent: "3"
    },
    {
      id: 4,
      title: "Rapido Delivery",
      desc: "Trigger a Rapido pickup with pre-filled route nodes to deliver the order instantly.",
      icon: <Bike className="w-6 h-6 text-purple-500" />,
      colorClass: "bg-purple-50 border-purple-100 text-purple-600",
      accent: "4"
    },
    {
      id: 5,
      title: "Done! Mil Gaya",
      desc: "Order is delivered safely! No platform commissions, directly supporting local shops.",
      icon: <CheckCircle2 className="w-6 h-6 text-orange-600" />,
      colorClass: "bg-orange-50 border-orange-100 text-orange-600",
      accent: "5"
    }
  ];

  return (
    <div id="nearme_onboarding_explainer_card" className="w-full bg-zinc-950 text-white rounded-3xl p-5 shadow-xl relative overflow-hidden">
      {/* Decorative colored glow circles */}
      <div className="absolute -top-10 -right-10 w-28 h-28 bg-orange-500/10 rounded-full blur-2xl" />
      <div className="absolute -bottom-10 -left-10 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl" />

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <span className="text-[9px] font-bold tracking-widest text-orange-400 uppercase bg-orange-500/10 px-2 py-0.5 rounded-full">
            Bengaluru Local Loop
          </span>
          <h3 className="text-base font-extrabold text-white mt-1.5 font-sans leading-tight">
            How nearme.show simplifies local commerce
          </h3>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Horizontal Steps Layout for mobile first / horizontal scrollable */}
      <div className="flex items-start gap-4 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory">
        {steps.map((step, idx) => (
          <div
            key={step.id}
            className="flex-shrink-0 w-[210px] bg-zinc-900 border border-zinc-800 rounded-2xl p-4 snap-center relative"
          >
            {/* Step count badge */}
            <span className="absolute top-4 right-4 w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-black text-zinc-300">
              {step.accent}
            </span>

            {/* Step Icon */}
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center border mb-3 ${step.colorClass}`}>
              {step.icon}
            </div>

            {/* Step details */}
            <h4 className="text-xs font-black tracking-wide text-white font-sans">{step.title}</h4>
            <p className="text-[11px] text-zinc-300 mt-1 leading-relaxed font-sans">{step.desc}</p>

            {/* Arrow helper for sequence */}
            {idx < steps.length - 1 && (
              <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 bg-zinc-800 p-0.5 rounded-full">
                <ChevronRight className="w-3.5 h-3.5 text-zinc-300" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Mobile Indicator / Instruction */}
      <div className="flex items-center justify-between mt-3.5 pt-3 border-t border-zinc-800 text-[10px] text-zinc-400 font-medium">
        <span>Swipe horizontal to see flow ➔</span>
        <span className="text-orange-400 font-bold">Zero commission model</span>
      </div>
    </div>
  );
}
