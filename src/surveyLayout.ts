export const SURVEY_NOTE_WIDTH = 188;
export const SURVEY_NOTE_HEIGHT = 104;

const NOTES_PER_RING = 6;
const BASE_FIELD_SIZE = 680;
const RING_GROWTH = 250;

export function getSurveyFieldSize(noteCount: number) {
  const ringCount = Math.max(1, Math.ceil(noteCount / NOTES_PER_RING));
  return BASE_FIELD_SIZE + (ringCount - 1) * RING_GROWTH;
}

export function getSurveyOrbitPosition(index: number, noteCount: number, fieldSize: number) {
  const ring = Math.floor(index / NOTES_PER_RING);
  const ringStart = ring * NOTES_PER_RING;
  const notesInRing = Math.min(NOTES_PER_RING, noteCount - ringStart);
  const positionInRing = index - ringStart;
  const radius = 220 + ring * 125;
  const angle = -Math.PI / 2 + (Math.PI * 2 * positionInRing) / Math.max(1, notesInRing);
  const center = fieldSize / 2;

  return {
    left: center + Math.cos(angle) * radius - SURVEY_NOTE_WIDTH / 2,
    top: center + Math.sin(angle) * radius - SURVEY_NOTE_HEIGHT / 2,
    centerX: center + Math.cos(angle) * radius,
    centerY: center + Math.sin(angle) * radius,
  };
}
