export type DraggableResearchItemType =
  | 'QUESTION'
  | 'CLAIM'
  | 'EVIDENCE'
  | 'PAPER'
  | 'EXPERIMENT'
  | 'ARTIFACT'
  | 'SURVEY';

export interface DraggableResearchItem {
  id: string;
  type: DraggableResearchItemType;
  label: string;
}

export const RESEARCH_ITEM_DRAG_TYPE = 'application/x-instrument-research-item';

const DRAGGABLE_RESEARCH_ITEM_TYPES = new Set<DraggableResearchItemType>([
  'QUESTION',
  'CLAIM',
  'EVIDENCE',
  'PAPER',
  'EXPERIMENT',
  'ARTIFACT',
  'SURVEY',
]);

export function setResearchItemDragData(
  dataTransfer: DataTransfer,
  item: DraggableResearchItem
) {
  dataTransfer.effectAllowed = 'copy';
  dataTransfer.setData(RESEARCH_ITEM_DRAG_TYPE, JSON.stringify(item));
  dataTransfer.setData('text/plain', item.label);
}

export function hasResearchItemDragData(dataTransfer: DataTransfer) {
  return Array.from(dataTransfer.types).includes(RESEARCH_ITEM_DRAG_TYPE);
}

export function parseResearchItemDragData(raw: string): DraggableResearchItem | null {
  try {
    const item = JSON.parse(raw) as Partial<DraggableResearchItem>;
    if (
      !item ||
      typeof item.id !== 'string' ||
      item.id.length === 0 ||
      item.id.length > 200 ||
      typeof item.type !== 'string' ||
      !DRAGGABLE_RESEARCH_ITEM_TYPES.has(item.type as DraggableResearchItemType) ||
      typeof item.label !== 'string' ||
      item.label.length === 0 ||
      item.label.length > 2_000
    ) {
      return null;
    }
    return item as DraggableResearchItem;
  } catch {
    return null;
  }
}

export function getResearchItemDragData(dataTransfer: DataTransfer) {
  return parseResearchItemDragData(dataTransfer.getData(RESEARCH_ITEM_DRAG_TYPE));
}
