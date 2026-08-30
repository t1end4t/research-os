import assert from 'node:assert/strict';
import { parseResearchItemDragData } from './researchItemDrag';

assert.deepEqual(
  parseResearchItemDragData('{"id":"c1","type":"CLAIM","label":"A claim"}'),
  { id: 'c1', type: 'CLAIM', label: 'A claim' }
);
assert.deepEqual(
  parseResearchItemDragData('{"id":"art-1","type":"EXPERIMENT","label":"Plot artifact"}'),
  { id: 'art-1', type: 'EXPERIMENT', label: 'Plot artifact' }
);
assert.deepEqual(
  parseResearchItemDragData('{"id":"op-1","type":"SURVEY","label":"Open problem note"}'),
  { id: 'op-1', type: 'SURVEY', label: 'Open problem note' }
);
assert.equal(parseResearchItemDragData('{"id":"c1","type":"INVALID_TYPE","label":"No"}'), null);
assert.equal(parseResearchItemDragData('not json'), null);

console.log('research item drag checks passed');
