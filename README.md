# Wave Dental Clinic — Landing Page

A modern, premium dental clinic landing page built with **Next.js 15**, **TypeScript**, **Tailwind CSS**, and **Framer Motion**.

🌐 **Domain:** [wavedentelclinic.com](https://wavedentelclinic.com)

---

## ✨ Features

- **Sticky responsive navbar** with smooth scroll
- **Premium animated hero** section with stats
- **Floating WhatsApp button** for direct chat
- **Services** section (6 dental services)
- **Why Choose Us** section with 6 key differentiators
- **Patient Journey** step-by-step section
- **Doctors** placeholder section
- **Before & After** results placeholder
- **Testimonials** section (6 reviews)
- **Location** section with Google Maps embed
- **Booking CTA** section
- **FAQ** accordion section
- **Footer** with social links and contact info
- **SEO** optimized (metadata, Open Graph, canonical URL)
- **Heroku-ready** (`Procfile`, dynamic `$PORT`)

---

## 🛠 Tech Stack

| Tool | Version |
|------|---------|
| Next.js | 15.5.16 |
| TypeScript | 5.x |
| Tailwind CSS | 3.4.x |
| Framer Motion | 11.x |
| Lucide React | 0.378.x |

---

## 🚀 Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Build for production

```bash
npm run build
npm start
```

### 4. Lint

```bash
npm run lint
```

---

## 📁 Project Structure

```
src/
├── app/
│   ├── layout.tsx        # Root layout with SEO metadata
│   ├── page.tsx          # Main page (assembles all sections)
│   └── globals.css       # Global Tailwind styles
├── components/
│   ├── Navbar.tsx        # Sticky responsive navbar
│   ├── Footer.tsx        # Site footer
│   ├── ui/
│   │   └── WhatsAppButton.tsx  # Floating WhatsApp CTA
│   └── sections/
│       ├── Hero.tsx
│       ├── Services.tsx
│       ├── WhyChooseUs.tsx
│       ├── PatientJourney.tsx
│       ├── Doctors.tsx
│       ├── BeforeAfter.tsx
│       ├── Testimonials.tsx
│       ├── Location.tsx
│       ├── BookingCTA.tsx
│       └── FAQ.tsx
└── config/
    └── clinic.ts         # ⚙️ Central clinic configuration
```

---

## ⚙️ Clinic Configuration

All clinic-specific data lives in **`src/config/clinic.ts`**. Edit this file to update:

- Clinic name & domain
- Phone & WhatsApp number
- Address
- Google Maps embed & directions URL
- Booking system URL
- Social media links
- Working hours
- Email

```bash
# Example: update WhatsApp number
whatsappNumber: "+15551234567",
```

---

## 🌍 Environment Variables

Copy `.env.example` to `.env.local` for local development:

```bash
cp .env.example .env.local
```

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | WhatsApp number with country code |
| `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_URL` | Google Maps iframe embed URL |
| `NEXT_PUBLIC_BOOKING_URL` | External booking system URL |

---

## 🟣 Heroku Deployment

### Prerequisites

- [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) installed
- Heroku account

### Steps

```bash
# 1. Login to Heroku
heroku login

# 2. Create Heroku app
heroku create wave-dental-clinic

# 3. Set Node.js buildpack
heroku buildpacks:set heroku/nodejs

# 4. Set environment variables (if needed)
heroku config:set NODE_ENV=production

# 5. Deploy
git push heroku main

# 6. Open the app
heroku open
```

The `Procfile` is already configured:
```
web: npm start
```

The `package.json` start script uses `$PORT` automatically:
```json
"start": "next start -p $PORT"
```

---

## 🌐 Hostinger Domain Connection (wavedentelclinic.com)

> ⚠️ **Do not make DNS changes automatically.** Follow these manual steps.

### Step 1: Get your Heroku app domain

After deploying to Heroku, add a custom domain:

```bash
heroku domains:add wavedentelclinic.com
heroku domains:add www.wavedentelclinic.com
```

Heroku will give you a DNS target like:
```
sharp-coral-1234abc.herokudns.com
```

### Step 2: Configure DNS in Hostinger

1. Log in to [Hostinger hPanel](https://hpanel.hostinger.com)
2. Go to **Domains → Manage → DNS Zone**
3. Add/update the following records:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| CNAME | `www` | `sharp-coral-1234abc.herokudns.com` | 3600 |
| ALIAS / CNAME | `@` (root) | `sharp-coral-1234abc.herokudns.com` | 3600 |

> **Note:** For the root domain (`@`), Hostinger supports CNAME flattening. If not available, use an **A record** pointing to Heroku's IP (though CNAME to Heroku's DNS target is preferred).

### Step 3: Enable SSL on Heroku

```bash
heroku certs:auto:enable
```

Heroku automatically provisions a free SSL certificate via Let's Encrypt once DNS propagates (may take up to 48 hours).

### Step 4: Verify

```bash
heroku domains
```

Once DNS propagates, your site will be live at:
- https://wavedentelclinic.com
- https://www.wavedentelclinic.com

---

## 📝 Where to Edit Clinic Data

| What to change | Where |
|----------------|-------|
| Phone, WhatsApp, address | `src/config/clinic.ts` |
| Doctor names & photos | `src/components/sections/Doctors.tsx` |
| Before/after photos | `src/components/sections/BeforeAfter.tsx` |
| Services list | `src/components/sections/Services.tsx` |
| Testimonials | `src/components/sections/Testimonials.tsx` |
| FAQ answers | `src/components/sections/FAQ.tsx` |
| SEO metadata | `src/app/layout.tsx` |
| Brand colors | `tailwind.config.ts` |

---

## 📄 License

Private project for Wave Dental Clinic. All rights reserved.