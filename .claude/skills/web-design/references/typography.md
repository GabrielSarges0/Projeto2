# Typography: agent rules (distilled from 16 Figma "Design basics" articles)

Use this file to pick, pair and set type for web (next/font, Tailwind or CSS tokens, WCAG 2.2 AA in light and dark). `[slug]` = source. ⚠ = conflicts with WCAG 2.2 AA or web practice. The articles treat their numbers as starting points [typography-in-design].

## 1. Anatomy that drives choices
- For UI and body text, pick a tall x-height (lowercase height) and open counters/apertures (inner spaces); these stay legible at small sizes [typography-anatomy][minimalist-fonts].
- Use high stroke contrast and hairline serifs (Didot, Bodoni Moda, Playfair Display, Cormorant) only at large sizes [best-serif-fonts][minimalist-fonts].
- When mixing fonts, align baseline, cap height and descender length. Match or deliberately contrast x-height, serif style and terminals [typography-anatomy].
- Use heavy stems and high contrast for emphasis only; overuse hurts legibility [typography-anatomy].
- Tone by class: sans = modern, tech, youthful; serif = tradition, editorial, trust; slab = strong; mono = code, retro-tech; script = personality, short use; display = logos, headings [typography-anatomy][typography-in-design].

## 2. Screen defaults
- Body 16px = 1em (browser default). Express all other sizes as em/rem multiples so the scale follows body [typography-in-design].
- Build the scale up from body, e.g. H1 = 3em = 48px. Define one type scale as tokens and reuse it [typography-in-design]. No modular ratio is given.
- Body line-height 1.2–1.45, and the layout must survive a 1.5× user override (WCAG 1.4.12) [typography-in-design]. ⚠ 1.2 is tight for paragraphs. 1.4.12 also covers 0.12em letter, 0.16em word and 2em paragraph spacing, so never fix text-container heights.
- Measure 45–75 characters (including spaces), 80 max. Past 75, raise line-height [typography-in-design]. → cap text containers with `max-width` in `ch`.
- Layouts must hold at 200% text resize [typography-in-design].
- Weights: 100–900 (400 regular, 500 medium, 600 semibold, 700 bold). Use 2–3 weights per layout and load the real bold file, not a synthesized bold [typography-in-design].
- Contrast: 4.5:1 for text, 3:1 for large text (≥18pt ≈ 24px, or ≥14pt bold ≈ 18.7px), 7:1 for AAA [typography-in-design][minimalist-fonts].
- Prefer variable fonts: one file for all weights and widths gives faster pages and finer control [best-fonts-for-websites][best-fonts-for-logos].
- Turn on OpenType features where present: tabular numbers and contextual alternates (Inter), tabular lining figures (Rethink Sans), optical sizing (DM Sans, Jaro, Source Serif 4) [best-fonts-for-websites][minimalist-fonts][best-fonts-for-thumbnails][professional-fonts].
- Web fonts (downloaded by the browser) give brand range; web-safe fonts (preinstalled) always render but limit choice [best-fonts-for-websites]. ⚠ The article calls Roboto "Web-safe"; it is not preinstalled on most desktops, so load it with a fallback stack. ⚠ [best-font-for-resume] wrongly treats "Google fonts" as web-safe.
- Global audience: require script coverage (Noto, Open Sans, Ubuntu, Poppins/Hind for Devanagari, Be Vietnam Pro, PT Serif, Charis SIL, Montserrat for Cyrillic/Vietnamese) [best-fonts-for-websites][best-serif-fonts][professional-fonts][minimalist-fonts].
- Confirm the commercial license [professional-fonts].

## 3. Kerning, tracking, leading
- Kerning = space between one letter pair; tracking = uniform spacing across a range; leading = baseline-to-baseline distance [what-is-kerning][typography-in-design].
- Default to metric kerning (the designer's values). Optical kerning suits irregular or mixed typefaces. Hand-kern logos, wordmarks and headlines [what-is-kerning].
- Check large display type and unusual fonts by eye [typography-in-design]. Watch AV, WA, VA, LY, To and diagonal letters (A K V W Y) [what-is-kerning].
- Give small text more letter space; tighten large text [what-is-kerning]. Add tracking to ALL CAPS [typography-in-design].
- Futuristic display: tighten for sleek, loosen for open, but keep it readable [futuristic-fonts].
- Too much leading disconnects lines; too little cramps them [what-is-kerning]. Serif text needs room [best-serif-fonts].
- ⚠ Space letters with CSS `letter-spacing`, never with inserted spaces (screen readers then read letter by letter) [what-is-kerning].

## 4. Alignment, case, rag
- Left-align long copy; center only headings and short quotes [typography-in-design].
- ⚠ Full justification (no rag, varied spacing) [typography-in-design] leaves uneven gaps on the web without hyphenation, so avoid it for body text.
- Manage the rag through container width. Avoid widows (last line alone at the top of a column) and orphans (first line alone at the bottom) [typography-in-design].
- Use ALL CAPS for headings, wordmarks, buttons and labels, never long text. Avoid it in chat UI, where it reads as yelling [typography-in-design].
- Small caps (capitals at x-height) mark text off from body and headings, but few fonts have them [typography-in-design].

## 5. Hierarchy
- Size is the strongest signal (H1 > subheading > body), then weight, color, contrast, case and space [typography-in-design].
- Use bolder or brighter colors for headings and neutrals for large text blocks [typography-in-design].
- Exhaust one family's weights before adding a typeface [font-pairings][best-font-for-resume].
- Chunk content so it can be scanned [typography-anatomy]. No shadows, outlines or gradients on minimalist type [minimalist-fonts].

## 6. Selecting a typeface
- Start from channel, audience and competitors. Build a mood board around one anchor word [typography-in-design].
- Professional tone: few embellishments (Roboto, not calligraphic Almendra) [typography-in-design]. Serif reads as trust (law, finance, academia); sans reads as modern (tech, creative) [professional-fonts][best-font-for-resume].
- Test with real content at several sizes. Test black on white, white on black, brand-color text on white and on black, and white/black text on the brand color [typography-in-design]. → Repeat in the dark theme.
- Test across screens, resolutions, backgrounds and lighting [font-pairings][minimalist-fonts].
- Keep display fonts to logos and large headings; they blur when small [best-fonts-for-logos].
- Script: never for body text. Use it for quotes, signatures and short headers; one script at most, paired with a clean sans or serif [typography-in-design][best-script-fonts]. ⚠ Ignore the advice to set a kids' site in script [best-fonts-for-websites] and to use Seaweed Script or Allura for body text [best-script-fonts].
- Futuristic and decorative fonts: headlines only, with body in a simple sans or mono [futuristic-fonts].
- Use thin faces (Raleway) at heavier weights on small screens [best-fonts-for-thumbnails].
- Accessibility-designed faces: Inclusive Sans, Lexend, Public Sans [professional-fonts][best-fonts-for-thumbnails].
- Text inside images (thumbnails, OG cards): large heavy sans, 3–5 words, 1280×720 canvas, checked on mobile [best-fonts-for-thumbnails].
- Resume/PDF: body 10–12pt, headings 14–18pt, never under 10pt; no odd ligatures (ATS); no Comic Sans or Papyrus [best-font-for-resume]. ⚠ These are print points, not web px.

## 7. Pairing
- Contrast weight and x-height. Classic move: serif headline + sans body, or the reverse [font-pairings][best-serif-fonts].
- Pair one expressive headline font with one quiet body font; never two decorative fonts [minimalist-fonts][futuristic-fonts][best-script-fonts].
- One family can be the whole pairing (Quicksand Bold/Regular; DM Sans heavy/regular). Similar neo-grotesques pair through weight and size (Instrument Sans + Geist) [font-pairings][minimalist-fonts].
- Save each pairing as tokens and reuse it everywhere [minimalist-fonts]. Logos get a second font only for a tagline [best-fonts-for-logos].

Recommended pairings (headline + body):
- Editorial/luxury: Abril Fatface+Lato; Playfair Display+Lato; Unica One+Crimson Text; Yeseva One+Josefin Sans; Poiret One+Montserrat; Rufina+Average Sans; Young Serif+Instrument Sans [font-pairings].
- Professional/publishing: Raleway+Merriweather; Chonburi+Domine; Oswald+Source Serif 4; Arvo+Lato; Roboto+Lora; Montserrat+Karla; Source Sans Pro+Alegreya; Rethink Sans+Spectral; Crimson Serif+DM Sans; Archivo Narrow+Tenor Sans; Fjalla One+Cantarell; Nunito+PT Sans; Stint Ultra Expanded+Pontano Sans [font-pairings].
- Tech/UI: Space Mono+Plus Jakarta Sans; Inter+Krub; Syne+Inter; Instrument Sans+Geist; DotGothic16+Space Mono; Fugaz One+Work Sans; Ubuntu+Rokkitt; Sintony+Poppins [font-pairings].
- Education/health/kids: Nunito+Lora; Philosopher+Mulish; Cardo+Hind; Arima Madurai+Mulish; Bubblegum Sans+Open Sans [font-pairings].
- Other: Cinzel+Fauna One (heritage); Ultra+Slabo (music); Grand Hotel+Lato, Sacramento+Alice, Yellowtail+Rethink Sans (script headline) [font-pairings].
- Minimalist: Montserrat+Karla; Raleway+Cabin [minimalist-fonts]. Logo: Montserrat+Hind; Futura+Lora; Poppins+Libre Baskerville; Grand Hotel+Oswald [best-fonts-for-logos].
- Wedding: Tangerine+Noto Sans; Alex Brush+Open Sans; Imperial Script+Montserrat; MonteCarlo+Roboto Serif; Style Script+Oswald; Yesteryear+Raleway; Pinyon Script+Forum; EB Garamond+Source Sans Pro; Playfair Display SC+Libre Baskerville; Pinyon Script+Spectral; Bilbo+Arvo; Great Vibes+Lora; Playfair Display+Montserrat; Luxurious Script+Baskervville; Cinzel Decorative+Libre Bodoni; Pacifico+Lato; Ojuju+IBM Plex Mono; Quattrocento+Spectral; Srisakdi+Reem Kufi; Dancing Script+Oswald; Parisienne+Spectral; Vidaloka+Raleway; Homemade Apple+Rethink Sans [wedding-font-pairings].

## 8. Font catalog
Codes: W best-fonts-for-websites · S best-sans-serif-fonts · SF best-serif-fonts · L best-fonts-for-logos · R best-font-for-resume · T best-fonts-for-thumbnails · SC best-script-fonts · F futuristic-fonts · MO modern-fonts · MI minimalist-fonts · P professional-fonts · FP font-pairings · WP wedding-font-pairings · A typography-anatomy · D typography-in-design. Filter by code to rebuild a list (resume R, thumbnail T, professional P, modern MO, minimalist MI).
Google Fonts: stated only for Monoton (GF✓). All others are GF? (not stated), so check before `next/font/google`. OSS = the article says open-source. ⚠ No license is stated for Avenir, Proxima Nova, Futura, Didot, Bodoni, Garamond or Baskerville.

### 8a. UI / web body: sans
- Inter [W S R T MO MI FP]: built for screens and small UI text; tall x-height; variable; tabular numbers. OSS.
- Roboto [W S R MI P D FP]: Android system font; many weights and widths; dashboards.
- Open Sans [W S R MO MI FP WP]: humanist, wide, very readable; multilingual.
- Lato [W S R MO MI P L FP]: warm, semi-rounded, clear at any size. OSS.
- Source Sans Pro / 3 [W S R P FP]: designed for UI. OSS.
- Work Sans [W R L MO MI P FP]: regular weights for 14–48px text, heavy weights for display.
- DM Sans [W S R MO MI FP]: designed for small sizes; optical-size axis.
- Poppins [W S L T MO MI FP]: geometric, even stroke; Devanagari; hero sections and logos.
- Montserrat [W S R L T MO MI A FP WP]: large x-height, wide apertures; headlines and body.
- Nunito / Nunito Sans [W R T MO MI FP]: rounded (Sans is non-rounded); screen-optimized.
- Manrope [W MO MI]: geometric, variable. Rubik [W T]: slightly rounded (OSS). Ubuntu [W S MO FP]: humanist, wide language support.
- Plus Jakarta Sans [L MO P FP], Instrument Sans [L MO MI FP], Rethink Sans [L T MO MI P FP WP], Geist [MI T FP]: modern UI neutrals.
- Karla [R MI FP]: generous x-height. Public Sans [S P]: government sites. Inclusive Sans [L MO P], Lexend [T]: accessibility. Hind [MI P FP L]: Devanagari.
- More: Be Vietnam Pro, Encode Sans (dashboards), Merriweather Sans (tiny sizes), Sen (long reads), Titillium Web (dense), Alef, Capriola [S]; Epilogue, Cabin (condensed width for cards) [S MI]; Tenor Sans [S P FP]; Cantarell (small mobile screens), Mulish (quiet body), Sintony, Krub [MI FP]; Hanken Grotesk (OSS), Space Grotesk, Sofia Sans (narrow navbars), Jost, Outfit, Basic, Antic, Actor, Dongle, Comfortaa (kids), Agdasima (table cells) [MI]; Urbanist (data viz), Albert Sans, Schibsted Grotesk [P]; Fira Sans, IBM Plex Sans, Libre Franklin, Alegreya Sans [R]; Noto Sans [R P WP]; PT Sans, Pontano Sans, Average Sans [FP].

### 8b. Body / long-form serif
- Merriweather [SF R FP]: designed for screen reading.
- Lora [W SF R P FP WP]: calligraphic; works large and small.
- Libre Baskerville [W SF P A L WP]: taller x-height and wider counters for screen body.
- Source Serif 4 [SF MI P FP]: extended reading; optical sizes.
- Domine [SF R MO P FP]: designed for screens; news sites.
- Roboto Serif [SF MO WP]: variable screen body. PT Serif [SF R], Noto Serif [SF A]: multilingual.
- Crimson Text / Crimson Serif [SF R P A FP], EB Garamond [SF R P WP]: literary long-form.
- More: Libre Caslon (OSS), Tinos, Tienne, Young Serif, DM Serif, IBM Plex Serif, Inria Serif, Kyiv Type Serif, Charis SIL (MO calls it a slab) [SF]; Neuton [W]; Spectral [FP WP]; Alegreya [FP L]; Gowun Batang [MI]; Newsreader [T].
- ⚠ Instrument Serif [SF L MO P T]: SF says body and UI, T says condensed, high-contrast and best large. Test it at body size.

### 8c. Display / headline (large sizes only)
- High-contrast serif (luxury, fashion, editorial): Playfair Display [W SF L MO FP WP], Bodoni Moda [SF MO P], Didot [SF L], GFS Didot [P], Cormorant / Cormorant Garamond [SF R MI], Prata [SF L], Abril Fatface [L FP], Gilda Display [L], Yeseva One [FP], Rufina [L FP], Cinzel [L FP], Soria [W], Ramaraja [SF P], Hedvig Letters Serif [SF], Taviraj [L], Vidaloka, Libre Bodoni [WP].
- Friendly/retro serif: Chonburi [SF MO FP], Bree Serif [SF L], Averia Serif Libre [SF], Aleo [SF P], Forum, Arapey, Pridi, Corben [MO], Philosopher, Cardo [FP].
- Slab: Arvo [W R FP WP] (menus, CTAs), Sreda [W], Alfa Slab One [L], Ultra, Rokkitt [FP], Roboto Slab, Zilla Slab, Slabo [A], Montagu Slab [T].
- Condensed/bold sans: Oswald [FP WP] (headers, nav), Bebas Neue [T P] (all caps), Anton [T], Archivo family [T P FP], Fjalla One, Unica One [FP], Stint Ultra Expanded [FP T], Biryani, Abel, Yaldevi [S], Red Hat Display, Kanit [MO], Jaro [T], Unbounded [T F].
- Playful/rounded: Quicksand [L T FP], Concert One, Bangers, Holtwood One SC, Asset [T], Bubblegum Sans, Fugaz One, Syne, Poiret One, Arima Madurai [FP], Sniglet, Shrikhand, Eczar, Suez One [L]. Josefin Sans [W FP] and Raleway [W S R T MI P FP WP]: elegant, larger sizes.
- Logo only [L]: Avenir, Proxima Nova, Futura, Bodoni, Garamond, Bricolage Grotesque, Exo 2; Sono [S].

### 8d. Monospace
Space Mono [L F MO FP] (retro-tech), IBM Plex Mono [T MO WP] (OSS, legible small), Source Code Pro [A D], Inconsolata [MI], Anonymous Pro, Xanh Mono [MO], Syne Mono [F], Courier New [A].

### 8e. Futuristic [F]
- Said to work small: Doto, Turret Road (⚠ "body text"; test it), Michroma, Zen Dots, Electrolize, Smooch Sans, Orbitron, Unbounded.
- Display: Climate Crisis, Funnel Display, Monoton (GF✓), Audiowide, Geo, Tektur, Gugi, Tomorrow, Nova Square, Russo One, Krona One, Wallpoet, Geostar, Train One. Pixel: Pixelify Sans, DotGothic16, Workbench, Sixtyfour, Digital Numbers. Glitch: Rubik Glitch, Rubik Broken Fax, Rubik 80s Fade.

### 8f. Script & handwriting (headings and accents only)
- Formal/luxury: Alex Brush, Allura, Beau Rivage, Imperial Script, Luxurious Script, Petit Formal Script, Parisienne, Rochester, Great Vibes, Euphoria Script, Style Script, Pinyon Script [SC]; MonteCarlo [WP]; Quintessential [L MO].
- Casual/kids: Dancing Script, League Script, Grape Nuts, Meow Script, Caveat, Nanum Pen Script (OSS), Seaweed Script [SC]; Homemade Apple [WP]; Architects Daughter, Coming Soon [A].
- Retro/brush: Sacramento, Pacifico, Yellowtail, Tangerine, Rouge Script, Marck Script, Molle (slant hurts readability), Neonderthaw (all caps, short), Passions Conflict, Playwrite USA Traditional [SC]; Grand Hotel [L FP]; Yesteryear, Bilbo [WP]; Oleo Script, Bad Script [A].

## Numbers & thresholds
| Item | Value | Source |
|---|---|---|
| Body size | 16px = 1em | typography-in-design |
| H1 example | 48px = 3em | typography-in-design |
| Body line-height | 1.2–1.45; survive 1.5× | typography-in-design |
| Measure | 45–75 chars; 80 max | typography-in-design |
| Text resize | 200% | typography-in-design |
| Contrast | 4.5:1; large 3:1; AAA 7:1 | typography-in-design, minimalist-fonts |
| Large text | ≥18pt (~24px) or ≥14pt bold (~18.7px) | typography-in-design |
| Weights | 100–900; 400/500/600/700; 2–3 per layout | typography-in-design |
| Work Sans text | 14–48px | best-fonts-for-websites |
| Thumbnail | 1280×720; 3–5 words | best-fonts-for-thumbnails |
| Resume (print) | 10–12pt body; 14–18pt headings | best-font-for-resume |

Coverage: 16/16 files read.
