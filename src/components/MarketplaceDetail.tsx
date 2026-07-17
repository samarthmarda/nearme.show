/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowLeft, MessageSquare, MapPin, Heart, User, Sparkles, AlertCircle, Bike } from 'lucide-react';
import { MarketplaceItem } from '../types';

interface MarketplaceDetailProps {
  item: MarketplaceItem;
  onBack: () => void;
  onStartChat: (item: MarketplaceItem) => void;
}

export default function MarketplaceDetail({ item, onBack, onStartChat }: MarketplaceDetailProps) {
  return (
    <div id={`marketplace_detail_${item.id}`} className="w-full bg-zinc-50 min-h-screen pb-32">
      {/* Photo Banner */}
      <div className="relative w-full h-72 bg-zinc-200">
        <img
          src={item.images[0]}
          alt={item.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50" />

        {/* Back button */}
        <button
          id="btn_marketplace_back"
          onClick={onBack}
          className="absolute top-4 left-4 p-2 bg-white/95 backdrop-blur-sm rounded-full shadow-lg text-zinc-800 hover:bg-white transition-all active:scale-95"
          title="Go Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Condition tag overlay */}
        <div className="absolute bottom-4 left-4 flex gap-2">
          <span className="px-3 py-1 bg-zinc-900/80 backdrop-blur-sm text-white rounded-full text-xs font-bold uppercase tracking-wider">
            {item.condition}
          </span>
          <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-xs font-bold uppercase tracking-wider">
            2nd Hand
          </span>
        </div>
      </div>

      {/* Main Stats (Price & Title) */}
      <div className="bg-white border-b border-zinc-200 p-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="text-base md:text-lg font-black text-zinc-900 leading-snug">
              {item.title}
            </h1>
            <div className="flex items-center gap-2.5 mt-2">
              <span className="text-lg font-black text-orange-600">
                ₹{item.price.toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-zinc-400 font-semibold">•</span>
              <span className="text-xs text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-lg font-medium">
                {item.category}
              </span>
            </div>
          </div>
          
          <button
            className="p-2.5 bg-zinc-50 hover:bg-zinc-100 rounded-full text-zinc-400 hover:text-orange-600 transition-colors border border-zinc-200"
            title="Add to wishlist"
          >
            <Heart className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-200 text-xs text-zinc-500">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-zinc-400" />
            <span className="font-bold text-zinc-800">{item.distance} km away</span>
            <span>({item.area})</span>
          </div>
          <span>Posted {item.createdAt}</span>
        </div>
      </div>

      {/* Trust Shield with Seller Details */}
      <div className="p-4">
        <div className="bg-white rounded-3xl p-4 border border-zinc-200 shadow-sm">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-3">
            Individual Seller
          </h3>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center border border-zinc-200">
                <User className="w-5 h-5 text-zinc-600" />
              </div>
              <div>
                <p className="text-xs font-black text-zinc-900">{item.sellerName}</p>
                <p className="text-[10px] text-zinc-400 font-medium">Verified neighbor seller</p>
              </div>
            </div>

            <div className="flex flex-col items-end">
              <div className="flex items-center gap-1 px-2.5 py-1 bg-orange-50 rounded-xl border border-orange-200 text-orange-600">
                <Sparkles className="w-3.5 h-3.5 fill-current" />
                <span className="text-xs font-bold">{item.sellerRating}</span>
              </div>
              <span className="text-[9px] text-zinc-400 mt-1">Trust Score</span>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="px-4">
        <div className="bg-white rounded-3xl p-5 border border-zinc-200 shadow-sm">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2.5">
            Description
          </h3>
          <p className="text-xs text-zinc-600 leading-relaxed">
            {item.description}
          </p>

          <div className="mt-4 p-3.5 bg-zinc-50 rounded-2xl flex items-start gap-2.5 border border-zinc-200">
            <AlertCircle className="w-4 h-4 text-zinc-400 flex-shrink-0 mt-0.5" />
            <div className="text-[10px] text-zinc-500 leading-normal">
              <span className="font-bold text-zinc-700">Buying Tip:</span> Always inspect the items physically. Meet the seller in a public place in Indiranagar before completing any online money transfer. Use Rapido Delivery link only if you have finalized the item condition on WhatsApp.
            </div>
          </div>
        </div>
      </div>

      {/* Delivery Banner */}
      <div className="px-4 mt-4">
        <div className="bg-orange-50 border border-orange-100 rounded-3xl p-4 flex gap-3 text-orange-900">
          <div className="p-2.5 bg-orange-100 rounded-2xl text-orange-600 flex-shrink-0">
            <Bike className="w-4.5 h-4.5" />
          </div>
          <div className="text-xs">
            <h4 className="font-black text-zinc-900">Rapido Dropoff available</h4>
            <p className="text-orange-700 font-medium mt-0.5 leading-relaxed">
              Don't want to travel? Request a Rapido parcel delivery. Once the seller packs it, the rider will bring it to your door in minutes.
            </p>
          </div>
        </div>
      </div>

      {/* STICKY BOTTOM ACTION BAR */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t border-zinc-200 shadow-[0_-8px_24px_rgba(0,0,0,0.06)] flex items-center justify-between gap-4 z-40">
        <div>
          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Interested Buyer?</p>
          <p className="text-base font-black text-zinc-900">
            ₹{item.price.toLocaleString('en-IN')}
          </p>
        </div>

        <button
          id="btn_contact_seller"
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
