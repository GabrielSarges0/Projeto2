# Color: agent rules (distilled from 16 Figma "Design basics" articles)

Use this file to choose palettes, build token scales and assign UI color roles on websites (Tailwind or CSS custom-property tokens, WCAG 2.2 AA in light and dark). `[slug]` = source. ⚠ = conflicts with WCAG 2.2 AA or web practice. The articles never address dark themes beyond palette mentions, so every pair must be re-checked in the dark theme.

## 1. Color models and output
- Build all screen color in RGB: additive light, each channel 0–255, all 0 = black, all 255 = white, 16M+ colors [what-is-rgb][what-is-color-theory].
- Use CMYK (subtractive ink, 16,000+ combinations) only for print. Its gamut is narrower than RGB, so vivid screen colors go dull once converted: convert, then re-check [what-is-cmyk][color-grading][what-is-color-theory]. Print black: true K100; rich black C60 M60 Y60 K100 for large solids [what-is-cmyk].
- Every device has its own gamut, so the same value looks different across screens. Test on several devices and under varied lighting [what-are-primary-colors][types-of-color-palettes][color-symbolism].
- Choose a color profile explicitly (sRGB or Display P3) and export assets in it [what-are-primary-colors].
- Define colors as variables/tokens, not one-off values, so palette changes propagate [what-are-primary-colors].

## 2. Wheel and complements: RYB vs RGB
- Painter's RYB wheel: primaries red, yellow, blue; secondaries orange, green, violet; 6 tertiaries; 12 hues total [what-are-secondary-colors][what-is-color-theory].
- RYB complements: red–green, blue–orange, yellow–purple, blue-green–red-orange, yellow-green–red-violet, blue-violet–yellow-orange [what-are-complementary-colors].
- RGB (screen) complements: red–cyan, green–magenta, blue–yellow. RGB secondaries: cyan = G+B, magenta = R+B, yellow = R+G [what-are-complementary-colors][what-are-secondary-colors].
- ⚠ Web practice: rotating hue 180° in `hsl()`/`oklch()` follows the RGB wheel (blue → yellow), not RYB (blue → orange) as [what-is-color-theory] uses. Decide which wheel you mean before generating harmonies.

## 3. Hue, value, saturation, temperature
- Tune three axes: hue (the color), value (lightness/shading), saturation (intensity) [what-is-color-theory].
- A highly saturated red reads as a warning, so desaturate or shift value for non-error use. Too dull or light hurts legibility; fix the background contrast instead [what-is-color-theory].
- High value feels soft and airy; low value feels dramatic and bold [types-of-color-palettes]. Adding white turns bold yellow into a calm pastel [color-combinations].
- Warm hues (red, orange, yellow) add energy and pull attention. Cool hues (blue, green, purple) calm and read as professional. Neutrals (white, black, brown, gray) sit off the wheel and support or stand alone [color-symbolism][what-is-color-theory].
- Mix warm and cool to energize text-heavy or monochrome pages [what-are-complementary-colors][what-are-split-complementary-colors].

## 4. Building scales: tints, shades, tones
- Tint = base + white (lighter, pastel). Shade = base + black (darker). Tone = base + gray (lower saturation, muted) [monochromatic-colors][shades-of-green][shades-of-red].
- To warm a neutral, mix a yellow or red undertone into the gray; then test, because shifts change mood (too red alarms, too blue saddens) [monochromatic-colors].
- Roles along the scale: light steps for backgrounds and minor elements, dark steps for text, foreground and primary buttons, brighter mid steps for CTAs and accents [shades-of-red][color-combinations][types-of-color-palettes].
- Monochrome example: dark blues for text and navigation, brighter blues as accents [types-of-color-palettes].

## 5. Harmony types in UI
- **Complementary** (opposites): maximum contrast, and simultaneous contrast makes both look brighter. Reserve the pair for key elements (buttons, key info) on a neutral field; vary tints and shades; balance brightness and saturation [what-are-complementary-colors]. Google's four-color mark works because it sits on stark white [what-are-complementary-colors]. ⚠ Opposite hues do not guarantee luminance contrast: #FF0000 on #008000 is about 1.3:1, and red/green also fails for deuteranopia [shades-of-green].
- **Split-complementary** (base + the two neighbors of its complement): contrast with less tension. The use of choice when a complementary pair is too loud. Apply 60-30-10 and balance with white, black, gray or beige [what-are-split-complementary-colors][what-are-complementary-colors]. Example: blue base + red-orange + yellow-orange.
- **Triadic** (three evenly spaced): one dominant + two accents used sparingly. Primary triad = loudest; secondary triad = subtler; tertiary triads = most understated [what-are-triadic-colors][types-of-color-palettes].
- **Analogous** (three neighbors): calm and natural. Assign main, supporting and accent; add one high-contrast accent so CTAs stand out [what-is-color-theory][types-of-color-palettes].
- **Monochromatic** (one hue's tints, shades, tones): cohesive and hard to clash, but can get monotonous, so add an accent. Check contrast between steps [monochromatic-colors][types-of-color-palettes].
- **Tetradic** (rectangle: two complementary pairs) and **Square** (four evenly spaced): most variety and drama, hardest to balance. Ground with plenty of neutrals [what-is-color-theory][types-of-color-palettes][color-combinations].
- Picking by goal: color without contrast → analogous; cohesion → monochromatic; balanced pop → triadic; softened contrast → split; maximum drama → tetradic [what-are-split-complementary-colors][what-are-triadic-colors].

## 6. Distribution
- 60-30-10: 60% dominant, 30% secondary, 10% accent [types-of-color-palettes][what-are-triadic-colors][what-are-split-complementary-colors][color-grading]. Two readings: dominant = brand color (Hatch's dark-blue background, Spotify green) [types-of-color-palettes], or 60% neutral, 30% primary, 10% secondary accent [what-are-secondary-colors]. Brands with a strong signature color keep black, white and gray for backgrounds and accents [what-is-color-theory].
- A palette is 1 primary + 1 secondary + 1–2 accents [types-of-color-palettes]. Keep 1–6 foundational hues [what-are-secondary-colors].
- Design in grayscale first to prove the hierarchy, then add color [types-of-color-palettes].
- Use bolder, brighter colors for headings and neutrals for long text [typography-in-design].
- Keep product UI neutral and spend red on buttons, notifications and errors (Figma's site: red logo, neutral UI) [shades-of-red]. Use red, orange and purple sparingly [color-symbolism].
- Neon-heavy palettes (electric fusion): add a neutral or lower the values to avoid overload [color-combinations].

## 7. Semantics and symbolism
- UI roles: red = error, warning, urgency, alerts, attention CTA; green = success, confirmation, positive actions, CTA/nav [types-of-color-palettes][shades-of-red][shades-of-green]. ⚠ Never rely on color alone (WCAG 1.4.1). The articles' own example, red/green for right/wrong answers, needs icons or text [what-are-primary-colors][what-are-complementary-colors].
- Red: love, passion, danger, anger, urgency, appetite; luck and prosperity in Chinese culture [types-of-color-palettes][color-symbolism].
- Orange: warmth, playfulness, creativity; restrain it to keep credibility [color-symbolism].
- Yellow: cheer, optimism, youth. ⚠ Yellow text has readability issues: use it on dark backgrounds, as an accent, or as a fill under dark text [color-symbolism].
- Blue: trust, dependability, calm, professionalism (banks, tech). A blue that is too cool reads as impersonal [color-symbolism][types-of-color-palettes].
- Green: nature, growth, health, eco; also greed and envy. Light greens feel upbeat, deep greens dignified. At ~555 nm, green is the easiest color to see [color-symbolism][shades-of-green].
- Purple: wealth, leadership, luxury; too much reads as pompous [color-symbolism]. Pink: romance, playfulness, youth [types-of-color-palettes].
- White: cleanliness and purity in the West; mourning in Japan, Korea, China and India [color-symbolism]. Black: sophistication, luxury, but heavy in bulk [color-symbolism]. Brown: earthy, reliable, comforting, but dull or rustic unless brightened [color-symbolism][shades-of-brown].
- Research what colors mean to the target culture before locking a palette; A/B-test CTA colors [types-of-color-palettes][color-symbolism][shades-of-red].
- Domain defaults: food → red, yellow, orange; meditation/sleep → blues, greens, deep blue; kids/toys → bright yellow, pink; finance → blue, blue-gray, gray + deep green + brown; wellness → greens, cream, sage; luxury → black, burgundy, maroon, muted gold, taupe; gaming → saturated neon; dark-mode products → midnight blue, cobalt to navy [types-of-color-palettes][color-combinations].

## 8. Accessibility and contrast
- WCAG minimum: 4.5:1 for normal text, 3:1 for large text; AAA 7:1 [types-of-color-palettes][typography-in-design][minimalist-fonts]. ⚠ "4.5 times lighter" [types-of-color-palettes] simplifies: the ratio uses relative luminance, (L1+0.05)/(L2+0.05).
- ⚠ The articles skip WCAG 1.4.11: borders, icons, focus rings and control states need 3:1 against adjacent colors.
- ⚠ Hue contrast is not luminance contrast. Claims that complementary, split-complementary or secondary colors "provide the contrast" for accessibility [what-are-complementary-colors][what-are-split-complementary-colors][what-are-secondary-colors][typography-in-design] must be measured, never assumed.
- ⚠ "Adjust text opacity" [typography-in-design]: translucent text changes ratio with whatever is behind it. Compute the composited color.
- Low-contrast bases (beige, tan, cream, pastels) need darker text, or patterns and texture to separate elements [types-of-color-palettes].
- Account for color-vision deficiency (deuteranopia: green vs red) [shades-of-green][what-are-primary-colors].

## 9. Starter palettes by domain (no hex) [types-of-color-palettes]
Light-blue monochromatic: productivity, banking, health dashboards. Cream + light green + peach (analogous): wellness, spa; add a high-contrast CTA accent. Lilac + green (complementary): meditation, weddings. Pastel orange + blues/violets (split): kids' learning, creative tools; add neutrals. Beige + three pastels (square): mindfulness; use darker text. Pink + bright green + light purple (triadic): creative, kids; one dominant. Maroon + deep turquoise (complementary): academic, high-end retail; add light neutrals. Sage monochromatic + brown/cream: organic, gardening. Brown + olive + maroon (analogous): fine dining, furniture; lighten it. Yellow + light cyan + light magenta (triadic): gaming, kids; one dominant. Tan + green/blue/purple (square): events; add texture. Mint blue + pinks (split): weddings, wellness; use white space.
Usage patterns from [color-combinations]: sand/cream background with dark text and buttons (Night sands); light browns as backgrounds with darker browns for primary CTAs (Cozy campfire); white/gray neutrals let products lead (Salt and pepper, Apple); blue-gray reads as trustworthy and professional (Stormy morning, Harbor haze).

## 10. Color grading → UI imagery and hero media
- Correct first (exposure, contrast, white balance; mandatory), then grade (mood; optional) in separate passes [color-grading].
- Set white balance first, then nudge tint (green/magenta). Fix exposure and contrast before any styling [color-grading].
- Prefer small hue shifts to big saturation boosts; pushing either too far looks unnatural [color-grading].
- Start from a reference image or mood board, not by feel. Match lighting presets (daylight vs tungsten). Grade to the brand, not to a trend [color-grading].
- Primary grading adjusts the whole frame; secondary isolates a region (sky, product, skin). Lift/gamma/gain push shadows, midtones and highlights separately [color-grading].
- Mood vocabulary: cool blue/teal = tension, distance; warm orange/amber = nostalgia, adventure; desaturated green = sci-fi, dystopia; high-contrast red = urgency, danger [color-grading].
- Apply one palette across a whole image set, AI-generated images included, so they read as one family. Use 60-30-10 for an image's color too [color-grading].
- Check the target color space before export [color-grading].

## 11. Named shades with hex
W = contrast vs #FFFFFF (also white text on this fill); B = vs #000000. Ratios computed with the WCAG formula; they are not from the articles. ⚠ marks an article use that fails AA for that use.

|Name|Hex|Article use|W|B|
|---|---|---|---|---|
|Brown (RGB mix)|#895129|base brown|6.4|3.3|
|Beige|#EDE8D0|calm, stable base|1.2|17.1|
|Nude|#F7D9BC|hover, filled-input cue ⚠ needs non-color cue|1.3|15.6|
|Sand|#CBBD93|wellness, travel|1.9|11.2|
|Tan|#D6B588|buttons, text ⚠ text fails|1.9|10.8|
|Bronze|#CE8946|luxury|2.9|7.3|
|Burnt sienna|#E97451|CTAs ⚠ <3:1 on white; use dark label|3.0|7.1|
|Cinnamon|#D47E30|headlines ⚠ large only|3.1|6.8|
|Copper|#C68346|pairs with teal|3.1|6.7|
|Sepia|#704214|nostalgic type|8.5|2.5|
|Chocolate|#7B3F00|comfort, elegance|8.2|2.6|
|Mocha|#6D3B07|premium|9.2|2.3|
|Umber|#635147|"contrasts with white and black" ⚠ black fails|7.5|2.8|
|Taupe|#54463A|type, nav bars|9.1|2.3|
|Jungle green|#2AAA8A|example hex|2.9|7.2|
|Apple green|#8DB600|playful accent|2.4|8.8|
|Chartreuse|#CCFF00|lively accent|1.2|17.9|
|Lime green|#89F336|nav cue ⚠|1.4|14.9|
|Pistachio|#93C572|soft; pair with black/gray|2.0|10.5|
|Spring green|#00F0A8|success, confirm ⚠ dark text only|1.5|14.0|
|Sea green|#2E8B57|relaxed environment|4.2|4.9|
|Teal green|#006D5B|buttons, links, CTAs|6.3|3.3|
|Turquoise green|#A0D6B4|travel, tech|1.6|12.8|
|Gray asparagus|#465945|CTA|7.6|2.8|
|Seafoam|#93E9BE|pair with coral, yellow|1.4|14.6|
|Sage|#98A869|calm backdrops|2.6|8.1|
|Forest green|#2E6F40|premium accent, CTA|6.1|3.5|
|Moss|#8A9A5B|natural brand tone|3.1|6.9|
|Olive|#636B2F|outdoor apps|5.7|3.7|
|Chili red|#CD1C18|CTA, highlights|5.6|3.8|
|Scarlet|#ED2100|CTAs|4.4|4.8|
|Cinnabar|#E84B3D|CTAs, urgent alerts, progress ⚠ text fails|3.8|5.5|
|Rose red|#FA003F|youthful UI|4.1|5.1|
|Fire engine red|#CE2029|emergency alerts|5.4|3.9|
|Vermilion|#E34234|energy|4.1|5.1|
|Ruby|#9B111E|luxury|8.4|2.5|
|Wine|#722F37|fashion, beauty|9.6|2.2|
|Berry|#B6316C|playful modern|5.8|3.6|
|Venetian red|#C80815|heritage|6.0|3.5|
|Magenta|#FD3DB5|modern accent|3.2|6.5|
|Carmine|#960018|elegance|9.1|2.3|
|Pastel red|#FF746C|soothing|2.6|8.0|
|Dusty rose|#DCA1A1|buttons, icons, tabs ⚠ <3:1|2.2|9.7|
|Pink|#FF8DA1|subtle accent|2.2|9.6|
|Rosewater|#FFD6D1|wellbeing|1.3|15.8|
|Red|#FF2C2C|warnings, errors ⚠ fails 4.5:1 as text|3.7|5.6|
|Burgundy|#660033|luxury|13.0|1.6|
|Puce|#E491A6|intrigue|2.4|8.9|
|Maroon|#550000|tradition|15.1|1.4|
|Crimson|#B22222|passion|6.7|3.1|
|Rose|#FF1D8D|dating, Valentine's|3.6|5.8|
|Chili pepper|#B53333|accents|6.0|3.5|
|Garnet|#8B0000|luxury|10.0|2.1|
|Brick red|#CB4154|warm, grounded|4.7|4.4|
Sources: browns [shades-of-brown]; greens [shades-of-green] (the article prints Sage as "##98A869"); reds [shades-of-red]. White labels on Scarlet, Cinnabar, Rose red, Vermilion or Rose (3.6–4.4) pass only at large text sizes.

## Numbers & thresholds
| Item | Value | Source |
|---|---|---|
| Distribution | 60% / 30% / 10% | types-of-color-palettes, what-are-secondary-colors, what-are-triadic-colors, what-are-split-complementary-colors, color-grading |
| Palette size | 1 primary + 1 secondary + 1–2 accents; 1–6 foundational hues | types-of-color-palettes, what-are-secondary-colors |
| Text contrast | 4.5:1; large 3:1; AAA 7:1 | types-of-color-palettes, typography-in-design |
| RGB channel | 0–255; 16M+ colors | what-is-rgb, what-is-color-theory |
| CMYK | 16,000+ combinations; orange C0 M50 Y100 K0 | what-is-color-theory, what-is-cmyk |
| Print black | true K100; rich C60 M60 Y60 K100 | what-is-cmyk |
| Visible light | 400–700 nm; green ~555 nm | shades-of-green |
| Wheel | 3 primary + 3 secondary + 6 tertiary = 12 | what-are-secondary-colors |
| Scheme counts | 7 harmonies; 6 palette types; 4 triads; 12 split-complements | what-is-color-theory, types-of-color-palettes, what-are-triadic-colors, what-are-split-complementary-colors |
| Analogous | 3 adjacent hues | what-is-color-theory |

Coverage: 16/16 files read.
