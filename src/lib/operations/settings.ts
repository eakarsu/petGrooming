import { z } from 'zod'
import { money } from './core'
export const weekdays = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'] as const
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)
const hours = z.object(Object.fromEntries(weekdays.map(day => [day,z.object({open:time,close:time,closed:z.boolean()}).strict().refine(h=>h.closed || h.close>h.open,'Closing time must follow opening time')])) as unknown as Record<typeof weekdays[number], z.ZodType<{open:string;close:string;closed:boolean}>>)
export const defaultSettings = { id:'default', businessName:'PetGroom Pro', address:'',phone:'',email:'',website:'',timezone:'America/New_York',currency:'USD',taxRate:0,taxConfigured:false,bookingLeadTime:24,maxAdvanceBooking:30,slotDuration:15,loyaltyPointsPerDollar:1,loyaltyPointsValue:0.01,operatingHours:JSON.stringify(Object.fromEntries(weekdays.map(d=>[d,{open:'09:00',close:'17:00',closed:true}]))),updatedAt:null }
export const settingsSchema = z.object({
  businessName:z.string().trim().min(1).max(200),address:z.string().max(1000),phone:z.string().max(50),email:z.string().email().or(z.literal('')),website:z.string().url().or(z.literal('')),
  timezone:z.string().max(80).refine(zone=>{try{new Intl.DateTimeFormat('en',{timeZone:zone});return true}catch{return false}},'Use a valid IANA timezone'),
  currency:z.enum(['USD','CAD','EUR','GBP','AUD','NZD']),taxRate:z.number().min(0).max(100).multipleOf(0.01),taxConfigured:z.boolean(),
  bookingLeadTime:z.number().int().min(0).max(8760),maxAdvanceBooking:z.number().int().min(1).max(730),slotDuration:z.number().int().min(5).max(240),
  loyaltyPointsPerDollar:z.number().int().min(0).max(1000),loyaltyPointsValue:money.refine(n=>n<=100,'Value must not exceed 100'),
  operatingHours:z.string().max(5000).superRefine((value,ctx)=>{try{hours.parse(JSON.parse(value))}catch{ctx.addIssue({code:'custom',message:'Hours require seven days, valid HH:mm times and closing after opening'})}}),
  expectedUpdatedAt:z.string().datetime().nullable(),
}).strict()
