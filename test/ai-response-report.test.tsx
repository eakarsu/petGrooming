import test from 'node:test'
import assert from 'node:assert/strict'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import AIResponseReport, { reportValue } from '../src/components/AIResponseReport'

test('returned and saved structured reports retain labeled fields and falsy values', () => {
  const output = {
    title: 'Coat care draft',
    content: { summary: 'Recorded facts', facts: { ready: false, visits: 0, note: '' }, services: [{ name: 'Bath', included: false, count: 0, comment: '' }] },
    citations: [{ sourceId: 'pet record', quote: 'Coat brushed' }],
    limitations: ['Confirm coat condition in person'],
    escalations: [],
  }
  assert.deepEqual(reportValue(output), output)
  for (const value of [output.content, output]) {
    const html = renderToStaticMarkup(<AIResponseReport value={value} title="Saved grooming draft" />)
    for (const expected of ['Summary', 'Facts', 'Ready', 'No', 'Visits', '0', 'Empty string', 'Bath']) assert.match(html, new RegExp(expected))
    assert.doesNotMatch(html, /<pre[^>]*>\s*\{/)
    if (value === output) for (const expected of ['Citations', 'Limitations', 'Escalations', 'Coat brushed']) assert.match(html, new RegExp(expected))
  }
})
