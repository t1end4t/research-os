import assert from 'node:assert/strict';
import { canCreateClaim, canCreateEvidence, createClaim, createEvidence, splitTags } from './graphEdits';

assert.equal(canCreateClaim({ text: 'Claim', userReason: '   ' }), false);
assert.equal(canCreateEvidence({ kind: 'paper', title: 'Finding', userReason: '' }), false);
assert.deepEqual(splitTags('memory, tinyml, memory'), ['memory', 'tinyml']);

const claim = createClaim('c-test', { text: '  Claim  ', userReason: '  Because  ' });
assert.equal(claim.text, 'Claim');
assert.equal(claim.check.reasonText, 'Because');

const evidence = createEvidence('e-test', {
  kind: 'paper',
  title: '  Finding  ',
  userReason: '  Supports target  ',
  citation: '  Source  ',
});
assert.equal(evidence.title, 'Finding');
assert.equal(evidence.userReason, 'Supports target');
assert.equal(evidence.citation, 'Source');
