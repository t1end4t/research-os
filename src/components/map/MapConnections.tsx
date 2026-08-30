import React from 'react';
import { MapEdge, buildOrthogonalElbowPath } from './mapLayout';

interface MapConnectionsProps {
  edges: MapEdge[];
  activeComponentIds: Set<string> | null;
  width: number;
  height: number;
}

export function MapConnections({
  edges,
  activeComponentIds,
  width,
  height,
}: MapConnectionsProps) {
  // Status color mapping using the reserved semantic tokens
  const getStrokeColor = (status: 'holds' | 'weak' | 'missing') => {
    switch (status) {
      case 'holds':
        return '#2e7d32'; // var(--color-holds) / emerald-700
      case 'weak':
        return '#c57b11'; // var(--color-weak) / amber-700
      case 'missing':
        return '#b71c1c'; // var(--color-missing) / red-700
      default:
        return '#737373';
    }
  };

  return (
    <svg
      id="argument-map-edges-svg"
      className="absolute inset-0 pointer-events-none z-0"
      style={{
        width: `${width}px`,
        height: `${height}px`,
      }}
      aria-hidden="true"
    >
      <defs>
        {/* Subtle filters or marker definitions if ever needed */}
      </defs>

      <g id="map-edges-group">
        {edges.map((edge) => {
          const isActive =
            !activeComponentIds ||
            (activeComponentIds.has(edge.sourceId) && activeComponentIds.has(edge.targetId));

          const isHighlighted =
            activeComponentIds &&
            activeComponentIds.has(edge.sourceId) &&
            activeComponentIds.has(edge.targetId);

          const strokeColor = getStrokeColor(edge.status);
          const pathD = buildOrthogonalElbowPath(
            edge.x1,
            edge.y1,
            edge.x2,
            edge.y2,
            edge.busX,
            4 // Clean 4px subtle rounded elbow
          );

          let strokeDash = 'none';
          if (edge.status === 'weak') {
            strokeDash = '5,3';
          } else if (edge.status === 'missing') {
            strokeDash = '3,3';
          }

          // Distinct stroke width and opacity for active/inactive fault line
          const strokeWidth = isHighlighted ? 2.5 : isActive ? 1.5 : 1.2;
          const opacity = isHighlighted ? 1.0 : isActive ? 0.75 : 0.15;

          return (
            <path
              key={edge.id}
              id={`edge-${edge.id}`}
              d={pathD}
              fill="none"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDash}
              strokeLinecap="square"
              strokeLinejoin="miter"
              className="transition-[opacity,stroke-width] duration-150 ease-out motion-reduce:transition-none"
              style={{
                opacity,
              }}
            />
          );
        })}
      </g>
    </svg>
  );
}
