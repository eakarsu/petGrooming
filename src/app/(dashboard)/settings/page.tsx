'use client'
import { useEffect,useState } from 'react'
import { useSession } from 'next-auth/react'
import { useMutationFetch } from '@/hooks/use-mutation-fetch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
const days=['sunday','monday','tuesday','wednesday','thursday','friday','saturday']
export default function SettingsPage(){
 const {data:session}=useSession();const canEdit=['ADMIN','MANAGER'].includes(session?.user.role??'')
 const [form,setForm]=useState<Record<string,any>|null>(null),[error,setError]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false)
 const mutate=useMutationFetch()
 async function load(){setError('');try{const r=await fetch('/api/settings');const d=await r.json();if(!r.ok)throw Error(d.error);setForm(d)}catch(e){setError(String(e))}}
 useEffect(()=>{void load()},[])
 async function save(){if(!form)return;setBusy(true);setError('');setMessage('');try{
 const keys=['businessName','address','phone','email','website','timezone','currency','taxRate','taxConfigured','bookingLeadTime','maxAdvanceBooking','slotDuration','loyaltyPointsPerDollar','loyaltyPointsValue','operatingHours']
 const payload=Object.fromEntries(keys.map(k=>[k,form[k]??'']));payload.expectedUpdatedAt=form.updatedAt??null
 const r=await mutate('/api/settings',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});const d=await r.json();if(!r.ok)throw Error(d.error);setForm(d);setMessage('Settings saved')
 }catch(e){setError(String(e))}finally{setBusy(false)}}
 const field=(key:string,label:string,type='text')=><label key={key} className="block space-y-1"><span>{label}</span><Input disabled={!canEdit} type={type} step={type==='number'?'0.01':undefined} value={form?.[key]??''} onChange={e=>setForm({...form,[key]:type==='number'?Number(e.target.value):e.target.value})}/></label>
 let hours:Record<string,{open:string;close:string;closed:boolean}>={};try{hours=JSON.parse(form?.operatingHours||'{}')}catch{}
 return <div className="space-y-6 max-w-4xl"><h1 className="text-3xl font-bold">Business settings</h1>
 {error&&<p role="alert" className="text-red-700">{error} <button onClick={load}>Reload</button></p>}{message&&<p role="status">{message}</p>}
 {!form?<p>Loading settings…</p>:<form onSubmit={e=>{e.preventDefault();void save()}} className="space-y-6">
 <fieldset className="grid md:grid-cols-2 gap-4 border rounded p-5"><legend>Business</legend>{field('businessName','Business name')}{field('address','Address')}{field('phone','Phone')}{field('email','Email','email')}{field('website','Website (full https URL)')}{field('timezone','Business timezone')}{field('currency','Currency (USD, CAD, EUR, GBP, AUD or NZD)')}</fieldset>
 <fieldset className="grid md:grid-cols-2 gap-4 border rounded p-5"><legend>Tax and loyalty</legend>{field('taxRate','Configured tax rate (%)','number')}{field('loyaltyPointsPerDollar','Points per currency unit','number')}{field('loyaltyPointsValue','Value per point','number')}<label><input type="checkbox" disabled={!canEdit} checked={form.taxConfigured===true} onChange={e=>setForm({...form,taxConfigured:e.target.checked})}/> I have reviewed the tax rate for this business, including a zero rate if applicable.</label></fieldset>
 <fieldset className="grid md:grid-cols-3 gap-4 border rounded p-5"><legend>Booking</legend>{field('bookingLeadTime','Minimum notice (hours)','number')}{field('maxAdvanceBooking','Booking horizon (days)','number')}{field('slotDuration','Calendar interval (minutes)','number')}</fieldset>
 <fieldset className="space-y-3 border rounded p-5"><legend>Opening hours</legend>{days.map(day=>{const h=hours[day]??{open:'09:00',close:'17:00',closed:true};const update=(change:object)=>setForm({...form,operatingHours:JSON.stringify({...hours,[day]:{...h,...change}})});return <div key={day} className="flex flex-wrap gap-3 items-center"><span className="w-28 capitalize">{day}</span><label><input disabled={!canEdit} type="checkbox" checked={h.closed} onChange={e=>update({closed:e.target.checked})}/> Closed</label><label>Open <input disabled={!canEdit||h.closed} type="time" value={h.open} onChange={e=>update({open:e.target.value})}/></label><label>Close <input disabled={!canEdit||h.closed} type="time" value={h.close} onChange={e=>update({close:e.target.value})}/></label></div>})}</fieldset>
 <Button disabled={!canEdit||busy} type="submit">{busy?'Saving…':'Save settings'}</Button> <Button type="button" variant="outline" onClick={load}>Reload</Button>
 </form>}<Link className="underline" href="/operations">Provider connections and governed booking workflow</Link></div>
}
