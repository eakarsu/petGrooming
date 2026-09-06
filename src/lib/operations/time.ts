export function dateInZone(value: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {timeZone, year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(value);
  const get=(type:string)=>parts.find(p=>p.type===type)!.value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}
export function zonedMidnight(day: string, timeZone: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || new Date(day).toISOString().slice(0,10)!==day) throw new Error('Invalid calendar date');
  const target=Date.parse(`${day}T00:00:00Z`); let value=target;
  const formatter=new Intl.DateTimeFormat('en-GB',{timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
  for(let i=0;i<5;i++) { const p=formatter.formatToParts(new Date(value)); const get=(k:string)=>p.find(x=>x.type===k)!.value; const local=Date.parse(`${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}:${get('second')}Z`); const delta=target-local;if(!delta)return new Date(value);value+=delta; }
  throw new Error('Local midnight does not exist in this timezone');
}
export function dayBounds(now: Date, timeZone: string) {
  const date=dateInZone(now,timeZone);const tomorrow=new Date(`${date}T12:00:00Z`);tomorrow.setUTCDate(tomorrow.getUTCDate()+1);
  return {date,start:zonedMidnight(date,timeZone),end:zonedMidnight(tomorrow.toISOString().slice(0,10),timeZone)};
}
export function localInstant(day:string,time:string,timeZone:string){
 if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(time))throw new Error('Invalid local time')
 zonedMidnight(day,timeZone)
 const target=Date.parse(`${day}T${time}:00Z`);let value=target
 const formatter=new Intl.DateTimeFormat('sv-SE',{timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'})
 const wall=(n:number)=>formatter.format(new Date(n)).replace(' ','T')
 for(let i=0;i<5;i++){const local=Date.parse(wall(value)+'Z');const delta=target-local;if(!delta){if(wall(value-3600000)===wall(value)||wall(value+3600000)===wall(value))throw new Error('This local time is ambiguous during a clock change');return new Date(value)}value+=delta}
 throw new Error('This local time does not exist during a clock change')
}
