'use client';

import React from 'react';
import { useChatDock } from './ChatDockContext';
import { FloatingChatWindow } from './FloatingChatWindow';

export function FloatingChatDock() {
  const { activeWindows } = useChatDock();

  if (activeWindows.length === 0) return null;

  return (
    <div className="fixed bottom-0 right-6 z-[100] flex items-end gap-2.5 pointer-events-none">
      {activeWindows.map((win) => (
        <div key={win.id} className="pointer-events-auto">
          <FloatingChatWindow window={win} />
        </div>
      ))}
    </div>
  );
}
