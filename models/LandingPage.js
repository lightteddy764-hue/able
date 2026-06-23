const mongoose = require('mongoose');

const landingPageSchema = new mongoose.Schema({
    key: { type: String, default: 'singleton', unique: true },

    // Hero Section
    heroBadge: { type: String, default: '✨ Trusted by 50,000+ users worldwide' },
    heroHeadline: { type: String, default: 'Transform Your Mental Wellness Journey With Expert Support & AI Guidance' },
    heroSubtitle: { type: String, default: 'Connect with licensed therapists, wellness coaches, and a supportive community designed to help you build a healthier and happier life.' },
    heroCTAs: [{
        text: { type: String },
        link: { type: String },
        style: { type: String, enum: ['primary', 'ghost'], default: 'primary' }
    }],
    heroTrustItems: [{ type: String }],

    // Features
    features: [{
        icon: { type: String },
        title: { type: String },
        description: { type: String }
    }],

    // Platform Showcase
    platformShowcase: [{
        tabId: { type: String },
        tabLabel: { type: String },
        badge: { type: String },
        title: { type: String },
        description: { type: String },
        features: [{ type: String }],
        ctaText: { type: String },
        ctaLink: { type: String },
        mockupHtml: { type: String }
    }],

    // How It Works
    howItWorks: [{
        title: { type: String },
        description: { type: String }
    }],

    // Stats
    stats: [{
        number: { type: String },
        description: { type: String }
    }],

    // Therapists
    therapists: [{
        name: { type: String },
        role: { type: String },
        experience: { type: String },
        color: { type: String, default: '#E67E22' }
    }],

    // Testimonials
    testimonials: [{
        stars: { type: Number, default: 5 },
        quote: { type: String },
        authorName: { type: String },
        authorRole: { type: String }
    }],

    // Pricing
    pricing: [{
        name: { type: String },
        price: { type: String },
        features: [{ type: String }],
        ctaText: { type: String },
        ctaLink: { type: String },
        isPopular: { type: Boolean, default: false }
    }],

    // FAQ
    faqItems: [{
        question: { type: String },
        answer: { type: String }
    }],

    // Footer
    footerBrandDescription: { type: String, default: 'A Better Life Enabled — your companion for mental wellness, personal growth, and a healthier life.' },
    footerProductLinks: [{
        label: { type: String },
        href: { type: String }
    }],
    footerCompanyLinks: [{
        label: { type: String },
        href: { type: String }
    }],
    footerLegalLinks: [{
        label: { type: String },
        href: { type: String }
    }],

    // Social Proof
    socialProofRating: { type: String, default: '4.9/5 based on 12,000+ reviews' },
    socialProofUserCount: { type: String, default: '+50,000 users' },
    socialProofLogos: [{ type: String }]

}, { timestamps: true });

module.exports = mongoose.model('LandingPage', landingPageSchema);
