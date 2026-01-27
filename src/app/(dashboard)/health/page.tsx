'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertTriangle,
  Syringe,
  FileText,
  Plus,
  CheckCircle,
  Clock,
  ClipboardList,
  Search,
  X,
  Eye,
  MapPin,
  User,
  Calendar,
  Sparkles,
} from 'lucide-react'
import { TableLoading } from '@/components/ui/loading'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

interface VaccinationAlert {
  id: string
  petName: string
  petId: string
  ownerName: string
  vaccineName: string
  expirationDate: string
  daysUntilExpiration: number
}

interface Incident {
  id: string
  title: string
  description: string
  incidentType: string
  severity: string
  isResolved: boolean
  createdAt: string
  reporter: { name: string }
}

interface HealthAlert {
  id: string
  petId: string
  pet: { name: string; client: { firstName: string; lastName: string } }
  alertType: string
  severity: string
  title: string
  description: string
  isResolved: boolean
  createdAt: string
}

interface Pet {
  id: string
  name: string
  client: { firstName: string; lastName: string }
}

interface VaccinationRecord {
  id: string
  petId: string
  pet: { name: string; client: { firstName: string; lastName: string } }
  vaccineName: string
  dateAdministered: string
  expirationDate: string | null
  veterinarian: string | null
  notes: string | null
  isVerified: boolean
}

export default function HealthSafetyPage() {
  const router = useRouter()
  const [vaccinationAlerts, setVaccinationAlerts] = useState<VaccinationAlert[]>([])
  const [vaccinationRecords, setVaccinationRecords] = useState<VaccinationRecord[]>([])
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [healthAlerts, setHealthAlerts] = useState<HealthAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [incidentDialogOpen, setIncidentDialogOpen] = useState(false)
  const [incidentForm, setIncidentForm] = useState({
    title: '',
    description: '',
    incidentType: 'OTHER',
    severity: 'LOW',
    location: '',
    actionsTaken: '',
  })
  const [activeTab, setActiveTab] = useState('vaccinations')
  const [pets, setPets] = useState<Pet[]>([])
  const [veterinarians, setVeterinarians] = useState<string[]>([])

  // Vaccination dialog state
  const [vaccinationDialogOpen, setVaccinationDialogOpen] = useState(false)
  const [vaccinationForm, setVaccinationForm] = useState({
    petId: '',
    vaccineName: '',
    dateAdministered: new Date().toISOString().split('T')[0],
    expirationDate: '',
    veterinarian: '',
    notes: '',
  })

  // Health alert dialog state
  const [healthAlertDialogOpen, setHealthAlertDialogOpen] = useState(false)
  const [healthAlertForm, setHealthAlertForm] = useState({
    petId: '',
    alertType: 'OTHER',
    severity: 'LOW',
    title: '',
    description: '',
  })

  // Search state
  const [searchVacAlerts, setSearchVacAlerts] = useState('')
  const [searchVacRecords, setSearchVacRecords] = useState('')
  const [searchHealthAlerts, setSearchHealthAlerts] = useState('')
  const [searchIncidents, setSearchIncidents] = useState('')

  // Detail dialog state
  const [selectedVacRecord, setSelectedVacRecord] = useState<VaccinationRecord | null>(null)
  const [selectedHealthAlert, setSelectedHealthAlert] = useState<HealthAlert | null>(null)
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
  const [selectedVacAlert, setSelectedVacAlert] = useState<VaccinationAlert | null>(null)

  // Reminder state
  const [sendingReminder, setSendingReminder] = useState<string | null>(null)
  const [reminderMessage, setReminderMessage] = useState<string | null>(null)
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false)

  // AI Analyze state
  const [analyzingHealth, setAnalyzingHealth] = useState<string | null>(null)
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null)
  const [aiAnalysisDialogOpen, setAiAnalysisDialogOpen] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [vacRes, vacRecordsRes, incRes, alertsRes, petsRes, vetsRes] = await Promise.all([
        fetch('/api/health/vaccination-alerts'),
        fetch('/api/health/vaccinations'),
        fetch('/api/health/incidents'),
        fetch('/api/health/alerts'),
        fetch('/api/pets'),
        fetch('/api/health/veterinarians'),
      ])

      if (vacRes.ok) setVaccinationAlerts(await vacRes.json())
      if (vacRecordsRes.ok) setVaccinationRecords(await vacRecordsRes.json())
      if (incRes.ok) setIncidents(await incRes.json())
      if (alertsRes.ok) setHealthAlerts(await alertsRes.json())
      if (petsRes.ok) {
        const petsData = await petsRes.json()
        setPets(petsData.pets || [])
      }
      if (vetsRes.ok) setVeterinarians(await vetsRes.json())
    } catch (error) {
      console.error('Failed to fetch health data:', error)
    } finally {
      setLoading(false)
    }
  }

  const createIncident = async () => {
    try {
      const res = await fetch('/api/health/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(incidentForm),
      })

      if (res.ok) {
        toast.success('Incident reported')
        setIncidentDialogOpen(false)
        setActiveTab('incidents')
        fetchData()
        setIncidentForm({
          title: '',
          description: '',
          incidentType: 'OTHER',
          severity: 'LOW',
          location: '',
          actionsTaken: '',
        })
      } else {
        toast.error('Failed to report incident')
      }
    } catch (error) {
      toast.error('Failed to report incident')
    }
  }

  const createVaccination = async () => {
    try {
      const res = await fetch('/api/health/vaccinations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vaccinationForm),
      })

      if (res.ok) {
        toast.success('Vaccination record added')
        setVaccinationDialogOpen(false)
        setActiveTab('records')
        fetchData()
        setVaccinationForm({
          petId: '',
          vaccineName: '',
          dateAdministered: new Date().toISOString().split('T')[0],
          expirationDate: '',
          veterinarian: '',
          notes: '',
        })
      } else {
        toast.error('Failed to add vaccination record')
      }
    } catch (error) {
      toast.error('Failed to add vaccination record')
    }
  }

  const createHealthAlert = async () => {
    try {
      const res = await fetch('/api/health/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(healthAlertForm),
      })

      if (res.ok) {
        toast.success('Health alert created')
        setHealthAlertDialogOpen(false)
        setActiveTab('health')
        fetchData()
        setHealthAlertForm({
          petId: '',
          alertType: 'OTHER',
          severity: 'LOW',
          title: '',
          description: '',
        })
      } else {
        toast.error('Failed to create health alert')
      }
    } catch (error) {
      toast.error('Failed to create health alert')
    }
  }

  const resolveAlert = async (alertId: string) => {
    try {
      const res = await fetch(`/api/health/alerts/${alertId}/resolve`, {
        method: 'PATCH',
      })

      if (res.ok) {
        toast.success('Alert resolved')
        fetchData()
      }
    } catch (error) {
      toast.error('Failed to resolve alert')
    }
  }

  const sendVaccinationReminder = async (alert: VaccinationAlert) => {
    setSendingReminder(alert.id)
    try {
      const response = await fetch('/api/ai/reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: alert.ownerName,
          petName: alert.petName,
          lastVisitDate: 'their last vaccination',
          recommendedServices: [`${alert.vaccineName} vaccination renewal`],
        }),
      })
      const data = await response.json()
      if (data.error) throw new Error(data.error)

      setReminderMessage(data.message || data.reminder || JSON.stringify(data))
      setReminderDialogOpen(true)
      toast.success('Reminder generated!')
    } catch (error) {
      toast.error('Failed to generate reminder')
      console.error(error)
    } finally {
      setSendingReminder(null)
    }
  }

  const analyzeHealthConcern = async (alert: HealthAlert) => {
    setAnalyzingHealth(alert.id)
    try {
      const response = await fetch('/api/ai/health-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          petName: alert.pet.name,
          symptoms: alert.description,
          alertType: alert.alertType,
          severity: alert.severity,
        }),
      })
      const data = await response.json()
      if (data.error) throw new Error(data.error)

      setAiAnalysis(data.analysis || data.recommendations || JSON.stringify(data))
      setAiAnalysisDialogOpen(true)
      toast.success('AI analysis complete!')
    } catch (error) {
      toast.error('Failed to analyze health concern')
      console.error(error)
    } finally {
      setAnalyzingHealth(null)
    }
  }

  const getSeverityBadge = (severity: string) => {
    const variants: Record<string, any> = {
      LOW: 'secondary',
      MEDIUM: 'warning',
      HIGH: 'destructive',
      CRITICAL: 'destructive',
    }
    return <Badge variant={variants[severity]}>{severity}</Badge>
  }

  // Filter functions
  const filteredVacAlerts = vaccinationAlerts.filter((alert) =>
    searchVacAlerts === '' ||
    alert.petName.toLowerCase().includes(searchVacAlerts.toLowerCase()) ||
    alert.ownerName.toLowerCase().includes(searchVacAlerts.toLowerCase()) ||
    alert.vaccineName.toLowerCase().includes(searchVacAlerts.toLowerCase())
  )

  const filteredVacRecords = vaccinationRecords.filter((record) =>
    searchVacRecords === '' ||
    record.pet.name.toLowerCase().includes(searchVacRecords.toLowerCase()) ||
    record.pet.client.firstName.toLowerCase().includes(searchVacRecords.toLowerCase()) ||
    record.pet.client.lastName.toLowerCase().includes(searchVacRecords.toLowerCase()) ||
    record.vaccineName.toLowerCase().includes(searchVacRecords.toLowerCase()) ||
    (record.veterinarian && record.veterinarian.toLowerCase().includes(searchVacRecords.toLowerCase()))
  )

  const filteredHealthAlerts = healthAlerts.filter((alert) =>
    searchHealthAlerts === '' ||
    alert.title.toLowerCase().includes(searchHealthAlerts.toLowerCase()) ||
    alert.pet.name.toLowerCase().includes(searchHealthAlerts.toLowerCase()) ||
    alert.pet.client.firstName.toLowerCase().includes(searchHealthAlerts.toLowerCase()) ||
    alert.alertType.toLowerCase().includes(searchHealthAlerts.toLowerCase())
  )

  const filteredIncidents = incidents.filter((incident) =>
    searchIncidents === '' ||
    incident.title.toLowerCase().includes(searchIncidents.toLowerCase()) ||
    incident.incidentType.toLowerCase().includes(searchIncidents.toLowerCase()) ||
    incident.reporter.name.toLowerCase().includes(searchIncidents.toLowerCase())
  )

  // Search input component
  const SearchInput = ({ value, onChange, placeholder, show }: {
    value: string
    onChange: (value: string) => void
    placeholder: string
    show: boolean
  }) => {
    if (!show) return null
    return (
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pl-9 pr-9"
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Health & Safety</h1>
          <p className="text-gray-500">Monitor pet health and manage incidents</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setVaccinationDialogOpen(true)}>
            <Syringe className="mr-2 h-4 w-4" />
            Add Vaccination
          </Button>
          <Button variant="outline" onClick={() => setHealthAlertDialogOpen(true)}>
            <AlertTriangle className="mr-2 h-4 w-4" />
            Health Alert
          </Button>
          <Button onClick={() => setIncidentDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Report Incident
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-yellow-100 p-2">
                <Syringe className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{vaccinationAlerts.length}</p>
                <p className="text-sm text-gray-500">Expiring Vaccinations</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-red-100 p-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {healthAlerts.filter((a) => !a.isResolved).length}
                </p>
                <p className="text-sm text-gray-500">Active Health Alerts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-orange-100 p-2">
                <FileText className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {incidents.filter((i) => !i.isResolved).length}
                </p>
                <p className="text-sm text-gray-500">Open Incidents</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="vaccinations">
            <Syringe className="mr-2 h-4 w-4" />
            Vaccination Alerts
          </TabsTrigger>
          <TabsTrigger value="records">
            <ClipboardList className="mr-2 h-4 w-4" />
            Vaccination Records
          </TabsTrigger>
          <TabsTrigger value="health">
            <AlertTriangle className="mr-2 h-4 w-4" />
            Health Alerts
          </TabsTrigger>
          <TabsTrigger value="incidents">
            <FileText className="mr-2 h-4 w-4" />
            Incidents
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vaccinations" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Expiring Vaccinations</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <TableLoading />
              ) : vaccinationAlerts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-2" />
                  <p>All vaccinations are up to date!</p>
                </div>
              ) : (
                <>
                  <SearchInput
                    value={searchVacAlerts}
                    onChange={setSearchVacAlerts}
                    placeholder="Search by pet, owner, or vaccine..."
                    show={vaccinationAlerts.length > 5}
                  />
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Pet</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Vaccine</TableHead>
                        <TableHead>Expires</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredVacAlerts.map((alert) => (
                        <TableRow
                          key={alert.id}
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => setSelectedVacAlert(alert)}
                        >
                          <TableCell>
                            <Link
                              href={`/pets/${alert.petId}`}
                              className="font-medium text-primary-600 hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {alert.petName}
                            </Link>
                          </TableCell>
                          <TableCell>{alert.ownerName}</TableCell>
                          <TableCell>{alert.vaccineName}</TableCell>
                          <TableCell>{formatDate(alert.expirationDate)}</TableCell>
                          <TableCell>
                            {alert.daysUntilExpiration <= 0 ? (
                              <Badge variant="destructive">Expired</Badge>
                            ) : alert.daysUntilExpiration <= 7 ? (
                              <Badge variant="warning">
                                {alert.daysUntilExpiration} days
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                {alert.daysUntilExpiration} days
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              loading={sendingReminder === alert.id}
                              onClick={(e) => {
                                e.stopPropagation()
                                sendVaccinationReminder(alert)
                              }}
                            >
                              Send Reminder
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {filteredVacAlerts.length === 0 && searchVacAlerts && (
                    <p className="text-center py-4 text-gray-500">No results found</p>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="records" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>All Vaccination Records</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <TableLoading />
              ) : vaccinationRecords.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Syringe className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                  <p>No vaccination records yet</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setVaccinationDialogOpen(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add First Vaccination
                  </Button>
                </div>
              ) : (
                <>
                  <SearchInput
                    value={searchVacRecords}
                    onChange={setSearchVacRecords}
                    placeholder="Search by pet, owner, vaccine, or vet..."
                    show={vaccinationRecords.length > 5}
                  />
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Pet</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Vaccine</TableHead>
                        <TableHead>Administered</TableHead>
                        <TableHead>Expires</TableHead>
                        <TableHead>Veterinarian</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredVacRecords.map((record) => {
                        const isExpired = record.expirationDate && new Date(record.expirationDate) < new Date()
                        const isExpiringSoon = record.expirationDate &&
                          new Date(record.expirationDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) &&
                          new Date(record.expirationDate) >= new Date()
                        return (
                          <TableRow
                            key={record.id}
                            className="cursor-pointer hover:bg-gray-50"
                            onClick={() => setSelectedVacRecord(record)}
                          >
                            <TableCell>
                              <Link
                                href={`/pets/${record.petId}`}
                                className="font-medium text-primary-600 hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {record.pet.name}
                              </Link>
                            </TableCell>
                            <TableCell>
                              {record.pet.client.firstName} {record.pet.client.lastName}
                            </TableCell>
                            <TableCell>{record.vaccineName}</TableCell>
                            <TableCell>{formatDate(record.dateAdministered)}</TableCell>
                            <TableCell>
                              {record.expirationDate ? formatDate(record.expirationDate) : '-'}
                            </TableCell>
                            <TableCell>{record.veterinarian || '-'}</TableCell>
                            <TableCell>
                              {isExpired ? (
                                <Badge variant="destructive">Expired</Badge>
                              ) : isExpiringSoon ? (
                                <Badge variant="warning">Expiring Soon</Badge>
                              ) : (
                                <Badge variant="success">Active</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                  {filteredVacRecords.length === 0 && searchVacRecords && (
                    <p className="text-center py-4 text-gray-500">No results found</p>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Health Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <TableLoading />
              ) : healthAlerts.length === 0 ? (
                <p className="text-center py-8 text-gray-500">No health alerts</p>
              ) : (
                <>
                  <SearchInput
                    value={searchHealthAlerts}
                    onChange={setSearchHealthAlerts}
                    placeholder="Search by title, pet, owner, or type..."
                    show={healthAlerts.length > 5}
                  />
                  <div className="space-y-4">
                    {filteredHealthAlerts.map((alert) => (
                      <div
                        key={alert.id}
                        className={`rounded-lg border p-4 cursor-pointer transition-colors ${
                          alert.isResolved ? 'bg-gray-50 hover:bg-gray-100' : 'bg-red-50 border-red-200 hover:bg-red-100'
                        }`}
                        onClick={() => setSelectedHealthAlert(alert)}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium">{alert.title}</p>
                              {getSeverityBadge(alert.severity)}
                              {alert.isResolved && (
                                <Badge variant="success">Resolved</Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">{alert.description}</p>
                            <p className="text-sm text-gray-500 mt-1">
                              Pet: {alert.pet.name} | Owner: {alert.pet.client.firstName}{' '}
                              {alert.pet.client.lastName}
                            </p>
                          </div>
                          {!alert.isResolved && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation()
                                resolveAlert(alert.id)
                              }}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Resolve
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {filteredHealthAlerts.length === 0 && searchHealthAlerts && (
                    <p className="text-center py-4 text-gray-500">No results found</p>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incidents" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Incident Reports</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <TableLoading />
              ) : incidents.length === 0 ? (
                <p className="text-center py-8 text-gray-500">No incidents reported</p>
              ) : (
                <>
                  <SearchInput
                    value={searchIncidents}
                    onChange={setSearchIncidents}
                    placeholder="Search by title, type, or reporter..."
                    show={incidents.length > 5}
                  />
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Reporter</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredIncidents.map((incident) => (
                        <TableRow
                          key={incident.id}
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => setSelectedIncident(incident)}
                        >
                          <TableCell>{formatDate(incident.createdAt)}</TableCell>
                          <TableCell>{incident.title}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {incident.incidentType.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>{getSeverityBadge(incident.severity)}</TableCell>
                          <TableCell>{incident.reporter.name}</TableCell>
                          <TableCell>
                            {incident.isResolved ? (
                              <Badge variant="success">Resolved</Badge>
                            ) : (
                              <Badge variant="warning">Open</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {filteredIncidents.length === 0 && searchIncidents && (
                    <p className="text-center py-4 text-gray-500">No results found</p>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Incident Dialog */}
      <Dialog open={incidentDialogOpen} onOpenChange={setIncidentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Incident</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={incidentForm.title}
                onChange={(e) =>
                  setIncidentForm({ ...incidentForm, title: e.target.value })
                }
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={incidentForm.incidentType}
                  onValueChange={(value) =>
                    setIncidentForm({ ...incidentForm, incidentType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PET_INJURY">Pet Injury</SelectItem>
                    <SelectItem value="STAFF_INJURY">Staff Injury</SelectItem>
                    <SelectItem value="EQUIPMENT_FAILURE">Equipment Failure</SelectItem>
                    <SelectItem value="ESCAPE_ATTEMPT">Escape Attempt</SelectItem>
                    <SelectItem value="AGGRESSION">Aggression</SelectItem>
                    <SelectItem value="ALLERGIC_REACTION">Allergic Reaction</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Severity</Label>
                <Select
                  value={incidentForm.severity}
                  onValueChange={(value) =>
                    setIncidentForm({ ...incidentForm, severity: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="CRITICAL">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea
                value={incidentForm.description}
                onChange={(e) =>
                  setIncidentForm({ ...incidentForm, description: e.target.value })
                }
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input
                value={incidentForm.location}
                onChange={(e) =>
                  setIncidentForm({ ...incidentForm, location: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Actions Taken</Label>
              <Textarea
                value={incidentForm.actionsTaken}
                onChange={(e) =>
                  setIncidentForm({ ...incidentForm, actionsTaken: e.target.value })
                }
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIncidentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createIncident}>Report Incident</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Vaccination Dialog */}
      <Dialog open={vaccinationDialogOpen} onOpenChange={setVaccinationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Vaccination Record</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Pet *</Label>
              <Select
                value={vaccinationForm.petId}
                onValueChange={(value) =>
                  setVaccinationForm({ ...vaccinationForm, petId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a pet" />
                </SelectTrigger>
                <SelectContent>
                  {pets.map((pet) => (
                    <SelectItem key={pet.id} value={pet.id}>
                      {pet.name} ({pet.client.firstName} {pet.client.lastName})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Vaccine Name *</Label>
              <Select
                value={vaccinationForm.vaccineName}
                onValueChange={(value) =>
                  setVaccinationForm({ ...vaccinationForm, vaccineName: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select vaccine" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Rabies">Rabies</SelectItem>
                  <SelectItem value="DHPP">DHPP (Distemper, Hepatitis, Parvo, Parainfluenza)</SelectItem>
                  <SelectItem value="Bordetella">Bordetella (Kennel Cough)</SelectItem>
                  <SelectItem value="Leptospirosis">Leptospirosis</SelectItem>
                  <SelectItem value="Lyme Disease">Lyme Disease</SelectItem>
                  <SelectItem value="Canine Influenza">Canine Influenza</SelectItem>
                  <SelectItem value="FVRCP">FVRCP (Feline Distemper)</SelectItem>
                  <SelectItem value="FeLV">FeLV (Feline Leukemia)</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Date Administered *</Label>
                <Input
                  type="date"
                  value={vaccinationForm.dateAdministered}
                  onChange={(e) =>
                    setVaccinationForm({ ...vaccinationForm, dateAdministered: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Expiration Date</Label>
                <Input
                  type="date"
                  value={vaccinationForm.expirationDate}
                  onChange={(e) =>
                    setVaccinationForm({ ...vaccinationForm, expirationDate: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Veterinarian</Label>
              {veterinarians.length > 0 ? (
                <Select
                  value={vaccinationForm.veterinarian}
                  onValueChange={(value) =>
                    setVaccinationForm({ ...vaccinationForm, veterinarian: value === '__other__' ? '' : value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select veterinarian" />
                  </SelectTrigger>
                  <SelectContent>
                    {veterinarians.map((vet) => (
                      <SelectItem key={vet} value={vet}>
                        {vet}
                      </SelectItem>
                    ))}
                    <SelectItem value="__other__">Other (type below)</SelectItem>
                  </SelectContent>
                </Select>
              ) : null}
              {(veterinarians.length === 0 || vaccinationForm.veterinarian === '') && (
                <Input
                  value={vaccinationForm.veterinarian}
                  onChange={(e) =>
                    setVaccinationForm({ ...vaccinationForm, veterinarian: e.target.value })
                  }
                  placeholder="Enter vet name or clinic"
                  className={veterinarians.length > 0 ? 'mt-2' : ''}
                />
              )}
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={vaccinationForm.notes}
                onChange={(e) =>
                  setVaccinationForm({ ...vaccinationForm, notes: e.target.value })
                }
                rows={2}
                placeholder="Any additional notes..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVaccinationDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createVaccination}>Add Vaccination</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Health Alert Dialog */}
      <Dialog open={healthAlertDialogOpen} onOpenChange={setHealthAlertDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Health Alert</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Pet *</Label>
              <Select
                value={healthAlertForm.petId}
                onValueChange={(value) =>
                  setHealthAlertForm({ ...healthAlertForm, petId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a pet" />
                </SelectTrigger>
                <SelectContent>
                  {pets.map((pet) => (
                    <SelectItem key={pet.id} value={pet.id}>
                      {pet.name} ({pet.client.firstName} {pet.client.lastName})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={healthAlertForm.title}
                onChange={(e) =>
                  setHealthAlertForm({ ...healthAlertForm, title: e.target.value })
                }
                placeholder="Brief description of the alert"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Alert Type</Label>
                <Select
                  value={healthAlertForm.alertType}
                  onValueChange={(value) =>
                    setHealthAlertForm({ ...healthAlertForm, alertType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HEALTH_CONDITION">Health Condition</SelectItem>
                    <SelectItem value="SKIN_ISSUE">Skin Issue</SelectItem>
                    <SelectItem value="COAT_ISSUE">Coat Issue</SelectItem>
                    <SelectItem value="BEHAVIOR_CONCERN">Behavior Concern</SelectItem>
                    <SelectItem value="INJURY">Injury</SelectItem>
                    <SelectItem value="ALLERGY">Allergy</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Severity</Label>
                <Select
                  value={healthAlertForm.severity}
                  onValueChange={(value) =>
                    setHealthAlertForm({ ...healthAlertForm, severity: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="CRITICAL">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea
                value={healthAlertForm.description}
                onChange={(e) =>
                  setHealthAlertForm({ ...healthAlertForm, description: e.target.value })
                }
                rows={3}
                placeholder="Detailed description of the health concern..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHealthAlertDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createHealthAlert}>Create Alert</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Vaccination Alert Detail Dialog */}
      <Dialog open={!!selectedVacAlert} onOpenChange={() => setSelectedVacAlert(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vaccination Alert Details</DialogTitle>
          </DialogHeader>
          {selectedVacAlert && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Pet</p>
                  <p className="font-medium">{selectedVacAlert.petName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Owner</p>
                  <p className="font-medium">{selectedVacAlert.ownerName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Vaccine</p>
                  <p className="font-medium">{selectedVacAlert.vaccineName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Expiration Date</p>
                  <p className="font-medium">{formatDate(selectedVacAlert.expirationDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  {selectedVacAlert.daysUntilExpiration <= 0 ? (
                    <Badge variant="destructive">Expired</Badge>
                  ) : selectedVacAlert.daysUntilExpiration <= 7 ? (
                    <Badge variant="warning">{selectedVacAlert.daysUntilExpiration} days left</Badge>
                  ) : (
                    <Badge variant="secondary">{selectedVacAlert.daysUntilExpiration} days left</Badge>
                  )}
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Link href={`/pets/${selectedVacAlert.petId}`}>
                  <Button variant="outline">
                    <Eye className="mr-2 h-4 w-4" />
                    View Pet
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  loading={sendingReminder === selectedVacAlert.id}
                  onClick={() => sendVaccinationReminder(selectedVacAlert)}
                >
                  Send Reminder
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reminder Message Dialog */}
      <Dialog open={reminderDialogOpen} onOpenChange={setReminderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generated Reminder Message</DialogTitle>
          </DialogHeader>
          {reminderMessage && (
            <div className="space-y-4">
              <div className="rounded-lg bg-blue-50 p-4">
                <p className="text-sm text-blue-800 whitespace-pre-wrap">{reminderMessage}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(reminderMessage)
                    toast.success('Copied to clipboard!')
                  }}
                >
                  Copy to Clipboard
                </Button>
                <Button onClick={() => setReminderDialogOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Vaccination Record Detail Dialog */}
      <Dialog open={!!selectedVacRecord} onOpenChange={() => setSelectedVacRecord(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vaccination Record Details</DialogTitle>
          </DialogHeader>
          {selectedVacRecord && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Pet</p>
                  <p className="font-medium">{selectedVacRecord.pet.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Owner</p>
                  <p className="font-medium">
                    {selectedVacRecord.pet.client.firstName} {selectedVacRecord.pet.client.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Vaccine</p>
                  <p className="font-medium">{selectedVacRecord.vaccineName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date Administered</p>
                  <p className="font-medium">{formatDate(selectedVacRecord.dateAdministered)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Expiration Date</p>
                  <p className="font-medium">
                    {selectedVacRecord.expirationDate ? formatDate(selectedVacRecord.expirationDate) : 'Not specified'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Veterinarian</p>
                  <p className="font-medium">{selectedVacRecord.veterinarian || 'Not specified'}</p>
                </div>
              </div>
              {selectedVacRecord.notes && (
                <div>
                  <p className="text-sm text-gray-500">Notes</p>
                  <p className="font-medium">{selectedVacRecord.notes}</p>
                </div>
              )}
              <div className="flex gap-2 pt-4">
                <Link href={`/pets/${selectedVacRecord.petId}`}>
                  <Button variant="outline">
                    <Eye className="mr-2 h-4 w-4" />
                    View Pet
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Health Alert Detail Dialog */}
      <Dialog open={!!selectedHealthAlert} onOpenChange={() => setSelectedHealthAlert(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Health Alert Details</DialogTitle>
          </DialogHeader>
          {selectedHealthAlert && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-medium">{selectedHealthAlert.title}</h3>
                {getSeverityBadge(selectedHealthAlert.severity)}
                {selectedHealthAlert.isResolved && <Badge variant="success">Resolved</Badge>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Pet</p>
                  <p className="font-medium">{selectedHealthAlert.pet.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Owner</p>
                  <p className="font-medium">
                    {selectedHealthAlert.pet.client.firstName} {selectedHealthAlert.pet.client.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Alert Type</p>
                  <p className="font-medium">{selectedHealthAlert.alertType.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Created</p>
                  <p className="font-medium">{formatDate(selectedHealthAlert.createdAt)}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Description</p>
                <p className="font-medium">{selectedHealthAlert.description}</p>
              </div>
              <div className="flex gap-2 pt-4">
                <Link href={`/pets/${selectedHealthAlert.petId}`}>
                  <Button variant="outline">
                    <Eye className="mr-2 h-4 w-4" />
                    View Pet
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  loading={analyzingHealth === selectedHealthAlert.id}
                  onClick={() => analyzeHealthConcern(selectedHealthAlert)}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  AI Analyze
                </Button>
                {!selectedHealthAlert.isResolved && (
                  <Button
                    onClick={() => {
                      resolveAlert(selectedHealthAlert.id)
                      setSelectedHealthAlert(null)
                    }}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Resolve Alert
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Incident Detail Dialog */}
      <Dialog open={!!selectedIncident} onOpenChange={() => setSelectedIncident(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Incident Details</DialogTitle>
          </DialogHeader>
          {selectedIncident && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-medium">{selectedIncident.title}</h3>
                {getSeverityBadge(selectedIncident.severity)}
                {selectedIncident.isResolved ? (
                  <Badge variant="success">Resolved</Badge>
                ) : (
                  <Badge variant="warning">Open</Badge>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Type</p>
                  <p className="font-medium">{selectedIncident.incidentType.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Reporter</p>
                  <p className="font-medium">{selectedIncident.reporter.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium">{formatDate(selectedIncident.createdAt)}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Description</p>
                <p className="font-medium">{selectedIncident.description}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* AI Analysis Dialog */}
      <Dialog open={aiAnalysisDialogOpen} onOpenChange={setAiAnalysisDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary-600" />
              AI Health Analysis
            </DialogTitle>
          </DialogHeader>
          {aiAnalysis && (
            <div className="space-y-4">
              <div className="rounded-lg bg-purple-50 p-4 border border-purple-200">
                <p className="text-sm text-purple-800 whitespace-pre-wrap">{aiAnalysis}</p>
              </div>
              <p className="text-xs text-gray-500">
                Note: This AI analysis is for informational purposes only and should not replace professional veterinary advice.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(aiAnalysis)
                    toast.success('Copied to clipboard!')
                  }}
                >
                  Copy to Clipboard
                </Button>
                <Button onClick={() => setAiAnalysisDialogOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
