/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Compass,
  Search,
  SlidersHorizontal,
  Map,
  List,
  MessageSquare,
  User,
  LayoutGrid,
  MapPin,
  Star,
  ShieldCheck,
  Bike,
  Key,
  X,
  Phone,
  ArrowRight,
  HelpCircle,
  PlusCircle,
  Clock,
  ExternalLink
} from 'lucide-react';

import { Shop, MarketplaceItem, RentalItem, ServiceRequest, MockChat, CategoryType, ChatMessage } from './types';
import { CITIES, DATA_BY_CITY } from './data/indiaData';

// Components
import InteractiveMap from './components/InteractiveMap';
import OnboardingExplainer from './components/OnboardingExplainer';
import ShopProfile from './components/ShopProfile';
import MarketplaceDetail from './components/MarketplaceDetail';
import RentSaleDetail from './components/RentSaleDetail';
import RequestsTab from './components/RequestsTab';
import CategoriesTab from './components/CategoriesTab';
import ChatsTab from './components/ChatsTab';
import ProfileTab from './components/ProfileTab';

export default function App() {
  // Navigation & Tab States
  const [activeTab, setActiveTab] = useState<'home' | 'categories' | 'requests' | 'chats' | 'profile'>('home');
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [selectedDetail, setSelectedDetail] = useState<{ type: 'shop' | 'marketplace' | 'rental' | 'request'; data: any } | null>(null);

  // Filter States
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [distanceRadius, setDistanceRadius] = useState<number>(3.0); // 3 km radius default
  const [showOpenNow, setShowOpenNow] = useState(false);
  const [showFiltersDrawer, setShowFiltersDrawer] = useState(false);

  // Multi-city selection state
  const [cityId, setCityId] = useState<string>("bengaluru");

  // Dynamic City-level database state
  const [cityData, setCityData] = useState<Record<string, {
    shops: Shop[];
    marketplace: MarketplaceItem[];
    rentals: RentalItem[];
    requests: ServiceRequest[];
  }>>(() => {
    return {
      bengaluru: {
        shops: DATA_BY_CITY.bengaluru.shops,
        marketplace: DATA_BY_CITY.bengaluru.marketplace,
        rentals: DATA_BY_CITY.bengaluru.rentals,
        requests: DATA_BY_CITY.bengaluru.requests,
      },
      mumbai: {
        shops: DATA_BY_CITY.mumbai.shops,
        marketplace: DATA_BY_CITY.mumbai.marketplace,
        rentals: DATA_BY_CITY.mumbai.rentals,
        requests: DATA_BY_CITY.mumbai.requests,
      },
      delhi: {
        shops: DATA_BY_CITY.delhi.shops,
        marketplace: DATA_BY_CITY.delhi.marketplace,
        rentals: DATA_BY_CITY.delhi.rentals,
        requests: DATA_BY_CITY.delhi.requests,
      },
      hyderabad: {
        shops: DATA_BY_CITY.hyderabad.shops,
        marketplace: DATA_BY_CITY.hyderabad.marketplace,
        rentals: DATA_BY_CITY.hyderabad.rentals,
        requests: DATA_BY_CITY.hyderabad.requests,
      }
    };
  });

  // Current selected city details derived from state
  const currentCity = CITIES.find(c => c.id === cityId) || CITIES[0];

  const shops = cityData[cityId]?.shops || [];
  const marketplace = cityData[cityId]?.marketplace || [];
  const rentals = cityData[cityId]?.rentals || [];
  const requests = cityData[cityId]?.requests || [];

  // Location Selector (Area/Neighborhood)
  const [userArea, setUserArea] = useState<string>("Indiranagar, 12th Main");
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [locationPermission, setLocationPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');

  // Trigger automatic neighborhood change on city shift
  const handleSelectCity = (newCityId: string) => {
    setCityId(newCityId);
    setSelectedDetail(null);
    const targetCity = CITIES.find(c => c.id === newCityId) || CITIES[0];
    setUserArea(targetCity.areas[0]);
  };
  
  // Claims
  const [claimedShopIds, setClaimedShopIds] = useState<string[]>([]);

  // Chats state with 1 pre-populated chat thread for realistic sandbox on first load
  const [chats, setChats] = useState<MockChat[]>([
    {
      id: "chat-1",
      targetId: "shop-1",
      targetName: "Sri Rameshwaram Cafe",
      targetImage: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=150&auto=format&fit=crop&q=60",
      targetType: 'shop',
      priceText: "Ghee Podi Masala Dosa + Filter Coffee",
      whatsappNumber: "+919876543210",
      lastMessage: "Rameshwaram: Order packed! Click the Rapido button to book delivery.",
      lastMessageTime: "10 mins ago",
      status: "Ready for Pickup",
      messages: [
        {
          id: "m1",
          sender: "user",
          text: "Hi! I want to order 2 Ghee Podi Masala Dosa and 1 Filter Coffee from your shop on nearme.show.",
          timestamp: "12:15 PM"
        },
        {
          id: "m2",
          sender: "other",
          text: "Namaskara! We received your order. Total is ₹260. Please pay on GPay at +919876543210 and share screenshot.",
          timestamp: "12:16 PM"
        },
        {
          id: "m3",
          sender: "user",
          text: "Done! Just sent ₹260 on GPay.",
          timestamp: "12:18 PM"
        },
        {
          id: "m4",
          sender: "other",
          text: "Received! We are packing your dosa now. It will be ready in 5 mins. Please request Rapido delivery pickup now.",
          timestamp: "12:20 PM"
        }
      ]
    }
  ]);

  // Simulate Location Request on load
  useEffect(() => {
    const timer = setTimeout(() => {
      if (locationPermission === 'prompt') {
        // Automatically prompt after 1.5 seconds
        setLocationPermission('prompt');
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [locationPermission]);

  // Location Handlers
  const handleGrantLocation = () => {
    setLocationPermission('granted');
    setUserArea("Indiranagar, 12th Main");
  };

  const handleDenyLocation = () => {
    setLocationPermission('denied');
  };

  // Switch Neighborhood Area
  const handleSelectArea = (area: string) => {
    setUserArea(area);
    setShowLocationDropdown(false);
    
    // Simulate updating distances slightly depending on area for realism
    const areaMultiplier = area.includes("Main") || area.includes("Carter") || area.includes("Village") || area.includes("No.") ? 1 : 1.6;
    setCityData(prev => {
      const currentCityData = prev[cityId] || { shops: [], marketplace: [], rentals: [], requests: [] };
      return {
        ...prev,
        [cityId]: {
          shops: currentCityData.shops.map(s => ({ ...s, distance: parseFloat((s.distance * areaMultiplier).toFixed(1)) })),
          marketplace: currentCityData.marketplace.map(m => ({ ...m, distance: parseFloat((m.distance * areaMultiplier).toFixed(1)) })),
          rentals: currentCityData.rentals.map(r => ({ ...r, distance: parseFloat((r.distance * areaMultiplier).toFixed(1)) })),
          requests: currentCityData.requests.map(rq => ({ ...rq, distance: parseFloat((rq.distance * areaMultiplier).toFixed(1)) }))
        }
      };
    });
  };

  // WhatsApp Negotiation Handoff Sandbox
  const handleStartWhatsAppChat = (targetItem: any, catalogueItem?: any) => {
    const isShop = 'catalogue' in targetItem;
    const isMarketplace = 'condition' in targetItem;
    const isRental = 'propertyType' in targetItem;

    let targetType: 'shop' | 'marketplace' | 'rental' | 'request' = 'shop';
    let targetName = targetItem.name || targetItem.title;
    let targetImage = isShop ? targetItem.logo : targetItem.images[0];
    let priceText = isShop 
      ? (catalogueItem ? `Product: ${catalogueItem.name} (₹${catalogueItem.price})` : "Store Catalog Enquiry")
      : `Item: ₹${targetItem.price.toLocaleString('en-IN')}`;
    let whatsappNumber = targetItem.whatsapp || targetItem.sellerWhatsapp || targetItem.ownerWhatsapp || "+919999999999";
    
    // Create initial handshake messages
    let initialMsg = "";
    if (isShop) {
      initialMsg = catalogueItem 
        ? `Hi, I want to order "${catalogueItem.name}" (₹${catalogueItem.price}) from your menu on nearme.show.`
        : `Hi, I am looking at your store profile "${targetItem.name}" on nearme.show. Is delivery available?`;
    } else if (isMarketplace) {
      targetType = 'marketplace';
      initialMsg = `Hi ${targetItem.sellerName}, I am interested in your listing: "${targetItem.title}" on nearme.show for ₹${targetItem.price}. Is it available?`;
    } else if (isRental) {
      targetType = 'rental';
      initialMsg = `Hi, I saw your rental listing "${targetItem.title}" on nearme.show. Can I arrange a visit?`;
    }

    // Check if chat already exists
    const existingChat = chats.find(c => c.targetId === targetItem.id);
    if (existingChat) {
      setSelectedDetail(null);
      setActiveTab('chats');
      return;
    }

    const newChat: MockChat = {
      id: `chat-${Date.now()}`,
      targetId: targetItem.id,
      targetName,
      targetImage,
      targetType,
      priceText,
      whatsappNumber,
      lastMessage: `You: ${initialMsg}`,
      lastMessageTime: "Just now",
      status: 'Order Initiated',
      messages: [
        {
          id: `msg-${Date.now()}-1`,
          sender: 'user',
          text: initialMsg,
          timestamp: "Just now"
        },
        {
          id: `msg-${Date.now()}-2`,
          sender: 'other',
          text: `Namaskara! Thanks for reaching out via nearme.show. Yes, this is available. Let's lock the details here!`,
          timestamp: "1 min ago"
        }
      ]
    };

    setChats(prev => [newChat, ...prev]);
    setSelectedDetail(null);
    setActiveTab('chats');
  };

  // Post a Service Request
  const handlePostRequest = (newReq: Omit<ServiceRequest, 'id' | 'createdAt' | 'status' | 'distance'>) => {
    const fullReq: ServiceRequest = {
      ...newReq,
      id: `req-${Date.now()}`,
      createdAt: "Just now",
      status: 'open',
      distance: 0.1
    };

    setCityData(prev => ({
      ...prev,
      [cityId]: {
        ...prev[cityId],
        requests: [fullReq, ...prev[cityId].requests]
      }
    }));
  };

  // Gig worker accepts a service request
  const handleAcceptRequest = (reqId: string) => {
    // Transition status
    setCityData(prev => ({
      ...prev,
      [cityId]: {
        ...prev[cityId],
        requests: prev[cityId].requests.map(r => r.id === reqId ? { ...r, status: 'accepted', acceptedBy: "You (Gig Worker)" } : r)
      }
    }));
    
    const targetReq = requests.find(r => r.id === reqId);
    if (!targetReq) return;

    // Create a chat representing negotiation between the gig worker and the consumer
    const newChat: MockChat = {
      id: `chat-${Date.now()}`,
      targetId: targetReq.id,
      targetName: targetReq.userName,
      targetImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=60",
      targetType: 'request',
      priceText: `Gig Work: ₹${targetReq.price}`,
      whatsappNumber: targetReq.userWhatsapp,
      lastMessage: `You: I accepted your request for "${targetReq.title}"!`,
      lastMessageTime: "Just now",
      status: 'Request Accepted',
      messages: [
        {
          id: `msg-${Date.now()}-1`,
          sender: 'other',
          text: `Hi, thank you for accepting my gig request: "${targetReq.title}". Please come over, kitchen drain is heavily blocked!`,
          timestamp: "Just now"
        },
        {
          id: `msg-${Date.now()}-2`,
          sender: 'user',
          text: `Hi ${targetReq.userName}, I have accepted your request on nearme.show. I will be leaving now and should reach you in 15 mins.`,
          timestamp: "Just now"
        }
      ]
    };

    setChats(prev => [newChat, ...prev]);
    setActiveTab('chats');
  };

  // Admin Shop Onboarding
  const handleAddShop = (newShop: Shop) => {
    setCityData(prev => ({
      ...prev,
      [cityId]: {
        ...prev[cityId],
        shops: [newShop, ...prev[cityId].shops]
      }
    }));
  };

  // Claim Shop
  const handleClaimShop = (shopId: string) => {
    setClaimedShopIds(prev => [...prev, shopId]);
  };

  // Simulate WhatsApp Send Message
  const handleSendMessage = (chatId: string, text: string) => {
    setChats(prev => prev.map(chat => {
      if (chat.id === chatId) {
        const updatedMessages: ChatMessage[] = [
          ...chat.messages,
          {
            id: `msg-${Date.now()}`,
            sender: 'user',
            text,
            timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
          }
        ];

        // Simulate automatic witty merchant reply after 2 seconds
        setTimeout(() => {
          setChats(currentChats => currentChats.map(c => {
            if (c.id === chatId) {
              return {
                ...c,
                lastMessage: `${c.targetName}: Superb. Details confirmed!`,
                lastMessageTime: "Just now",
                messages: [
                  ...c.messages,
                  {
                    id: `msg-reply-${Date.now()}`,
                    sender: 'other',
                    text: `Superb. I have locked this in on nearme.show. Let's arrange pickup.`,
                    timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                  }
                ]
              };
            }
            return c;
          }));
        }, 1500);

        return {
          ...chat,
          lastMessage: `You: ${text}`,
          lastMessageTime: "Just now",
          messages: updatedMessages
        };
      }
      return chat;
    }));
  };

  // Request Rapido Delivery Integration
  const handleRequestRapido = (chatId: string) => {
    setChats(prev => prev.map(chat => {
      if (chat.id === chatId) {
        const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
        const bikeReg = `KA-03-EX-${Math.floor(1000 + Math.random() * 9000)}`;
        const deliveryFee = 35 + Math.floor(Math.random() * 40);

        return {
          ...chat,
          status: 'Rapido Dispatched',
          lastMessage: "System: Rapido courier dispatched successfully!",
          lastMessageTime: "Just now",
          rapidoDetails: {
            driverName: "Manjunath K. (Rapido)",
            driverPhone: "+919844112233",
            otp: otpCode,
            vehicleNo: bikeReg,
            deliveryFee,
            etaMinutes: 12
          },
          messages: [
            ...chat.messages,
            {
              id: `msg-rapido-${Date.now()}`,
              sender: 'other',
              text: `🚨 [RAPIDO DELIVERY ASSIGNED]\nRider: Manjunath K.\nVehicle: ${bikeReg}\nOTP Code: ${otpCode}\nETA: 12 minutes.\nDelivery fee of ₹${deliveryFee} will be settled on drop.`,
              timestamp: "Just now"
            }
          ]
        };
      }
      return chat;
    }));
  };

  // Confirm Delivery Received
  const handleConfirmDelivery = (chatId: string) => {
    setChats(prev => prev.map(chat => {
      if (chat.id === chatId) {
        return {
          ...chat,
          status: 'Delivered',
          lastMessage: "System: Order delivered safely by Rapido.",
          lastMessageTime: "Just now",
          messages: [
            ...chat.messages,
            {
              id: `msg-delivered-${Date.now()}`,
              sender: 'other',
              text: `🎉 Order delivered safely by Rapido! Thank you for supporting a local neighborhood shop on nearme.show.`,
              timestamp: "Just now"
            }
          ]
        };
      }
      return chat;
    }));
  };

  // --- MIXED RESULTS FILTERING FOR FEED ---
  const getMixedFeedResults = () => {
    const results: { type: 'shop' | 'marketplace' | 'rental' | 'request'; distance: number; dateValue: number; data: any }[] = [];

    // Filter and add shops
    shops.forEach(s => {
      const matchSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.catalogue.some(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchCategory = activeCategory === 'all' || 
                            activeCategory === s.category || 
                            (activeCategory === 'food' && (s.category === 'restaurant' || s.category === 'cafe'));
      const matchDistance = s.distance <= distanceRadius;

      if (matchSearch && matchCategory && matchDistance) {
        results.push({ type: 'shop', distance: s.distance, dateValue: 1, data: s });
      }
    });

    // Filter and add marketplace
    marketplace.forEach(m => {
      const matchSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase()) || m.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = activeCategory === 'all' || activeCategory === 'marketplace';
      const matchDistance = m.distance <= distanceRadius;

      if (matchSearch && matchCategory && matchDistance) {
        results.push({ type: 'marketplace', distance: m.distance, dateValue: 2, data: m });
      }
    });

    // Filter and add rentals
    rentals.forEach(r => {
      const matchSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) || r.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = activeCategory === 'all' || activeCategory === 'rent';
      const matchDistance = r.distance <= distanceRadius;

      if (matchSearch && matchCategory && matchDistance) {
        results.push({ type: 'rental', distance: r.distance, dateValue: 3, data: r });
      }
    });

    // Filter and add service requests
    requests.forEach(req => {
      const matchSearch = req.title.toLowerCase().includes(searchQuery.toLowerCase()) || (req.notes && req.notes.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchCategory = activeCategory === 'all' || activeCategory === 'services';
      const matchDistance = req.distance <= distanceRadius;

      if (matchSearch && matchCategory && matchDistance) {
        results.push({ type: 'request', distance: req.distance, dateValue: 4, data: req });
      }
    });

    // Sort predominantly by proximity (hyperlocal!)
    return results.sort((a, b) => a.distance - b.distance);
  };

  const mixedResults = getMixedFeedResults();

  return (
    <div id="nearme_applet_frame" className="w-full bg-zinc-50 min-h-screen font-sans flex items-center justify-center p-0 md:p-6 select-none">
      
      {/* Dynamic Iframe Shell wrapper to center on desktop and scale full screen on phones */}
      <div className="w-full max-w-md md:max-w-6xl bg-white min-h-screen md:min-h-[850px] md:max-h-[920px] md:rounded-[3rem] md:shadow-[0_30px_70px_rgba(0,0,0,0.1)] flex flex-col overflow-hidden relative border border-zinc-100 md:border-[10px] md:border-zinc-900 transition-all duration-300">
        
        {/* --- GEOLOCATION PERMISSION MOCKUP PROMPT --- */}
        {locationPermission === 'prompt' && (
          <div id="geolocation_permission_toast" className="absolute top-4 left-4 right-4 bg-zinc-900/95 backdrop-blur-md text-white p-4 rounded-3xl shadow-xl z-50 border border-zinc-800 flex flex-col gap-3.5 animate-slide-up">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-orange-500 animate-bounce mt-0.5 shrink-0" />
              <div className="text-xs">
                <p className="font-extrabold">nearme.show wants your location</p>
                <p className="text-zinc-300 mt-1 leading-relaxed">
                  We use your location to map nearby filter-coffee spots, tailors, 2nd-hand marketplace deals, and service requests on your street.
                </p>
              </div>
            </div>
            
            <div className="flex gap-2.5 self-end">
              <button
                id="btn_deny_location"
                onClick={handleDenyLocation}
                className="px-4 py-2 text-[10px] uppercase tracking-wider font-extrabold text-zinc-400 hover:text-white"
              >
                Deny
              </button>
              <button
                id="btn_allow_location"
                onClick={handleGrantLocation}
                className="px-4.5 py-2 bg-orange-600 hover:bg-orange-700 text-white text-[10px] uppercase tracking-wider font-black rounded-xl shadow transition-all active:scale-95"
              >
                Allow Access
              </button>
            </div>
          </div>
        )}

        {/* --- TOP HEADER SECTION (Only visible on Home / Categories tabs) --- */}
        {activeTab === 'home' && !selectedDetail && (
          <div className="bg-white border-b border-zinc-100 p-4 sticky top-0 z-25">
            {/* Top row: Brand & Neighborhood Area Selector */}
            <div className="flex items-center justify-between gap-4 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-2xl bg-gradient-to-tr from-orange-600 to-red-500 flex items-center justify-center shadow-md animate-float">
                  <span className="text-white font-black text-xs tracking-tight">nm</span>
                </div>
                <div>
                  <h1 className="text-sm font-black text-zinc-950 tracking-tight flex items-center gap-1.5">
                    nearme<span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-500">.show</span>
                  </h1>
                  <span className="text-[8px] font-black tracking-widest text-zinc-400 uppercase block -mt-1">Hyperlocal Hub</span>
                </div>
              </div>

              {/* Tappable Area Selector */}
              <div className="relative">
                <button
                  id="btn_neighborhood_selector"
                  onClick={() => setShowLocationDropdown(!showLocationDropdown)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200/80 rounded-2xl text-[10px] font-black text-zinc-900 transition-all shadow-sm shrink-0"
                >
                  <MapPin className="w-3.5 h-3.5 text-orange-600 animate-pulse" />
                  <span className="truncate max-w-[120px]">{userArea.split(',')[0]}</span>
                </button>

                {showLocationDropdown && (
                  <div className="absolute right-0 top-11 w-52 bg-white border border-zinc-100 rounded-3xl shadow-xl z-50 p-1.5 animate-slide-up">
                    <p className="text-[8px] font-black uppercase text-zinc-400 tracking-widest px-2.5 py-1.5 border-b border-zinc-50">Local Neighborhoods</p>
                    {currentCity.areas.map((area, i) => (
                      <button
                        key={i}
                        onClick={() => handleSelectArea(area)}
                        className="w-full text-left p-2.5 hover:bg-orange-50 hover:text-orange-600 text-[11px] font-extrabold text-zinc-700 rounded-2xl transition-all truncate"
                      >
                        {area}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* India City Selector Hub (Gen-Z Trend Highlighter) */}
            <div className="flex items-center gap-2 overflow-x-auto py-2.5 scrollbar-none snap-x border-t border-zinc-50">
              {CITIES.map((city) => {
                const isSelected = cityId === city.id;
                return (
                  <button
                    key={city.id}
                    onClick={() => handleSelectCity(city.id)}
                    className={`flex-shrink-0 px-3.5 py-1.5 rounded-2xl text-xs font-black tracking-wide flex items-center gap-2 snap-center transition-all duration-300 ${
                      isSelected 
                        ? 'bg-zinc-950 text-white shadow-md scale-105 neon-glow-orange' 
                        : 'bg-zinc-50 border border-zinc-200 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800'
                    }`}
                  >
                    <span className="relative flex h-2 w-2">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isSelected ? 'bg-orange-400' : 'bg-transparent'}`}></span>
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${isSelected ? 'bg-orange-500' : 'bg-zinc-300'}`}></span>
                    </span>
                    <span>{city.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Persistent Search Bar */}
            <div className="flex gap-2 pt-2.5 border-t border-zinc-50">
              <div className="flex-1 relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search dosa, tailors, 2nd-hand furniture in ${currentCity.name}...`}
                  className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200/80 rounded-2xl text-xs text-zinc-800 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:bg-white transition-all font-medium"
                />
              </div>

              {/* Sliders/Filter toggle */}
              <button
                id="btn_toggle_filters_drawer"
                onClick={() => setShowFiltersDrawer(!showFiltersDrawer)}
                className={`p-3.5 rounded-2xl border transition-all ${
                  showFiltersDrawer ? 'bg-orange-50 border-orange-200 text-orange-600 scale-95' : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                }`}
                title="Filters"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
            </div>

            {/* FILTERS DRAW BLOCK (Toggled inline) */}
            {showFiltersDrawer && (
              <div className="mt-3 p-4 bg-zinc-50 rounded-2xl border border-zinc-200 space-y-4 animate-fade-in">
                {/* Distance Slider */}
                <div>
                  <div className="flex justify-between items-center text-[10px] font-black uppercase text-zinc-500 tracking-wider">
                    <span>Proximity Radius</span>
                    <span className="text-orange-600 font-extrabold">{distanceRadius} km</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="5.0"
                    step="0.5"
                    value={distanceRadius}
                    onChange={(e) => setDistanceRadius(parseFloat(e.target.value))}
                    className="w-full accent-orange-600 h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer mt-2"
                  />
                  <div className="flex justify-between text-[8px] text-zinc-400 mt-1 font-bold">
                    <span>500m</span>
                    <span>1km</span>
                    <span>3km</span>
                    <span>5km+</span>
                  </div>
                </div>

                {/* Open Now Toggle */}
                <div className="flex items-center justify-between pt-2.5 border-t border-zinc-200/60">
                  <span className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Show Open Store Profiles Only</span>
                  <input
                    type="checkbox"
                    checked={showOpenNow}
                    onChange={(e) => setShowOpenNow(e.target.checked)}
                    className="accent-orange-600 h-4 w-4 rounded-md cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* Horizontally scrolling category chips */}
            <div className="flex items-center gap-2 overflow-x-auto pt-3.5 pb-1 scrollbar-none snap-x">
              {[
                { id: 'all', label: 'All Gigs & Shops', icon: '📍' },
                { id: 'food', label: 'Food & Cafes', icon: '🍔' },
                { id: 'tailor', label: 'Bespoke Tailoring', icon: '🪡' },
                { id: 'cloth_store', label: 'Cloth Stores', icon: '🛍️' },
                { id: 'marketplace', label: '2nd Hand deals', icon: '🚲' },
                { id: 'rent', label: 'PGs & Room Rent', icon: '🔑' },
                { id: 'services', label: 'Gigs / Tasks', icon: '🔧' }
              ].map((chip) => {
                const isActive = activeCategory === chip.id;
                return (
                  <button
                    key={chip.id}
                    onClick={() => {
                      setActiveCategory(chip.id);
                      setSelectedDetail(null);
                    }}
                    className={`flex-shrink-0 px-4 py-2.5 rounded-2xl border text-xs font-black tracking-wide flex items-center gap-1.5 snap-center transition-all duration-200 ${
                      isActive 
                        ? 'bg-gradient-to-r from-orange-600 to-red-500 text-white shadow-md scale-105 border-transparent' 
                        : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100 hover:scale-98'
                    }`}
                  >
                    <span>{chip.icon}</span>
                    <span>{chip.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* --- DYNAMIC MAIN VIEWER STAGE --- */}
        <div className="flex-1 overflow-y-auto bg-zinc-50 scrollbar-none">
          {selectedDetail ? (
            /* RENDER CORRESPONDING DETAIL OVERLAY VIEW */
            selectedDetail.type === 'shop' ? (
              <ShopProfile
                shop={selectedDetail.data}
                onBack={() => setSelectedDetail(null)}
                onStartChat={handleStartWhatsAppChat}
              />
            ) : selectedDetail.type === 'marketplace' ? (
              <MarketplaceDetail
                item={selectedDetail.data}
                onBack={() => setSelectedDetail(null)}
                onStartChat={handleStartWhatsAppChat}
              />
            ) : (
              <RentSaleDetail
                item={selectedDetail.data}
                onBack={() => setSelectedDetail(null)}
                onStartChat={handleStartWhatsAppChat}
              />
            )
          ) : (
            /* TAB CORRESPONDENCE */
            <>
              {activeTab === 'home' && (
                <>
                  {/* Map Pin / List View switch tool row (Visible only on mobile since desktop gets both) */}
                  <div className="px-4 pt-3 flex justify-between items-center gap-2 md:hidden">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                      {currentCity.name} mixed feed
                    </span>

                    <div className="flex bg-zinc-200/60 p-0.5 rounded-xl border border-zinc-200">
                      <button
                        id="btn_view_mode_map"
                        onClick={() => setViewMode('map')}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${
                          viewMode === 'map' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500'
                        }`}
                      >
                        <Map className="w-3 h-3" />
                        <span>Map</span>
                      </button>
                      <button
                        id="btn_view_mode_list"
                        onClick={() => setViewMode('list')}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${
                          viewMode === 'list' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500'
                        }`}
                      >
                        <List className="w-3 h-3" />
                        <span>List</span>
                      </button>
                    </div>
                  </div>

                  {/* Dual-pane container: responsive grid layout */}
                  <div className="flex flex-col md:grid md:grid-cols-12 md:h-[calc(100vh-210px)] md:max-h-[720px] overflow-hidden">
                    
                    {/* Left Pane: Listings Feed (shown on desktop, or if 'list' is selected on mobile) */}
                    <div className={`md:col-span-5 lg:col-span-4 flex flex-col h-full ${
                      viewMode === 'list' ? 'flex' : 'hidden md:flex'
                    } overflow-y-auto p-4 space-y-4 scrollbar-none`} style={{ contentVisibility: 'auto' }}>
                      
                      {/* Desktop indicator */}
                      <div className="hidden md:flex justify-between items-center pb-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                          {currentCity.name} Feed
                        </span>
                        <span className="text-[9px] bg-orange-100 text-orange-600 font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                          Live • Nearby
                        </span>
                      </div>

                      {mixedResults.length === 0 ? (
                        <div className="bg-white rounded-3xl p-8 border border-zinc-200 text-center text-zinc-400">
                          <Compass className="w-10 h-10 mx-auto mb-2 text-zinc-300" />
                          <p className="text-xs font-bold text-zinc-700">No results nearby</p>
                          <p className="text-[11px] mt-1">Try expanding your search distance filter.</p>
                        </div>
                      ) : (
                        <div className="space-y-4 pb-12">
                          {mixedResults.map((result) => {
                            const { type, data } = result;
                            return (
                              <div
                                key={`${type}-${data.id}`}
                                id={`feed_item_card_${type}_${data.id}`}
                                onClick={() => setSelectedDetail({ type, data })}
                                className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 cursor-pointer spring-hover"
                              >
                                {/* card banner */}
                                <div className="relative h-40 bg-zinc-100">
                                  <img
                                    src={type === 'shop' ? data.banner : data.images[0]}
                                    alt=""
                                    className="w-full h-full object-cover"
                                    referrerPolicy="no-referrer"
                                  />
                                  
                                  {/* Distance Indicator badge */}
                                  <span className="absolute bottom-3 left-3 px-2.5 py-1 bg-zinc-950/80 backdrop-blur-sm text-white rounded-xl text-[10px] font-bold">
                                    {data.distance} km away
                                  </span>

                                  {/* Category pill */}
                                  <span className={`absolute top-3 right-3 px-2.5 py-1 text-[9px] font-black uppercase rounded-lg shadow-sm ${
                                    type === 'shop' ? 'bg-orange-600 text-white' :
                                    type === 'marketplace' ? 'bg-blue-500 text-white' :
                                    type === 'rental' ? 'bg-purple-600 text-white' : 'bg-emerald-500 text-white'
                                  }`}>
                                    {type === 'shop' ? data.category : type === 'rental' ? data.propertyType : type}
                                  </span>
                                </div>

                                {/* card details */}
                                <div className="p-4">
                                  <div className="flex items-start justify-between gap-1.5">
                                    <h3 className="text-xs font-extrabold text-zinc-950 truncate max-w-[70%]">
                                      {type === 'shop' ? data.name : data.title}
                                    </h3>

                                    {/* Ratings if store, or Price if marketplace/rental */}
                                    {type === 'shop' ? (
                                      <span className="flex items-center gap-0.5 text-xs text-amber-500 font-bold shrink-0">
                                        <Star className="w-3.5 h-3.5 fill-current" /> {data.rating}
                                      </span>
                                    ) : (
                                      <span className="text-xs font-black text-orange-600 shrink-0">
                                        ₹{data.price.toLocaleString('en-IN')}{type === 'rental' && data.type === 'rent' ? '/mo' : ''}
                                      </span>
                                    )}
                                  </div>

                                  <p className="text-[10px] text-zinc-400 mt-0.5 truncate">{data.area}</p>

                                  <p className="text-[10px] text-zinc-500 mt-1.5 leading-relaxed line-clamp-2">
                                    {type === 'shop' ? `Specialities: ${data.catalogue.map((c: any) => c.name).join(', ')}` : data.description || data.notes}
                                  </p>

                                  {/* Quick Action Button row */}
                                  <div className="mt-4 pt-3 border-t border-zinc-100 flex justify-between items-center">
                                    {data.verified && (
                                      <span className="flex items-center text-[9px] text-emerald-600 font-extrabold bg-emerald-50 px-2 py-0.5 rounded">
                                        <ShieldCheck className="w-3.5 h-3.5 fill-current mr-0.5 animate-pulse" /> Verified
                                      </span>
                                    )}
                                    
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedDetail({ type, data });
                                      }}
                                      className="ml-auto px-4 py-2 bg-gradient-to-r from-orange-600 to-red-500 hover:opacity-90 text-white font-bold text-[10px] uppercase rounded-xl transition-all shadow-sm flex items-center gap-1"
                                    >
                                      <span>{type === 'shop' ? 'View Menu' : 'Inspect Detail'}</span>
                                      <ArrowRight className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Right Pane: Interactive Map (shown on desktop, or if 'map' is selected on mobile) */}
                    <div className={`md:col-span-7 lg:col-span-8 flex flex-col h-full p-4 space-y-4 ${
                      viewMode === 'map' ? 'flex' : 'hidden md:flex'
                    }`}>
                      <div className="flex-1 min-h-[350px] md:min-h-0 bg-zinc-100 rounded-[2rem] overflow-hidden relative border border-zinc-200 shadow-inner">
                        <InteractiveMap
                          activeCategory={activeCategory}
                          distanceRadius={distanceRadius}
                          shops={shops}
                          marketplace={marketplace}
                          rentals={rentals}
                          requests={requests}
                          selectedItem={selectedDetail}
                          onSelectItem={(type, data) => setSelectedDetail({ type, data })}
                          userArea={userArea}
                          cityId={cityId}
                        />
                      </div>
                      
                      {/* Onboarding Flow Banner diagram */}
                      <div className="hidden lg:block">
                        <OnboardingExplainer />
                      </div>
                    </div>

                  </div>
                </>
              )}

              {activeTab === 'categories' && (
                <CategoriesTab
                  onSelectCategory={(catId) => {
                    setActiveCategory(catId);
                    setActiveTab('home');
                    setViewMode('list');
                  }}
                  activeCategory={activeCategory}
                />
              )}

              {activeTab === 'requests' && (
                <RequestsTab
                  requests={requests}
                  onPostRequest={handlePostRequest}
                  onAcceptRequest={handleAcceptRequest}
                  userArea={userArea}
                />
              )}

              {activeTab === 'chats' && (
                <ChatsTab
                  chats={chats}
                  onSendMessage={handleSendMessage}
                  onRequestRapido={handleRequestRapido}
                  onConfirmDelivery={handleConfirmDelivery}
                />
              )}

              {activeTab === 'profile' && (
                <ProfileTab
                  onboardedShops={shops}
                  onAddShop={handleAddShop}
                  postedRequests={requests.filter(r => r.userName.includes("Rahul"))}
                  onClaimShop={handleClaimShop}
                  claimedShopIds={claimedShopIds}
                />
              )}
            </>
          )}
        </div>

        {/* --- THUMB-REACHABLE MOBILE BOTTOM NAVIGATION BAR --- */}
        <div className="bg-white/95 backdrop-blur-md border-t border-zinc-200 py-2.5 px-4 sticky bottom-0 left-0 right-0 z-35 flex items-center justify-between shadow-[0_-8px_30px_rgb(0,0,0,0.05)]">
          {[
            { id: 'home', label: 'Home/Map', icon: <Compass className="w-5 h-5" /> },
            { id: 'categories', label: 'Categories', icon: <LayoutGrid className="w-5 h-5" /> },
            { id: 'requests', label: 'Requests', icon: <PlusCircle className="w-5 h-5" />, badge: requests.filter(r => r.status === 'open').length },
            { id: 'chats', label: 'Chats', icon: <MessageSquare className="w-5 h-5" />, badge: chats.filter(c => c.status !== 'Delivered').length },
            { id: 'profile', label: 'Profile', icon: <User className="w-5 h-5" /> }
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`bottom_nav_btn_${tab.id}`}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setSelectedDetail(null); // clear detail view to load tab main screen
                }}
                className={`flex flex-col items-center gap-1 py-1 px-3 relative transition-all active:scale-95 shrink-0 ${
                  isActive ? 'text-orange-600 font-extrabold' : 'text-zinc-400 hover:text-zinc-600'
                }`}
              >
                {/* Badge count overlay */}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="absolute top-0 right-2 px-1.5 py-0.5 rounded-full bg-orange-600 text-white text-[8px] font-black border border-white leading-none scale-90">
                    {tab.badge}
                  </span>
                )}
                
                {tab.icon}
                <span className="text-[9px] font-bold tracking-tight">{tab.label}</span>
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
}
