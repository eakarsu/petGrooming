// === Batch 11 Gaps & Frontend Mounts ===
'use client';
import GapFeaturePage from '@/components/GapFeaturePage';
export default function GapGroomingChurnPredictionPage() {
  return (
    <GapFeaturePage
      title="Grooming Churn Prediction"
      description="Grooming Churn Prediction"
      slug="grooming-churn-prediction"
      aiResultKey="risk"
      fields={[{"name":"clientId","label":"Client ID","required":true,"placeholder":""},{"name":"daysSinceLastAppt","label":"Days Since Last Appt","type":"number"}]}
    />
  );
}
