# عيادتي لطب الأسنان — Dental Clinic Landing Page

A premium, high-converting Arabic RTL landing page for a dental clinic built with **Next.js 16**, **TypeScript**, **Tailwind CSS 4**, and **Framer Motion**.

---

## 🚀 Quick Start (Local Development)

```bash
# 1. Install dependencies
npm install

# 2. Copy env example and fill in your values
cp .env.example .env.local

# 3. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your page.

---

## 📁 Project Structure

```
src/
├── app/
│   ├── layout.tsx         # Root layout — RTL, Cairo font, SEO metadata
│   ├── page.tsx           # Main page — composes all sections
│   └── globals.css        # Global styles
├── components/
│   ├── layout/
│   │   ├── Header.tsx     # Sticky header + mobile menu
│   │   └── Footer.tsx     # Footer with links & contact
│   ├── sections/
│   │   ├── HeroSection.tsx
│   │   ├── ServicesSection.tsx
│   │   ├── WhyChooseUsSection.tsx
│   │   ├── PatientJourneySection.tsx
│   │   ├── DoctorsSection.tsx
│   │   ├── ResultsSection.tsx
│   │   ├── TestimonialsSection.tsx
│   │   ├── LocationSection.tsx
│   │   ├── BookingSection.tsx
│   │   ├── FAQSection.tsx
│   │   └── FinalCTASection.tsx
│   └── shared/
│       ├── SectionHeader.tsx
│       ├── CTAButton.tsx
│       ├── FloatingWhatsAppButton.tsx
│       ├── ServiceCard.tsx
│       ├── DoctorCard.tsx
│       └── TestimonialCard.tsx
├── config/
│   └── clinic.ts          # ⭐ ALL clinic data lives here — edit this!
├── data/
│   ├── services.ts
│   ├── doctors.ts
│   ├── testimonials.ts
│   └── faqs.ts
└── lib/
    └── utils.ts
```

---

## ✏️ How to Customize Clinic Data

**The single source of truth is `src/config/clinic.ts`.**

Edit these fields:

```ts
export const clinicConfig = {
  clinicName: "اسم عيادتك",
  phoneNumber: "+201XXXXXXXXX",
  whatsappNumber: "+201XXXXXXXXX",
  address: "عنوان العيادة",
  googleMapsEmbedUrl: "...",   // from Google Maps -> Share -> Embed
  googleMapsDirectionUrl: "...",
  bookingUrl: "",               // empty = WhatsApp, or set external booking URL
  socialLinks: { facebook: "...", instagram: "...", tiktok: "..." },
  ...
};
```

To add/edit services, doctors, testimonials, or FAQs, update the files in `src/data/`.

---

## 🛠 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build production bundle |
| `npm run start` | Start production server (port from $PORT or 3000) |
| `npm run lint` | Run ESLint |

---

## 🌐 Heroku Deployment

### Prerequisites
- [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) installed
- Git repository initialized

### Steps

```bash
# 1. Login to Heroku
heroku login

# 2. Create a new Heroku app
heroku create your-clinic-name

# 3. Set buildpack to Node.js
heroku buildpacks:set heroku/nodejs

# 4. Set environment variables
heroku config:set NODE_ENV=production
heroku config:set NEXT_PUBLIC_SITE_URL=https://your-clinic-name.herokuapp.com

# 5. Deploy
git add .
git commit -m "Initial deploy"
git push heroku main

# 6. Open app
heroku open

# 7. Check logs if something is wrong
heroku logs --tail
```

### Important Heroku Notes
- The `Procfile` is already configured: `web: npm run start`
- The `start` script uses `$PORT` dynamically (Heroku assigns this)
- Make sure `engines.node` in `package.json` matches your local version

---

## 🌍 Connecting Hostinger Domain to Heroku

### Step 1 — Add custom domain in Heroku

```bash
heroku domains:add www.yourclinic.com
heroku domains:add yourclinic.com
```

Copy the DNS target Heroku gives you (looks like `something.herokudns.com`).

### Step 2 — Configure DNS in Hostinger

1. Log in to Hostinger -> Hosting -> DNS Zone
2. For the www subdomain:
   - Type: CNAME
   - Name: www
   - Value: your-heroku-dns-target.herokudns.com
   - TTL: 3600
3. For the root domain (@), options:
   - Use Cloudflare (free) as DNS provider and set a CNAME for @ with proxy
   - Or use Hostinger redirect: yourclinic.com -> www.yourclinic.com

### Step 3 — Enable SSL

```bash
heroku certs:auto:enable
```

Heroku provisions a free SSL certificate via Let's Encrypt automatically.

### Step 4 — Wait for DNS propagation

DNS changes can take 15 minutes to 48 hours. Check with:

```bash
nslookup www.yourclinic.com
```

---

## 🐙 GitHub Setup

If GitHub CLI is available:

```bash
git init
git add .
git commit -m "feat: initial dental clinic landing page"
gh repo create dental-clinic-landing-page --public --source=. --push
```

Manually:

```bash
git init
git add .
git commit -m "feat: initial dental clinic landing page"
git remote add origin https://github.com/YOUR_USERNAME/dental-clinic-landing-page.git
git branch -M main
git push -u origin main
```

---

## 🔮 Future Features (Pre-structured)

The project is ready for:

- **Online booking system** — set `bookingUrl` in `clinic.ts`
- **Blog/articles** — add `src/app/blog/` route
- **Service detail pages** — add `src/app/services/[slug]/page.tsx`
- **Multi-language (AR/EN)** — use Next.js i18n routing
- **Analytics** — uncomment GA/Pixel env vars in `.env.example`
- **Doctor profile pages** — add `src/app/doctors/[id]/page.tsx`
- **Clinic management integration** — update `bookingUrl` in config
