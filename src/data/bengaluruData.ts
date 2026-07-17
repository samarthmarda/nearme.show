/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Shop, MarketplaceItem, RentalItem, ServiceRequest } from '../types';

export const BENGALURU_AREAS = [
  "Indiranagar, 12th Main",
  "Koramangala, 5th Block",
  "HSR Layout, Sector 3",
  "Jayanagar, 4th Block",
  "MG Road, Brigade Road",
  "Ulsoor Lake Area"
];

export const INITIAL_SHOPS: Shop[] = [
  {
    id: "shop-1",
    name: "Sri Rameshwaram Cafe",
    category: "restaurant",
    logo: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=150&auto=format&fit=crop&q=60",
    banner: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80",
    rating: 4.8,
    reviewsCount: 1240,
    distance: 0.3,
    area: "Indiranagar, 12th Main",
    lat: 12.9716, // absolute latitude of user centered area
    lng: 77.6412, // absolute longitude
    isOpen: true,
    hours: "6:30 AM - 11:30 PM",
    whatsapp: "+919876543210",
    address: "Plot No. 2901, 100 Feet Rd, HAL 2nd Stage, Indiranagar, Bengaluru, Karnataka 560038",
    phone: "080-49652312",
    verified: true,
    catalogue: [
      {
        id: "item-101",
        name: "Ghee Podi Masala Dosa",
        price: 110,
        description: "Crispy golden dosa smeared with spicy gunpowder podi, pure ghee, and served with thick coconut chutney and piping hot sambar.",
        image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=400&auto=format&fit=crop&q=60"
      },
      {
        id: "item-102",
        name: "Open Butter Masala Dosa",
        price: 130,
        description: "Thick soft and crispy dosa with special paste, chunks of fresh butter, potato filling, and a robust flavour.",
        image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&auto=format&fit=crop&q=60"
      },
      {
        id: "item-103",
        name: "Ghee Podi Idli (2 Pcs)",
        price: 80,
        description: "Button idlis drenched in native ghee and loaded with spices. Our best seller!",
        image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&auto=format&fit=crop&q=60"
      },
      {
        id: "item-104",
        name: "Filter Coffee",
        price: 40,
        description: "Strong, authentic South Indian degree filter coffee frothed to perfection in brass tumblers.",
        image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&auto=format&fit=crop&q=60"
      }
    ]
  },
  {
    id: "shop-2",
    name: "Vidyarthi Bhavan",
    category: "restaurant",
    logo: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=150&auto=format&fit=crop&q=60",
    banner: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=800&auto=format&fit=crop&q=80",
    rating: 4.7,
    reviewsCount: 3100,
    distance: 1.4,
    area: "Jayanagar, 4th Block",
    lat: 12.9250,
    lng: 77.5897,
    isOpen: true,
    hours: "6:30 AM - 11:30 AM, 2:00 PM - 8:00 PM",
    whatsapp: "+919876543211",
    address: "31, Gandhi Bazaar Main Rd, Basavanagudi, Bengaluru, Karnataka 560004",
    phone: "080-26677462",
    verified: true,
    catalogue: [
      {
        id: "item-201",
        name: "VB Special Masala Dosa",
        price: 90,
        description: "Classic Basavanagudi style thick crispy dosa with potato sagu and signature thick red chutney inside, served with standard chutney.",
        image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=400&auto=format&fit=crop&q=60"
      },
      {
        id: "item-202",
        name: "Rava Vada (1 Pc)",
        price: 45,
        description: "Crispy fried split black lentil donut with green chillies, ginger, and curry leaves.",
        image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=400&auto=format&fit=crop&q=60"
      },
      {
        id: "item-203",
        name: "Khara Bhath",
        price: 60,
        description: "Spiced semolina porridge loaded with seasonal vegetables, cashews, and ghee.",
        image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=400&auto=format&fit=crop&q=60"
      }
    ]
  },
  {
    id: "shop-3",
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
        id: "item-301",
        name: "Signature Red Velvet Cupcake",
        price: 75,
        description: "Moist red velvet cake layers topped with smooth cream cheese frosting. Famous across Bengaluru!",
        image: "https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?w=400&auto=format&fit=crop&q=60"
      },
      {
        id: "item-302",
        name: "Sourdough Pepperoni Pizza (Personal)",
        price: 290,
        description: "Hand-stretched sourdough base with imported pork pepperoni, fresh mozzarella, and homemade marinara sauce.",
        image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&auto=format&fit=crop&q=60"
      },
      {
        id: "item-303",
        name: "Belgian Hot Chocolate",
        price: 180,
        description: "Rich melted Belgian chocolate with organic creamy milk, topped with mini marshmallows.",
        image: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&auto=format&fit=crop&q=60"
      }
    ]
  },
  {
    id: "shop-4",
    name: "Verma Tailors & Drapers",
    category: "tailor",
    logo: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=150&auto=format&fit=crop&q=60",
    banner: "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=800&auto=format&fit=crop&q=80",
    rating: 4.6,
    reviewsCount: 145,
    distance: 0.8,
    area: "Koramangala, 5th Block",
    lat: 12.9340,
    lng: 77.6220,
    isOpen: true,
    hours: "10:30 AM - 8:30 PM (Closed on Mondays)",
    whatsapp: "+919876543213",
    address: "Building 45, 1st Cross, Koramangala 5th Block, Bengaluru, Karnataka 560095",
    phone: "080-41315522",
    verified: true,
    catalogue: [
      {
        id: "item-401",
        name: "Custom Men's Suit Stitching",
        price: 4500,
        description: "Full professional stitching for two-piece suit (blazer + trousers). Fit guarantees 2 free alterations.",
        image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&auto=format&fit=crop&q=60"
      },
      {
        id: "item-402",
        name: "Bridal Lehenga Custom Alteration",
        price: 1200,
        description: "Intricate adjustments, custom linings, and sizing updates for bridal/heavy designer wear.",
        image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&auto=format&fit=crop&q=60"
      },
      {
        id: "item-403",
        name: "Premium Shirt Stitching",
        price: 550,
        description: "Bespoke custom-fit formal/casual shirt stitching. Fabric must be provided or picked from catalog.",
        image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&auto=format&fit=crop&q=60"
      }
    ]
  },
  {
    id: "shop-5",
    name: "Nalli Silks Indiranagar",
    category: "cloth_store",
    logo: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=150&auto=format&fit=crop&q=60",
    banner: "https://images.unsplash.com/photo-1608748010899-18f300247112?w=800&auto=format&fit=crop&q=80",
    rating: 4.5,
    reviewsCount: 310,
    distance: 1.1,
    area: "Indiranagar, 12th Main",
    lat: 12.9698,
    lng: 77.6440,
    isOpen: true,
    hours: "10:00 AM - 9:00 PM",
    whatsapp: "+919876543214",
    address: "No. 786, Chinmaya Mission Hospital Rd, Indiranagar, Bengaluru, Karnataka 560038",
    phone: "080-25283435",
    verified: true,
    catalogue: [
      {
        id: "item-501",
        name: "Pure Kanchipuram Silk Saree",
        price: 14500,
        description: "Traditional pure handloom Kanchipuram silk saree with rich zari border and traditional motifs. Perfect for weddings.",
        image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&auto=format&fit=crop&q=60"
      },
      {
        id: "item-502",
        name: "Mysore Crepe Silk Saree",
        price: 6800,
        description: "Elegant and soft lightweight Mysore silk crepe saree with delicate single-tone zari work.",
        image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&auto=format&fit=crop&q=60"
      },
      {
        id: "item-503",
        name: "Tussar Semi-Silk Saree",
        price: 2400,
        description: "Durable block printed Tussar silk mix saree, ideal for office wear and high comfort in summer.",
        image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&auto=format&fit=crop&q=60"
      }
    ]
  },
  {
    id: "shop-6",
    name: "Chai Point Metro Station",
    category: "cafe",
    logo: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=150&auto=format&fit=crop&q=60",
    banner: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800&auto=format&fit=crop&q=80",
    rating: 4.1,
    reviewsCount: 420,
    distance: 0.2,
    area: "Indiranagar, 12th Main",
    lat: 12.9722,
    lng: 77.6395,
    isOpen: true,
    hours: "7:00 AM - 11:00 PM",
    whatsapp: "+919876543215",
    address: "Under Metro Station, Indiranagar, Bengaluru, Karnataka 560038",
    phone: "080-49219321",
    verified: true,
    catalogue: [
      {
        id: "item-601",
        name: "Ginger Chai Flask (UniFlask)",
        price: 160,
        description: "Hot, freshly-brewed ginger tea that stays bubbling hot in our special heat-retaining cardboard flask (serves 3-4).",
        image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&auto=format&fit=crop&q=60"
      },
      {
        id: "item-602",
        name: "Samosa Duo with Mint Chutney",
        price: 60,
        description: "Two crispy golden-fried Punjabi style aloo samosas with tangy mint chutney.",
        image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=400&auto=format&fit=crop&q=60"
      },
      {
        id: "item-603",
        name: "Banana Cake Slice",
        price: 55,
        description: "Moist, fresh healthy banana cake slice sweetened with organic jaggery.",
        image: "https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?w=400&auto=format&fit=crop&q=60"
      }
    ]
  }
];

export const INITIAL_MARKETPLACE_ITEMS: MarketplaceItem[] = [
  {
    id: "item-m1",
    title: "Royal Enfield Classic 350 (2021 Model)",
    price: 165000,
    category: "Vehicles",
    condition: "Like New",
    description: "Selling my rarely used Classic 350 Gunmetal Grey. Only 12,000 km run, single owner, no accident history, brand new rear tyre, fully serviced with active zero-depreciation insurance. Moving abroad, urgent sale. Price slightly negotiable.",
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
    id: "item-m2",
    title: "Ergonomic Office Chair (Spinery)",
    price: 4500,
    category: "Furniture",
    condition: "Used",
    description: "Mesh high-back ergonomic office chair with adjustable lumbar support, 3D armrests, and dynamic tilt-lock mechanism. Bought on Pepperfry for ₹12k, selling because office provided a new Herman Miller. Extremely comfortable for long hours.",
    sellerName: "Neha Sharma",
    sellerRating: 4.7,
    sellerWhatsapp: "+919877112233",
    distance: 0.5,
    area: "Koramangala, 5th Block",
    lat: 12.9355,
    lng: 77.6250,
    images: ["https://images.unsplash.com/photo-1580481072645-022f9a6dbf27?w=600&auto=format&fit=crop&q=80"],
    createdAt: "1 day ago",
    verified: false
  },
  {
    id: "item-m3",
    title: "Kindle Paperwhite (10th Gen) - 8GB Wi-Fi",
    price: 5200,
    category: "Electronics",
    condition: "Like New",
    description: "IPX8 waterproof Kindle Paperwhite with 300 PPI glare-free display. Comes with original box, charging cable, and a premium dark blue magnetic smart flip cover. No scratches on screen, battery backup still lasts weeks.",
    sellerName: "Karthik Raja",
    sellerRating: 4.8,
    sellerWhatsapp: "+919866112233",
    distance: 1.2,
    area: "HSR Layout, Sector 3",
    lat: 12.9110,
    lng: 77.6390,
    images: ["https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80"],
    createdAt: "3 hours ago",
    verified: true
  },
  {
    id: "item-m4",
    title: "Solid Sheesham Wood Study Table",
    price: 7800,
    category: "Furniture",
    condition: "Used",
    description: "Spacious study desk with 2 storage drawers and 1 open shelf. Made of pure Sheesham wood with teak finish. Heavy, sturdy, and elegant. Fits easily in a bedroom corner. Dimension: 4ft x 2.2ft.",
    sellerName: "Rohan Das",
    sellerRating: 4.6,
    sellerWhatsapp: "+919855112233",
    distance: 2.1,
    area: "Jayanagar, 4th Block",
    lat: 12.9280,
    lng: 77.5850,
    images: ["https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=600&auto=format&fit=crop&q=80"],
    createdAt: "5 hours ago",
    verified: true
  }
];

export const INITIAL_RENTAL_ITEMS: RentalItem[] = [
  {
    id: "rent-1",
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
    description: "Beautiful independent 1 BHK penthouse on the 4th floor with a massive 300 sqft attached private terrace. North-facing, great ventilation, located just 500m from the Indiranagar Metro Station. Ideal for bachelors or young couples. Water available 24/7."
  },
  {
    id: "rent-2",
    title: "Premium 2 BHK Apartment near Sony Signal",
    type: "rent",
    propertyType: "2 BHK Apartment",
    price: 36000,
    deposit: 150000,
    size: "1200 sqft",
    furnishing: "Fully-furnished",
    availability: "From 1st August",
    amenities: ["Gated Society", "Lift", "Covered Car Parking", "Gym Access", "Swimming Pool", "24/7 Security", "Fridge & TV"],
    area: "Koramangala, 5th Block",
    distance: 1.0,
    lat: 12.9320,
    lng: 77.6240,
    images: ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&auto=format&fit=crop&q=80"],
    ownerName: "Sanjay Swamy",
    ownerWhatsapp: "+919448112244",
    verified: true,
    description: "Luxury 2 BHK flat inside a secure boutique gated society. Tastefully fully furnished with modular kitchen, king-sized beds, sofa set, water purifiers, washing machine, and Smart TV. Extremely quiet lane but minutes from happening pubs and eateries."
  },
  {
    id: "rent-3",
    title: "Single PG Room with Food (Colive)",
    type: "rent",
    propertyType: "PG Room",
    price: 9500,
    deposit: 15000,
    size: "200 sqft",
    furnishing: "Fully-furnished",
    availability: "Immediate",
    amenities: ["Daily Housekeeping", "3 Meals Included", "High-speed Wi-Fi", "Washing Machine", "Geyser", "CCTV Security"],
    area: "HSR Layout, Sector 3",
    distance: 1.5,
    lat: 12.9125,
    lng: 77.6405,
    images: ["https://images.unsplash.com/photo-1554995207-c18c203602cb?w=600&auto=format&fit=crop&q=80"],
    ownerName: "Stanza Living Manager",
    ownerWhatsapp: "+919448112255",
    verified: false,
    description: "Hassle-free, air-conditioned single occupancy PG room managed professionally. Daily morning/night healthy South-Indian and North-Indian meals cooked in-house. Walking distance to major corporate tech parks around Outer Ring Road."
  }
];

export const INITIAL_SERVICE_REQUESTS: ServiceRequest[] = [
  {
    id: "req-1",
    title: "Need plumber to fix kitchen tap leakage & washbasin drain block",
    category: "Repair",
    price: 350,
    location: "Indiranagar, 12th Main",
    distance: 0.3,
    createdAt: "10 mins ago",
    userWhatsapp: "+919900112233",
    userName: "Meera Krishnan",
    status: "open",
    notes: "Kitchen sink faucet is dripping continuously causing high wastage. Also the bathroom washbasin takes 10 mins to drain. Urgent help needed!"
  },
  {
    id: "req-2",
    title: "Full 2BHK flat deep cleaning & balcony scrubbing before moving in",
    category: "Cleaning",
    price: 3200,
    location: "Koramangala, 5th Block",
    distance: 0.7,
    createdAt: "25 mins ago",
    userWhatsapp: "+919900112244",
    userName: "Vipin Nair",
    status: "open",
    notes: "Flat has been locked for 6 months. Lots of dust, pigeon droppings in the balcony. Need vacuuming, window wiping, toilet disinfection. Must bring own cleaning chemicals and equipment."
  },
  {
    id: "req-3",
    title: "Urgent: Pick up blood pressure medicine from Apollo Pharmacy & deliver",
    category: "Errands",
    price: 150,
    location: "Indiranagar, 12th Main",
    distance: 0.2,
    createdAt: "40 mins ago",
    userWhatsapp: "+919900112255",
    userName: "Grandpa Murthy",
    status: "open",
    notes: "I am 82 and cannot walk out in the hot afternoon. Prescriptions will be shared on WhatsApp. Pharmacy is only 600m away on double road. Please help."
  },
  {
    id: "req-4",
    title: "Professional Swedish Back Massage therapist (Female therapist preferred)",
    category: "Wellness",
    price: 1200,
    location: "HSR Layout, Sector 3",
    distance: 1.8,
    createdAt: "1 hour ago",
    userWhatsapp: "+919900112266",
    userName: "Ananya Gowda",
    status: "open",
    notes: "Suffering from severe back spasm due to sitting all week. Need a clean, professional therapy session of 60 mins. I have my own mat."
  }
];
