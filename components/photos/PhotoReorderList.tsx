"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { postJson } from "@/lib/fetcher";
import type { ProjectPhoto } from "@/lib/db/schema";

interface Props {
  projectId: string;
  photos: ProjectPhoto[];
  onReordered: () => void;
}

function SortablePhoto({ photo, index }: { photo: ProjectPhoto; index: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: photo.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className={`relative aspect-4/3 cursor-grab overflow-hidden rounded-md border border-neutral-200 bg-neutral-100 ${
        isDragging ? "opacity-60" : ""
      }`}
    >
      {photo.publicUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photo.publicUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full items-center justify-center text-xs text-neutral-400">
          No preview
        </div>
      )}
      <span className="absolute left-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white">
        {index + 1}
      </span>
    </div>
  );
}

export function PhotoReorderList({ projectId, photos, onReordered }: Props) {
  const [items, setItems] = useState(photos);
  const [syncedFrom, setSyncedFrom] = useState(photos);
  const [saving, setSaving] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // Re-sync local (optimistic) order when the server list changes.
  if (photos !== syncedFrom) {
    setSyncedFrom(photos);
    setItems(photos);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((p) => p.id === active.id);
    const newIndex = items.findIndex((p) => p.id === over.id);
    const next = arrayMove(items, oldIndex, newIndex);
    setItems(next);

    setSaving(true);
    try {
      await postJson(
        `/api/projects/${projectId}/photos/order`,
        { order: next.map((p, i) => ({ id: p.id, orderIndex: i })) },
        "PATCH"
      );
      onReordered();
    } finally {
      setSaving(false);
    }
  }

  if (items.length === 0) {
    return <p className="text-sm text-neutral-500">No photos yet — add some to get started.</p>;
  }

  return (
    <div className="space-y-2">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((p) => p.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {items.map((photo, i) => (
              <SortablePhoto key={photo.id} photo={photo} index={i} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <p className="text-xs text-neutral-500">
        Drag to reorder — this is the order they&apos;ll appear in the video.
        {saving ? " Saving…" : ""}
      </p>
    </div>
  );
}
