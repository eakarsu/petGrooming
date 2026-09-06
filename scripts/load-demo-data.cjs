const fs = require('node:fs');
const path = require('node:path');
const { parseEnv } = require('node:util');
const { createHash, randomBytes } = require('node:crypto');
const assert = require('node:assert/strict');
const project = path.resolve(__dirname, '..');
const env = parseEnv(fs.readFileSync(path.join(project, '.env'), 'utf8'));
for (const [key, value] of Object.entries(env)) if (process.env[key] === undefined) process.env[key] = value;
const url = new URL(process.env.DATABASE_URL || '');
if (process.env.NODE_ENV === 'production' || !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) throw new Error('Demo loading requires a local, non-production database');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const db = new PrismaClient();
const demoNote = 'DEMO — fictional evaluation data. No real service, approval, payment, delivery or external submission occurred.';
const names = ['Avery','Jordan','Taylor','Casey','Riley','Morgan','Alex','Jamie','Cameron','Drew','Reese','Quinn','Skyler','Rowan','Emerson'];
const stamp = (days = 0, hour = 10) => { const d = new Date(); d.setDate(d.getDate()+days); d.setHours(hour,0,0,0); return d; };
const key = (kind, i) => `demo-${kind}-${String(i+1).padStart(3,'0')}`;
const touched = new Set();
async function insert(tx, model, id, data) {
  touched.add(model);
  const primary = model === 'technicianProfile' ? 'userId' : 'id';
  return tx[model].upsert({ where: { [primary]: data[primary] || id }, update: {}, create: { [primary]: id, ...data } });
}
async function snapshot() {
  const result = {};
  for (const model of [...touched].sort()) {
    const rows = await db[model].findMany({orderBy:{[model === 'technicianProfile' ? 'userId' : 'id']:'asc'}});
    result[model] = { count: rows.length, hash: createHash('sha256').update(JSON.stringify(rows)).digest('hex') };
  }
  return result;
}
async function main() {
  const email = process.env.PROVISION_ADMIN_EMAIL || process.env.ADMIN_EMAIL;
  const admin = email ? await db.user.findUnique({where:{email}}) : await db.user.findFirst({where:{role:'ADMIN'}});
  if (!admin) throw new Error('Create the configured administrator first');
  const accountPassword = await bcrypt.hash(randomBytes(32).toString('hex'), 12);
  const run = () => db.$transaction(async tx => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('local-demo-data-loader'))`;
    await seed(tx, admin, accountPassword);
  }, { timeout: 120000, maxWait: 10000 });
  const adminBefore = JSON.stringify(admin);
  await run();
  const first = await snapshot();
  for (const [model, value] of Object.entries(first)) assert.ok(value.count >= 15, `${model} must contain at least 15 sample records`);
  if (process.argv.includes('--verify')) { await run(); assert.deepEqual(await snapshot(), first, 'Reload must preserve every existing record and avoid duplicates'); }
  assert.equal(JSON.stringify(await db.user.findUnique({where:{id:admin.id}})), adminBefore, 'Administrator must remain unchanged');
  console.log(JSON.stringify({ counts: Object.fromEntries(Object.entries(first).map(([model,value])=>[model,value.count])), verifiedRepeat:process.argv.includes('--verify'), administratorPreserved:true },null,2));
}
async function seed(tx, admin, accountPassword) {
  const today = stamp();
  const calendarDay = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
  const dailyKey = (kind, i) => key(`${kind}-${calendarDay}`, i);
  const breeds=['Poodle','Labrador','Golden Retriever','Shih Tzu','Terrier','Spaniel','Beagle','Pug','Husky','Maltese','Collie','Schnauzer','Bichon','Dachshund','Mixed breed'];
  const petNames=['Luna','Max','Bella','Charlie','Daisy','Cooper','Lucy','Milo','Ruby','Teddy','Willow','Oscar','Poppy','Finn','Scout'];
  const serviceNames=['Bath and brush','Full groom','Coat trim','Nail trim','Ear care','Paw tidy','Puppy introduction','Senior comfort groom','Deshedding','Curly coat groom','Short coat bath','Long coat brush','Face tidy','Sanitary trim','Grooming consultation'];
  for(let i=0;i<15;i++) {
    const clientId=key('pet-client',i),petId=key('pet',i),breedId=key('pet-breed',i),groomerId=key('pet-groomer',i),serviceId=key('pet-service',i),productId=key('pet-product',i),appointmentId=dailyKey('pet-appointment',i);
    await insert(tx,'user',groomerId,{email:`demo.groomer.${i+1}@example.invalid`,password:accountPassword,name:`${names[i]} Demo`,role:'GROOMER',isActive:true});
    await insert(tx,'client',clientId,{firstName:names[i],lastName:'Demo',email:`demo.pet.owner.${i+1}@example.invalid`,phone:`202-555-01${String(i).padStart(2,'0')}`,address:`${100+i} Example Lane`,city:'Demo City',state:'GA',zipCode:'30301',notes:demoNote});
    await insert(tx,'breed',breedId,{name:`Demo ${breeds[i]}`,size:['SMALL','MEDIUM','LARGE'][i%3],typicalDuration:60});
    await insert(tx,'pet',petId,{clientId,name:`${petNames[i]} (Demo)`,breedId,gender:i%2?'MALE':'FEMALE',weight:5+i,dateOfBirth:stamp(-730-i*20),temperament:'Demo: handling preferences require owner confirmation',specialNeeds:demoNote});
    await insert(tx,'service',serviceId,{name:`Demo ${serviceNames[i]}`,description:demoNote,category:['BATH','HAIRCUT','STYLING','NAIL_CARE','EAR_CARE'][i%5],basePrice:30+i*5,baseDuration:60});
    await insert(tx,'breedService',key('pet-breed-service',i),{breedId,serviceId});
    await insert(tx,'appointment',appointmentId,{clientId,petId,groomerId,scheduledDate:today,scheduledTime:`${String(9+i%7).padStart(2,'0')}:00`,duration:60,status:'SCHEDULED',notes:demoNote});
    await insert(tx,'appointmentService',dailyKey('pet-appointment-service',i),{appointmentId,serviceId,price:30+i*5,duration:60});
    await insert(tx,'groomingPreference',key('pet-preference',i),{petId,additionalNotes:demoNote});
    await insert(tx,'groomingSession',dailyKey('pet-session',i),{petId,groomerId,appointmentId,status:'PENDING',conditionNotes:demoNote});
    await insert(tx,'product',productId,{name:`Demo grooming supply ${i+1}`,sku:`DEMO-PET-${i+1}`,category:['SHAMPOO','CONDITIONER','BRUSH','ACCESSORY','OTHER'][i%5],price:10+i,quantity:30,description:demoNote});
    const packageId=key('pet-package',i);
    await insert(tx,'servicePackage',packageId,{name:`Demo care package ${i+1}`,description:demoNote,price:30+i*5});
    await insert(tx,'packageService',key('pet-package-service',i),{packageId,serviceId});
    await insert(tx,'specialHandlingFee',key('pet-handling-fee',i),{name:`Demo handling review ${i+1}`,amount:5+i,description:demoNote});
    await insert(tx,'giftCard',key('pet-gift-card',i),{code:`DEMO-PET-GIFT-${i+1}`,initialBalance:25,currentBalance:25,clientId,isActive:false});
    await insert(tx,'healthAlert',key('pet-health-alert',i),{petId,alertType:'OTHER',severity:'LOW',title:'Demo: review owner-supplied care information',description:demoNote});
    const transactionId=key('pet-transaction',i);
    await insert(tx,'transaction',transactionId,{clientId,staffId:groomerId,subtotal:30+i*5,tax:0,total:30+i*5,paymentMethod:'CASH',paymentStatus:'PENDING',notes:demoNote+' No cash collected.'});
    await insert(tx,'transactionItem',key('pet-transaction-item',i),{transactionId,itemType:'SERVICE',serviceId,quantity:1,unitPrice:30+i*5,total:30+i*5});
    await insert(tx,'petPhoto',key('pet-photo',i),{petId,url:'/demo-pet.svg',caption:`${petNames[i]} demo illustration (not a photograph)`});
    const familyGroupId=key('pet-family',i);
    await insert(tx,'familyGroup',familyGroupId,{name:`${names[i]} Demo family`,primaryClientId:clientId});
    await insert(tx,'familyMember',key('pet-family-member',i),{familyGroupId,clientId,petId});
    const technicianId=groomerId;
    await insert(tx,'technicianProfile',technicianId,{userId:groomerId,baseLatitude:33.749,baseLongitude:-84.388,maxTravelKm:30});
    await insert(tx,'technicianSkill',key('pet-skill',i),{technicianId,serviceId});
    await insert(tx,'technicianAvailability',dailyKey('pet-availability',i),{technicianId,startsAt:stamp(0,8),endsAt:stamp(0,18),source:'DEMO'});
    await insert(tx,'technicianServiceArea',key('pet-area',i),{technicianId,postalPrefix:'303'});
    await insert(tx,'serviceInventoryRequirement',key('pet-stock-requirement',i),{serviceId,productId,quantity:1});
    const quoteId=key('pet-quote',i);
    await insert(tx,'groomingQuote',quoteId,{idempotencyKey:quoteId,createdById:admin.id,clientId,petId,proposedTechnicianId:technicianId,requestedStart:stamp(1,9+i%7),requestedEnd:stamp(1,10+i%7),addressLine:`DEMO: ${100+i} Example Lane`,postalCode:'30301',latitude:33.749,longitude:-84.388,subtotalCents:(30+i*5)*100,expiresAt:stamp(7),status:'DRAFT'});
    await insert(tx,'groomingQuoteLine',key('pet-quote-line',i),{quoteId,serviceId,serviceName:`Demo ${serviceNames[i]}`,unitPriceCents:(30+i*5)*100,durationMinutes:60});
    await insert(tx,'vaccinationRecord',key('pet-vaccination',i),{petId,vaccineName:`DEMO owner-reported vaccine ${i+1}`,dateAdministered:stamp(-365),expirationDate:stamp(i-7),veterinarian:`Dr. ${names[i]} Demo`,notes:demoNote+' Unverified sample; not proof of vaccination.',isVerified:false});
    await insert(tx,'behavioralNote',key('pet-behavior',i),{petId,category:['ANXIETY','FEAR','SENSITIVITY','HANDLING','OTHER'][i%5],severity:'LOW',description:`DEMO handling observation ${i+1}. ${demoNote}`,triggers:'Fictional intake example; confirm with the owner.',solutions:'Staff review required before use.'});
    await insert(tx,'incident',key('pet-incident',i),{reportedBy:admin.id,incidentType:'OTHER',severity:'LOW',title:`DEMO safety review exercise ${i+1}`,description:demoNote,location:'Demo training area',actionsTaken:'Training example only; no incident occurred.',followUpRequired:false});
    await insert(tx,'emergencyContact',key('pet-veterinarian',i),{name:`Dr. ${names[i]} Demo`,relationship:'Demo veterinary contact',phone:`202-555-01${String(50+i).padStart(2,'0')}`,email:`demo.vet.${i+1}@example.invalid`,isVeterinarian:true,vetClinicName:`Demo Veterinary Practice ${i+1}`,vetAddress:`${200+i} Example Lane, Demo City`,notes:demoNote+' Not a real emergency contact.'});
    await insert(tx,'medicalRecord',key('pet-medical-record',i),{petId,vetName:`Dr. ${names[i]} Demo`,recordDate:stamp(-i-1),diagnosis:`DEMO intake record ${i+1}; no diagnosis made`,symptoms:'Fictional owner observation for interface evaluation.',treatment:'No treatment prescribed or performed.',followUp:'Review the example with an authorized clinician before replacing with real information.',notes:demoNote});
    await insert(tx,'prescription',key('pet-prescription',i),{petId,vetName:`Dr. ${names[i]} Demo`,medication:`DEMO placeholder medication ${i+1} — do not administer`,dosage:'Not prescribed',frequency:'Not prescribed',duration:'Not prescribed',prescribedDate:stamp(-i-1),status:'CANCELLED',instructions:'Interface example only. This is not a prescription.',notes:demoNote});
    await insert(tx,'labResult',key('pet-lab-result',i),{petId,testName:`DEMO laboratory request ${i+1}`,testType:'DEMO — not ordered',testDate:stamp(-i-1),results:'No specimen collected and no laboratory result available.',status:'PENDING',orderedBy:`Dr. ${names[i]} Demo`,notes:demoNote});
    await insert(tx,'surgery',key('pet-surgery',i),{petId,surgeonName:`Dr. ${names[i]} Demo`,surgeryDate:stamp(i+1),surgeryType:`DEMO procedure planning example ${i+1}`,status:'CANCELLED',preOpNotes:'No procedure booked; evaluation example only.',notes:demoNote});
    await insert(tx,'preVisitIntake',key('pet-intake',i),{appointmentId,petId,clientPhone:`202-555-01${String(i).padStart(2,'0')}`,rawSymptoms:`DEMO grooming intake ${i+1}. ${demoNote}`,rawPhotos:[],flaggedForVet:false});
    await insert(tx,'stylePreview',key('pet-style-preview',i),{petId,styleName:`DEMO ${serviceNames[i]} preview request`,beforeImageUrl:'/demo-pet.svg',status:'PENDING'});
    await insert(tx,'bundleSuggestion',key('pet-bundle',i),{familyGroupId,recommendedServices:[{petId,services:[serviceId],price:30+i*5}],totalPrice:30+i*5,discountPct:0,reasoning:`Manual demo example, not generated by AI. ${demoNote}`});
    await insert(tx,'petKnowledge',key('pet-knowledge',i),{actorId:admin.id,title:`DEMO ${serviceNames[i]} guidance draft`,content:`Fictional draft ${i+1} for review. ${demoNote} Replace this text with reviewed business guidance before approving it.`});
  }
}

main().catch(error => { console.error(error.message); process.exitCode=1; }).finally(()=>db.$disconnect());
