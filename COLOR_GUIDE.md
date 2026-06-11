# ABLE Color & Design Guide

## 🎨 Color Palette

### Primary Colors
- **Orange**: `#DE7425` - Main brand color
- **Light Orange**: `#F59E52` - Secondary accents
- **Deep Orange**: `#C85A11` - Hover states

### Background Colors
- **Dark Gray**: `#1a1a1a` - Hero/CTA gradient start
- **Medium Gray**: `#2d2d2d` - Hero/CTA gradient middle
- **Warm White**: `#FFF8F3` - Section backgrounds
- **Pure White**: `#FFFFFF` - Cards and content

### Text Colors
- **Dark Text**: `#333333` - Primary text
- **Light Text**: `#666666` - Secondary text
- **White Text**: `#FFFFFF` - On dark backgrounds

## 🎭 Section Designs

### Hero Section
```css
Background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #DE7425 100%)
Overlay: Radial gradients with orange glow
Text: White with shadows
Buttons: Orange primary, White outline with glassmorphism
```

### Features Section
```css
Background: #FFFFFF
Cards: White with orange accents
Icons: Orange gradient backgrounds
Hover: Orange border, lift effect
```

### Benefits Section
```css
Background: #FFF8F3 (warm white)
Cards: White with orange numbers
Chart: Orange progress indicator
```

### CTA Section
```css
Background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #DE7425 100%)
Same as Hero for consistency
Decorative: Floating orange glows
Buttons: Orange with pulse animation, White outline
```

### Footer
```css
Background: #333333 (dark gray)
Text: White with reduced opacity
Links: White with orange hover
```

## 🖼️ Logo Specifications

### SVG Logo
- **File**: `public/images/logo.svg`
- **Design**: Stylized italic "i" shape
- **Color**: #DE7425 (orange)
- **Dimensions**: 100x140 viewBox
- **Usage**: 35x50px in header

### Logo Components
1. **Circle** (top): Represents care/attention
2. **Curved Path** (body): Represents flow/journey
3. **Style**: Italic/dynamic to show movement

## 🎯 Design Principles

### 1. Contrast
- Dark backgrounds (#1a1a1a) with white text
- Orange accents pop against dark/light backgrounds
- Shadows for depth and readability

### 2. Consistency
- Hero and CTA use same gradient
- Orange used consistently for CTAs and accents
- White cards on colored backgrounds

### 3. Visual Hierarchy
- Large headings with bold weights
- Orange draws attention to important elements
- Gradients guide eye flow

### 4. Modern Effects
- **Glassmorphism**: Frosted glass effect on cards
- **Shadows**: Depth and elevation
- **Blur**: Soft decorative elements
- **Animations**: Subtle movement and pulse

## 📱 Responsive Considerations

### Desktop (1200px+)
- Full gradient effects
- Large logo (35x50px)
- Side-by-side layouts

### Tablet (768-1199px)
- Maintained gradients
- Adjusted spacing
- Stacked layouts

### Mobile (<768px)
- Smaller logo (28x40px)
- Single column layouts
- Simplified animations
- Touch-friendly buttons

## ✨ Animation Guidelines

### Subtle Animations
- Float: 3-8s duration
- Pulse: 2-3s duration
- Fade-in: 0.8-1s duration
- Hover: 0.3s transition

### Purpose
- Guide attention
- Show interactivity
- Add polish
- Never distract

## 🔧 Implementation Notes

### Gradients
```css
/* Hero/CTA Gradient */
background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #DE7425 100%);

/* Radial Overlays */
background: radial-gradient(circle at 20% 50%, rgba(222, 116, 37, 0.2) 0%, transparent 50%);
```

### Glassmorphism
```css
background: rgba(255, 255, 255, 0.95);
backdrop-filter: blur(10px);
border: 1px solid rgba(222, 116, 37, 0.1);
```

### Shadows
```css
/* Standard */
box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

/* Elevated */
box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);

/* Orange Glow */
box-shadow: 0 4px 20px rgba(222, 116, 37, 0.6);
```

---
**Brand**: ABLE - A Better Life Enabled
**Last Updated**: May 27, 2026
