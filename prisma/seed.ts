import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting comprehensive seed...')

  // ==========================================
  // USERS (15+)
  // ==========================================
  const defaultPassword = await hash('password123', 12)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@petgroom.com' },
    update: {},
    create: {
      email: 'admin@petgroom.com',
      password: defaultPassword,
      name: 'Admin User',
      role: 'ADMIN',
      phone: '(555) 100-0001',
    },
  })

  const users = await Promise.all([
    // Groomers (10)
    prisma.user.upsert({
      where: { email: 'sarah@petgroom.com' },
      update: {},
      create: { email: 'sarah@petgroom.com', password: defaultPassword, name: 'Sarah Johnson', role: 'GROOMER', phone: '(555) 200-0001' },
    }),
    prisma.user.upsert({
      where: { email: 'mike@petgroom.com' },
      update: {},
      create: { email: 'mike@petgroom.com', password: defaultPassword, name: 'Mike Williams', role: 'GROOMER', phone: '(555) 200-0002' },
    }),
    prisma.user.upsert({
      where: { email: 'emily@petgroom.com' },
      update: {},
      create: { email: 'emily@petgroom.com', password: defaultPassword, name: 'Emily Davis', role: 'GROOMER', phone: '(555) 200-0003' },
    }),
    prisma.user.upsert({
      where: { email: 'james@petgroom.com' },
      update: {},
      create: { email: 'james@petgroom.com', password: defaultPassword, name: 'James Anderson', role: 'GROOMER', phone: '(555) 200-0004' },
    }),
    prisma.user.upsert({
      where: { email: 'lisa@petgroom.com' },
      update: {},
      create: { email: 'lisa@petgroom.com', password: defaultPassword, name: 'Lisa Martinez', role: 'GROOMER', phone: '(555) 200-0005' },
    }),
    prisma.user.upsert({
      where: { email: 'robert@petgroom.com' },
      update: {},
      create: { email: 'robert@petgroom.com', password: defaultPassword, name: 'Robert Taylor', role: 'GROOMER', phone: '(555) 200-0006' },
    }),
    prisma.user.upsert({
      where: { email: 'jennifer@petgroom.com' },
      update: {},
      create: { email: 'jennifer@petgroom.com', password: defaultPassword, name: 'Jennifer Wilson', role: 'GROOMER', phone: '(555) 200-0007' },
    }),
    prisma.user.upsert({
      where: { email: 'david@petgroom.com' },
      update: {},
      create: { email: 'david@petgroom.com', password: defaultPassword, name: 'David Brown', role: 'GROOMER', phone: '(555) 200-0008' },
    }),
    prisma.user.upsert({
      where: { email: 'michelle@petgroom.com' },
      update: {},
      create: { email: 'michelle@petgroom.com', password: defaultPassword, name: 'Michelle Garcia', role: 'GROOMER', phone: '(555) 200-0009' },
    }),
    prisma.user.upsert({
      where: { email: 'kevin@petgroom.com' },
      update: {},
      create: { email: 'kevin@petgroom.com', password: defaultPassword, name: 'Kevin Thompson', role: 'GROOMER', phone: '(555) 200-0010' },
    }),
    // Receptionists (5)
    prisma.user.upsert({
      where: { email: 'amy@petgroom.com' },
      update: {},
      create: { email: 'amy@petgroom.com', password: defaultPassword, name: 'Amy Clark', role: 'RECEPTIONIST', phone: '(555) 300-0001' },
    }),
    prisma.user.upsert({
      where: { email: 'brian@petgroom.com' },
      update: {},
      create: { email: 'brian@petgroom.com', password: defaultPassword, name: 'Brian Lewis', role: 'RECEPTIONIST', phone: '(555) 300-0002' },
    }),
    prisma.user.upsert({
      where: { email: 'carol@petgroom.com' },
      update: {},
      create: { email: 'carol@petgroom.com', password: defaultPassword, name: 'Carol White', role: 'RECEPTIONIST', phone: '(555) 300-0003' },
    }),
    prisma.user.upsert({
      where: { email: 'daniel@petgroom.com' },
      update: {},
      create: { email: 'daniel@petgroom.com', password: defaultPassword, name: 'Daniel Harris', role: 'RECEPTIONIST', phone: '(555) 300-0004' },
    }),
    prisma.user.upsert({
      where: { email: 'emma@petgroom.com' },
      update: {},
      create: { email: 'emma@petgroom.com', password: defaultPassword, name: 'Emma Robinson', role: 'RECEPTIONIST', phone: '(555) 300-0005' },
    }),
  ])
  const groomers = users.slice(0, 10)
  console.log('Created users:', users.length + 1)

  // ==========================================
  // DOG BREEDS (20+)
  // ==========================================
  const dogBreeds = await Promise.all([
    prisma.breed.upsert({
      where: { name_species: { name: 'Golden Retriever', species: 'DOG' } },
      update: {},
      create: { name: 'Golden Retriever', species: 'DOG', size: 'LARGE', coatType: 'Long, Dense', groomingFrequency: 42, typicalDuration: 90 },
    }),
    prisma.breed.upsert({
      where: { name_species: { name: 'Poodle', species: 'DOG' } },
      update: {},
      create: { name: 'Poodle', species: 'DOG', size: 'MEDIUM', coatType: 'Curly', groomingFrequency: 30, typicalDuration: 120 },
    }),
    prisma.breed.upsert({
      where: { name_species: { name: 'Shih Tzu', species: 'DOG' } },
      update: {},
      create: { name: 'Shih Tzu', species: 'DOG', size: 'SMALL', coatType: 'Long, Silky', groomingFrequency: 21, typicalDuration: 75 },
    }),
    prisma.breed.upsert({
      where: { name_species: { name: 'Labrador Retriever', species: 'DOG' } },
      update: {},
      create: { name: 'Labrador Retriever', species: 'DOG', size: 'LARGE', coatType: 'Short, Dense', groomingFrequency: 56, typicalDuration: 60 },
    }),
    prisma.breed.upsert({
      where: { name_species: { name: 'Yorkshire Terrier', species: 'DOG' } },
      update: {},
      create: { name: 'Yorkshire Terrier', species: 'DOG', size: 'EXTRA_SMALL', coatType: 'Long, Silky', groomingFrequency: 21, typicalDuration: 60 },
    }),
    prisma.breed.upsert({
      where: { name_species: { name: 'German Shepherd', species: 'DOG' } },
      update: {},
      create: { name: 'German Shepherd', species: 'DOG', size: 'LARGE', coatType: 'Medium, Double', groomingFrequency: 42, typicalDuration: 75 },
    }),
    prisma.breed.upsert({
      where: { name_species: { name: 'Bulldog', species: 'DOG' } },
      update: {},
      create: { name: 'Bulldog', species: 'DOG', size: 'MEDIUM', coatType: 'Short', groomingFrequency: 56, typicalDuration: 45 },
    }),
    prisma.breed.upsert({
      where: { name_species: { name: 'Beagle', species: 'DOG' } },
      update: {},
      create: { name: 'Beagle', species: 'DOG', size: 'MEDIUM', coatType: 'Short', groomingFrequency: 56, typicalDuration: 45 },
    }),
    prisma.breed.upsert({
      where: { name_species: { name: 'Maltese', species: 'DOG' } },
      update: {},
      create: { name: 'Maltese', species: 'DOG', size: 'EXTRA_SMALL', coatType: 'Long, Silky', groomingFrequency: 21, typicalDuration: 60 },
    }),
    prisma.breed.upsert({
      where: { name_species: { name: 'Bichon Frise', species: 'DOG' } },
      update: {},
      create: { name: 'Bichon Frise', species: 'DOG', size: 'SMALL', coatType: 'Curly', groomingFrequency: 28, typicalDuration: 75 },
    }),
    prisma.breed.upsert({
      where: { name_species: { name: 'Cocker Spaniel', species: 'DOG' } },
      update: {},
      create: { name: 'Cocker Spaniel', species: 'DOG', size: 'MEDIUM', coatType: 'Long, Wavy', groomingFrequency: 35, typicalDuration: 80 },
    }),
    prisma.breed.upsert({
      where: { name_species: { name: 'Pomeranian', species: 'DOG' } },
      update: {},
      create: { name: 'Pomeranian', species: 'DOG', size: 'EXTRA_SMALL', coatType: 'Long, Fluffy', groomingFrequency: 28, typicalDuration: 60 },
    }),
    prisma.breed.upsert({
      where: { name_species: { name: 'Schnauzer', species: 'DOG' } },
      update: {},
      create: { name: 'Schnauzer', species: 'DOG', size: 'MEDIUM', coatType: 'Wiry', groomingFrequency: 42, typicalDuration: 75 },
    }),
    prisma.breed.upsert({
      where: { name_species: { name: 'Siberian Husky', species: 'DOG' } },
      update: {},
      create: { name: 'Siberian Husky', species: 'DOG', size: 'LARGE', coatType: 'Thick, Double', groomingFrequency: 35, typicalDuration: 90 },
    }),
    prisma.breed.upsert({
      where: { name_species: { name: 'Border Collie', species: 'DOG' } },
      update: {},
      create: { name: 'Border Collie', species: 'DOG', size: 'MEDIUM', coatType: 'Medium, Dense', groomingFrequency: 42, typicalDuration: 70 },
    }),
    prisma.breed.upsert({
      where: { name_species: { name: 'Chihuahua', species: 'DOG' } },
      update: {},
      create: { name: 'Chihuahua', species: 'DOG', size: 'EXTRA_SMALL', coatType: 'Short', groomingFrequency: 56, typicalDuration: 30 },
    }),
    prisma.breed.upsert({
      where: { name_species: { name: 'Dachshund', species: 'DOG' } },
      update: {},
      create: { name: 'Dachshund', species: 'DOG', size: 'SMALL', coatType: 'Short/Wire', groomingFrequency: 42, typicalDuration: 45 },
    }),
    prisma.breed.upsert({
      where: { name_species: { name: 'Boxer', species: 'DOG' } },
      update: {},
      create: { name: 'Boxer', species: 'DOG', size: 'LARGE', coatType: 'Short', groomingFrequency: 56, typicalDuration: 50 },
    }),
    prisma.breed.upsert({
      where: { name_species: { name: 'Australian Shepherd', species: 'DOG' } },
      update: {},
      create: { name: 'Australian Shepherd', species: 'DOG', size: 'MEDIUM', coatType: 'Medium, Wavy', groomingFrequency: 35, typicalDuration: 80 },
    }),
    prisma.breed.upsert({
      where: { name_species: { name: 'Havanese', species: 'DOG' } },
      update: {},
      create: { name: 'Havanese', species: 'DOG', size: 'SMALL', coatType: 'Long, Silky', groomingFrequency: 28, typicalDuration: 70 },
    }),
    prisma.breed.upsert({
      where: { name_species: { name: 'Mixed Breed Dog', species: 'DOG' } },
      update: {},
      create: { name: 'Mixed Breed Dog', species: 'DOG', size: 'MEDIUM', coatType: 'Varies', groomingFrequency: 42, typicalDuration: 60 },
    }),
  ])
  console.log('Created dog breeds:', dogBreeds.length)

  // ==========================================
  // CAT BREEDS (10+)
  // ==========================================
  const catBreeds = await Promise.all([
    prisma.breed.upsert({
      where: { name_species: { name: 'Persian', species: 'CAT' } },
      update: {},
      create: { name: 'Persian', species: 'CAT', size: 'MEDIUM', coatType: 'Long', groomingFrequency: 28, typicalDuration: 60 },
    }),
    prisma.breed.upsert({
      where: { name_species: { name: 'Maine Coon', species: 'CAT' } },
      update: {},
      create: { name: 'Maine Coon', species: 'CAT', size: 'LARGE', coatType: 'Long', groomingFrequency: 35, typicalDuration: 75 },
    }),
    prisma.breed.upsert({
      where: { name_species: { name: 'Domestic Shorthair', species: 'CAT' } },
      update: {},
      create: { name: 'Domestic Shorthair', species: 'CAT', size: 'MEDIUM', coatType: 'Short', groomingFrequency: 56, typicalDuration: 30 },
    }),
    prisma.breed.upsert({
      where: { name_species: { name: 'Siamese', species: 'CAT' } },
      update: {},
      create: { name: 'Siamese', species: 'CAT', size: 'MEDIUM', coatType: 'Short', groomingFrequency: 56, typicalDuration: 30 },
    }),
    prisma.breed.upsert({
      where: { name_species: { name: 'Ragdoll', species: 'CAT' } },
      update: {},
      create: { name: 'Ragdoll', species: 'CAT', size: 'LARGE', coatType: 'Long, Silky', groomingFrequency: 35, typicalDuration: 60 },
    }),
    prisma.breed.upsert({
      where: { name_species: { name: 'British Shorthair', species: 'CAT' } },
      update: {},
      create: { name: 'British Shorthair', species: 'CAT', size: 'MEDIUM', coatType: 'Short, Dense', groomingFrequency: 42, typicalDuration: 40 },
    }),
    prisma.breed.upsert({
      where: { name_species: { name: 'Scottish Fold', species: 'CAT' } },
      update: {},
      create: { name: 'Scottish Fold', species: 'CAT', size: 'MEDIUM', coatType: 'Short/Long', groomingFrequency: 42, typicalDuration: 45 },
    }),
    prisma.breed.upsert({
      where: { name_species: { name: 'Bengal', species: 'CAT' } },
      update: {},
      create: { name: 'Bengal', species: 'CAT', size: 'MEDIUM', coatType: 'Short', groomingFrequency: 56, typicalDuration: 35 },
    }),
    prisma.breed.upsert({
      where: { name_species: { name: 'Sphynx', species: 'CAT' } },
      update: {},
      create: { name: 'Sphynx', species: 'CAT', size: 'MEDIUM', coatType: 'Hairless', groomingFrequency: 14, typicalDuration: 45 },
    }),
    prisma.breed.upsert({
      where: { name_species: { name: 'Himalayan', species: 'CAT' } },
      update: {},
      create: { name: 'Himalayan', species: 'CAT', size: 'MEDIUM', coatType: 'Long', groomingFrequency: 28, typicalDuration: 60 },
    }),
    prisma.breed.upsert({
      where: { name_species: { name: 'Mixed Breed Cat', species: 'CAT' } },
      update: {},
      create: { name: 'Mixed Breed Cat', species: 'CAT', size: 'MEDIUM', coatType: 'Varies', groomingFrequency: 42, typicalDuration: 40 },
    }),
  ])
  console.log('Created cat breeds:', catBreeds.length)

  const allBreeds = [...dogBreeds, ...catBreeds]

  // ==========================================
  // SERVICES (20+)
  // ==========================================
  const services = await Promise.all([
    // Bath Services
    prisma.service.upsert({ where: { id: 'svc-bath-basic' }, update: {}, create: { id: 'svc-bath-basic', name: 'Basic Bath', description: 'Shampoo, rinse, and towel dry', category: 'BATH', basePrice: 35, baseDuration: 30 } }),
    prisma.service.upsert({ where: { id: 'svc-bath-deluxe' }, update: {}, create: { id: 'svc-bath-deluxe', name: 'Deluxe Bath', description: 'Premium shampoo, conditioner, blow dry, and brush out', category: 'BATH', basePrice: 55, baseDuration: 45 } }),
    prisma.service.upsert({ where: { id: 'svc-bath-medicated' }, update: {}, create: { id: 'svc-bath-medicated', name: 'Medicated Bath', description: 'Therapeutic bath with medicated shampoo for skin conditions', category: 'BATH', basePrice: 65, baseDuration: 50 } }),
    prisma.service.upsert({ where: { id: 'svc-bath-oatmeal' }, update: {}, create: { id: 'svc-bath-oatmeal', name: 'Oatmeal Bath', description: 'Soothing oatmeal bath for sensitive skin', category: 'BATH', basePrice: 50, baseDuration: 40 } }),
    // Haircut Services
    prisma.service.upsert({ where: { id: 'svc-haircut-basic' }, update: {}, create: { id: 'svc-haircut-basic', name: 'Basic Haircut', description: 'Breed-standard trim with bath', category: 'HAIRCUT', basePrice: 65, baseDuration: 60 } }),
    prisma.service.upsert({ where: { id: 'svc-haircut-full' }, update: {}, create: { id: 'svc-haircut-full', name: 'Full Grooming', description: 'Complete grooming package with bath, haircut, nail trim, ear cleaning', category: 'HAIRCUT', basePrice: 85, baseDuration: 90 } }),
    prisma.service.upsert({ where: { id: 'svc-haircut-creative' }, update: {}, create: { id: 'svc-haircut-creative', name: 'Creative Styling', description: 'Custom creative cuts and designs', category: 'HAIRCUT', basePrice: 120, baseDuration: 120 } }),
    prisma.service.upsert({ where: { id: 'svc-haircut-show' }, update: {}, create: { id: 'svc-haircut-show', name: 'Show Cut', description: 'Professional breed-standard show preparation cut', category: 'HAIRCUT', basePrice: 150, baseDuration: 150 } }),
    prisma.service.upsert({ where: { id: 'svc-haircut-puppy' }, update: {}, create: { id: 'svc-haircut-puppy', name: 'Puppy First Groom', description: 'Gentle introduction grooming for puppies under 6 months', category: 'HAIRCUT', basePrice: 45, baseDuration: 45 } }),
    // Nail Care
    prisma.service.upsert({ where: { id: 'svc-nail-trim' }, update: {}, create: { id: 'svc-nail-trim', name: 'Nail Trim', description: 'Nail clipping and filing', category: 'NAIL_CARE', basePrice: 15, baseDuration: 15, isAddOn: true } }),
    prisma.service.upsert({ where: { id: 'svc-nail-grind' }, update: {}, create: { id: 'svc-nail-grind', name: 'Nail Grinding', description: 'Smooth nail grinding for comfort', category: 'NAIL_CARE', basePrice: 20, baseDuration: 20, isAddOn: true } }),
    prisma.service.upsert({ where: { id: 'svc-nail-paint' }, update: {}, create: { id: 'svc-nail-paint', name: 'Nail Polish', description: 'Pet-safe colorful nail polish application', category: 'NAIL_CARE', basePrice: 15, baseDuration: 15, isAddOn: true } }),
    // Ear Care
    prisma.service.upsert({ where: { id: 'svc-ear-clean' }, update: {}, create: { id: 'svc-ear-clean', name: 'Ear Cleaning', description: 'Gentle ear cleaning and inspection', category: 'EAR_CARE', basePrice: 12, baseDuration: 10, isAddOn: true } }),
    prisma.service.upsert({ where: { id: 'svc-ear-pluck' }, update: {}, create: { id: 'svc-ear-pluck', name: 'Ear Hair Plucking', description: 'Remove excess ear hair for breeds that need it', category: 'EAR_CARE', basePrice: 15, baseDuration: 15, isAddOn: true } }),
    // Teeth Care
    prisma.service.upsert({ where: { id: 'svc-teeth-brush' }, update: {}, create: { id: 'svc-teeth-brush', name: 'Teeth Brushing', description: 'Dental hygiene treatment', category: 'TEETH_CARE', basePrice: 10, baseDuration: 10, isAddOn: true } }),
    prisma.service.upsert({ where: { id: 'svc-breath-treat' }, update: {}, create: { id: 'svc-breath-treat', name: 'Breath Freshening', description: 'Special breath freshening treatment', category: 'TEETH_CARE', basePrice: 12, baseDuration: 10, isAddOn: true } }),
    // Specialty Services
    prisma.service.upsert({ where: { id: 'svc-deshed' }, update: {}, create: { id: 'svc-deshed', name: 'De-shedding Treatment', description: 'Reduce shedding with specialized treatment', category: 'SPECIALTY', basePrice: 30, baseDuration: 30, isAddOn: true } }),
    prisma.service.upsert({ where: { id: 'svc-flea' }, update: {}, create: { id: 'svc-flea', name: 'Flea Treatment Bath', description: 'Medicated flea and tick treatment', category: 'SPECIALTY', basePrice: 25, baseDuration: 20, isAddOn: true } }),
    prisma.service.upsert({ where: { id: 'svc-anal' }, update: {}, create: { id: 'svc-anal', name: 'Anal Gland Expression', description: 'External anal gland expression', category: 'SPECIALTY', basePrice: 15, baseDuration: 10, isAddOn: true } }),
    prisma.service.upsert({ where: { id: 'svc-pad-trim' }, update: {}, create: { id: 'svc-pad-trim', name: 'Paw Pad Trim', description: 'Trim hair between paw pads', category: 'SPECIALTY', basePrice: 10, baseDuration: 10, isAddOn: true } }),
    prisma.service.upsert({ where: { id: 'svc-sanitary' }, update: {}, create: { id: 'svc-sanitary', name: 'Sanitary Trim', description: 'Hygienic trim of sanitary areas', category: 'SPECIALTY', basePrice: 15, baseDuration: 15, isAddOn: true } }),
    prisma.service.upsert({ where: { id: 'svc-face-trim' }, update: {}, create: { id: 'svc-face-trim', name: 'Face & Feet Trim', description: 'Clean up face and feet between full grooms', category: 'SPECIALTY', basePrice: 25, baseDuration: 20, isAddOn: true } }),
    prisma.service.upsert({ where: { id: 'svc-mat-remove' }, update: {}, create: { id: 'svc-mat-remove', name: 'Mat Removal', description: 'Careful removal of mats and tangles', category: 'SPECIALTY', basePrice: 25, baseDuration: 30, isAddOn: true } }),
    prisma.service.upsert({ where: { id: 'svc-skunk' }, update: {}, create: { id: 'svc-skunk', name: 'Skunk Odor Treatment', description: 'Special deodorizing bath for skunk spray', category: 'SPECIALTY', basePrice: 75, baseDuration: 60 } }),
  ])
  console.log('Created services:', services.length)

  // ==========================================
  // PRODUCTS (20+)
  // ==========================================
  const products = await Promise.all([
    prisma.product.upsert({ where: { sku: 'SHAM-001' }, update: {}, create: { sku: 'SHAM-001', name: 'Premium Dog Shampoo', description: 'Gentle cleansing shampoo for all coat types', category: 'SHAMPOO', price: 18.99, cost: 8.00, quantity: 50, reorderLevel: 10 } }),
    prisma.product.upsert({ where: { sku: 'SHAM-002' }, update: {}, create: { sku: 'SHAM-002', name: 'Medicated Shampoo', description: 'Veterinary formula for skin conditions', category: 'SHAMPOO', price: 24.99, cost: 12.00, quantity: 30, reorderLevel: 8 } }),
    prisma.product.upsert({ where: { sku: 'SHAM-003' }, update: {}, create: { sku: 'SHAM-003', name: 'Whitening Shampoo', description: 'Brightens white and light coats', category: 'SHAMPOO', price: 19.99, cost: 9.00, quantity: 25, reorderLevel: 8 } }),
    prisma.product.upsert({ where: { sku: 'SHAM-004' }, update: {}, create: { sku: 'SHAM-004', name: 'Puppy Shampoo', description: 'Tear-free gentle formula', category: 'SHAMPOO', price: 15.99, cost: 6.00, quantity: 40, reorderLevel: 10 } }),
    prisma.product.upsert({ where: { sku: 'COND-001' }, update: {}, create: { sku: 'COND-001', name: 'Silk Conditioner', description: 'Detangling and softening conditioner', category: 'CONDITIONER', price: 16.99, cost: 7.00, quantity: 35, reorderLevel: 8 } }),
    prisma.product.upsert({ where: { sku: 'COND-002' }, update: {}, create: { sku: 'COND-002', name: 'Leave-in Conditioner Spray', description: 'Lightweight daily conditioner', category: 'CONDITIONER', price: 14.99, cost: 5.50, quantity: 45, reorderLevel: 10 } }),
    prisma.product.upsert({ where: { sku: 'BRUSH-001' }, update: {}, create: { sku: 'BRUSH-001', name: 'Slicker Brush', description: 'Professional grooming slicker brush', category: 'BRUSH', price: 12.99, cost: 5.00, quantity: 20, reorderLevel: 5 } }),
    prisma.product.upsert({ where: { sku: 'BRUSH-002' }, update: {}, create: { sku: 'BRUSH-002', name: 'Deshedding Tool', description: 'Reduces shedding by up to 90%', category: 'BRUSH', price: 29.99, cost: 14.00, quantity: 15, reorderLevel: 5 } }),
    prisma.product.upsert({ where: { sku: 'BRUSH-003' }, update: {}, create: { sku: 'BRUSH-003', name: 'Pin Brush', description: 'Gentle detangling brush', category: 'BRUSH', price: 11.99, cost: 4.50, quantity: 25, reorderLevel: 5 } }),
    prisma.product.upsert({ where: { sku: 'TREAT-001' }, update: {}, create: { sku: 'TREAT-001', name: 'Training Treats', description: 'Small tasty rewards', category: 'TREAT', price: 8.99, cost: 3.50, quantity: 60, reorderLevel: 15 } }),
    prisma.product.upsert({ where: { sku: 'TREAT-002' }, update: {}, create: { sku: 'TREAT-002', name: 'Dental Chews', description: 'Teeth cleaning treats', category: 'TREAT', price: 12.99, cost: 5.00, quantity: 40, reorderLevel: 10 } }),
    prisma.product.upsert({ where: { sku: 'COLLAR-001' }, update: {}, create: { sku: 'COLLAR-001', name: 'Bandana - Small', description: 'Stylish pet bandana', category: 'ACCESSORY', price: 7.99, cost: 2.50, quantity: 30, reorderLevel: 10 } }),
    prisma.product.upsert({ where: { sku: 'COLLAR-002' }, update: {}, create: { sku: 'COLLAR-002', name: 'Bandana - Large', description: 'Stylish pet bandana for larger pets', category: 'ACCESSORY', price: 9.99, cost: 3.00, quantity: 25, reorderLevel: 8 } }),
    prisma.product.upsert({ where: { sku: 'BOW-001' }, update: {}, create: { sku: 'BOW-001', name: 'Hair Bows Set', description: 'Pack of 10 colorful bows', category: 'ACCESSORY', price: 6.99, cost: 2.00, quantity: 50, reorderLevel: 15 } }),
    prisma.product.upsert({ where: { sku: 'PERF-001' }, update: {}, create: { sku: 'PERF-001', name: 'Pet Cologne - Fresh', description: 'Light fresh scent spray', category: 'OTHER', price: 11.99, cost: 4.00, quantity: 30, reorderLevel: 8 } }),
    prisma.product.upsert({ where: { sku: 'PERF-002' }, update: {}, create: { sku: 'PERF-002', name: 'Pet Cologne - Berry', description: 'Sweet berry scented spray', category: 'OTHER', price: 11.99, cost: 4.00, quantity: 30, reorderLevel: 8 } }),
    prisma.product.upsert({ where: { sku: 'EAR-001' }, update: {}, create: { sku: 'EAR-001', name: 'Ear Cleaner Solution', description: 'Gentle ear cleaning solution', category: 'OTHER', price: 13.99, cost: 5.50, quantity: 25, reorderLevel: 8 } }),
    prisma.product.upsert({ where: { sku: 'EYE-001' }, update: {}, create: { sku: 'EYE-001', name: 'Tear Stain Remover', description: 'Safe tear stain removal', category: 'OTHER', price: 14.99, cost: 6.00, quantity: 20, reorderLevel: 5 } }),
    prisma.product.upsert({ where: { sku: 'PAW-001' }, update: {}, create: { sku: 'PAW-001', name: 'Paw Balm', description: 'Moisturizing paw protection', category: 'OTHER', price: 9.99, cost: 3.50, quantity: 35, reorderLevel: 10 } }),
    prisma.product.upsert({ where: { sku: 'NAIL-001' }, update: {}, create: { sku: 'NAIL-001', name: 'Nail Clippers - Small', description: 'Professional small pet nail clippers', category: 'OTHER', price: 8.99, cost: 3.00, quantity: 15, reorderLevel: 5 } }),
    prisma.product.upsert({ where: { sku: 'NAIL-002' }, update: {}, create: { sku: 'NAIL-002', name: 'Nail Clippers - Large', description: 'Professional large pet nail clippers', category: 'OTHER', price: 10.99, cost: 4.00, quantity: 15, reorderLevel: 5 } }),
  ])
  console.log('Created products:', products.length)

  // ==========================================
  // CLIENTS (20+)
  // ==========================================
  const clientData = [
    { firstName: 'John', lastName: 'Smith', email: 'john.smith@email.com', phone: '(555) 111-0001', address: '123 Oak Street', city: 'New York', state: 'NY', zipCode: '10001', loyaltyPoints: 150 },
    { firstName: 'Mary', lastName: 'Johnson', email: 'mary.johnson@email.com', phone: '(555) 111-0002', address: '456 Maple Ave', city: 'Brooklyn', state: 'NY', zipCode: '11201', loyaltyPoints: 280 },
    { firstName: 'David', lastName: 'Williams', email: 'david.williams@email.com', phone: '(555) 111-0003', address: '789 Pine Road', city: 'Queens', state: 'NY', zipCode: '11375', loyaltyPoints: 95 },
    { firstName: 'Lisa', lastName: 'Brown', email: 'lisa.brown@email.com', phone: '(555) 111-0004', address: '321 Elm Street', city: 'Manhattan', state: 'NY', zipCode: '10016', loyaltyPoints: 420 },
    { firstName: 'Michael', lastName: 'Jones', email: 'michael.jones@email.com', phone: '(555) 111-0005', address: '654 Cedar Lane', city: 'Bronx', state: 'NY', zipCode: '10451', loyaltyPoints: 175 },
    { firstName: 'Jennifer', lastName: 'Garcia', email: 'jennifer.garcia@email.com', phone: '(555) 111-0006', address: '987 Birch Blvd', city: 'Staten Island', state: 'NY', zipCode: '10301', loyaltyPoints: 310 },
    { firstName: 'Robert', lastName: 'Miller', email: 'robert.miller@email.com', phone: '(555) 111-0007', address: '147 Walnut Way', city: 'Brooklyn', state: 'NY', zipCode: '11215', loyaltyPoints: 88 },
    { firstName: 'Patricia', lastName: 'Davis', email: 'patricia.davis@email.com', phone: '(555) 111-0008', address: '258 Cherry Circle', city: 'Queens', state: 'NY', zipCode: '11355', loyaltyPoints: 540 },
    { firstName: 'William', lastName: 'Rodriguez', email: 'william.rodriguez@email.com', phone: '(555) 111-0009', address: '369 Spruce Street', city: 'Manhattan', state: 'NY', zipCode: '10022', loyaltyPoints: 125 },
    { firstName: 'Elizabeth', lastName: 'Martinez', email: 'elizabeth.martinez@email.com', phone: '(555) 111-0010', address: '741 Ash Avenue', city: 'New York', state: 'NY', zipCode: '10003', loyaltyPoints: 265 },
    { firstName: 'James', lastName: 'Hernandez', email: 'james.hernandez@email.com', phone: '(555) 111-0011', address: '852 Willow Drive', city: 'Brooklyn', state: 'NY', zipCode: '11220', loyaltyPoints: 198 },
    { firstName: 'Susan', lastName: 'Lopez', email: 'susan.lopez@email.com', phone: '(555) 111-0012', address: '963 Poplar Place', city: 'Queens', state: 'NY', zipCode: '11432', loyaltyPoints: 333 },
    { firstName: 'Richard', lastName: 'Gonzalez', email: 'richard.gonzalez@email.com', phone: '(555) 111-0013', address: '159 Sycamore St', city: 'Bronx', state: 'NY', zipCode: '10467', loyaltyPoints: 77 },
    { firstName: 'Barbara', lastName: 'Wilson', email: 'barbara.wilson@email.com', phone: '(555) 111-0014', address: '357 Magnolia Road', city: 'Manhattan', state: 'NY', zipCode: '10019', loyaltyPoints: 445 },
    { firstName: 'Thomas', lastName: 'Anderson', email: 'thomas.anderson@email.com', phone: '(555) 111-0015', address: '468 Hickory Lane', city: 'Staten Island', state: 'NY', zipCode: '10312', loyaltyPoints: 156 },
    { firstName: 'Margaret', lastName: 'Taylor', email: 'margaret.taylor@email.com', phone: '(555) 111-0016', address: '579 Cypress Court', city: 'Brooklyn', state: 'NY', zipCode: '11238', loyaltyPoints: 289 },
    { firstName: 'Charles', lastName: 'Thomas', email: 'charles.thomas@email.com', phone: '(555) 111-0017', address: '680 Redwood Ave', city: 'Queens', state: 'NY', zipCode: '11101', loyaltyPoints: 112 },
    { firstName: 'Dorothy', lastName: 'Moore', email: 'dorothy.moore@email.com', phone: '(555) 111-0018', address: '791 Palm Street', city: 'New York', state: 'NY', zipCode: '10011', loyaltyPoints: 367 },
    { firstName: 'Christopher', lastName: 'Jackson', email: 'christopher.jackson@email.com', phone: '(555) 111-0019', address: '802 Oakwood Blvd', city: 'Manhattan', state: 'NY', zipCode: '10025', loyaltyPoints: 204 },
    { firstName: 'Nancy', lastName: 'Martin', email: 'nancy.martin@email.com', phone: '(555) 111-0020', address: '913 Pinewood Drive', city: 'Brooklyn', state: 'NY', zipCode: '11230', loyaltyPoints: 478 },
  ]

  const clients = await Promise.all(
    clientData.map(data =>
      prisma.client.upsert({
        where: { email: data.email },
        update: {},
        create: data,
      })
    )
  )
  console.log('Created clients:', clients.length)

  // ==========================================
  // PETS (30+) - multiple pets per client
  // ==========================================
  const petData = [
    // Client 0 pets
    { name: 'Max', species: 'DOG', breedIndex: 0, clientIndex: 0, gender: 'MALE', dob: '2020-03-15', weight: 72, color: 'Golden', isNeutered: true, temperament: 'Friendly and playful' },
    { name: 'Rocky', species: 'DOG', breedIndex: 3, clientIndex: 0, gender: 'MALE', dob: '2022-05-20', weight: 68, color: 'Black', isNeutered: true, temperament: 'Energetic and friendly' },
    // Client 1 pets
    { name: 'Bella', species: 'DOG', breedIndex: 1, clientIndex: 1, gender: 'FEMALE', dob: '2019-07-22', weight: 45, color: 'White', isNeutered: true, temperament: 'Intelligent and active' },
    { name: 'Milo', species: 'CAT', breedIndex: 21, clientIndex: 1, gender: 'MALE', dob: '2021-02-14', weight: 10, color: 'Orange Tabby', isNeutered: true, temperament: 'Curious and playful' },
    // Client 2 pets
    { name: 'Charlie', species: 'DOG', breedIndex: 2, clientIndex: 2, gender: 'MALE', dob: '2021-01-10', weight: 14, color: 'Brown and White', isNeutered: false, temperament: 'Affectionate, nervous with strangers' },
    // Client 3 pets
    { name: 'Luna', species: 'CAT', breedIndex: 21, clientIndex: 3, gender: 'FEMALE', dob: '2020-09-05', weight: 9, color: 'White', isNeutered: true, temperament: 'Calm and gentle' },
    { name: 'Daisy', species: 'DOG', breedIndex: 8, clientIndex: 3, gender: 'FEMALE', dob: '2019-11-30', weight: 7, color: 'White', isNeutered: true, temperament: 'Sweet and loving' },
    // Client 4 pets
    { name: 'Cooper', species: 'DOG', breedIndex: 5, clientIndex: 4, gender: 'MALE', dob: '2020-06-18', weight: 75, color: 'Black and Tan', isNeutered: true, temperament: 'Loyal and protective' },
    // Client 5 pets
    { name: 'Sadie', species: 'DOG', breedIndex: 10, clientIndex: 5, gender: 'FEMALE', dob: '2018-08-25', weight: 28, color: 'Golden', isNeutered: true, temperament: 'Gentle and patient' },
    { name: 'Tucker', species: 'DOG', breedIndex: 7, clientIndex: 5, gender: 'MALE', dob: '2021-04-12', weight: 25, color: 'Tri-color', isNeutered: false, temperament: 'Curious and vocal' },
    // Client 6 pets
    { name: 'Buddy', species: 'DOG', breedIndex: 3, clientIndex: 6, gender: 'MALE', dob: '2019-12-01', weight: 70, color: 'Yellow', isNeutered: true, temperament: 'Friendly to everyone' },
    // Client 7 pets
    { name: 'Molly', species: 'DOG', breedIndex: 11, clientIndex: 7, gender: 'FEMALE', dob: '2020-07-08', weight: 6, color: 'Orange', isNeutered: true, temperament: 'Spunky and alert' },
    { name: 'Shadow', species: 'CAT', breedIndex: 22, clientIndex: 7, gender: 'MALE', dob: '2019-03-20', weight: 18, color: 'Brown Tabby', isNeutered: true, temperament: 'Independent and majestic' },
    // Client 8 pets
    { name: 'Bear', species: 'DOG', breedIndex: 13, clientIndex: 8, gender: 'MALE', dob: '2020-01-15', weight: 55, color: 'Black and White', isNeutered: true, temperament: 'Friendly but stubborn' },
    // Client 9 pets
    { name: 'Chloe', species: 'DOG', breedIndex: 4, clientIndex: 9, gender: 'FEMALE', dob: '2019-10-22', weight: 5, color: 'Black and Tan', isNeutered: true, temperament: 'Confident and curious' },
    { name: 'Oliver', species: 'CAT', breedIndex: 24, clientIndex: 9, gender: 'MALE', dob: '2021-06-30', weight: 11, color: 'Blue', isNeutered: true, temperament: 'Calm and affectionate' },
    // Client 10 pets
    { name: 'Duke', species: 'DOG', breedIndex: 17, clientIndex: 10, gender: 'MALE', dob: '2020-04-05', weight: 65, color: 'Fawn', isNeutered: true, temperament: 'Playful and energetic' },
    // Client 11 pets
    { name: 'Zoey', species: 'DOG', breedIndex: 9, clientIndex: 11, gender: 'FEMALE', dob: '2019-05-18', weight: 12, color: 'White', isNeutered: true, temperament: 'Happy and bouncy' },
    { name: 'Leo', species: 'CAT', breedIndex: 28, clientIndex: 11, gender: 'MALE', dob: '2020-08-12', weight: 9, color: 'Spotted', isNeutered: true, temperament: 'Active and playful' },
    // Client 12 pets
    { name: 'Jack', species: 'DOG', breedIndex: 12, clientIndex: 12, gender: 'MALE', dob: '2021-02-28', weight: 22, color: 'Salt and Pepper', isNeutered: false, temperament: 'Alert and spirited' },
    // Client 13 pets
    { name: 'Penny', species: 'DOG', breedIndex: 14, clientIndex: 13, gender: 'FEMALE', dob: '2020-11-11', weight: 40, color: 'Black and White', isNeutered: true, temperament: 'Highly intelligent' },
    { name: 'Simba', species: 'CAT', breedIndex: 25, clientIndex: 13, gender: 'MALE', dob: '2019-09-15', weight: 14, color: 'Cream', isNeutered: true, temperament: 'Docile and loving' },
    // Client 14 pets
    { name: 'Teddy', species: 'DOG', breedIndex: 19, clientIndex: 14, gender: 'MALE', dob: '2020-12-20', weight: 11, color: 'Cream', isNeutered: true, temperament: 'Sociable and cheerful' },
    // Client 15 pets
    { name: 'Bailey', species: 'DOG', breedIndex: 18, clientIndex: 15, gender: 'FEMALE', dob: '2019-06-08', weight: 50, color: 'Red Merle', isNeutered: true, temperament: 'Smart and active' },
    { name: 'Whiskers', species: 'CAT', breedIndex: 23, clientIndex: 15, gender: 'MALE', dob: '2020-03-25', weight: 12, color: 'Seal Point', isNeutered: true, temperament: 'Vocal and social' },
    // Client 16 pets
    { name: 'Oscar', species: 'DOG', breedIndex: 16, clientIndex: 16, gender: 'MALE', dob: '2021-07-14', weight: 18, color: 'Red', isNeutered: false, temperament: 'Bold and curious' },
    // Client 17 pets
    { name: 'Sophie', species: 'DOG', breedIndex: 1, clientIndex: 17, gender: 'FEMALE', dob: '2018-09-30', weight: 50, color: 'Apricot', isNeutered: true, temperament: 'Elegant and smart' },
    { name: 'Nala', species: 'CAT', breedIndex: 21, clientIndex: 17, gender: 'FEMALE', dob: '2019-12-18', weight: 8, color: 'Silver', isNeutered: true, temperament: 'Quiet and sweet' },
    // Client 18 pets
    { name: 'Winston', species: 'DOG', breedIndex: 6, clientIndex: 18, gender: 'MALE', dob: '2020-02-14', weight: 52, color: 'White', isNeutered: true, temperament: 'Gentle and stubborn' },
    // Client 19 pets
    { name: 'Lily', species: 'DOG', breedIndex: 0, clientIndex: 19, gender: 'FEMALE', dob: '2019-04-22', weight: 65, color: 'Cream', isNeutered: true, temperament: 'Sweet and patient' },
    { name: 'Ginger', species: 'CAT', breedIndex: 30, clientIndex: 19, gender: 'FEMALE', dob: '2020-10-08', weight: 10, color: 'Orange', isNeutered: true, temperament: 'Friendly and calm' },
  ]

  const pets = await Promise.all(
    petData.map(async (data) => {
      const existing = await prisma.pet.findFirst({
        where: { name: data.name, clientId: clients[data.clientIndex].id }
      })
      if (existing) return existing

      return prisma.pet.create({
        data: {
          name: data.name,
          species: data.species as 'DOG' | 'CAT',
          breedId: allBreeds[data.breedIndex].id,
          clientId: clients[data.clientIndex].id,
          gender: data.gender as 'MALE' | 'FEMALE',
          dateOfBirth: new Date(data.dob),
          weight: data.weight,
          color: data.color,
          isNeutered: data.isNeutered,
          temperament: data.temperament,
        },
      })
    })
  )
  console.log('Created pets:', pets.length)

  // ==========================================
  // VACCINATION RECORDS (20+)
  // ==========================================
  const vaccinations = await Promise.all([
    prisma.vaccinationRecord.create({ data: { petId: pets[0].id, vaccineName: 'Rabies', dateAdministered: new Date('2023-03-15'), expirationDate: new Date('2026-03-15'), veterinarian: 'Dr. Smith - City Vet Clinic' } }),
    prisma.vaccinationRecord.create({ data: { petId: pets[0].id, vaccineName: 'DHPP', dateAdministered: new Date('2023-03-15'), expirationDate: new Date('2024-03-15'), veterinarian: 'Dr. Smith - City Vet Clinic' } }),
    prisma.vaccinationRecord.create({ data: { petId: pets[1].id, vaccineName: 'Rabies', dateAdministered: new Date('2023-05-20'), expirationDate: new Date('2026-05-20'), veterinarian: 'Dr. Johnson - Pet Care Center' } }),
    prisma.vaccinationRecord.create({ data: { petId: pets[2].id, vaccineName: 'Rabies', dateAdministered: new Date('2023-07-22'), expirationDate: new Date('2026-07-22'), veterinarian: 'Dr. Williams - Animal Hospital' } }),
    prisma.vaccinationRecord.create({ data: { petId: pets[2].id, vaccineName: 'DHPP', dateAdministered: new Date('2023-07-22'), expirationDate: new Date('2024-07-22'), veterinarian: 'Dr. Williams - Animal Hospital' } }),
    prisma.vaccinationRecord.create({ data: { petId: pets[3].id, vaccineName: 'FVRCP', dateAdministered: new Date('2023-02-14'), expirationDate: new Date('2024-02-14'), veterinarian: 'Dr. Brown - Feline Friends Clinic' } }),
    prisma.vaccinationRecord.create({ data: { petId: pets[4].id, vaccineName: 'Rabies', dateAdministered: new Date('2023-01-10'), expirationDate: new Date('2026-01-10'), veterinarian: 'Dr. Davis - Downtown Vet' } }),
    prisma.vaccinationRecord.create({ data: { petId: pets[5].id, vaccineName: 'FVRCP', dateAdministered: new Date('2023-09-05'), expirationDate: new Date('2024-09-05'), veterinarian: 'Dr. Brown - Feline Friends Clinic' } }),
    prisma.vaccinationRecord.create({ data: { petId: pets[6].id, vaccineName: 'Rabies', dateAdministered: new Date('2023-11-30'), expirationDate: new Date('2026-11-30'), veterinarian: 'Dr. Smith - City Vet Clinic' } }),
    prisma.vaccinationRecord.create({ data: { petId: pets[7].id, vaccineName: 'Rabies', dateAdministered: new Date('2023-06-18'), expirationDate: new Date('2026-06-18'), veterinarian: 'Dr. Johnson - Pet Care Center' } }),
    prisma.vaccinationRecord.create({ data: { petId: pets[7].id, vaccineName: 'DHPP', dateAdministered: new Date('2023-06-18'), expirationDate: new Date('2024-06-18'), veterinarian: 'Dr. Johnson - Pet Care Center' } }),
    prisma.vaccinationRecord.create({ data: { petId: pets[8].id, vaccineName: 'Rabies', dateAdministered: new Date('2023-08-25'), expirationDate: new Date('2026-08-25'), veterinarian: 'Dr. Williams - Animal Hospital' } }),
    prisma.vaccinationRecord.create({ data: { petId: pets[9].id, vaccineName: 'Rabies', dateAdministered: new Date('2023-04-12'), expirationDate: new Date('2026-04-12'), veterinarian: 'Dr. Davis - Downtown Vet' } }),
    prisma.vaccinationRecord.create({ data: { petId: pets[10].id, vaccineName: 'Rabies', dateAdministered: new Date('2023-12-01'), expirationDate: new Date('2026-12-01'), veterinarian: 'Dr. Smith - City Vet Clinic' } }),
    prisma.vaccinationRecord.create({ data: { petId: pets[11].id, vaccineName: 'Rabies', dateAdministered: new Date('2023-07-08'), expirationDate: new Date('2026-07-08'), veterinarian: 'Dr. Johnson - Pet Care Center' } }),
    prisma.vaccinationRecord.create({ data: { petId: pets[12].id, vaccineName: 'FVRCP', dateAdministered: new Date('2023-03-20'), expirationDate: new Date('2024-03-20'), veterinarian: 'Dr. Brown - Feline Friends Clinic' } }),
    prisma.vaccinationRecord.create({ data: { petId: pets[13].id, vaccineName: 'Rabies', dateAdministered: new Date('2023-01-15'), expirationDate: new Date('2026-01-15'), veterinarian: 'Dr. Williams - Animal Hospital' } }),
    prisma.vaccinationRecord.create({ data: { petId: pets[14].id, vaccineName: 'Rabies', dateAdministered: new Date('2023-10-22'), expirationDate: new Date('2026-10-22'), veterinarian: 'Dr. Davis - Downtown Vet' } }),
    prisma.vaccinationRecord.create({ data: { petId: pets[15].id, vaccineName: 'FVRCP', dateAdministered: new Date('2023-06-30'), expirationDate: new Date('2024-06-30'), veterinarian: 'Dr. Brown - Feline Friends Clinic' } }),
    prisma.vaccinationRecord.create({ data: { petId: pets[16].id, vaccineName: 'Rabies', dateAdministered: new Date('2023-04-05'), expirationDate: new Date('2026-04-05'), veterinarian: 'Dr. Smith - City Vet Clinic' } }),
  ])
  console.log('Created vaccination records:', vaccinations.length)

  // ==========================================
  // BEHAVIORAL NOTES (20+)
  // ==========================================
  const behavioralNotes = await Promise.all([
    prisma.behavioralNote.create({ data: { petId: pets[0].id, description: 'Very friendly, loves water and baths', category: 'OTHER', severity: 'LOW' } }),
    prisma.behavioralNote.create({ data: { petId: pets[1].id, description: 'Gets anxious during nail trimming', category: 'ANXIETY', severity: 'MEDIUM' } }),
    prisma.behavioralNote.create({ data: { petId: pets[2].id, description: 'Prefers quiet environment, sensitive to loud noises', category: 'SENSITIVITY', severity: 'MEDIUM' } }),
    prisma.behavioralNote.create({ data: { petId: pets[3].id, description: 'Excellent temperament, no issues', category: 'OTHER', severity: 'LOW' } }),
    prisma.behavioralNote.create({ data: { petId: pets[4].id, description: 'Nervous around strangers initially, warms up quickly', category: 'ANXIETY', severity: 'LOW' } }),
    prisma.behavioralNote.create({ data: { petId: pets[5].id, description: 'Requires gentle handling, elderly cat', category: 'HANDLING', severity: 'MEDIUM' } }),
    prisma.behavioralNote.create({ data: { petId: pets[6].id, description: 'Loves treats, very food motivated', category: 'OTHER', severity: 'LOW' } }),
    prisma.behavioralNote.create({ data: { petId: pets[7].id, description: 'Alert barker, protective of owner', category: 'HANDLING', severity: 'MEDIUM' } }),
    prisma.behavioralNote.create({ data: { petId: pets[8].id, description: 'Calm and cooperative throughout grooming', category: 'OTHER', severity: 'LOW' } }),
    prisma.behavioralNote.create({ data: { petId: pets[9].id, description: 'Tends to nip when ears are cleaned', category: 'AGGRESSION', severity: 'MEDIUM' } }),
    prisma.behavioralNote.create({ data: { petId: pets[10].id, description: 'Very patient, great with handling', category: 'OTHER', severity: 'LOW' } }),
    prisma.behavioralNote.create({ data: { petId: pets[11].id, description: 'Small but feisty, needs firm handling', category: 'HANDLING', severity: 'MEDIUM' } }),
    prisma.behavioralNote.create({ data: { petId: pets[12].id, description: 'Independent cat, tolerates grooming well', category: 'OTHER', severity: 'LOW' } }),
    prisma.behavioralNote.create({ data: { petId: pets[13].id, description: 'Strong and stubborn, needs experienced groomer', category: 'HANDLING', severity: 'MEDIUM' } }),
    prisma.behavioralNote.create({ data: { petId: pets[14].id, description: 'Very confident, enjoys being groomed', category: 'OTHER', severity: 'LOW' } }),
    prisma.behavioralNote.create({ data: { petId: pets[15].id, description: 'Vocal and demanding attention', category: 'OTHER', severity: 'LOW' } }),
    prisma.behavioralNote.create({ data: { petId: pets[16].id, description: 'High energy, needs breaks during grooming', category: 'HANDLING', severity: 'MEDIUM' } }),
    prisma.behavioralNote.create({ data: { petId: pets[17].id, description: 'Sweet and gentle, no issues', category: 'OTHER', severity: 'LOW' } }),
    prisma.behavioralNote.create({ data: { petId: pets[18].id, description: 'Playful cat, may swipe at brushes', category: 'HANDLING', severity: 'LOW' } }),
    prisma.behavioralNote.create({ data: { petId: pets[19].id, description: 'Alert and quick, needs secure hold', category: 'HANDLING', severity: 'MEDIUM' } }),
  ])
  console.log('Created behavioral notes:', behavioralNotes.length)

  // ==========================================
  // APPOINTMENTS (25+)
  // ==========================================
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const dayAfter = new Date(today)
  dayAfter.setDate(dayAfter.getDate() + 2)
  const nextWeek = new Date(today)
  nextWeek.setDate(nextWeek.getDate() + 7)

  const appointmentData = [
    // TODAY's appointments (15+) - various statuses for grooming station
    { clientIdx: 0, petIdx: 0, groomerIdx: 0, date: today, time: '08:00', duration: 90, status: 'COMPLETED', serviceIds: ['svc-haircut-full'] },
    { clientIdx: 1, petIdx: 2, groomerIdx: 1, date: today, time: '08:30', duration: 60, status: 'COMPLETED', serviceIds: ['svc-bath-deluxe'] },
    { clientIdx: 2, petIdx: 4, groomerIdx: 2, date: today, time: '09:00', duration: 75, status: 'IN_PROGRESS', serviceIds: ['svc-haircut-basic', 'svc-nail-trim'] },
    { clientIdx: 3, petIdx: 5, groomerIdx: 0, date: today, time: '09:30', duration: 90, status: 'IN_PROGRESS', serviceIds: ['svc-haircut-full', 'svc-deshed'] },
    { clientIdx: 4, petIdx: 7, groomerIdx: 1, date: today, time: '10:00', duration: 60, status: 'CHECKED_IN', serviceIds: ['svc-bath-basic', 'svc-nail-trim'] },
    { clientIdx: 5, petIdx: 8, groomerIdx: 2, date: today, time: '10:30', duration: 80, status: 'CHECKED_IN', serviceIds: ['svc-haircut-full', 'svc-ear-clean'] },
    { clientIdx: 6, petIdx: 10, groomerIdx: 0, date: today, time: '11:00', duration: 60, status: 'CONFIRMED', serviceIds: ['svc-bath-deluxe'] },
    { clientIdx: 7, petIdx: 11, groomerIdx: 1, date: today, time: '11:30', duration: 90, status: 'CONFIRMED', serviceIds: ['svc-haircut-full', 'svc-deshed'] },
    { clientIdx: 8, petIdx: 13, groomerIdx: 2, date: today, time: '12:00', duration: 75, status: 'CONFIRMED', serviceIds: ['svc-haircut-basic', 'svc-teeth-brush'] },
    { clientIdx: 9, petIdx: 14, groomerIdx: 0, date: today, time: '13:00', duration: 60, status: 'SCHEDULED', serviceIds: ['svc-bath-basic'] },
    { clientIdx: 10, petIdx: 16, groomerIdx: 1, date: today, time: '13:30', duration: 90, status: 'SCHEDULED', serviceIds: ['svc-haircut-full'] },
    { clientIdx: 11, petIdx: 17, groomerIdx: 2, date: today, time: '14:00', duration: 75, status: 'SCHEDULED', serviceIds: ['svc-haircut-basic', 'svc-nail-grind'] },
    { clientIdx: 12, petIdx: 19, groomerIdx: 0, date: today, time: '14:30', duration: 80, status: 'SCHEDULED', serviceIds: ['svc-haircut-full', 'svc-ear-clean'] },
    { clientIdx: 13, petIdx: 20, groomerIdx: 1, date: today, time: '15:00', duration: 60, status: 'SCHEDULED', serviceIds: ['svc-bath-deluxe', 'svc-nail-trim'] },
    { clientIdx: 14, petIdx: 22, groomerIdx: 2, date: today, time: '15:30', duration: 90, status: 'SCHEDULED', serviceIds: ['svc-haircut-full', 'svc-deshed'] },
    { clientIdx: 15, petIdx: 23, groomerIdx: 0, date: today, time: '16:00', duration: 75, status: 'SCHEDULED', serviceIds: ['svc-haircut-basic'] },
    { clientIdx: 16, petIdx: 24, groomerIdx: 1, date: today, time: '16:30', duration: 60, status: 'SCHEDULED', serviceIds: ['svc-bath-basic', 'svc-teeth-brush'] },
    // TOMORROW's appointments
    { clientIdx: 17, petIdx: 25, groomerIdx: 0, date: tomorrow, time: '09:00', duration: 60, status: 'CONFIRMED', serviceIds: ['svc-bath-deluxe', 'svc-nail-trim'] },
    { clientIdx: 18, petIdx: 26, groomerIdx: 1, date: tomorrow, time: '10:00', duration: 75, status: 'SCHEDULED', serviceIds: ['svc-haircut-basic'] },
    { clientIdx: 19, petIdx: 27, groomerIdx: 2, date: tomorrow, time: '11:00', duration: 80, status: 'CONFIRMED', serviceIds: ['svc-haircut-full', 'svc-ear-clean'] },
    { clientIdx: 0, petIdx: 1, groomerIdx: 0, date: tomorrow, time: '14:00', duration: 60, status: 'SCHEDULED', serviceIds: ['svc-bath-basic'] },
    // DAY AFTER appointments
    { clientIdx: 1, petIdx: 3, groomerIdx: 1, date: dayAfter, time: '10:00', duration: 60, status: 'CONFIRMED', serviceIds: ['svc-haircut-basic', 'svc-nail-grind'] },
    { clientIdx: 2, petIdx: 4, groomerIdx: 2, date: dayAfter, time: '11:30', duration: 90, status: 'SCHEDULED', serviceIds: ['svc-haircut-full', 'svc-deshed'] },
    { clientIdx: 3, petIdx: 6, groomerIdx: 0, date: dayAfter, time: '14:00', duration: 60, status: 'CONFIRMED', serviceIds: ['svc-bath-deluxe', 'svc-teeth-brush'] },
    { clientIdx: 4, petIdx: 7, groomerIdx: 1, date: dayAfter, time: '16:00', duration: 50, status: 'SCHEDULED', serviceIds: ['svc-bath-basic', 'svc-nail-trim'] },
    // NEXT WEEK appointments
    { clientIdx: 5, petIdx: 9, groomerIdx: 2, date: nextWeek, time: '09:00', duration: 75, status: 'SCHEDULED', serviceIds: ['svc-haircut-basic'] },
    { clientIdx: 6, petIdx: 10, groomerIdx: 0, date: nextWeek, time: '10:30', duration: 75, status: 'SCHEDULED', serviceIds: ['svc-haircut-basic', 'svc-ear-clean'] },
    { clientIdx: 7, petIdx: 12, groomerIdx: 1, date: nextWeek, time: '13:00', duration: 70, status: 'SCHEDULED', serviceIds: ['svc-haircut-basic'] },
    { clientIdx: 8, petIdx: 13, groomerIdx: 2, date: nextWeek, time: '14:30', duration: 70, status: 'SCHEDULED', serviceIds: ['svc-haircut-basic', 'svc-nail-trim'] },
    { clientIdx: 9, petIdx: 15, groomerIdx: 0, date: nextWeek, time: '16:00', duration: 80, status: 'SCHEDULED', serviceIds: ['svc-haircut-full'] },
    // Past appointments (completed)
    { clientIdx: 0, petIdx: 0, groomerIdx: 0, date: new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000), time: '09:00', duration: 90, status: 'COMPLETED', serviceIds: ['svc-haircut-full'] },
    { clientIdx: 1, petIdx: 2, groomerIdx: 1, date: new Date(today.getTime() - 21 * 24 * 60 * 60 * 1000), time: '11:00', duration: 120, status: 'COMPLETED', serviceIds: ['svc-haircut-full', 'svc-deshed'] },
    { clientIdx: 3, petIdx: 5, groomerIdx: 2, date: new Date(today.getTime() - 28 * 24 * 60 * 60 * 1000), time: '10:00', duration: 60, status: 'COMPLETED', serviceIds: ['svc-bath-deluxe'] },
    { clientIdx: 5, petIdx: 8, groomerIdx: 0, date: new Date(today.getTime() - 35 * 24 * 60 * 60 * 1000), time: '14:00', duration: 80, status: 'COMPLETED', serviceIds: ['svc-haircut-full'] },
    { clientIdx: 7, petIdx: 11, groomerIdx: 1, date: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000), time: '09:30', duration: 60, status: 'COMPLETED', serviceIds: ['svc-haircut-basic'] },
    { clientIdx: 9, petIdx: 14, groomerIdx: 2, date: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000), time: '15:00', duration: 60, status: 'COMPLETED', serviceIds: ['svc-bath-deluxe', 'svc-nail-trim'] },
    { clientIdx: 11, petIdx: 17, groomerIdx: 0, date: new Date(today.getTime() - 42 * 24 * 60 * 60 * 1000), time: '11:30', duration: 75, status: 'COMPLETED', serviceIds: ['svc-haircut-basic'] },
    { clientIdx: 13, petIdx: 20, groomerIdx: 1, date: new Date(today.getTime() - 49 * 24 * 60 * 60 * 1000), time: '13:00', duration: 70, status: 'COMPLETED', serviceIds: ['svc-haircut-basic'] },
    { clientIdx: 19, petIdx: 29, groomerIdx: 2, date: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000), time: '10:00', duration: 90, status: 'COMPLETED', serviceIds: ['svc-haircut-full', 'svc-ear-clean'] },
  ]

  const serviceMap = new Map(services.map(s => [s.id, s]))

  const appointments = await Promise.all(
    appointmentData.map(async (data) => {
      const svcData = data.serviceIds.map(id => {
        const svc = serviceMap.get(id)!
        return { serviceId: id, price: svc.basePrice, duration: svc.baseDuration }
      })

      return prisma.appointment.create({
        data: {
          clientId: clients[data.clientIdx].id,
          petId: pets[data.petIdx].id,
          groomerId: groomers[data.groomerIdx].id,
          scheduledDate: data.date,
          scheduledTime: data.time,
          duration: data.duration,
          status: data.status as any,
          services: { create: svcData },
        },
      })
    })
  )
  console.log('Created appointments:', appointments.length)

  // ==========================================
  // GROOMING SESSIONS (15+)
  // ==========================================
  const completedAppts = appointments.filter((_, i) => appointmentData[i].status === 'COMPLETED')

  const groomingSessions = await Promise.all(
    completedAppts.slice(0, 15).map((appt, i) =>
      prisma.groomingSession.create({
        data: {
          appointmentId: appt.id,
          groomerId: appt.groomerId!,
          petId: appt.petId,
          checkInTime: new Date(appt.scheduledDate.getTime() + parseInt(appt.scheduledTime.split(':')[0]) * 60 * 60 * 1000),
          checkOutTime: new Date(appt.scheduledDate.getTime() + parseInt(appt.scheduledTime.split(':')[0]) * 60 * 60 * 1000 + appt.duration * 60 * 1000),
          status: 'COMPLETED',
          conditionNotes: ['Coat: Good, Skin: Healthy', 'Coat: Excellent, Skin: Dry', 'Coat: Fair, Skin: Normal', 'Coat: Matted, Skin: Slight irritation'][i % 4],
          behaviorNotes: ['Calm', 'Cooperative', 'Nervous', 'Playful', 'Anxious'][i % 5],
          servicesNotes: JSON.stringify(['Premium Shampoo', 'Conditioner', 'Detangler'].slice(0, (i % 3) + 1)),
          recommendations: ['Great session!', 'Pet was very cooperative', 'Some matting removed', 'Full groom completed successfully', 'Required extra attention on ears'][i % 5],
        },
      })
    )
  )
  console.log('Created grooming sessions:', groomingSessions.length)

  // ==========================================
  // TRANSACTIONS (15+)
  // ==========================================
  const transactions = await Promise.all(
    completedAppts.slice(0, 15).map(async (appt, i) => {
      const apptWithServices = await prisma.appointment.findUnique({
        where: { id: appt.id },
        include: { services: true }
      })

      const subtotal = apptWithServices!.services.reduce((sum, s) => sum + s.price, 0)
      const tax = subtotal * 0.08
      const total = subtotal + tax

      return prisma.transaction.create({
        data: {
          clientId: appt.clientId,
          staffId: groomers[i % 3].id,
          subtotal,
          tax,
          discount: i % 3 === 0 ? 10 : 0,
          total: i % 3 === 0 ? total - 10 : total,
          paymentMethod: ['CREDIT_CARD', 'DEBIT_CARD', 'CASH'][i % 3] as any,
          paymentStatus: 'COMPLETED',
          items: {
            create: apptWithServices!.services.map(s => ({
              itemType: 'SERVICE' as const,
              serviceId: s.serviceId,
              quantity: 1,
              unitPrice: s.price,
              total: s.price,
            }))
          },
        },
      })
    })
  )
  console.log('Created transactions:', transactions.length)

  // ==========================================
  // HEALTH ALERTS (15+)
  // ==========================================
  const healthAlerts = await Promise.all([
    prisma.healthAlert.create({ data: { petId: pets[0].id, alertType: 'SKIN_ISSUE', severity: 'LOW', title: 'Dry skin', description: 'Slight dry skin on back. Recommendation: Use moisturizing shampoo', isResolved: true } }),
    prisma.healthAlert.create({ data: { petId: pets[2].id, alertType: 'OTHER', severity: 'MEDIUM', title: 'Ear redness', description: 'Redness in left ear. Recommendation: Recommend vet check for ear infection', isResolved: false } }),
    prisma.healthAlert.create({ data: { petId: pets[4].id, alertType: 'OTHER', severity: 'HIGH', title: 'Fleas found', description: 'Found fleas during grooming. Flea treatment administered, recommend home treatment', isResolved: true } }),
    prisma.healthAlert.create({ data: { petId: pets[7].id, alertType: 'OTHER', severity: 'LOW', title: 'Overgrown nails', description: 'Overgrown nails causing discomfort. More frequent nail trims recommended', isResolved: true } }),
    prisma.healthAlert.create({ data: { petId: pets[9].id, alertType: 'OTHER', severity: 'MEDIUM', title: 'Dental issues', description: 'Bad breath and tartar buildup. Suggest professional dental cleaning', isResolved: false } }),
    prisma.healthAlert.create({ data: { petId: pets[11].id, alertType: 'SKIN_ISSUE', severity: 'MEDIUM', title: 'Hot spot', description: 'Hot spot on hindquarters. Keep area clean and dry, vet visit if persists', isResolved: false } }),
    prisma.healthAlert.create({ data: { petId: pets[13].id, alertType: 'INJURY', severity: 'LOW', title: 'Minor scratch', description: 'Small scratch on leg. Cleaned and monitored, healing well', isResolved: true } }),
    prisma.healthAlert.create({ data: { petId: pets[5].id, alertType: 'OTHER', severity: 'LOW', title: 'Tear staining', description: 'Tear staining around eyes. Daily gentle cleaning recommended', isResolved: true } }),
    prisma.healthAlert.create({ data: { petId: pets[8].id, alertType: 'HEALTH_CONDITION', severity: 'MEDIUM', title: 'Overweight', description: 'Pet appears overweight. Discuss diet with vet', isResolved: false } }),
    prisma.healthAlert.create({ data: { petId: pets[10].id, alertType: 'SKIN_ISSUE', severity: 'LOW', title: 'Dandruff', description: 'Minor dandruff. Omega supplements may help', isResolved: true } }),
    prisma.healthAlert.create({ data: { petId: pets[14].id, alertType: 'HEALTH_CONDITION', severity: 'HIGH', title: 'Lump found', description: 'Small lump found on shoulder. Urgent vet examination recommended', isResolved: false } }),
    prisma.healthAlert.create({ data: { petId: pets[17].id, alertType: 'OTHER', severity: 'LOW', title: 'Ear wax', description: 'Minor wax buildup. Regular ear cleaning', isResolved: true } }),
    prisma.healthAlert.create({ data: { petId: pets[19].id, alertType: 'OTHER', severity: 'LOW', title: 'Tartar buildup', description: 'Mild tartar on back teeth. Regular teeth brushing', isResolved: true } }),
    prisma.healthAlert.create({ data: { petId: pets[20].id, alertType: 'ALLERGY', severity: 'MEDIUM', title: 'Allergic reaction', description: 'Allergic reaction - red patches. Hypoallergenic shampoo, vet if worsens', isResolved: false } }),
    prisma.healthAlert.create({ data: { petId: pets[23].id, alertType: 'INJURY', severity: 'MEDIUM', title: 'Torn nail', description: 'Torn nail on front paw. Treated and bandaged, monitor for infection', isResolved: true } }),
  ])
  console.log('Created health alerts:', healthAlerts.length)

  // ==========================================
  // INCIDENTS (15+)
  // ==========================================
  const incidents = await Promise.all([
    prisma.incident.create({ data: { reportedBy: groomers[0].id, incidentType: 'AGGRESSION', severity: 'LOW', title: 'Minor nip during nail trim', description: 'Minor nip during nail trim, no skin broken', actionsTaken: 'Stopped procedure, gave pet break, completed with muzzle' } }),
    prisma.incident.create({ data: { reportedBy: groomers[1].id, incidentType: 'STAFF_INJURY', severity: 'LOW', title: 'Cat scratch during bath', description: 'Cat scratched groomer during bath', actionsTaken: 'First aid applied, groomer okay' } }),
    prisma.incident.create({ data: { reportedBy: groomers[2].id, incidentType: 'PET_INJURY', severity: 'MEDIUM', title: 'Dog slipped on wet floor', description: 'Dog slipped on wet floor', actionsTaken: 'Checked for injury, pet is fine' } }),
    prisma.incident.create({ data: { reportedBy: groomers[0].id, incidentType: 'EQUIPMENT_FAILURE', severity: 'LOW', title: 'Clipper blade overheated', description: 'Clipper blade got too warm', actionsTaken: 'Stopped immediately, switched blades' } }),
    prisma.incident.create({ data: { reportedBy: groomers[1].id, incidentType: 'ESCAPE_ATTEMPT', severity: 'MEDIUM', title: 'Dog jumped off table', description: 'Dog jumped off table', actionsTaken: 'Caught immediately, no injury' } }),
    prisma.incident.create({ data: { reportedBy: groomers[2].id, incidentType: 'OTHER', severity: 'HIGH', title: 'Pet anxiety attack', description: 'Pet had anxiety attack during grooming', actionsTaken: 'Stopped session, contacted owner, pet calmed down' } }),
    prisma.incident.create({ data: { reportedBy: groomers[0].id, incidentType: 'AGGRESSION', severity: 'MEDIUM', title: 'Dog bit during ear cleaning', description: 'Dog bit during ear cleaning', actionsTaken: 'First aid, session ended early' } }),
    prisma.incident.create({ data: { reportedBy: groomers[1].id, incidentType: 'STAFF_INJURY', severity: 'LOW', title: 'Cat scratched arm', description: 'Cat scratched arm during brush out', actionsTaken: 'First aid applied' } }),
    prisma.incident.create({ data: { reportedBy: groomers[2].id, incidentType: 'OTHER', severity: 'LOW', title: 'Products knocked over', description: 'Dog knocked over product bottles', actionsTaken: 'Cleaned up spill' } }),
    prisma.incident.create({ data: { reportedBy: groomers[0].id, incidentType: 'ESCAPE_ATTEMPT', severity: 'LOW', title: 'Dog escaped collar', description: 'Dog wiggled out of collar', actionsTaken: 'Recaptured immediately' } }),
    prisma.incident.create({ data: { reportedBy: groomers[1].id, incidentType: 'EQUIPMENT_FAILURE', severity: 'LOW', title: 'Dryer malfunction', description: 'Dryer temperature fluctuated', actionsTaken: 'Switched to backup dryer' } }),
    prisma.incident.create({ data: { reportedBy: groomers[2].id, incidentType: 'AGGRESSION', severity: 'LOW', title: 'Playful nip', description: 'Playful nip, no injury', actionsTaken: 'Redirected behavior with treats' } }),
    prisma.incident.create({ data: { reportedBy: groomers[0].id, incidentType: 'ALLERGIC_REACTION', severity: 'MEDIUM', title: 'Cat vomited', description: 'Cat vomited during grooming', actionsTaken: 'Stopped session, monitored pet, contacted owner' } }),
    prisma.incident.create({ data: { reportedBy: groomers[1].id, incidentType: 'PET_INJURY', severity: 'LOW', title: 'Pet slipped entering tub', description: 'Pet slipped entering tub', actionsTaken: 'Assisted pet, no injury' } }),
    prisma.incident.create({ data: { reportedBy: groomers[2].id, incidentType: 'OTHER', severity: 'LOW', title: 'Nervous accident', description: 'Pet urinated on table from nerves', actionsTaken: 'Cleaned and sanitized' } }),
  ])
  console.log('Created incidents:', incidents.length)

  // ==========================================
  // SERVICE PACKAGES (5+)
  // ==========================================
  const packages = await Promise.all([
    prisma.servicePackage.create({
      data: {
        name: 'Pamper Package',
        description: 'Complete spa day for your pet',
        price: 120,
        services: {
          create: [
            { serviceId: 'svc-bath-deluxe' },
            { serviceId: 'svc-haircut-full' },
            { serviceId: 'svc-nail-grind' },
            { serviceId: 'svc-teeth-brush' },
          ]
        }
      }
    }),
    prisma.servicePackage.create({
      data: {
        name: 'Quick Refresh',
        description: 'Basic cleanup between full grooms',
        price: 45,
        services: {
          create: [
            { serviceId: 'svc-bath-basic' },
            { serviceId: 'svc-nail-trim' },
          ]
        }
      }
    }),
    prisma.servicePackage.create({
      data: {
        name: 'Shedding Solution',
        description: 'Combat excessive shedding',
        price: 85,
        services: {
          create: [
            { serviceId: 'svc-bath-deluxe' },
            { serviceId: 'svc-deshed' },
          ]
        }
      }
    }),
    prisma.servicePackage.create({
      data: {
        name: 'Senior Pet Care',
        description: 'Gentle grooming for older pets',
        price: 75,
        services: {
          create: [
            { serviceId: 'svc-bath-oatmeal' },
            { serviceId: 'svc-nail-grind' },
            { serviceId: 'svc-ear-clean' },
          ]
        }
      }
    }),
    prisma.servicePackage.create({
      data: {
        name: 'Puppy First Visit',
        description: 'Introduction to grooming for puppies',
        price: 55,
        services: {
          create: [
            { serviceId: 'svc-haircut-puppy' },
            { serviceId: 'svc-nail-trim' },
          ]
        }
      }
    }),
  ])
  console.log('Created service packages:', packages.length)

  // ==========================================
  // EMERGENCY CONTACTS (15+)
  // ==========================================
  const emergencyContacts = await Promise.all([
    prisma.emergencyContact.create({ data: { name: 'Jane Smith', relationship: 'Spouse', phone: '(555) 111-9001', email: 'jane.smith@email.com' } }),
    prisma.emergencyContact.create({ data: { name: 'Tom Johnson', relationship: 'Husband', phone: '(555) 111-9002', email: 'tom.johnson@email.com' } }),
    prisma.emergencyContact.create({ data: { name: 'Sarah Williams', relationship: 'Sister', phone: '(555) 111-9003' } }),
    prisma.emergencyContact.create({ data: { name: 'Mark Brown', relationship: 'Brother', phone: '(555) 111-9004' } }),
    prisma.emergencyContact.create({ data: { name: 'Karen Jones', relationship: 'Wife', phone: '(555) 111-9005', email: 'karen.jones@email.com' } }),
    prisma.emergencyContact.create({ data: { name: 'Luis Garcia', relationship: 'Husband', phone: '(555) 111-9006' } }),
    prisma.emergencyContact.create({ data: { name: 'Amanda Miller', relationship: 'Friend', phone: '(555) 111-9007' } }),
    prisma.emergencyContact.create({ data: { name: 'Robert Davis', relationship: 'Son', phone: '(555) 111-9008', email: 'robert.d@email.com' } }),
    prisma.emergencyContact.create({ data: { name: 'Maria Rodriguez', relationship: 'Wife', phone: '(555) 111-9009' } }),
    prisma.emergencyContact.create({ data: { name: 'James Martinez', relationship: 'Husband', phone: '(555) 111-9010' } }),
    prisma.emergencyContact.create({ data: { name: 'Linda Hernandez', relationship: 'Mother', phone: '(555) 111-9011' } }),
    prisma.emergencyContact.create({ data: { name: 'David Lopez', relationship: 'Brother', phone: '(555) 111-9012' } }),
    prisma.emergencyContact.create({ data: { name: 'Susan Gonzalez', relationship: 'Sister', phone: '(555) 111-9013' } }),
    prisma.emergencyContact.create({ data: { name: 'Michael Wilson', relationship: 'Husband', phone: '(555) 111-9014', email: 'm.wilson@email.com' } }),
    prisma.emergencyContact.create({ data: { name: 'Jennifer Anderson', relationship: 'Wife', phone: '(555) 111-9015' } }),
  ])
  console.log('Created emergency contacts:', emergencyContacts.length)

  // ==========================================
  // GIFT CARDS (10+)
  // ==========================================
  const giftCards = await Promise.all([
    prisma.giftCard.upsert({ where: { code: 'GIFT-001-ABC' }, update: {}, create: { code: 'GIFT-001-ABC', initialBalance: 50, currentBalance: 50, clientId: clients[0].id, expiresAt: new Date('2025-12-31') } }),
    prisma.giftCard.upsert({ where: { code: 'GIFT-002-DEF' }, update: {}, create: { code: 'GIFT-002-DEF', initialBalance: 100, currentBalance: 75, clientId: clients[1].id, expiresAt: new Date('2025-12-31') } }),
    prisma.giftCard.upsert({ where: { code: 'GIFT-003-GHI' }, update: {}, create: { code: 'GIFT-003-GHI', initialBalance: 75, currentBalance: 75, clientId: clients[2].id, expiresAt: new Date('2025-12-31') } }),
    prisma.giftCard.upsert({ where: { code: 'GIFT-004-JKL' }, update: {}, create: { code: 'GIFT-004-JKL', initialBalance: 25, currentBalance: 0, clientId: clients[3].id, isActive: false, expiresAt: new Date('2025-06-30') } }),
    prisma.giftCard.upsert({ where: { code: 'GIFT-005-MNO' }, update: {}, create: { code: 'GIFT-005-MNO', initialBalance: 150, currentBalance: 150, clientId: clients[5].id, expiresAt: new Date('2025-12-31') } }),
    prisma.giftCard.upsert({ where: { code: 'GIFT-006-PQR' }, update: {}, create: { code: 'GIFT-006-PQR', initialBalance: 50, currentBalance: 30, clientId: clients[6].id, expiresAt: new Date('2025-12-31') } }),
    prisma.giftCard.upsert({ where: { code: 'GIFT-007-STU' }, update: {}, create: { code: 'GIFT-007-STU', initialBalance: 100, currentBalance: 100, clientId: clients[7].id, expiresAt: new Date('2025-12-31') } }),
    prisma.giftCard.upsert({ where: { code: 'GIFT-008-VWX' }, update: {}, create: { code: 'GIFT-008-VWX', initialBalance: 200, currentBalance: 120, clientId: clients[8].id, expiresAt: new Date('2025-12-31') } }),
    prisma.giftCard.upsert({ where: { code: 'GIFT-009-YZA' }, update: {}, create: { code: 'GIFT-009-YZA', initialBalance: 75, currentBalance: 75, clientId: clients[9].id, expiresAt: new Date('2025-12-31') } }),
    prisma.giftCard.upsert({ where: { code: 'GIFT-010-BCD' }, update: {}, create: { code: 'GIFT-010-BCD', initialBalance: 50, currentBalance: 50, clientId: clients[10].id, expiresAt: new Date('2025-12-31') } }),
  ])
  console.log('Created gift cards:', giftCards.length)

  // ==========================================
  // PET PHOTOS - All pets get photos with Unsplash images
  // ==========================================
  // Dog image URLs from Unsplash
  const dogImages = [
    { before: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=400&fit=crop', after: 'https://images.unsplash.com/photo-1633722715463-d30f4f325e24?w=400&h=400&fit=crop' },
    { before: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop', after: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400&h=400&fit=crop' },
    { before: 'https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?w=400&h=400&fit=crop', after: 'https://images.unsplash.com/photo-1568572933382-74d440642117?w=400&h=400&fit=crop' },
    { before: 'https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?w=400&h=400&fit=crop', after: 'https://images.unsplash.com/photo-1477884213360-7e9d7dcc1e48?w=400&h=400&fit=crop' },
    { before: 'https://images.unsplash.com/photo-1587402092301-725e37c70fd8?w=400&h=400&fit=crop', after: 'https://images.unsplash.com/photo-1591769225440-811ad7d6eab3?w=400&h=400&fit=crop' },
    { before: 'https://images.unsplash.com/photo-1503256207526-0d5d80fa2f47?w=400&h=400&fit=crop', after: 'https://images.unsplash.com/photo-1546238232-20216dec9f72?w=400&h=400&fit=crop' },
    { before: 'https://images.unsplash.com/photo-1504595403659-9088ce801e29?w=400&h=400&fit=crop', after: 'https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?w=400&h=400&fit=crop' },
    { before: 'https://images.unsplash.com/photo-1560807707-8cc77767d783?w=400&h=400&fit=crop', after: 'https://images.unsplash.com/photo-1596492784531-6e6eb5ea9993?w=400&h=400&fit=crop' },
    { before: 'https://images.unsplash.com/photo-1534361960057-19889db9621e?w=400&h=400&fit=crop', after: 'https://images.unsplash.com/photo-1601979031925-424e53b6caaa?w=400&h=400&fit=crop' },
    { before: 'https://images.unsplash.com/photo-1583512603805-3cc6b41f3edb?w=400&h=400&fit=crop', after: 'https://images.unsplash.com/photo-1591946614720-90a587da4a36?w=400&h=400&fit=crop' },
    { before: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=400&h=400&fit=crop', after: 'https://images.unsplash.com/photo-1587402092301-725e37c70fd8?w=400&h=400&fit=crop' },
    { before: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&h=400&fit=crop', after: 'https://images.unsplash.com/photo-1596492784531-6e6eb5ea9993?w=400&h=400&fit=crop' },
    { before: 'https://images.unsplash.com/photo-1561037404-61cd46aa615b?w=400&h=400&fit=crop', after: 'https://images.unsplash.com/photo-1544568100-847a948585b9?w=400&h=400&fit=crop' },
    { before: 'https://images.unsplash.com/photo-1558788353-f76d92427f16?w=400&h=400&fit=crop', after: 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=400&h=400&fit=crop' },
    { before: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&h=400&fit=crop', after: 'https://images.unsplash.com/photo-1588943211346-0908a1fb0b01?w=400&h=400&fit=crop' },
  ]

  // Cat image URLs from Unsplash
  const catImages = [
    { before: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=400&fit=crop', after: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=400&h=400&fit=crop' },
    { before: 'https://images.unsplash.com/photo-1495360010541-f48722b34f7d?w=400&h=400&fit=crop', after: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=400&h=400&fit=crop' },
    { before: 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=400&h=400&fit=crop', after: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400&h=400&fit=crop' },
    { before: 'https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?w=400&h=400&fit=crop', after: 'https://images.unsplash.com/photo-1543852786-1cf6624b9987?w=400&h=400&fit=crop' },
    { before: 'https://images.unsplash.com/photo-1511044568932-338cba0ad803?w=400&h=400&fit=crop', after: 'https://images.unsplash.com/photo-1569591159212-b02ea8a9f239?w=400&h=400&fit=crop' },
    { before: 'https://images.unsplash.com/photo-1529778873920-4da4926a72c2?w=400&h=400&fit=crop', after: 'https://images.unsplash.com/photo-1571566882372-1598d88abd90?w=400&h=400&fit=crop' },
    { before: 'https://images.unsplash.com/photo-1478098711619-5ab0b478d6e6?w=400&h=400&fit=crop', after: 'https://images.unsplash.com/photo-1561948955-570b270e7c36?w=400&h=400&fit=crop' },
    { before: 'https://images.unsplash.com/photo-1494256997604-768d1f608cac?w=400&h=400&fit=crop', after: 'https://images.unsplash.com/photo-1415369629372-26f2fe60c467?w=400&h=400&fit=crop' },
  ]

  // Create photos for all pets - each pet gets their own session if they have one
  let dogIndex = 0
  let catIndex = 0
  const petPhotoData: { petId: string; url: string; caption: string; isBefore: boolean; isAfter: boolean; sessionId: string | null }[] = []

  for (let i = 0; i < pets.length; i++) {
    const pet = pets[i]
    const petInfo = petData[i]
    // Find this pet's grooming session (if any) to link photos properly
    const petSession = groomingSessions.find(s => s.petId === pet.id)
    const sessionId = petSession?.id || null  // Only use actual session IDs (foreign key constraint)

    if (petInfo.species === 'DOG') {
      const images = dogImages[dogIndex % dogImages.length]
      petPhotoData.push(
        { petId: pet.id, url: images.before, caption: `${pet.name} before grooming`, isBefore: true, isAfter: false, sessionId },
        { petId: pet.id, url: images.after, caption: `${pet.name} after grooming - looking great!`, isBefore: false, isAfter: true, sessionId }
      )
      dogIndex++
    } else {
      const images = catImages[catIndex % catImages.length]
      petPhotoData.push(
        { petId: pet.id, url: images.before, caption: `${pet.name} before grooming`, isBefore: true, isAfter: false, sessionId },
        { petId: pet.id, url: images.after, caption: `${pet.name} after grooming - beautiful!`, isBefore: false, isAfter: true, sessionId }
      )
      catIndex++
    }
  }

  const petPhotos = await Promise.all(
    petPhotoData.map(data => prisma.petPhoto.create({ data }))
  )
  console.log('Created pet photos:', petPhotos.length)

  // ==========================================
  // REMINDER HISTORY
  // ==========================================
  const reminderTypes = ['OVERDUE', 'DUE', 'UPCOMING', 'NEW_CLIENT']
  const reminderMessages = [
    "Hi! It's time to schedule {petName}'s next grooming appointment. Their coat is looking a bit overdue for some TLC!",
    "Just a friendly reminder that {petName} is due for grooming. Book now to keep them looking their best!",
    "{petName}'s grooming appointment is coming up soon. We look forward to seeing you both!",
    "Welcome! We noticed {petName} hasn't had a grooming session with us yet. Book their first appointment today!",
    "Hi there! {petName}'s regular grooming schedule suggests it's time for a visit. Let's keep that coat healthy!",
  ]

  const reminderHistoryData = []
  for (let i = 0; i < 15; i++) {
    const pet = pets[i % pets.length]
    const client = clients[i % clients.length]
    const daysAgo = Math.floor(Math.random() * 14) // Random day in last 2 weeks
    const messageTemplate = reminderMessages[i % reminderMessages.length]
    const message = messageTemplate.replace('{petName}', pet.name)

    reminderHistoryData.push({
      petId: pet.id,
      clientId: client.id,
      type: reminderTypes[i % reminderTypes.length],
      message,
      sentVia: i % 3 === 0 ? 'SMS' : 'EMAIL',
      sentAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
    })
  }

  const reminderHistory = await Promise.all(
    reminderHistoryData.map(data => prisma.reminderHistory.create({ data }))
  )
  console.log('Created reminder history:', reminderHistory.length)

  // ==========================================
  // BUSINESS SETTINGS
  // ==========================================
  await prisma.businessSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      businessName: 'PetGroom Pro',
      address: '123 Main Street',
      phone: '(555) 123-4567',
      email: 'info@petgroompro.com',
      website: 'www.petgroompro.com',
      timezone: 'America/New_York',
      currency: 'USD',
      taxRate: 8.0,
      operatingHours: JSON.stringify({
        monday: { open: '08:00', close: '18:00' },
        tuesday: { open: '08:00', close: '18:00' },
        wednesday: { open: '08:00', close: '18:00' },
        thursday: { open: '08:00', close: '18:00' },
        friday: { open: '08:00', close: '18:00' },
        saturday: { open: '09:00', close: '17:00' },
        sunday: { open: '10:00', close: '16:00' },
      }),
      bookingLeadTime: 24,
      maxAdvanceBooking: 30,
      slotDuration: 15,
      loyaltyPointsPerDollar: 1,
      loyaltyPointsValue: 0.01,
    },
  })
  console.log('Created business settings')

  console.log('')
  console.log('==========================================')
  console.log('  Seed completed successfully!')
  console.log('==========================================')
  console.log('')
  console.log('Summary:')
  console.log(`  - Users: ${users.length + 1}`)
  console.log(`  - Breeds: ${allBreeds.length}`)
  console.log(`  - Services: ${services.length}`)
  console.log(`  - Products: ${products.length}`)
  console.log(`  - Clients: ${clients.length}`)
  console.log(`  - Pets: ${pets.length}`)
  console.log(`  - Vaccinations: ${vaccinations.length}`)
  console.log(`  - Behavioral Notes: ${behavioralNotes.length}`)
  console.log(`  - Appointments: ${appointments.length}`)
  console.log(`  - Grooming Sessions: ${groomingSessions.length}`)
  console.log(`  - Transactions: ${transactions.length}`)
  console.log(`  - Health Alerts: ${healthAlerts.length}`)
  console.log(`  - Incidents: ${incidents.length}`)
  console.log(`  - Service Packages: ${packages.length}`)
  console.log(`  - Emergency Contacts: ${emergencyContacts.length}`)
  console.log(`  - Gift Cards: ${giftCards.length}`)
  console.log(`  - Pet Photos: ${petPhotos.length}`)
  console.log('')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
