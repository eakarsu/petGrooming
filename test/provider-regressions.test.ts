import test from 'node:test'
import assert from 'node:assert/strict'
import {createHmac} from 'node:crypto'
import {verifyWebhookSignature,validateProviderOutput} from '../src/lib/workflow/provider'
test('webhook signatures reject trailing non-hex data',()=>{const now=Math.floor(Date.now()/1000),signature=createHmac('sha256','test').update(`${now}.body`).digest('hex');assert.equal(verifyWebhookSignature('test',now,'body',signature),true);assert.equal(verifyWebhookSignature('test',now,'body',signature+'zz'),false);})
test('provider success requires a receipt and structured output',()=>{for(const value of [null,{}, {receipt:'',output:{}},{receipt:'ok',output:null},{receipt:'ok',output:[]}])assert.throws(()=>validateProviderOutput(value));assert.deepEqual(validateProviderOutput({receipt:'verified-id',output:{bookingId:'123'}}),{receipt:'verified-id',output:{bookingId:'123'}})})
