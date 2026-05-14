# Audit Note - petGrooming

Source: `_AUDIT/reports/batch_11.md` (lines 391-428).

## Original Audit Recommendations

### Missing AI Counterparts
- Coat-condition assessment from photos.
- Allergy/health risk prediction.
- Grooming time estimation from pet profile.

(NOTE: The repo already has 19 AI endpoints under `/api/ai/*`, including `appointment-estimate`, `behavior-analyze`, `breed-identify`, `health-analyze`, `style-suggest`, `style-preview`, etc. Allergy/health risk and grooming time are largely covered by the existing `health-analyze` and `appointment-estimate` endpoints.)

### Missing Non-AI Features
- Review/ratings system.
- Staff management.
- Multi-location support.
- Stripe payment processing.

### Custom Feature Suggestions
1. AI Grooming Style Recommendation.
2. Health Risk Flagging.
3. Automated Reminders.
4. Demand Forecasting.
5. Groomer Performance Dashboard.
6. Retail Upsell Recommendations.

## Implementations Applied

Added a new helper `assessCoatCondition(imageBase64)` in `src/lib/openrouter.ts` (uses existing `callOpenRouterVision` helper) and a Next.js API route at `src/app/api/ai/coat-condition/route.ts` using the existing `withAI<...>` wrapper, matching the repo's existing thin-route pattern.

- `POST /api/ai/coat-condition` — JSON `{ image: base64 }` returns structured coat condition assessment.

No new dependencies; conventions match existing files (no semicolons, withAI wrapper, JSON-only LLM output with safe fallback).

## Backlog (Prioritized)

### High
- Stripe payment processing on POS.
- Staff management (groomer schedules, payroll).
- Review/ratings system.

### Medium
- Multi-location support (data model adjustments).
- Demand forecasting for staffing.
- Groomer performance dashboard.

### Low / Product Decisions
- White-label / multi-tenant marketplace.
- Retail upsell recommendation tied to coat-condition output.

## Apply pass 3 (frontend)

LEFT-AS-IS. The pass-2 endpoint `/api/ai/coat-condition` already has a dedicated dashboard page at `src/app/(dashboard)/coat-condition/page.tsx` with image upload (≤6MB), loading/result/error states, and a sidebar link in `src/components/layout/sidebar.tsx`. Other AI features each have their own page. No changes made (idempotence).

## Apply pass 4 (mechanical backlog)

SKIPPED. Backlog items (Stripe POS, staff/payroll, reviews, multi-location, demand forecasting, performance dashboard, white-label, retail upsell tied to coat-condition) are all NEEDS-CREDS, NEEDS-PRODUCT-DECISION, or large refactors. The repo already has 19 AI endpoints, exceeding coverage thresholds. No mechanical, single-LLM-endpoint items remain. No changes made.
