/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, Plus, PlusCircle, UserCheck, AlertCircle, Check } from 'lucide-react';
import { Shop, CatalogueItem, ServiceRequest } from '../types';

interface ProfileTabProps {
  onboardedShops: Shop[];
  onAddShop: (newShop: Shop) => void;
  postedRequests: ServiceRequest[];
  onClaimShop: (shopId: string) => void;
  claimedShopIds: string[];
}

export default function ProfileTab({
  onboardedShops,
  onAddShop,
  postedRequests,
  onClaimShop,
  claimedShopIds
}: ProfileTabProps) {
  const [currentClaimTab, setCurrentClaimTab] = useState<'info' | 'admin' | 'claim'>('info');

  // New Shop Form State
  const [shopName, setShopName] = useState('');
  const [category, setCategory] = useState<'restaurant' | 'cafe' | 'tailor' | 'cloth_store'>('restaurant');
  const [whatsapp, setWhatsapp] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [logo] = useState('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=150&auto=format&fit=crop&q=60');
  const [banner] = useState('https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&auto=format&fit=crop&q=80');
  
  // Catalogue Items for the new shop
  const [catalogItems, setCatalogItems] = useState<Omit<CatalogueItem, 'id'>[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState<number>(100);
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemImg] = useState('https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&auto=format&fit=crop&q=60');

  const [onboardSuccess, setOnboardSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleAddCatalogItem = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || newItemPrice <= 0) return;

    setCatalogItems(prev => [
      ...prev,
      {
        name: newItemName,
        price: newItemPrice,
        description: newItemDesc,
        image: newItemImg
      }
    ]);

    setNewItemName('');
    setNewItemPrice(100);
    setNewItemDesc('');
  };

  const handleOnboardShop = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName.trim() || !whatsapp.trim() || catalogItems.length === 0) {
      setFormError("Please provide store details and at least 1 catalogue item!");
      return;
    }
    setFormError(null);

    const compiledItems: CatalogueItem[] = catalogItems.map((item, idx) => ({
      ...item,
      id: `item-dynamic-${Date.now()}-${idx}`
    }));

    const newShop: Shop = {
      id: `shop-dynamic-${Date.now()}`,
      name: shopName,
      category,
      logo,
      banner,
      rating: 4.5,
      reviewsCount: 1,
      distance: 0.5,
      area: "Indiranagar, 12th Main",
      lat: 12.9720 + (Math.random() - 0.5) * 0.01,
      lng: 77.6410 + (Math.random() - 0.5) * 0.01,
      isOpen: true,
      hours: "9:00 AM - 10:00 PM",
      whatsapp,
      address,
      phone,
      verified: true,
      catalogue: compiledItems
    };

    onAddShop(newShop);
    setOnboardSuccess(true);
    
    // Clear forms
    setShopName('');
    setWhatsapp('');
    setAddress('');
    setPhone('');
    setCatalogItems([]);

    setTimeout(() => {
      setOnboardSuccess(false);
      setCurrentClaimTab('info');
    }, 3000);
  };

  return (
    <div id="profile_tab_container" className="w-full bg-zinc-50 min-h-screen pb-24">
      {/* Profile Header */}
      <div className="bg-white border-b border-zinc-200 p-5 text-center">
        <div className="w-20 h-20 bg-zinc-100 rounded-full border-2 border-orange-600 mx-auto flex items-center justify-center shadow relative">
          <User className="w-10 h-10 text-zinc-700" />
          <span className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-orange-600 border-2 border-white flex items-center justify-center text-white text-[10px] font-black">
            IN
          </span>
        </div>

        <h2 className="text-sm font-black text-zinc-900 mt-3 font-sans leading-none">Rahul Sharma</h2>
        <p className="text-[10px] text-zinc-400 font-bold tracking-wider mt-1 uppercase">Indiranagar, Bengaluru</p>
      </div>

      {/* Profile Sub Tabs */}
      <div className="bg-white border-b border-zinc-200 px-4 flex gap-6 text-xs font-bold text-zinc-400">
        <button
          onClick={() => setCurrentClaimTab('info')}
          className={`py-3.5 border-b-2 transition-all ${currentClaimTab === 'info' ? 'border-orange-600 text-zinc-900 font-black' : 'border-transparent'}`}
        >
          My Profile
        </button>
        <button
          onClick={() => setCurrentClaimTab('admin')}
          className={`py-3.5 border-b-2 transition-all ${currentClaimTab === 'admin' ? 'border-orange-600 text-zinc-900 font-black' : 'border-transparent'}`}
        >
          Team Dashboard
        </button>
        <button
          onClick={() => setCurrentClaimTab('claim')}
          className={`py-3.5 border-b-2 transition-all ${currentClaimTab === 'claim' ? 'border-orange-600 text-zinc-900 font-black' : 'border-transparent'}`}
        >
          Claim Shop
        </button>
      </div>

      {/* SECTION 1: PROFILE INFO & USER POSTS */}
      {currentClaimTab === 'info' && (
        <div className="p-4 space-y-4 max-w-md mx-auto">
          
          {/* User Active listings count */}
          <div className="bg-white rounded-3xl p-5 border border-zinc-200 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 mb-3">
              Your Active Postings
            </h3>

            {postedRequests.length === 0 ? (
              <div className="text-center py-4 text-zinc-400 text-xs">
                No active service requests posted.
              </div>
            ) : (
              <div className="space-y-2.5">
                {postedRequests.map((req) => (
                  <div key={req.id} className="p-3 bg-zinc-50 border border-zinc-200 rounded-2xl flex items-center justify-between text-xs">
                    <div className="min-w-0">
                      <p className="font-extrabold text-zinc-800 truncate">{req.title}</p>
                      <p className="text-[10px] text-zinc-400 mt-0.5">Budget: ₹{req.price} • {req.location}</p>
                    </div>
                    <span className="text-[9px] font-bold px-2 py-0.5 bg-orange-50 text-orange-600 border border-orange-200 rounded-lg shrink-0 uppercase tracking-wider">
                      {req.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Claimed Shops */}
          <div className="bg-white rounded-3xl p-5 border border-zinc-200 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 mb-3">
              Your Managed Businesses
            </h3>

            {claimedShopIds.length === 0 ? (
              <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-200 text-[11px] text-zinc-400 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                <span>You have not claimed any merchant shop profile. Use the "Claim Shop" tab to take ownership of a manual listing.</span>
              </div>
            ) : (
              <div className="space-y-2">
                {onboardedShops
                  .filter(s => claimedShopIds.includes(s.id))
                  .map((shop) => (
                    <div key={shop.id} className="p-3 bg-zinc-50 border border-zinc-200 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img src={shop.logo} alt="" className="w-8 h-8 rounded object-cover" />
                        <span className="text-xs font-black text-zinc-900">{shop.name}</span>
                      </div>
                      
                      <span className="flex items-center text-[10px] text-emerald-600 font-extrabold bg-emerald-50 px-2 py-0.5 border border-emerald-100 rounded-lg">
                        <UserCheck className="w-3.5 h-3.5 mr-0.5 fill-current" /> Claimed Owner
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Quick FAQ info */}
          <div className="p-4 bg-zinc-950 text-zinc-300 rounded-3xl text-xs space-y-2">
            <p className="font-extrabold text-white text-xs">Help & Settings</p>
            <p className="text-[11px] text-zinc-400 leading-normal">
              nearme.show is a zero commission platform built for local Bengaluru communities. Contact support at <strong className="text-orange-400">help@nearme.show</strong> for custom integrations or premium physical banners.
            </p>
          </div>
        </div>
      )}

      {/* SECTION 2: INTERNAL TEAM ADMIN DASHBOARD */}
      {currentClaimTab === 'admin' && (
        <div className="p-4 max-w-md mx-auto">
          {onboardSuccess && (
            <div className="mb-4 p-4 bg-emerald-50 border border-emerald-100 rounded-3xl flex items-center gap-3 text-emerald-800 animate-slide-up">
              <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white flex-shrink-0">
                <Check className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <p className="font-extrabold">Shop Onboarded Successfully!</p>
                <p className="text-emerald-600 font-semibold mt-0.5">The custom catalogue menu has been generated and pinned on the map.</p>
              </div>
            </div>
          )}

          {formError && (
            <div className="mb-4 p-4 bg-orange-50 border border-orange-100 rounded-3xl flex items-center gap-3 text-orange-800 animate-slide-up">
              <AlertCircle className="w-5 h-5 text-orange-600 shrink-0" />
              <div className="text-xs font-bold">{formError}</div>
            </div>
          )}

          <div className="bg-white rounded-3xl p-5 border border-zinc-200 shadow-sm space-y-5">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 px-2.5 py-1 bg-orange-50 rounded-xl">
                nearme team portal
              </span>
              <h3 className="text-base font-black text-zinc-900 mt-2">Manual Merchant Onboarding</h3>
              <p className="text-xs text-zinc-400 mt-1">Our team scans neighborhoods to build and verify shop details initially.</p>
            </div>

            <form onSubmit={handleOnboardShop} className="space-y-4">
              {/* Shop Basics */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 border-b pb-1">
                  1. Store Details
                </h4>
                
                <div>
                  <label className="block text-[10px] font-bold text-zinc-600 mb-1">Store Name</label>
                  <input
                    type="text"
                    required
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    placeholder="e.g. Anand Sweets & Savouries"
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-600 mb-1">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as any)}
                      className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-800"
                    >
                      <option value="restaurant">Restaurant</option>
                      <option value="cafe">Cafe / Bakery</option>
                      <option value="tailor">Tailor Shop</option>
                      <option value="cloth_store">Boutique / Saree Shop</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-600 mb-1">WhatsApp No.</label>
                    <input
                      type="text"
                      required
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="+9198XXXXXXXX"
                      className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-600 mb-1">Store Address</label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. CMH Road, near Indiranagar Metro"
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-800"
                  />
                </div>
              </div>

              {/* Catalogue Builder */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 border-b pb-1">
                  2. Create Catalog Item
                </h4>

                <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-600 mb-1">Item Name</label>
                    <input
                      type="text"
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      placeholder="e.g. Premium Samosa Platter"
                      className="w-full p-2.5 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-800"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-600 mb-1">Price (₹)</label>
                      <input
                        type="number"
                        value={newItemPrice}
                        onChange={(e) => setNewItemPrice(parseInt(e.target.value) || 0)}
                        className="w-full p-2.5 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-600 mb-1">Photo URL</label>
                      <input
                        type="text"
                        value={newItemImg}
                        className="w-full p-2.5 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-400 truncate"
                        disabled
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-600 mb-1">Item Description</label>
                    <input
                      type="text"
                      value={newItemDesc}
                      onChange={(e) => setNewItemDesc(e.target.value)}
                      placeholder="e.g. Crisp samosas served with sweet dates chutney."
                      className="w-full p-2.5 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-800"
                    />
                  </div>

                  <button
                    onClick={handleAddCatalogItem}
                    className="w-full py-2 bg-zinc-950 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 shadow hover:bg-zinc-800"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item to Catalogue List</span>
                  </button>
                </div>

                {/* Render listed items */}
                {catalogItems.length > 0 && (
                  <div className="space-y-1.5 pt-2">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Catalogued Items ({catalogItems.length})</p>
                    {catalogItems.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-zinc-50 p-2.5 rounded-xl border border-zinc-200 text-[11px]">
                        <span className="font-bold text-zinc-800">{item.name}</span>
                        <span className="font-extrabold text-orange-600">₹{item.price}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Shop Onboarding */}
              <button
                type="submit"
                id="btn_onboard_shop_submit"
                className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-bold uppercase tracking-wider text-xs shadow-md"
              >
                Onboard Store Profile
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SECTION 3: CLAIM THIS PROFILE FLOW */}
      {currentClaimTab === 'claim' && (
        <div className="p-4 max-w-md mx-auto space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-zinc-200 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-500 px-2.5 py-1 bg-purple-50 rounded-xl">
              Merchant Self-Service
            </span>
            <h3 className="text-base font-black text-zinc-900 mt-2">Claim Store Profile</h3>
            <p className="text-xs text-zinc-400 mt-1">Are you a business owner? Search and claim your manually built catalog to unlock dashboard controls.</p>

            <div className="space-y-3 mt-4">
              {onboardedShops.map((shop) => {
                const isClaimed = claimedShopIds.includes(shop.id);
                return (
                  <div
                    key={shop.id}
                    id={`claim_shop_row_${shop.id}`}
                    className="flex items-center justify-between p-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <img src={shop.logo} alt="" className="w-10 h-10 rounded-xl object-cover border" />
                      <div>
                        <p className="font-extrabold text-zinc-800">{shop.name}</p>
                        <p className="text-[10px] text-zinc-400 uppercase font-semibold">{shop.category}</p>
                      </div>
                    </div>

                    {isClaimed ? (
                      <span className="flex items-center text-[10px] text-emerald-600 font-extrabold bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                        <UserCheck className="w-3.5 h-3.5 mr-0.5 fill-current" /> Claimed
                      </span>
                    ) : (
                      <button
                        onClick={() => onClaimShop(shop.id)}
                        className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-extrabold rounded-xl text-[10px] uppercase tracking-wider shadow"
                      >
                        Claim
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
