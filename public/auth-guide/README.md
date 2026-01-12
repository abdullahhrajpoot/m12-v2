# OAuth Consent Screen Visual Guide

This directory contains visual guides to help users understand which checkboxes to select during Google OAuth.

## Required Assets

### Primary Asset (Recommended)
- **`oauth-consent-screen.gif`** - Animated GIF showing:
  - Google OAuth consent screen
  - Highlighted/annotated checkboxes for required permissions
  - Step-by-step visual guide

### Alternative Assets (If GIF not available)
- **`oauth-step1.png`** - Initial consent screen
- **`oauth-step2.png`** - Screen with checkboxes highlighted
- **`oauth-step3.png`** - All checkboxes checked

## How to Create the Visual Guide

### Option 1: Screen Recording (Recommended)
1. Record your screen while going through the OAuth flow
2. Use a tool like:
   - **macOS**: QuickTime Player → File → New Screen Recording
   - **Windows**: Xbox Game Bar (Win + G) or OBS Studio
   - **Online**: Loom, ScreenToGif
3. Highlight/annotate the required checkboxes:
   - Gmail (Read)
   - Gmail (Labels)
   - Calendar
   - Tasks
4. Export as animated GIF (keep file size reasonable, < 5MB)

### Option 2: Static Images with Annotations
1. Take screenshots of the OAuth consent screen
2. Use image editing software to:
   - Add numbered annotations
   - Highlight checkboxes with colored boxes/arrows
   - Add text labels
3. Save as PNG files

### Option 3: Use a Design Tool
- Figma, Canva, or similar tools
- Create a mockup of the OAuth screen
- Add visual indicators (arrows, highlights, numbers)
- Export as GIF or PNG

## Current Status

**Placeholder**: The page includes a fallback message if the visual guide is not found.

**Next Steps**:
1. Create or obtain the visual guide asset
2. Place it in this directory as `oauth-consent-screen.gif` (or update the page to use static images)
3. Test that it displays correctly on the missing-permissions page

## File Naming

- Use lowercase with hyphens: `oauth-consent-screen.gif`
- Keep file size reasonable for web (aim for < 5MB for GIFs)
- Optimize images for web (use tools like ImageOptim, TinyPNG, etc.)
