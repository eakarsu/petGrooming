import test from 'node:test'
import assert from 'node:assert/strict'
import { examples, fillDraftExample } from '../src/lib/assistant-presets'

const pets = [{ id: 'record-one' }, { id: 'record-two' }]
const knowledge = [{ id: 'approved-one', isActive: true, approvedAt: '2026-10-10' }, { id: 'draft-two', isActive: true, approvedAt: null }]

test('every AI task has three distinct, complete, fill-only examples', () => {
  for (const task of Object.keys(examples)) {
    assert.equal(examples[task].length, 3)
    const presets = examples[task].map((_, index) => fillDraftExample(task, index, 'record-two', ['approved-one'], pets, knowledge))
    assert.equal(new Set(presets.map(preset => preset.instructions)).size, 3)
    for (const preset of presets) {
      assert.ok(preset.instructions.length >= 5 && preset.instructions.length <= 5000)
      assert.equal(preset.petId, 'record-two')
      assert.deepEqual(preset.knowledgeIds, ['approved-one'])
      assert.deepEqual(Object.keys(preset).sort(), ['instructions', 'knowledgeIds', 'petId'])
    }
  }
})

test('presets use available references and leave missing genuine prerequisites empty', () => {
  const fallback = fillDraftExample('GROOMING_PLAN', 0, 'stale', ['draft-two'], pets, knowledge)
  assert.equal(fallback.petId, 'record-one')
  assert.deepEqual(fallback.knowledgeIds, ['approved-one'])
  const missing = fillDraftExample('PHOTO_OBSERVATIONS', 1, '', [], [], [])
  assert.equal(missing.petId, '')
  assert.deepEqual(missing.knowledgeIds, [])
  assert.ok(!('photo' in missing) && !('consent' in missing) && !('sharingConfirmed' in missing))
})
