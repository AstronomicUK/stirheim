// Pan/zoom map with separate ownership and reachability displays. Ownership uses light ink
// and contested hatching; reachable districts use numbered markers independent of warband colour.

import { useCallback, useEffect, useId, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { MAP_DISTRICTS, MAP_VIEW_HEIGHT, districtMapY, findDistrict, type MapDistrict } from '../../rules/data/map/districts'
import type { DistrictView } from './model'

export type MapDisplay = 'control' | 'reach'
const REACH_COLOUR = '#087f75'

export const MAP_IMAGE_SRC = '/map/mordheim-campaign-map.jpg'

export interface MapCanvasProps {
  mode?: MapDisplay
  views: Map<string, DistrictView>
  selectedId: string | null
  onSelect: (districtId: string | null) => void
  /** When set, districts outside this set are dimmed. */
  reachable?: Set<string> | null
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

export function MapCanvas({ views, selectedId, onSelect, mode = 'control', reachable = null }: MapCanvasProps) {
  const patternId = useId().replace(/:/g, '')
  const showingReach = mode === 'reach' && reachable !== null
  const available = showingReach ? MAP_DISTRICTS.filter((d) => reachable.has(d.id)) : []
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
    [size.width, size.height, setT],
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

  const dim = (id: string) => showingReach && !reachable!.has(id)

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
          <img src={MAP_IMAGE_SRC} alt="The Mordheim Campaign Map: thirty districts of the ruined city" className="block h-full w-full transition-opacity" style={{ opacity: showingReach ? 0.45 : 1 }} draggable={false} />
          <svg viewBox={`0 0 100 ${MAP_VIEW_HEIGHT}`} className="absolute inset-0 h-full w-full" role="list" aria-label="Districts">
            <defs><pattern id={patternId} width="1.5" height="1.5" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width="1.5" height="1.5" fill="#f8f3e8" fillOpacity="0.65" /><line x1="0" y1="0" x2="0" y2="1.5" stroke="#655f56" strokeWidth="0.5" strokeOpacity="0.65" /></pattern></defs>
            {MAP_DISTRICTS.map((d) => {
              const v = views.get(d.id)
              const r = BASE_RADIUS * d.scale
              const selected = d.id === selectedId
              const contested = (v?.footholds.length ?? 0) > 1
              const canFight = showingReach && reachable!.has(d.id)
              const number = available.findIndex((entry) => entry.id === d.id) + 1
              const fill = showingReach ? canFight ? REACH_COLOUR : '#f8f3e8' : contested ? `url(#${patternId})` : v?.controller?.colour ?? '#f8f3e8'
              const status = showingReach ? canFight ? `In reach, option ${number}` : 'Out of reach' : v?.controller ? `Controlled by ${v.controller.name}` : contested ? `Contested: ${v!.footholds.map((w) => w.name).join(', ')}` : 'Unoccupied'
              return (
                <g key={d.id} role="listitem" opacity={dim(d.id) && !selected ? 0.25 : 1}>
                  {canFight && <circle cx={d.x} cy={districtMapY(d)} r={r + 0.35} fill="none" stroke="#ffffff" strokeWidth={1.5} pointerEvents="none" />}
                  <circle
                    cx={d.x}
                    cy={districtMapY(d)}
                    r={r}
                    fill={fill}
                    fillOpacity={showingReach ? canFight ? 0.25 : 0.06 : contested ? 1 : v?.controller ? 0.22 : 0.04}
                    stroke={selected ? '#2563eb' : canFight ? REACH_COLOUR : '#655f56'}
                    strokeOpacity={selected || canFight ? 1 : 0.4}
                    strokeWidth={selected ? 0.9 : canFight ? 0.75 : 0.18}
                    className="cursor-pointer"
                    role="button"
                    aria-pressed={selected}
                    tabIndex={0}
                    aria-label={`${d.name}, ${status}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onSelect(d.id)
                      }
                    }}
                  />
                  {canFight && <g pointerEvents="none" aria-hidden="true"><circle cx={d.x} cy={districtMapY(d)} r={1.65} fill={REACH_COLOUR} stroke="white" strokeWidth={0.3} /><text x={d.x} y={districtMapY(d) + 0.1} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize={2.4} fontWeight="700">{number}</text></g>}
                  {(!showingReach && contested ? v?.footholds ?? [] : []).map((w, i, all) => {
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
                  {showingReach ? reachable!.has(d.id) ? ' — In reach' : ' — Out of reach' : v?.controller ? ` — ${v.controller.name}` : (v?.footholds.length ?? 0) > 1 ? ' — Contested' : ' — Unoccupied'}
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
      <p className="text-xs text-ink-dim">Drag to pan, scroll or pinch to zoom, tap a district for its details. {showingReach ? 'Numbered teal districts are in reach. Faded districts are out of reach. Blue outlines mark your selection.' : 'Light colours show control; striped districts are contested. Blue outlines mark your selection.'}</p>
    </div>
  )
}
