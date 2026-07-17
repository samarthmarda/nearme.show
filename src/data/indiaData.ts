/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Shop, MarketplaceItem, RentalItem, ServiceRequest } from '../types';

export interface CityInfo {
  id: string;
  name: string;
  centerLat: number;
  centerLng: number;
  areas: string[];
  landmarks: {
    parks: { name: string; x: number; y: number; w: number; h: number; textColor: string; bgColor: string }[];
    lake?: { name: string; path: string; x: number; y: number; textColor: string; pathColor: string };
    transit: { name: string; linePath: string; stationX: number; stationY: number; stationW: number; stationH: number; color: string };
    streets: { name: string; path: string; textX: number; textY: number; rotate?: number }[];
    neighborhoodLabels: { name: string; x: number; y: number; size: number }[];
  };
}

export const CITIES: CityInfo[] = [
  {
    id: "bengaluru",
    name: "Bengaluru",
    centerLat: 12.9720,
    centerLng: 77.6410,
    areas: [
      "Indiranagar, 12th Main",
      "Koramangala, 5th Block",
      "HSR Layout, Sector 3",
      "Jayanagar, 4th Block",
      "MG Road, Brigade Road",
      "Ulsoor Lake Area"
    ],
    landmarks: {
      parks: [
        { name: "Defence Colony Park", x: 100, y: 150, w: 180, h: 120, textColor: "#15803d", bgColor: "#dcfce7" },
        { name: "Indiranagar Club Grounds", x: 750, y: 320, w: 160, h: 100, textColor: "#15803d", bgColor: "#dcfce7" },
        { name: "Koramangala 3rd Block Park", x: 350, y: 650, w: 120, h: 80, textColor: "#15803d", bgColor: "#dcfce7" }
      ],
      lake: {
        name: "Ulsoor Lake",
        path: "M -10 100 C 50 120, 150 180, 250 130 C 320 90, 280 20, 200 -20 L -10 -20 Z",
        x: 110,
        y: 55,
        textColor: "#0369a1",
        pathColor: "#e0f2fe"
      },
      transit: {
        name: "Indiranagar Metro",
        linePath: "M -50 530 L 1250 530",
        stationX: 530,
        stationY: 515,
        stationW: 110,
        stationH: 28,
        color: "#7C3AED"
      },
      streets: [
        { name: "100 FEET ROAD", path: "M 600 -50 L 600 1250", textX: 615, textY: 250, rotate: 90 },
        { name: "CMH ROAD (METRO CORRIDOR)", path: "M -50 560 L 1250 560", textX: 250, textY: 565 },
        { name: "12TH MAIN ROAD", path: "M 720 -50 L 720 1250", textX: 732, textY: 150, rotate: 90 },
        { name: "KORAMANGALA INNER RING ROAD", path: "M -50 780 Q 250 760, 450 780 T 1250 1100", textX: 180, textY: 765 }
      ],
      neighborhoodLabels: [
        { name: "INDIRANAGAR", x: 600, y: 440, size: 24 },
        { name: "KORAMANGALA", x: 400, y: 810, size: 24 },
        { name: "HSR LAYOUT", x: 800, y: 920, size: 22 }
      ]
    }
  },
  {
    id: "mumbai",
    name: "Mumbai",
    centerLat: 19.0550,
    centerLng: 72.8300,
    areas: [
      "Bandra West, Carter Rd",
      "Juhu, Tara Road",
      "Colaba, Causeway",
      "Powai, Hiranandani",
      "Andheri West, Lokhandwala"
    ],
    landmarks: {
      parks: [
        { name: "Joggers Park Bandra", x: 100, y: 150, w: 180, h: 120, textColor: "#0d9488", bgColor: "#ccfbf1" },
        { name: "Supreme Palms Gardens", x: 750, y: 320, w: 160, h: 100, textColor: "#0d9488", bgColor: "#ccfbf1" },
        { name: "Hiranandani Heritage Forest", x: 350, y: 650, w: 120, h: 80, textColor: "#0d9488", bgColor: "#ccfbf1" }
      ],
      lake: {
        name: "Powai Lake",
        path: "M -10 120 C 60 140, 160 210, 270 150 C 340 100, 300 30, 220 -10 L -10 -10 Z",
        x: 120,
        y: 65,
        textColor: "#0891b2",
        pathColor: "#ecfeff"
      },
      transit: {
        name: "Bandra Local Station",
        linePath: "M -50 530 L 1250 530",
        stationX: 530,
        stationY: 515,
        stationW: 130,
        stationH: 28,
        color: "#DC2626"
      },
      streets: [
        { name: "CARTER ROAD PROMENADE", path: "M 600 -50 L 600 1250", textX: 615, textY: 250, rotate: 90 },
        { name: "LINKING ROAD SHOPPING STRETCH", path: "M -50 560 L 1250 560", textX: 250, textY: 565 },
        { name: "HILL ROAD BANDRA", path: "M 720 -50 L 720 1250", textX: 732, textY: 150, rotate: 90 },
        { name: "WESTERN EXPRESS HIGHWAY", path: "M -50 780 Q 250 760, 450 780 T 1250 1100", textX: 180, textY: 765 }
      ],
      neighborhoodLabels: [
        { name: "BANDRA WEST", x: 600, y: 440, size: 24 },
        { name: "ANDHERI LOKHANDWALA", x: 400, y: 810, size: 22 },
        { name: "POWAI HEIGHTS", x: 800, y: 920, size: 22 }
      ]
    }
  },
  {
    id: "delhi",
    name: "Delhi NCR",
    centerLat: 28.5450,
    centerLng: 77.2060,
    areas: [
      "Hauz Khas Village",
      "Connaught Place, Radial",
      "Greater Kailash 2 (GK2)",
      "DLF Phase 3, Gurgaon",
      "Saket, Select City Walk"
    ],
    landmarks: {
      parks: [
        { name: "Hauz Khas Deer Park", x: 100, y: 150, w: 180, h: 120, textColor: "#15803d", bgColor: "#dcfce7" },
        { name: "Lodi Gardens Compound", x: 750, y: 320, w: 160, h: 100, textColor: "#15803d", bgColor: "#dcfce7" },
        { name: "Siri Fort Sports Complex", x: 350, y: 650, w: 120, h: 80, textColor: "#15803d", bgColor: "#dcfce7" }
      ],
      lake: {
        name: "Hauz Khas Lake",
        path: "M -10 100 C 50 120, 150 180, 250 130 C 320 90, 280 20, 200 -20 L -10 -20 Z",
        x: 110,
        y: 55,
        textColor: "#0369a1",
        pathColor: "#e0f2fe"
      },
      transit: {
        name: "Rajiv Chowk Metro",
        linePath: "M -50 530 L 1250 530",
        stationX: 530,
        stationY: 515,
        stationW: 130,
        stationH: 28,
        color: "#EAB308"
      },
      streets: [
        { name: "CONNAUGHT CIRCUS RING", path: "M 600 -50 L 600 1250", textX: 615, textY: 250, rotate: 90 },
        { name: "INNER RING ROAD DELHI", path: "M -50 560 L 1250 560", textX: 250, textY: 565 },
        { name: "HAUZ KHAS FORT STREET", path: "M 720 -50 L 720 1250", textX: 732, textY: 150, rotate: 90 },
        { name: "MG ROAD GURUGRAM HIGHWAY", path: "M -50 780 Q 250 760, 450 780 T 1250 1100", textX: 180, textY: 765 }
      ],
      neighborhoodLabels: [
        { name: "HAUZ KHAS VILLAGE", x: 600, y: 440, size: 24 },
        { name: "CONNAUGHT PLACE", x: 400, y: 810, size: 24 },
        { name: "GURGAON CYBERCITY", x: 800, y: 920, size: 22 }
      ]
    }
  },
  {
    id: "hyderabad",
    name: "Hyderabad",
    centerLat: 17.4300,
    centerLng: 78.3900,
    areas: [
      "Jubilee Hills, Road No. 36",
      "Banjara Hills, Road No. 1",
      "Gachibowli, DLF Road",
      "Madhapur, HITEC City",
      "Kondapur Main Road"
    ],
    landmarks: {
      parks: [
        { name: "KBR National Park", x: 100, y: 150, w: 180, h: 120, textColor: "#166534", bgColor: "#bbf7d0" },
        { name: "Jubilee Hills Club Park", x: 750, y: 320, w: 160, h: 100, textColor: "#166534", bgColor: "#bbf7d0" },
        { name: "Gachibowli Botanical Park", x: 350, y: 650, w: 120, h: 80, textColor: "#166534", bgColor: "#bbf7d0" }
      ],
      lake: {
        name: "Durgam Cheruvu",
        path: "M -10 110 C 60 130, 160 190, 260 140 C 330 100, 290 30, 210 -10 L -10 -10 Z",
        x: 120,
        y: 60,
        textColor: "#0e7490",
        pathColor: "#cffafe"
      },
      transit: {
        name: "Hitec City Metro",
        linePath: "M -50 530 L 1250 530",
        stationX: 530,
        stationY: 515,
        stationW: 110,
        stationH: 28,
        color: "#2563EB"
      },
      streets: [
        { name: "ROAD NO. 36 JUBILEE HILLS", path: "M 600 -50 L 600 1250", textX: 615, textY: 250, rotate: 90 },
        { name: "DLF CYBER CITY GATE ROAD", path: "M -50 560 L 1250 560", textX: 250, textY: 565 },
        { name: "ROAD NO. 1 BANJARA HILLS", path: "M 720 -50 L 720 1250", textX: 732, textY: 150, rotate: 90 },
        { name: "Gachibowli Outer Ring Link", path: "M -50 780 Q 250 760, 450 780 T 1250 1100", textX: 180, textY: 765 }
      ],
      neighborhoodLabels: [
        { name: "JUBILEE HILLS", x: 600, y: 440, size: 24 },
        { name: "GACHIBOWLI TECH ZONE", x: 400, y: 810, size: 22 },
        { name: "MADHAPUR HITEC", x: 800, y: 920, size: 24 }
      ]
    }
  }
];

export const SHIFT_COORDINATES_FOR_CITY = (itemLat: number, itemLng: number, city: CityInfo) => {
  // Simple projection centered around the city's lat/lng
  const scaleX = 35000;
  const scaleY = 35000;
  const x = 600 + (itemLng - city.centerLng) * scaleX;
  const y = 550 - (itemLat - city.centerLat) * scaleY;
  return { x, y };
};

export const DATA_BY_CITY: Record<string, {
  shops: Shop[];
  marketplace: MarketplaceItem[];
  rentals: RentalItem[];
  requests: ServiceRequest[];
}> = {
  bengaluru: {
    shops: [
      {
        id: "blr-shop-1",
        name: "Sri Rameshwaram Cafe",
        category: "restaurant",
        logo: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=150&auto=format&fit=crop&q=60",
        banner: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80",
        rating: 4.8,
        reviewsCount: 1240,
        distance: 0.3,
        area: "Indiranagar, 12th Main",
        lat: 12.9716,
        lng: 77.6412,
        isOpen: true,
        hours: "6:30 AM - 11:30 PM",
        whatsapp: "+919876543210",
        address: "Plot No. 2901, 100 Feet Rd, HAL 2nd Stage, Indiranagar, Bengaluru, Karnataka 560038",
        phone: "080-49652312",
        verified: true,
        catalogue: [
          {
            id: "blr-item-101",
            name: "Ghee Podi Masala Dosa",
            price: 110,
            description: "Crispy golden dosa smeared with gunpowder podi, pure ghee, coconut chutney, and piping hot sambar.",
            image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=400&auto=format&fit=crop&q=60"
          },
          {
            id: "blr-item-102",
            name: "Open Butter Masala Dosa",
            price: 130,
            description: "Thick soft and crispy dosa with special paste, chunks of fresh butter, and potato filling.",
            image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&auto=format&fit=crop&q=60"
          },
          {
            id: "blr-item-103",
            name: "Filter Coffee",
            price: 40,
            description: "Authentic South Indian degree filter coffee frothed to perfection in brass tumblers.",
            image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&auto=format&fit=crop&q=60"
          }
        ]
      },
      {
        id: "blr-shop-2",
        name: "Vidyarthi Bhavan",
        category: "restaurant",
        logo: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=150&auto=format&fit=crop&q=60",
        banner: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=800&auto=format&fit=crop&q=80",
        rating: 4.7,
        reviewsCount: 3100,
        distance: 1.4,
        area: "Jayanagar, 4th Block",
        lat: 12.9680,
        lng: 77.6350,
        isOpen: true,
        hours: "6:30 AM - 8:00 PM",
        whatsapp: "+919876543211",
        address: "31, Gandhi Bazaar Main Rd, Basavanagudi, Bengaluru, Karnataka 560004",
        phone: "080-26677462",
        verified: true,
        catalogue: [
          {
            id: "blr-item-201",
            name: "VB Special Masala Dosa",
            price: 90,
            description: "Classic Basavanagudi style thick crispy dosa with potato sagu and signature thick chutney.",
            image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=400&auto=format&fit=crop&q=60"
          }
        ]
      },
      {
        id: "blr-shop-3",
        name: "The Glen's Bakehouse",
        category: "cafe",
        logo: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=150&auto=format&fit=crop&q=60",
        banner: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&auto=format&fit=crop&q=80",
        rating: 4.4,
        reviewsCount: 890,
        distance: 0.6,
        area: "Indiranagar, 12th Main",
        lat: 12.9735,
        lng: 77.6430,
        isOpen: true,
        hours: "9:00 AM - 12:00 AM",
        whatsapp: "+919876543212",
        address: "297, 100 Feet Rd, opposite Toit, Indiranagar, Bengaluru, Karnataka 560038",
        phone: "080-41221199",
        verified: true,
        catalogue: [
          {
            id: "blr-item-301",
            name: "Signature Red Velvet Cupcake",
            price: 75,
            description: "Moist red velvet cake layers topped with smooth cream cheese frosting. Classic!",
            image: "https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?w=400&auto=format&fit=crop&q=60"
          },
          {
            id: "blr-item-302",
            name: "Belgian Hot Chocolate",
            price: 180,
            description: "Rich melted Belgian chocolate with organic creamy milk, topped with mini marshmallows.",
            image: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&auto=format&fit=crop&q=60"
          }
        ]
      },
      {
        id: "blr-shop-4",
        name: "Verma Tailors & Drapers",
        category: "tailor",
        logo: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=150&auto=format&fit=crop&q=60",
        banner: "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=800&auto=format&fit=crop&q=80",
        rating: 4.6,
        reviewsCount: 145,
        distance: 0.8,
        area: "Koramangala, 5th Block",
        lat: 12.9700,
        lng: 77.6390,
        isOpen: true,
        hours: "10:30 AM - 8:30 PM",
        whatsapp: "+919876543213",
        address: "Building 45, 1st Cross, Koramangala 5th Block, Bengaluru, Karnataka 560095",
        phone: "080-41315522",
        verified: true,
        catalogue: [
          {
            id: "blr-item-401",
            name: "Custom Men's Suit Stitching",
            price: 4500,
            description: "Full professional stitching for two-piece suit (blazer + trousers). Fit guarantees 2 free alterations.",
            image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&auto=format&fit=crop&q=60"
          }
        ]
      }
    ],
    marketplace: [
      {
        id: "blr-m1",
        title: "Royal Enfield Classic 350 (2021 Model)",
        price: 165000,
        category: "Vehicles",
        condition: "Like New",
        description: "Selling Classic 350 Gunmetal Grey. Only 12,000 km run, single owner, no accident history, brand new rear tyre.",
        sellerName: "Aditya Hegde",
        sellerRating: 4.9,
        sellerWhatsapp: "+919881122334",
        distance: 0.9,
        area: "Indiranagar, 12th Main",
        lat: 12.9750,
        lng: 77.6380,
        images: ["https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=600&auto=format&fit=crop&q=80"],
        createdAt: "2 hours ago",
        verified: true
      },
      {
        id: "blr-m2",
        title: "Ergonomic Office Chair (Spinery)",
        price: 4500,
        category: "Furniture",
        condition: "Used",
        description: "Mesh high-back ergonomic office chair with adjustable lumbar support, 3D armrests. Extremely comfortable.",
        sellerName: "Neha Sharma",
        sellerRating: 4.7,
        sellerWhatsapp: "+919877112233",
        distance: 0.5,
        area: "Koramangala, 5th Block",
        lat: 12.9710,
        lng: 77.6430,
        images: ["https://images.unsplash.com/photo-1580481072645-022f9a6dbf27?w=600&auto=format&fit=crop&q=80"],
        createdAt: "1 day ago",
        verified: false
      }
    ],
    rentals: [
      {
        id: "blr-r1",
        title: "1 BHK Semi-Furnished Studio Penthouse",
        type: "rent",
        propertyType: "1 BHK Apartment",
        price: 18500,
        deposit: 60000,
        size: "650 sqft",
        furnishing: "Semi-furnished",
        availability: "Immediate",
        amenities: ["Private Terrace", "Geyser", "Modular Kitchen", "Wardrobe", "2-Wheeler Parking", "Power Backup"],
        area: "Indiranagar, 12th Main",
        distance: 0.4,
        lat: 12.9740,
        lng: 77.6415,
        images: ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&auto=format&fit=crop&q=80"],
        ownerName: "C. K. Nagaraj (Owner)",
        ownerWhatsapp: "+919448112233",
        verified: true,
        description: "Beautiful independent 1 BHK penthouse on the 4th floor with a massive 300 sqft attached private terrace. North-facing."
      }
    ],
    requests: [
      {
        id: "blr-req-1",
        title: "Need plumber to fix kitchen tap leakage & washbasin drain block",
        category: "Repair",
        price: 350,
        location: "Indiranagar, 12th Main",
        distance: 0.3,
        createdAt: "10 mins ago",
        userWhatsapp: "+919900112233",
        userName: "Meera Krishnan",
        status: "open",
        notes: "Kitchen sink faucet is dripping continuously causing high wastage. bathroom washbasin block."
      }
    ]
  },
  mumbai: {
    shops: [
      {
        id: "mum-shop-1",
        name: "Kyani & Co. Bakery",
        category: "restaurant",
        logo: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=150&auto=format&fit=crop&q=60",
        banner: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80",
        rating: 4.7,
        reviewsCount: 3410,
        distance: 0.4,
        area: "Colaba, Causeway",
        lat: 19.0552,
        lng: 72.8312,
        isOpen: true,
        hours: "7:00 AM - 8:30 PM",
        whatsapp: "+919812345670",
        address: "JSS Road, Jer Mahal Estate, Opposite Metro Cinema, Marine Lines, Mumbai 400002",
        phone: "022-22011464",
        verified: true,
        catalogue: [
          {
            id: "mum-item-101",
            name: "Irani Chai & Bun Maska",
            price: 70,
            description: "Authentic double-sweetened Irani tea served with extra soft bun loaded with pure Amul butter.",
            image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&auto=format&fit=crop&q=60"
          },
          {
            id: "mum-item-102",
            name: "Mutton Keema Pav (Plate)",
            price: 210,
            description: "Perfectly spiced minced mutton slow-cooked in traditional Irani dry masalas, served with two soft buttered pavs.",
            image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=400&auto=format&fit=crop&q=60"
          }
        ]
      },
      {
        id: "mum-shop-2",
        name: "Joey's Pizza Lokhandwala",
        category: "restaurant",
        logo: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=150&auto=format&fit=crop&q=60",
        banner: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80",
        rating: 4.8,
        reviewsCount: 1980,
        distance: 0.8,
        area: "Andheri West, Lokhandwala",
        lat: 19.0538,
        lng: 72.8285,
        isOpen: true,
        hours: "11:00 AM - 11:30 PM",
        whatsapp: "+919812345671",
        address: "Shop 6, Deep Jyoti CHS, Lokhandwala Complex, Andheri West, Mumbai 400053",
        phone: "022-26300753",
        verified: true,
        catalogue: [
          {
            id: "mum-item-201",
            name: "Tornado Chicken Pizza (Personal)",
            price: 320,
            description: "Loaded with dynamic spicy BBQ chicken, seekh kebab slices, capsicum, and thick special liquid cheese.",
            image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&auto=format&fit=crop&q=60"
          }
        ]
      },
      {
        id: "mum-shop-3",
        name: "Bandra Bespoke Atelier",
        category: "tailor",
        logo: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=150&auto=format&fit=crop&q=60",
        banner: "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=800&auto=format&fit=crop&q=80",
        rating: 4.6,
        reviewsCount: 88,
        distance: 0.5,
        area: "Bandra West, Carter Rd",
        lat: 19.0560,
        lng: 72.8330,
        isOpen: true,
        hours: "10:30 AM - 9:00 PM",
        whatsapp: "+919812345672",
        address: "Shop 12, Carter Road Promenade Market, Bandra West, Mumbai 400050",
        phone: "022-49128312",
        verified: true,
        catalogue: [
          {
            id: "mum-item-301",
            name: "Indo-Western Sherwani Tailoring",
            price: 8500,
            description: "Handcrafted master-tailored sherwani or bandhgala for weddings. Includes trial fits & custom collar lining.",
            image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&auto=format&fit=crop&q=60"
          }
        ]
      }
    ],
    marketplace: [
      {
        id: "mum-m1",
        title: "Apple MacBook Air M1 (8GB / 256GB SSD)",
        price: 52000,
        category: "Electronics",
        condition: "Like New",
        description: "Space Grey, 92% battery health, original box and bill. Squeaky clean, no scratches at all. Selling because I upgraded to M3 Pro.",
        sellerName: "Rohan Advani",
        sellerRating: 4.9,
        sellerWhatsapp: "+919819890001",
        distance: 0.6,
        area: "Powai, Hiranandani",
        lat: 19.0570,
        lng: 72.8310,
        images: ["https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80"],
        createdAt: "3 mins ago",
        verified: true
      },
      {
        id: "mum-m2",
        title: "Vespa LX 125 (Matte Black, 2020)",
        price: 78000,
        category: "Vehicles",
        condition: "Used",
        description: "Excellent condition Vespa LX. Single handedly driven to college in Bandra. Valid third party insurance and registration papers.",
        sellerName: "Shanaya Sen",
        sellerRating: 4.8,
        sellerWhatsapp: "+919819890002",
        distance: 1.1,
        area: "Bandra West, Carter Rd",
        lat: 19.0545,
        lng: 72.8250,
        images: ["https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=600&auto=format&fit=crop&q=80"],
        createdAt: "4 hours ago",
        verified: false
      }
    ],
    rentals: [
      {
        id: "mum-r1",
        title: "Sea-Facing Cozy Studio Apartment",
        type: "rent",
        propertyType: "PG Room",
        price: 32000,
        deposit: 100000,
        size: "380 sqft",
        furnishing: "Fully-furnished",
        availability: "Immediate",
        amenities: ["AC", "Washing Machine", "Housekeeping", "Sea View", "WiFi", "24/7 Security"],
        area: "Bandra West, Carter Rd",
        distance: 0.2,
        lat: 19.0558,
        lng: 72.8305,
        images: ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&auto=format&fit=crop&q=80"],
        ownerName: "Aunty D'Souza (Direct)",
        ownerWhatsapp: "+919820011223",
        verified: true,
        description: "Fully furnished sweet studio on Carter Road overlooking the Arabian Sea. Sassy vibe, ideal for creative folks."
      }
    ],
    requests: [
      {
        id: "mum-req-1",
        title: "Vada Pav delivery from Ashok Vada Pav Dadar to Bandra",
        category: "Errands",
        price: 250,
        location: "Bandra West, Carter Rd",
        distance: 0.3,
        createdAt: "5 mins ago",
        userWhatsapp: "+919920112233",
        userName: "Aryan Khona",
        status: "open",
        notes: "Ashok Vada Pav is ultimate. Craving for 3 plates of classic Vada Pav with sweet/spicy chutney. Rapido dispatching accepted."
      }
    ]
  },
  delhi: {
    shops: [
      {
        id: "del-shop-1",
        name: "Dolma Tsering Momo Corner",
        category: "restaurant",
        logo: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=150&auto=format&fit=crop&q=60",
        banner: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=800&auto=format&fit=crop&q=80",
        rating: 4.8,
        reviewsCount: 4500,
        distance: 0.2,
        area: "Hauz Khas Village",
        lat: 28.5452,
        lng: 77.2062,
        isOpen: true,
        hours: "1:00 PM - 10:00 PM",
        whatsapp: "+919811122233",
        address: "Shop 1, Main Market Lane, Hauz Khas Village, New Delhi 110016",
        phone: "011-26830112",
        verified: true,
        catalogue: [
          {
            id: "del-item-101",
            name: "Steamed Chicken Momos (8 Pcs)",
            price: 130,
            description: "Our legendary thin-skinned juicy chicken momos served with fire-spicy red chilli chutney.",
            image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=400&auto=format&fit=crop&q=60"
          },
          {
            id: "del-item-102",
            name: "Paneer Tandoori Momos",
            price: 150,
            description: "Spicy tandoori masala marinated paneer momos charcoal roasted to perfection.",
            image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=400&auto=format&fit=crop&q=60"
          }
        ]
      },
      {
        id: "del-shop-2",
        name: "Bakehouse Comforts",
        category: "cafe",
        logo: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=150&auto=format&fit=crop&q=60",
        banner: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&auto=format&fit=crop&q=80",
        rating: 4.5,
        reviewsCount: 780,
        distance: 0.7,
        area: "Greater Kailash 2 (GK2)",
        lat: 28.5435,
        lng: 77.2030,
        isOpen: true,
        hours: "9:00 AM - 11:00 PM",
        whatsapp: "+919811122234",
        address: "M-45, GK 2 M Block Market, New Delhi 110048",
        phone: "011-41400234",
        verified: true,
        catalogue: [
          {
            id: "del-item-201",
            name: "Hazelnut Cold Brew Shake",
            price: 210,
            description: "Gourmet cold-brewed Arabica frothed up with hazelnut syrup and premium vanilla bean cream.",
            image: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&auto=format&fit=crop&q=60"
          }
        ]
      }
    ],
    marketplace: [
      {
        id: "del-m1",
        title: "Acoustic Guitar (Fender SA-150)",
        price: 5800,
        category: "Hobbies",
        condition: "Like New",
        description: "Hardly played three times, comes with padded bag, digital tuner, and 3 high density picks. Rich mahogany sound.",
        sellerName: "Kabir Mehra",
        sellerRating: 4.8,
        sellerWhatsapp: "+919810101011",
        distance: 0.4,
        area: "Greater Kailash 2 (GK2)",
        lat: 28.5440,
        lng: 77.2070,
        images: ["https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=600&auto=format&fit=crop&q=80"],
        createdAt: "1 hour ago",
        verified: true
      }
    ],
    rentals: [
      {
        id: "del-r1",
        title: "Chic Studio Room with Terrace Garden",
        type: "rent",
        propertyType: "PG Room",
        price: 22000,
        deposit: 40000,
        size: "450 sqft",
        furnishing: "Fully-furnished",
        availability: "Immediate",
        amenities: ["Terrace View", "Private Kitchen", "WiFi", "Smart TV", "AC", "Microwave"],
        area: "Hauz Khas Village",
        distance: 0.3,
        lat: 28.5460,
        lng: 77.2085,
        images: ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&auto=format&fit=crop&q=80"],
        ownerName: "Sardar Satnam Singh",
        ownerWhatsapp: "+919810022334",
        verified: true,
        description: "Beautiful independent floor with a lush green terrace garden. Super central, secure, right in HKV."
      }
    ],
    requests: [
      {
        id: "del-req-1",
        title: "Pick up handloom saree from Karol Bagh and drop in GK 2",
        category: "Errands",
        price: 350,
        location: "Greater Kailash 2 (GK2)",
        distance: 0.5,
        createdAt: "12 mins ago",
        userWhatsapp: "+919810011122",
        userName: "Tripti Oberoi",
        status: "open",
        notes: "Saree has been dry cleaned and packed at Karol Bagh Handlooms. Need a safe courier drop."
      }
    ]
  },
  hyderabad: {
    shops: [
      {
        id: "hyd-shop-1",
        name: "Cafe Niloufer & Tea",
        category: "restaurant",
        logo: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=150&auto=format&fit=crop&q=60",
        banner: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&auto=format&fit=crop&q=80",
        rating: 4.9,
        reviewsCount: 6100,
        distance: 0.5,
        area: "Jubilee Hills, Road No. 36",
        lat: 17.4302,
        lng: 78.3912,
        isOpen: true,
        hours: "6:00 AM - 11:30 PM",
        whatsapp: "+919848012345",
        address: "Road No. 36, Beside Metro Pillar 1621, Jubilee Hills, Hyderabad 500033",
        phone: "040-23391035",
        verified: true,
        catalogue: [
          {
            id: "hyd-item-101",
            name: "Irani Chai Flask with Osmania Biscuits (Flask Serves 4)",
            price: 180,
            description: "Thick creamy Hyderabadi special Irani chai in insulated flask. Sells with 6 melt-in-mouth Osmania biscuits.",
            image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&auto=format&fit=crop&q=60"
          },
          {
            id: "hyd-item-102",
            name: "Mutton Bun Malai",
            price: 120,
            description: "Soft sweet bun sliced open and layered heavily with native milk malai (clotted cream) and pure honey.",
            image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&auto=format&fit=crop&q=60"
          }
        ]
      }
    ],
    marketplace: [
      {
        id: "hyd-m1",
        title: "Ergonomic Office Table (Teak)",
        price: 8900,
        category: "Furniture",
        condition: "Like New",
        description: "Solid engineered teak wood study desk with cable management slot. Built for heavy IT work setups.",
        sellerName: "Sandeep Reddy",
        sellerRating: 4.9,
        sellerWhatsapp: "+919849012345",
        distance: 0.8,
        area: "Gachibowli, DLF Road",
        lat: 17.4285,
        lng: 78.3880,
        images: ["https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=600&auto=format&fit=crop&q=80"],
        createdAt: "30 mins ago",
        verified: true
      }
    ],
    rentals: [
      {
        id: "hyd-r1",
        title: "2 BHK Smart Apartment near DLF Tech Park",
        type: "rent",
        propertyType: "2 BHK Apartment",
        price: 28000,
        deposit: 75000,
        size: "1150 sqft",
        furnishing: "Semi-furnished",
        availability: "Immediate",
        amenities: ["AC", "Car Parking", "Modular Kitchen", "Power Backup", "Gym Access", "24/7 Security"],
        area: "Gachibowli, DLF Road",
        distance: 1.2,
        lat: 17.4320,
        lng: 78.3940,
        images: ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&auto=format&fit=crop&q=80"],
        ownerName: "K. Mohan Rao",
        ownerWhatsapp: "+919849022334",
        verified: true,
        description: "High floor semi-furnished beautiful 2BHK. High ventilation, directly opposite DLF street food lane."
      }
    ],
    requests: [
      {
        id: "hyd-req-1",
        title: "Need AC gas filling & general filter cleaning (Split AC)",
        category: "Repair",
        price: 1500,
        location: "Gachibowli, DLF Road",
        distance: 0.5,
        createdAt: "5 mins ago",
        userWhatsapp: "+919849011122",
        userName: "Preeti Varma",
        status: "open",
        notes: "Voltas split AC blowing normal air. Need gas pressure checking, top up and filter vacuuming immediately."
      }
    ]
  }
};
