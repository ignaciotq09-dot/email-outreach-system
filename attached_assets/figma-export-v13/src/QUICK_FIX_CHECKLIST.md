# ⚡ QUICK FIX CHECKLIST - If Replit Shows "EmailAI Pro"

## 🚨 EMERGENCY FAST FIX (5 Minutes)

### Step 1: Verify These Files in Replit

Open each file and verify the content:

#### `/components/Navigation.tsx` - Line 49
```tsx
VELOCITY  ← Should say THIS, not "EmailAI Pro"
```

#### `/src/App.tsx` - Line 25  
```tsx
<div className="min-h-screen bg-white overflow-x-hidden">
```

#### `/index.html` - Line 12
```html
<script type="module" src="/src/main.tsx"></script>
```

---

### Step 2: If ANY of Above is Wrong

**DO THIS:**

1. **Delete everything in Replit project**
2. **Download FRESH from Figma Make**
3. **Clear browser cache** (Ctrl+Shift+R)
4. **Upload following this structure:**

```
/index.html                  ← Upload this
/package.json                ← Upload this
/vite.config.ts              ← Upload this
/tsconfig.json               ← Upload this
/src/
  /main.tsx                  ← Upload this
  /App.tsx                   ← Upload this
  /styles/
    /globals.css             ← Upload this
/components/                 ← Upload ENTIRE folder
```

5. **Run:**
```bash
npm install
npm run dev
```

---

### Step 3: If It STILL Shows "EmailAI Pro"

The download is caching. **Manual fix:**

1. In Figma Make, click on `/components/Navigation.tsx`
2. Copy entire file content (Ctrl+A, Ctrl+C)
3. In Replit, create new file `/components/Navigation.tsx`
4. Paste content (Ctrl+V)
5. Repeat for all 20 components

**List of components to copy manually:**
```
/components/Navigation.tsx
/components/FuturisticHero.tsx
/components/LogoCloud.tsx
/components/BentoFeatures.tsx
/components/AIBrainVisualization.tsx
/components/Floating3DEmailCards.tsx
/components/HowItWorksSection.tsx
/components/BeforeAfterSlider.tsx
/components/EmailPreviewCarousel.tsx
/components/ROICalculator.tsx
/components/SocialProofSection.tsx
/components/ComparisonTable.tsx
/components/PricingSection.tsx
/components/SecurityBadges.tsx
/components/FAQSection.tsx
/components/CTASection.tsx
/components/Footer.tsx
/components/StickyCtaBar.tsx
/components/LiveActivityFeed.tsx
/components/ExitIntentPopup.tsx
```

---

## ✅ SUCCESS CHECK

Your deployment is successful when you see:

✅ "VELOCITY" in top-left corner  
✅ White background  
✅ Blue gradient buttons  
✅ "Turn Cold Emails Into Warm Deals" headline  
✅ NO "EmailAI Pro" anywhere  

---

## 🆘 LAST RESORT

If NOTHING works:

1. **Create blank Vite React project in Replit**
2. **Manually copy/paste each file from Figma Make**
3. **Start with:**
   - `/src/main.tsx`
   - `/src/App.tsx`
   - `/src/styles/globals.css`
   - `/components/Navigation.tsx`
4. **Test after each file**
5. **Continue until all 20 components copied**

This is tedious but **GUARANTEED** to work because you're bypassing the download mechanism entirely.

---

## 📞 Need More Help?

Read full guides:
- `/REPLIT_DEPLOYMENT_GUIDE.md` - Detailed setup instructions
- `/DIAGNOSTIC_REPORT_FINAL.md` - Complete technical analysis

**Remember:** The code HERE is correct. The issue is with how files are being packaged/downloaded.
