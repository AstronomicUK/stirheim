# Mordheim Campaign Map (reference image)

`mordheim-campaign-map-en.jpg` (4000 x 2829, JPEG, ~5 MB) is the English "for screen" version of the
fan-made Mordheim Campaign Map by Philip of Beyond the Tabletop, made with Tuomas Pirinen, Daniel
Sarnblom, Roland Wenskus, Giuseppe Chiafele and Maxine Howells; the original Mordheim map art is by
Nuala Kennedy, after a 2010 French campaign map by Chrismish. Downloaded 2026-09-06 from
https://beyondthetabletop.com/mordheim-campaign-map/ (Dropbox link on that page) at Tom's request,
as the reference for the map-campaign feature.

It is a fan project, not official Games Workshop material. Before the image ships inside the app
(as opposed to a GM uploading it to their own campaign), clear that with the author. The A2 print
version (13 MB) and French, German, Italian, Spanish and Ukrainian versions are on the same page.

The map carries its own campaign rules: districts with a key of benefits, Foothold tokens (won a
battle in the district), Exploration tokens (fought there without winning), adjacency, and Hard
Fought Districts that only one warband may hold.

## Structured data (added 2026-09-06)

- `districts.json`: the 30 districts with names in five languages, circle coordinates (percent of
  the image), advantage text (English, with mordheimer.net links in Markdown), `abundance`, `hard`
  and `gate` flags, and `connections`. Extracted from the bundle of https://mordheim-map.com/, the
  fan-made interactive version of the same map (Warhammer Fantasy Online Rules Index Project). The
  Statue of Count Gotthard's connections were corrected against the red lines on the image.
- `campaign-rules.md`: the map campaign rules as published on that site, condensed.

Permission: both the image and the interactive site are fan works. Ask Philip Spence before
shipping the image inside Stirheim; the rules text and adjacency are game data we restate in our own
words.
