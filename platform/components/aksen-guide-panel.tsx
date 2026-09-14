'use client';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@/components/ui/sheet';
import { SupportChat } from '@/components/support-chat';

/**
 * The panel itself, kept in its own chunk. Every marketing page used to carry
 * the dialog primitive and the whole chat interface for something almost no
 * visitor opens, so this loads on intent instead.
 */
export function GuidePanel({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="aksen-guide-panel" showCloseButton>
        <div className="guide-head">
          <span className="guide-badge-mark" />
          <div>
            <SheetTitle>Ask Aksen</SheetTitle>
            <SheetDescription>Services, pricing and support.</SheetDescription>
          </div>
        </div>
        <SupportChat />
      </SheetContent>
    </Sheet>
  );
}
