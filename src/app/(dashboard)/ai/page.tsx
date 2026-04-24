'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from '@/components/ui/select'
import {
  Camera,
  Sparkles,
  Calendar,
  Heart,
  Image,
  MessageSquare,
  TrendingUp,
  Wand2,
  Upload,
  AlertCircle,
  FileText,
  Utensils,
  Brain,
  Activity,
  CheckCircle,
  Clock,
  Stethoscope,
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Breed {
  id: string
  name: string
  species: string
}

export default function AIFeaturesPage() {
  const [breeds, setBreeds] = useState<Breed[]>([])
  const [breedImage, setBreedImage] = useState<string | null>(null)
  const [breedResult, setBreedResult] = useState<any>(null)
  const [styleBreed, setStyleBreed] = useState('')
  const [styleCoatType, setStyleCoatType] = useState('')
  const [styleResult, setStyleResult] = useState<any>(null)
  const [socialPetName, setSocialPetName] = useState('')
  const [socialBreed, setSocialBreed] = useState('')
  const [socialServiceType, setSocialServiceType] = useState('')
  const [socialResult, setSocialResult] = useState<any>(null)
  const [reminderClient, setReminderClient] = useState('')
  const [reminderPet, setReminderPet] = useState('')
  const [reminderLastVisit, setReminderLastVisit] = useState('')
  const [reminderResult, setReminderResult] = useState<any>(null)
  const [healthSymptoms, setHealthSymptoms] = useState('')
  const [healthPetType, setHealthPetType] = useState('')
  const [healthBreed, setHealthBreed] = useState('')
  const [healthResult, setHealthResult] = useState<any>(null)
  const [upsellServices, setUpsellServices] = useState('')
  const [upsellBreed, setUpsellBreed] = useState('')
  const [upsellCondition, setUpsellCondition] = useState('')
  const [upsellResult, setUpsellResult] = useState<any>(null)
  const [enhanceImage, setEnhanceImage] = useState<string | null>(null)
  const [enhanceResult, setEnhanceResult] = useState<any>(null)
  const [appointmentBreed, setAppointmentBreed] = useState('')
  const [appointmentSize, setAppointmentSize] = useState('')
  const [appointmentService, setAppointmentService] = useState('')
  const [appointmentCondition, setAppointmentCondition] = useState('')
  const [appointmentResult, setAppointmentResult] = useState<any>(null)
  const [messageType, setMessageType] = useState('')
  const [messageClient, setMessageClient] = useState('')
  const [messagePet, setMessagePet] = useState('')
  const [messageContext, setMessageContext] = useState('')
  const [messageResult, setMessageResult] = useState<any>(null)
  // Diet Recommender state
  const [dietPetType, setDietPetType] = useState('')
  const [dietBreed, setDietBreed] = useState('')
  const [dietAge, setDietAge] = useState('')
  const [dietWeight, setDietWeight] = useState('')
  const [dietActivity, setDietActivity] = useState('')
  const [dietHealth, setDietHealth] = useState('')
  const [dietCurrent, setDietCurrent] = useState('')
  const [dietResult, setDietResult] = useState<any>(null)
  // Behavior Analyzer state
  const [behaviorPetType, setBehaviorPetType] = useState('')
  const [behaviorBreed, setBehaviorBreed] = useState('')
  const [behaviorAge, setBehaviorAge] = useState('')
  const [behaviorDescription, setBehaviorDescription] = useState('')
  const [behaviorContext, setBehaviorContext] = useState('')
  const [behaviorFrequency, setBehaviorFrequency] = useState('')
  const [behaviorResult, setBehaviorResult] = useState<any>(null)
  // Veterinary AI state
  const [diagSpecies, setDiagSpecies] = useState('')
  const [diagBreed, setDiagBreed] = useState('')
  const [diagAge, setDiagAge] = useState('')
  const [diagSymptoms, setDiagSymptoms] = useState('')
  const [diagHistory, setDiagHistory] = useState('')
  const [diagResult, setDiagResult] = useState<any>(null)

  const [treatSpecies, setTreatSpecies] = useState('')
  const [treatBreed, setTreatBreed] = useState('')
  const [treatAge, setTreatAge] = useState('')
  const [treatWeight, setTreatWeight] = useState('')
  const [treatDiagnosis, setTreatDiagnosis] = useState('')
  const [treatMedications, setTreatMedications] = useState('')
  const [treatResult, setTreatResult] = useState<any>(null)

  const [symptomSpecies, setSymptomSpecies] = useState('')
  const [symptomSymptoms, setSymptomSymptoms] = useState('')
  const [symptomDuration, setSymptomDuration] = useState('')
  const [symptomSeverity, setSymptomSeverity] = useState('')
  const [symptomResult, setSymptomResult] = useState<any>(null)

  const [drugSpecies, setDrugSpecies] = useState('')
  const [drugMedications, setDrugMedications] = useState('')
  const [drugWeight, setDrugWeight] = useState('')
  const [drugResult, setDrugResult] = useState<any>(null)

  const [loading, setLoading] = useState<string | null>(null)

  // Fetch breeds on mount
  useEffect(() => {
    fetch('/api/breeds')
      .then(res => res.json())
      .then(data => setBreeds(data))
      .catch(err => console.error('Failed to fetch breeds:', err))
  }, [])

  const handleBreedIdentify = async () => {
    if (!breedImage) {
      toast.error('Please upload an image first')
      return
    }
    setLoading('breed')
    try {
      const response = await fetch('/api/ai/breed-identify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: breedImage }),
      })
      const data = await response.json()
      if (data.error) throw new Error(data.error)
      setBreedResult(data)
      toast.success('Breed identified!')
    } catch (error) {
      toast.error('Failed to identify breed')
      console.error(error)
    } finally {
      setLoading(null)
    }
  }

  const handleStyleSuggest = async () => {
    if (!styleBreed) {
      toast.error('Please select a breed')
      return
    }
    setLoading('style')
    try {
      const response = await fetch('/api/ai/style-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          breed: styleBreed,
          coatType: styleCoatType || undefined,
          preferences: 'Looking for recommendations'
        }),
      })
      const data = await response.json()
      if (data.error) throw new Error(data.error)
      setStyleResult(data)
      toast.success('Styles generated!')
    } catch (error) {
      toast.error('Failed to suggest styles')
      console.error(error)
    } finally {
      setLoading(null)
    }
  }

  const handleGeneratePost = async () => {
    if (!socialPetName || !socialBreed || !socialServiceType) {
      toast.error('Please fill in all fields')
      return
    }
    setLoading('social')
    try {
      const response = await fetch('/api/ai/social-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          petName: socialPetName,
          breed: socialBreed,
          serviceType: socialServiceType,
          additionalContext: 'Post for Instagram and Facebook'
        }),
      })
      const data = await response.json()
      if (data.error) throw new Error(data.error)
      setSocialResult(data)
      toast.success('Post generated!')
    } catch (error) {
      toast.error('Failed to generate post')
      console.error(error)
    } finally {
      setLoading(null)
    }
  }

  const handleGenerateReminder = async () => {
    if (!reminderClient || !reminderPet) {
      toast.error('Please enter client and pet names')
      return
    }
    setLoading('reminder')
    try {
      const response = await fetch('/api/ai/reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: reminderClient,
          petName: reminderPet,
          lastVisitDate: reminderLastVisit || 'a while ago',
          recommendedServices: ['Full Grooming', 'Nail Trim']
        }),
      })
      const data = await response.json()
      if (data.error) throw new Error(data.error)
      setReminderResult(data)
      toast.success('Reminder generated!')
    } catch (error) {
      toast.error('Failed to generate reminder')
      console.error(error)
    } finally {
      setLoading(null)
    }
  }

  const handleHealthAnalyze = async () => {
    if (!healthSymptoms || !healthPetType || !healthBreed) {
      toast.error('Please fill in all fields')
      return
    }
    setLoading('health')
    try {
      const response = await fetch('/api/ai/health-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symptoms: healthSymptoms,
          petType: healthPetType,
          breed: healthBreed
        }),
      })
      const data = await response.json()
      if (data.error) throw new Error(data.error)
      setHealthResult(data)
      toast.success('Health analysis complete!')
    } catch (error) {
      toast.error('Failed to analyze health concerns')
      console.error(error)
    } finally {
      setLoading(null)
    }
  }

  const handleUpsellSuggest = async () => {
    if (!upsellServices || !upsellBreed) {
      toast.error('Please fill in required fields')
      return
    }
    setLoading('upsell')
    try {
      const response = await fetch('/api/ai/upsell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentServices: upsellServices.split(',').map(s => s.trim()),
          petBreed: upsellBreed,
          petCondition: upsellCondition || undefined
        }),
      })
      const data = await response.json()
      if (data.error) throw new Error(data.error)
      setUpsellResult(data)
      toast.success('Upsell suggestions generated!')
    } catch (error) {
      toast.error('Failed to suggest upsells')
      console.error(error)
    } finally {
      setLoading(null)
    }
  }

  const handlePhotoEnhance = async () => {
    if (!enhanceImage) {
      toast.error('Please upload an image first')
      return
    }
    setLoading('enhance')
    try {
      const response = await fetch('/api/ai/photo-enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: enhanceImage }),
      })
      const data = await response.json()
      if (data.error) throw new Error(data.error)
      setEnhanceResult(data)
      toast.success('Photo analysis complete!')
    } catch (error) {
      toast.error('Failed to analyze photo')
      console.error(error)
    } finally {
      setLoading(null)
    }
  }

  const handleAppointmentEstimate = async () => {
    if (!appointmentBreed || !appointmentSize || !appointmentService) {
      toast.error('Please fill in all required fields')
      return
    }
    setLoading('appointment')
    try {
      const response = await fetch('/api/ai/appointment-estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          breed: appointmentBreed,
          petSize: appointmentSize,
          serviceType: appointmentService,
          coatCondition: appointmentCondition || undefined,
        }),
      })
      const data = await response.json()
      if (data.error) throw new Error(data.error)
      setAppointmentResult(data)
      toast.success('Appointment estimate ready!')
    } catch (error) {
      toast.error('Failed to estimate appointment')
      console.error(error)
    } finally {
      setLoading(null)
    }
  }

  const handleGenerateClientMessage = async () => {
    if (!messageType || !messageClient || !messagePet) {
      toast.error('Please fill in all required fields')
      return
    }
    setLoading('message')
    try {
      const response = await fetch('/api/ai/client-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageType,
          clientName: messageClient,
          petName: messagePet,
          context: messageContext || undefined,
        }),
      })
      const data = await response.json()
      if (data.error) throw new Error(data.error)
      setMessageResult(data)
      toast.success('Message generated!')
    } catch (error) {
      toast.error('Failed to generate message')
      console.error(error)
    } finally {
      setLoading(null)
    }
  }

  const handleDietRecommend = async () => {
    if (!dietPetType || !dietBreed || !dietAge || !dietWeight || !dietActivity) {
      toast.error('Please fill in all required fields')
      return
    }
    setLoading('diet')
    try {
      const response = await fetch('/api/ai/diet-recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          petType: dietPetType,
          breed: dietBreed,
          age: dietAge,
          weight: parseFloat(dietWeight),
          activityLevel: dietActivity,
          healthConditions: dietHealth || undefined,
          currentDiet: dietCurrent || undefined,
        }),
      })
      const data = await response.json()
      if (data.error) throw new Error(data.error)
      setDietResult(data)
      toast.success('Diet recommendations generated!')
    } catch (error) {
      toast.error('Failed to generate diet recommendations')
      console.error(error)
    } finally {
      setLoading(null)
    }
  }

  const handleBehaviorAnalyze = async () => {
    if (!behaviorPetType || !behaviorBreed || !behaviorAge || !behaviorDescription) {
      toast.error('Please fill in all required fields')
      return
    }
    setLoading('behavior')
    try {
      const response = await fetch('/api/ai/behavior-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          petType: behaviorPetType,
          breed: behaviorBreed,
          age: behaviorAge,
          behaviorDescription: behaviorDescription,
          context: behaviorContext || undefined,
          frequency: behaviorFrequency || undefined,
        }),
      })
      const data = await response.json()
      if (data.error) throw new Error(data.error)
      setBehaviorResult(data)
      toast.success('Behavior analysis complete!')
    } catch (error) {
      toast.error('Failed to analyze behavior')
      console.error(error)
    } finally {
      setLoading(null)
    }
  }

  // Example data loaders
  const loadStyleExample = () => {
    setStyleBreed('Poodle')
    setStyleCoatType('Curly')
    setStyleResult(null)
    toast.success('Example loaded!')
  }

  const loadSocialExample = () => {
    setSocialPetName('Bella')
    setSocialBreed('Golden Retriever')
    setSocialServiceType('Full Grooming')
    setSocialResult(null)
    toast.success('Example loaded!')
  }

  const loadReminderExample = () => {
    setReminderClient('Sarah Johnson')
    setReminderPet('Max')
    setReminderLastVisit('6 weeks ago')
    setReminderResult(null)
    toast.success('Example loaded!')
  }

  const loadHealthExample = () => {
    setHealthPetType('Dog')
    setHealthBreed('Golden Retriever')
    setHealthSymptoms('Dry flaky skin on back, mild scratching, occasional redness on belly area')
    setHealthResult(null)
    toast.success('Example loaded!')
  }

  const loadUpsellExample = () => {
    setUpsellServices('Basic Bath, Nail Trim')
    setUpsellBreed('Poodle')
    setUpsellCondition('Matted coat')
    setUpsellResult(null)
    toast.success('Example loaded!')
  }

  const loadBreedExample = async () => {
    // Load a sample dog image
    setBreedImage('https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop')
    setBreedResult(null)
    toast.success('Example image loaded!')
  }

  const loadAppointmentExample = () => {
    setAppointmentBreed('Golden Retriever')
    setAppointmentSize('Large (50-90 lbs)')
    setAppointmentService('Full Grooming')
    setAppointmentCondition('Slightly tangled')
    setAppointmentResult(null)
    toast.success('Example loaded!')
  }

  const loadEnhanceExample = async () => {
    // Load a sample grooming photo
    setEnhanceImage('https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=400&h=400&fit=crop')
    setEnhanceResult(null)
    toast.success('Example image loaded!')
  }

  const loadMessageExample = () => {
    setMessageType('booking_confirmation')
    setMessageClient('John Smith')
    setMessagePet('Max')
    setMessageContext('Tomorrow at 2pm for full grooming, first time customer')
    setMessageResult(null)
    toast.success('Example loaded!')
  }

  const loadDietExample = () => {
    setDietPetType('Dog')
    setDietBreed('Golden Retriever')
    setDietAge('3 years')
    setDietWeight('70')
    setDietActivity('Moderate')
    setDietHealth('None')
    setDietCurrent('Dry kibble twice daily')
    setDietResult(null)
    toast.success('Example loaded!')
  }

  // === Veterinary AI Handlers ===
  const handleDiagnosis = async () => {
    if (!diagSpecies || !diagSymptoms) { toast.error('Species and symptoms are required'); return }
    setLoading('diagnosis')
    try {
      const res = await fetch('/api/ai/diagnosis', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ species: diagSpecies, breed: diagBreed, age: diagAge, symptoms: diagSymptoms, history: diagHistory || undefined }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setDiagResult(data)
      toast.success('Diagnosis analysis complete!')
    } catch { toast.error('Failed to analyze') } finally { setLoading(null) }
  }

  const handleTreatment = async () => {
    if (!treatSpecies || !treatDiagnosis) { toast.error('Species and diagnosis are required'); return }
    setLoading('treatment')
    try {
      const res = await fetch('/api/ai/treatment', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ species: treatSpecies, breed: treatBreed, age: treatAge, weight: treatWeight, diagnosis: treatDiagnosis, currentMedications: treatMedications || undefined }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setTreatResult(data)
      toast.success('Treatment plan generated!')
    } catch { toast.error('Failed to generate treatment plan') } finally { setLoading(null) }
  }

  const handleSymptomCheck = async () => {
    if (!symptomSpecies || !symptomSymptoms) { toast.error('Species and symptoms are required'); return }
    setLoading('symptom')
    try {
      const res = await fetch('/api/ai/symptom-checker', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ species: symptomSpecies, symptoms: symptomSymptoms, duration: symptomDuration || undefined, severity: symptomSeverity || undefined }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setSymptomResult(data)
      toast.success('Symptom analysis complete!')
    } catch { toast.error('Failed to check symptoms') } finally { setLoading(null) }
  }

  const handleDrugInteraction = async () => {
    if (!drugSpecies || !drugMedications) { toast.error('Species and medications are required'); return }
    setLoading('drug')
    try {
      const res = await fetch('/api/ai/drug-interaction', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ species: drugSpecies, medications: drugMedications, weight: drugWeight || undefined }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setDrugResult(data)
      toast.success('Drug interaction analysis complete!')
    } catch { toast.error('Failed to check interactions') } finally { setLoading(null) }
  }

  const loadBehaviorExample = () => {
    setBehaviorPetType('Dog')
    setBehaviorBreed('German Shepherd')
    setBehaviorAge('2 years')
    setBehaviorDescription('Excessive barking when doorbell rings, jumping on guests, difficulty settling down')
    setBehaviorContext('Recently moved to a new apartment with more foot traffic in the hallway')
    setBehaviorFrequency('Multiple times daily')
    setBehaviorResult(null)
    toast.success('Example loaded!')
  }

  const aiFeatures = [
    { id: 'breed-identifier', title: 'AI Breed Identifier', description: 'Upload a photo to identify the breed', icon: Camera, status: 'active' },
    { id: 'style-suggester', title: 'AI Style Suggester', description: 'Get grooming style recommendations', icon: Sparkles, status: 'active' },
    { id: 'health-spotter', title: 'AI Health Spotter', description: 'Identify skin and coat issues', icon: Heart, status: 'active' },
    { id: 'diet-recommender', title: 'AI Diet Recommender', description: 'Get personalized nutrition advice', icon: Utensils, status: 'active' },
    { id: 'behavior-analyzer', title: 'AI Behavior Analyzer', description: 'Understand pet behavior patterns', icon: Brain, status: 'active' },
    { id: 'social-generator', title: 'AI Social Generator', description: 'Generate social media posts', icon: MessageSquare, status: 'active' },
    { id: 'reminder-generator', title: 'AI Reminder Generator', description: 'Create personalized reminders', icon: Clock, status: 'active' },
    { id: 'upsell-recommender', title: 'AI Upsell Recommender', description: 'Suggest add-on services', icon: TrendingUp, status: 'active' },
    { id: 'appointment-optimizer', title: 'AI Appointment Estimator', description: 'Get duration, pricing & grooming tips', icon: Calendar, status: 'active' },
    { id: 'photo-enhancer', title: 'AI Photo Enhancer', description: 'Enhance before/after photos', icon: Image, status: 'active' },
    { id: 'client-messenger', title: 'AI Client Messenger', description: 'Generate professional client messages', icon: MessageSquare, status: 'active' },
    { id: 'vet-diagnosis', title: 'AI Vet Diagnosis', description: 'Differential diagnoses & recommendations', icon: Activity, status: 'active' },
    { id: 'vet-treatment', title: 'AI Treatment Plan', description: 'Treatment plans with medications', icon: FileText, status: 'active' },
    { id: 'vet-symptom-checker', title: 'AI Symptom Checker', description: 'Urgency-based symptom analysis', icon: AlertCircle, status: 'active' },
    { id: 'vet-drug-interaction', title: 'AI Drug Interactions', description: 'Check medication interactions', icon: Activity, status: 'active' },
  ]

  const scrollToFeature = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const dogBreeds = breeds.filter(b => b.species === 'DOG')
  const catBreeds = breeds.filter(b => b.species === 'CAT')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">AI Features</h1>
        <p className="text-gray-500">AI-powered tools to enhance your grooming business (Powered by OpenRouter)</p>
      </div>

      {/* Features Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        {aiFeatures.map((feature) => (
          <Card
            key={feature.title}
            className="relative cursor-pointer transition-all hover:shadow-md hover:border-primary-300"
            onClick={() => scrollToFeature(feature.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary-100 p-2">
                  <feature.icon className="h-5 w-5 text-primary-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{feature.title}</p>
                  <p className="text-sm text-gray-500">{feature.description}</p>
                </div>
                <Badge variant="success">
                  Active
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Active AI Tools */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Style Suggester */}
        <Card id="style-suggester">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              AI Style Suggester
            </CardTitle>
            <CardDescription>Get grooming style recommendations for any breed</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Select Breed</Label>
              <Select value={styleBreed} onValueChange={setStyleBreed}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a breed" />
                </SelectTrigger>
                <SelectContent>
                  {dogBreeds.length > 0 && (
                    <SelectGroup>
                      <SelectLabel>Dogs</SelectLabel>
                      {dogBreeds.map(breed => (
                        <SelectItem key={breed.id} value={breed.name}>{breed.name}</SelectItem>
                      ))}
                    </SelectGroup>
                  )}
                  {catBreeds.length > 0 && (
                    <SelectGroup>
                      <SelectLabel>Cats</SelectLabel>
                      {catBreeds.map(breed => (
                        <SelectItem key={breed.id} value={breed.name}>{breed.name}</SelectItem>
                      ))}
                    </SelectGroup>
                  )}
                  {breeds.length === 0 && (
                    <>
                      <SelectItem value="Golden Retriever">Golden Retriever</SelectItem>
                      <SelectItem value="Poodle">Poodle</SelectItem>
                      <SelectItem value="Shih Tzu">Shih Tzu</SelectItem>
                      <SelectItem value="Yorkshire Terrier">Yorkshire Terrier</SelectItem>
                      <SelectItem value="Maltese">Maltese</SelectItem>
                      <SelectItem value="Bichon Frise">Bichon Frise</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Coat Type (Optional)</Label>
              <Input
                value={styleCoatType}
                onChange={(e) => setStyleCoatType(e.target.value)}
                placeholder="e.g., Long, Curly, Short"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleStyleSuggest} disabled={!styleBreed} loading={loading === 'style'} className="flex-1">
                <Wand2 className="mr-2 h-4 w-4" />
                Get Style Suggestions
              </Button>
              <Button variant="outline" onClick={loadStyleExample}>
                <FileText className="mr-2 h-4 w-4" />
                Load Example
              </Button>
            </div>
            {styleResult && (
              <div className="space-y-3">
                {styleResult.styles && styleResult.styles.length > 0 ? (
                  styleResult.styles.map((style: { name: string; description: string; difficulty: string; maintenanceLevel: string; bestFor?: string; groomingFrequency?: string; toolsRequired?: string[] }, i: number) => (
                    <div key={i} className="rounded-lg border bg-white p-4 hover:shadow-sm transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-semibold text-gray-900">{style.name}</p>
                        <div className="flex gap-2">
                          <Badge variant={
                            style.difficulty?.toLowerCase() === 'easy' ? 'success' :
                            style.difficulty?.toLowerCase() === 'hard' ? 'destructive' : 'warning'
                          }>
                            {style.difficulty || 'Medium'}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{style.description}</p>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 mb-2">
                        <span className="flex items-center gap-1">
                          <span className="font-medium">Maintenance:</span>
                          <span className={
                            style.maintenanceLevel?.toLowerCase() === 'low' ? 'text-green-600' :
                            style.maintenanceLevel?.toLowerCase() === 'high' ? 'text-red-600' : 'text-yellow-600'
                          }>
                            {style.maintenanceLevel || 'Medium'}
                          </span>
                        </span>
                        {style.groomingFrequency && (
                          <span className="flex items-center gap-1">
                            <span className="font-medium">Frequency:</span>
                            <span>{style.groomingFrequency}</span>
                          </span>
                        )}
                      </div>
                      {style.bestFor && (
                        <p className="text-xs text-purple-600 mb-2">
                          <span className="font-medium">Best for:</span> {style.bestFor}
                        </p>
                      )}
                      {style.toolsRequired && style.toolsRequired.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t">
                          {style.toolsRequired.map((tool, j) => (
                            <span key={j} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                              {tool}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg bg-purple-50 p-3">
                    <p className="text-sm text-purple-800 whitespace-pre-wrap">{typeof styleResult === 'string' ? styleResult : JSON.stringify(styleResult, null, 2)}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Social Media Generator */}
        <Card id="social-generator">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              AI Social Media Generator
            </CardTitle>
            <CardDescription>Generate engaging social media posts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Pet Name</Label>
                <Input value={socialPetName} onChange={(e) => setSocialPetName(e.target.value)} placeholder="e.g., Max" />
              </div>
              <div className="space-y-2">
                <Label>Breed</Label>
                <Input value={socialBreed} onChange={(e) => setSocialBreed(e.target.value)} placeholder="e.g., Golden Retriever" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Service Type</Label>
              <Select value={socialServiceType} onValueChange={setSocialServiceType}>
                <SelectTrigger><SelectValue placeholder="Select service" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Full Grooming">Full Grooming</SelectItem>
                  <SelectItem value="Bath & Brush">Bath & Brush</SelectItem>
                  <SelectItem value="Puppy First Groom">Puppy First Groom</SelectItem>
                  <SelectItem value="De-shedding Treatment">De-shedding Treatment</SelectItem>
                  <SelectItem value="Creative Styling">Creative Styling</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleGeneratePost} loading={loading === 'social'} className="flex-1">
                <Wand2 className="mr-2 h-4 w-4" />
                Generate Post
              </Button>
              <Button variant="outline" onClick={loadSocialExample}>
                <FileText className="mr-2 h-4 w-4" />
                Load Example
              </Button>
            </div>
            {socialResult && (
              <div className="space-y-4">
                {/* Post Content */}
                <div className="rounded-lg bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="outline">{socialResult.platform || 'Instagram'}</Badge>
                    {socialResult.engagementTip && (
                      <Badge variant="secondary" className="text-xs">{socialResult.engagementTip}</Badge>
                    )}
                  </div>
                  <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{socialResult.post || socialResult}</p>

                  {/* Hashtags */}
                  {socialResult.hashtags && socialResult.hashtags.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-blue-200">
                      <p className="text-xs text-gray-500 mb-2">Hashtags:</p>
                      <div className="flex flex-wrap gap-1">
                        {socialResult.hashtags.map((tag: string, i: number) => (
                          <span key={i} className="text-sm text-blue-600 hover:text-blue-800">#{tag}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Alternative Post for Twitter */}
                {socialResult.alternativePost && (
                  <div className="rounded-lg bg-gray-50 border p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">Twitter/X</Badge>
                      <span className="text-xs text-gray-500">({socialResult.alternativePost.length}/280 chars)</span>
                    </div>
                    <p className="text-sm text-gray-700">{socialResult.alternativePost}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2"
                      onClick={() => {
                        navigator.clipboard.writeText(socialResult.alternativePost)
                        toast.success('Twitter post copied!')
                      }}
                    >
                      Copy Twitter Version
                    </Button>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const fullPost = `${socialResult.post}\n\n${socialResult.hashtags?.map((t: string) => '#' + t).join(' ') || ''}`
                      navigator.clipboard.writeText(fullPost)
                      toast.success('Copied with hashtags!')
                    }}
                  >
                    Copy All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(socialResult.post || socialResult)
                      toast.success('Post copied!')
                    }}
                  >
                    Copy Post Only
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reminder Generator */}
        <Card id="reminder-generator">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              AI Reminder Generator
            </CardTitle>
            <CardDescription>Create personalized appointment reminder messages</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Client Name</Label>
                <Input value={reminderClient} onChange={(e) => setReminderClient(e.target.value)} placeholder="e.g., John" />
              </div>
              <div className="space-y-2">
                <Label>Pet Name</Label>
                <Input value={reminderPet} onChange={(e) => setReminderPet(e.target.value)} placeholder="e.g., Max" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Last Visit Date (Optional)</Label>
              <Input value={reminderLastVisit} onChange={(e) => setReminderLastVisit(e.target.value)} placeholder="e.g., 6 weeks ago" />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleGenerateReminder} disabled={!reminderPet || !reminderClient} loading={loading === 'reminder'} className="flex-1">
                <Wand2 className="mr-2 h-4 w-4" />
                Generate Reminder
              </Button>
              <Button variant="outline" onClick={loadReminderExample}>
                <FileText className="mr-2 h-4 w-4" />
                Load Example
              </Button>
            </div>
            {reminderResult && (
              <div className="space-y-3">
                {/* Subject Line */}
                {reminderResult.subject && (
                  <div className="rounded-lg bg-orange-100 border border-orange-200 p-3">
                    <p className="text-xs text-orange-600 font-medium mb-1">Subject Line:</p>
                    <p className="text-orange-900 font-medium">{reminderResult.subject}</p>
                  </div>
                )}

                {/* Message Body */}
                <div className="rounded-lg bg-orange-50 border border-orange-200 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-orange-600 font-medium">Email Message:</p>
                    <div className="flex gap-2">
                      {reminderResult.followUpDate && (
                        <Badge variant="secondary" className="text-xs">
                          Follow up: {reminderResult.followUpDate}
                        </Badge>
                      )}
                      {reminderResult.tone && (
                        <Badge variant="outline" className="text-orange-600 border-orange-300">
                          {reminderResult.tone} tone
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{reminderResult.message || reminderResult}</p>
                </div>

                {/* SMS Version */}
                {reminderResult.smsVersion && (
                  <div className="rounded-lg bg-gray-50 border p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-gray-600 font-medium">SMS Version:</p>
                      <span className="text-xs text-gray-500">({reminderResult.smsVersion.length}/160 chars)</span>
                    </div>
                    <p className="text-sm text-gray-700">{reminderResult.smsVersion}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2"
                      onClick={() => {
                        navigator.clipboard.writeText(reminderResult.smsVersion)
                        toast.success('SMS copied!')
                      }}
                    >
                      Copy SMS
                    </Button>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(reminderResult.message || reminderResult)
                      toast.success('Message copied!')
                    }}
                  >
                    Copy Email Message
                  </Button>
                  {reminderResult.subject && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(reminderResult.subject)
                        toast.success('Subject copied!')
                      }}
                    >
                      Copy Subject
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Health Analyzer */}
        <Card id="health-spotter">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              AI Health Spotter
            </CardTitle>
            <CardDescription>Analyze potential skin and coat health concerns</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Pet Type</Label>
                <Select value={healthPetType} onValueChange={setHealthPetType}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Dog">Dog</SelectItem>
                    <SelectItem value="Cat">Cat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Breed</Label>
                <Input value={healthBreed} onChange={(e) => setHealthBreed(e.target.value)} placeholder="e.g., Golden Retriever" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Observed Symptoms</Label>
              <Textarea value={healthSymptoms} onChange={(e) => setHealthSymptoms(e.target.value)} placeholder="Describe what you observed (e.g., dry flaky skin, red patches, excessive shedding)" rows={3} />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleHealthAnalyze} loading={loading === 'health'} className="flex-1">
                <Wand2 className="mr-2 h-4 w-4" />
                Analyze Health Concerns
              </Button>
              <Button variant="outline" onClick={loadHealthExample}>
                <FileText className="mr-2 h-4 w-4" />
                Load Example
              </Button>
            </div>
            {healthResult && (
              <div className="space-y-4">
                {/* Vet Alert Banner */}
                {healthResult.shouldSeeVet && (
                  <div className="rounded-lg bg-red-100 border border-red-300 p-4">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      <p className="font-semibold text-red-800">Veterinary Visit Recommended</p>
                    </div>
                    <p className="text-sm text-red-700 mt-1">Based on the symptoms described, we recommend consulting a veterinarian.</p>
                  </div>
                )}

                {/* Breed-Specific Notes */}
                {healthResult.breedSpecificNotes && (
                  <div className="rounded-lg bg-purple-50 border border-purple-200 p-4">
                    <p className="font-medium text-purple-800 mb-1">Breed-Specific Notes</p>
                    <p className="text-sm text-purple-700">{healthResult.breedSpecificNotes}</p>
                  </div>
                )}

                {/* Concerns List */}
                {healthResult.concerns && healthResult.concerns.length > 0 && (
                  <div className="space-y-3">
                    <p className="font-medium text-gray-700">Potential Concerns:</p>
                    {healthResult.concerns.map((concern: { condition: string; severity: string; recommendation: string; signsToWatch?: string[]; commonCauses?: string[] }, index: number) => (
                      <div key={index} className="rounded-lg border p-4 bg-white">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-gray-900">{concern.condition}</p>
                              <Badge
                                variant={
                                  concern.severity?.toLowerCase() === 'high' ? 'destructive' :
                                  concern.severity?.toLowerCase() === 'medium' ? 'warning' :
                                  'secondary'
                                }
                              >
                                {concern.severity || 'Unknown'} Severity
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mt-2">
                              <span className="font-medium">Recommendation:</span> {concern.recommendation}
                            </p>
                            {concern.commonCauses && concern.commonCauses.length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs font-medium text-gray-500">Possible Causes:</p>
                                <p className="text-xs text-gray-500">{concern.commonCauses.join(', ')}</p>
                              </div>
                            )}
                            {concern.signsToWatch && concern.signsToWatch.length > 0 && (
                              <div className="mt-2 pt-2 border-t">
                                <p className="text-xs font-medium text-orange-600">Signs to Watch:</p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {concern.signsToWatch.map((sign, j) => (
                                    <span key={j} className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded">
                                      {sign}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* General Advice */}
                {healthResult.generalAdvice && (
                  <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                    <p className="font-medium text-blue-800 mb-1">General Advice</p>
                    <p className="text-sm text-blue-700">{healthResult.generalAdvice}</p>
                  </div>
                )}

                {/* Home Care Tips */}
                {healthResult.homeCareTips && healthResult.homeCareTips.length > 0 && (
                  <div className="rounded-lg bg-green-50 border border-green-200 p-4">
                    <p className="font-medium text-green-800 mb-2">Home Care Tips for Pet Owner:</p>
                    <ul className="space-y-1">
                      {healthResult.homeCareTips.map((tip: string, i: number) => (
                        <li key={i} className="text-sm text-green-700 flex items-start gap-2">
                          <span className="text-green-500 mt-1">•</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Disclaimer */}
                <div className="rounded-lg bg-gray-100 p-3">
                  <p className="text-xs text-gray-600 italic flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    This is AI-generated guidance only. Always consult a licensed veterinarian for medical concerns.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upsell Recommender */}
        <Card id="upsell-recommender">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              AI Upsell Recommender
            </CardTitle>
            <CardDescription>Get intelligent add-on service suggestions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Current Services (comma-separated)</Label>
              <Input value={upsellServices} onChange={(e) => setUpsellServices(e.target.value)} placeholder="e.g., Basic Bath, Nail Trim" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Pet Breed</Label>
                <Input value={upsellBreed} onChange={(e) => setUpsellBreed(e.target.value)} placeholder="e.g., Poodle" />
              </div>
              <div className="space-y-2">
                <Label>Condition (Optional)</Label>
                <Input value={upsellCondition} onChange={(e) => setUpsellCondition(e.target.value)} placeholder="e.g., Matted coat" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleUpsellSuggest} loading={loading === 'upsell'} className="flex-1">
                <Wand2 className="mr-2 h-4 w-4" />
                Get Upsell Suggestions
              </Button>
              <Button variant="outline" onClick={loadUpsellExample}>
                <FileText className="mr-2 h-4 w-4" />
                Load Example
              </Button>
            </div>
            {upsellResult && (
              <div className="space-y-3">
                <p className="font-medium text-gray-700">Recommended Add-on Services:</p>
                {upsellResult.suggestions && upsellResult.suggestions.length > 0 ? (
                  upsellResult.suggestions.map((suggestion: { service: string; reason: string; priority: string; benefits?: string[]; price?: string }, i: number) => (
                    <div key={i} className="rounded-lg border bg-white p-4 hover:shadow-sm transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          <p className="font-semibold text-gray-900">{suggestion.service}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {suggestion.price && (
                            <Badge variant="outline" className="text-green-600 border-green-300">
                              {suggestion.price}
                            </Badge>
                          )}
                          <Badge variant={
                            suggestion.priority?.toLowerCase() === 'high' ? 'destructive' :
                            suggestion.priority?.toLowerCase() === 'medium' ? 'warning' : 'secondary'
                          }>
                            {suggestion.priority || 'Medium'} Priority
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{suggestion.reason}</p>
                      {suggestion.benefits && suggestion.benefits.length > 0 && (
                        <div className="mt-2 pt-2 border-t">
                          <p className="text-xs font-medium text-gray-500 mb-1">Benefits:</p>
                          <div className="flex flex-wrap gap-1">
                            {suggestion.benefits.map((benefit, j) => (
                              <span key={j} className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded">
                                {benefit}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg bg-green-50 p-4">
                    <p className="text-sm text-green-700 whitespace-pre-wrap">
                      {typeof upsellResult === 'string' ? upsellResult : JSON.stringify(upsellResult, null, 2)}
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Breed Identifier */}
        <Card id="breed-identifier">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              AI Breed Identifier
            </CardTitle>
            <CardDescription>Upload a photo to identify the dog or cat breed</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              {breedImage ? (
                <img src={breedImage} alt="Uploaded" className="mx-auto max-h-40 rounded" />
              ) : (
                <div className="text-gray-500">
                  <Upload className="mx-auto h-12 w-12 mb-2" />
                  <p>Click to upload or drag and drop</p>
                </div>
              )}
              <Input
                type="file"
                accept="image/*"
                className="mt-4"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    // Convert image to JPEG format (supported by AI vision APIs)
                    const img = document.createElement('img')
                    img.onload = () => {
                      const canvas = document.createElement('canvas')
                      canvas.width = img.width
                      canvas.height = img.height
                      const ctx = canvas.getContext('2d')
                      if (ctx) {
                        ctx.drawImage(img, 0, 0)
                        // Convert to JPEG (supported format)
                        const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.9)
                        setBreedImage(jpegDataUrl)
                      }
                    }
                    // First read as data URL to load into img element
                    const reader = new FileReader()
                    reader.onload = (event) => {
                      img.src = event.target?.result as string
                    }
                    reader.readAsDataURL(file)
                  }
                }}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleBreedIdentify} disabled={!breedImage} loading={loading === 'breed'} className="flex-1">
                <Wand2 className="mr-2 h-4 w-4" />
                Identify Breed
              </Button>
              <Button variant="outline" onClick={loadBreedExample}>
                <FileText className="mr-2 h-4 w-4" />
                Load Example
              </Button>
            </div>
            {breedResult && (
              <div className="space-y-4">
                {/* Main Breed */}
                <div className="rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-green-600 font-medium">Identified Breed</p>
                    {breedResult.confidence && (
                      <Badge variant={
                        breedResult.confidence >= 0.8 ? 'success' :
                        breedResult.confidence >= 0.5 ? 'warning' : 'secondary'
                      }>
                        {Math.round(breedResult.confidence * 100)}% Confident
                      </Badge>
                    )}
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{breedResult.breed || 'Unknown'}</p>
                </div>

                {/* Alternative Breeds */}
                {breedResult.alternativeBreeds && breedResult.alternativeBreeds.length > 0 && (
                  <div className="rounded-lg border p-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Could Also Be:</p>
                    <div className="flex flex-wrap gap-2">
                      {breedResult.alternativeBreeds.map((breed: string, i: number) => (
                        <Badge key={i} variant="outline">{breed}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Characteristics */}
                {breedResult.characteristics && breedResult.characteristics.length > 0 && (
                  <div className="rounded-lg bg-gray-50 border p-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Breed Characteristics:</p>
                    <ul className="space-y-1">
                      {breedResult.characteristics.map((char: string, i: number) => (
                        <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                          <span className="text-green-500 mt-1">•</span>
                          {char}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Appointment Estimator */}
        <Card id="appointment-optimizer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              AI Appointment Estimator
            </CardTitle>
            <CardDescription>Get accurate duration, pricing estimates, and breed-specific grooming tips</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Pet Breed *</Label>
                <Input value={appointmentBreed} onChange={(e) => setAppointmentBreed(e.target.value)} placeholder="e.g., Golden Retriever" />
              </div>
              <div className="space-y-2">
                <Label>Pet Size *</Label>
                <Select value={appointmentSize} onValueChange={setAppointmentSize}>
                  <SelectTrigger><SelectValue placeholder="Select size" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Small (under 20 lbs)">Small (under 20 lbs)</SelectItem>
                    <SelectItem value="Medium (20-50 lbs)">Medium (20-50 lbs)</SelectItem>
                    <SelectItem value="Large (50-90 lbs)">Large (50-90 lbs)</SelectItem>
                    <SelectItem value="Extra Large (90+ lbs)">Extra Large (90+ lbs)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Service Type *</Label>
              <Select value={appointmentService} onValueChange={setAppointmentService}>
                <SelectTrigger><SelectValue placeholder="Select service" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Full Grooming">Full Grooming</SelectItem>
                  <SelectItem value="Bath & Brush">Bath & Brush</SelectItem>
                  <SelectItem value="Haircut Only">Haircut Only</SelectItem>
                  <SelectItem value="De-shedding Treatment">De-shedding Treatment</SelectItem>
                  <SelectItem value="Nail Trim & Ear Cleaning">Nail Trim & Ear Cleaning</SelectItem>
                  <SelectItem value="Puppy First Groom">Puppy First Groom</SelectItem>
                  <SelectItem value="Creative Styling">Creative Styling</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Coat Condition (Optional)</Label>
              <Input value={appointmentCondition} onChange={(e) => setAppointmentCondition(e.target.value)} placeholder="e.g., Matted, Tangled, Clean" />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAppointmentEstimate} loading={loading === 'appointment'} className="flex-1">
                <Wand2 className="mr-2 h-4 w-4" />
                Get Estimate
              </Button>
              <Button variant="outline" onClick={loadAppointmentExample}>
                <FileText className="mr-2 h-4 w-4" />
                Load Example
              </Button>
            </div>

            {appointmentResult && (
              <div className="space-y-4">
                {/* Duration and Price */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-center">
                    <p className="text-xs text-blue-600 font-medium mb-1">Estimated Duration</p>
                    <p className="text-2xl font-bold text-blue-800">{appointmentResult.estimatedDuration} min</p>
                  </div>
                  <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-center">
                    <p className="text-xs text-green-600 font-medium mb-1">Price Range</p>
                    <p className="text-2xl font-bold text-green-800">
                      ${appointmentResult.priceRange?.min} - ${appointmentResult.priceRange?.max}
                    </p>
                  </div>
                </div>

                {/* Difficulty Level */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Difficulty:</span>
                  <Badge variant={
                    appointmentResult.difficultyLevel?.toLowerCase() === 'easy' ? 'success' :
                    appointmentResult.difficultyLevel?.toLowerCase() === 'expert' ? 'destructive' :
                    appointmentResult.difficultyLevel?.toLowerCase() === 'hard' ? 'warning' : 'secondary'
                  }>
                    {appointmentResult.difficultyLevel}
                  </Badge>
                </div>

                {/* Grooming Tips */}
                {appointmentResult.groomingTips && appointmentResult.groomingTips.length > 0 && (
                  <div className="rounded-lg border p-4">
                    <p className="font-medium text-gray-700 mb-3">Grooming Tips:</p>
                    <div className="space-y-2">
                      {appointmentResult.groomingTips.map((tip: { tip: string; importance: string }, i: number) => (
                        <div key={i} className="flex items-start gap-2">
                          <Badge variant={
                            tip.importance?.toLowerCase() === 'high' ? 'destructive' :
                            tip.importance?.toLowerCase() === 'medium' ? 'warning' : 'secondary'
                          } className="mt-0.5 shrink-0">
                            {tip.importance}
                          </Badge>
                          <p className="text-sm text-gray-600">{tip.tip}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tools Needed */}
                {appointmentResult.toolsNeeded && appointmentResult.toolsNeeded.length > 0 && (
                  <div className="rounded-lg bg-gray-50 p-4">
                    <p className="font-medium text-gray-700 mb-2">Tools Needed:</p>
                    <div className="flex flex-wrap gap-2">
                      {appointmentResult.toolsNeeded.map((tool: string, i: number) => (
                        <Badge key={i} variant="outline">{tool}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Warnings */}
                {appointmentResult.warnings && appointmentResult.warnings.length > 0 && (
                  <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4">
                    <p className="font-medium text-yellow-800 mb-2 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Important Notes:
                    </p>
                    <ul className="space-y-1">
                      {appointmentResult.warnings.map((warning: string, i: number) => (
                        <li key={i} className="text-sm text-yellow-700 flex items-start gap-2">
                          <span className="text-yellow-500">•</span>
                          {warning}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Photo Enhancer */}
        <Card id="photo-enhancer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5" />
              AI Photo Enhancer
            </CardTitle>
            <CardDescription>Get AI tips to improve your grooming photos for social media</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-purple-50 p-4">
              <p className="text-sm text-purple-800">
                Upload your grooming photos and get AI-powered analysis with professional tips for lighting, composition, and editing suggestions to make your photos stand out on social media.
              </p>
            </div>
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              {enhanceImage ? (
                <img src={enhanceImage} alt="Uploaded" className="mx-auto max-h-40 rounded" />
              ) : (
                <>
                  <Upload className="mx-auto h-12 w-12 mb-2 text-gray-400" />
                  <p className="text-gray-500">Upload a photo to analyze</p>
                </>
              )}
              <Input
                type="file"
                accept="image/*"
                className="mt-4"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    const img = document.createElement('img')
                    img.onload = () => {
                      const canvas = document.createElement('canvas')
                      canvas.width = img.width
                      canvas.height = img.height
                      const ctx = canvas.getContext('2d')
                      if (ctx) {
                        ctx.drawImage(img, 0, 0)
                        const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.9)
                        setEnhanceImage(jpegDataUrl)
                        setEnhanceResult(null)
                      }
                    }
                    const reader = new FileReader()
                    reader.onload = (event) => {
                      img.src = event.target?.result as string
                    }
                    reader.readAsDataURL(file)
                  }
                }}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handlePhotoEnhance} disabled={!enhanceImage} loading={loading === 'enhance'} className="flex-1">
                <Wand2 className="mr-2 h-4 w-4" />
                Analyze Photo
              </Button>
              <Button variant="outline" onClick={loadEnhanceExample}>
                <FileText className="mr-2 h-4 w-4" />
                Load Example
              </Button>
            </div>

            {enhanceResult && (
              <div className="space-y-4">
                {/* Quality Score */}
                {enhanceResult.qualityScore && (
                  <div className="rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-purple-800">Photo Quality Score</p>
                      <Badge variant={
                        enhanceResult.qualityScore >= 8 ? 'success' :
                        enhanceResult.qualityScore >= 5 ? 'warning' : 'destructive'
                      }>
                        {enhanceResult.qualityScore}/10
                      </Badge>
                    </div>
                    <p className="text-sm text-purple-700">{enhanceResult.overallAssessment}</p>
                  </div>
                )}

                {/* Enhancement Tips */}
                {enhanceResult.tips && enhanceResult.tips.length > 0 && (
                  <div className="rounded-lg border p-4">
                    <p className="font-medium text-gray-700 mb-3">Enhancement Tips:</p>
                    <div className="space-y-3">
                      {enhanceResult.tips.map((tip: { category: string; suggestion: string; priority: string }, i: number) => (
                        <div key={i} className="rounded-lg bg-gray-50 p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-purple-700">{tip.category}</span>
                            <Badge variant={
                              tip.priority?.toLowerCase() === 'high' ? 'destructive' :
                              tip.priority?.toLowerCase() === 'medium' ? 'warning' : 'secondary'
                            }>
                              {tip.priority || 'Medium'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">{tip.suggestion}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggested Caption */}
                {enhanceResult.suggestedCaption && (
                  <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                    <p className="font-medium text-blue-800 mb-2">Suggested Social Media Caption:</p>
                    <p className="text-sm text-blue-700 italic">"{enhanceResult.suggestedCaption}"</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => {
                        navigator.clipboard.writeText(enhanceResult.suggestedCaption)
                        toast.success('Caption copied!')
                      }}
                    >
                      Copy Caption
                    </Button>
                  </div>
                )}

                {/* Hashtags */}
                {enhanceResult.hashtags && enhanceResult.hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {enhanceResult.hashtags.map((tag: string, i: number) => (
                      <span key={i} className="text-sm text-purple-600 hover:text-purple-800 cursor-pointer" onClick={() => {
                        navigator.clipboard.writeText('#' + tag)
                        toast.success('Hashtag copied!')
                      }}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Client Message Generator */}
        <Card id="client-messenger">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              AI Client Messenger
            </CardTitle>
            <CardDescription>Generate professional client communications instantly</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Message Type *</Label>
              <Select value={messageType} onValueChange={setMessageType}>
                <SelectTrigger><SelectValue placeholder="Select message type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="booking_confirmation">Booking Confirmation</SelectItem>
                  <SelectItem value="reschedule_request">Reschedule Request</SelectItem>
                  <SelectItem value="cancellation">Cancellation Notice</SelectItem>
                  <SelectItem value="follow_up">Follow-up / Review Request</SelectItem>
                  <SelectItem value="no_show">No-Show Reminder</SelectItem>
                  <SelectItem value="waitlist_available">Waitlist Availability</SelectItem>
                  <SelectItem value="service_complete">Pet Ready for Pickup</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Client Name *</Label>
                <Input value={messageClient} onChange={(e) => setMessageClient(e.target.value)} placeholder="e.g., John Smith" />
              </div>
              <div className="space-y-2">
                <Label>Pet Name *</Label>
                <Input value={messagePet} onChange={(e) => setMessagePet(e.target.value)} placeholder="e.g., Max" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Additional Context (Optional)</Label>
              <Textarea
                value={messageContext}
                onChange={(e) => setMessageContext(e.target.value)}
                placeholder="e.g., Appointment is tomorrow at 2pm, or 'Left a great tip last time'"
                rows={2}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleGenerateClientMessage} loading={loading === 'message'} className="flex-1">
                <Wand2 className="mr-2 h-4 w-4" />
                Generate Message
              </Button>
              <Button variant="outline" onClick={loadMessageExample}>
                <FileText className="mr-2 h-4 w-4" />
                Load Example
              </Button>
            </div>

            {messageResult && (
              <div className="space-y-4">
                {/* Subject Line */}
                {messageResult.subject && (
                  <div className="rounded-lg bg-indigo-100 border border-indigo-200 p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-indigo-600 font-medium mb-1">Subject Line:</p>
                        <p className="text-indigo-900 font-medium">{messageResult.subject}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(messageResult.subject)
                          toast.success('Subject copied!')
                        }}
                      >
                        Copy
                      </Button>
                    </div>
                  </div>
                )}

                {/* Message Body */}
                <div className="rounded-lg bg-white border p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-gray-500 font-medium">Message:</p>
                    {messageResult.tone && (
                      <Badge variant="outline">{messageResult.tone} tone</Badge>
                    )}
                  </div>
                  <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{messageResult.message}</p>
                </div>

                {/* Call to Action */}
                {messageResult.callToAction && (
                  <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                    <p className="text-xs text-green-600 font-medium mb-1">Suggested Call to Action:</p>
                    <p className="text-sm text-green-800">{messageResult.callToAction}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const fullMessage = messageResult.subject
                        ? `Subject: ${messageResult.subject}\n\n${messageResult.message}`
                        : messageResult.message
                      navigator.clipboard.writeText(fullMessage)
                      toast.success('Full message copied!')
                    }}
                  >
                    Copy All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(messageResult.message)
                      toast.success('Message body copied!')
                    }}
                  >
                    Copy Message Only
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Diet Recommender */}
        <Card id="diet-recommender">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Utensils className="h-5 w-5" />
              AI Diet Recommender
            </CardTitle>
            <CardDescription>Get personalized nutrition and feeding recommendations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Pet Type *</Label>
                <Select value={dietPetType} onValueChange={setDietPetType}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Dog">Dog</SelectItem>
                    <SelectItem value="Cat">Cat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Breed *</Label>
                <Input value={dietBreed} onChange={(e) => setDietBreed(e.target.value)} placeholder="e.g., Golden Retriever" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Age *</Label>
                <Input value={dietAge} onChange={(e) => setDietAge(e.target.value)} placeholder="e.g., 3 years" />
              </div>
              <div className="space-y-2">
                <Label>Weight (lbs) *</Label>
                <Input type="number" value={dietWeight} onChange={(e) => setDietWeight(e.target.value)} placeholder="e.g., 70" />
              </div>
              <div className="space-y-2">
                <Label>Activity Level *</Label>
                <Select value={dietActivity} onValueChange={setDietActivity}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sedentary">Sedentary</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Moderate">Moderate</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Very High">Very High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Health Conditions (Optional)</Label>
                <Input value={dietHealth} onChange={(e) => setDietHealth(e.target.value)} placeholder="e.g., Allergies, diabetes" />
              </div>
              <div className="space-y-2">
                <Label>Current Diet (Optional)</Label>
                <Input value={dietCurrent} onChange={(e) => setDietCurrent(e.target.value)} placeholder="e.g., Dry kibble twice daily" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleDietRecommend} loading={loading === 'diet'} className="flex-1">
                <Wand2 className="mr-2 h-4 w-4" />
                Get Diet Recommendations
              </Button>
              <Button variant="outline" onClick={loadDietExample}>
                <FileText className="mr-2 h-4 w-4" />
                Load Example
              </Button>
            </div>

            {dietResult && (
              <div className="space-y-4">
                {/* Daily Calories & Feeding Schedule */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 p-4 text-center">
                    <p className="text-xs text-green-600 font-medium mb-1">Daily Calories</p>
                    <p className="text-2xl font-bold text-green-800">{dietResult.dailyCalories || 'N/A'} cal</p>
                  </div>
                  {dietResult.feedingSchedule && (
                    <div className="rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-4 text-center">
                      <p className="text-xs text-blue-600 font-medium mb-1">Meals Per Day</p>
                      <p className="text-2xl font-bold text-blue-800">{dietResult.feedingSchedule.mealsPerDay || 2}</p>
                      {dietResult.feedingSchedule.bestTimes && (
                        <p className="text-xs text-blue-600 mt-1">{dietResult.feedingSchedule.bestTimes.join(' & ')}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Recommendations */}
                {dietResult.recommendations && dietResult.recommendations.length > 0 && (
                  <div className="space-y-3">
                    <p className="font-medium text-gray-700">Nutrition Recommendations:</p>
                    {dietResult.recommendations.map((rec: any, i: number) => (
                      <div key={i} className="rounded-lg border bg-white p-4 hover:shadow-sm transition-shadow">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-green-600 border-green-300">{rec.category}</Badge>
                            {rec.portionSize && <span className="text-xs text-gray-500">{rec.portionSize}</span>}
                          </div>
                          {rec.frequency && <span className="text-xs text-purple-600 font-medium">{rec.frequency}</span>}
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{rec.suggestion}</p>
                        {rec.benefits && rec.benefits.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {rec.benefits.map((benefit: string, j: number) => (
                              <span key={j} className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded">{benefit}</span>
                            ))}
                          </div>
                        )}
                        {rec.brands && rec.brands.length > 0 && (
                          <p className="text-xs text-gray-500">Recommended brands: {rec.brands.join(', ')}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Foods to Avoid */}
                {dietResult.foodsToAvoid && dietResult.foodsToAvoid.length > 0 && (
                  <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                    <p className="font-medium text-red-800 mb-2 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Foods to Avoid:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {dietResult.foodsToAvoid.map((food: string, i: number) => (
                        <Badge key={i} variant="destructive">{food}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Supplements */}
                {dietResult.supplementsNeeded && dietResult.supplementsNeeded.length > 0 && (
                  <div className="rounded-lg bg-purple-50 border border-purple-200 p-4">
                    <p className="font-medium text-purple-800 mb-2">Recommended Supplements:</p>
                    <ul className="space-y-1">
                      {dietResult.supplementsNeeded.map((supp: string, i: number) => (
                        <li key={i} className="text-sm text-purple-700 flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-purple-500 mt-0.5 shrink-0" />
                          {supp}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Hydration Tips */}
                {dietResult.hydrationTips && dietResult.hydrationTips.length > 0 && (
                  <div className="rounded-lg bg-cyan-50 border border-cyan-200 p-4">
                    <p className="font-medium text-cyan-800 mb-2">Hydration Tips:</p>
                    <ul className="space-y-1">
                      {dietResult.hydrationTips.map((tip: string, i: number) => (
                        <li key={i} className="text-sm text-cyan-700 flex items-start gap-2">
                          <span className="text-cyan-500">•</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Special Considerations */}
                {dietResult.specialConsiderations && (
                  <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
                    <p className="font-medium text-amber-800 mb-1">Special Considerations:</p>
                    <p className="text-sm text-amber-700">{dietResult.specialConsiderations}</p>
                  </div>
                )}

                {/* Disclaimer */}
                <div className="rounded-lg bg-gray-100 p-3">
                  <p className="text-xs text-gray-600 italic flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    This is AI-generated guidance. Consult a veterinarian for personalized dietary advice.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Behavior Analyzer */}
        <Card id="behavior-analyzer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Behavior Analyzer
            </CardTitle>
            <CardDescription>Understand and address pet behavior patterns</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Pet Type *</Label>
                <Select value={behaviorPetType} onValueChange={setBehaviorPetType}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Dog">Dog</SelectItem>
                    <SelectItem value="Cat">Cat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Breed *</Label>
                <Input value={behaviorBreed} onChange={(e) => setBehaviorBreed(e.target.value)} placeholder="e.g., German Shepherd" />
              </div>
              <div className="space-y-2">
                <Label>Age *</Label>
                <Input value={behaviorAge} onChange={(e) => setBehaviorAge(e.target.value)} placeholder="e.g., 2 years" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Behavior Description *</Label>
              <Textarea
                value={behaviorDescription}
                onChange={(e) => setBehaviorDescription(e.target.value)}
                placeholder="Describe the behavior you want to understand (e.g., excessive barking, aggression, anxiety, destructive behavior)"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Context/Situation (Optional)</Label>
                <Input value={behaviorContext} onChange={(e) => setBehaviorContext(e.target.value)} placeholder="e.g., When left alone, during walks" />
              </div>
              <div className="space-y-2">
                <Label>How Often (Optional)</Label>
                <Select value={behaviorFrequency} onValueChange={setBehaviorFrequency}>
                  <SelectTrigger><SelectValue placeholder="Select frequency" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Rarely">Rarely</SelectItem>
                    <SelectItem value="Sometimes">Sometimes</SelectItem>
                    <SelectItem value="Often">Often</SelectItem>
                    <SelectItem value="Multiple times daily">Multiple times daily</SelectItem>
                    <SelectItem value="Constantly">Constantly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleBehaviorAnalyze} loading={loading === 'behavior'} className="flex-1">
                <Wand2 className="mr-2 h-4 w-4" />
                Analyze Behavior
              </Button>
              <Button variant="outline" onClick={loadBehaviorExample}>
                <FileText className="mr-2 h-4 w-4" />
                Load Example
              </Button>
            </div>

            {behaviorResult && (
              <div className="space-y-4">
                {/* Analysis Summary */}
                {behaviorResult.analysis && (
                  <div className="rounded-lg bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-xs text-indigo-600 font-medium mb-1">Behavior Type</p>
                        <p className="text-xl font-bold text-indigo-800">{behaviorResult.analysis.behaviorType || 'Unknown'}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant={
                          behaviorResult.analysis.severity?.toLowerCase() === 'high' ? 'destructive' :
                          behaviorResult.analysis.severity?.toLowerCase() === 'medium' ? 'warning' : 'secondary'
                        }>
                          {behaviorResult.analysis.severity || 'Unknown'} Severity
                        </Badge>
                        {behaviorResult.analysis.breedTypical && (
                          <Badge variant="outline" className="text-purple-600 border-purple-300">Breed Typical</Badge>
                        )}
                      </div>
                    </div>
                    {behaviorResult.analysis.possibleCauses && behaviorResult.analysis.possibleCauses.length > 0 && (
                      <div>
                        <p className="text-xs text-indigo-600 font-medium mb-1">Possible Causes:</p>
                        <div className="flex flex-wrap gap-1">
                          {behaviorResult.analysis.possibleCauses.map((cause: string, i: number) => (
                            <span key={i} className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">{cause}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Professional Help Alert */}
                {behaviorResult.professionalHelpNeeded && (
                  <div className="rounded-lg bg-red-100 border border-red-300 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      <p className="font-semibold text-red-800">Professional Help Recommended</p>
                    </div>
                    <p className="text-sm text-red-700">{behaviorResult.professionalHelpReason || 'Consider consulting a certified animal behaviorist or veterinarian.'}</p>
                  </div>
                )}

                {/* Recommendations */}
                {behaviorResult.recommendations && behaviorResult.recommendations.length > 0 && (
                  <div className="space-y-3">
                    <p className="font-medium text-gray-700">Training Approaches:</p>
                    {behaviorResult.recommendations.map((rec: any, i: number) => (
                      <div key={i} className="rounded-lg border bg-white p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-blue-600 border-blue-300">{rec.approach}</Badge>
                            <Badge variant={
                              rec.difficulty?.toLowerCase() === 'hard' ? 'destructive' :
                              rec.difficulty?.toLowerCase() === 'medium' ? 'warning' : 'success'
                            }>
                              {rec.difficulty || 'Medium'}
                            </Badge>
                          </div>
                          {rec.timeToResult && (
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {rec.timeToResult}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 mb-3">{rec.description}</p>
                        {rec.steps && rec.steps.length > 0 && (
                          <div className="bg-gray-50 rounded p-3">
                            <p className="text-xs font-medium text-gray-600 mb-2">Steps:</p>
                            <ol className="space-y-1">
                              {rec.steps.map((step: string, j: number) => (
                                <li key={j} className="text-xs text-gray-600 flex items-start gap-2">
                                  <span className="font-bold text-blue-600">{j + 1}.</span>
                                  {step}
                                </li>
                              ))}
                            </ol>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Training Tips */}
                {behaviorResult.trainingTips && behaviorResult.trainingTips.length > 0 && (
                  <div className="rounded-lg bg-green-50 border border-green-200 p-4">
                    <p className="font-medium text-green-800 mb-3">Training Tips:</p>
                    <div className="space-y-2">
                      {behaviorResult.trainingTips.map((tip: any, i: number) => (
                        <div key={i} className="flex items-start gap-2">
                          <Badge variant={
                            tip.importance?.toLowerCase() === 'high' ? 'destructive' :
                            tip.importance?.toLowerCase() === 'medium' ? 'warning' : 'secondary'
                          } className="shrink-0 mt-0.5">
                            {tip.importance}
                          </Badge>
                          <div>
                            <p className="text-sm text-green-700">{tip.tip}</p>
                            <p className="text-xs text-green-600">{tip.category}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Positive Reinforcement */}
                {behaviorResult.positiveReinforcement && behaviorResult.positiveReinforcement.length > 0 && (
                  <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4">
                    <p className="font-medium text-yellow-800 mb-2">Positive Reinforcement Methods:</p>
                    <div className="flex flex-wrap gap-2">
                      {behaviorResult.positiveReinforcement.map((method: string, i: number) => (
                        <Badge key={i} variant="outline" className="text-yellow-700 border-yellow-400 bg-yellow-100">{method}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Environmental Changes */}
                {behaviorResult.environmentalChanges && behaviorResult.environmentalChanges.length > 0 && (
                  <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                    <p className="font-medium text-blue-800 mb-2">Environmental Changes:</p>
                    <ul className="space-y-1">
                      {behaviorResult.environmentalChanges.map((change: string, i: number) => (
                        <li key={i} className="text-sm text-blue-700 flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                          {change}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Warning Signs */}
                {behaviorResult.warningSignsToWatch && behaviorResult.warningSignsToWatch.length > 0 && (
                  <div className="rounded-lg bg-orange-50 border border-orange-200 p-4">
                    <p className="font-medium text-orange-800 mb-2 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Warning Signs to Watch:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {behaviorResult.warningSignsToWatch.map((sign: string, i: number) => (
                        <span key={i} className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">{sign}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Expected Outcome */}
                {behaviorResult.expectedOutcome && (
                  <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4">
                    <p className="font-medium text-emerald-800 mb-1">Expected Outcome:</p>
                    <p className="text-sm text-emerald-700">{behaviorResult.expectedOutcome}</p>
                  </div>
                )}

                {/* Disclaimer */}
                <div className="rounded-lg bg-gray-100 p-3">
                  <p className="text-xs text-gray-600 italic flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    This is AI-generated guidance. For serious behavioral issues, consult a certified animal behaviorist.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ========== VETERINARY AI TOOLS ========== */}
      <div className="border-t pt-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Stethoscope className="h-6 w-6 text-primary-600" />
          Veterinary AI Tools
        </h2>
        <p className="text-gray-500 mb-6">Clinical AI tools for veterinary diagnosis, treatment planning, symptom analysis, and drug interaction checking.</p>
      </div>

      {/* AI Diagnosis */}
      <div className="grid gap-6 lg:grid-cols-2" id="vet-diagnosis">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-red-500" />
              AI Veterinary Diagnosis
            </CardTitle>
            <CardDescription>Get differential diagnoses based on symptoms</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Species *</Label>
                <Select value={diagSpecies} onValueChange={setDiagSpecies}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Dog">Dog</SelectItem>
                    <SelectItem value="Cat">Cat</SelectItem>
                    <SelectItem value="Bird">Bird</SelectItem>
                    <SelectItem value="Rabbit">Rabbit</SelectItem>
                    <SelectItem value="Reptile">Reptile</SelectItem>
                    <SelectItem value="Horse">Horse</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Breed</Label>
                <Input value={diagBreed} onChange={(e) => setDiagBreed(e.target.value)} placeholder="e.g. Golden Retriever" />
              </div>
            </div>
            <div>
              <Label>Age</Label>
              <Input value={diagAge} onChange={(e) => setDiagAge(e.target.value)} placeholder="e.g. 5 years" />
            </div>
            <div>
              <Label>Symptoms *</Label>
              <Textarea value={diagSymptoms} onChange={(e) => setDiagSymptoms(e.target.value)} placeholder="Describe symptoms in detail" rows={3} />
            </div>
            <div>
              <Label>Medical History</Label>
              <Textarea value={diagHistory} onChange={(e) => setDiagHistory(e.target.value)} placeholder="Previous conditions, surgeries, etc." rows={2} />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleDiagnosis} disabled={loading === 'diagnosis'} className="flex-1">
                {loading === 'diagnosis' ? <><Clock className="h-4 w-4 mr-2 animate-spin" /> Analyzing...</> : <><Sparkles className="h-4 w-4 mr-2" /> Get Diagnosis</>}
              </Button>
              <Button variant="outline" onClick={() => { setDiagSpecies('Dog'); setDiagBreed('Bulldog'); setDiagAge('4 years'); setDiagSymptoms('Excessive scratching, skin redness, hot spots on belly and legs, occasional ear infections'); setDiagHistory('History of seasonal allergies'); setDiagResult(null); toast.success('Example loaded!') }}>
                Load Example
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Diagnosis Results */}
        <Card>
          <CardHeader>
            <CardTitle>Diagnosis Results</CardTitle>
          </CardHeader>
          <CardContent>
            {!diagResult ? (
              <p className="text-gray-400 text-center py-8">Submit symptoms to get AI-powered differential diagnoses</p>
            ) : (
              <div className="space-y-4">
                {diagResult.diagnoses && diagResult.diagnoses.map((d: any, i: number) => (
                  <div key={i} className="rounded-lg border p-3">
                    <div className="flex justify-between items-center mb-1">
                      <p className="font-medium">{d.condition}</p>
                      <Badge>{d.likelihood}</Badge>
                    </div>
                    <p className="text-sm text-gray-600">{d.description}</p>
                  </div>
                ))}
                {diagResult.recommendedTests && (
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="font-medium text-blue-800 mb-1">Recommended Tests</p>
                    <ul className="text-sm text-blue-700 space-y-1">{diagResult.recommendedTests.map((t: string, i: number) => <li key={i}>• {t}</li>)}</ul>
                  </div>
                )}
                {diagResult.urgencyLevel && (
                  <div className={`rounded-lg p-3 ${diagResult.urgencyLevel.toLowerCase().includes('high') || diagResult.urgencyLevel.toLowerCase().includes('critical') ? 'bg-red-50 text-red-800' : diagResult.urgencyLevel.toLowerCase().includes('medium') ? 'bg-yellow-50 text-yellow-800' : 'bg-green-50 text-green-800'}`}>
                    <p className="font-medium">Urgency: {diagResult.urgencyLevel}</p>
                  </div>
                )}
                {diagResult.additionalNotes && <p className="text-sm text-gray-600 italic">{diagResult.additionalNotes}</p>}
                <p className="text-xs text-gray-400 italic">This is AI-generated guidance. Always consult a licensed veterinarian.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Treatment Plan */}
      <div className="grid gap-6 lg:grid-cols-2" id="vet-treatment">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-green-500" />
              AI Treatment Plan
            </CardTitle>
            <CardDescription>Generate comprehensive treatment recommendations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Species *</Label>
                <Select value={treatSpecies} onValueChange={setTreatSpecies}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Dog">Dog</SelectItem>
                    <SelectItem value="Cat">Cat</SelectItem>
                    <SelectItem value="Bird">Bird</SelectItem>
                    <SelectItem value="Rabbit">Rabbit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Breed</Label>
                <Input value={treatBreed} onChange={(e) => setTreatBreed(e.target.value)} placeholder="Breed" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Age</Label>
                <Input value={treatAge} onChange={(e) => setTreatAge(e.target.value)} placeholder="e.g. 5 years" />
              </div>
              <div>
                <Label>Weight (kg)</Label>
                <Input value={treatWeight} onChange={(e) => setTreatWeight(e.target.value)} placeholder="e.g. 25" />
              </div>
            </div>
            <div>
              <Label>Diagnosis *</Label>
              <Textarea value={treatDiagnosis} onChange={(e) => setTreatDiagnosis(e.target.value)} placeholder="Enter confirmed or suspected diagnosis" rows={2} />
            </div>
            <div>
              <Label>Current Medications</Label>
              <Input value={treatMedications} onChange={(e) => setTreatMedications(e.target.value)} placeholder="List current medications" />
            </div>
            <Button onClick={handleTreatment} disabled={loading === 'treatment'} className="w-full">
              {loading === 'treatment' ? <><Clock className="h-4 w-4 mr-2 animate-spin" /> Generating...</> : <><Sparkles className="h-4 w-4 mr-2" /> Generate Treatment Plan</>}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Treatment Plan</CardTitle></CardHeader>
          <CardContent>
            {!treatResult ? (
              <p className="text-gray-400 text-center py-8">Enter diagnosis details to generate a treatment plan</p>
            ) : (
              <div className="space-y-4">
                {treatResult.treatmentPlan && <div className="bg-green-50 rounded-lg p-3"><p className="text-sm text-green-800 whitespace-pre-wrap">{treatResult.treatmentPlan}</p></div>}
                {treatResult.medications && treatResult.medications.length > 0 && (
                  <div>
                    <p className="font-medium mb-2">Medications</p>
                    {treatResult.medications.map((m: any, i: number) => (
                      <div key={i} className="border rounded-lg p-2 mb-2 text-sm">
                        <p className="font-medium">{m.name}</p>
                        <p className="text-gray-600">Dosage: {m.dosage} | Freq: {m.frequency} | Duration: {m.duration}</p>
                        {m.notes && <p className="text-gray-500 italic">{m.notes}</p>}
                      </div>
                    ))}
                  </div>
                )}
                {treatResult.followUpSchedule && <div className="bg-blue-50 rounded-lg p-3"><p className="text-sm"><span className="font-medium">Follow-up:</span> {treatResult.followUpSchedule}</p></div>}
                {treatResult.prognosis && <div className="bg-purple-50 rounded-lg p-3"><p className="text-sm"><span className="font-medium">Prognosis:</span> {treatResult.prognosis}</p></div>}
                <p className="text-xs text-gray-400 italic">AI-generated guidance. Consult a licensed veterinarian.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Symptom Checker */}
      <div className="grid gap-6 lg:grid-cols-2" id="vet-symptom-checker">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              AI Symptom Checker
            </CardTitle>
            <CardDescription>Urgency-based symptom analysis with color-coded assessment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Species *</Label>
              <Select value={symptomSpecies} onValueChange={setSymptomSpecies}>
                <SelectTrigger><SelectValue placeholder="Select species" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Dog">Dog</SelectItem>
                  <SelectItem value="Cat">Cat</SelectItem>
                  <SelectItem value="Bird">Bird</SelectItem>
                  <SelectItem value="Rabbit">Rabbit</SelectItem>
                  <SelectItem value="Reptile">Reptile</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Symptoms *</Label>
              <Textarea value={symptomSymptoms} onChange={(e) => setSymptomSymptoms(e.target.value)} placeholder="Describe all observed symptoms" rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Duration</Label>
                <Input value={symptomDuration} onChange={(e) => setSymptomDuration(e.target.value)} placeholder="e.g. 3 days" />
              </div>
              <div>
                <Label>Severity</Label>
                <Select value={symptomSeverity} onValueChange={setSymptomSeverity}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mild">Mild</SelectItem>
                    <SelectItem value="Moderate">Moderate</SelectItem>
                    <SelectItem value="Severe">Severe</SelectItem>
                    <SelectItem value="Critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleSymptomCheck} disabled={loading === 'symptom'} className="w-full">
              {loading === 'symptom' ? <><Clock className="h-4 w-4 mr-2 animate-spin" /> Analyzing...</> : <><Sparkles className="h-4 w-4 mr-2" /> Check Symptoms</>}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Symptom Analysis</CardTitle></CardHeader>
          <CardContent>
            {!symptomResult ? (
              <p className="text-gray-400 text-center py-8">Enter symptoms for urgency-based analysis</p>
            ) : (
              <div className="space-y-4">
                {symptomResult.urgencyAssessment && (
                  <div className={`rounded-lg p-4 border-2 ${symptomResult.urgencyAssessment.color === 'Red' ? 'bg-red-50 border-red-400' : symptomResult.urgencyAssessment.color === 'Orange' ? 'bg-orange-50 border-orange-400' : symptomResult.urgencyAssessment.color === 'Yellow' ? 'bg-yellow-50 border-yellow-400' : 'bg-green-50 border-green-400'}`}>
                    <p className="font-bold text-lg">{symptomResult.urgencyAssessment.level}</p>
                    <p className="text-sm">{symptomResult.urgencyAssessment.description}</p>
                  </div>
                )}
                {symptomResult.symptomAnalysis && <div className="bg-gray-50 rounded-lg p-3"><p className="text-sm whitespace-pre-wrap">{symptomResult.symptomAnalysis}</p></div>}
                {symptomResult.possibleConditions && symptomResult.possibleConditions.map((c: any, i: number) => (
                  <div key={i} className="border rounded-lg p-3">
                    <div className="flex justify-between"><p className="font-medium">{c.condition}</p><Badge>{c.likelihood}</Badge></div>
                    <p className="text-sm text-gray-600">{c.description}</p>
                  </div>
                ))}
                {symptomResult.emergencyIndicators && symptomResult.emergencyIndicators.length > 0 && (
                  <div className="bg-red-50 rounded-lg p-3">
                    <p className="font-medium text-red-800 mb-1">Emergency Indicators</p>
                    <ul className="text-sm text-red-700">{symptomResult.emergencyIndicators.map((e: string, i: number) => <li key={i}>• {e}</li>)}</ul>
                  </div>
                )}
                <p className="text-xs text-gray-400 italic">AI-generated guidance. Seek veterinary care for urgent/emergency cases.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Drug Interaction Checker */}
      <div className="grid gap-6 lg:grid-cols-2" id="vet-drug-interaction">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-500" />
              AI Drug Interaction Checker
            </CardTitle>
            <CardDescription>Check for veterinary medication interactions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Species *</Label>
              <Select value={drugSpecies} onValueChange={setDrugSpecies}>
                <SelectTrigger><SelectValue placeholder="Select species" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Dog">Dog</SelectItem>
                  <SelectItem value="Cat">Cat</SelectItem>
                  <SelectItem value="Bird">Bird</SelectItem>
                  <SelectItem value="Rabbit">Rabbit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Medications *</Label>
              <Textarea value={drugMedications} onChange={(e) => setDrugMedications(e.target.value)} placeholder="List all medications (one per line or comma-separated)" rows={3} />
            </div>
            <div>
              <Label>Weight (kg)</Label>
              <Input value={drugWeight} onChange={(e) => setDrugWeight(e.target.value)} placeholder="Animal weight for dosage checks" />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleDrugInteraction} disabled={loading === 'drug'} className="flex-1">
                {loading === 'drug' ? <><Clock className="h-4 w-4 mr-2 animate-spin" /> Checking...</> : <><Sparkles className="h-4 w-4 mr-2" /> Check Interactions</>}
              </Button>
              <Button variant="outline" onClick={() => { setDrugSpecies('Dog'); setDrugMedications('Carprofen 75mg, Gabapentin 100mg, Prednisone 10mg'); setDrugWeight('25'); setDrugResult(null); toast.success('Example loaded!') }}>
                Load Example
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Interaction Analysis</CardTitle></CardHeader>
          <CardContent>
            {!drugResult ? (
              <p className="text-gray-400 text-center py-8">Enter medications to check for interactions</p>
            ) : (
              <div className="space-y-4">
                {drugResult.overallRisk && (
                  <div className={`rounded-lg p-3 font-medium ${drugResult.overallRisk.toLowerCase().includes('high') || drugResult.overallRisk.toLowerCase().includes('contraindicated') ? 'bg-red-100 text-red-800' : drugResult.overallRisk.toLowerCase().includes('moderate') ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                    Overall Risk: {drugResult.overallRisk}
                  </div>
                )}
                {drugResult.interactions && drugResult.interactions.map((int: any, i: number) => (
                  <div key={i} className="border rounded-lg p-3">
                    <div className="flex justify-between items-center mb-1">
                      <p className="font-medium text-sm">{int.drug1} + {int.drug2}</p>
                      <Badge className={int.riskLevel?.toLowerCase().includes('high') ? 'bg-red-100 text-red-800' : int.riskLevel?.toLowerCase().includes('moderate') ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}>{int.riskLevel}</Badge>
                    </div>
                    <p className="text-sm text-gray-600">{int.description}</p>
                    {int.recommendation && <p className="text-sm text-blue-600 mt-1">{int.recommendation}</p>}
                  </div>
                ))}
                {drugResult.monitoringRecommendations && drugResult.monitoringRecommendations.length > 0 && (
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="font-medium text-blue-800 mb-1">Monitoring Recommendations</p>
                    <ul className="text-sm text-blue-700">{drugResult.monitoringRecommendations.map((m: string, i: number) => <li key={i}>• {m}</li>)}</ul>
                  </div>
                )}
                <p className="text-xs text-gray-400 italic">AI-generated guidance. Always verify with a veterinary pharmacist.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
