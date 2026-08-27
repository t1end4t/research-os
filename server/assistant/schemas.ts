import { Type } from 'typebox';

export const AssistantRequestSchema = Type.Object(
  {
    threadId: Type.String({ minLength: 1, maxLength: 200 }),
    context: Type.Object(
      {
        kind: Type.Union([
          Type.Literal('whole_graph'),
          Type.Literal('survey'),
          Type.Literal('claim'),
          Type.Literal('paper'),
          Type.Literal('experiment'),
        ]),
        id: Type.Optional(Type.String({ maxLength: 200 })),
        label: Type.String({ minLength: 1, maxLength: 500 }),
        rawTitle: Type.Optional(Type.String({ maxLength: 2_000 })),
      },
      { additionalProperties: false },
    ),
    message: Type.String({ minLength: 1, maxLength: 20_000 }),
    quotedSnippet: Type.Optional(Type.String({ maxLength: 40_000 })),
    contextData: Type.Unknown(),
  },
  { additionalProperties: false },
);

export const ReplyParameters = Type.Object(
  {
    disposition: Type.Union([Type.Literal('answer'), Type.Literal('refusal')]),
    text: Type.String({ minLength: 1, maxLength: 4_000 }),
  },
  { additionalProperties: false },
);
