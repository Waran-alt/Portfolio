'use client';

import { useCallback, useRef, useState } from 'react';
import { Stage, Layer, Circle, Rect, Image } from 'react-konva';
import useImage from 'use-image';
import type { Vat, VatPosition } from '@/types/vat';

interface CellarPlanCanvasProps {
  vats: Vat[];
  backgroundImageUrl?: string | null;
  onBackgroundUpload?: (file: File) => void;
  onVatSelect?: (vat: Vat) => void;
  width?: number;
  height?: number;
}

/** Converts percentage (0–1) to pixel position */
function pctToPx(pct: number, dimension: number): number {
  return Math.round(pct * dimension);
}

export default function CellarPlanCanvas({
  vats,
  backgroundImageUrl,
  onBackgroundUpload,
  onVatSelect,
  width = 800,
  height = 600,
}: CellarPlanCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width, height });

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && (file.type === 'image/png' || file.type === 'image/jpeg')) {
        onBackgroundUpload?.(file);
      }
    },
    [onBackgroundUpload]
  );

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-lg border border-cellar-accent bg-cellar-surface"
      style={{ aspectRatio: '4/3', minHeight: 300 }}
    >
      <Stage
        width={dimensions.width}
        height={dimensions.height}
        className="touch-none"
      >
        <Layer>
          {backgroundImageUrl ? (
            <BackgroundImage url={backgroundImageUrl} width={dimensions.width} height={dimensions.height} />
          ) : (
            <Rect
              x={0}
              y={0}
              width={dimensions.width}
              height={dimensions.height}
              fill="#16213e"
              listening={true}
              onClick={() => document.getElementById('bg-upload')?.click()}
              onTap={() => document.getElementById('bg-upload')?.click()}
            />
          )}
          {vats.map((vat) => (
            <VatMarker
              key={vat.id}
              vat={vat}
              stageWidth={dimensions.width}
              stageHeight={dimensions.height}
              onSelect={() => onVatSelect?.(vat)}
            />
          ))}
        </Layer>
      </Stage>
      <input
        id="bg-upload"
        type="file"
        accept="image/png,image/jpeg,image/jpg"
        className="hidden"
        onChange={handleFileChange}
        aria-label="Upload cellar plan background"
      />
    </div>
  );
}

function BackgroundImage({
  url,
  width,
  height,
}: {
  url: string;
  width: number;
  height: number;
}) {
  const [image] = useImage(url, 'anonymous');
  if (!image) return null;
  return <Image image={image} width={width} height={height} listening={false} />;
}

function VatMarker({
  vat,
  stageWidth,
  stageHeight,
  onSelect,
}: {
  vat: Vat;
  stageWidth: number;
  stageHeight: number;
  onSelect: () => void;
}) {
  const x = pctToPx(vat.position.x, stageWidth);
  const y = pctToPx(vat.position.y, stageHeight);
  const radius = 20;
  const statusColor = {
    empty: '#6b7280',
    in_progress: '#f59e0b',
    full: '#22c55e',
    cleaning: '#3b82f6',
  }[vat.status];

  return (
    <Circle
      x={x}
      y={y}
      radius={radius}
      fill={statusColor}
      stroke="#e94560"
      strokeWidth={2}
      listening={true}
      onClick={onSelect}
      onTap={onSelect}
    />
  );
}
