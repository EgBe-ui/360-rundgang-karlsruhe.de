# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projektübersicht

Drei zusammengehörige Projekte für Beck360 (360° Rundgänge & Drohnenaufnahmen Karlsruhe):

| Projekt | Pfad | GitHub Repo | Zweck |
|---------|------|-------------|-------|
| **360-rundgang** | `360-rundgang-karlsruhe.de/` | `EgBe-ui/360-rundgang-karlsruhe.de` | Website für Immobilienverkäufer & Makler |
| **firmenrundgang** | `firmenrundgang-karlsruhe.de/` | `EgBe-ui/firmenrundgang-karlsruhe.de` | Website für Unternehmen aller Branchen |
| **Blog-Automation** | `beck360-blog-automation/` | `EgBe-ui/beck360-blog-automation` | Automatische Blog-Generierung via Claude API |

Alle drei sind **separate Git-Repos**. Die Site-Repos deployen automatisch über Netlify bei Push/Merge auf `main`.

## Architektur

```
beck360-blog-automation/     ← GitHub Actions (Mo 10:00 CET)
  ↓ Claude API: Thema → Artikel-JSON → HTML
  ↓ Bild, Index, Sitemap aktualisieren
  ↓ Git Branch → PR erstellen
360-rundgang-karlsruhe.de/   ← Netlify auto-deploy (amazing-kelpie-cd177b)
firmenrundgang-karlsruhe.de/ ← Netlify auto-deploy (glittering-genie-7273c9)
```

## Seitenstruktur

### firmenrundgang-karlsruhe.de

| Seite | Pfad | Beschreibung |
|-------|------|--------------|
| **Homepage** | `/index.html` | Hauptseite mit Hero-Video, Portfolio, Referenzen |
| **6 Stadt-Seiten** | `/{stadt}/index.html` | Ettlingen, Bruchsal, Rastatt, Baden-Baden, Pforzheim, Mannheim |
| **8 Branchen-Seiten** | `/{branche}/index.html` | Hotels, Gastronomie, Fitness, Einzelhandel, Autohaus, Gesundheit, Eventlocations, Coworking |
| **15 Blog-Artikel** | `/blog/*.html` | Themen: Hotel, SEO, Arztpraxis, Autohaus, Bäckerei, Coworking, Einzelhandel, Event, Fitness, Google SV, Matterport, Restaurant, ROI, Schule, Zahnarzt |
| **Blog-Index** | `/blog/index.html` | JS blogPosts-Array mit Filter-Buttons |
| **404-Seite** | `/404.html` | Gebrandete deutsche 404-Seite |
| **Weitere** | `danke.html`, `impressum.html`, `datenschutz.html` | |

### 360-rundgang-karlsruhe.de

| Seite | Pfad | Beschreibung |
|-------|------|--------------|
| **Homepage** | `/index.html` | Hauptseite mit Vimeo-Video, Matterport-Demo, Referenzen |
| **6 Stadt-Seiten** | `/{stadt}/index.html` | Ettlingen, Bruchsal, Rastatt, Baden-Baden, Pforzheim, Mannheim |
| **3 Service-Seiten** | `/privatverkauf/`, `/immobilienmakler/`, `/drohnenaufnahmen/` | Zielgruppen-Landingpages |
| **1 Spezialseite** | `/pv-inspektion/` | PV-Inspektion per Drohne |
| **14 Blog-Artikel** | `/blog/*.html` | Immobilienthemen: Besichtigung, Drohnenrecht, Hausverkauf, Markt KA, KI, Homestaging, etc. |
| **Blog-Index** | `/blog/index.html` | Hardcoded HTML-Cards |
| **404-Seite** | `/404.html` | Gebrandete deutsche 404-Seite |
| **Weitere** | `danke.html`, `/impressum/`, `/datenschutz/`, `/tools/` | |

## Design-System

### firmenrundgang-karlsruhe.de
- **Primary**: `#0F766E` (Teal)
- **CTA**: `#0369A1` (Blue)
- **Font**: Inter (400-800)
- **GA**: `G-L8ESGDHHNT`
- **Form**: FormSubmit.co mit Honeypot

### 360-rundgang-karlsruhe.de
- **Primary**: `#1a5c6b` (Blaugrün), CSS Custom Properties
- **Font**: Inter + Merriweather (Blog)
- **GA**: `G-27HD7V7466`
- **Form**: FormSubmit.co mit Honeypot

### Gemeinsame Patterns
- Fade-up Scroll-Animationen via Intersection Observer
- Mobile-first responsive, max-width 640px Container
- Inline `<style>` pro Seite (kein externes CSS)
- Skip-Link, Focus-States, WCAG-konform

## Matterport-Demo IDs

Diese echten Rundgänge werden auf den Seiten eingebettet:

| ID | Projekt | Beschreibung |
|----|---------|-------------|
| `VSzj77WVRrn` | CrossFit BuffaloBox Ettlingen | Fitness (Stadt: Ettlingen) |
| `uaNAUuR2ynk` | Bärle am Friedrichplatz Bruchsal | Einzelhandel (Stadt: Bruchsal) |
| `eisanxEDSWw` | Autohaus Lounge Wackenhut | Autohaus (Stadt: Rastatt, Homepage) |
| `xBcQ9jha1Ni` | Friseursalon | Dienstleistung (Stadt: Baden-Baden) |
| `gj6sDQiJXkr` | Hörgeräte Akustik Ziegler | Gesundheit (Stadt: Pforzheim) |
| `A6oKq1AGzqS` | Produktionshalle | Industrie (Stadt: Mannheim) |
| `JpmsyFFDkW9` | Immobilien-Demo | 360-rundgang alle Stadt-Seiten |

## SEO-Status (Stand: Februar 2026)

### Umgesetzt

| Maßnahme | firmenrundgang | 360-rundgang |
|----------|---------------|-------------|
| **OG + Twitter Tags** | Alle Seiten (Blog, Stadt, Branchen, Homepage) | Alle Seiten |
| **JSON-LD Service Schema** | Stadt-Seiten + Branchen-Seiten | Stadt-Seiten |
| **JSON-LD FAQPage** | Stadt-Seiten (7 Fragen) + Branchen-Seiten (7 Fragen) | Stadt-Seiten (7 Fragen) |
| **JSON-LD Article** | 15 Blog-Artikel (mit url + ImageObject) | 14 Blog-Artikel (mit url + ImageObject) |
| **JSON-LD BreadcrumbList** | Alle Blog-Artikel + Stadt-Seiten | Alle Blog-Artikel + Stadt-Seiten |
| **AggregateRating** | Stadt + Branchen Service-Schema | Homepage LocalBusiness + Stadt Service-Schema |
| **Author Box** | Stadt + Branchen-Seiten (Eugen Beck, EB-Badge) | Stadt-Seiten |
| **Internal Linking** | Homepage: Region-Links (6 Städte + 8 Branchen) | Homepage: Region-Links (6 Städte + 4 Services) |
| **Preconnect** | `my.matterport.com` auf allen Seiten mit iFrames | `my.matterport.com` + Vimeo auf Homepage |
| **DNS-Prefetch** | `maps.googleapis.com` auf Stadt-Seiten | `maps.googleapis.com` auf Stadt-Seiten |
| **Sitemap** | Vollständig, alle Seiten enthalten | Vollständig, alle Seiten enthalten |
| **robots.txt** | Allow all, Sitemap verlinkt, danke.html blockiert | Allow all, Sitemap verlinkt, danke.html + /tools/ blockiert |
| **Security Headers** | `_headers`: X-Frame, X-Content-Type, Referrer-Policy, Permissions-Policy | Identisch |
| **Caching** | Bilder 1 Jahr immutable, HTML 1h | Identisch |
| **HSTS** | Aktiv via Netlify | Aktiv via Netlify |
| **Custom 404** | Gebrandete deutsche Seite mit noindex | Gebrandete deutsche Seite mit noindex |
| **Google Search Console** | Eingerichtet | Eingerichtet |
| **Google Business Profile** | Eingerichtet | Eingerichtet |

### Blog-Bilder

- **firmenrundgang**: Lokale JPEGs unter `/images/blog/` (400x225), 1 Bild pro Artikel
- **360-rundgang**: Unsplash-URLs (direkt im `src`), `og-image.jpg` als Fallback für Group A (8 Artikel ohne eigene OG-Bilder)

### Stadt-Seiten Layout (~465 Zeilen)

Alle 12 Stadt-Seiten haben folgendes Layout:
1. Hero (Gradient bei firmenrundgang, Drohnenfoto bei 360-rundgang)
2. Stats-Bar (3 Kennzahlen)
3. Warum-Sektion (3 Cards)
4. Matterport Live-Demo (interaktiver iFrame)
5. Services-Grid (4 Cards)
6. Lokaler Content (stadtspezifisch)
7. Testimonial (echte Google-Bewertung)
8. Author Box (Eugen Beck)
9. Ablauf (3 Schritte)
10. FAQ (7 Fragen, stadtspezifisch)
11. Verwandte Seiten (Städte + Branchen/Services)
12. Google Maps Embed
13. Kontaktformular
14. Footer + Sticky CTA

### Branchen-Seiten Layout (~300 Zeilen, nur firmenrundgang)

Problem-Solution-Benefits-Flow:
1. Hero (branchenspezifisch)
2. Problem-Sektion (4 Pain Points)
3. Lösung + CTA
4. Stats (3 Kennzahlen)
5. Benefits-Grid (5 Cards)
6. USP-Sektion (4 Cards)
7. Ablauf (3 Schritte)
8. Live-Beispiel (Matterport-Link)
9. Trust-Sektion (5 Items)
10. Blog-Link
11. Author Box
12. FAQ (7 Fragen)
13. Verwandte Branchen + Städte
14. Kontaktformular

## Wichtige Unterschiede zwischen den Sites

| | 360-rundgang | firmenrundgang |
|---|---|---|
| **Blog-Index** | Hardcoded HTML-Cards | JS `blogPosts`-Array mit Filter-Buttons |
| **Featured-Artikel** | `.featured-article` CSS-Klasse | Erstes Array-Element + `blog-card--featured` |
| **Blog-Bilder** | Unsplash-URLs (direkt im `src`) | Lokale JPEGs unter `/images/blog/` (400x225) |
| **Hauptseite Blog** | Eigene statische Cards | Eigenes `blogPosts`-Array (muss manuell synchron gehalten werden) |
| **Fonts** | Inter + Merriweather | Nur Inter |
| **OG Tags** | Ja (vollständig) | Ja (vollständig) |
| **Branchen-Seiten** | Keine (hat Service-Seiten) | 8 Branchen-Landingpages |
| **Hero-Video** | Vimeo | Kein Video (Matterport-Demo im Hero) |

## Bilder & Assets

### firmenrundgang-karlsruhe.de/images/ (23 Dateien)
- `/blog/` — 15 Blog-Bilder (JPG, 400x225)
- `/logos/` — 4 Kundenlogos: BGS, ReMax, Burkart, PI (PNG)
- `eugen-beck.jpg` — Teamfoto
- `favicon-32x32.png`, `favicon-192x192.png`, `apple-touch-icon.png`
- `/og-image.jpg` — Social-Media-Vorschaubild (Root)

### 360-rundgang-karlsruhe.de/images/ (91 Dateien)
- Drohnen-/Luftbilder: `DJI_*`, `drohne-*`, `luftbild-*` (23+ JPGs)
- Referenzfotos: `referenz-baden-baden-*`, `referenz-forbach-*`, `referenz-heidelberg-*`
- Partner-Badges: `Matterport-Partner.jpeg`, `google-streetview-trusted-badge.jpg`
- Kundenlogos: `kunde-*.png` (4 Stück)
- Portraits: `eugen-beck-portrait.jpg`, `Eugen-beck-drohne.jpg`
- `/og-image.jpg` — Social-Media-Vorschaubild (Root)

### Drohnenfotos pro Stadt (360-rundgang)
| Stadt | Bild |
|-------|------|
| Ettlingen | `drohne-karlsruhe-01.jpg` |
| Bruchsal | `luftbild-01.jpg` |
| Rastatt | `luftbild-03.jpg` |
| Baden-Baden | `referenz-baden-baden-01.jpg` |
| Pforzheim | `luftbild-05.jpg` |
| Mannheim | `luftbild-07.jpg` |

## Befehle

### Blog-Automation (aus `beck360-blog-automation/`)

Env-Vars müssen geladen sein: `export $(cat .env | xargs)`

```bash
npm run dry-run:360       # Trockenlauf 360-rundgang (kein Git)
npm run dry-run:firmen    # Trockenlauf firmenrundgang (kein Git)
npm run generate:360      # Artikel generieren + PR erstellen
npm run generate:firmen   # Artikel generieren + PR erstellen
npm run generate:both     # Beide Projekte
```

### GitHub Actions manuell triggern

```bash
/opt/homebrew/Cellar/gh/2.87.0/bin/gh workflow run generate-blog.yml \
  -R EgBe-ui/beck360-blog-automation \
  -f project=both -f review_mode=pull-request
```

### Git-Operationen (je Site-Repo)

```bash
git add <datei> && git commit -m "Beschreibung" && git push origin main
```

Bei Konflikten (wenn Automation-PRs parallel gemergt wurden):
```bash
git pull --rebase origin main   # Dann Konflikte lösen
```

## Bekannte Fallstricke

- **Hauptseite blogPosts-Array (firmenrundgang):** Die Automation aktualisiert nur `blog/index.html`, NICHT `index.html`. Das blogPosts-Array auf der Hauptseite muss manuell aktualisiert werden, wenn neue Artikel erscheinen.
- **Unsplash-Duplikate (360-rundgang):** Die `image-handler.js` hat einen `PHOTO_POOL` mit 90+ Fotos in 16 Kategorien. `scanUsedImages()` prüft bestehende Artikel auf verwendete Bild-IDs. Trotzdem können Duplikate entstehen — nach Generierung immer prüfen.
- **gh CLI Pfad:** GitHub CLI ist unter `/opt/homebrew/Cellar/gh/2.87.0/bin/gh` installiert (Homebrew), nicht im Standard-PATH.
- **API Key laden:** Das Projekt nutzt kein `dotenv`. Vor lokalen Runs: `export $(cat .env | xargs)`.
- **Netlify Deploy-Zuordnung:** 360-rundgang = `amazing-kelpie-cd177b` (ID: `fdcaa0ba-...`), firmenrundgang = `glittering-genie-7273c9` (ID: `c33334a5-...`). Beide müssen auf das jeweils richtige GitHub-Repo zeigen.
- **Inline CSS:** Alle Seiten haben `<style>` im Head, kein externes Stylesheet. Bei Änderungen am Design muss jede Seite einzeln angepasst werden.
- **WebFetch Limitation:** WebFetch kann `<head>`-Meta-Tags nicht verifizieren (HTML-to-Markdown-Konvertierung entfernt sie). Für OG-Tag-Prüfung `curl -s URL | grep "og:"` nutzen.
- **FormSubmit.co:** Formulare senden an FormSubmit.co. Honeypot-Feld `_honey` muss immer dabei sein.

## Commit-History (relevante Änderungen)

### firmenrundgang-karlsruhe.de
```
0bf461f  Add branded German 404 page
4b14610  SEO: Add OG tags, blog schemas, internal linking, preconnect hints
f53088c  SEO: Add AggregateRating, author box, visible FAQ, internal linking to branch pages
987f534  SEO: Add AggregateRating, author box, internal linking, expanded FAQs (Stadt-Seiten)
2e3ccb2  Redesign 6 city landing pages: add Matterport demos, testimonials, FAQ, animations
6189a58  Add 14 landing pages, SEO improvements, and caching headers
5a5d5f3  Add Google Analytics 4 tracking
```

### 360-rundgang-karlsruhe.de
```
56c10b6  Add branded German 404 page
2ece28b  SEO: Add OG tags, blog schemas, internal linking, preconnect hints
bbe45ec  SEO: Add AggregateRating, author box, internal linking, expanded FAQs
d14e9ba  Redesign 6 city landing pages: add drone hero, Matterport demos, testimonials, FAQ
199ed60  Add 6 city landing pages, complete sitemap, and caching headers
26c180c  Add Google Analytics 4 tracking
```

## Sprache & Inhalt

Alle Websites und Blog-Artikel sind auf **Deutsch**. Region: Karlsruhe und Umgebung (Ettlingen, Bruchsal, Rastatt, Baden-Baden, Pforzheim, Mannheim). Commit-Messages dürfen Englisch sein.

## Kontaktdaten Beck360

- **Name**: Eugen Beck
- **Firma**: Beck360
- **Adresse**: Eichenweg 1, 76275 Ettlingen
- **Telefon**: +49 173 468 2501
- **E-Mail**: rundgang@beck360.de
- **Google-Bewertung**: 5.0 Sterne
