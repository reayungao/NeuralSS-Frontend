import React from 'react';
import { ScreenshotCard } from './ScreenshotCard';
import type { Screenshot } from '../types';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useResponsiveGrid } from '../hooks/useResponsiveGrid';

interface ScreenshotGridProps {
  screenshots: Screenshot[];
  onScreenshotClick: (screenshot: Screenshot) => void;
  isScanning: boolean;
  parentRef: React.RefObject<HTMLElement>;
}

const GRID_GAP = 16; // Corresponds to Tailwind's `gap-4`

export const ScreenshotGrid: React.FC<ScreenshotGridProps> = ({ screenshots, onScreenshotClick, isScanning, parentRef }) => {
  const { columnCount, containerWidth } = useResponsiveGrid(parentRef);

  const rowCount = Math.ceil(screenshots.length / columnCount);

  // Calculate the width of a single grid item based on container width, column count, and gap
  const itemWidth = (containerWidth - (GRID_GAP * (columnCount - 1))) / columnCount;
  // Calculate the height based on the 9:16 aspect ratio
  const itemHeight = itemWidth * (16 / 9);
  const rowHeight = itemHeight + GRID_GAP;

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 5, // Render a few extra rows for smoother scrolling
  });

  if (screenshots.length === 0) {
    if (isScanning) return null;
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 dark:text-gray-400">No screenshots match your search.</p>
      </div>
    );
  }

  const gridClasses = `grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4`;

  return (
    <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
      {rowVirtualizer.getVirtualItems().map(virtualRow => {
        const startIndex = virtualRow.index * columnCount;
        const endIndex = Math.min(startIndex + columnCount, screenshots.length);
        const rowScreenshots = screenshots.slice(startIndex, endIndex);

        return (
          <div
            key={virtualRow.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${rowHeight}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            <div className={gridClasses}>
              {rowScreenshots.map(screenshot => (
                <div key={screenshot.id} onClick={() => onScreenshotClick(screenshot)} className="cursor-pointer">
                  <ScreenshotCard screenshot={screenshot} />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};