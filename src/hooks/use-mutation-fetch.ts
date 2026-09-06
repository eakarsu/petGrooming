'use client'
import { useRef } from 'react'
export function useMutationFetch() {
  const keys=useRef(new Map<string,string>())
  return async (url:string, options:RequestInit={})=>{
    if(!options.method || options.method==='GET')return fetch(url,options)
    const signature=JSON.stringify([url,options.method,options.body])
    let key=keys.current.get(signature)
    if(!key){key=crypto.randomUUID();keys.current.set(signature,key)}
    const headers=new Headers(options.headers);headers.set('Idempotency-Key',key)
    const response=await fetch(url,{...options,headers})
    if(response.ok)keys.current.delete(signature)
    return response
  }
}
