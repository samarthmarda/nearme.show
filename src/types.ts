/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type CategoryType = 'food' | 'marketplace' | 'services' | 'rent' | 'sale' | 'all';

export interface CatalogueItem {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  tags?: string[];
}

export interface Shop {
  id: string;
  name: string;
  category: 'restaurant' | 'cafe' | 'tailor' | 'cloth_store';
  logo: string;
  banner: string;
  rating: number;
  reviewsCount: number;
  distance: number; // in km
  area: string;
  lat: number; // local coordinate map offset (-100 to 100)
  lng: number; // local coordinate map offset (-100 to 100)
  isOpen: boolean;
  hours: string;
  whatsapp: string;
  catalogue: CatalogueItem[];
  address: string;
  phone: string;
  verified: boolean;
}

export interface MarketplaceItem {
  id: string;
  title: string;
  price: number;
  category: string;
  condition: 'New' | 'Like New' | 'Used';
  description: string;
  sellerName: string;
  sellerRating: number;
  sellerWhatsapp: string;
  distance: number;
  area: string;
  lat: number;
  lng: number;
  images: string[];
  createdAt: string;
  verified: boolean;
}

export interface RentalItem {
  id: string;
  title: string;
  type: 'rent' | 'sale';
  propertyType: '1 BHK Apartment' | '2 BHK Apartment' | '3 BHK Villa' | 'PG Room' | 'Commercial' | '2-Wheeler' | 'Sofa Set' | 'Smart TV';
  price: number; // rent monthly or outright sale price
  deposit?: number;
  size?: string;
  furnishing?: 'Unfurnished' | 'Semi-furnished' | 'Fully-furnished';
  availability: string;
  amenities: string[];
  area: string;
  distance: number;
  lat: number;
  lng: number;
  images: string[];
  ownerName: string;
  ownerWhatsapp: string;
  verified: boolean;
  description: string;
}

export interface ServiceRequest {
  id: string;
  title: string;
  category: 'Repair' | 'Wellness' | 'Cleaning' | 'Errands' | 'Tailoring' | 'Other';
  price: number; // price offered
  location: string;
  distance: number;
  lat?: number;
  lng?: number;
  notes?: string;
  image?: string;
  createdAt: string;
  userWhatsapp: string;
  userName: string;
  status: 'open' | 'accepted' | 'completed';
  acceptedBy?: string;
  acceptedByWhatsapp?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'other';
  text: string;
  timestamp: string;
}

export interface MockChat {
  id: string;
  targetId: string; // shopId, itemId, or requestId
  targetName: string;
  targetImage: string;
  targetType: 'shop' | 'marketplace' | 'rental' | 'request';
  priceText: string;
  whatsappNumber: string;
  lastMessage: string;
  lastMessageTime: string;
  status: 'Order Initiated' | 'Price Negotiated' | 'Ready for Pickup' | 'Rapido Dispatched' | 'Delivered' | 'Deal Closed' | 'Request Accepted';
  messages: ChatMessage[];
  rapidoDetails?: {
    driverName: string;
    driverPhone: string;
    otp: string;
    vehicleNo: string;
    deliveryFee: number;
    etaMinutes: number;
  };
}
