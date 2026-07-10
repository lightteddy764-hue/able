/**
 * Seed marketplace listings with sample vendors.
 * Usage: node seed-marketplace.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const MarketplaceListing = require('./models/MarketplaceListing');

async function seed() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    await MarketplaceListing.deleteMany({});
    console.log('Cleared existing marketplace listings');

    const listings = [
        {
            businessName: 'Serenity Day Spa',
            listingType: 'spa',
            description: 'A luxury wellness spa offering deep tissue massage, aromatherapy, hot stone therapy, and complete relaxation packages. Our trained therapists create a serene environment for total mind-body rejuvenation.',
            services: ['Deep Tissue Massage', 'Aromatherapy', 'Hot Stone Therapy', 'Facial Treatments', 'Couples Spa'],
            location: { address: '42 Lotus Lane, Hauz Khas', city: 'New Delhi', state: 'Delhi', country: 'India', pincode: '110016' },
            contact: { phone: '+91 98765 11111', email: 'hello@serenityspa.in', website: 'https://serenityspa.in', whatsapp: '+919876511111' },
            images: ['https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&h=500&fit=crop', 'https://images.unsplash.com/photo-1540555700478-4be289fbec6e?w=800&h=500&fit=crop'],
            openingHours: [
                { day: 'Monday', open: '10:00', close: '20:00' }, { day: 'Tuesday', open: '10:00', close: '20:00' },
                { day: 'Wednesday', open: '10:00', close: '20:00' }, { day: 'Thursday', open: '10:00', close: '20:00' },
                { day: 'Friday', open: '10:00', close: '21:00' }, { day: 'Saturday', open: '09:00', close: '21:00' },
                { day: 'Sunday', open: '09:00', close: '18:00' }
            ],
            priceRange: 'premium',
            tags: ['luxury', 'relaxation', 'couples', 'gifting'],
            submittedByType: 'vendor',
            status: 'approved', isFeatured: true, rating: 4.8, reviewCount: 124, views: 890
        },
        {
            businessName: 'MindFirst Therapy Center',
            listingType: 'mental_health_center',
            description: 'Professional mental health support with licensed clinical psychologists and psychiatrists. We offer CBT, DBT, trauma therapy, and medication management in a confidential, judgment-free setting.',
            services: ['CBT Therapy', 'DBT Sessions', 'Trauma Counseling', 'Psychiatric Consultation', 'Group Therapy', 'Online Sessions'],
            location: { address: '8th Floor, Wellness Tower, MG Road', city: 'Bangalore', state: 'Karnataka', country: 'India', pincode: '560001' },
            contact: { phone: '+91 98765 22222', email: 'care@mindfirst.in', website: 'https://mindfirst.in', whatsapp: '+919876522222' },
            images: ['https://images.unsplash.com/photo-1573497620053-ea5300f94f21?w=800&h=500&fit=crop', 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&h=500&fit=crop'],
            openingHours: [
                { day: 'Monday', open: '09:00', close: '19:00' }, { day: 'Tuesday', open: '09:00', close: '19:00' },
                { day: 'Wednesday', open: '09:00', close: '19:00' }, { day: 'Thursday', open: '09:00', close: '19:00' },
                { day: 'Friday', open: '09:00', close: '17:00' }, { day: 'Saturday', open: '10:00', close: '14:00' },
                { day: 'Sunday', isClosed: true }
            ],
            priceRange: 'medium',
            tags: ['licensed', 'confidential', 'online-available', 'insurance-accepted'],
            submittedByType: 'vendor',
            status: 'approved', isFeatured: true, rating: 4.9, reviewCount: 231, views: 1540
        },
        {
            businessName: 'Yoga Shala Studio',
            listingType: 'yoga_studio',
            description: 'Traditional Hatha and Vinyasa yoga classes for all levels. Morning batches, evening flows, prenatal yoga, and weekend workshops. Small groups for personalized attention.',
            services: ['Hatha Yoga', 'Vinyasa Flow', 'Prenatal Yoga', 'Kids Yoga', 'Weekend Workshops', 'Private Sessions'],
            location: { address: '12 Green Park Main', city: 'New Delhi', state: 'Delhi', country: 'India', pincode: '110016' },
            contact: { phone: '+91 98765 33333', email: 'namaste@yogashala.co', website: 'https://yogashala.co', whatsapp: '+919876533333' },
            images: ['https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800&h=500&fit=crop', 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=500&fit=crop'],
            openingHours: [
                { day: 'Monday', open: '06:00', close: '20:00' }, { day: 'Tuesday', open: '06:00', close: '20:00' },
                { day: 'Wednesday', open: '06:00', close: '20:00' }, { day: 'Thursday', open: '06:00', close: '20:00' },
                { day: 'Friday', open: '06:00', close: '20:00' }, { day: 'Saturday', open: '07:00', close: '18:00' },
                { day: 'Sunday', open: '07:00', close: '12:00' }
            ],
            priceRange: 'low',
            tags: ['beginner-friendly', 'morning-batches', 'women-only-batch', 'trial-class'],
            submittedByType: 'vendor',
            status: 'approved', isFeatured: false, rating: 4.7, reviewCount: 89, views: 620
        },
        {
            businessName: 'Inner Peace Meditation Center',
            listingType: 'meditation_center',
            description: 'Guided meditation sessions, mindfulness courses, and silent retreats. Learn Vipassana, Transcendental Meditation, and breath-based practices in a calm, dedicated space.',
            services: ['Guided Meditation', 'Vipassana Introduction', 'Mindfulness Course', 'Sound Healing', 'Silent Retreats', 'Corporate Sessions'],
            location: { address: '5 Peaceful Avenue, Koramangala', city: 'Bangalore', state: 'Karnataka', country: 'India', pincode: '560034' },
            contact: { phone: '+91 98765 44444', email: 'peace@innerpeace.org', website: 'https://innerpeace.org', whatsapp: '+919876544444' },
            images: ['https://images.unsplash.com/photo-1508672019048-805c876b67e2?w=800&h=500&fit=crop', 'https://images.unsplash.com/photo-1528319725582-ddc096101511?w=800&h=500&fit=crop'],
            openingHours: [
                { day: 'Monday', open: '06:00', close: '21:00' }, { day: 'Tuesday', open: '06:00', close: '21:00' },
                { day: 'Wednesday', open: '06:00', close: '21:00' }, { day: 'Thursday', open: '06:00', close: '21:00' },
                { day: 'Friday', open: '06:00', close: '21:00' }, { day: 'Saturday', open: '06:00', close: '21:00' },
                { day: 'Sunday', open: '06:00', close: '21:00' }
            ],
            priceRange: 'low',
            tags: ['beginners-welcome', 'retreats', 'corporate', 'sound-healing'],
            submittedByType: 'vendor',
            status: 'approved', isFeatured: false, rating: 4.6, reviewCount: 67, views: 430
        },
        {
            businessName: 'FitMind Gym & Wellness',
            listingType: 'fitness_wellness',
            description: 'A holistic fitness center combining strength training, cardio, and mental wellness. Personal trainers, group classes, sauna, and a dedicated recovery zone with stretching and foam rolling.',
            services: ['Personal Training', 'Group HIIT', 'Strength Training', 'Recovery Zone', 'Sauna', 'Nutrition Planning'],
            location: { address: '88 Ring Road, Nehru Place', city: 'New Delhi', state: 'Delhi', country: 'India', pincode: '110019' },
            contact: { phone: '+91 98765 55555', email: 'join@fitmind.fit', website: 'https://fitmind.fit', whatsapp: '+919876555555' },
            images: ['https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=500&fit=crop', 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&h=500&fit=crop'],
            openingHours: [
                { day: 'Monday', open: '05:30', close: '22:00' }, { day: 'Tuesday', open: '05:30', close: '22:00' },
                { day: 'Wednesday', open: '05:30', close: '22:00' }, { day: 'Thursday', open: '05:30', close: '22:00' },
                { day: 'Friday', open: '05:30', close: '22:00' }, { day: 'Saturday', open: '06:00', close: '20:00' },
                { day: 'Sunday', open: '07:00', close: '14:00' }
            ],
            priceRange: 'medium',
            tags: ['24-7-access', 'personal-trainer', 'women-section', 'student-discount'],
            submittedByType: 'vendor',
            status: 'approved', isFeatured: false, rating: 4.5, reviewCount: 156, views: 980
        },
        {
            businessName: 'NutriGreen Organic Store',
            listingType: 'nutrition_store',
            description: 'Certified organic foods, supplements, superfoods, and plant-based nutrition. We stock brain-health supplements, adaptogenic herbs, gut-friendly probiotics, and freshly cold-pressed juices.',
            services: ['Organic Groceries', 'Brain Supplements', 'Adaptogens', 'Cold-Pressed Juices', 'Meal Planning Kits', 'Free Nutrition Consult'],
            location: { address: '3 Market Square, Indiranagar', city: 'Bangalore', state: 'Karnataka', country: 'India', pincode: '560038' },
            contact: { phone: '+91 98765 66666', email: 'shop@nutrigreen.in', website: 'https://nutrigreen.in', whatsapp: '+919876566666' },
            images: ['https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&h=500&fit=crop', 'https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=800&h=500&fit=crop'],
            openingHours: [
                { day: 'Monday', open: '08:00', close: '21:00' }, { day: 'Tuesday', open: '08:00', close: '21:00' },
                { day: 'Wednesday', open: '08:00', close: '21:00' }, { day: 'Thursday', open: '08:00', close: '21:00' },
                { day: 'Friday', open: '08:00', close: '21:00' }, { day: 'Saturday', open: '08:00', close: '22:00' },
                { day: 'Sunday', open: '09:00', close: '18:00' }
            ],
            priceRange: 'medium',
            tags: ['organic', 'vegan-friendly', 'supplements', 'delivery-available'],
            submittedByType: 'vendor',
            status: 'approved', isFeatured: true, rating: 4.4, reviewCount: 78, views: 540
        },
        {
            businessName: 'Dr. Priya Wellness Clinic',
            listingType: 'therapy_clinic',
            description: 'A private therapy clinic specializing in anxiety disorders, depression, OCD, and relationship counseling. Licensed clinical psychologist with 15 years of experience. Both in-person and online sessions available.',
            services: ['Anxiety Treatment', 'Depression Therapy', 'OCD Management', 'Couples Counseling', 'Online Therapy', 'Psychological Assessment'],
            location: { address: 'Suite 204, Lotus Medical Complex', city: 'Mumbai', state: 'Maharashtra', country: 'India', pincode: '400053' },
            contact: { phone: '+91 98765 77777', email: 'dr.priya@wellnessclinic.in', website: 'https://drpriyawellness.in', whatsapp: '+919876577777' },
            images: ['https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=800&h=500&fit=crop'],
            openingHours: [
                { day: 'Monday', open: '10:00', close: '18:00' }, { day: 'Tuesday', open: '10:00', close: '18:00' },
                { day: 'Wednesday', open: '10:00', close: '18:00' }, { day: 'Thursday', open: '10:00', close: '18:00' },
                { day: 'Friday', open: '10:00', close: '16:00' }, { day: 'Saturday', open: '11:00', close: '14:00' },
                { day: 'Sunday', isClosed: true }
            ],
            priceRange: 'premium',
            tags: ['licensed', 'online-available', 'women-specialist', 'RCI-registered'],
            submittedByType: 'professional',
            isProfessionalLinked: false,
            licenseNumber: 'RCI/PSY/2011/4521',
            qualification: 'M.Phil Clinical Psychology, PhD',
            professionalAssociation: 'Indian Association of Clinical Psychologists',
            status: 'approved', isFeatured: false, rating: 4.9, reviewCount: 312, views: 2100
        },
        {
            businessName: 'ZenWare Wellness Products',
            listingType: 'wellness_product_store',
            description: 'Curated wellness products including weighted blankets, aromatherapy diffusers, journaling kits, meditation cushions, sleep masks, and self-care gift boxes. Online store with same-day delivery in select cities.',
            services: ['Weighted Blankets', 'Aromatherapy Sets', 'Journaling Kits', 'Meditation Cushions', 'Gift Boxes', 'Corporate Wellness Kits'],
            location: { address: 'Online Store (All India Delivery)', city: 'Pune', state: 'Maharashtra', country: 'India', pincode: '411001' },
            contact: { phone: '+91 98765 88888', email: 'shop@zenware.in', website: 'https://zenware.in', whatsapp: '+919876588888' },
            images: ['https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&h=500&fit=crop', 'https://images.unsplash.com/photo-1602928298849-325cec8771c0?w=800&h=500&fit=crop'],
            openingHours: [
                { day: 'Monday', open: '09:00', close: '21:00' }, { day: 'Tuesday', open: '09:00', close: '21:00' },
                { day: 'Wednesday', open: '09:00', close: '21:00' }, { day: 'Thursday', open: '09:00', close: '21:00' },
                { day: 'Friday', open: '09:00', close: '21:00' }, { day: 'Saturday', open: '10:00', close: '20:00' },
                { day: 'Sunday', open: '10:00', close: '18:00' }
            ],
            priceRange: 'medium',
            tags: ['online-store', 'same-day-delivery', 'gifting', 'corporate', 'eco-friendly'],
            submittedByType: 'vendor',
            status: 'approved', isFeatured: false, rating: 4.3, reviewCount: 45, views: 320
        }
    ];

    await MarketplaceListing.insertMany(listings);
    console.log(`✅ Seeded ${listings.length} marketplace listings (all approved)`);
    process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
