'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Bell, Send, Clock, AlertTriangle, CheckCircle, MessageSquare, Calendar, User, PawPrint, ArrowRight } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

interface Reminder {
  pet: {
    id: string
    name: string
    breed: { name: string; groomingFrequency: number | null }
    client: {
      id: string
      firstName: string
      lastName: string
      email: string
      phone: string
    }
  }
  type: string
  priority: string
  message: string
  daysSinceLastVisit: number | null
  daysOverdue: number | null
  lastAppointment?: any
}

export default function RemindersPage() {
  const router = useRouter()
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [sentReminders, setSentReminders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null)
  const [aiMessage, setAiMessage] = useState('')
  const [generatingMessage, setGeneratingMessage] = useState(false)
  const [sendingReminder, setSendingReminder] = useState(false)
  const [filterType, setFilterType] = useState<string | null>(null)

  useEffect(() => {
    fetchReminders()
  }, [])

  const fetchReminders = async () => {
    setLoading(true)
    try {
      const [pendingRes, sentRes] = await Promise.all([
        fetch('/api/reminders?type=pending'),
        fetch('/api/reminders?type=sent'),
      ])
      const pendingData = await pendingRes.json()
      const sentData = await sentRes.json()
      
      setReminders(pendingData.reminders || [])
      setSentReminders(sentData.sentReminders || [])
    } catch (error) {
      console.error('Failed to fetch reminders:', error)
    }
    setLoading(false)
  }

  const generateAiMessage = async (reminder: Reminder) => {
    setSelectedReminder(reminder)
    setGeneratingMessage(true)
    
    try {
      const res = await fetch('/api/ai/reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          petName: reminder.pet.name,
          clientName: `${reminder.pet.client.firstName} ${reminder.pet.client.lastName}`,
          breed: reminder.pet.breed.name,
          lastVisit: reminder.lastAppointment?.scheduledDate,
          daysOverdue: reminder.daysOverdue,
        }),
      })
      const data = await res.json()
      setAiMessage(data.message || `Hi ${reminder.pet.client.firstName}, it's time to schedule ${reminder.pet.name}'s next grooming appointment!`)
    } catch (error) {
      setAiMessage(`Hi ${reminder.pet.client.firstName}, it's time to schedule ${reminder.pet.name}'s next grooming appointment! We recommend booking soon to keep their coat healthy and looking great.`)
    }
    setGeneratingMessage(false)
  }

  const sendReminder = async () => {
    if (!selectedReminder) return
    setSendingReminder(true)

    try {
      await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          petId: selectedReminder.pet.id,
          clientId: selectedReminder.pet.client.id,
          message: aiMessage,
          type: selectedReminder.type,
        }),
      })
      toast.success('Reminder sent! Click "Sent History" tab to view.')
      setSelectedReminder(null)
      setAiMessage('')
      await fetchReminders()
    } catch (error) {
      toast.error('Failed to send reminder')
    }
    setSendingReminder(false)
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">High Priority</Badge>
      case 'medium':
        return <Badge variant="warning">Medium</Badge>
      default:
        return <Badge variant="secondary">Low</Badge>
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'OVERDUE':
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      case 'DUE':
        return <Clock className="h-5 w-5 text-yellow-500" />
      case 'UPCOMING':
        return <Calendar className="h-5 w-5 text-blue-500" />
      default:
        return <Bell className="h-5 w-5 text-gray-500" />
    }
  }

  const overdueCount = reminders.filter(r => r.type === 'OVERDUE').length
  const dueCount = reminders.filter(r => r.type === 'DUE').length
  const upcomingCount = reminders.filter(r => r.type === 'UPCOMING').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reminders</h1>
          <p className="text-gray-500">Manage grooming appointment reminders</p>
        </div>
      </div>

      {/* Stats - Clickable Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card
          className={`cursor-pointer transition-all hover:shadow-md ${filterType === 'OVERDUE' ? 'ring-2 ring-red-500' : ''}`}
          onClick={() => setFilterType(filterType === 'OVERDUE' ? null : 'OVERDUE')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{overdueCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-all hover:shadow-md ${filterType === 'DUE' ? 'ring-2 ring-yellow-500' : ''}`}
          onClick={() => setFilterType(filterType === 'DUE' ? null : 'DUE')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-yellow-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Due Now</p>
                <p className="text-2xl font-bold text-yellow-600">{dueCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-all hover:shadow-md ${filterType === 'UPCOMING' ? 'ring-2 ring-blue-500' : ''}`}
          onClick={() => setFilterType(filterType === 'UPCOMING' ? null : 'UPCOMING')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Upcoming</p>
                <p className="text-2xl font-bold text-blue-600">{upcomingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-default">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Sent Today</p>
                <p className="text-2xl font-bold text-green-600">
                  {sentReminders.filter(r =>
                    format(new Date(r.reminderSentAt), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                  ).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <Card>
              <CardHeader>
                <CardTitle>Pets Due for Grooming</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reminders.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>All caught up! No pending reminders.</p>
                    </div>
                  ) : (
                    (filterType ? reminders.filter(r => r.type === filterType) : reminders).map((reminder, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => router.push(`/pets/${reminder.pet.id}`)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <PawPrint className="h-5 w-5 text-primary-600" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{reminder.pet.name}</span>
                              <span className="text-gray-400">|</span>
                              <span className="text-gray-600">{reminder.pet.breed.name}</span>
                              {getTypeIcon(reminder.type)}
                            </div>
                            <p className="text-sm text-gray-500">
                              {reminder.pet.client.firstName} {reminder.pet.client.lastName}
                              {reminder.daysSinceLastVisit && ` - Last visit: ${reminder.daysSinceLastVisit} days ago`}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">{reminder.message}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                          {getPriorityBadge(reminder.priority)}
                          <Button size="sm" onClick={() => generateAiMessage(reminder)}>
                            <Send className="h-4 w-4 mr-1" />
                            Send Reminder
                          </Button>
                          <ArrowRight className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
      )}

      {/* Send Reminder Dialog with History */}
      <Dialog open={!!selectedReminder} onOpenChange={() => { setSelectedReminder(null); setAiMessage(''); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Send Reminder - {selectedReminder?.pet.name}
            </DialogTitle>
          </DialogHeader>
          {selectedReminder && (() => {
            // Filter sent reminders for this specific pet
            const petHistory = sentReminders.filter(r => r.pet.id === selectedReminder.pet.id)

            return (
              <Tabs defaultValue="send" className="flex-1 flex flex-col overflow-hidden">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="send" className="gap-2">
                    <Send className="h-4 w-4" />
                    Send New
                  </TabsTrigger>
                  <TabsTrigger value="history" className="gap-2">
                    <Clock className="h-4 w-4" />
                    History ({petHistory.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="send" className="flex-1 mt-4">
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">
                          {selectedReminder.pet.client.firstName} {selectedReminder.pet.client.lastName}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{selectedReminder.pet.client.email}</p>
                      <p className="text-sm text-gray-600">{selectedReminder.pet.client.phone}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">AI-Generated Message</label>
                      {generatingMessage ? (
                        <div className="p-4 border rounded-lg bg-gray-50 flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                          <span className="text-gray-500">Generating personalized message...</span>
                        </div>
                      ) : (
                        <textarea
                          className="w-full p-3 border rounded-lg min-h-[120px]"
                          value={aiMessage}
                          onChange={(e) => setAiMessage(e.target.value)}
                          placeholder="Message will appear here..."
                        />
                      )}
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <Button variant="outline" onClick={() => { setSelectedReminder(null); setAiMessage(''); }}>
                        Cancel
                      </Button>
                      <Button onClick={sendReminder} disabled={!aiMessage || sendingReminder}>
                        {sendingReminder ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Send Reminder
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="history" className="flex-1 overflow-auto mt-4">
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                    {petHistory.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Send className="h-10 w-10 mx-auto mb-3 opacity-50" />
                        <p>No reminders sent to {selectedReminder.pet.name} yet</p>
                      </div>
                    ) : (
                      petHistory.map((reminder) => (
                        <div
                          key={reminder.id}
                          className="p-3 rounded-lg border bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="font-medium text-sm">{reminder.pet.name}</span>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {reminder.type}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500 mb-1">
                            {format(new Date(reminder.reminderSentAt), 'MMM d, yyyy h:mm a')} via {reminder.sentVia}
                          </p>
                          {reminder.message && (
                            <p className="text-sm text-gray-600 italic line-clamp-2">"{reminder.message}"</p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            )
          })()}
        </DialogContent>
      </Dialog>
    </div>
  )
}
