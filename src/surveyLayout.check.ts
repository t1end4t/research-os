import assert from 'node:assert/strict';
import {
  getSurveyFieldSize,
  getSurveyOrbitPosition,
  SURVEY_NOTE_HEIGHT,
  SURVEY_NOTE_WIDTH,
} from './surveyLayout';

const fieldSize = getSurveyFieldSize(6);
const positions = Array.from({ length: 6 }, (_, index) =>
  getSurveyOrbitPosition(index, 6, fieldSize)
);

assert.equal(fieldSize, 680);
assert.equal(new Set(positions.map(({ left, top }) => `${left}:${top}`)).size, 6);
assert.ok(
  positions.every(
    ({ left, top }) =>
      left >= 0 &&
      top >= 0 &&
      left + SURVEY_NOTE_WIDTH <= fieldSize &&
      top + SURVEY_NOTE_HEIGHT <= fieldSize
  )
);
assert.ok(getSurveyFieldSize(7) > fieldSize);

console.log('survey layout checks passed');
