'use client';

import { useState, useCallback } from 'react';
import { AdminTabs } from '@/components/admin-tabs';
import { AdminMediaStudio } from '@/components/admin-media-studio';
import { AdminEpisodePlanner, type InspiredDraftInput } from '@/components/admin-episode-planner';
import { MediaInspirationWorkbench } from '@/components/media-inspiration-workbench';
import { MediaJevEvaluationBoard } from '@/components/media-jev-evaluation-board';
import { Sparkles, Image as ImageIcon, Clapperboard } from 'lucide-react';

export function AdminStudioDesk() {
  const [activeTab, setActiveTab] = useState<string>('studio');
  const [externalDraft, setExternalDraft] = useState<InspiredDraftInput | null>(null);

  const handleDraftFromInspiration = useCallback((input: InspiredDraftInput) => {
    setExternalDraft(input);
    setActiveTab('planner');
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', '#planner');
    }
  }, []);

  const handleNavigateTab = useCallback((tabId: string) => {
    setActiveTab(tabId);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `#${tabId}`);
    }
  }, []);

  return (
    <div className="studio-desk">
      <AdminTabs
        label="Creative Studio"
        active={activeTab}
        onChange={setActiveTab}
        tabs={[
          {
            id: 'studio',
            label: 'Asset Studio',
            note: 'Images & Clips',
            panel: (
              <div className="studio-tab-content">
                <AdminMediaStudio onNavigateToPlanner={() => handleNavigateTab('planner')} />
              </div>
            ),
          },
          {
            id: 'planner',
            label: 'Episode Planner',
            note: 'Storyboard & Render',
            panel: (
              <div className="studio-tab-content">
                <AdminEpisodePlanner
                  externalDraft={externalDraft}
                  onNavigateTab={handleNavigateTab}
                />
              </div>
            ),
          },
          {
            id: 'inspiration',
            label: 'Idea Lab',
            note: 'YouTube → Angles',
            panel: (
              <div className="studio-tab-content inspiration-tab-content">
                <MediaInspirationWorkbench onDraft={handleDraftFromInspiration} />
                <details className="studio-telemetry-details">
                  <summary>Model evaluations &amp; benchmark telemetry</summary>
                  <div className="studio-telemetry-body">
                    <MediaJevEvaluationBoard />
                  </div>
                </details>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
