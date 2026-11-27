import { Garment } from '../types';

export const INITIAL_GARMENTS: Garment[] = [
  {
    id: 'blue-wave-sweater',
    name: 'Wavy Contour Knit Sweater',
    brand: 'Studio Anywear',
    price: 180,
    currency: '$',
    category: 'sweaters',
    color: '#1d4ed8',
    // High-resolution clean garment image
    imageUrl: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=800&q=80',
    prompt: 'Substitute current top with a vibrant royal blue crewneck knit sweater with thick organic white wavy fluid contours across the front, chest, and sleeves. Dense knit wool texture.',
    description: 'Iconic jacquard knit with contrasting white continuous wave contours. Dropped shoulders with relaxed silhouette.',
    tags: ['Featured in Demo', 'Statement', 'Heavy Knit'],
    featured: true
  },
  {
    id: 'charcoal-hoodie',
    name: 'Essential Washed Hoodie',
    brand: 'Studio Anywear',
    price: 145,
    currency: '$',
    category: 'hoodies',
    color: '#27272a',
    imageUrl: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80',
    prompt: 'Substitute current top with an oversized dark charcoal washed heavy fleece hoodie with relaxed dropped shoulders, double-layered hood, and front kangaroo pocket.',
    description: 'Ultra-heavy 480 GSM French terry hoodie in washed charcoal. Vintage fade with modern boxy drape.',
    tags: ['Featured in Demo', 'Streetwear', '480 GSM'],
    featured: true
  },
  {
    id: 'cream-mockneck',
    name: 'Ribbed Mock-Neck Pullover',
    brand: 'Studio Anywear',
    price: 165,
    currency: '$',
    category: 'sweaters',
    color: '#f4f4f5',
    imageUrl: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=800&q=80',
    prompt: 'Substitute current top with a clean ecru cream off-white high-neck ribbed knit sweater, relaxed boxy fit, clean cuffs and minimal hem.',
    description: 'Minimalist mock-neck knitted from soft merino wool blend in an off-white cream tone.',
    tags: ['Featured in Demo', 'Merino Wool', 'Minimalist'],
    featured: true
  },
  {
    id: 'vintage-racing-jacket',
    name: 'Block Leather Moto Jacket',
    brand: 'Atelier Noir',
    price: 320,
    currency: '$',
    category: 'jackets',
    color: '#09090b',
    imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80',
    prompt: 'Substitute current top with a black and cream paneled leather racer jacket with snap collar and zip accents.',
    description: 'Hand-finished supple calfskin moto jacket with cream racing stripes and silver hardware.',
    tags: ['New Arrival', 'Calfskin Leather', 'Outerwear']
  },
  {
    id: 'sage-knit-cardigan',
    name: 'Oversized Mohair Cardigan',
    brand: 'Komorebi Studio',
    price: 195,
    currency: '$',
    category: 'sweaters',
    color: '#84a98c',
    imageUrl: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=800&q=80',
    prompt: 'Substitute current top with an oversized textured sage green brushed mohair cardigan with horn buttons.',
    description: 'Fluffy brushed mohair blend cardigan in muted sage green with subtle marled undertones.',
    tags: ['Mohair', 'Cozy', 'Relaxed']
  },
  {
    id: 'graphic-tee-noir',
    name: 'Sculptural Minimalist Tee',
    brand: 'Studio Anywear',
    price: 75,
    currency: '$',
    category: 'tops',
    color: '#18181b',
    imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
    prompt: 'Substitute current top with a premium heavyweight black t-shirt with subtle minimalist graphic print on center chest.',
    description: 'Custom-milled 280 GSM combed cotton crewneck t-shirt with pre-shrunk boxy cut.',
    tags: ['Heavyweight Tee', 'Everyday']
  }
];
