'use client'

import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { 
  Syringe, 
  AlertTriangle, 
  FileText, 
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react'

interface TimelineEvent {
  id: string
  type: 'vaccination' | 'alert' | 'note' | 'incident'
  title: string
  description: string
  date: Date
  severity?: string
  isResolved?: boolean
  category?: string
}

interface MedicalTimelineProps {
  events: TimelineEvent[]
}

export function MedicalTimeline({ events }: MedicalTimelineProps) {
  const sortedEvents = [...events].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'vaccination':
        return <Syringe className="h-4 w-4" />
      case 'alert':
        return <AlertTriangle className="h-4 w-4" />
      case 'note':
        return <FileText className="h-4 w-4" />
      case 'incident':
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getEventColor = (type: string, severity?: string) => {
    if (severity === 'HIGH' || severity === 'CRITICAL') return 'bg-red-100 text-red-600 border-red-200'
    if (severity === 'MEDIUM') return 'bg-yellow-100 text-yellow-600 border-yellow-200'
    
    switch (type) {
      case 'vaccination':
        return 'bg-blue-100 text-blue-600 border-blue-200'
      case 'alert':
        return 'bg-orange-100 text-orange-600 border-orange-200'
      case 'note':
        return 'bg-purple-100 text-purple-600 border-purple-200'
      case 'incident':
        return 'bg-red-100 text-red-600 border-red-200'
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200'
    }
  }

  const getSeverityBadge = (severity?: string) => {
    if (!severity) return null
    switch (severity) {
      case 'CRITICAL':
        return <Badge variant="destructive">Critical</Badge>
      case 'HIGH':
        return <Badge variant="destructive">High</Badge>
      case 'MEDIUM':
        return <Badge variant="warning">Medium</Badge>
      default:
        return <Badge variant="secondary">Low</Badge>
    }
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No medical history recorded</p>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

      <div className="space-y-4">
        {sortedEvents.map((event) => (
          <div key={event.id} className="relative pl-10">
            <div className={`absolute left-0 p-2 rounded-full border ${getEventColor(event.type, event.severity)}`}>
              {getEventIcon(event.type)}
            </div>

            <div className="bg-white p-4 rounded-lg border shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-medium">{event.title}</h4>
                    {getSeverityBadge(event.severity)}
                    {event.isResolved !== undefined && (
                      event.isResolved ? (
                        <Badge variant="outline" className="text-green-600 border-green-200">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Resolved
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-orange-600 border-orange-200">
                          Active
                        </Badge>
                      )
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                  {event.category && (
                    <span className="text-xs text-gray-400 mt-2 block">
                      Category: {event.category}
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap">
                  {format(new Date(event.date), 'MMM d, yyyy')}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
