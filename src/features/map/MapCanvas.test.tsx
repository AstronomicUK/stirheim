import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactElement } from 'react'
import { MAP_DISTRICTS, MAP_VIEW_HEIGHT, districtMapY } from '../../rules/data/map/districts'
import { MapCanvas } from './MapCanvas'

const hooks = vi.hoisted(() => ({
  refIndex: 0,
  stateIndex: 0,
  capture: vi.fn(),
  transform: vi.fn(),
}))

// Run the component's actual event handlers in Node. This verifies gesture enrollment
// and state updates, not the browser's native pointer-capture/click dispatch.
vi.mock('react', async (importOriginal) => ({
  ...await importOriginal<typeof import('react')>(),
  useEffect: vi.fn(),
  useCallback: (fn: unknown) => fn,
  useRef: (value: unknown) => ({ current: hooks.refIndex++ === 0 ? {
    setPointerCapture: hooks.capture,
    getBoundingClientRect: () => ({ left: 0, top: 0 }),
  } : value }),
  useState: (value: unknown) => {
    const index = hooks.stateIndex++
    return [index === 1 ? { width: 2400, height: 1697 } : value, index === 0 ? hooks.transform : vi.fn()]
  },
}))

type Node = ReactElement<Record<string, any>> // Event handlers and JSX children inspected below.
function setup() {
  const onSelect = vi.fn()
  const root = MapCanvas({ views: new Map(), selectedId: 'west-gate', onSelect }) as Node
  const frame = root.props.children[0] as Node
  const controls = frame.props.children[2] as Node
  const event = (button: boolean, pointerId = 1, x = 590, y = 532) => ({
    pointerId, clientX: x, clientY: y,
    target: { closest: (selector: string) => button && selector === 'button' ? {} : null },
  })
  return { frame, controls, event, onSelect }
}

beforeEach(() => {
  vi.clearAllMocks()
  hooks.refIndex = 0
  hooks.stateIndex = 0
})

describe('MapCanvas pointer ownership', () => {
  it('keeps all three controls out of capture and district selection, while their clicks update zoom', () => {
    const { frame, controls, event, onSelect } = setup()
    for (const button of controls.props.children as Node[]) {
      frame.props.onPointerDown(event(true))
      frame.props.onPointerUp(event(true))
      button.props.onClick()
    }
    expect(hooks.capture).not.toHaveBeenCalled()
    expect(onSelect).not.toHaveBeenCalled()
    const [zoomIn, zoomOut, fit] = hooks.transform.mock.calls.map(([update]) => update)
    expect(zoomIn({ x: 0, y: 0, k: 1 }).k).toBeCloseTo(1.4)
    expect(zoomOut({ x: -480, y: -339.4, k: 1.4 }).k).toBeCloseTo(1)
    expect(fit).toEqual({ x: 0, y: 0, k: 1 })
  })

  it('captures map pointers and hit-tests every measured district centre', () => {
    const { frame, event, onSelect } = setup()
    for (const district of MAP_DISTRICTS) {
      const e = event(false, 1, district.x * 24, district.y * 16.97)
      frame.props.onPointerDown(e)
      frame.props.onPointerUp(e)
      expect(onSelect).toHaveBeenLastCalledWith(district.id === 'west-gate' ? null : district.id)
      expect(districtMapY(district)).toBeCloseTo(district.y * MAP_VIEW_HEIGHT / 100)
    }
    expect(hooks.capture).toHaveBeenCalledTimes(30)
  })

  it('continues tracking drags and pinch zoom without a control pointer ending the gesture', () => {
    const { frame, event, onSelect } = setup()
    frame.props.onPointerDown(event(false, 1, 1000, 800))
    frame.props.onPointerDown(event(true, 9))
    frame.props.onPointerUp(event(true, 9))
    frame.props.onPointerMove(event(false, 1, 900, 700))
    expect(hooks.transform).toHaveBeenCalledTimes(1)
    expect(hooks.transform.mock.calls[0][0]({ x: 0, y: 0, k: 2 })).toEqual({ x: -100, y: -100, k: 2 })
    frame.props.onPointerDown(event(false, 2, 1100, 700))
    frame.props.onPointerMove(event(false, 2, 1300, 700))
    expect(hooks.transform.mock.calls[1][0]({ x: 0, y: 0, k: 1 }).k).toBe(2)
    frame.props.onPointerUp(event(false, 2))
    expect(onSelect).not.toHaveBeenCalled()
    expect(hooks.capture.mock.calls).toEqual([[1], [2]])
  })
})
