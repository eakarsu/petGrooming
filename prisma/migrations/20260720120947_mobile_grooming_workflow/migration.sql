-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MANAGER', 'GROOMER', 'RECEPTIONIST', 'STAFF');

-- CreateEnum
CREATE TYPE "Species" AS ENUM ('DOG', 'CAT', 'OTHER');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "BreedSize" AS ENUM ('EXTRA_SMALL', 'SMALL', 'MEDIUM', 'LARGE', 'EXTRA_LARGE');

-- CreateEnum
CREATE TYPE "BehaviorCategory" AS ENUM ('AGGRESSION', 'ANXIETY', 'FEAR', 'SENSITIVITY', 'HANDLING', 'OTHER');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('PENDING', 'CHECKED_IN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('SCHEDULED', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "ServiceCategory" AS ENUM ('BATH', 'HAIRCUT', 'STYLING', 'NAIL_CARE', 'EAR_CARE', 'TEETH_CARE', 'SPECIALTY', 'ADD_ON');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'GIFT_CARD', 'LOYALTY_POINTS', 'MIXED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'REFUNDED', 'FAILED');

-- CreateEnum
CREATE TYPE "ItemType" AS ENUM ('SERVICE', 'PACKAGE', 'PRODUCT');

-- CreateEnum
CREATE TYPE "ProductCategory" AS ENUM ('SHAMPOO', 'CONDITIONER', 'BRUSH', 'COLLAR', 'LEASH', 'TOY', 'TREAT', 'ACCESSORY', 'OTHER');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('VACCINATION_EXPIRED', 'HEALTH_CONDITION', 'SKIN_ISSUE', 'COAT_ISSUE', 'BEHAVIOR_CONCERN', 'INJURY', 'ALLERGY', 'OTHER');

-- CreateEnum
CREATE TYPE "IncidentType" AS ENUM ('PET_INJURY', 'STAFF_INJURY', 'EQUIPMENT_FAILURE', 'ESCAPE_ATTEMPT', 'AGGRESSION', 'ALLERGIC_REACTION', 'OTHER');

-- CreateEnum
CREATE TYPE "PrescriptionStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LabStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SurgeryStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "WorkflowQuoteStatus" AS ENUM ('DRAFT', 'OFFERED', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'FAILED');

-- CreateEnum
CREATE TYPE "WorkflowBookingStatus" AS ENUM ('BOOKED', 'DISPATCHED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "WorkflowJobStatus" AS ENUM ('NOT_STARTED', 'CHECKED_IN', 'IN_PROGRESS', 'PARTIAL', 'COMPLETED', 'NO_SHOW', 'CANCELLED');

-- CreateEnum
CREATE TYPE "WorkflowChangeStatus" AS ENUM ('REQUESTED', 'APPROVED', 'REJECTED', 'VOIDED');

-- CreateEnum
CREATE TYPE "WorkflowInvoiceStatus" AS ENUM ('DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'PARTIALLY_REFUNDED', 'REFUNDED', 'VOID');

-- CreateEnum
CREATE TYPE "WorkflowPaymentStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'PARTIALLY_REFUNDED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "ProviderKind" AS ENUM ('MAPS', 'CALENDAR', 'MESSAGING', 'PAYMENT', 'TAX', 'ACCOUNTING');

-- CreateEnum
CREATE TYPE "IntegrationOperationStatus" AS ENUM ('PENDING', 'LEASED', 'RETRY', 'COMPLETED', 'DEAD_LETTER');

-- CreateEnum
CREATE TYPE "OfflineCommandStatus" AS ENUM ('APPLIED', 'DUPLICATE', 'CONFLICT', 'REJECTED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'STAFF',
    "phone" TEXT,
    "avatar" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "authVersion" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "alternatePhone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "notes" TEXT,
    "loyaltyPoints" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pet" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "species" "Species" NOT NULL DEFAULT 'DOG',
    "breedId" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "gender" "Gender" NOT NULL,
    "weight" DOUBLE PRECISION,
    "color" TEXT,
    "microchipNumber" TEXT,
    "isNeutered" BOOLEAN NOT NULL DEFAULT false,
    "temperament" TEXT,
    "specialNeeds" TEXT,
    "allergies" TEXT,
    "feedingInstructions" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientId" TEXT NOT NULL,

    CONSTRAINT "Pet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Breed" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "species" "Species" NOT NULL DEFAULT 'DOG',
    "size" "BreedSize" NOT NULL,
    "coatType" TEXT,
    "groomingFrequency" INTEGER,
    "typicalDuration" INTEGER,
    "description" TEXT,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Breed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VaccinationRecord" (
    "id" TEXT NOT NULL,
    "petId" TEXT NOT NULL,
    "vaccineName" TEXT NOT NULL,
    "dateAdministered" TIMESTAMP(3) NOT NULL,
    "expirationDate" TIMESTAMP(3),
    "veterinarian" TEXT,
    "notes" TEXT,
    "documentUrl" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VaccinationRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BehavioralNote" (
    "id" TEXT NOT NULL,
    "petId" TEXT NOT NULL,
    "category" "BehaviorCategory" NOT NULL,
    "severity" "Severity" NOT NULL DEFAULT 'LOW',
    "description" TEXT NOT NULL,
    "triggers" TEXT,
    "solutions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BehavioralNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PetPhoto" (
    "id" TEXT NOT NULL,
    "petId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "isBefore" BOOLEAN NOT NULL DEFAULT false,
    "isAfter" BOOLEAN NOT NULL DEFAULT false,
    "sessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PetPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroomingPreference" (
    "id" TEXT NOT NULL,
    "petId" TEXT NOT NULL,
    "preferredStyle" TEXT,
    "coatLength" TEXT,
    "specificCuts" TEXT,
    "sensitiveAreas" TEXT,
    "avoidAreas" TEXT,
    "shampooPreference" TEXT,
    "conditionerPreference" TEXT,
    "dryingPreference" TEXT,
    "additionalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroomingPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroomingSession" (
    "id" TEXT NOT NULL,
    "petId" TEXT NOT NULL,
    "groomerId" TEXT NOT NULL,
    "appointmentId" TEXT,
    "checkInTime" TIMESTAMP(3),
    "checkOutTime" TIMESTAMP(3),
    "status" "SessionStatus" NOT NULL DEFAULT 'PENDING',
    "conditionNotes" TEXT,
    "servicesNotes" TEXT,
    "behaviorNotes" TEXT,
    "issuesFound" TEXT,
    "recommendations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroomingSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "petId" TEXT NOT NULL,
    "groomerId" TEXT,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "scheduledTime" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'SCHEDULED',
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurrenceRule" TEXT,
    "parentId" TEXT,
    "notes" TEXT,
    "specialRequests" TEXT,
    "reminderSent" BOOLEAN NOT NULL DEFAULT false,
    "reminderSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppointmentService" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "duration" INTEGER NOT NULL,
    "notes" TEXT,

    CONSTRAINT "AppointmentService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "ServiceCategory" NOT NULL,
    "basePrice" DOUBLE PRECISION NOT NULL,
    "baseDuration" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isAddOn" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BreedService" (
    "id" TEXT NOT NULL,
    "breedId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "priceModifier" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "durationModifier" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "BreedService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServicePackage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServicePackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackageService" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,

    CONSTRAINT "PackageService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpecialHandlingFee" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "isPercentage" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SpecialHandlingFee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "tax" DOUBLE PRECISION NOT NULL,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tip" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "giftCardId" TEXT,
    "giftCardAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "loyaltyPointsEarned" INTEGER NOT NULL DEFAULT 0,
    "loyaltyPointsUsed" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransactionItem" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "itemType" "ItemType" NOT NULL,
    "serviceId" TEXT,
    "packageId" TEXT,
    "productId" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "TransactionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sku" TEXT NOT NULL,
    "category" "ProductCategory" NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "cost" DOUBLE PRECISION,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "reservedQuantity" INTEGER NOT NULL DEFAULT 0,
    "reorderLevel" INTEGER NOT NULL DEFAULT 5,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GiftCard" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "initialBalance" DOUBLE PRECISION NOT NULL,
    "currentBalance" DOUBLE PRECISION NOT NULL,
    "clientId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GiftCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthAlert" (
    "id" TEXT NOT NULL,
    "petId" TEXT NOT NULL,
    "alertType" "AlertType" NOT NULL,
    "severity" "Severity" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "resolvedNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Incident" (
    "id" TEXT NOT NULL,
    "reportedBy" TEXT NOT NULL,
    "incidentType" "IncidentType" NOT NULL,
    "severity" "Severity" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT,
    "actionsTaken" TEXT,
    "followUpRequired" BOOLEAN NOT NULL DEFAULT false,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "resolvedNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmergencyContact" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "alternatePhone" TEXT,
    "email" TEXT,
    "isVeterinarian" BOOLEAN NOT NULL DEFAULT false,
    "vetClinicName" TEXT,
    "vetAddress" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmergencyContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIBreedPrediction" (
    "id" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "predictedBreed" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "alternativeBreeds" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIBreedPrediction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIStyleSuggestion" (
    "id" TEXT NOT NULL,
    "petId" TEXT NOT NULL,
    "breedId" TEXT NOT NULL,
    "suggestedStyles" TEXT NOT NULL,
    "reasoning" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIStyleSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AISocialPost" (
    "id" TEXT NOT NULL,
    "petPhotoId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "hashtags" TEXT,
    "isPosted" BOOLEAN NOT NULL DEFAULT false,
    "postedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AISocialPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessSettings" (
    "id" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "taxRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "operatingHours" TEXT,
    "bookingLeadTime" INTEGER NOT NULL DEFAULT 24,
    "maxAdvanceBooking" INTEGER NOT NULL DEFAULT 30,
    "slotDuration" INTEGER NOT NULL DEFAULT 15,
    "loyaltyPointsPerDollar" INTEGER NOT NULL DEFAULT 1,
    "loyaltyPointsValue" DOUBLE PRECISION NOT NULL DEFAULT 0.01,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReminderHistory" (
    "id" TEXT NOT NULL,
    "petId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "sentVia" TEXT NOT NULL DEFAULT 'EMAIL',
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReminderHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicalRecord" (
    "id" TEXT NOT NULL,
    "petId" TEXT NOT NULL,
    "vetName" TEXT NOT NULL,
    "recordDate" TIMESTAMP(3) NOT NULL,
    "diagnosis" TEXT NOT NULL,
    "symptoms" TEXT NOT NULL,
    "treatment" TEXT NOT NULL,
    "followUp" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicalRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prescription" (
    "id" TEXT NOT NULL,
    "petId" TEXT NOT NULL,
    "vetName" TEXT NOT NULL,
    "medication" TEXT NOT NULL,
    "dosage" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "prescribedDate" TIMESTAMP(3) NOT NULL,
    "status" "PrescriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "instructions" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Prescription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabResult" (
    "id" TEXT NOT NULL,
    "petId" TEXT NOT NULL,
    "testName" TEXT NOT NULL,
    "testType" TEXT NOT NULL,
    "testDate" TIMESTAMP(3) NOT NULL,
    "results" TEXT NOT NULL,
    "normalRange" TEXT,
    "status" "LabStatus" NOT NULL DEFAULT 'PENDING',
    "orderedBy" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LabResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Surgery" (
    "id" TEXT NOT NULL,
    "petId" TEXT NOT NULL,
    "surgeonName" TEXT NOT NULL,
    "surgeryDate" TIMESTAMP(3) NOT NULL,
    "surgeryType" TEXT NOT NULL,
    "anesthesiaType" TEXT,
    "duration" TEXT,
    "status" "SurgeryStatus" NOT NULL DEFAULT 'SCHEDULED',
    "preOpNotes" TEXT,
    "postOpNotes" TEXT,
    "complications" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Surgery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIUsageLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "feature" TEXT NOT NULL,
    "model" TEXT,
    "input" JSONB,
    "output" JSONB,
    "error" TEXT,
    "durationMs" INTEGER,
    "tokensIn" INTEGER,
    "tokensOut" INTEGER,
    "costUsd" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIUsageLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantAISettings" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "openrouterApiKey" TEXT,
    "openrouterModel" TEXT,
    "visionModel" TEXT,
    "monthlyBudgetUsd" DOUBLE PRECISION,
    "alertThresholdPct" INTEGER NOT NULL DEFAULT 80,
    "hardCapEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantAISettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreVisitIntake" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT,
    "petId" TEXT,
    "clientPhone" TEXT NOT NULL,
    "rawSymptoms" TEXT,
    "rawPhotos" JSONB NOT NULL DEFAULT '[]',
    "aiTriageResult" JSONB,
    "urgencyLevel" TEXT,
    "flaggedForVet" BOOLEAN NOT NULL DEFAULT false,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PreVisitIntake_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NoShowPrediction" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "riskScore" DOUBLE PRECISION NOT NULL,
    "riskTier" TEXT NOT NULL,
    "features" JSONB NOT NULL,
    "depositRequired" BOOLEAN NOT NULL DEFAULT false,
    "depositAmount" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NoShowPrediction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StylePreview" (
    "id" TEXT NOT NULL,
    "petId" TEXT NOT NULL,
    "styleName" TEXT NOT NULL,
    "beforeImageUrl" TEXT NOT NULL,
    "afterImageUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "errorMsg" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StylePreview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FamilyGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "primaryClientId" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FamilyGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FamilyMember" (
    "id" TEXT NOT NULL,
    "familyGroupId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "petId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FamilyMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BundleSuggestion" (
    "id" TEXT NOT NULL,
    "familyGroupId" TEXT NOT NULL,
    "recommendedServices" JSONB NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "discountPct" DOUBLE PRECISION NOT NULL,
    "reasoning" TEXT,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BundleSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VaccineReminderJob" (
    "id" TEXT NOT NULL,
    "petId" TEXT NOT NULL,
    "vaccinationId" TEXT,
    "prescriptionId" TEXT,
    "reminderType" TEXT NOT NULL,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "confirmationReply" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VaccineReminderJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_technician_profiles" (
    "userId" TEXT NOT NULL,
    "baseLatitude" DOUBLE PRECISION NOT NULL,
    "baseLongitude" DOUBLE PRECISION NOT NULL,
    "maxTravelKm" DOUBLE PRECISION NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "workflow_technician_profiles_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "workflow_technician_skills" (
    "id" TEXT NOT NULL,
    "technicianId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "proficiency" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "workflow_technician_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_technician_availability" (
    "id" TEXT NOT NULL,
    "technicianId" TEXT NOT NULL,
    "startsAt" TIMESTAMPTZ(3) NOT NULL,
    "endsAt" TIMESTAMPTZ(3) NOT NULL,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "source" TEXT NOT NULL,
    "externalEventId" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_technician_availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_technician_service_areas" (
    "id" TEXT NOT NULL,
    "technicianId" TEXT NOT NULL,
    "postalPrefix" TEXT NOT NULL,

    CONSTRAINT "workflow_technician_service_areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_service_inventory_requirements" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "workflow_service_inventory_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_quotes" (
    "id" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "petId" TEXT NOT NULL,
    "proposedTechnicianId" TEXT NOT NULL,
    "status" "WorkflowQuoteStatus" NOT NULL DEFAULT 'DRAFT',
    "requestedStart" TIMESTAMPTZ(3) NOT NULL,
    "requestedEnd" TIMESTAMPTZ(3) NOT NULL,
    "addressLine" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "subtotalCents" INTEGER NOT NULL,
    "taxCents" INTEGER NOT NULL DEFAULT 0,
    "totalCents" INTEGER NOT NULL DEFAULT 0,
    "travelKm" DOUBLE PRECISION,
    "providerFailure" TEXT,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "workflow_quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_quote_lines" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "serviceName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPriceCents" INTEGER NOT NULL,
    "durationMinutes" INTEGER NOT NULL,

    CONSTRAINT "workflow_quote_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_orders" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "petId" TEXT NOT NULL,
    "technicianId" TEXT NOT NULL,
    "bookingStatus" "WorkflowBookingStatus" NOT NULL DEFAULT 'BOOKED',
    "jobStatus" "WorkflowJobStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "scheduledStart" TIMESTAMPTZ(3) NOT NULL,
    "scheduledEnd" TIMESTAMPTZ(3) NOT NULL,
    "addressLine" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "quotedTotalCents" INTEGER NOT NULL,
    "deliveredCents" INTEGER NOT NULL DEFAULT 0,
    "cancellationReason" TEXT,
    "cancelledAt" TIMESTAMPTZ(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "workflow_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_dispatch_assignments" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "technicianId" TEXT NOT NULL,
    "assignedById" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "reason" TEXT NOT NULL,
    "assignedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "releasedAt" TIMESTAMPTZ(3),

    CONSTRAINT "workflow_dispatch_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_change_orders" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "approvedById" TEXT,
    "status" "WorkflowChangeStatus" NOT NULL DEFAULT 'REQUESTED',
    "reason" TEXT NOT NULL,
    "deltaCents" INTEGER NOT NULL,
    "requestedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMPTZ(3),

    CONSTRAINT "workflow_change_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_change_order_lines" (
    "id" TEXT NOT NULL,
    "changeOrderId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "serviceName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPriceCents" INTEGER NOT NULL,
    "durationMinutes" INTEGER NOT NULL,

    CONSTRAINT "workflow_change_order_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_inventory_reservations" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "consumed" INTEGER NOT NULL DEFAULT 0,
    "released" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_inventory_reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_inventory_movements" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "orderId" TEXT,
    "movementType" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_inventory_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_invoices" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "status" "WorkflowInvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "subtotalCents" INTEGER NOT NULL,
    "taxCents" INTEGER NOT NULL,
    "totalCents" INTEGER NOT NULL,
    "paidCents" INTEGER NOT NULL DEFAULT 0,
    "refundedCents" INTEGER NOT NULL DEFAULT 0,
    "issuedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "workflow_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_payments" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "providerExternalId" TEXT,
    "status" "WorkflowPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "amountCents" INTEGER NOT NULL,
    "failureCode" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "workflow_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_refunds" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "providerExternalId" TEXT,
    "status" "WorkflowPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "amountCents" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "workflow_refunds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_provider_connectors" (
    "id" TEXT NOT NULL,
    "kind" "ProviderKind" NOT NULL,
    "provider" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "allowedHost" TEXT NOT NULL,
    "credentialEnv" TEXT NOT NULL,
    "webhookSecretEnv" TEXT,
    "serviceUserId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "workflow_provider_connectors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_integration_operations" (
    "id" TEXT NOT NULL,
    "connectorId" TEXT NOT NULL,
    "operationType" TEXT NOT NULL,
    "aggregateType" TEXT NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "status" "IntegrationOperationStatus" NOT NULL DEFAULT 'PENDING',
    "payload" JSONB NOT NULL,
    "output" JSONB,
    "receipt" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "nextAttemptAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leasedUntil" TIMESTAMPTZ(3),
    "leasedBy" TEXT,
    "lastError" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "workflow_integration_operations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_webhook_receipts" (
    "id" TEXT NOT NULL,
    "connectorId" TEXT NOT NULL,
    "externalEventId" TEXT NOT NULL,
    "payloadHash" TEXT NOT NULL,
    "receivedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_webhook_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_customer_communications" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "providerReceipt" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_customer_communications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_offline_commands" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "clientCommandId" TEXT NOT NULL,
    "expectedVersion" INTEGER NOT NULL,
    "command" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "OfflineCommandStatus" NOT NULL,
    "result" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_offline_commands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_audit_events" (
    "id" TEXT NOT NULL,
    "orderId" TEXT,
    "quoteId" TEXT,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "previousHash" TEXT,
    "eventHash" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Client_email_key" ON "Client"("email");

-- CreateIndex
CREATE INDEX "Client_email_idx" ON "Client"("email");

-- CreateIndex
CREATE INDEX "Client_phone_idx" ON "Client"("phone");

-- CreateIndex
CREATE INDEX "Pet_clientId_idx" ON "Pet"("clientId");

-- CreateIndex
CREATE INDEX "Pet_breedId_idx" ON "Pet"("breedId");

-- CreateIndex
CREATE INDEX "Breed_species_idx" ON "Breed"("species");

-- CreateIndex
CREATE UNIQUE INDEX "Breed_name_species_key" ON "Breed"("name", "species");

-- CreateIndex
CREATE INDEX "VaccinationRecord_petId_idx" ON "VaccinationRecord"("petId");

-- CreateIndex
CREATE INDEX "VaccinationRecord_expirationDate_idx" ON "VaccinationRecord"("expirationDate");

-- CreateIndex
CREATE INDEX "BehavioralNote_petId_idx" ON "BehavioralNote"("petId");

-- CreateIndex
CREATE INDEX "PetPhoto_petId_idx" ON "PetPhoto"("petId");

-- CreateIndex
CREATE INDEX "PetPhoto_sessionId_idx" ON "PetPhoto"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "GroomingPreference_petId_key" ON "GroomingPreference"("petId");

-- CreateIndex
CREATE UNIQUE INDEX "GroomingSession_appointmentId_key" ON "GroomingSession"("appointmentId");

-- CreateIndex
CREATE INDEX "GroomingSession_petId_idx" ON "GroomingSession"("petId");

-- CreateIndex
CREATE INDEX "GroomingSession_groomerId_idx" ON "GroomingSession"("groomerId");

-- CreateIndex
CREATE INDEX "Appointment_clientId_idx" ON "Appointment"("clientId");

-- CreateIndex
CREATE INDEX "Appointment_petId_idx" ON "Appointment"("petId");

-- CreateIndex
CREATE INDEX "Appointment_groomerId_idx" ON "Appointment"("groomerId");

-- CreateIndex
CREATE INDEX "Appointment_scheduledDate_idx" ON "Appointment"("scheduledDate");

-- CreateIndex
CREATE INDEX "Appointment_status_idx" ON "Appointment"("status");

-- CreateIndex
CREATE INDEX "AppointmentService_appointmentId_idx" ON "AppointmentService"("appointmentId");

-- CreateIndex
CREATE INDEX "AppointmentService_serviceId_idx" ON "AppointmentService"("serviceId");

-- CreateIndex
CREATE INDEX "Service_category_idx" ON "Service"("category");

-- CreateIndex
CREATE INDEX "Service_isActive_idx" ON "Service"("isActive");

-- CreateIndex
CREATE INDEX "BreedService_breedId_idx" ON "BreedService"("breedId");

-- CreateIndex
CREATE INDEX "BreedService_serviceId_idx" ON "BreedService"("serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "BreedService_breedId_serviceId_key" ON "BreedService"("breedId", "serviceId");

-- CreateIndex
CREATE INDEX "PackageService_packageId_idx" ON "PackageService"("packageId");

-- CreateIndex
CREATE INDEX "PackageService_serviceId_idx" ON "PackageService"("serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "PackageService_packageId_serviceId_key" ON "PackageService"("packageId", "serviceId");

-- CreateIndex
CREATE INDEX "Transaction_clientId_idx" ON "Transaction"("clientId");

-- CreateIndex
CREATE INDEX "Transaction_staffId_idx" ON "Transaction"("staffId");

-- CreateIndex
CREATE INDEX "Transaction_createdAt_idx" ON "Transaction"("createdAt");

-- CreateIndex
CREATE INDEX "TransactionItem_transactionId_idx" ON "TransactionItem"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");

-- CreateIndex
CREATE INDEX "Product_category_idx" ON "Product"("category");

-- CreateIndex
CREATE INDEX "Product_sku_idx" ON "Product"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "GiftCard_code_key" ON "GiftCard"("code");

-- CreateIndex
CREATE INDEX "GiftCard_code_idx" ON "GiftCard"("code");

-- CreateIndex
CREATE INDEX "GiftCard_clientId_idx" ON "GiftCard"("clientId");

-- CreateIndex
CREATE INDEX "HealthAlert_petId_idx" ON "HealthAlert"("petId");

-- CreateIndex
CREATE INDEX "HealthAlert_isResolved_idx" ON "HealthAlert"("isResolved");

-- CreateIndex
CREATE INDEX "Incident_reportedBy_idx" ON "Incident"("reportedBy");

-- CreateIndex
CREATE INDEX "Incident_isResolved_idx" ON "Incident"("isResolved");

-- CreateIndex
CREATE INDEX "AIStyleSuggestion_petId_idx" ON "AIStyleSuggestion"("petId");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "PasswordResetToken_email_idx" ON "PasswordResetToken"("email");

-- CreateIndex
CREATE INDEX "PasswordResetToken_token_idx" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "ReminderHistory_petId_idx" ON "ReminderHistory"("petId");

-- CreateIndex
CREATE INDEX "ReminderHistory_clientId_idx" ON "ReminderHistory"("clientId");

-- CreateIndex
CREATE INDEX "ReminderHistory_sentAt_idx" ON "ReminderHistory"("sentAt");

-- CreateIndex
CREATE INDEX "MedicalRecord_petId_idx" ON "MedicalRecord"("petId");

-- CreateIndex
CREATE INDEX "Prescription_petId_idx" ON "Prescription"("petId");

-- CreateIndex
CREATE INDEX "Prescription_status_idx" ON "Prescription"("status");

-- CreateIndex
CREATE INDEX "LabResult_petId_idx" ON "LabResult"("petId");

-- CreateIndex
CREATE INDEX "LabResult_status_idx" ON "LabResult"("status");

-- CreateIndex
CREATE INDEX "Surgery_petId_idx" ON "Surgery"("petId");

-- CreateIndex
CREATE INDEX "Surgery_status_idx" ON "Surgery"("status");

-- CreateIndex
CREATE INDEX "AIUsageLog_userId_idx" ON "AIUsageLog"("userId");

-- CreateIndex
CREATE INDEX "AIUsageLog_feature_idx" ON "AIUsageLog"("feature");

-- CreateIndex
CREATE INDEX "AIUsageLog_createdAt_idx" ON "AIUsageLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "TenantAISettings_tenantId_key" ON "TenantAISettings"("tenantId");

-- CreateIndex
CREATE INDEX "PreVisitIntake_clientPhone_idx" ON "PreVisitIntake"("clientPhone");

-- CreateIndex
CREATE INDEX "PreVisitIntake_appointmentId_idx" ON "PreVisitIntake"("appointmentId");

-- CreateIndex
CREATE INDEX "PreVisitIntake_urgencyLevel_idx" ON "PreVisitIntake"("urgencyLevel");

-- CreateIndex
CREATE UNIQUE INDEX "NoShowPrediction_appointmentId_key" ON "NoShowPrediction"("appointmentId");

-- CreateIndex
CREATE INDEX "NoShowPrediction_riskTier_idx" ON "NoShowPrediction"("riskTier");

-- CreateIndex
CREATE INDEX "StylePreview_petId_idx" ON "StylePreview"("petId");

-- CreateIndex
CREATE INDEX "StylePreview_status_idx" ON "StylePreview"("status");

-- CreateIndex
CREATE INDEX "FamilyMember_familyGroupId_idx" ON "FamilyMember"("familyGroupId");

-- CreateIndex
CREATE INDEX "FamilyMember_clientId_idx" ON "FamilyMember"("clientId");

-- CreateIndex
CREATE INDEX "BundleSuggestion_familyGroupId_idx" ON "BundleSuggestion"("familyGroupId");

-- CreateIndex
CREATE INDEX "VaccineReminderJob_petId_idx" ON "VaccineReminderJob"("petId");

-- CreateIndex
CREATE INDEX "VaccineReminderJob_scheduledFor_idx" ON "VaccineReminderJob"("scheduledFor");

-- CreateIndex
CREATE INDEX "VaccineReminderJob_status_idx" ON "VaccineReminderJob"("status");

-- CreateIndex
CREATE INDEX "workflow_technician_profiles_active_idx" ON "workflow_technician_profiles"("active");

-- CreateIndex
CREATE INDEX "workflow_technician_skills_serviceId_idx" ON "workflow_technician_skills"("serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_technician_skills_technicianId_serviceId_key" ON "workflow_technician_skills"("technicianId", "serviceId");

-- CreateIndex
CREATE INDEX "workflow_technician_availability_technicianId_startsAt_ends_idx" ON "workflow_technician_availability"("technicianId", "startsAt", "endsAt");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_technician_service_areas_technicianId_postalPrefix_key" ON "workflow_technician_service_areas"("technicianId", "postalPrefix");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_service_inventory_requirements_serviceId_productId_key" ON "workflow_service_inventory_requirements"("serviceId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_quotes_idempotencyKey_key" ON "workflow_quotes"("idempotencyKey");

-- CreateIndex
CREATE INDEX "workflow_quotes_clientId_createdAt_idx" ON "workflow_quotes"("clientId", "createdAt");

-- CreateIndex
CREATE INDEX "workflow_quotes_status_expiresAt_idx" ON "workflow_quotes"("status", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_quote_lines_quoteId_serviceId_key" ON "workflow_quote_lines"("quoteId", "serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_orders_quoteId_key" ON "workflow_orders"("quoteId");

-- CreateIndex
CREATE INDEX "workflow_orders_technicianId_scheduledStart_scheduledEnd_idx" ON "workflow_orders"("technicianId", "scheduledStart", "scheduledEnd");

-- CreateIndex
CREATE INDEX "workflow_orders_bookingStatus_scheduledStart_idx" ON "workflow_orders"("bookingStatus", "scheduledStart");

-- CreateIndex
CREATE INDEX "workflow_dispatch_assignments_orderId_active_idx" ON "workflow_dispatch_assignments"("orderId", "active");

-- CreateIndex
CREATE INDEX "workflow_change_orders_orderId_status_idx" ON "workflow_change_orders"("orderId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_inventory_reservations_orderId_productId_key" ON "workflow_inventory_reservations"("orderId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_inventory_movements_idempotencyKey_key" ON "workflow_inventory_movements"("idempotencyKey");

-- CreateIndex
CREATE INDEX "workflow_inventory_movements_productId_createdAt_idx" ON "workflow_inventory_movements"("productId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_invoices_orderId_key" ON "workflow_invoices"("orderId");

-- CreateIndex
CREATE INDEX "workflow_invoices_clientId_status_idx" ON "workflow_invoices"("clientId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_payments_idempotencyKey_key" ON "workflow_payments"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_payments_providerExternalId_key" ON "workflow_payments"("providerExternalId");

-- CreateIndex
CREATE INDEX "workflow_payments_invoiceId_status_idx" ON "workflow_payments"("invoiceId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_refunds_idempotencyKey_key" ON "workflow_refunds"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_refunds_providerExternalId_key" ON "workflow_refunds"("providerExternalId");

-- CreateIndex
CREATE INDEX "workflow_refunds_paymentId_status_idx" ON "workflow_refunds"("paymentId", "status");

-- CreateIndex
CREATE INDEX "workflow_provider_connectors_kind_enabled_idx" ON "workflow_provider_connectors"("kind", "enabled");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_provider_connectors_kind_provider_key" ON "workflow_provider_connectors"("kind", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_integration_operations_idempotencyKey_key" ON "workflow_integration_operations"("idempotencyKey");

-- CreateIndex
CREATE INDEX "workflow_integration_operations_status_nextAttemptAt_idx" ON "workflow_integration_operations"("status", "nextAttemptAt");

-- CreateIndex
CREATE INDEX "workflow_integration_operations_aggregateType_aggregateId_idx" ON "workflow_integration_operations"("aggregateType", "aggregateId");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_webhook_receipts_connectorId_externalEventId_key" ON "workflow_webhook_receipts"("connectorId", "externalEventId");

-- CreateIndex
CREATE INDEX "workflow_customer_communications_orderId_createdAt_idx" ON "workflow_customer_communications"("orderId", "createdAt");

-- CreateIndex
CREATE INDEX "workflow_offline_commands_orderId_createdAt_idx" ON "workflow_offline_commands"("orderId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_offline_commands_deviceId_clientCommandId_key" ON "workflow_offline_commands"("deviceId", "clientCommandId");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_audit_events_eventHash_key" ON "workflow_audit_events"("eventHash");

-- CreateIndex
CREATE INDEX "workflow_audit_events_orderId_createdAt_id_idx" ON "workflow_audit_events"("orderId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "workflow_audit_events_quoteId_createdAt_id_idx" ON "workflow_audit_events"("quoteId", "createdAt", "id");

-- AddForeignKey
ALTER TABLE "Pet" ADD CONSTRAINT "Pet_breedId_fkey" FOREIGN KEY ("breedId") REFERENCES "Breed"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pet" ADD CONSTRAINT "Pet_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VaccinationRecord" ADD CONSTRAINT "VaccinationRecord_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BehavioralNote" ADD CONSTRAINT "BehavioralNote_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PetPhoto" ADD CONSTRAINT "PetPhoto_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PetPhoto" ADD CONSTRAINT "PetPhoto_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GroomingSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroomingPreference" ADD CONSTRAINT "GroomingPreference_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroomingSession" ADD CONSTRAINT "GroomingSession_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroomingSession" ADD CONSTRAINT "GroomingSession_groomerId_fkey" FOREIGN KEY ("groomerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroomingSession" ADD CONSTRAINT "GroomingSession_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_groomerId_fkey" FOREIGN KEY ("groomerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentService" ADD CONSTRAINT "AppointmentService_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentService" ADD CONSTRAINT "AppointmentService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BreedService" ADD CONSTRAINT "BreedService_breedId_fkey" FOREIGN KEY ("breedId") REFERENCES "Breed"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BreedService" ADD CONSTRAINT "BreedService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackageService" ADD CONSTRAINT "PackageService_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "ServicePackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackageService" ADD CONSTRAINT "PackageService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_giftCardId_fkey" FOREIGN KEY ("giftCardId") REFERENCES "GiftCard"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionItem" ADD CONSTRAINT "TransactionItem_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionItem" ADD CONSTRAINT "TransactionItem_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionItem" ADD CONSTRAINT "TransactionItem_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "ServicePackage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionItem" ADD CONSTRAINT "TransactionItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GiftCard" ADD CONSTRAINT "GiftCard_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthAlert" ADD CONSTRAINT "HealthAlert_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_reportedBy_fkey" FOREIGN KEY ("reportedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReminderHistory" ADD CONSTRAINT "ReminderHistory_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReminderHistory" ADD CONSTRAINT "ReminderHistory_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalRecord" ADD CONSTRAINT "MedicalRecord_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabResult" ADD CONSTRAINT "LabResult_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Surgery" ADD CONSTRAINT "Surgery_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyMember" ADD CONSTRAINT "FamilyMember_familyGroupId_fkey" FOREIGN KEY ("familyGroupId") REFERENCES "FamilyGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BundleSuggestion" ADD CONSTRAINT "BundleSuggestion_familyGroupId_fkey" FOREIGN KEY ("familyGroupId") REFERENCES "FamilyGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_technician_profiles" ADD CONSTRAINT "workflow_technician_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_technician_skills" ADD CONSTRAINT "workflow_technician_skills_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "workflow_technician_profiles"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_technician_skills" ADD CONSTRAINT "workflow_technician_skills_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_technician_availability" ADD CONSTRAINT "workflow_technician_availability_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "workflow_technician_profiles"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_technician_service_areas" ADD CONSTRAINT "workflow_technician_service_areas_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "workflow_technician_profiles"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_service_inventory_requirements" ADD CONSTRAINT "workflow_service_inventory_requirements_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_service_inventory_requirements" ADD CONSTRAINT "workflow_service_inventory_requirements_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_quotes" ADD CONSTRAINT "workflow_quotes_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_quotes" ADD CONSTRAINT "workflow_quotes_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_quotes" ADD CONSTRAINT "workflow_quotes_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_quotes" ADD CONSTRAINT "workflow_quotes_proposedTechnicianId_fkey" FOREIGN KEY ("proposedTechnicianId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_quote_lines" ADD CONSTRAINT "workflow_quote_lines_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "workflow_quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_quote_lines" ADD CONSTRAINT "workflow_quote_lines_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_orders" ADD CONSTRAINT "workflow_orders_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "workflow_quotes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_orders" ADD CONSTRAINT "workflow_orders_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_orders" ADD CONSTRAINT "workflow_orders_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_orders" ADD CONSTRAINT "workflow_orders_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_dispatch_assignments" ADD CONSTRAINT "workflow_dispatch_assignments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "workflow_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_dispatch_assignments" ADD CONSTRAINT "workflow_dispatch_assignments_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_dispatch_assignments" ADD CONSTRAINT "workflow_dispatch_assignments_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_change_orders" ADD CONSTRAINT "workflow_change_orders_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "workflow_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_change_orders" ADD CONSTRAINT "workflow_change_orders_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_change_orders" ADD CONSTRAINT "workflow_change_orders_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_change_order_lines" ADD CONSTRAINT "workflow_change_order_lines_changeOrderId_fkey" FOREIGN KEY ("changeOrderId") REFERENCES "workflow_change_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_change_order_lines" ADD CONSTRAINT "workflow_change_order_lines_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_inventory_reservations" ADD CONSTRAINT "workflow_inventory_reservations_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "workflow_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_inventory_reservations" ADD CONSTRAINT "workflow_inventory_reservations_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_inventory_movements" ADD CONSTRAINT "workflow_inventory_movements_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_invoices" ADD CONSTRAINT "workflow_invoices_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "workflow_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_invoices" ADD CONSTRAINT "workflow_invoices_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_payments" ADD CONSTRAINT "workflow_payments_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "workflow_invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_refunds" ADD CONSTRAINT "workflow_refunds_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "workflow_payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_provider_connectors" ADD CONSTRAINT "workflow_provider_connectors_serviceUserId_fkey" FOREIGN KEY ("serviceUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_integration_operations" ADD CONSTRAINT "workflow_integration_operations_connectorId_fkey" FOREIGN KEY ("connectorId") REFERENCES "workflow_provider_connectors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_webhook_receipts" ADD CONSTRAINT "workflow_webhook_receipts_connectorId_fkey" FOREIGN KEY ("connectorId") REFERENCES "workflow_provider_connectors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_customer_communications" ADD CONSTRAINT "workflow_customer_communications_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "workflow_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_customer_communications" ADD CONSTRAINT "workflow_customer_communications_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_offline_commands" ADD CONSTRAINT "workflow_offline_commands_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "workflow_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_offline_commands" ADD CONSTRAINT "workflow_offline_commands_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_audit_events" ADD CONSTRAINT "workflow_audit_events_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "workflow_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_audit_events" ADD CONSTRAINT "workflow_audit_events_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "workflow_quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_audit_events" ADD CONSTRAINT "workflow_audit_events_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Workflow invariants that must hold even if data is written outside the application.
ALTER TABLE "User" ADD CONSTRAINT "User_authVersion_positive" CHECK ("authVersion" >= 1);
ALTER TABLE "Product" ADD CONSTRAINT "Product_inventory_nonnegative" CHECK ("quantity" >= 0 AND "reservedQuantity" >= 0 AND "reservedQuantity" <= "quantity");
ALTER TABLE "workflow_technician_profiles" ADD CONSTRAINT "workflow_technician_location_valid" CHECK ("baseLatitude" BETWEEN -90 AND 90 AND "baseLongitude" BETWEEN -180 AND 180 AND "maxTravelKm" >= 0 AND "version" >= 1);
ALTER TABLE "workflow_technician_skills" ADD CONSTRAINT "workflow_technician_proficiency_positive" CHECK ("proficiency" > 0);
ALTER TABLE "workflow_technician_availability" ADD CONSTRAINT "workflow_availability_time_valid" CHECK ("endsAt" > "startsAt");
ALTER TABLE "workflow_service_inventory_requirements" ADD CONSTRAINT "workflow_service_inventory_quantity_positive" CHECK ("quantity" > 0);
ALTER TABLE "workflow_quotes" ADD CONSTRAINT "workflow_quote_values_valid" CHECK (
  "requestedEnd" > "requestedStart" AND "expiresAt" > "createdAt" AND
  "subtotalCents" >= 0 AND "taxCents" >= 0 AND "totalCents" >= 0 AND "version" >= 1 AND
  "latitude" BETWEEN -90 AND 90 AND "longitude" BETWEEN -180 AND 180
);
ALTER TABLE "workflow_quote_lines" ADD CONSTRAINT "workflow_quote_line_values_valid" CHECK ("quantity" > 0 AND "unitPriceCents" >= 0 AND "durationMinutes" > 0);
ALTER TABLE "workflow_orders" ADD CONSTRAINT "workflow_order_values_valid" CHECK (
  "scheduledEnd" > "scheduledStart" AND "quotedTotalCents" >= 0 AND "deliveredCents" >= 0 AND "version" >= 1 AND
  "latitude" BETWEEN -90 AND 90 AND "longitude" BETWEEN -180 AND 180 AND
  (("bookingStatus" = 'CANCELLED' AND "cancelledAt" IS NOT NULL AND "cancellationReason" IS NOT NULL) OR "bookingStatus" <> 'CANCELLED')
);
ALTER TABLE "workflow_change_orders" ADD CONSTRAINT "workflow_change_approver_separate" CHECK ("approvedById" IS NULL OR "approvedById" <> "requestedById");
ALTER TABLE "workflow_change_order_lines" ADD CONSTRAINT "workflow_change_line_values_valid" CHECK ("quantity" > 0 AND "unitPriceCents" >= 0 AND "durationMinutes" > 0);
ALTER TABLE "workflow_inventory_reservations" ADD CONSTRAINT "workflow_reservation_values_valid" CHECK ("quantity" > 0 AND "consumed" >= 0 AND "released" >= 0 AND "consumed" + "released" <= "quantity");
ALTER TABLE "workflow_inventory_movements" ADD CONSTRAINT "workflow_movement_nonzero" CHECK ("quantity" <> 0);
ALTER TABLE "workflow_invoices" ADD CONSTRAINT "workflow_invoice_values_valid" CHECK ("subtotalCents" >= 0 AND "taxCents" >= 0 AND "totalCents" = "subtotalCents" + "taxCents" AND "paidCents" >= 0 AND "refundedCents" >= 0 AND "refundedCents" <= "paidCents");
ALTER TABLE "workflow_payments" ADD CONSTRAINT "workflow_payment_amount_positive" CHECK ("amountCents" > 0);
ALTER TABLE "workflow_refunds" ADD CONSTRAINT "workflow_refund_amount_positive" CHECK ("amountCents" > 0);
ALTER TABLE "workflow_integration_operations" ADD CONSTRAINT "workflow_operation_attempts_valid" CHECK ("attempts" >= 0 AND "maxAttempts" > 0 AND "attempts" <= "maxAttempts" AND (("leasedBy" IS NULL AND "leasedUntil" IS NULL) OR ("leasedBy" IS NOT NULL AND "leasedUntil" IS NOT NULL)));
ALTER TABLE "workflow_webhook_receipts" ADD CONSTRAINT "workflow_webhook_hash_valid" CHECK ("payloadHash" ~ '^[a-f0-9]{64}$');
ALTER TABLE "workflow_audit_events" ADD CONSTRAINT "workflow_audit_stream_valid" CHECK ((("orderId" IS NOT NULL)::int + ("quoteId" IS NOT NULL)::int) = 1 AND "eventHash" ~ '^[a-f0-9]{64}$' AND ("previousHash" IS NULL OR "previousHash" ~ '^[a-f0-9]{64}$'));

CREATE OR REPLACE FUNCTION workflow_prevent_overbooking() RETURNS trigger AS $$
BEGIN
  IF NEW."bookingStatus" IN ('BOOKED', 'DISPATCHED', 'CONFIRMED') THEN
    PERFORM pg_advisory_xact_lock(hashtext('technician:' || NEW."technicianId"));
    IF EXISTS (
      SELECT 1 FROM workflow_orders existing
      WHERE existing.id <> NEW.id
        AND existing."technicianId" = NEW."technicianId"
        AND existing."bookingStatus" IN ('BOOKED', 'DISPATCHED', 'CONFIRMED')
        AND existing."scheduledStart" < NEW."scheduledEnd"
        AND existing."scheduledEnd" > NEW."scheduledStart"
    ) THEN
      RAISE EXCEPTION 'workflow technician overbooking' USING ERRCODE = '23P01';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER workflow_orders_no_overbooking BEFORE INSERT OR UPDATE OF "technicianId", "scheduledStart", "scheduledEnd", "bookingStatus" ON workflow_orders FOR EACH ROW EXECUTE FUNCTION workflow_prevent_overbooking();

CREATE OR REPLACE FUNCTION workflow_validate_job_transition() RETURNS trigger AS $$
BEGIN
  IF NEW."jobStatus" <> OLD."jobStatus" AND NOT (
    (OLD."jobStatus" = 'NOT_STARTED' AND NEW."jobStatus" IN ('CHECKED_IN', 'NO_SHOW', 'CANCELLED')) OR
    (OLD."jobStatus" = 'CHECKED_IN' AND NEW."jobStatus" IN ('IN_PROGRESS', 'CANCELLED')) OR
    (OLD."jobStatus" = 'IN_PROGRESS' AND NEW."jobStatus" IN ('PARTIAL', 'COMPLETED'))
  ) THEN RAISE EXCEPTION 'invalid workflow job transition' USING ERRCODE = '23514'; END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER workflow_orders_job_transition BEFORE UPDATE OF "jobStatus" ON workflow_orders FOR EACH ROW EXECUTE FUNCTION workflow_validate_job_transition();

CREATE OR REPLACE FUNCTION workflow_reject_immutable_change() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'workflow record is immutable' USING ERRCODE = '55000';
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER workflow_audit_immutable BEFORE UPDATE OR DELETE ON workflow_audit_events FOR EACH ROW EXECUTE FUNCTION workflow_reject_immutable_change();
CREATE TRIGGER workflow_webhook_receipt_immutable BEFORE UPDATE OR DELETE ON workflow_webhook_receipts FOR EACH ROW EXECUTE FUNCTION workflow_reject_immutable_change();
CREATE TRIGGER workflow_inventory_movement_immutable BEFORE UPDATE OR DELETE ON workflow_inventory_movements FOR EACH ROW EXECUTE FUNCTION workflow_reject_immutable_change();

CREATE OR REPLACE FUNCTION workflow_protect_quote_lines() RETURNS trigger AS $$
DECLARE quote_status "WorkflowQuoteStatus";
BEGIN
  SELECT status INTO quote_status FROM workflow_quotes WHERE id = COALESCE(OLD."quoteId", NEW."quoteId");
  IF quote_status <> 'DRAFT' THEN RAISE EXCEPTION 'offered quote lines are immutable' USING ERRCODE = '55000'; END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER workflow_quote_lines_after_offer_immutable BEFORE UPDATE OR DELETE ON workflow_quote_lines FOR EACH ROW EXECUTE FUNCTION workflow_protect_quote_lines();
