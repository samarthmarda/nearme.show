/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowLeft, MessageSquare, MapPin, Building2, Key, Calendar, Layout, UserCheck, ShieldCheck } from 'lucide-react';
import { RentalItem } from '../types';

interface RentSaleDetailProps {
  item: RentalItem;
  onBack: () => void;
  onStartChat: (item: RentalItem) => void;
}

export default function RentSaleDetail({ item, onBack, onStartChat }: RentSaleDetailProps) {
  return (
    <div id={`rent_sale_detail_${item.id}`} className="w-full bg-zinc-50 min-h-screen pb-32">
      {/* Photo banner */}
      <div className="relative w-full h-72 bg-zinc-200">
        <img
          src={item.images[0]}
          alt={item.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50" />

        {/* Back Button */}
        <button
          id="btn_rental_back"
          onClick={onBack}
          className="absolute top-4 left-4 p-2 bg-white/95 backdrop-blur-sm rounded-full shadow-lg text-zinc-800 hover:bg-white transition-all active:scale-95"
          title="Go Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Tags */}
        <div className="absolute bottom-4 left-4 flex gap-2">
          <span className="px-3 py-1 bg-zinc-900/80 backdrop-blur-sm text-white rounded-full text-xs font-bold uppercase tracking-wider">
            {item.propertyType}
          </span>
          <span className="px-3 py-1 bg-purple-600 text-white rounded-full text-xs font-bold uppercase tracking-wider">
            {item.type === 'rent' ? 'For Rent' : 'For Sale'}
          </span>
        </div>
      </div>

      {/* Title block */}
      <div className="bg-white border-b border-zinc-200 p-5">
        {item.verified && (
          <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-xl text-[10px] font-bold w-fit mb-2.5">
            <ShieldCheck className="w-3.5 h-3.5 fill-current" />
            <span>Verified Listing — Visited by nearme.show</span>
          </div>
        )}

        <h1 className="text-base md:text-lg font-black text-zinc-900 leading-snug">
          {item.title}
        </h1>

        <div className="flex items-baseline gap-2 mt-2.5">
          <span className="text-lg font-black text-orange-600">
            ₹{item.price.toLocaleString('en-IN')}
          </span>
          {item.type === 'rent' && <span className="text-xs text-zinc-400 font-bold">/ month</span>}
        </div>

        <div className="flex items-center gap-1.5 mt-3 text-xs text-zinc-500">
          <MapPin className="w-4 h-4 text-zinc-400" />
          <span className="font-bold text-zinc-800">{item.distance} km away</span>
          <span>({item.area})</span>
        </div>
      </div>

      {/* Rent details key-value table card */}
      <div className="p-4">
        <div className="bg-white rounded-3xl p-5 border border-zinc-200 shadow-sm">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-4">
            Listing Specifications
          </h3>

          <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-xs">
            <div className="flex items-start gap-2.5">
              <Building2 className="w-4 h-4 text-zinc-400 mt-0.5" />
              <div>
                <p className="text-zinc-400 font-bold text-[9px] uppercase tracking-wider">Property Type</p>
                <p className="font-bold text-zinc-800 mt-0.5">{item.propertyType}</p>
              </div>
            </div>

            {item.deposit !== undefined && (
              <div className="flex items-start gap-2.5">
                <Key className="w-4 h-4 text-zinc-400 mt-0.5" />
                <div>
                  <p className="text-zinc-400 font-bold text-[9px] uppercase tracking-wider">Security Deposit</p>
                  <p className="font-bold text-zinc-800 mt-0.5">₹{item.deposit.toLocaleString('en-IN')}</p>
                </div>
              </div>
            )}

            {item.size && (
              <div className="flex items-start gap-2.5">
                <Layout className="w-4 h-4 text-zinc-400 mt-0.5" />
                <div>
                  <p className="text-zinc-400 font-bold text-[9px] uppercase tracking-wider">Built-up Area</p>
                  <p className="font-bold text-zinc-800 mt-0.5">{item.size}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-2.5">
              <Calendar className="w-4 h-4 text-zinc-400 mt-0.5" />
              <div>
                <p className="text-zinc-400 font-bold text-[9px] uppercase tracking-wider">Availability</p>
                <p className="font-bold text-zinc-800 mt-0.5">{item.availability}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Amenities Section */}
      <div className="px-4">
        <div className="bg-white rounded-3xl p-5 border border-zinc-200 shadow-sm">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-3">
            Amenities & Features
          </h3>

          <div className="flex flex-wrap gap-2">
            {item.amenities.map((amenity, i) => (
              <span
                key={i}
                className="px-3 py-1.5 bg-zinc-100 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-700"
              >
                {amenity}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="px-4 mt-4">
        <div className="bg-white rounded-3xl p-5 border border-zinc-200 shadow-sm">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2.5">
            Owner Description
          </h3>
          <p className="text-xs text-zinc-600 leading-relaxed">
            {item.description}
          </p>
        </div>
      </div>

      {/* Owner Contact profile summary */}
      <div className="px-4 mt-4">
        <div className="bg-white rounded-3xl p-4 border border-zinc-200 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center text-purple-600">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-black text-zinc-900">{item.ownerName}</p>
              <p className="text-[10px] text-zinc-400 font-medium">Direct contact, no brokerage fees</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-600 text-[10px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Active Owner</span>
          </div>
        </div>
      </div>

      {/* STICKY BOTTOM ACTION BAR */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t border-zinc-200 shadow-[0_-8px_24px_rgba(0,0,0,0.06)] flex items-center justify-between gap-4 z-40">
        <div>
          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Direct Connect</p>
          <p className="text-base font-black text-zinc-900">
            ₹{item.price.toLocaleString('en-IN')}{item.type === 'rent' ? '/mo' : ''}
          </p>
        </div>

        <button
          id="btn_contact_owner"
          onClick={() => onStartChat(item)}
          className="flex items-center gap-2.5 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold shadow-md hover:shadow-lg transition-all active:scale-95 text-xs tracking-wider uppercase"
        >
          <MessageSquare className="w-4 h-4 fill-current" />
          <span>Chat on WhatsApp</span>
        </button>
      </div>
    </div>
  );
}
