'use client'

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Eye, EyeOff, GripVertical, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FieldLabel, Input, Textarea } from '@/components/ui/input'
import { cn } from '@/lib/cn'
import { usePanel } from '@/stores/panel-store'
import { ACCENTS, type Accent, type PanelSection } from '@/types/panel'

const SEC = 'sec:'

const accentSwatch: Record<Accent, string> = {
  cyan: 'bg-read',
  violet: 'bg-write',
  amber: 'bg-event',
  green: 'bg-ok',
}

export function CustomiseEditor() {
  const doc = usePanel((s) => s.doc)!
  const classified = usePanel((s) => s.classified)!
  const { setMeta, setSections, addSection, renameSection, removeSection } = usePanel()
  // While dragging we work on a local copy; otherwise the store is the source of truth.
  const [dragSections, setDragSections] = useState<PanelSection[] | null>(null)
  const sections = dragSections ?? doc.sections
  const [activeId, setActiveId] = useState<string | null>(null)
  const nameBytes = new TextEncoder().encode(doc.name).length
  const setLocal = (fn: (prev: PanelSection[]) => PanelSection[]) => setDragSections((cur) => fn(cur ?? doc.sections))

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const containerOf = (id: string, list = sections) => {
    if (id.startsWith(SEC)) return id.slice(SEC.length)
    return list.find((s) => s.items.includes(id))?.id ?? null
  }

  const onDragStart = (e: DragStartEvent) => {
    setActiveId(String(e.active.id))
    setDragSections(doc.sections)
  }

  const onDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) return
    const a = String(active.id)
    const o = String(over.id)
    const from = containerOf(a)
    const to = containerOf(o)
    if (!from || !to || from === to) return
    setLocal((prev) => {
      const src = prev.find((s) => s.id === from)!
      const dst = prev.find((s) => s.id === to)!
      const idx = o.startsWith(SEC) ? dst.items.length : Math.max(0, dst.items.indexOf(o))
      return prev.map((s) => {
        if (s.id === from) return { ...s, items: src.items.filter((k) => k !== a) }
        if (s.id === to) {
          const items = dst.items.filter((k) => k !== a)
          items.splice(idx, 0, a)
          return { ...s, items }
        }
        return s
      })
    })
  }

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null)
    let next = sections
    if (over) {
      const a = String(active.id)
      const o = String(over.id)
      const c = containerOf(a)
      if (c && c === containerOf(o) && !o.startsWith(SEC)) {
        next = sections.map((s) => (s.id === c ? { ...s, items: arrayMove(s.items, s.items.indexOf(a), s.items.indexOf(o)) } : s))
      }
    }
    setSections(next)
    setDragSections(null)
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="grid gap-4 md:grid-cols-2">
        <div>
          <FieldLabel htmlFor="panel-name" type={`${nameBytes}/40 bytes`}>
            Panel name
          </FieldLabel>
          <Input id="panel-name" value={doc.name} invalid={nameBytes > 40 || !doc.name} onChange={(e) => setMeta({ name: e.target.value })} />
        </div>
        <div>
          <FieldLabel>Accent</FieldLabel>
          <div className="flex h-9 items-center gap-2" role="radiogroup" aria-label="Accent colour">
            {ACCENTS.map((a) => (
              <button
                key={a}
                type="button"
                role="radio"
                aria-checked={doc.accent === a}
                aria-label={a}
                onClick={() => setMeta({ accent: a })}
                className={cn(
                  'size-6 rounded-full border-2 transition-transform',
                  accentSwatch[a],
                  doc.accent === a ? 'border-fg' : 'border-transparent opacity-60 hover:opacity-100',
                )}
              />
            ))}
          </div>
        </div>
        <div className="md:col-span-2">
          <FieldLabel htmlFor="panel-desc" type={`${doc.description.length}/280`}>
            Description
          </FieldLabel>
          <Textarea
            id="panel-desc"
            className="min-h-16"
            maxLength={280}
            value={doc.description}
            placeholder="What is this contract, and what should people do here?"
            onChange={(e) => setMeta({ description: e.target.value })}
          />
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-[14px] font-medium">Functions</h3>
            <p className="text-[12px] text-muted">Drag to reorder or move between sections. Keyboard: focus a handle, Space, arrows, Space.</p>
          </div>
          <Button size="sm" variant="ghost" onClick={() => addSection('New section')} disabled={sections.length >= 12}>
            <Plus /> Add section
          </Button>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onDragStart} onDragOver={onDragOver} onDragEnd={onDragEnd} onDragCancel={() => {
            setActiveId(null)
            setDragSections(null)
          }}>
          <div className="flex flex-col gap-4">
            {sections.map((s) => (
              <SectionBox
                key={s.id}
                section={s}
                canRemove={sections.length > 1}
                onRename={(t) => renameSection(s.id, t)}
                onRemove={() => removeSection(s.id)}
              >
                <SortableContext items={s.items} strategy={verticalListSortingStrategy}>
                  {s.items.map((k) => {
                    const info = classified.byKey.get(k)
                    return info ? <FnRow key={k} fnKey={k} kind={info.kind} /> : null
                  })}
                </SortableContext>
              </SectionBox>
            ))}
          </div>
          <DragOverlay>{activeId ? <RowGhost fnKey={activeId} /> : null}</DragOverlay>
        </DndContext>
      </section>
    </div>
  )
}

function SectionBox({
  section,
  children,
  canRemove,
  onRename,
  onRemove,
}: {
  section: PanelSection
  children: React.ReactNode
  canRemove: boolean
  onRename: (t: string) => void
  onRemove: () => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: SEC + section.id })
  return (
    <div ref={setNodeRef} className={cn('rounded-card border bg-panel', isOver ? 'border-read/40' : 'border-line')}>
      <div className="flex items-center gap-2 border-b border-line px-3 py-2">
        <input
          aria-label="Section title"
          value={section.title}
          maxLength={32}
          onChange={(e) => onRename(e.target.value)}
          className="h-7 min-w-0 flex-1 rounded-md bg-transparent px-1.5 text-[13px] font-medium outline-none hover:bg-panel-2 focus:bg-panel-2"
        />
        <span className="font-mono text-[11px] text-faint">{section.items.length}</span>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove section ${section.title}`}
            title="Remove section (its functions move to the first section)"
            className="inline-flex size-7 items-center justify-center rounded-md text-faint hover:bg-panel-3 hover:text-danger"
          >
            <Trash2 className="size-3.5" strokeWidth={1.5} />
          </button>
        )}
      </div>
      <ul className="flex min-h-12 flex-col p-1.5">{children}</ul>
      {section.items.length === 0 && <p className="-mt-9 mb-4 px-4 text-[12px] text-faint">Drop functions here</p>}
    </div>
  )
}

function FnRow({ fnKey, kind }: { fnKey: string; kind: 'read' | 'write' }) {
  const meta = usePanel((s) => s.doc?.fn[fnKey])
  const setFnMeta = usePanel((s) => s.setFnMeta)
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: fnKey })
  const hidden = !!meta?.hidden
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn('rounded-ctl', isDragging && 'opacity-30')}
    >
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-x-2 gap-y-1.5 rounded-ctl px-1.5 py-2 hover:bg-panel-2 md:grid-cols-[auto_minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1.3fr)_auto] md:items-center">
        <button
          ref={setActivatorNodeRef}
          type="button"
          aria-label={`Move ${fnKey}`}
          className="inline-flex h-7 w-5 cursor-grab touch-none items-center justify-center rounded text-faint hover:text-fg active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" strokeWidth={1.5} />
        </button>
        <code className={cn('flex min-w-0 items-center gap-2 font-mono text-[12px]', hidden && 'text-faint line-through')}>
          <span className={cn('size-1.5 shrink-0 rounded-full', kind === 'read' ? 'bg-read' : 'bg-write')} aria-hidden />
          <span className="truncate" title={fnKey}>
            {fnKey}
          </span>
        </code>
        <input
          aria-label={`Label for ${fnKey}`}
          placeholder="Label"
          maxLength={48}
          value={meta?.label ?? ''}
          onChange={(e) => setFnMeta(fnKey, { label: e.target.value })}
          className="col-span-3 col-start-2 h-8 min-w-0 rounded-md border border-line-2 bg-bg px-2 text-[13px] outline-none placeholder:text-faint focus:border-read/60 md:col-span-1 md:col-start-auto"
        />
        <input
          aria-label={`Note for ${fnKey}`}
          placeholder="Note, e.g. “Use option 0–3”"
          maxLength={200}
          value={meta?.note ?? ''}
          onChange={(e) => setFnMeta(fnKey, { note: e.target.value })}
          className="col-span-3 col-start-2 h-8 min-w-0 rounded-md border border-line-2 bg-bg px-2 text-[13px] outline-none placeholder:text-faint focus:border-read/60 md:col-span-1 md:col-start-auto"
        />
        <button
          type="button"
          onClick={() => setFnMeta(fnKey, { hidden: !hidden })}
          aria-pressed={hidden}
          aria-label={hidden ? `Show ${fnKey}` : `Hide ${fnKey}`}
          title={hidden ? 'Hidden — click to show' : 'Visible — click to hide'}
          className="col-start-3 row-start-1 inline-flex size-7 items-center justify-center rounded-md text-muted hover:bg-panel-3 hover:text-fg md:col-start-auto md:row-start-auto"
        >
          {hidden ? <EyeOff className="size-4 text-faint" strokeWidth={1.5} /> : <Eye className="size-4" strokeWidth={1.5} />}
        </button>
      </div>
    </li>
  )
}

function RowGhost({ fnKey }: { fnKey: string }) {
  return (
    <div className="flex items-center gap-2 rounded-ctl border border-read/40 bg-panel-2 px-3 py-2 font-mono text-[12px] shadow-[0_20px_60px_-20px_rgb(0_0_0/0.9)]">
      <GripVertical className="size-4 text-muted" strokeWidth={1.5} />
      {fnKey}
    </div>
  )
}
