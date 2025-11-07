# Branding Guide - CDN XData

This document describes the branding implementation for **CDN XData** by **Cognition Labs EU**.

## Brand Identity

### Primary Brand
- **Service Name**: CDN XData
- **Domain**: cdn.xdata.si
- **Company**: Cognition Labs EU
- **Company Domain**: cognitiolabs.eu
- **Color Scheme**: Blue gradient (#2563eb → #1d4ed8)

### Brand Elements

#### Logo/Title
- **Text**: "CDN XData"
- **Style**: Blue gradient text effect
- **CSS**:
  ```css
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  ```

#### Company Attribution
- **Text**: "Powered by Cognition Labs EU" (Login page)
- **Text**: "Cognition Labs EU" (Dashboard header)
- **Link**: https://cognitiolabs.eu

## Branded Elements

### 1. Login Page (`frontend/src/pages/Login.tsx`)
```tsx
<h1>CDN XData</h1>
<a href="https://cognitiolabs.eu" target="_blank" rel="noopener noreferrer">
  Powered by Cognition Labs EU
</a>
```

### 2. Dashboard Header (`frontend/src/pages/Dashboard.tsx`)
```tsx
<div className="dashboard-brand">
  <h1>CDN XData</h1>
  <a href="https://cognitiolabs.eu" target="_blank" rel="noopener noreferrer">
    Cognition Labs EU
  </a>
</div>
```

### 3. Footer (`frontend/src/pages/Dashboard.tsx`)
```tsx
<footer className="dashboard-footer">
  <p>&copy; {new Date().getFullYear()} Cognition Labs EU. All rights reserved.</p>
  <a href="https://cognitiolabs.eu">cognitiolabs.eu</a>
  <a href="https://cdn.xdata.si">cdn.xdata.si</a>
</footer>
```

### 4. HTML Meta Tags (`frontend/index.html`)
```html
<meta name="description" content="CDN XData - Professional image hosting by Cognition Labs EU" />
<meta name="author" content="Cognition Labs EU" />
<link rel="canonical" href="https://cdn.xdata.si" />
<title>CDN XData - Cognition Labs EU</title>
```

### 5. Caddy Configuration (`docker/Caddyfile`)
```
email admin@cognitiolabs.eu
cdn.xdata.si { ... }
```

### 6. Environment Configuration (`.env.example`)
```env
BASE_URL=https://cdn.xdata.si
```

## Color Palette

### Primary Colors
- **Primary Blue**: `#2563eb` (rgb(37, 99, 235))
- **Primary Blue Hover**: `#1d4ed8` (rgb(29, 78, 216))

### UI Colors
- **Background**: `#ffffff` (white)
- **Secondary Background**: `#f5f5f5` (light gray)
- **Border**: `#e0e0e0` (gray)
- **Text**: `#1a1a1a` (dark gray)
- **Text Secondary**: `#666666` (medium gray)

### Semantic Colors
- **Success**: `#16a34a` (green)
- **Danger**: `#dc2626` (red)
- **Danger Hover**: `#b91c1c` (dark red)

## Typography

### Font Stack
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto',
             'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans',
             'Helvetica Neue', sans-serif;
```

### Font Sizes
- **H1**: 2rem (32px) on login, 1.5rem (24px) on dashboard
- **Brand Link**: 0.875rem (14px)
- **Body**: 1rem (16px)
- **Small**: 0.875rem (14px)

## Logo Guidelines

Currently text-only branding. If adding a logo image:

### Specifications
- **Format**: SVG (preferred) or PNG with transparency
- **Size**: 120px × 40px (suggested)
- **Location**: `frontend/public/logo.svg`

### Implementation
```tsx
<div className="login-logo">
  <img src="/logo.svg" alt="CDN XData" />
  <a href="https://cognitiolabs.eu">Cognition Labs EU</a>
</div>
```

## Links

All external links should:
- Open in new tab: `target="_blank"`
- Include security: `rel="noopener noreferrer"`
- Be underlined on hover

### Required Links
1. **Company Website**: https://cognitiolabs.eu
2. **Service URL**: https://cdn.xdata.si
3. **Support Email**: admin@cognitiolabs.eu (in documentation)

## Accessibility

Brand elements must be accessible:
- ✅ Gradient text has sufficient contrast
- ✅ Links are keyboard navigable
- ✅ Focus styles visible
- ✅ ARIA labels where needed
- ✅ Alternative text for any images

## Brand Voice

### Tone
- Professional
- Technical but approachable
- Concise and clear

### Example Copy
- ✅ "Professional image hosting and delivery"
- ✅ "Sign in to manage your files"
- ✅ "Powered by Cognition Labs EU"
- ❌ "The best CDN ever!" (too casual/promotional)
- ❌ "Enterprise-grade solution" (too corporate)

## File Locations

All branded files:
```
frontend/
├── index.html                    # Meta tags, title
├── src/
│   ├── pages/
│   │   ├── Login.tsx            # Login branding
│   │   ├── Login.css            # Login styles
│   │   ├── Dashboard.tsx        # Header & footer
│   │   └── Dashboard.css        # Dashboard styles
│   └── index.css                # Global colors

docker/
└── Caddyfile                    # Domain, email

.env.example                     # BASE_URL

docs/
├── README.md                    # Documentation
├── QUICKSTART.md                # Quick start
├── DEPLOYMENT.md                # Deployment guide
└── BRANDING.md                  # This file
```

## Maintenance

When updating branding:
1. Update this document first
2. Update all locations listed above
3. Test on both login and dashboard pages
4. Rebuild frontend: `npm run build`
5. Commit with message: "Update branding"

## Contact

For branding questions:
- Email: admin@cognitiolabs.eu
- Website: https://cognitiolabs.eu
