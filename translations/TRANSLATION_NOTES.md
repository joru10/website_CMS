# Translation Style Guide

This document defines translation rules for the RapidAI website. Keep translations clear, natural, and consistent across the site.

## Spanish (Spain)
- Tone: tuteo (informal "tú").
- Register: natural, professional, approachable.
- Casing: sentence case for most UI text.
- Vocabulary:
  - "pymes" in lowercase.
  - Prefer "análisis" over "ideas" for insights.
  - Prefer "Empieza aquí" for "Get Started".
  - "Consulta gratuita" for free consultation.
- Numbers & stats:
  - Align with EN: "50% más rápido".
- Examples:
  - process-title: "Implementa IA con velocidad, precisión y confianza"
  - newsletter-placeholder: "Introduce tu correo de empresa"
  - footer-blog: "Análisis y perspectivas"

## French (France)
- Tone: standard professional.
- Casing: sentence case for most UI text.
- Phrasing:
  - "Mise en œuvre rapide de l’IA"
  - "Témoignages" for testimonials.
  - Use proper typography: apostrophe ’, and non‑breaking space before : ; ! ? where applicable when feasible.
- Numbers & stats:
  - Align with EN: "50 % plus rapide" (thin space before % if typography allows).
- Examples:
  - process-title: "Implémentez l'IA avec vitesse, précision et confiance"
  - newsletter-join: "S’inscrire gratuitement"
  - resources-newsletter-title: "Ressources et mises à jour sur l’IA"

## General Rules
- Do not override translation-controlled labels in JS; only update values/URLs.
- Keep keys identical across locales; do not delete keys.
- Prefer sentence case over Title Case in ES/FR.
- Avoid Latin American variants in ES (use Spanish from Spain).

## Workflow
1. Update `translations/en.json` keys as source of truth.
2. Mirror keys in `translations/es.json` and `translations/fr.json`.
3. Review casing and vocabulary per sections above.
4. Test pages in all languages and check for layout overflow.
