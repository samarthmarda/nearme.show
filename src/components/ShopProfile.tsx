/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ArrowLeft, MessageSquare, Phone, MapPin, Clock, Star, ShieldCheck, Bike } from 'lucide-react';
import { Shop, CatalogueItem } from '../types';

interface ShopProfileProps {
  shop: Shop;
  onBack: () => void;
  onStartChat: (shop: Shop, item?: CatalogueItem) => void;
}

export default function ShopProfile({ shop, onBack, onStartChat }: ShopProfileProps) {
  const [selectedItem, setSelectedItem] = useState<CatalogueItem | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const handleAdjustQty = (itemId: string, delta: number) => {
    setQuantities(prev => {
      const current = prev[itemId] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [itemId]: next };
    });
  };

  const getActiveOrderItems = () => {
    return shop.catalogue.filter(item => (quantities[item.id] || 0) > 0);
  };

  const activeOrderItems = getActiveOrderItems();
  const totalPrice = activeOrderItems.reduce((sum, item) => sum + (item.price * (quantities[item.id] || 0)), 0);

  const handleWhatsAppCheckout = () => {
    if (activeOrderItems.length > 0) {
      // Create detailed order text for pre-filling WhatsApp
      const itemsText = activeOrderItems
        .map(item => `• ${item.name} (Qty: ${quantities[item.id]} x ₹${item.price})`)
        .join('\n');
      const text = `Hi, I'm interested in ordering from your shop on nearme.show:\n\n${itemsText}\n\nTotal: ₹${totalPrice}\n\nPlease confirm my order so we can dispatch a Rapido delivery rider!`;
      
      // Call mock or real WhatsApp handoff
      onStartChat(shop, activeOrderItems[0]); // pass the first item as reference
    } else {
      // Default message
      onStartChat(shop);
    }
  };

  return (
    <div id={`shop_profile_${shop.id}`} className="w-full bg-zinc-50 min-h-screen pb-32">
      {/* Hero Banner Area */}
      <div className="relative w-full h-56 md:h-64 bg-zinc-200">
        <img
          src={shop.banner}
          alt={shop.name}
          className="w-full h-full object-cover"
        />
        {/* Dark overlay top and bottom */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />

        {/* Back Button */}
        <button
          id="btn_shop_back"
          onClick={onBack}
          className="absolute top-4 left-4 p-2 bg-white/95 backdrop-blur-sm rounded-full shadow-lg text-zinc-800 hover:bg-white transition-all active:scale-95"
          title="Go Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Floating Verified / Badge */}
        {shop.verified && (
          <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 bg-emerald-600 text-white rounded-full text-xs font-bold shadow-md">
            <ShieldCheck className="w-4 h-4 fill-white text-emerald-600" />
            <span>nearme verified</span>
          </div>
        )}

        {/* Brand/Shop Basic Info overlay */}
        <div className="absolute bottom-4 left-4 right-4 flex items-end gap-4 text-white">
          <img
            src={shop.logo}
            alt={`${shop.name} logo`}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-md bg-white flex-shrink-0"
          />
          <div className="min-w-0">
            <span className="text-[10px] font-black uppercase tracking-widest text-orange-300">
              {shop.category === 'restaurant' || shop.category === 'cafe' ? 'Food & Beverage' : shop.category}
            </span>
            <h2 className="text-lg md:text-xl font-extrabold truncate drop-shadow-sm leading-tight">
              {shop.name}
            </h2>
          </div>
        </div>
      </div>

      {/* Trust & Meta Info Row */}
      <div className="bg-white border-b border-zinc-200 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-zinc-900 bg-zinc-50 px-2.5 py-1.5 rounded-xl border border-zinc-200">
              <Star className="w-4 h-4 text-amber-500 fill-current" />
              <span className="text-sm font-bold">{shop.rating}</span>
              <span className="text-[10px] text-zinc-400 font-semibold">({shop.reviewsCount} reviews)</span>
            </div>
            
            <div className="text-xs text-zinc-500">
              <span className="font-bold text-zinc-800">{shop.distance} km</span> away
              <p className="text-[10px] text-zinc-400 mt-0.5">{shop.area}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${shop.isOpen ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`} />
            <span className="text-xs font-bold text-zinc-700">
              {shop.isOpen ? 'Open Now' : 'Closed'}
            </span>
            <span className="text-[10px] text-zinc-400 font-medium">({shop.hours})</span>
          </div>
        </div>
      </div>

      {/* Rapido Explainer banner */}
      <div className="mx-4 mt-4 p-3 bg-orange-50 border border-orange-100 rounded-2xl flex items-start gap-3 text-orange-900">
        <div className="p-2 bg-orange-100 rounded-xl text-orange-600 flex-shrink-0">
          <Bike className="w-4 h-4" />
        </div>
        <div className="text-xs">
          <h4 className="font-black text-zinc-900 font-sans">Direct Order, Rapido Fulfilled</h4>
          <p className="text-orange-700 font-medium mt-0.5 leading-relaxed">
            Choose your items, click WhatsApp to order. Once confirmed, tap the Rapido button in your deal thread to schedule your pickup. Zero platform fees!
          </p>
        </div>
      </div>

      {/* Main Grid: Catalogue & Shop Info */}
      <div className="px-4 mt-6">
        <h3 className="text-sm font-extrabold text-zinc-800 uppercase tracking-widest mb-3.5">
          {shop.category === 'restaurant' || shop.category === 'cafe' ? 'Explore Menu' : 'Product Catalogue'}
        </h3>

        {/* Catalogue Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {shop.catalogue.map((item) => {
            const qty = quantities[item.id] || 0;
            return (
              <div
                key={item.id}
                id={`catalogue_item_${item.id}`}
                onClick={() => setSelectedItem(item)}
                className={`bg-white p-3.5 rounded-2xl border transition-all hover:shadow-md cursor-pointer flex gap-4 ${
                  selectedItem?.id === item.id ? 'border-orange-600 ring-2 ring-orange-500/10' : 'border-zinc-200'
                }`}
              >
                {/* Item Thumbnail */}
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-20 h-20 rounded-xl object-cover border border-zinc-200 flex-shrink-0"
                />

                {/* Item Details */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-zinc-900 truncate leading-tight">
                      {item.name}
                    </h4>
                    <p className="text-[10px] text-zinc-500 mt-1 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs font-black text-orange-600">₹{item.price}</span>
                    
                    {/* Add-to-cart style counter */}
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center bg-zinc-50 border border-zinc-200 rounded-xl p-0.5"
                    >
                      {qty > 0 ? (
                        <>
                          <button
                            onClick={() => handleAdjustQty(item.id, -1)}
                            className="w-6 h-6 flex items-center justify-center font-bold text-zinc-600 hover:bg-zinc-200 rounded-lg"
                          >
                            -
                          </button>
                          <span className="text-xs font-bold text-zinc-800 px-2 min-w-[16px] text-center">
                            {qty}
                          </span>
                          <button
                            onClick={() => handleAdjustQty(item.id, 1)}
                            className="w-6 h-6 flex items-center justify-center font-bold text-zinc-600 hover:bg-zinc-200 rounded-lg"
                          >
                            +
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleAdjustQty(item.id, 1)}
                          className="px-3.5 py-1 text-[10px] font-black uppercase text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                        >
                          Add
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Secondary Shop details (Address, Map node, etc.) */}
      <div className="px-4 mt-8">
        <div className="bg-white rounded-3xl p-5 border border-zinc-200">
          <h4 className="text-xs font-extrabold text-zinc-800 uppercase tracking-widest mb-3">
            Shop Information
          </h4>

          <div className="space-y-3.5 text-xs text-zinc-600">
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-zinc-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-zinc-800">Store Address</p>
                <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">{shop.address}</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Phone className="w-4 h-4 text-zinc-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-zinc-800">Phone Contact</p>
                <p className="text-[11px] text-zinc-500 mt-0.5">{shop.phone}</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-zinc-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-zinc-800">Business Hours</p>
                <p className="text-[11px] text-zinc-500 mt-0.5">{shop.hours}</p>
              </div>
            </div>
          </div>

          {/* Quick Disclaimer */}
          <div className="mt-4 pt-4 border-t border-zinc-200 text-[10px] text-zinc-400 leading-normal">
            Note: nearme.show assists local merchants by manually curating and digitizing their catalogs. Once you chat on WhatsApp, your transaction is directly with the shop owner. We recommend inspecting food and items prior to accepting the Rapido delivery.
          </div>
        </div>
      </div>

      {/* STICKY BOTTOM ACTION BAR */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t border-zinc-200 shadow-[0_-8px_24px_rgba(0,0,0,0.06)] flex items-center justify-between gap-4 z-40">
        {activeOrderItems.length > 0 ? (
          <div className="flex-1">
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
              {activeOrderItems.length} {activeOrderItems.length === 1 ? 'Item' : 'Items'} selected
            </p>
            <p className="text-base font-black text-zinc-900">
              ₹{totalPrice}{' '}
              <span className="text-[10px] text-zinc-400 font-normal ml-1">
                + Rapido delivery
              </span>
            </p>
          </div>
        ) : (
          <div className="flex-1">
            <p className="text-xs font-bold text-zinc-800">Support {shop.name}</p>
            <p className="text-[10px] text-zinc-400 mt-0.5">Direct chat, no hidden margins</p>
          </div>
        )}

        <button
          id="btn_whatsapp_checkout"
          onClick={handleWhatsAppCheckout}
          className="flex items-center gap-2.5 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold shadow-md hover:shadow-lg transition-all active:scale-95 text-xs tracking-wider uppercase shrink-0"
        >
          <MessageSquare className="w-4 h-4 fill-current" />
          <span>Chat on WhatsApp</span>
        </button>
      </div>

      {/* Catalogue Item Detail Overlay Modal */}
      {selectedItem && (
        <div
          id="catalogue_item_modal"
          className="fixed inset-0 bg-zinc-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedItem.image}
              alt={selectedItem.name}
              className="w-full h-52 object-cover"
            />
            
            <div className="p-5">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-black text-zinc-900">{selectedItem.name}</h3>
                <span className="text-xs font-black text-orange-600 bg-orange-50 px-2.5 py-1 rounded-xl">
                  ₹{selectedItem.price}
                </span>
              </div>
              
              <p className="text-xs text-zinc-500 mt-2.5 leading-relaxed">
                {selectedItem.description}
              </p>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setSelectedItem(null)}
                  className="flex-1 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold rounded-2xl text-xs transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleAdjustQty(selectedItem.id, 1);
                    setSelectedItem(null);
                  }}
                  className="flex-1 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-2xl text-xs shadow-sm transition-all"
                >
                  Add to Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
