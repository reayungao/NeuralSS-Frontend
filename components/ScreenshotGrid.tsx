import React from 'react';
import { ScreenshotCard } from './ScreenshotCard';
import type { Screenshot } from '../types';

interface ScreenshotGridProps {
  screenshotsByGroup: { [groupName: string]: Screenshot[] };
  onScreenshotClick: (screenshot: Screenshot) => void;
}

export const ScreenshotGrid: React.FC<ScreenshotGridProps> = ({ screenshotsByGroup, onScreenshotClick }) => {
  const groupNames = Object.keys(screenshotsByGroup);

  if (groupNames.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 dark:text-gray-400">No screenshots match your search.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {groupNames.map((groupName) => (
        <section key={groupName}>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 px-1">{groupName}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {screenshotsByGroup[groupName].map((screenshot) => (
              <div key={screenshot.id} onClick={() => onScreenshotClick(screenshot)} className="cursor-pointer">
                <ScreenshotCard screenshot={screenshot} />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};
