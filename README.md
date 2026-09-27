# OVZA Trust Services — Landing Page

This is a static landing page for OVZA's trust registration service. It is built from the *OVZA Trust Services Design System v1.0* spec and uses no framework or build step.

```
index.html              page markup (11 sections + header/footer)
assets/css/styles.css   design tokens + components (CSS custom properties on :root)
assets/js/main.js       trust builder, FAQ accordion, mobile nav, scroll reveal
assets/img/favicon.svg
```

Preview locally:

```sh
python3 -m http.server 8000   # then open http://localhost:8000
```

## Sections

1. **Hero** — navy gradient, headline and CTAs, and the interactive trust builder. The builder has a jurisdiction selector, a trust name field, beneficiaries and an optional letter of wishes. It shows a live diagram and live prices, and the "Continue to Checkout" button submits it.
2. **A Trust That Continues to Work** — copy next to a timeline illustration.
3. **What Can You Do With a Trust?** — 6 feature cards.
4. **How a Trust Works** — the roles, plus an SVG structure diagram.
5. **Three Smart Steps** — step cards with a connector line (vertical on mobile).
6. **Jurisdictions** — 6 pricing cards. "Get started" pre-selects that jurisdiction in the hero builder.
7. **Trust Deed vs Letter of Wishes**
8. **What Can a Trust Hold?**
9. **More Than Trust Registration** — dark ecosystem band.
10. **FAQ** — accessible accordion with 8 questions.
11. **Final CTA**, followed by the footer.

## Editing prices

The jurisdiction cards in `index.html` (`data-jurisdiction`, `data-registration`, `data-renewal`, `data-days`, …) are the **single source of truth**. `main.js` reads them to fill the hero builder's dropdown and its prices. If you change a price, update the attribute and the visible `<dd>` text on the same card.

> ⚠️ The spec only confirms **Belize** pricing (USD 1,500 / 500, 10–15 days). The prices shown for BVI, Cayman Islands, Cook Islands, Nevis and Samoa are **placeholders** and must be confirmed before launch.

## Integration notes

- The builder submits to `/checkout/trust?jurisdiction=…&name=…` (see the form `action`). Its full state (including beneficiaries and wishes) is also saved in `sessionStorage` under `ovza-trust-builder`.
- Internal links (`/company-formation`, `/banking`, `/online-notary`, `/trusts/<country>`, `/track-order`, …) are assumed routes. Map them to the real ovza.com URLs.
- The logo mark is a placeholder SVG. Swap in the official OVZA logo asset.

## Accessibility (WCAG 2.1 AA items from the spec)

- Placeholder text uses `#718096`, which fixes the contrast issue flagged in the spec.
- The builder uses `aria-live` so diagram and price updates are announced.
- The FAQ uses `aria-expanded` / `aria-controls` and supports ↑/↓/Home/End keys.
- Name validation errors show an icon and text (not colour alone) and use `aria-invalid`.
- Also included: a skip link, a visible 3px teal focus ring, touch targets of at least 44px, `prefers-reduced-motion` support, and no horizontal scroll at 390px.
