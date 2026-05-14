// === Batch 11 Gaps & Frontend Mounts ===
'use client';
import GapFeaturePage from '@/components/GapFeaturePage';
export default function GapMobileGroomerPage() {
  return (
    <GapFeaturePage
      title="Mobile Groomer App"
      description="Mobile Groomer App"
      slug="mobile-groomer"
      aiResultKey="checkIn"
      fields={[{"name":"groomerId","label":"Groomer ID","required":true,"placeholder":""},{"name":"petId","label":"Pet ID","required":false,"placeholder":""},{"name":"phase","label":"Phase","required":false,"placeholder":""}]}
    />
  );
}
