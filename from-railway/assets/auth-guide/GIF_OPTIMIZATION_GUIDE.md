# OAuth Consent Screen GIF Optimization Guide

## Recommended Sizes

### Option 1: High Quality (Recommended)
**Size:** `1200px × 675px`
- **Aspect Ratio:** 16:9 (matches your original video)
- **File Size Target:** 2-4 MB
- **Best for:** Desktop and tablet viewing
- **Quality:** Excellent detail, easy to read text and checkboxes

### Option 2: Balanced (Best Overall)
**Size:** `1000px × 562px`
- **Aspect Ratio:** 16:9
- **File Size Target:** 1.5-3 MB
- **Best for:** All devices
- **Quality:** Good detail, fast loading

### Option 3: Optimized (Fast Loading)
**Size:** `800px × 450px`
- **Aspect Ratio:** 16:9
- **File Size Target:** 1-2 MB
- **Best for:** Mobile-first, slower connections
- **Quality:** Good enough to see checkboxes clearly

## Your Original Video
- **Original:** 1816px × 1022px
- **Aspect Ratio:** ~16:9 (1.78:1)
- **Recommended Export:** 1200px × 675px (maintains aspect ratio)

## How to Export from Your Video

### Using Screen Recording Tools:

#### macOS QuickTime:
1. Record your screen
2. Export as: **Movie**
3. Use a tool like **GIF Brewery** or **Gifski** to convert
4. Set dimensions: **1200 × 675**
5. Optimize for web

#### Online Tools:
- **CloudConvert** (https://cloudconvert.com)
- **EZGIF** (https://ezgif.com)
- **GIFMaker** (https://gifmaker.me)

#### Desktop Tools:
- **Gifski** (macOS) - Best quality
- **GIF Brewery** (macOS)
- **ScreenToGif** (Windows)

### Export Settings:

**Recommended Settings:**
- **Dimensions:** 1200 × 675 (or 1000 × 562)
- **Frame Rate:** 10-15 fps (reduces file size)
- **Colors:** 256 colors (standard GIF)
- **Dithering:** Floyd-Steinberg (better quality)
- **Loop:** Infinite
- **Duration:** Keep it short (5-15 seconds)

## File Size Optimization

### Target File Sizes:
- **Ideal:** Under 2 MB
- **Acceptable:** 2-4 MB
- **Maximum:** 5 MB (will slow down page load)

### Tips to Reduce File Size:
1. **Reduce frame rate:** 10-15 fps instead of 30 fps
2. **Shorter duration:** 5-15 seconds is usually enough
3. **Reduce colors:** 128-256 colors instead of full color
4. **Crop unnecessary parts:** Only show the consent screen area
5. **Optimize after creation:** Use tools like **GIFsicle** or **ImageOptim**

## Responsive Design

The page is already set up for responsive viewing:

```tsx
<img 
  src="/auth-guide/oauth-consent-screen.gif" 
  alt="Google OAuth consent screen with checkboxes highlighted"
  className="max-w-full h-auto rounded-lg shadow-lg mx-auto"
/>
```

The `max-w-full h-auto` classes ensure:
- ✅ Desktop: Shows at full size (1200px)
- ✅ Tablet: Scales down proportionally
- ✅ Mobile: Scales to fit screen width
- ✅ Maintains aspect ratio

## Testing on Different Devices

After creating the GIF, test on:
- **Desktop:** 1920px+ width (should look crisp)
- **Tablet:** 768px-1024px width (should scale nicely)
- **Mobile:** 375px-414px width (should be readable)

## Recommended Workflow

1. **Record:** Screen record the OAuth flow (1816×1022)
2. **Crop:** Crop to just the consent screen area
3. **Resize:** Export at 1200×675 (or 1000×562)
4. **Optimize:** Reduce frame rate to 10-15 fps
5. **Compress:** Use GIF optimization tool
6. **Test:** Check file size (should be < 3 MB)
7. **Upload:** Place in `public/auth-guide/oauth-consent-screen.gif`

## Tools for Optimization

### Online:
- **EZGIF Optimize:** https://ezgif.com/optimize
- **CloudConvert:** https://cloudconvert.com
- **TinyPNG:** https://tinypng.com (also works for GIFs)

### Desktop:
- **GIFsicle:** Command-line tool (best compression)
- **ImageOptim:** macOS app
- **Gifski:** High-quality GIF encoder

## Final Recommendation

**Export at: 1200px × 675px**
- Maintains your 16:9 aspect ratio
- Good quality for desktop viewing
- Scales well on mobile
- Reasonable file size (2-3 MB with optimization)

**If file size is still too large:**
- Try 1000px × 562px
- Reduce to 10 fps
- Shorten duration to 10 seconds
- Use GIFsicle for final compression
