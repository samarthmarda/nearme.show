/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PlusCircle, MapPin, Clock, CreditCard, Sparkles, ToggleLeft, ToggleRight, MessageSquare, Check, HelpCircle } from 'lucide-react';
import { ServiceRequest } from '../types';

interface RequestsTabProps {
  requests: ServiceRequest[];
  onPostRequest: (newReq: Omit<ServiceRequest, 'id' | 'createdAt' | 'status' | 'distance'>) => void;
  onAcceptRequest: (reqId: string) => void;
  userArea: string;
}

export default function RequestsTab({ requests, onPostRequest, onAcceptRequest, userArea }: RequestsTabProps) {
  const [activeRole, setActiveRole] = useState<'consumer' | 'professional'>('consumer');
  
  // Consumer states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'Repair' | 'Wellness' | 'Cleaning' | 'Errands' | 'Tailoring' | 'Other'>('Repair');
  const [price, setPrice] = useState<number>(250);
  const [notes, setNotes] = useState('');
  const [postSuccess, setPostSuccess] = useState(false);

  // Professional/Gig worker states
  const [hasPass, setHasPass] = useState(false);
  const [isActiveLooking, setIsActiveLooking] = useState(true);
  const [spend, setSpend] = useState(0);
  const [acceptedCount, setAcceptedCount] = useState(0);

  const handlePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || price <= 0) return;

    onPostRequest({
      title,
      category,
      price,
      notes,
      location: userArea,
      userName: "Rahul Sharma (You)",
      userWhatsapp: "+919900887766"
    });

    setTitle('');
    setNotes('');
    setPrice(250);
    setPostSuccess(true);
    setTimeout(() => {
      setPostSuccess(false);
    }, 3000);
  };

  const handleBuyPass = () => {
    setHasPass(true);
    setSpend(prev => prev + 50);
  };

  return (
    <div id="requests_tab_container" className="w-full bg-zinc-50 min-h-screen pb-24">
      {/* Tab Role Switcher Header */}
      <div className="bg-white border-b border-zinc-200 p-4 sticky top-0 z-10 shadow-sm">
        <div className="flex bg-zinc-100 p-1 rounded-2xl max-w-md mx-auto">
          <button
            id="btn_role_consumer"
            onClick={() => setActiveRole('consumer')}
            className={`flex-1 py-2.5 text-xs font-extrabold rounded-xl transition-all ${
              activeRole === 'consumer'
                ? 'bg-white text-zinc-900 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            I need something done
          </button>
          <button
            id="btn_role_professional"
            onClick={() => setActiveRole('professional')}
            className={`flex-1 py-2.5 text-xs font-extrabold rounded-xl transition-all ${
              activeRole === 'professional'
                ? 'bg-white text-zinc-900 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            I want to earn (Gig Worker)
          </button>
        </div>
      </div>

      {/* 1. CONSUMER SIDE: POST A REQUEST FORM */}
      {activeRole === 'consumer' && (
        <div className="p-4 max-w-md mx-auto">
          {postSuccess && (
            <div className="mb-4 p-4 bg-emerald-50 border border-emerald-100 rounded-3xl flex items-center gap-3 text-emerald-800 animate-slide-up">
              <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white flex-shrink-0">
                <Check className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <p className="font-extrabold">Your request is live!</p>
                <p className="text-emerald-600 font-semibold mt-0.5">Nearby service professionals can now see and accept it.</p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-3xl p-5 border border-zinc-200 shadow-sm">
            <div className="mb-5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 px-2 py-0.5 bg-orange-50 rounded-lg">
                Reverse Marketplace
              </span>
              <h2 className="text-base font-extrabold text-zinc-900 mt-2">Post a Service Request</h2>
              <p className="text-xs text-zinc-400 mt-1">Name your task, set your budget, and get connected on WhatsApp instantly.</p>
            </div>

            <form onSubmit={handlePostSubmit} className="space-y-4">
              {/* Task Title */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1.5 uppercase tracking-wide">
                  What do you need done?
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Fix kitchen tap leakage / Home massage therapy"
                  className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-800 focus:outline-none focus:ring-2 focus:ring-orange-500/15 focus:border-orange-600"
                />
              </div>

              {/* Grid: Category & Price */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1.5 uppercase tracking-wide">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-800 focus:outline-none focus:ring-2 focus:ring-orange-500/15 focus:border-orange-600"
                  >
                    <option value="Repair">🔧 Repair / Plumber</option>
                    <option value="Cleaning">🧹 Cleaning</option>
                    <option value="Wellness">💆 Wellness / Massage</option>
                    <option value="Errands">📦 Errands / Delivery</option>
                    <option value="Tailoring">🪡 Tailoring</option>
                    <option value="Other">✨ Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1.5 uppercase tracking-wide">
                    What will you pay? (₹)
                  </label>
                  <input
                    type="number"
                    required
                    min={50}
                    value={price}
                    onChange={(e) => setPrice(parseInt(e.target.value) || 0)}
                    placeholder="e.g. 250"
                    className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-black text-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500/15 focus:border-orange-600"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1.5 uppercase tracking-wide">
                  Additional Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Tell workers more details, e.g. location specifics, preferred time, tools required."
                  className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-800 focus:outline-none focus:ring-2 focus:ring-orange-500/15 focus:border-orange-600 resize-none"
                />
              </div>

              {/* Location display */}
              <div className="flex items-center gap-2 p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-xs text-zinc-500">
                <MapPin className="w-4 h-4 text-orange-600" />
                <span>Auto-pinned to your current area: <strong className="text-zinc-700">{userArea}</strong></span>
              </div>

              {/* Big CTA */}
              <button
                type="submit"
                id="btn_post_request_submit"
                className="w-full py-4 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-bold shadow-md hover:shadow-lg transition-all active:scale-98 text-xs uppercase tracking-wider mt-2"
              >
                Post Request
              </button>
            </form>
          </div>

          {/* Guidelines info card */}
          <div className="mt-4 p-4 bg-zinc-100 rounded-3xl border border-zinc-200 flex gap-3 text-zinc-600">
            <HelpCircle className="w-5 h-5 text-zinc-400 flex-shrink-0" />
            <div className="text-[11px] leading-relaxed">
              <span className="font-bold text-zinc-800">Direct & Fair:</span> Your request will be instantly shared with verified plumbers, wellness therapists, and delivery partners near you. Once accepted, they will ping you on WhatsApp. Close details directly! No booking commissions.
            </div>
          </div>
        </div>
      )}

      {/* 2. PROFESSIONAL / GIG WORKER SIDE */}
      {activeRole === 'professional' && (
        <div className="p-4 max-w-md mx-auto">
          
          {/* Gig worker metrics dashboard */}
          <div className="bg-zinc-950 text-white rounded-3xl p-5 shadow-lg mb-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-full blur-xl" />
            
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4">
              <div>
                <span className="text-[9px] font-bold text-orange-400 bg-orange-500/10 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Partner Dashboard
                </span>
                <h3 className="text-sm font-black mt-1">Professional Portal</h3>
              </div>

              {/* Toggle switch for actively looking */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-400 font-bold uppercase">
                  {isActiveLooking ? 'Looking for gigs' : 'Off-duty'}
                </span>
                <button
                  id="btn_toggle_looking"
                  onClick={() => setIsActiveLooking(!isActiveLooking)}
                  className="text-zinc-400 hover:text-white"
                  title="Toggle duty state"
                >
                  {isActiveLooking ? (
                    <ToggleRight className="w-8 h-8 text-emerald-500" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-zinc-500" />
                  )}
                </button>
              </div>
            </div>

            {/* Core metrics */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 bg-zinc-900 rounded-2xl border border-zinc-800">
                <p className="text-[9px] text-zinc-400 font-bold uppercase">Pass Status</p>
                <p className={`text-xs font-black mt-1 ${hasPass ? 'text-emerald-400' : 'text-orange-400'}`}>
                  {hasPass ? 'ACTIVE' : 'NO PASS'}
                </p>
              </div>
              <div className="p-2.5 bg-zinc-900 rounded-2xl border border-zinc-800">
                <p className="text-[9px] text-zinc-400 font-bold uppercase">Today Spend</p>
                <p className="text-xs font-black text-white mt-1">₹{spend}</p>
              </div>
              <div className="p-2.5 bg-zinc-900 rounded-2xl border border-zinc-800">
                <p className="text-[9px] text-zinc-400 font-bold uppercase">Gigs Accepted</p>
                <p className="text-xs font-black text-orange-400 mt-1">{acceptedCount}</p>
              </div>
            </div>
          </div>

          {/* MONETIZATION GATE PAYWALL (Shown if pass is inactive) */}
          {!hasPass && (
            <div id="monetization_paywall_card" className="bg-orange-50 border border-orange-100 rounded-3xl p-5 mb-5 shadow-sm text-orange-900 animate-slide-up">
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 bg-orange-100 rounded-2xl text-orange-600 flex-shrink-0">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-zinc-900 uppercase tracking-wide">
                    Unlock Unlimited Gigs Near You
                  </h4>
                  <p className="text-[11px] text-orange-700 mt-1 leading-relaxed">
                    Access high-paying requests for repairs, wellness, and errands on your street. Get direct WhatsApp contact of customers instantly. No commission on your earnings!
                  </p>
                </div>
              </div>

              {/* Pricing Pass CTA */}
              <div className="mt-4 pt-4 border-t border-orange-200/60 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[9px] text-orange-600 font-bold uppercase">Bengaluru Unlimited Pass</p>
                  <p className="text-sm font-black text-zinc-900">₹50 <span className="text-[10px] text-orange-600 font-normal">/ day pass</span></p>
                </div>
                
                <button
                  id="btn_buy_unlimited_pass"
                  onClick={handleBuyPass}
                  className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 fill-current" />
                  <span>Activate Pass</span>
                </button>
              </div>
            </div>
          )}

          {/* LIVE REQUESTS FEED HEADER */}
          <div className="flex items-center justify-between mb-3.5">
            <h3 className="text-xs font-extrabold text-zinc-800 uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Nearby Gigs ({requests.length})
            </h3>
            
            <span className="text-[10px] text-zinc-400 font-bold">
              Sorted by distance
            </span>
          </div>

          {/* GIGS STREAM FEED */}
          <div className="space-y-3.5">
            {requests.map((req, index) => {
              // Blur beyond index 1 if doesn't have pass
              const isLocked = !hasPass && index >= 1;

              return (
                <div
                  key={req.id}
                  id={`request_card_${req.id}`}
                  className={`bg-white rounded-3xl p-4 border border-zinc-200 transition-all ${
                    isLocked ? 'opacity-65 select-none relative overflow-hidden' : 'hover:shadow-md'
                  }`}
                >
                  {/* Lock Overlay if locked */}
                  {isLocked && (
                    <div className="absolute inset-0 bg-zinc-50/70 backdrop-blur-[3px] z-10 flex flex-col items-center justify-center p-4 text-center">
                      <CreditCard className="w-5 h-5 text-zinc-400 mb-1" />
                      <p className="text-[10px] font-extrabold text-zinc-700">₹50/Day pass required to view</p>
                      <button
                        onClick={handleBuyPass}
                        className="text-[9px] font-bold text-orange-600 underline mt-1"
                      >
                        Unlock instantly
                      </button>
                    </div>
                  )}

                  <div className="flex items-start gap-3 justify-between">
                    {/* Price - MOST VISUALLY DOMINANT */}
                    <div className="order-2 text-right">
                      <span className="text-base font-black text-orange-600 bg-orange-50 px-3 py-1.5 rounded-2xl block border border-orange-100">
                        ₹{req.price}
                      </span>
                      <span className="text-[9px] text-zinc-400 block mt-1 font-bold">Offer Budget</span>
                    </div>

                    {/* Left block info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 px-1.5 py-0.5 bg-emerald-50 rounded">
                          {req.category}
                        </span>
                        
                        <div className="flex items-center text-[10px] text-zinc-400 font-medium">
                          <Clock className="w-3 h-3 mr-1" />
                          <span>{req.createdAt}</span>
                        </div>
                      </div>

                      <h4 className="text-xs font-black text-zinc-900 mt-2 leading-snug">
                        {req.title}
                      </h4>

                      <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed line-clamp-2">
                        {req.notes || "No details provided by poster."}
                      </p>

                      <div className="flex items-center gap-2 mt-3.5 text-[10px] text-zinc-400 font-semibold">
                        <span className="flex items-center text-zinc-500 bg-zinc-50 px-2 py-0.5 rounded border border-zinc-200">
                          <MapPin className="w-3.5 h-3.5 mr-0.5 text-orange-600" />
                          {req.distance} km away
                        </span>
                        <span>•</span>
                        <span>{req.location}</span>
                      </div>
                    </div>
                  </div>

                  {/* Accept action for unlocked items */}
                  {!isLocked && (
                    <div className="mt-4 pt-3.5 border-t border-zinc-100 flex items-center justify-between">
                      <span className="text-[10px] text-zinc-400 font-medium">
                        By <strong className="text-zinc-600">{req.userName}</strong>
                      </span>
                      
                      {req.status === 'open' ? (
                        <button
                          onClick={() => {
                            onAcceptRequest(req.id);
                            setAcceptedCount(prev => prev + 1);
                          }}
                          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold rounded-xl shadow transition-all active:scale-95 uppercase tracking-wider"
                        >
                          <MessageSquare className="w-3 h-3 fill-current" />
                          <span>Accept & Chat</span>
                        </button>
                      ) : (
                        <span className="text-[10px] font-black uppercase text-zinc-400 bg-zinc-50 border border-zinc-200 px-3 py-1.5 rounded-xl">
                          Accepted by {req.acceptedBy}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
