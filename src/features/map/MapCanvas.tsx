// The map itself: the campaign map image with an SVG overlay of the thirty districts, panned and
// zoomed with a mouse, a wheel or two fingers. Circles are filled in the controller's ink; small
// dots around a circle mark every foothold; a ring marks the selected district; districts a chosen
// warband can reach are lit, the rest dimmed.

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { MAP_DISTRICTS, MAP_LINKS, MAP_VIEW_HEIGHT, districtMapY, findDistrict, type MapDistrict } from '../../rules/data/map/districts'
import type { DistrictView } from './model'

export const MAP_IMAGE_SRC = '/map/mordheim-campaign-map.jpg'

export interface MapCanvasProps {
  views: Map<string, DistrictView>
  selectedId: string | null
  onSelect: (districtId: string | null) => void
  /** When set, districts outside this set are dimmed. */
  reachable?: Set<string> | null
  /** Districts the chosen warband has explored (drawn with a dashed ring). */
  explored?: Set<string> | null
  /** The chosen warband's ink, for the reach highlight. */
  highlightColour?: string
}

interface Transform {
  x: number
  y: number
  k: number
}

const MIN_K = 1
const MAX_K = 6
const BASE_RADIUS = 3.1

function clamp(t: Transform, width: number, height: number): Transform {
  const k = Math.min(MAX_K, Math.max(MIN_K, t.k))
  const maxX = 0
  const minX = width - width * k
  const maxY = 0
  const minY = height - height * k
  return { k, x: Math.min(maxX, Math.max(minX, t.x)), y: Math.min(maxY, Math.max(minY, t.y)) }
}

export function MapCanvas({ views, selectedId, onSelect, reachable = null, explored = null, highlightColour = '#9a6f1f' }: MapCanvasProps) {
  const frame = useRef<HTMLDivElement>(null)
  const [t, setT] = useState<Transform>({ x: 0, y: 0, k: 1 })
  const [size, setSize] = useState({ width: 1, height: 1 })
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const drag = useRef<{ x: number; y: number; tx: number; ty: number; moved: boolean } | null>(null)
  const pinch = useRef<{ dist: number; k: number; cx: number; cy: number; tx: number; ty: number } | null>(null)
  const gestureMoved = useRef(false)
  const [dragging, setDragging] = useState(false)
  const [hover, setHover] = useState<{ id: string; x: number; y: number } | null>(null)

  useEffect(() => {
    const el = frame.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect()
      setSize({ width: r.width, height: r.height })
      setT((cur) => clamp(cur, r.width, r.height))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const zoomAt = useCallback(
    (factor: number, cx: number, cy: number) => {
      setT((cur) => {
        const k = Math.min(MAX_K, Math.max(MIN_K, cur.k * factor))
        const ratio = k / cur.k
        return clamp({ k, x: cx - (cx - cur.x) * ratio, y: cy - (cy - cur.y) * ratio }, size.width, size.height)
      })
    },
    [size.width, size.height],
  )

  function local(e: { clientX: number; clientY: number }) {
    const r = frame.current!.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }

  // With the pointer captured to the frame (needed so drags keep tracking off the edge), the browser
  // retargets click/pointerup's `e.target` to the frame itself rather than whatever circle is under
  // the pointer — so district hit-testing has to be done in map space here instead of trusting e.target.
  function districtAt(px: number, py: number, touch = false): MapDistrict | null {
    const svgX = ((px - t.x) / t.k / size.width) * 100
    const svgY = ((py - t.y) / t.k / size.height) * MAP_VIEW_HEIGHT
    let best: { d: MapDistrict; dist: number } | null = null
    for (const d of MAP_DISTRICTS) {
      const r = Math.max(BASE_RADIUS * d.scale, touch ? 22 * 100 / (size.width * t.k) : 0)
      const dist = Math.hypot(svgX - d.x, svgY - districtMapY(d))
      if (dist <= r && (!best || dist < best.dist)) best = { d, dist }
    }
    return best?.d ?? null
  }

  useEffect(() => {
    const el = frame.current
    if (!el) return
    const wheel = (e: WheelEvent) => {
      e.preventDefault()
      const r = el.getBoundingClientRect()
      zoomAt(e.deltaY < 0 ? 1.15 : 1 / 1.15, e.clientX - r.left, e.clientY - r.top)
    }
    el.addEventListener('wheel', wheel, { passive: false })
    return () => el.removeEventListener('wheel', wheel)
  }, [zoomAt])

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    // Controls need native clicks; never enroll their pointers in map gestures.
    if ((e.target as Element).closest('button') || (e.button !== undefined && e.button !== 0)) return
    if (pointers.current.size >= 2) return
    frame.current?.setPointerCapture(e.pointerId)
    const p = local(e)
    pointers.current.set(e.pointerId, p)
    if (pointers.current.size === 1) {
      gestureMoved.current = false
      setHover(null)
      drag.current = { x: p.x, y: p.y, tx: t.x, ty: t.y, moved: false }
      setDragging(true)
    }
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()]
      pinch.current = { dist: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)), k: t.k, cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2, tx: t.x, ty: t.y }
      drag.current = null
      gestureMoved.current = true
    }
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (pointers.current.size === 0) {
      const p = local(e)
      const d = districtAt(p.x, p.y)
      setHover(d ? { id: d.id, x: p.x, y: p.y } : null)
      return
    }
    if (!pointers.current.has(e.pointerId)) return
    setHover(null)
    const p = local(e)
    pointers.current.set(e.pointerId, p)
    if (pinch.current && pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()]
      const dist = Math.hypot(a.x - b.x, a.y - b.y)
      // Snapshot gesture data before queuing a React update: pointerup may clear the refs.
      const start = pinch.current
      const cx = (a.x + b.x) / 2
      const cy = (a.y + b.y) / 2
      const k = Math.min(MAX_K, Math.max(MIN_K, start.k * dist / start.dist))
      const ratio = k / start.k
      setT(clamp({ k, x: cx - (start.cx - start.tx) * ratio, y: cy - (start.cy - start.ty) * ratio }, size.width, size.height))
      return
    }
    if (drag.current) {
      const dx = p.x - drag.current.x
      const dy = p.y - drag.current.y
      if (Math.abs(dx) + Math.abs(dy) > 5) { drag.current.moved = true; gestureMoved.current = true }
      const { tx, ty } = drag.current
      setT((cur) => clamp({ k: cur.k, x: tx + dx, y: ty + dy }, size.width, size.height))
    }
  }

  function onPointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    // A control's pointerup bubbles here too, but must not select/deselect the map.
    if (!pointers.current.has(e.pointerId)) return
    pointers.current.delete(e.pointerId)
    if (pointers.current.size < 2) pinch.current = null
    if (pointers.current.size === 0) {
      const moved = gestureMoved.current || (drag.current?.moved ?? false)
      drag.current = null
      setDragging(false)
      if (!moved) {
        const p = local(e)
        const district = districtAt(p.x, p.y, e.pointerType === 'touch')
        onSelect(district ? (district.id === selectedId ? null : district.id) : null)
        setHover(null)
      }
    } else if (pointers.current.size === 1) {
      const [remaining] = [...pointers.current.values()]
      drag.current = { x: remaining.x, y: remaining.y, tx: t.x, ty: t.y, moved: true }
    }
  }

  function onPointerCancel(e: ReactPointerEvent<HTMLDivElement>) {
    if (!pointers.current.has(e.pointerId)) return
    gestureMoved.current = true
    onPointerUp(e)
  }

  const selectedDistrict = selectedId ? findDistrict(selectedId) : undefined
  const dim = (id: string) => (reachable ? !reachable.has(id) : false)

  return (
    <div className="flex flex-col gap-2">
      <div
        ref={frame}
        className="relative w-full touch-none select-none overflow-hidden rounded-md border border-border bg-surface-high"
        style={{ aspectRatio: `100 / ${MAP_VIEW_HEIGHT}`, cursor: dragging ? 'grabbing' : 'grab', WebkitTapHighlightColor: 'transparent' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onLostPointerCapture={onPointerCancel}
        onPointerLeave={() => setHover(null)}
      >
        <div className="absolute inset-0 origin-top-left" style={{ transform: `translate(${t.x}px, ${t.y}px) scale(${t.k})` }}>
          <img src={MAP_IMAGE_SRC} alt="The Mordheim Campaign Map: thirty districts of the ruined city" className="block h-full w-full" draggable={false} />
          <svg viewBox={`0 0 100 ${MAP_VIEW_HEIGHT}`} className="absolute inset-0 h-full w-full" role="list" aria-label="Districts">
            {MAP_LINKS.map(([a, b]) => {
              const da = findDistrict(a)!
              const db = findDistrict(b)!
              const lit = reachable ? reachable.has(a) && reachable.has(b) : false
              return <line key={`${a}-${b}`} x1={da.x} y1={districtMapY(da)} x2={db.x} y2={districtMapY(db)} stroke={lit ? highlightColour : '#241f1a'} strokeOpacity={lit ? 0.7 : 0.12} strokeWidth={lit ? 0.35 : 0.2} />
            })}
            {MAP_DISTRICTS.map((d) => {
              const v = views.get(d.id)
              const r = BASE_RADIUS * d.scale
              const selected = d.id === selectedId
              const fill = v?.controller?.colour ?? null
              const isExplored = explored?.has(d.id) ?? false
              return (
                <g key={d.id} role="listitem" opacity={dim(d.id) ? 0.35 : 1}>
                  <circle
                    cx={d.x}
                    cy={districtMapY(d)}
                    r={r}
                    fill={fill ?? '#f8f3e8'}
                    fillOpacity={fill ? 0.42 : 0.08}
                    stroke={selected ? '#241f1a' : fill ?? '#241f1a'}
                    strokeOpacity={selected ? 1 : fill ? 0.9 : 0.45}
                    strokeWidth={selected ? 0.55 : 0.28}
                    strokeDasharray={isExplored && !fill ? '0.6 0.4' : undefined}
                    className="cursor-pointer"
                    role="button"
                    aria-pressed={selected}
                    tabIndex={0}
                    aria-label={`${d.name}${v?.controller ? `, controlled by ${v.controller.name}` : ''}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onSelect(d.id)
                      }
                    }}
                  />
                  {reachable?.has(d.id) ? <circle cx={d.x} cy={districtMapY(d)} r={r + 0.6} fill="none" stroke={highlightColour} strokeOpacity={0.9} strokeWidth={0.3} pointerEvents="none" /> : null}
                  {(v?.footholds ?? []).map((w, i, all) => {
                    const angle = -Math.PI / 2 + (i / Math.max(all.length, 1)) * Math.PI * 2
                    return <circle key={w.id} cx={d.x + Math.cos(angle) * (r - 0.7)} cy={districtMapY(d) + Math.sin(angle) * (r - 0.7)} r={0.55} fill={w.colour} stroke="#f8f3e8" strokeWidth={0.15} pointerEvents="none" />
                  })}
                </g>
              )
            })}
          </svg>
        </div>
        {hover
          ? (() => {
              const d = findDistrict(hover.id)
              if (!d) return null
              const v = views.get(hover.id)
              return (
                <div
                  className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md border border-border bg-surface-low px-2 py-1 text-xs text-ink shadow-sm"
                  style={{ left: Math.max(100, Math.min(size.width - 100, hover.x)), top: Math.max(45, hover.y - 10), maxWidth: Math.min(240, size.width - 16), whiteSpace: 'normal' }}
                >
                  {d.name}
                  {v?.controller ? ` — ${v.controller.name}` : ''}
                </div>
              )
            })()
          : null}
        <div className="absolute right-2 top-2 flex flex-col overflow-hidden rounded-md border border-border bg-surface-low/95 shadow-sm">
          <button type="button" className="flex h-9 w-9 items-center justify-center text-lg text-ink hover:bg-surface-high" aria-label="Zoom in" onClick={() => zoomAt(1.4, size.width / 2, size.height / 2)}>
            +
          </button>
          <button type="button" className="flex h-9 w-9 items-center justify-center border-t border-border text-lg text-ink hover:bg-surface-high" aria-label="Zoom out" onClick={() => zoomAt(1 / 1.4, size.width / 2, size.height / 2)}>
            −
          </button>
          <button type="button" className="flex h-9 w-9 items-center justify-center border-t border-border text-xs text-ink hover:bg-surface-high" aria-label="Fit the whole map" onClick={() => setT({ x: 0, y: 0, k: 1 })}>
            Fit
          </button>
        </div>
      </div>
      {selectedDistrict && <div role="status" className="rounded-md border border-border bg-surface-low px-3 py-2 text-sm text-ink">
        <strong>{selectedDistrict.name}</strong>
        <p className="mt-1 text-xs text-ink-dim">{views.get(selectedDistrict.id)?.controller ? `Controlled by ${views.get(selectedDistrict.id)!.controller!.name}` : 'Not controlled'}</p>
      </div>}
      <p className="text-xs text-ink-dim">Drag to pan, scroll or pinch to zoom, tap a district for its details. Filled circles are controlled; the dots around a circle are footholds.</p>
    </div>
  )
}
