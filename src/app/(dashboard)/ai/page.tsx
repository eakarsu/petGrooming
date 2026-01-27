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

  const aiFeatures = [
    { id: 'breed-identifier', title: 'AI Breed Identifier', description: 'Upload a photo to identify the breed', icon: Camera, status: 'active' },
    { id: 'style-suggester', title: 'AI Style Suggester', description: 'Get grooming style recommendations', icon: Sparkles, status: 'active' },
    { id: 'health-spotter', title: 'AI Health Spotter', description: 'Identify skin and coat issues', icon: Heart, status: 'active' },
    { id: 'social-generator', title: 'AI Social Generator', description: 'Generate social media posts', icon: MessageSquare, status: 'active' },
    { id: 'reminder-generator', title: 'AI Reminder Generator', description: 'Create personalized reminders', icon: MessageSquare, status: 'active' },
    { id: 'upsell-recommender', title: 'AI Upsell Recommender', description: 'Suggest add-on services', icon: TrendingUp, status: 'active' },
    { id: 'appointment-optimizer', title: 'AI Appointment Estimator', description: 'Get duration, pricing & grooming tips', icon: Calendar, status: 'active' },
    { id: 'photo-enhancer', title: 'AI Photo Enhancer', description: 'Enhance before/after photos', icon: Image, status: 'active' },
    { id: 'client-messenger', title: 'AI Client Messenger', description: 'Generate professional client messages', icon: MessageSquare, status: 'active' },
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
      </div>
    </div>
  )
}
