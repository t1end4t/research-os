import assert from 'node:assert/strict';
import { parseResearchItemDragData } from './researchItemDrag';

assert.deepEqual(
  parseResearchItemDragData('{"id":"c1","type":"CLAIM","label":"A claim"}'),
  { id: 'c1', type: 'CLAIM', label: 'A claim' }
);
assert.equal(parseResearchItemDragData('{"id":"c1","type":"EXPERIMENT","label":"No"}'), null);
assert.equal(parseResearchItemDragData('not json'), null);

console.log('research item drag checks passed');
