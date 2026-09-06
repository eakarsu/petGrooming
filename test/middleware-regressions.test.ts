import test from 'node:test';import assert from 'node:assert/strict';import {NextRequest} from 'next/server';import {middleware} from '../src/middleware';
test('login receives matching fresh CSP and renderer nonce headers',async()=>{const a=await middleware(new NextRequest('http://localhost:3000/auth/login'));const b=await middleware(new NextRequest('http://localhost:3000/auth/login'));const policy=a.headers.get('content-security-policy')!;const nonce=a.headers.get('x-middleware-request-x-nonce')!;assert.ok(nonce);assert.ok(policy.includes(`'nonce-${nonce}'`));assert.notEqual(policy,b.headers.get('content-security-policy'));assert.equal(a.headers.get('x-middleware-request-content-security-policy'),policy);});
test('same-origin auth requests work without allowing foreign origins',async()=>{const good=await middleware(new NextRequest('http://localhost:3000/api/auth/csrf',{headers:{origin:'http://localhost:3000'}}));assert.equal(good.status,200);const bad=await middleware(new NextRequest('http://localhost:3000/api/auth/csrf',{headers:{origin:'https://untrusted.example'}}));assert.equal(bad.status,403);});
test('business health records are private while liveness stays public',async()=>{
 for(const path of ['/api/health/vaccinations','/api/health/alerts','/api/health/incidents']){
  const response=await middleware(new NextRequest('http://localhost:3000'+path));assert.equal(response.status,401)
 }
 assert.equal((await middleware(new NextRequest('http://localhost:3000/api/health/live'))).status,200)
})
test('local IP browser origin remains same-origin when Next normalizes its URL', async () => {
 const url='http://localhost:30940/api/auth/callback/credentials'
 const good=await middleware(new NextRequest(url,{method:'POST',headers:{host:'127.0.0.1:30940',origin:'http://127.0.0.1:30940'}}))
 assert.equal(good.status,200)
 const bad=await middleware(new NextRequest(url,{method:'POST',headers:{host:'127.0.0.1:30940',origin:'https://untrusted.example'}}))
 assert.equal(bad.status,403)
})
