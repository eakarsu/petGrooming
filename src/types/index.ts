import { Prisma } from '@prisma/client'

// Client with related data
export type ClientWithPets = Prisma.ClientGetPayload<{
  include: { pets: true }
}>

// Pet with full relations
export type PetWithRelations = Prisma.PetGetPayload<{
  include: {
    breed: true
    client: true
    vaccinationRecords: true
    behavioralNotes: true
    groomingHistory: true
    photos: true
    healthAlerts: true
    groomingPreferences: true
  }
}>

// Appointment with relations
export type AppointmentWithRelations = Prisma.AppointmentGetPayload<{
  include: {
    client: true
    pet: { include: { breed: true } }
    groomer: true
    services: { include: { service: true } }
  }
}>

// Transaction with relations
export type TransactionWithRelations = Prisma.TransactionGetPayload<{
  include: {
    client: true
    staff: true
    items: {
      include: {
        service: true
        package: true
        product: true
      }
    }
    giftCard: true
  }
}>

// Service with breed pricing
export type ServiceWithBreedPricing = Prisma.ServiceGetPayload<{
  include: {
    breedServices: { include: { breed: true } }
  }
}>

// Dashboard stats
export interface DashboardStats {
  todayAppointments: number
  weekRevenue: number
  totalClients: number
  totalPets: number
  pendingCheckIns: number
  completedToday: number
}

// API Response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Form types
export interface SelectOption {
  value: string
  label: string
}

// Calendar types
export interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  resourceId?: string
  backgroundColor?: string
}
