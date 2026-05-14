// === Batch 11 Gaps & Frontend Mounts ===
'use client';
import GapFeaturePage from '@/components/GapFeaturePage';
export default function GapMultiLocationPage() {
  return (
    <GapFeaturePage
      title="Multi-Location Support"
      description="Multi-Location Support"
      slug="multi-location"
      aiResultKey="location"
      fields={[{"name":"locationId","label":"Location ID","required":true,"placeholder":""},{"name":"city","label":"City","required":false,"placeholder":""}]}
    />
  );
}
