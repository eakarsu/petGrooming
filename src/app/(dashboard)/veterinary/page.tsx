'use client'

import { useEffect, useState } from 'react'
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
  Stethoscope,
  Pill,
  TestTube,
  Scissors,
  Plus,
  Search,
  X,
  Eye,
  Trash2,
  FileText,
  Activity,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react'
import { TableLoading } from '@/components/ui/loading'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

interface Pet {
  id: string
  name: string
  species: string
  breed: { name: string }
  client: { firstName: string; lastName: string }
}

interface MedicalRecord {
  id: string
  petId: string
  pet: Pet
  vetName: string
  recordDate: string
  diagnosis: string
  symptoms: string
  treatment: string
  followUp: string | null
  notes: string | null
  createdAt: string
}

interface Prescription {
  id: string
  petId: string
  pet: Pet
  vetName: string
  medication: string
  dosage: string
  frequency: string
  duration: string
  prescribedDate: string
  status: string
  instructions: string | null
  notes: string | null
}

interface LabResult {
  id: string
  petId: string
  pet: Pet
  testName: string
  testType: string
  testDate: string
  results: string
  normalRange: string | null
  status: string
  orderedBy: string | null
  notes: string | null
}

interface SurgeryRecord {
  id: string
  petId: string
  pet: Pet
  surgeonName: string
  surgeryDate: string
  surgeryType: string
  anesthesiaType: string | null
  duration: string | null
  status: string
  preOpNotes: string | null
  postOpNotes: string | null
  complications: string | null
  notes: string | null
}

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-blue-100 text-blue-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  SCHEDULED: 'bg-purple-100 text-purple-800',
  IN_PROGRESS: 'bg-orange-100 text-orange-800',
}

export default function VeterinaryPage() {
  const [activeTab, setActiveTab] = useState('medical-records')
  const [pets, setPets] = useState<Pet[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Medical Records
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([])
  const [mrDialogOpen, setMrDialogOpen] = useState(false)
  const [mrForm, setMrForm] = useState({
    petId: '', vetName: '', recordDate: '', diagnosis: '', symptoms: '', treatment: '', followUp: '', notes: '',
  })

  // Prescriptions
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [rxDialogOpen, setRxDialogOpen] = useState(false)
  const [rxForm, setRxForm] = useState({
    petId: '', vetName: '', medication: '', dosage: '', frequency: '', duration: '', prescribedDate: '', status: 'ACTIVE', instructions: '', notes: '',
  })

  // Lab Results
  const [labResults, setLabResults] = useState<LabResult[]>([])
  const [labDialogOpen, setLabDialogOpen] = useState(false)
  const [labForm, setLabForm] = useState({
    petId: '', testName: '', testType: '', testDate: '', results: '', normalRange: '', status: 'PENDING', orderedBy: '', notes: '',
  })

  // Surgeries
  const [surgeries, setSurgeries] = useState<SurgeryRecord[]>([])
  const [surgDialogOpen, setSurgDialogOpen] = useState(false)
  const [surgForm, setSurgForm] = useState({
    petId: '', surgeonName: '', surgeryDate: '', surgeryType: '', anesthesiaType: '', duration: '', status: 'SCHEDULED', preOpNotes: '', postOpNotes: '', complications: '', notes: '',
  })

  // Detail view
  const [detailDialog, setDetailDialog] = useState<{ open: boolean; type: string; data: any }>({ open: false, type: '', data: null })

  useEffect(() => {
    fetchPets()
    fetchAll()
  }, [])

  async function fetchPets() {
    try {
      const res = await fetch('/api/pets')
      if (res.ok) {
        const data = await res.json()
        setPets(data.pets || data)
      }
    } catch (e) {
      console.error('Failed to fetch pets', e)
    }
  }

  async function fetchAll() {
    setLoading(true)
    await Promise.all([fetchMedicalRecords(), fetchPrescriptions(), fetchLabResults(), fetchSurgeries()])
    setLoading(false)
  }

  async function fetchMedicalRecords() {
    try {
      const res = await fetch('/api/medical-records')
      if (res.ok) {
        const data = await res.json()
        setMedicalRecords(data)
      }
    } catch { /* ignore */ }
  }

  async function fetchPrescriptions() {
    try {
      const res = await fetch('/api/prescriptions')
      if (res.ok) {
        const data = await res.json()
        setPrescriptions(data)
      }
    } catch { /* ignore */ }
  }

  async function fetchLabResults() {
    try {
      const res = await fetch('/api/lab-results')
      if (res.ok) {
        const data = await res.json()
        setLabResults(data)
      }
    } catch { /* ignore */ }
  }

  async function fetchSurgeries() {
    try {
      const res = await fetch('/api/surgeries')
      if (res.ok) {
        const data = await res.json()
        setSurgeries(data)
      }
    } catch { /* ignore */ }
  }

  // Create handlers
  async function createMedicalRecord() {
    if (!mrForm.petId || !mrForm.diagnosis || !mrForm.symptoms || !mrForm.treatment) {
      toast.error('Pet, diagnosis, symptoms, and treatment are required')
      return
    }
    try {
      const res = await fetch('/api/medical-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...mrForm,
          recordDate: mrForm.recordDate || new Date().toISOString(),
        }),
      })
      if (res.ok) {
        toast.success('Medical record created')
        setMrDialogOpen(false)
        setMrForm({ petId: '', vetName: '', recordDate: '', diagnosis: '', symptoms: '', treatment: '', followUp: '', notes: '' })
        fetchMedicalRecords()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to create record')
      }
    } catch { toast.error('Failed to create record') }
  }

  async function createPrescription() {
    if (!rxForm.petId || !rxForm.medication || !rxForm.dosage || !rxForm.frequency) {
      toast.error('Pet, medication, dosage, and frequency are required')
      return
    }
    try {
      const res = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...rxForm,
          prescribedDate: rxForm.prescribedDate || new Date().toISOString(),
        }),
      })
      if (res.ok) {
        toast.success('Prescription created')
        setRxDialogOpen(false)
        setRxForm({ petId: '', vetName: '', medication: '', dosage: '', frequency: '', duration: '', prescribedDate: '', status: 'ACTIVE', instructions: '', notes: '' })
        fetchPrescriptions()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to create prescription')
      }
    } catch { toast.error('Failed to create prescription') }
  }

  async function createLabResult() {
    if (!labForm.petId || !labForm.testName || !labForm.testType) {
      toast.error('Pet, test name, and test type are required')
      return
    }
    try {
      const res = await fetch('/api/lab-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...labForm,
          testDate: labForm.testDate || new Date().toISOString(),
        }),
      })
      if (res.ok) {
        toast.success('Lab result created')
        setLabDialogOpen(false)
        setLabForm({ petId: '', testName: '', testType: '', testDate: '', results: '', normalRange: '', status: 'PENDING', orderedBy: '', notes: '' })
        fetchLabResults()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to create lab result')
      }
    } catch { toast.error('Failed to create lab result') }
  }

  async function createSurgery() {
    if (!surgForm.petId || !surgForm.surgeryType || !surgForm.surgeonName) {
      toast.error('Pet, surgery type, and surgeon are required')
      return
    }
    try {
      const res = await fetch('/api/surgeries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...surgForm,
          surgeryDate: surgForm.surgeryDate || new Date().toISOString(),
        }),
      })
      if (res.ok) {
        toast.success('Surgery record created')
        setSurgDialogOpen(false)
        setSurgForm({ petId: '', surgeonName: '', surgeryDate: '', surgeryType: '', anesthesiaType: '', duration: '', status: 'SCHEDULED', preOpNotes: '', postOpNotes: '', complications: '', notes: '' })
        fetchSurgeries()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to create surgery record')
      }
    } catch { toast.error('Failed to create surgery record') }
  }

  async function deleteRecord(type: string, id: string) {
    if (!confirm('Are you sure you want to delete this record?')) return
    try {
      const endpoint = type === 'medical-records' ? 'medical-records' : type === 'prescriptions' ? 'prescriptions' : type === 'lab-results' ? 'lab-results' : 'surgeries'
      const res = await fetch(`/api/${endpoint}/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Record deleted')
        fetchAll()
      } else {
        toast.error('Failed to delete')
      }
    } catch { toast.error('Failed to delete') }
  }

  const petOptions = pets.map(p => ({
    value: p.id,
    label: `${p.name} (${p.client?.firstName} ${p.client?.lastName})`,
  }))

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Stethoscope className="h-7 w-7 text-primary-600" />
            Veterinary Records
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Clinical management: medical records, prescriptions, lab results, and surgeries
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search records..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{medicalRecords.length}</p>
                <p className="text-sm text-gray-500">Medical Records</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Pill className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{prescriptions.filter(p => p.status === 'ACTIVE').length}</p>
                <p className="text-sm text-gray-500">Active Prescriptions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <TestTube className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{labResults.filter(l => l.status === 'PENDING').length}</p>
                <p className="text-sm text-gray-500">Pending Lab Results</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Scissors className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{surgeries.filter(s => s.status === 'SCHEDULED').length}</p>
                <p className="text-sm text-gray-500">Scheduled Surgeries</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="medical-records" className="flex items-center gap-1">
            <FileText className="h-4 w-4" /> Medical Records
          </TabsTrigger>
          <TabsTrigger value="prescriptions" className="flex items-center gap-1">
            <Pill className="h-4 w-4" /> Prescriptions
          </TabsTrigger>
          <TabsTrigger value="lab-results" className="flex items-center gap-1">
            <TestTube className="h-4 w-4" /> Lab Results
          </TabsTrigger>
          <TabsTrigger value="surgeries" className="flex items-center gap-1">
            <Scissors className="h-4 w-4" /> Surgeries
          </TabsTrigger>
        </TabsList>

        {/* Medical Records Tab */}
        <TabsContent value="medical-records">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Medical Records</CardTitle>
              <Button onClick={() => setMrDialogOpen(true)} size="sm">
                <Plus className="h-4 w-4 mr-1" /> New Record
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? <TableLoading /> : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pet</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Diagnosis</TableHead>
                      <TableHead>Veterinarian</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {medicalRecords
                      .filter(r => !search || r.pet?.name?.toLowerCase().includes(search.toLowerCase()) || r.diagnosis?.toLowerCase().includes(search.toLowerCase()))
                      .map(record => (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">{record.pet?.name}</TableCell>
                          <TableCell>{record.pet?.client?.firstName} {record.pet?.client?.lastName}</TableCell>
                          <TableCell>{formatDate(record.recordDate)}</TableCell>
                          <TableCell className="max-w-xs truncate">{record.diagnosis}</TableCell>
                          <TableCell>{record.vetName}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" onClick={() => setDetailDialog({ open: true, type: 'medical', data: record })}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => deleteRecord('medical-records', record.id)}>
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    {medicalRecords.length === 0 && (
                      <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-500">No medical records yet</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Prescriptions Tab */}
        <TabsContent value="prescriptions">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Prescriptions</CardTitle>
              <Button onClick={() => setRxDialogOpen(true)} size="sm">
                <Plus className="h-4 w-4 mr-1" /> New Prescription
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? <TableLoading /> : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pet</TableHead>
                      <TableHead>Medication</TableHead>
                      <TableHead>Dosage</TableHead>
                      <TableHead>Frequency</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Prescribed</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {prescriptions
                      .filter(r => !search || r.pet?.name?.toLowerCase().includes(search.toLowerCase()) || r.medication?.toLowerCase().includes(search.toLowerCase()))
                      .map(rx => (
                        <TableRow key={rx.id}>
                          <TableCell className="font-medium">{rx.pet?.name}</TableCell>
                          <TableCell>{rx.medication}</TableCell>
                          <TableCell>{rx.dosage}</TableCell>
                          <TableCell>{rx.frequency}</TableCell>
                          <TableCell>
                            <Badge className={statusColors[rx.status] || 'bg-gray-100'}>{rx.status}</Badge>
                          </TableCell>
                          <TableCell>{formatDate(rx.prescribedDate)}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" onClick={() => setDetailDialog({ open: true, type: 'prescription', data: rx })}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => deleteRecord('prescriptions', rx.id)}>
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    {prescriptions.length === 0 && (
                      <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-500">No prescriptions yet</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Lab Results Tab */}
        <TabsContent value="lab-results">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Lab Results</CardTitle>
              <Button onClick={() => setLabDialogOpen(true)} size="sm">
                <Plus className="h-4 w-4 mr-1" /> New Lab Result
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? <TableLoading /> : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pet</TableHead>
                      <TableHead>Test</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {labResults
                      .filter(r => !search || r.pet?.name?.toLowerCase().includes(search.toLowerCase()) || r.testName?.toLowerCase().includes(search.toLowerCase()))
                      .map(lab => (
                        <TableRow key={lab.id}>
                          <TableCell className="font-medium">{lab.pet?.name}</TableCell>
                          <TableCell>{lab.testName}</TableCell>
                          <TableCell>{lab.testType}</TableCell>
                          <TableCell>{formatDate(lab.testDate)}</TableCell>
                          <TableCell>
                            <Badge className={statusColors[lab.status] || 'bg-gray-100'}>{lab.status}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" onClick={() => setDetailDialog({ open: true, type: 'lab', data: lab })}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => deleteRecord('lab-results', lab.id)}>
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    {labResults.length === 0 && (
                      <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-500">No lab results yet</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Surgeries Tab */}
        <TabsContent value="surgeries">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Surgeries</CardTitle>
              <Button onClick={() => setSurgDialogOpen(true)} size="sm">
                <Plus className="h-4 w-4 mr-1" /> New Surgery
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? <TableLoading /> : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pet</TableHead>
                      <TableHead>Surgery Type</TableHead>
                      <TableHead>Surgeon</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {surgeries
                      .filter(r => !search || r.pet?.name?.toLowerCase().includes(search.toLowerCase()) || r.surgeryType?.toLowerCase().includes(search.toLowerCase()))
                      .map(surg => (
                        <TableRow key={surg.id}>
                          <TableCell className="font-medium">{surg.pet?.name}</TableCell>
                          <TableCell>{surg.surgeryType}</TableCell>
                          <TableCell>{surg.surgeonName}</TableCell>
                          <TableCell>{formatDate(surg.surgeryDate)}</TableCell>
                          <TableCell>
                            <Badge className={statusColors[surg.status] || 'bg-gray-100'}>{surg.status}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" onClick={() => setDetailDialog({ open: true, type: 'surgery', data: surg })}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => deleteRecord('surgeries', surg.id)}>
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    {surgeries.length === 0 && (
                      <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-500">No surgery records yet</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ====== CREATE DIALOGS ====== */}

      {/* Medical Record Dialog */}
      <Dialog open={mrDialogOpen} onOpenChange={setMrDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Medical Record</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Pet *</Label>
              <Select value={mrForm.petId} onValueChange={(v) => setMrForm({ ...mrForm, petId: v })}>
                <SelectTrigger><SelectValue placeholder="Select pet" /></SelectTrigger>
                <SelectContent>
                  {petOptions.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Veterinarian</Label>
              <Input value={mrForm.vetName} onChange={(e) => setMrForm({ ...mrForm, vetName: e.target.value })} placeholder="Dr. Smith" />
            </div>
            <div>
              <Label>Date</Label>
              <Input type="date" value={mrForm.recordDate} onChange={(e) => setMrForm({ ...mrForm, recordDate: e.target.value })} />
            </div>
            <div>
              <Label>Diagnosis *</Label>
              <Textarea value={mrForm.diagnosis} onChange={(e) => setMrForm({ ...mrForm, diagnosis: e.target.value })} placeholder="Enter diagnosis" />
            </div>
            <div>
              <Label>Symptoms *</Label>
              <Textarea value={mrForm.symptoms} onChange={(e) => setMrForm({ ...mrForm, symptoms: e.target.value })} placeholder="Describe symptoms" />
            </div>
            <div>
              <Label>Treatment *</Label>
              <Textarea value={mrForm.treatment} onChange={(e) => setMrForm({ ...mrForm, treatment: e.target.value })} placeholder="Treatment plan" />
            </div>
            <div>
              <Label>Follow-up</Label>
              <Input value={mrForm.followUp} onChange={(e) => setMrForm({ ...mrForm, followUp: e.target.value })} placeholder="Follow-up instructions" />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={mrForm.notes} onChange={(e) => setMrForm({ ...mrForm, notes: e.target.value })} placeholder="Additional notes" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMrDialogOpen(false)}>Cancel</Button>
            <Button onClick={createMedicalRecord}>Create Record</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Prescription Dialog */}
      <Dialog open={rxDialogOpen} onOpenChange={setRxDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Prescription</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Pet *</Label>
              <Select value={rxForm.petId} onValueChange={(v) => setRxForm({ ...rxForm, petId: v })}>
                <SelectTrigger><SelectValue placeholder="Select pet" /></SelectTrigger>
                <SelectContent>
                  {petOptions.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Veterinarian</Label>
              <Input value={rxForm.vetName} onChange={(e) => setRxForm({ ...rxForm, vetName: e.target.value })} placeholder="Dr. Smith" />
            </div>
            <div>
              <Label>Medication *</Label>
              <Input value={rxForm.medication} onChange={(e) => setRxForm({ ...rxForm, medication: e.target.value })} placeholder="Medication name" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Dosage *</Label>
                <Input value={rxForm.dosage} onChange={(e) => setRxForm({ ...rxForm, dosage: e.target.value })} placeholder="e.g. 75mg" />
              </div>
              <div>
                <Label>Frequency *</Label>
                <Input value={rxForm.frequency} onChange={(e) => setRxForm({ ...rxForm, frequency: e.target.value })} placeholder="e.g. Twice daily" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Duration</Label>
                <Input value={rxForm.duration} onChange={(e) => setRxForm({ ...rxForm, duration: e.target.value })} placeholder="e.g. 14 days" />
              </div>
              <div>
                <Label>Date</Label>
                <Input type="date" value={rxForm.prescribedDate} onChange={(e) => setRxForm({ ...rxForm, prescribedDate: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Instructions</Label>
              <Textarea value={rxForm.instructions} onChange={(e) => setRxForm({ ...rxForm, instructions: e.target.value })} placeholder="Administration instructions" />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={rxForm.notes} onChange={(e) => setRxForm({ ...rxForm, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRxDialogOpen(false)}>Cancel</Button>
            <Button onClick={createPrescription}>Create Prescription</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lab Result Dialog */}
      <Dialog open={labDialogOpen} onOpenChange={setLabDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Lab Result</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Pet *</Label>
              <Select value={labForm.petId} onValueChange={(v) => setLabForm({ ...labForm, petId: v })}>
                <SelectTrigger><SelectValue placeholder="Select pet" /></SelectTrigger>
                <SelectContent>
                  {petOptions.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Test Name *</Label>
                <Input value={labForm.testName} onChange={(e) => setLabForm({ ...labForm, testName: e.target.value })} placeholder="e.g. CBC" />
              </div>
              <div>
                <Label>Test Type *</Label>
                <Select value={labForm.testType} onValueChange={(v) => setLabForm({ ...labForm, testType: v })}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Hematology">Hematology</SelectItem>
                    <SelectItem value="Chemistry">Chemistry</SelectItem>
                    <SelectItem value="Serology">Serology</SelectItem>
                    <SelectItem value="Radiology">Radiology</SelectItem>
                    <SelectItem value="Cytology">Cytology</SelectItem>
                    <SelectItem value="Parasitology">Parasitology</SelectItem>
                    <SelectItem value="Endocrinology">Endocrinology</SelectItem>
                    <SelectItem value="Dermatology">Dermatology</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Test Date</Label>
              <Input type="date" value={labForm.testDate} onChange={(e) => setLabForm({ ...labForm, testDate: e.target.value })} />
            </div>
            <div>
              <Label>Results</Label>
              <Textarea value={labForm.results} onChange={(e) => setLabForm({ ...labForm, results: e.target.value })} placeholder="Test results" />
            </div>
            <div>
              <Label>Normal Range</Label>
              <Input value={labForm.normalRange} onChange={(e) => setLabForm({ ...labForm, normalRange: e.target.value })} placeholder="Expected range" />
            </div>
            <div>
              <Label>Ordered By</Label>
              <Input value={labForm.orderedBy} onChange={(e) => setLabForm({ ...labForm, orderedBy: e.target.value })} placeholder="Dr. name" />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={labForm.notes} onChange={(e) => setLabForm({ ...labForm, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLabDialogOpen(false)}>Cancel</Button>
            <Button onClick={createLabResult}>Create Lab Result</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Surgery Dialog */}
      <Dialog open={surgDialogOpen} onOpenChange={setSurgDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Surgery Record</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Pet *</Label>
              <Select value={surgForm.petId} onValueChange={(v) => setSurgForm({ ...surgForm, petId: v })}>
                <SelectTrigger><SelectValue placeholder="Select pet" /></SelectTrigger>
                <SelectContent>
                  {petOptions.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Surgery Type *</Label>
                <Input value={surgForm.surgeryType} onChange={(e) => setSurgForm({ ...surgForm, surgeryType: e.target.value })} placeholder="e.g. Spay" />
              </div>
              <div>
                <Label>Surgeon *</Label>
                <Input value={surgForm.surgeonName} onChange={(e) => setSurgForm({ ...surgForm, surgeonName: e.target.value })} placeholder="Dr. name" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Date</Label>
                <Input type="date" value={surgForm.surgeryDate} onChange={(e) => setSurgForm({ ...surgForm, surgeryDate: e.target.value })} />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={surgForm.status} onValueChange={(v) => setSurgForm({ ...surgForm, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Anesthesia Type</Label>
                <Input value={surgForm.anesthesiaType} onChange={(e) => setSurgForm({ ...surgForm, anesthesiaType: e.target.value })} placeholder="e.g. General" />
              </div>
              <div>
                <Label>Duration</Label>
                <Input value={surgForm.duration} onChange={(e) => setSurgForm({ ...surgForm, duration: e.target.value })} placeholder="e.g. 60 min" />
              </div>
            </div>
            <div>
              <Label>Pre-Op Notes</Label>
              <Textarea value={surgForm.preOpNotes} onChange={(e) => setSurgForm({ ...surgForm, preOpNotes: e.target.value })} />
            </div>
            <div>
              <Label>Post-Op Notes</Label>
              <Textarea value={surgForm.postOpNotes} onChange={(e) => setSurgForm({ ...surgForm, postOpNotes: e.target.value })} />
            </div>
            <div>
              <Label>Complications</Label>
              <Textarea value={surgForm.complications} onChange={(e) => setSurgForm({ ...surgForm, complications: e.target.value })} />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={surgForm.notes} onChange={(e) => setSurgForm({ ...surgForm, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSurgDialogOpen(false)}>Cancel</Button>
            <Button onClick={createSurgery}>Create Surgery Record</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail View Dialog */}
      <Dialog open={detailDialog.open} onOpenChange={(open) => setDetailDialog({ ...detailDialog, open })}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {detailDialog.type === 'medical' && 'Medical Record Details'}
              {detailDialog.type === 'prescription' && 'Prescription Details'}
              {detailDialog.type === 'lab' && 'Lab Result Details'}
              {detailDialog.type === 'surgery' && 'Surgery Details'}
            </DialogTitle>
          </DialogHeader>
          {detailDialog.data && (
            <div className="space-y-3">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-500">Pet</p>
                <p className="font-medium">{detailDialog.data.pet?.name} ({detailDialog.data.pet?.client?.firstName} {detailDialog.data.pet?.client?.lastName})</p>
              </div>

              {detailDialog.type === 'medical' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div><p className="text-sm text-gray-500">Veterinarian</p><p className="font-medium">{detailDialog.data.vetName}</p></div>
                    <div><p className="text-sm text-gray-500">Date</p><p className="font-medium">{formatDate(detailDialog.data.recordDate)}</p></div>
                  </div>
                  <div><p className="text-sm text-gray-500">Diagnosis</p><p className="font-medium whitespace-pre-wrap">{detailDialog.data.diagnosis}</p></div>
                  <div><p className="text-sm text-gray-500">Symptoms</p><p className="whitespace-pre-wrap">{detailDialog.data.symptoms}</p></div>
                  <div><p className="text-sm text-gray-500">Treatment</p><p className="whitespace-pre-wrap">{detailDialog.data.treatment}</p></div>
                  {detailDialog.data.followUp && <div><p className="text-sm text-gray-500">Follow-up</p><p>{detailDialog.data.followUp}</p></div>}
                  {detailDialog.data.notes && <div><p className="text-sm text-gray-500">Notes</p><p>{detailDialog.data.notes}</p></div>}
                </>
              )}

              {detailDialog.type === 'prescription' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div><p className="text-sm text-gray-500">Medication</p><p className="font-medium">{detailDialog.data.medication}</p></div>
                    <div><p className="text-sm text-gray-500">Status</p><Badge className={statusColors[detailDialog.data.status]}>{detailDialog.data.status}</Badge></div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div><p className="text-sm text-gray-500">Dosage</p><p>{detailDialog.data.dosage}</p></div>
                    <div><p className="text-sm text-gray-500">Frequency</p><p>{detailDialog.data.frequency}</p></div>
                    <div><p className="text-sm text-gray-500">Duration</p><p>{detailDialog.data.duration}</p></div>
                  </div>
                  <div><p className="text-sm text-gray-500">Veterinarian</p><p>{detailDialog.data.vetName}</p></div>
                  {detailDialog.data.instructions && <div><p className="text-sm text-gray-500">Instructions</p><p className="whitespace-pre-wrap">{detailDialog.data.instructions}</p></div>}
                  {detailDialog.data.notes && <div><p className="text-sm text-gray-500">Notes</p><p>{detailDialog.data.notes}</p></div>}
                </>
              )}

              {detailDialog.type === 'lab' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div><p className="text-sm text-gray-500">Test Name</p><p className="font-medium">{detailDialog.data.testName}</p></div>
                    <div><p className="text-sm text-gray-500">Status</p><Badge className={statusColors[detailDialog.data.status]}>{detailDialog.data.status}</Badge></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><p className="text-sm text-gray-500">Test Type</p><p>{detailDialog.data.testType}</p></div>
                    <div><p className="text-sm text-gray-500">Date</p><p>{formatDate(detailDialog.data.testDate)}</p></div>
                  </div>
                  <div><p className="text-sm text-gray-500">Results</p><p className="whitespace-pre-wrap">{detailDialog.data.results}</p></div>
                  {detailDialog.data.normalRange && <div><p className="text-sm text-gray-500">Normal Range</p><p>{detailDialog.data.normalRange}</p></div>}
                  {detailDialog.data.orderedBy && <div><p className="text-sm text-gray-500">Ordered By</p><p>{detailDialog.data.orderedBy}</p></div>}
                  {detailDialog.data.notes && <div><p className="text-sm text-gray-500">Notes</p><p>{detailDialog.data.notes}</p></div>}
                </>
              )}

              {detailDialog.type === 'surgery' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div><p className="text-sm text-gray-500">Surgery Type</p><p className="font-medium">{detailDialog.data.surgeryType}</p></div>
                    <div><p className="text-sm text-gray-500">Status</p><Badge className={statusColors[detailDialog.data.status]}>{detailDialog.data.status}</Badge></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><p className="text-sm text-gray-500">Surgeon</p><p>{detailDialog.data.surgeonName}</p></div>
                    <div><p className="text-sm text-gray-500">Date</p><p>{formatDate(detailDialog.data.surgeryDate)}</p></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><p className="text-sm text-gray-500">Anesthesia</p><p>{detailDialog.data.anesthesiaType || 'N/A'}</p></div>
                    <div><p className="text-sm text-gray-500">Duration</p><p>{detailDialog.data.duration || 'N/A'}</p></div>
                  </div>
                  {detailDialog.data.preOpNotes && <div><p className="text-sm text-gray-500">Pre-Op Notes</p><p className="whitespace-pre-wrap">{detailDialog.data.preOpNotes}</p></div>}
                  {detailDialog.data.postOpNotes && <div><p className="text-sm text-gray-500">Post-Op Notes</p><p className="whitespace-pre-wrap">{detailDialog.data.postOpNotes}</p></div>}
                  {detailDialog.data.complications && <div><p className="text-sm text-gray-500">Complications</p><p className="whitespace-pre-wrap text-red-600">{detailDialog.data.complications}</p></div>}
                  {detailDialog.data.notes && <div><p className="text-sm text-gray-500">Notes</p><p>{detailDialog.data.notes}</p></div>}
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
