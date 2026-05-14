// === Batch 11 Gaps & Frontend Mounts ===
'use client';
import GapFeaturePage from '@/components/GapFeaturePage';
export default function GapCoatConditionMonitorPage() {
  return (
    <GapFeaturePage
      title="Coat-Condition Monitor"
      description="Coat-Condition Monitor"
      slug="coat-condition-monitor"
      aiResultKey="analysis"
      fields={[{"name":"petId","label":"Pet ID","required":true,"placeholder":""},{"name":"photoDescription","label":"Photo Description","type":"textarea","rows":4,"required":false}]}
    />
  );
}
