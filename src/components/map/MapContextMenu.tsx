
import React from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { MapPin, Route } from 'lucide-react';

interface MapContextMenuProps {
  children: React.ReactNode;
  onAddCommunityNote: () => void;
  onMapDistance: () => void;
}

export const MapContextMenu = ({ children, onAddCommunityNote, onMapDistance }: MapContextMenuProps) => {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem onClick={onMapDistance} className="flex items-center gap-2">
          <Route className="h-4 w-4" />
          Map distance to button
        </ContextMenuItem>
        <ContextMenuItem onClick={onAddCommunityNote} className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Add community note
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};
