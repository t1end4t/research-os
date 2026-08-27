import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const workspacePath = await mkdtemp(path.join(os.tmpdir(), 'instrument-workspace-'));

async function write(relativePath: string, content: string) {
  const filePath = path.join(workspacePath, relativePath);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, content);
}

async function writeJson(relativePath: string, value: unknown) {
  await write(relativePath, `${JSON.stringify(value, null, 2)}\n`);
}

try {
  await Promise.all([
    mkdir(path.join(workspacePath, 'survey/open-problems'), { recursive: true }),
    mkdir(path.join(workspacePath, 'survey/candidate-questions'), { recursive: true }),
    write('questions/q1.md', 'Does it work?\n'),
    writeJson('questions/q1.json', { tags: ['test'] }),
    write('claims/c1.md', 'The loader reconstructs links.\n'),
    writeJson('claims/c1.json', { rejected: false }),
    write('evidence/e1.md', 'The fixture loads successfully.\n'),
    writeJson('evidence/e1.json', {
      kind: 'paper',
      paper_id: 'p1',
      citation: 'Example 2026',
    }),
    write('papers/p1.md', '# Example paper\n\n## Abstract\nA test paper.\n\n## Results\nThe fixture loads successfully.\n'),
    writeJson('papers/p1.json', {
      title: 'Example paper',
      authors: 'Example Author',
      year: 2026,
      citation: 'Example 2026',
      page_count: 1,
      sections: [{
        id: 'p1-results',
        paragraphs: [{ id: 'p1-paragraph-1', linked_claim_id: 'c1' }],
      }],
    }),
    writeJson('links/q1--c1.json', {
      kind: 'question-claim',
      parent_id: 'q1',
      child_id: 'c1',
      status: 'holds',
      user_reason: 'This claim directly answers the question.',
      check: {
        tag: 'CHECKED',
        tag_color: 'emerald',
        note: 'The relation is aligned.',
        items: [
          { label: 'Type', status: 'aligned', detail: '' },
          { label: 'Scope', status: 'aligned', detail: '' },
          { label: 'Target', status: 'aligned', detail: '' },
        ],
      },
    }),
    writeJson('links/c1--e1.json', {
      kind: 'claim-evidence',
      parent_id: 'c1',
      child_id: 'e1',
      status: 'missing',
      user_reason: null,
      check: null,
    }),
  ]);

  process.env.INSTRUMENT_WORKSPACE_DIR = workspacePath;
  const { loadWorkspace } = await import('./workspace');
  const workspace = await loadWorkspace();

  assert.equal(workspace.workspacePath, workspacePath);
  assert.equal(workspace.questions[0].text, 'Does it work?');
  assert.equal(workspace.questions[0].claims[0].id, 'c1');
  assert.equal(workspace.questions[0].claims[0].evidence[0].id, 'e1');
  assert.equal(workspace.evidenceToPaperMap.e1, 'p1');
  assert.equal(workspace.papers[0].sections[0].paragraphs[0].linkedClaimId, 'c1');

  await writeJson('links/c1--e1.json', {
    kind: 'claim-evidence',
    parent_id: 'c1',
    child_id: 'e1',
    status: 'holds',
    user_reason: null,
    check: null,
  });
  await assert.rejects(loadWorkspace, /link without a user reason/);
  console.log('workspace loader checks passed');
} finally {
  await rm(workspacePath, { recursive: true, force: true });
}
