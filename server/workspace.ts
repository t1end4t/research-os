import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import type {
  CandidateQuestion,
  CheckItem,
  ClaimCheck,
  ClaimNode,
  EvidenceItem,
  LinkStatus,
  OpenProblemNote,
  PaperDoc,
  QuestionNode,
} from '../src/types';
import type { WorkspaceResponse } from '../src/workspaceApi';

interface SidecarDocument {
  id: string;
  filePath: string;
  body: string;
  metadata: Record<string, unknown>;
}

interface JsonDocument {
  id: string;
  filePath: string;
  data: Record<string, unknown>;
}

const workspacePath = path.resolve(
  process.env.INSTRUMENT_WORKSPACE_DIR || '/home/tiendat/second-brain',
);

function requiredString(data: Record<string, unknown>, key: string, filePath: string): string {
  const value = data[key];
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`Missing ${key} in ${filePath}`);
  }
  return value.trim();
}

function optionalString(data: Record<string, unknown>, key: string): string | undefined {
  const value = data[key];
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function requiredNumber(data: Record<string, unknown>, key: string, filePath: string): number {
  const value = data[key];
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`Missing ${key} in ${filePath}`);
  }
  return value;
}

function stringArray(data: Record<string, unknown>, key: string, filePath: string): string[] {
  const value = data[key];
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    throw new Error(`Invalid ${key} in ${filePath}`);
  }
  return value;
}

function objectValue(data: Record<string, unknown>, key: string, filePath: string): Record<string, unknown> {
  const value = data[key];
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`Invalid ${key} in ${filePath}`);
  }
  return value as Record<string, unknown>;
}

function objectArray(data: Record<string, unknown>, key: string, filePath: string): Record<string, unknown>[] {
  const value = data[key];
  if (!Array.isArray(value) || value.some((item) => !item || typeof item !== 'object' || Array.isArray(item))) {
    throw new Error(`Invalid ${key} in ${filePath}`);
  }
  return value as Record<string, unknown>[];
}

async function readJson(filePath: string): Promise<Record<string, unknown>> {
  let value: unknown;
  try {
    value = JSON.parse(await readFile(filePath, 'utf8'));
  } catch {
    throw new Error(`Invalid JSON: ${filePath}`);
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`Expected JSON object: ${filePath}`);
  }
  return value as Record<string, unknown>;
}

async function readSidecarDirectory(relativePath: string): Promise<SidecarDocument[]> {
  const directoryPath = path.join(workspacePath, relativePath);
  let entries;
  try {
    entries = await readdir(directoryPath, { withFileTypes: true });
  } catch {
    throw new Error(`Missing workspace folder: ${directoryPath}`);
  }

  const files = new Set<string>(
    entries.filter((entry) => entry.isFile()).map((entry) => entry.name),
  );
  const markdownFiles = [...files].filter((name) => name.endsWith('.md')).sort();
  for (const jsonFile of [...files].filter((name) => name.endsWith('.json'))) {
    if (!files.has(`${jsonFile.slice(0, -5)}.md`)) {
      throw new Error(`Missing Markdown pair for ${path.join(directoryPath, jsonFile)}`);
    }
  }

  return Promise.all(markdownFiles.map(async (name) => {
    const id = name.slice(0, -3);
    const filePath = path.join(directoryPath, name);
    const metadataPath = path.join(directoryPath, `${id}.json`);
    if (!files.has(`${id}.json`)) throw new Error(`Missing metadata: ${metadataPath}`);
    return {
      id,
      filePath,
      body: (await readFile(filePath, 'utf8')).trim(),
      metadata: await readJson(metadataPath),
    };
  }));
}

async function readJsonDirectory(relativePath: string): Promise<JsonDocument[]> {
  const directoryPath = path.join(workspacePath, relativePath);
  let entries;
  try {
    entries = await readdir(directoryPath, { withFileTypes: true });
  } catch {
    throw new Error(`Missing workspace folder: ${directoryPath}`);
  }
  const unexpected = entries.find((entry) => entry.isFile() && !entry.name.endsWith('.json'));
  if (unexpected) throw new Error(`Links must be JSON: ${path.join(directoryPath, unexpected.name)}`);
  return Promise.all(entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .sort((left, right) => left.name.localeCompare(right.name))
    .map(async (entry) => {
      const filePath = path.join(directoryPath, entry.name);
      return { id: entry.name.slice(0, -5), filePath, data: await readJson(filePath) };
    }));
}

function parseCheck(data: Record<string, unknown>, filePath: string, userReason: string): ClaimCheck {
  const check = objectValue(data, 'check', filePath);
  const tagColor = requiredString(check, 'tag_color', filePath);
  if (!['amber', 'red', 'emerald', 'stone'].includes(tagColor)) {
    throw new Error(`Invalid tag_color in ${filePath}`);
  }
  const items = objectArray(check, 'items', filePath).map((item) => {
    const label = requiredString(item, 'label', filePath);
    const status = requiredString(item, 'status', filePath);
    if (!['Type', 'Scope', 'Target'].includes(label)) throw new Error(`Invalid check label in ${filePath}`);
    if (!['aligned', 'partial', 'mismatch', 'missing', 'unverified'].includes(status)) {
      throw new Error(`Invalid check status in ${filePath}`);
    }
    return {
      label: label as CheckItem['label'],
      status: status as CheckItem['status'],
      detail: optionalString(item, 'detail') || '',
    };
  });
  return {
    tag: requiredString(check, 'tag', filePath),
    tagColor: tagColor as ClaimCheck['tagColor'],
    reasonText: userReason,
    explanation: optionalString(check, 'note') || '',
    checks: items,
  };
}

function markdownSections(body: string) {
  return body.split(/^## /m).slice(1).map((chunk) => {
    const lineEnd = chunk.indexOf('\n');
    return {
      heading: (lineEnd === -1 ? chunk : chunk.slice(0, lineEnd)).trim(),
      content: lineEnd === -1 ? '' : chunk.slice(lineEnd + 1).trim(),
    };
  });
}

function parsePaper(document: SidecarDocument): PaperDoc {
  const markdown = markdownSections(document.body);
  const abstract = markdown.find((section) => section.heading === 'Abstract')?.content || '';
  const visibleSections = markdown.filter((section) => section.heading !== 'Abstract');
  const sectionMetadata = objectArray(document.metadata, 'sections', document.filePath);
  if (visibleSections.length !== sectionMetadata.length) {
    throw new Error(`Paper section metadata mismatch in ${document.filePath}`);
  }

  const sections = visibleSections.map((section, sectionIndex) => {
    const metadata = sectionMetadata[sectionIndex];
    const paragraphMetadata = objectArray(metadata, 'paragraphs', document.filePath);
    const paragraphs = section.content.split(/\r?\n\s*\r?\n/).map((text) => text.trim()).filter(Boolean);
    if (paragraphs.length !== paragraphMetadata.length) {
      throw new Error(`Paper paragraph metadata mismatch in ${document.filePath}`);
    }
    return {
      id: requiredString(metadata, 'id', document.filePath),
      heading: section.heading,
      paragraphs: paragraphs.map((text, paragraphIndex) => ({
        id: requiredString(paragraphMetadata[paragraphIndex], 'id', document.filePath),
        text,
        linkedClaimId: optionalString(paragraphMetadata[paragraphIndex], 'linked_claim_id'),
      })),
    };
  });

  const paragraphs = sections.flatMap((section) => section.paragraphs);
  const initialMarks = paragraphs.flatMap((paragraph, index) =>
    paragraph.linkedClaimId
      ? [{
          id: `mark-${paragraph.id}`,
          paragraphId: paragraph.id,
          yPercent: Math.round(((index + 1) / (paragraphs.length + 1)) * 100),
          type: 'emerald' as const,
          label: 'Linked passage',
          snippet: paragraph.text.slice(0, 120),
          claimId: paragraph.linkedClaimId,
        }]
      : [],
  );

  return {
    id: document.id,
    title: requiredString(document.metadata, 'title', document.filePath),
    authors: requiredString(document.metadata, 'authors', document.filePath),
    year: requiredNumber(document.metadata, 'year', document.filePath),
    citation: requiredString(document.metadata, 'citation', document.filePath),
    pageCount: requiredNumber(document.metadata, 'page_count', document.filePath),
    abstract,
    sections,
    initialMarks,
  };
}

export async function loadWorkspace(): Promise<WorkspaceResponse> {
  const [questionFiles, claimFiles, evidenceFiles, paperFiles, linkFiles, openProblemFiles, candidateFiles] =
    await Promise.all([
      readSidecarDirectory('questions'),
      readSidecarDirectory('claims'),
      readSidecarDirectory('evidence'),
      readSidecarDirectory('papers'),
      readJsonDirectory('links'),
      readSidecarDirectory(path.join('survey', 'open-problems')),
      readSidecarDirectory(path.join('survey', 'candidate-questions')),
    ]);

  const questions = new Map<string, QuestionNode>();
  for (const document of questionFiles) {
    questions.set(document.id, {
      id: document.id,
      type: 'QUESTION',
      text: document.body,
      tags: stringArray(document.metadata, 'tags', document.filePath),
      claims: [],
    });
  }

  const claims = new Map<string, Omit<ClaimNode, 'linkStatus' | 'check'>>();
  for (const document of claimFiles) {
    claims.set(document.id, {
      id: document.id,
      type: 'CLAIM',
      text: document.body,
      evidence: [],
      isRejected: document.metadata.rejected === true || undefined,
    });
  }

  const evidence = new Map<string, EvidenceItem>();
  const evidenceToPaperMap: Record<string, string> = {};
  for (const document of evidenceFiles) {
    const kind = requiredString(document.metadata, 'kind', document.filePath);
    if (kind !== 'paper') throw new Error(`Experiments do not belong in ${document.filePath}`);
    evidence.set(document.id, {
      id: document.id,
      kind,
      typeLabel: optionalString(document.metadata, 'type_label') || 'PAPER',
      title: document.body,
      citation: optionalString(document.metadata, 'citation'),
    });
    evidenceToPaperMap[document.id] = requiredString(document.metadata, 'paper_id', document.filePath);
  }

  const attachedClaims = new Set<string>();
  const attachedEvidence = new Set<string>();
  for (const document of linkFiles) {
    const kind = requiredString(document.data, 'kind', document.filePath);
    const parentId = requiredString(document.data, 'parent_id', document.filePath);
    const childId = requiredString(document.data, 'child_id', document.filePath);
    const status = requiredString(document.data, 'status', document.filePath);
    const userReason = optionalString(document.data, 'user_reason') || '';
    if (!['holds', 'weak', 'missing'].includes(status)) throw new Error(`Invalid status in ${document.filePath}`);
    if (!userReason && status !== 'missing') {
      throw new Error(`A link without a user reason must be missing: ${document.filePath}`);
    }

    if (kind === 'question-claim') {
      const question = questions.get(parentId);
      const claim = claims.get(childId);
      if (!question || !claim) throw new Error(`Broken link in ${document.filePath}`);
      if (attachedClaims.has(childId)) throw new Error(`Claim has multiple parents: ${childId}`);
      attachedClaims.add(childId);
      question.claims.push({
        ...claim,
        linkStatus: status as LinkStatus,
        check: parseCheck(document.data, document.filePath, userReason),
      });
      continue;
    }

    if (kind === 'claim-evidence') {
      const claim = claims.get(parentId);
      const finding = evidence.get(childId);
      if (!claim || !finding) throw new Error(`Broken link in ${document.filePath}`);
      if (attachedEvidence.has(childId)) throw new Error(`Evidence has multiple parents: ${childId}`);
      attachedEvidence.add(childId);
      claim.evidence.push({ ...finding, userReason: userReason || undefined });
      continue;
    }

    throw new Error(`Invalid link kind in ${document.filePath}`);
  }

  for (const claimId of claims.keys()) {
    if (!attachedClaims.has(claimId)) throw new Error(`Claim has no question link: ${claimId}`);
  }
  for (const evidenceId of evidence.keys()) {
    if (!attachedEvidence.has(evidenceId)) throw new Error(`Evidence has no claim link: ${evidenceId}`);
  }

  const papers = paperFiles.map(parsePaper);
  const paperIds = new Set(papers.map((paper) => paper.id));
  for (const [evidenceId, paperId] of Object.entries(evidenceToPaperMap)) {
    if (!paperIds.has(paperId)) throw new Error(`Evidence ${evidenceId} references missing paper ${paperId}`);
  }

  const openProblems: OpenProblemNote[] = openProblemFiles.map((document) => ({
    id: document.id,
    text: document.body,
    citation: optionalString(document.metadata, 'citation'),
    createdAt: requiredNumber(document.metadata, 'created_at', document.filePath),
  }));
  const candidateQuestions: CandidateQuestion[] = candidateFiles.map((document) => ({
    id: document.id,
    text: document.body,
    openProblemIds: stringArray(document.metadata, 'open_problem_ids', document.filePath),
    createdAt: requiredNumber(document.metadata, 'created_at', document.filePath),
  }));

  return {
    workspacePath,
    questions: [...questions.values()],
    papers,
    evidenceToPaperMap,
    survey: { openProblems, candidateQuestions },
  };
}
