// === Batch 11 Gaps & Frontend Mounts ===
'use client';
import GapFeaturePage from '@/components/GapFeaturePage';
export default function GapClientReviewsPage() {
  return (
    <GapFeaturePage
      title="Client Reviews/Ratings"
      description="Client Reviews/Ratings"
      slug="client-reviews"
      aiResultKey="review"
      fields={[{"name":"petId","label":"Pet ID","required":true,"placeholder":""},{"name":"rating","label":"Rating","type":"number"},{"name":"comment","label":"Comment","type":"textarea","rows":4,"required":false}]}
    />
  );
}
