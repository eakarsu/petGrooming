'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Syringe, Heart, Shield } from 'lucide-react'

interface MedicalCardProps {
  allergies?: string | null
  specialNeeds?: string | null
  activeAlerts: number
  expiredVaccinations: number
  upToDateVaccinations: number
}

export function MedicalCard({
  allergies,
  specialNeeds,
  activeAlerts,
  expiredVaccinations,
  upToDateVaccinations,
}: MedicalCardProps) {
  const hasAllergies = allergies && allergies.trim().length > 0
  const hasSpecialNeeds = specialNeeds && specialNeeds.trim().length > 0

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Heart className="h-5 w-5 text-red-500" />
          Health Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Alerts Section */}
        {(hasAllergies || hasSpecialNeeds || activeAlerts > 0) && (
          <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
            <div className="flex items-center gap-2 text-yellow-700 font-medium mb-2">
              <AlertTriangle className="h-4 w-4" />
              Important Notes
            </div>
            {hasAllergies && (
              <div className="text-sm mb-1">
                <span className="font-medium text-red-600">Allergies:</span>{' '}
                <span className="text-gray-700">{allergies}</span>
              </div>
            )}
            {hasSpecialNeeds && (
              <div className="text-sm mb-1">
                <span className="font-medium text-orange-600">Special Needs:</span>{' '}
                <span className="text-gray-700">{specialNeeds}</span>
              </div>
            )}
            {activeAlerts > 0 && (
              <div className="text-sm">
                <Badge variant="destructive" className="text-xs">
                  {activeAlerts} active health alert{activeAlerts > 1 ? 's' : ''}
                </Badge>
              </div>
            )}
          </div>
        )}

        {/* Vaccination Status */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
          <div className="flex items-center gap-2">
            <Syringe className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium">Vaccinations</span>
          </div>
          <div className="flex gap-2">
            {upToDateVaccinations > 0 && (
              <Badge variant="outline" className="text-green-600 border-green-200">
                <Shield className="h-3 w-3 mr-1" />
                {upToDateVaccinations} current
              </Badge>
            )}
            {expiredVaccinations > 0 && (
              <Badge variant="destructive">
                {expiredVaccinations} expired
              </Badge>
            )}
            {upToDateVaccinations === 0 && expiredVaccinations === 0 && (
              <Badge variant="secondary">No records</Badge>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="p-2 rounded-lg bg-green-50">
            <div className="text-2xl font-bold text-green-600">{upToDateVaccinations}</div>
            <div className="text-xs text-gray-500">Up to Date</div>
          </div>
          <div className="p-2 rounded-lg bg-red-50">
            <div className="text-2xl font-bold text-red-600">{activeAlerts}</div>
            <div className="text-xs text-gray-500">Active Alerts</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
