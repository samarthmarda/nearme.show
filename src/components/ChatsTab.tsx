/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MessageSquare, ArrowLeft, Send, Check, ShieldCheck, Bike, ArrowRight, Phone, CheckCircle2 } from 'lucide-react';
import { MockChat, ChatMessage } from '../types';

interface ChatsTabProps {
  chats: MockChat[];
  onSendMessage: (chatId: string, text: string) => void;
  onRequestRapido: (chatId: string) => void;
  onConfirmDelivery: (chatId: string) => void;
}

export default function ChatsTab({ chats, onSendMessage, onRequestRapido, onConfirmDelivery }: ChatsTabProps) {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');

  const activeChat = chats.find(c => c.id === selectedChatId);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedChatId) return;

    onSendMessage(selectedChatId, inputText.trim());
    setInputText('');
  };

  const statusColors: Record<string, string> = {
    'Order Initiated': 'bg-blue-50 text-blue-600 border-blue-100',
    'Price Negotiated': 'bg-amber-50 text-amber-600 border-amber-100',
    'Ready for Pickup': 'bg-purple-50 text-purple-600 border-purple-100',
    'Rapido Dispatched': 'bg-orange-50 text-orange-600 border-orange-100 animate-pulse',
    'Delivered': 'bg-emerald-50 text-emerald-600 border-emerald-100',
    'Deal Closed': 'bg-zinc-50 text-zinc-600 border-zinc-200',
    'Request Accepted': 'bg-teal-50 text-teal-600 border-teal-100'
  };

  return (
    <div id="chats_tab_view_container" className="w-full bg-zinc-50 min-h-screen">
      
      {/* 1. MASTER VIEW: CHATS LIST */}
      {!activeChat ? (
        <div className="p-4 pb-24 max-w-md mx-auto">
          {/* Header */}
          <div className="mb-5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 px-2.5 py-1 bg-orange-50 rounded-xl">
              nearme negotiations
            </span>
            <h2 className="text-base font-extrabold text-zinc-900 mt-2 font-sans">Active Deals & Chats</h2>
            <p className="text-xs text-zinc-400 mt-1">Direct peer-to-peer discussions closed via WhatsApp link.</p>
          </div>

          {/* Chats stream list */}
          {chats.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 border border-zinc-200 text-center shadow-sm">
              <MessageSquare className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
              <p className="text-xs font-bold text-zinc-700">No active deal threads yet</p>
              <p className="text-[11px] text-zinc-400 mt-1 max-w-[240px] mx-auto">
                Explore local shops, second-hand items, or housing and tap "Chat on WhatsApp" to initiate a deal.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {chats.map((chat) => (
                <button
                  key={chat.id}
                  id={`chat_thread_btn_${chat.id}`}
                  onClick={() => setSelectedChatId(chat.id)}
                  className="w-full bg-white p-4 rounded-3xl border border-zinc-200 text-left hover:shadow-md transition-all flex gap-4"
                >
                  {/* Target Avatar Thumbnail */}
                  <img
                    src={chat.targetImage}
                    alt={chat.targetName}
                    className="w-12 h-12 rounded-2xl object-cover border border-zinc-200 flex-shrink-0"
                  />

                  {/* Details block */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <h3 className="text-xs font-black text-zinc-900 truncate">
                          {chat.targetName}
                        </h3>
                        <span className="text-[9px] font-bold text-zinc-400 shrink-0">
                          {chat.lastMessageTime}
                        </span>
                      </div>
                      
                      <p className="text-[11px] text-zinc-500 truncate mt-0.5 leading-normal">
                        {chat.lastMessage}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-zinc-100">
                      {/* Deal Status Tag */}
                      <span className={`text-[9px] font-extrabold border px-2 py-0.5 rounded-lg uppercase tracking-wider ${statusColors[chat.status] || 'bg-zinc-50 text-zinc-500'}`}>
                        {chat.status}
                      </span>
                      
                      <span className="text-[10px] text-orange-600 font-bold">
                        {chat.priceText}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Explainer card */}
          <div className="mt-6 p-4 bg-emerald-50 text-emerald-900 border border-emerald-100 rounded-3xl flex gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            <div className="text-[11px] leading-relaxed">
              <span className="font-bold">WhatsApp Handshake Security:</span> nearme.show does not process payments or escrow funds. All terms, delivery addresses, and payments are settled directly between parties on WhatsApp, bypassing high portal commission charges.
            </div>
          </div>
        </div>
      ) : (
        /* 2. DETAIL VIEW: CHAT ROOM */
        <div className="flex flex-col h-screen max-w-md mx-auto bg-zinc-50 border-x border-zinc-200">
          
          {/* Chat Header */}
          <div className="bg-white border-b border-zinc-200 p-3 flex items-center justify-between sticky top-0 z-20 shadow-sm">
            <div className="flex items-center gap-3">
              <button
                id="btn_chat_back_to_list"
                onClick={() => setSelectedChatId(null)}
                className="p-1.5 hover:bg-zinc-100 rounded-full text-zinc-600 transition-colors"
                title="Back to list"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              
              <img
                src={activeChat.targetImage}
                alt={activeChat.targetName}
                className="w-10 h-10 rounded-xl object-cover border border-zinc-200 flex-shrink-0"
              />

              <div className="min-w-0">
                <h3 className="text-xs font-black text-zinc-950 truncate leading-tight">
                  {activeChat.targetName}
                </h3>
                <span className="text-[9px] font-bold text-zinc-400">
                  Negotiating on {activeChat.priceText}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={`tel:${activeChat.whatsappNumber}`}
                className="p-2 hover:bg-zinc-50 rounded-full text-zinc-500 border border-zinc-200"
                title="Call"
              >
                <Phone className="w-4 h-4" />
              </a>
              <span className={`text-[9px] font-black uppercase border px-2 py-1 rounded-xl shrink-0 ${statusColors[activeChat.status]}`}>
                {activeChat.status}
              </span>
            </div>
          </div>

          {/* RAPIDO INTEGRATION BANNER WIDGET */}
          <div className="bg-white border-b border-zinc-200 p-4">
            
            {/* Conditional display depending on Rapido state */}
            {activeChat.status !== 'Rapido Dispatched' && activeChat.status !== 'Delivered' && (
              <div id="rapido_delivery_trigger_panel" className="flex items-start gap-3.5 bg-gradient-to-r from-orange-50 to-orange-100/30 border border-orange-100 p-4 rounded-2xl">
                <div className="p-2 bg-orange-100 text-orange-600 rounded-xl flex-shrink-0">
                  <Bike className="w-5 h-5" />
                </div>
                <div className="flex-1 text-xs">
                  <h4 className="font-extrabold text-zinc-900 leading-tight">Request Local Fulfillment</h4>
                  <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
                    Have you finalized pricing and details with the seller? Click to book a nearby Rapido package pickup & dropoff.
                  </p>
                  
                  <button
                    id="btn_request_rapido"
                    onClick={() => onRequestRapido(activeChat.id)}
                    className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold hover:shadow-md transition-all active:scale-95 text-[10px] uppercase tracking-wider"
                  >
                    <span>Request Rapido Delivery</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* active dispatch state */}
            {activeChat.status === 'Rapido Dispatched' && activeChat.rapidoDetails && (
              <div id="rapido_rider_credentials_panel" className="bg-zinc-950 text-white p-4 rounded-3xl border border-zinc-800 shadow-lg relative overflow-hidden animate-slide-up">
                <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/10 rounded-full blur-xl" />
                
                <div className="flex items-center gap-2 mb-3">
                  <Bike className="w-4 h-4 text-orange-400 animate-bounce" />
                  <span className="text-[10px] font-black tracking-wider text-orange-400 uppercase">
                    RAPIDO DELIVERY LIVE
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 border-b border-zinc-800 pb-3.5">
                  <div>
                    <p className="text-[9px] text-zinc-400 uppercase font-bold">Rider Assigned</p>
                    <p className="text-xs font-black text-white mt-0.5">{activeChat.rapidoDetails.driverName}</p>
                    <p className="text-[10px] text-zinc-500">{activeChat.rapidoDetails.driverPhone}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-zinc-400 uppercase font-bold">Vehicle Reg No.</p>
                    <p className="text-xs font-black text-white mt-0.5">{activeChat.rapidoDetails.vehicleNo}</p>
                    <p className="text-[10px] text-zinc-500">OTP Code: <span className="text-orange-400 font-black">{activeChat.rapidoDetails.otp}</span></p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 text-[10px]">
                  <div className="text-zinc-300">
                    Est. delivery fee: <span className="text-white font-bold">₹{activeChat.rapidoDetails.deliveryFee}</span>
                    <p className="text-zinc-400 text-[9px] mt-0.5">Arriving in approx {activeChat.rapidoDetails.etaMinutes} mins</p>
                  </div>

                  <button
                    id="btn_confirm_delivered"
                    onClick={() => onConfirmDelivery(activeChat.id)}
                    className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-black uppercase tracking-wider text-[9px] flex items-center gap-1 shadow"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Confirm Received</span>
                  </button>
                </div>
              </div>
            )}

            {/* Delivered state */}
            {activeChat.status === 'Delivered' && (
              <div id="rapido_delivery_delivered_panel" className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 text-emerald-800">
                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="text-xs">
                  <h4 className="font-black text-emerald-950">Package Delivered Successfully</h4>
                  <p className="text-emerald-700 font-semibold mt-0.5">Rider has handed over the items. Transaction is closed!</p>
                </div>
              </div>
            )}
          </div>

          {/* Chat Messages Log */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-none bg-[#E5DDD5]">
            
            <div className="mx-auto w-fit text-[10px] text-zinc-500 bg-white/80 px-2.5 py-1 rounded-lg border border-zinc-200 uppercase tracking-wider font-bold">
              WhatsApp Integration Handoff
            </div>

            {activeChat.messages.map((msg) => {
              const isMe = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`p-3 max-w-[80%] rounded-2xl text-xs relative ${
                    isMe
                      ? 'bg-[#DCF8C6] text-zinc-900 rounded-tr-none shadow-sm'
                      : 'bg-white text-zinc-900 rounded-tl-none shadow-sm'
                  }`}>
                    <p className="leading-relaxed whitespace-pre-line font-sans font-medium">{msg.text}</p>
                    
                    <div className="flex items-center justify-end gap-1 mt-1">
                      <span className="text-[8px] text-zinc-400 font-bold block text-right">
                        {msg.timestamp}
                      </span>
                      {isMe && <Check className="w-3 h-3 text-emerald-500" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Chat input box */}
          <form onSubmit={handleSend} className="bg-white border-t border-zinc-200 p-3 flex gap-2 items-center">
            <input
              type="text"
              required
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type message..."
              className="flex-1 p-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs text-zinc-800 focus:outline-none focus:ring-2 focus:ring-orange-500/15"
            />
            <button
              type="submit"
              id="btn_send_chat_msg"
              className="p-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl shadow active:scale-95 transition-all flex items-center justify-center"
              title="Send Message"
            >
              <Send className="w-4 h-4 fill-current" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
