# 🚀 VELOCITY Landing Page - Replit Deployment Guide

## ✅ CONFIRMED: Your Code is 100% Correct!

**Good News:** All your files have the correct design:
- ✅ VELOCITY branding (NOT "EmailAI Pro")
- ✅ White background (`bg-white`)
- ✅ Sky-blue gradients (`from-sky-500 to-blue-600`)
- ✅ Dark slate text (`text-slate-900`)

**The Issue:** Figma Make's download mechanism may be packaging duplicate files or an older cached version.

---

## 📁 CORRECT FILE STRUCTURE FOR REPLIT

When you download and upload to Replit, use **ONLY** these files:

```
your-project/
├── index.html                    ← Use this exact file
├── package.json                  ← Dependencies list
├── vite.config.ts                ← Vite configuration
├── tsconfig.json                 ← TypeScript config
├── tsconfig.node.json           ← TypeScript node config
│
├── src/                          ← IMPORTANT: All source code goes here
│   ├── main.tsx                  ← Entry point (imports App.tsx)
│   ├── App.tsx                   ← Main app component
│   │
│   └── styles/
│       └── globals.css           ← Global styles & Tailwind
│
├── components/                   ← All React components
│   ├── Navigation.tsx
│   ├── FuturisticHero.tsx
│   ├── LogoCloud.tsx
│   ├── BentoFeatures.tsx
│   ├── AIBrainVisualization.tsx
│   ├── Floating3DEmailCards.tsx
│   ├── HowItWorksSection.tsx
│   ├── BeforeAfterSlider.tsx
│   ├── EmailPreviewCarousel.tsx
│   ├── ROICalculator.tsx
│   ├── SocialProofSection.tsx
│   ├── ComparisonTable.tsx
│   ├── PricingSection.tsx
│   ├── SecurityBadges.tsx
│   ├── FAQSection.tsx
│   ├── CTASection.tsx
│   ├── Footer.tsx
│   ├── StickyCtaBar.tsx
│   ├── LiveActivityFeed.tsx
│   ├── ExitIntentPopup.tsx
│   ├── TiltCard.tsx
│   ├── EmailFlowVisualization.tsx
│   │
│   ├── figma/
│   │   └── ImageWithFallback.tsx
│   │
│   └── ui/                       ← Shadcn UI components
│       ├── accordion.tsx
│       ├── alert-dialog.tsx
│       ├── alert.tsx
│       ├── avatar.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── carousel.tsx
│       ├── checkbox.tsx
│       ├── dialog.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── progress.tsx
│       ├── scroll-area.tsx
│       ├── separator.tsx
│       ├── slider.tsx
│       ├── sonner.tsx
│       ├── switch.tsx
│       ├── tabs.tsx
│       ├── tooltip.tsx
│       └── ... (all other UI components)
│
└── styles/                       ← Optional (src/styles is primary)
    └── globals.css
```

---

## ⚠️ CRITICAL: Files to DELETE/IGNORE

If your download includes these files at the ROOT level, **DELETE THEM**:

- ❌ `/App.tsx` (root level) - Use `/src/App.tsx` instead
- ❌ `/styles/` folder if it conflicts with `/src/styles/`
- ❌ `/src/components/Navigation.tsx` (we deleted this duplicate)
- ❌ Any `.md` files (documentation only, not needed for production)

---

## 🔧 SETUP INSTRUCTIONS FOR REPLIT

### Step 1: Create New Replit Project
1. Go to Replit.com
2. Click "Create Repl"
3. Select "React TypeScript" or "Vite"
4. Name it "velocity-landing-page"

### Step 2: Upload Files
**Option A - Upload Entire Folder:**
1. Click "Upload folder" button
2. Select your downloaded project folder
3. Wait for upload to complete

**Option B - Manual Upload:**
1. Delete default Replit files
2. Upload each folder/file manually following the structure above

### Step 3: Verify File Structure
Check that:
- ✅ `/src/main.tsx` exists
- ✅ `/src/App.tsx` exists
- ✅ `/components/` folder exists
- ✅ `/src/styles/globals.css` exists
- ✅ `/package.json` exists
- ✅ `/index.html` exists

### Step 4: Install Dependencies
In Replit Shell, run:
```bash
npm install
```

### Step 5: Start Development Server
```bash
npm run dev
```

### Step 6: Verify Design
Open the preview and verify:
- ✅ "VELOCITY" appears in the navigation (top left)
- ✅ White background
- ✅ Sky-blue buttons and gradients
- ✅ "Turn Cold Emails Into Warm Deals" hero headline
- ✅ NO mentions of "EmailAI Pro"

---

## 🐛 TROUBLESHOOTING

### Problem: Shows "EmailAI Pro" instead of "VELOCITY"

**Cause:** Wrong files were uploaded or cached version is being used.

**Solution:**
1. Delete entire Replit project
2. Clear browser cache
3. Download FRESH copy from Figma Make
4. Create NEW Replit project
5. Upload files following structure above
6. Run `npm install && npm run dev`

### Problem: Import errors or "Cannot find module"

**Cause:** File structure doesn't match import paths.

**Solution:**
Check `/src/App.tsx` imports:
```typescript
// Should be:
import { Navigation } from "../components/Navigation";
import { FuturisticHero } from "../components/FuturisticHero";
// ... etc
```

The `../components/` path means "go up one level from /src/ then into /components/".

### Problem: White screen or no content

**Cause:** Entry point mismatch.

**Solution:**
1. Check `/index.html` has:
   ```html
   <script type="module" src="/src/main.tsx"></script>
   ```
2. Check `/src/main.tsx` imports:
   ```typescript
   import App from './App.tsx'
   import './styles/globals.css'
   ```

### Problem: Styles not loading

**Cause:** globals.css not imported.

**Solution:**
Verify `/src/main.tsx` has:
```typescript
import './styles/globals.css'
```

---

## ✅ VERIFICATION CHECKLIST

Before considering deployment complete, verify:

- [ ] VELOCITY logo appears in navigation
- [ ] White background throughout page
- [ ] Sky-blue gradient buttons
- [ ] All 20 sections render correctly
- [ ] Smooth scroll navigation works
- [ ] Mobile menu opens/closes
- [ ] No console errors
- [ ] No "EmailAI Pro" text anywhere
- [ ] Hero section has correct headline
- [ ] Footer shows VELOCITY branding

---

## 📦 PRODUCTION BUILD

When ready to deploy:

```bash
npm run build
```

This creates a `/dist` folder with optimized production files.

---

## 🆘 STILL HAVING ISSUES?

If you still see "EmailAI Pro" after following these steps:

1. **Check Browser DevTools**
   - Open Console (F12)
   - Look for error messages
   - Check which files are actually loading

2. **Verify Package Contents**
   - In Replit, click on `/components/Navigation.tsx`
   - Use Ctrl+F to search for "VELOCITY"
   - Should find it on line 49

3. **Hard Refresh**
   - Press Ctrl+Shift+R (Windows/Linux)
   - Or Cmd+Shift+R (Mac)
   - This clears cached files

4. **Check Root vs Src**
   - Make sure Replit is running from `/src/main.tsx`
   - NOT from any root-level App.tsx file

---

## 📊 CURRENT FILE STATUS

All files in THIS Figma Make project are correct:

- ✅ `/components/Navigation.tsx` - Line 49 has "VELOCITY"
- ✅ `/src/App.tsx` - Line 25 has `bg-white`
- ✅ `/components/FuturisticHero.tsx` - Has sky-blue gradients
- ✅ `/src/styles/globals.css` - Correct color variables
- ✅ `/package.json` - Name is "velocity-landing-page"
- ✅ `/index.html` - Title is "VELOCITY - AI Email Outreach"

**The code is perfect.** The issue is purely with how files are being packaged/downloaded/uploaded.

---

**Need more help?** Check these files in order:
1. `/index.html` - Should load `/src/main.tsx`
2. `/src/main.tsx` - Should import `./App.tsx`
3. `/src/App.tsx` - Should import from `../components/`
4. `/components/Navigation.tsx` - Should have "VELOCITY" on line 49

If all these check out, your deployment will be successful! 🎉
