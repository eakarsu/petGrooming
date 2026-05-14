// === Batch 11 Gaps & Frontend Mounts ===
'use client';
import GapFeaturePage from '@/components/GapFeaturePage';
export default function GapGroomingTimeEstimatorPage() {
  return (
    <GapFeaturePage
      title="Historical-Driven Grooming Time Estimator"
      description="Historical-Driven Grooming Time Estimator"
      slug="grooming-time-estimator"
      aiResultKey="estimate"
      fields={[{"name":"breed","label":"Breed","required":true,"placeholder":""},{"name":"coatCondition","label":"Coat Condition","required":false,"placeholder":""},{"name":"historyAvg","label":"Historical Avg (min)","type":"number"}]}
    />
  );
}
