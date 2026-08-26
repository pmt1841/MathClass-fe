'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  X, Check, MousePointer2, CircleDot, Minus, Circle, Undo, Redo, FunctionSquare,
  Pencil, Trash2, Pin, Type, Grid, Compass, Slash, Triangle, Square,
  RectangleHorizontal, Diamond
} from 'lucide-react'
import JXG from 'jsxgraph'
import 'mathlive'
import './jsxgraph.css'

const Parallelogram = ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M3 18h13.5L21 6H7.5L3 18z" />
  </svg>
)

import {
  attachSquareConstraints,
  attachRectangleConstraints,
  attachParallelogramConstraints,
  attachRhombusConstraints,
  enforcePolygonConstraints,
  findIntersections,
  getNextPointName,
  calculateSquareVertices,
  calculateRectangleVertices,
  calculateRhombusVertices,
  calculateParallelogramVertices
} from '@/lib/jsxgraph-geometry'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'math-field': any;
    }
  }
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'math-field': any;
    }
  }
}


interface JsxGraphEditorModalProps {
  open: boolean
  onClose: () => void
  onConfirm: (jsxGraphData: any, width?: string, height?: string) => void
  initialData?: any
  initialWidth?: string
  initialHeight?: string
}

type ToolType =
  | 'select'
  | 'point'
  | 'segment'
  | 'line'
  | 'triangle'
  | 'square'
  | 'rectangle'
  | 'rhombus'
  | 'parallelogram'
  | 'circle'
  | 'function'

export const generateElementId = (prefix = 'el') =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

export const escapeHtml = (str: string) =>
  (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function normalizeCanvasElements(rawElements: any[]): any[] {
  if (!Array.isArray(rawElements)) return []

  const allPoints: { el: any; x: number; y: number }[] = []
  rawElements.forEach(el => {
    const normType = (el.type || '').toString().toLowerCase()
    if (normType === 'point') {
      const px = el.x ?? el.X ?? (Array.isArray(el.parents) && typeof el.parents[0] === 'number' ? el.parents[0] : undefined)
      const py = el.y ?? el.Y ?? (Array.isArray(el.parents) && typeof el.parents[1] === 'number' ? el.parents[1] : undefined)
      if (px !== undefined && py !== undefined && !isNaN(Number(px)) && !isNaN(Number(py))) {
        allPoints.push({ el, x: Number(px), y: Number(py) })
      }
    }
  })

  if (allPoints.length > 0) {
    const xs = allPoints.map(p => p.x)
    const ys = allPoints.map(p => p.y)
    const minX = Math.min(...xs), maxX = Math.max(...xs)
    const minY = Math.min(...ys), maxY = Math.max(...ys)
    const maxSpan = Math.max(maxX - minX, maxY - minY)
    const maxAbs = Math.max(Math.abs(minX), Math.abs(maxX), Math.abs(minY), Math.abs(maxY))

    if (maxSpan > 15 || maxAbs > 15) {
      const targetSpan = 8
      const scaleFactor = maxSpan > 0 ? targetSpan / maxSpan : 1
      const centerX = (minX + maxX) / 2
      const centerY = (minY + maxY) / 2

      allPoints.forEach(p => {
        const newX = Math.round((p.x - centerX) * scaleFactor * 10) / 10
        const newY = Math.round((p.y - centerY) * scaleFactor * 10) / 10
        p.el.x = newX
        p.el.y = newY
        p.el.parents = [newX, newY]
      })
    }
  }

  const pointMap: Record<string, string> = {}
  const normalizedPoints: any[] = []

  rawElements.forEach((el, idx) => {
    const normType = (el.type || '').toString().toLowerCase()
    if (normType === 'point') {
      let x = el.x ?? el.X ?? (Array.isArray(el.parents) ? el.parents[0] : 0)
      let y = el.y ?? el.Y ?? (Array.isArray(el.parents) ? el.parents[1] : 0)
      x = Number(x) || 0
      y = Number(y) || 0

      const pointId = el.id || `p_${idx}_${Date.now()}`
      const pointName = el.attributes?.name || el.label || el.name || pointId

      const keys = [el.id, el.label, el.name, pointName].filter(Boolean)
      keys.forEach(k => { pointMap[k] = pointId })

      normalizedPoints.push({
        type: 'point',
        id: pointId,
        parents: [x, y],
        attributes: {
          size: el.attributes?.size || 4,
          name: pointName,
          withLabel: true,
          showInfobox: true,
          highlight: true,
          ...(el.attributes || {})
        }
      })
    }
  })

  const normalizedOthers: any[] = []
  rawElements.forEach((el, idx) => {
    const normType = (el.type || '').toString().toLowerCase()
    if (normType === 'point') return

    if (normType === 'segment') {
      const fromKey = el.fromId || el.startId || el.from || el.start || (Array.isArray(el.parents) ? el.parents[0] : null)
      const toKey = el.toId || el.endId || el.to || el.end || (Array.isArray(el.parents) ? el.parents[1] : null)

      let fromId = pointMap[fromKey] || fromKey
      let toId = pointMap[toKey] || toKey

      if (!fromId && typeof fromKey === 'string') {
        const found = Object.keys(pointMap).find(k => k.toLowerCase() === fromKey.toLowerCase())
        if (found) fromId = pointMap[found]
      }
      if (!toId && typeof toKey === 'string') {
        const found = Object.keys(pointMap).find(k => k.toLowerCase() === toKey.toLowerCase())
        if (found) toId = pointMap[found]
      }

      if (fromId && toId) {
        normalizedOthers.push({
          type: 'segment',
          id: el.id || `seg_${idx}_${Date.now()}`,
          parents: [fromId, toId],
          attributes: {
            strokeColor: el.attributes?.strokeColor || '#3b82f6',
            strokeWidth: el.attributes?.strokeWidth || 2,
            ...(el.attributes || {})
          }
        })
      }
    } else if (normType === 'line') {
      const fromKey = el.fromId || el.startId || el.from || el.start || (Array.isArray(el.parents) ? el.parents[0] : null)
      const toKey = el.toId || el.endId || el.to || el.end || (Array.isArray(el.parents) ? el.parents[1] : null)

      let fromId = pointMap[fromKey] || fromKey
      let toId = pointMap[toKey] || toKey

      if (!fromId && typeof fromKey === 'string') {
        const found = Object.keys(pointMap).find(k => k.toLowerCase() === fromKey.toLowerCase())
        if (found) fromId = pointMap[found]
      }
      if (!toId && typeof toKey === 'string') {
        const found = Object.keys(pointMap).find(k => k.toLowerCase() === toKey.toLowerCase())
        if (found) toId = pointMap[found]
      }

      if (fromId && toId) {
        normalizedOthers.push({
          type: 'line',
          id: el.id || `line_${idx}_${Date.now()}`,
          parents: [fromId, toId],
          attributes: {
            straightFirst: true,
            straightLast: true,
            strokeColor: el.attributes?.strokeColor || '#3b82f6',
            strokeWidth: el.attributes?.strokeWidth || 2,
            ...(el.attributes || {})
          }
        })
      }
    } else if (normType === 'polygon') {
      const rawParents = Array.isArray(el.parents) ? el.parents : (Array.isArray(el.points) ? el.points : [])
      const mappedParents = rawParents.map((pk: any) => {
        if (typeof pk === 'string') return pointMap[pk] || pk
        if (pk && typeof pk === 'object' && pk.id) return pointMap[pk.id] || pk.id
        return pk
      }).filter(Boolean)

      if (mappedParents.length >= 3) {
        normalizedOthers.push({
          type: 'polygon',
          subtype: el.subtype || el.attributes?.subtype,
          id: el.id || `poly_${idx}_${Date.now()}`,
          parents: mappedParents,
          attributes: {
            fillColor: el.attributes?.fillColor || '#3b82f6',
            fillOpacity: el.attributes?.fillOpacity !== undefined ? el.attributes.fillOpacity : 0.1,
            borders: {
              strokeColor: el.attributes?.borders?.strokeColor || el.attributes?.strokeColor || '#3b82f6',
              strokeWidth: el.attributes?.borders?.strokeWidth || el.attributes?.strokeWidth || 2
            },
            ...(el.attributes || {})
          }
        })
      }
    } else if (normType === 'circle') {
      const centerKey = el.centerId || el.center || el.centerPoint || (Array.isArray(el.parents) ? el.parents[0] : null)
      let radOrPointKey = el.radius ?? el.rad ?? el.pointId ?? el.point ?? el.pointOnCircle ?? (Array.isArray(el.parents) ? el.parents[1] : null)

      let centerId = pointMap[centerKey] || centerKey
      let pointId = typeof radOrPointKey === 'string' ? (pointMap[radOrPointKey] || radOrPointKey) : null

      if (!centerId && typeof centerKey === 'string') {
        const found = Object.keys(pointMap).find(k => k.toLowerCase() === centerKey.toLowerCase())
        if (found) centerId = pointMap[found]
      }

      if (typeof radOrPointKey === 'number' || (typeof radOrPointKey === 'string' && !isNaN(Number(radOrPointKey)))) {
        const r = Number(radOrPointKey)
        const centerPt = normalizedPoints.find(p => p.id === centerId)
        if (centerPt) {
          const px = centerPt.parents[0] + r
          const py = centerPt.parents[1]
          const createdPointId = `p_circle_rad_${idx}`
          normalizedPoints.push({
            type: 'point',
            id: createdPointId,
            parents: [px, py],
            attributes: { size: 3, name: '', withLabel: false, showInfobox: false }
          })
          pointId = createdPointId
        }
      }

      if (!pointId && typeof radOrPointKey === 'string') {
        const found = Object.keys(pointMap).find(k => k.toLowerCase() === radOrPointKey.toLowerCase())
        if (found) pointId = pointMap[found]
      }

      if (!pointId && normalizedPoints.length > 1) {
        const otherPoint = normalizedPoints.find(p => p.id !== centerId)
        if (otherPoint) pointId = otherPoint.id
      }

      if (centerId && pointId) {
        normalizedOthers.push({
          type: 'circle',
          id: el.id || `circ_${idx}_${Date.now()}`,
          parents: [centerId, pointId],
          attributes: {
            strokeColor: el.attributes?.strokeColor || '#ef4444',
            strokeWidth: el.attributes?.strokeWidth || 2,
            fillColor: el.attributes?.fillColor || '#ef4444',
            fillOpacity: el.attributes?.fillOpacity || 0.1,
            ...(el.attributes || {})
          }
        })
      }
    } else if (normType === 'functiongraph') {
      const rawExpr = el.parsedFunc || el.func || el.formula || el.expression || ''
      let parsedFunc = rawExpr.toString().replace(/\^/g, '**')
      let isVertical = Boolean(el.isVertical)

      if (parsedFunc.includes('=')) {
        const parts = parsedFunc.split('=')
        const left = parts[0].trim()
        const right = parts.slice(1).join('=').trim()
        if (left === 'x') {
          isVertical = true
          parsedFunc = right
        } else {
          parsedFunc = right
        }
      }

      normalizedOthers.push({
        type: 'functiongraph',
        id: el.id || `fg_${idx}_${Date.now()}`,
        func: rawExpr,
        parsedFunc,
        isVertical,
        attributes: {
          strokeColor: el.attributes?.strokeColor || '#10b981',
          strokeWidth: el.attributes?.strokeWidth || 2,
          ...(el.attributes || {})
        }
      })
    } else if (normType === 'text') {
      let x = el.x ?? el.X ?? (Array.isArray(el.parents) && typeof el.parents[0] === 'number' ? el.parents[0] : 0)
      let y = el.y ?? el.Y ?? (Array.isArray(el.parents) && typeof el.parents[1] === 'number' ? el.parents[1] : 0)
      x = Number(x) || 0
      y = Number(y) || 0
      const textContent = el.text ?? el.content ?? (Array.isArray(el.parents) && typeof el.parents[2] === 'string' ? el.parents[2] : '') ?? el.label ?? el.attributes?.text ?? ''

      normalizedOthers.push({
        type: 'text',
        id: el.id || `txt_${idx}_${Date.now()}`,
        parents: [x, y],
        text: textContent,
        attributes: {
          fontSize: el.attributes?.fontSize || 14,
          strokeColor: el.attributes?.strokeColor || el.attributes?.color || '#1e293b',
          ...(el.attributes || {})
        }
      })
    }
  })

  return [...normalizedPoints, ...normalizedOthers]
}

export function JsxGraphEditorModal({ open, onClose, onConfirm, initialData, initialWidth, initialHeight }: JsxGraphEditorModalProps) {
  const boardRef = useRef<HTMLDivElement>(null)
  const boardInstanceRef = useRef<any>(null)
  const contextMenuHandlerRef = useRef<((e: Event) => void) | null>(null)
  const [board, setBoard] = useState<any>(null)
  const [activeTool, setActiveTool] = useState<ToolType>('point')
  const [width, setWidth] = useState<string>('')
  const [height, setHeight] = useState<string>('')

  // Show / Hide Axis and Grid
  const [showAxes, setShowAxes] = useState<boolean>(true)
  const [showGrid, setShowGrid] = useState<boolean>(true)
  const showAxesRef = useRef<boolean>(true)
  const showGridRef = useRef<boolean>(true)

  useEffect(() => {
    if (open) {
      setWidth(initialWidth || '')
      setHeight(initialHeight || '')
      const initGrid = initialData?.grid !== undefined ? (typeof initialData.grid === 'boolean' ? initialData.grid : !!initialData.grid) : true
      const rawAxes = initialData?.axis !== undefined ? !!initialData.axis : true
      const initAxes = initGrid ? rawAxes : false

      setShowGrid(initGrid)
      setShowAxes(initAxes)
      showGridRef.current = initGrid
      showAxesRef.current = initAxes
    }
  }, [open, initialWidth, initialHeight, initialData])

  // Undo / Redo States
  interface HistoryState {
    elements: any[]
    selectedPointIds: string[]
  }
  const [history, setHistory] = useState<HistoryState[]>([{ elements: [], selectedPointIds: [] }])
  const [historyIndex, setHistoryIndex] = useState(0)
  const historyRef = useRef<HistoryState[]>([{ elements: [], selectedPointIds: [] }])
  const historyIndexRef = useRef<number>(0)

  // Edit Coordinate Modal State
  const [editingPoint, setEditingPoint] = useState<{ id: string, x: string, y: string, name: string } | null>(null)

  // Function Tool State
  const [funcInput, setFuncInput] = useState<string>('')
  const [editingFunctionId, setEditingFunctionId] = useState<string | null>(null)
  const mfRef = useRef<any>(null)
  const [errorModal, setErrorModal] = useState<string | null>(null)

  // Ghost Intersection Point State
  const [selectedGhostPoint, setSelectedGhostPoint] = useState<{ x: number, y: number, scrX: number, scrY: number } | null>(null)

  const isReadyRef = useRef(false)
  const selectedPointsRef = useRef<any[]>([])
  const dragStartSnapshotRef = useRef<string | null>(null)
  const isDraggingRef = useRef<boolean>(false)

  // Init Board
  useEffect(() => {
    if (!open) {
      if (contextMenuHandlerRef.current) {
        document.removeEventListener('contextmenu', contextMenuHandlerRef.current, true)
      }
      if (boardInstanceRef.current) {
        try { JXG.JSXGraph.freeBoard(boardInstanceRef.current) } catch (e) { }
        boardInstanceRef.current = null
      } else if (boardRef.current && (JXG.JSXGraph as any).boards?.[boardRef.current.id]) {
        try { JXG.JSXGraph.freeBoard((JXG.JSXGraph as any).boards[boardRef.current.id]) } catch (e) { }
      }
      setBoard(null)
      const emptyState = [{ elements: [], selectedPointIds: [] }]
      historyRef.current = emptyState
      historyIndexRef.current = 0
      setHistory(emptyState)
      setHistoryIndex(0)
      selectedPointsRef.current = []
      isReadyRef.current = false
      setEditingPoint(null)
      return
    }

    setTimeout(() => {
      if (boardRef.current) {
        if (initialData && initialData.elements) {
          const normalizedElements = normalizeCanvasElements(initialData.elements)
          const startingState = { elements: normalizedElements, selectedPointIds: [] };
          const startingHist = [startingState];
          historyRef.current = startingHist;
          historyIndexRef.current = 0;
          setHistory(startingHist);
          setHistoryIndex(0);
          initBoardWithState(startingState);
        } else {
          const emptyHist = [{ elements: [], selectedPointIds: [] }];
          historyRef.current = emptyHist;
          historyIndexRef.current = 0;
          setHistory(emptyHist);
          setHistoryIndex(0);
          initBoardWithState({ elements: [], selectedPointIds: [] })
        }
        isReadyRef.current = true
      }
    }, 100)

    return () => {
      if (contextMenuHandlerRef.current) {
        document.removeEventListener('contextmenu', contextMenuHandlerRef.current, true)
      }
      if (boardInstanceRef.current) {
        try { JXG.JSXGraph.freeBoard(boardInstanceRef.current) } catch (e) { }
        boardInstanceRef.current = null
      } else if (boardRef.current && (JXG.JSXGraph as any).boards?.[boardRef.current.id]) {
        try { JXG.JSXGraph.freeBoard((JXG.JSXGraph as any).boards[boardRef.current.id]) } catch (e) { }
      }
    }
  }, [open, initialData])

  const initBoardWithState = (state: HistoryState) => {
    if (contextMenuHandlerRef.current) {
      document.removeEventListener('contextmenu', contextMenuHandlerRef.current, true)
    }

    if (boardInstanceRef.current) {
      try {
        JXG.JSXGraph.freeBoard(boardInstanceRef.current)
      } catch (e) { }
      boardInstanceRef.current = null
    } else if (boardRef.current && (JXG.JSXGraph as any).boards?.[boardRef.current.id]) {
      try {
        JXG.JSXGraph.freeBoard((JXG.JSXGraph as any).boards[boardRef.current.id])
      } catch (e) { }
    }

    if (!boardRef.current) return

    const b = JXG.JSXGraph.initBoard(boardRef.current.id, {
      boundingbox: [-5, 5, 5, -5],
      axis: true,
      grid: { majorStep: 1 },
      defaultAxes: {
        x: { ticks: { ticksDistance: 1, insertTicks: false, label: { autoPosition: true } } },
        y: { ticks: { ticksDistance: 1, insertTicks: false, label: { autoPosition: true } } }
      },
      keepaspectratio: true,
      resize: { enabled: true, throttle: 200 },
      showNavigation: true,
      showCopyright: false,
      showInfobox: true,
      pan: { enabled: true, needShift: true, needTwoFingers: false },
      zoom: { wheel: true, needShift: false },
      keyboard: { enabled: false }
    } as any)

    // Apply axes and grid visibility
    const currentGrid = showGridRef.current
    const currentAxes = currentGrid && showAxesRef.current

    if (b.defaultAxes) {
      if (b.defaultAxes.x) {
        (b.defaultAxes.x as any).setAttribute({ visible: currentAxes });
        if (currentAxes) (b.defaultAxes.x as any).showElement?.();
        else (b.defaultAxes.x as any).hideElement?.();
      }
      if (b.defaultAxes.y) {
        (b.defaultAxes.y as any).setAttribute({ visible: currentAxes });
        if (currentAxes) (b.defaultAxes.y as any).showElement?.();
        else (b.defaultAxes.y as any).hideElement?.();
      }
    }
    if (b.grids) {
      if (Array.isArray(b.grids)) {
        b.grids.forEach((g: any) => {
          g?.setAttribute?.({ visible: currentGrid });
          if (currentGrid) g?.showElement?.();
          else g?.hideElement?.();
        });
      } else {
        Object.values(b.grids).forEach((g: any) => {
          (g as any)?.setAttribute?.({ visible: currentGrid });
          if (currentGrid) (g as any)?.showElement?.();
          else (g as any)?.hideElement?.();
        });
      }
    }
    if (b.objectsList) {
      b.objectsList.forEach((obj: any) => {
        if (obj.elType === 'grid') {
          obj.setAttribute({ visible: currentGrid });
          if (currentGrid) obj.showElement?.();
          else obj.hideElement?.();
        }
      });
    }

    // Custom right-click panning
    let isPanning = false;
    let lastX = 0, lastY = 0;

    b.on('down', (e: any) => {
      if (e.button === 2) {
        isPanning = true;
        lastX = e.clientX || e.touches?.[0]?.clientX || 0;
        lastY = e.clientY || e.touches?.[0]?.clientY || 0;
      }
    });

    b.on('move', (e: any) => {
      if (isPanning) {
        const cx = e.clientX || e.touches?.[0]?.clientX || 0;
        const cy = e.clientY || e.touches?.[0]?.clientY || 0;
        const dx = cx - lastX;
        const dy = cy - lastY;
        lastX = cx;
        lastY = cy;

        b.moveOrigin(b.origin.scrCoords[1] + dx, b.origin.scrCoords[2] + dy);
      }
    });

    b.on('up', (e: any) => {
      if (e.button === 2) {
        isPanning = false;
      }
    });

    // Prevent context menu aggressively using capture phase on document
    const preventContext = (e: Event) => {
      const mouseEvent = e as MouseEvent;
      if (boardRef.current && mouseEvent.clientX !== undefined) {
        const rect = boardRef.current.getBoundingClientRect();
        if (
          mouseEvent.clientX >= rect.left &&
          mouseEvent.clientX <= rect.right &&
          mouseEvent.clientY >= rect.top &&
          mouseEvent.clientY <= rect.bottom
        ) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    };
    document.addEventListener('contextmenu', preventContext, true);
    contextMenuHandlerRef.current = preventContext;

    // Add Vietnamese tooltips to navigation buttons
    setTimeout(() => {
      if (boardRef.current) {
        const tooltips: Record<string, string> = {
          'in': 'Phóng to',
          'out': 'Thu nhỏ',
          '100': 'Mặc định',
          'left': 'Sang trái',
          'right': 'Sang phải',
          'up': 'Lên trên',
          'down': 'Xuống dưới',
          'fullscreen': 'Toàn màn hình',
          'reload': 'Tải lại',
          'screenshot': 'Chụp ảnh màn hình',
          'cleartraces': 'Xóa dấu vết'
        }
        Object.entries(tooltips).forEach(([key, text]) => {
          const el = boardRef.current?.querySelector(`.JXG_navigation_button_${key}`)
          if (el) el.setAttribute('title', text)
        })
      }
    }, 50)

    const newPointMap: any = {}

    // 1. Create all points as draggable free points
    state.elements.forEach(el => {
      if (el.type === 'point') {
        const attrs = el.attributes || { size: 4, name: '', withLabel: false, showInfobox: true, highlight: true }
        const p = b.create('point', el.parents, { ...attrs, id: el.id })
        newPointMap[el.id] = p
        if (attrs.name) newPointMap[attrs.name] = p
      }
    })

    // 2. Attach bi-directional geometric constraints for special polygons (enables dragging ANY vertex)
    state.elements.forEach(el => {
      if (el.type === 'polygon' && el.subtype && Array.isArray(el.parents) && el.parents.length >= 4) {
        const pA = newPointMap[el.parents[0]]
        const pB = newPointMap[el.parents[1]]
        const pC = newPointMap[el.parents[2]]
        const pD = newPointMap[el.parents[3]]

        if (pA && pB && pC && pD) {
          if (el.subtype === 'square') {
            attachSquareConstraints(pA, pB, pC, pD, b)
          } else if (el.subtype === 'rectangle') {
            attachRectangleConstraints(pA, pB, pC, pD, b)
          } else if (el.subtype === 'rhombus') {
            attachRhombusConstraints(pA, pB, pC, pD, b)
          } else if (el.subtype === 'parallelogram') {
            attachParallelogramConstraints(pA, pB, pC, pD, b)
          }
        }
      }
    })

    // 4. Create geometric objects & shapes
    state.elements.forEach(el => {
      if (el.type === 'segment') {
        if (newPointMap[el.parents[0]] && newPointMap[el.parents[1]]) {
          const attrs = { strokeColor: '#3b82f6', strokeWidth: 2, ...(el.attributes || {}) }
          if (el.id) attrs.id = el.id
          b.create('segment', [newPointMap[el.parents[0]], newPointMap[el.parents[1]]], attrs)
        }
      } else if (el.type === 'line') {
        if (newPointMap[el.parents[0]] && newPointMap[el.parents[1]]) {
          const attrs = { straightFirst: true, straightLast: true, strokeColor: '#3b82f6', strokeWidth: 2, ...(el.attributes || {}) }
          if (el.id) attrs.id = el.id
          b.create('line', [newPointMap[el.parents[0]], newPointMap[el.parents[1]]], attrs)
        }
      } else if (el.type === 'polygon') {
        const polyPoints = (el.parents || []).map((pid: string) => newPointMap[pid]).filter(Boolean)
        if (polyPoints.length >= 3) {
          const attrs = {
            fillColor: '#3b82f6',
            fillOpacity: 0.1,
            borders: { strokeColor: '#3b82f6', strokeWidth: 2 },
            ...(el.attributes || {})
          }
          if (el.id) attrs.id = el.id
          b.create('polygon', polyPoints, attrs)
        }
      } else if (el.type === 'circle') {
        if (newPointMap[el.parents[0]] && newPointMap[el.parents[1]]) {
          const attrs = { strokeColor: '#ef4444', strokeWidth: 2, fillColor: '#ef4444', fillOpacity: 0.1, ...(el.attributes || {}) }
          if (el.id) attrs.id = el.id
          b.create('circle', [newPointMap[el.parents[0]], newPointMap[el.parents[1]]], attrs)
        }
      } else if (el.type === 'functiongraph') {
        let fg;
        const attrs = { ...(el.attributes || { strokeColor: '#10b981', strokeWidth: 2 }) }
        if (el.id) attrs.id = el.id

        if (el.isVertical) {
          const num = parseFloat(el.parsedFunc);
          if (!isNaN(num) && num.toString() === el.parsedFunc.trim()) {
            fg = b.create('line', [[num, 0], [num, 1]], attrs);
          } else {
            let fn: any;
            if (b.jc) {
              fn = b.jc.snippet(el.parsedFunc, true, 'y');
            } else {
              const safeFuncStr = el.parsedFunc.replace(/\^/g, '**');
              fn = new Function('y', `return ${safeFuncStr}`);
            }
            fg = b.create('curve', [
              (y: number) => fn(y),
              (y: number) => y,
              () => b.getBoundingBox()[3],
              () => b.getBoundingBox()[1]
            ], attrs);
          }
        } else {
          let fn: any;
          if (b.jc) {
            fn = b.jc.snippet(el.parsedFunc || el.func, true, 'x');
          } else {
            const safeFuncStr = (el.parsedFunc || el.func).replace(/\^/g, '**');
            fn = new Function('x', `return ${safeFuncStr}`);
          }
          fg = b.create('functiongraph', [fn], attrs);
        }
      } else if (el.type === 'text') {
        const textId = el.id;
        const getHtmlContent = () => {
          const currentVal = escapeHtml(el.text || '');
          return `
            <div style="display:inline-flex;align-items:center;background:#ffffff;border:1.5px solid #3b82f6;border-radius:6px;padding:3px 6px;box-shadow:0 2px 8px rgba(0,0,0,0.15);pointer-events:auto;user-select:text;">
              <input
                id="inp_${textId}"
                type="text"
                value="${currentVal}"
                placeholder="Nhập chữ..."
                style="border:none;outline:none;background:transparent;font-size:13px;font-weight:500;color:#1e293b;min-width:60px;max-width:200px;cursor:text;pointer-events:auto;user-select:text;"
                onpointerdown="event.stopPropagation()"
                onmousedown="event.stopPropagation()"
                ontouchstart="event.stopPropagation()"
                onclick="event.stopPropagation(); this.focus();"
                onkeydown="event.stopPropagation()"
                onkeyup="event.stopPropagation()"
                oninput="event.stopPropagation(); if(window.__jxg_update_text) window.__jxg_update_text('${textId}', this.value); this.style.width = Math.max(60, Math.min(200, this.value.length * 8 + 16)) + 'px';"
              />
              <button
                id="del_${textId}"
                type="button"
                title="Xóa ô chữ"
                style="border:none;background:transparent;color:#94a3b8;cursor:pointer;padding:0 3px;font-size:16px;line-height:1;font-weight:bold;display:inline-flex;align-items:center;justify-content:center;pointer-events:auto;"
                onmouseover="this.style.color='#ef4444'"
                onmouseout="this.style.color='#94a3b8'"
                onpointerdown="event.stopPropagation()"
                onmousedown="event.stopPropagation()"
                ontouchstart="event.stopPropagation()"
                onclick="event.stopPropagation(); event.preventDefault(); if(window.__jxg_delete_text) window.__jxg_delete_text('${textId}');"
              >&times;</button>
            </div>
          `;
        };

        const txt: any = b.create('text', [el.parents[0], el.parents[1], getHtmlContent], {
          id: el.id,
          fixed: false,
          highlight: false,
          display: 'html',
          parse: false,
          useMathJax: false,
          useKatex: false,
          anchorX: 'left',
          anchorY: 'middle'
        });

        if (txt && txt.rendNode) {
          txt.rendNode.style.pointerEvents = 'auto';
          txt.rendNode.style.zIndex = '50';
          txt.rendNode.style.userSelect = 'text';
        }
      }
    })

    setBoard(b)

    // Attach event listeners for text inputs and delete buttons
    setTimeout(() => {
      state.elements.forEach(el => {
        if (el.type === 'text') {
          const inputEl = document.getElementById(`inp_${el.id}`) as HTMLInputElement;
          const delBtn = document.getElementById(`del_${el.id}`) as HTMLButtonElement;

          if (inputEl) {
            inputEl.onpointerdown = (e) => e.stopPropagation();
            inputEl.onmousedown = (e) => e.stopPropagation();
            inputEl.ontouchstart = (e) => e.stopPropagation();
            inputEl.onkeydown = (e) => e.stopPropagation();
            inputEl.onkeyup = (e) => e.stopPropagation();
            inputEl.onclick = (e) => {
              e.stopPropagation();
              inputEl.focus();
            };
            inputEl.oninput = (e: any) => {
              e.stopPropagation();
              const val = e.target.value;
              el.text = val;
              inputEl.style.width = Math.max(60, Math.min(200, val.length * 8 + 16)) + 'px';
            };

            if (!el.text) {
              inputEl.focus();
            }
          }

          if (delBtn) {
            delBtn.onpointerdown = (e) => e.stopPropagation();
            delBtn.onmousedown = (e) => e.stopPropagation();
            delBtn.ontouchstart = (e) => e.stopPropagation();
            delBtn.onclick = (e) => {
              e.stopPropagation();
              e.preventDefault();
              handleDeleteText(el.id);
            };
          }
        }
      });
    }, 50);

    // Ghost Points
    const ghostPoints = findIntersections(b, state.elements);
    ghostPoints.forEach(p => {
      const gp = b.create('point', [p.x, p.y], {
        name: '',
        size: 3,
        fillColor: '#94a3b8',
        strokeColor: '#e2e8f0',
        strokeWidth: 1,
        fixed: true,
        showInfobox: false,
        highlightFillColor: '#3b82f6',
        highlightStrokeColor: '#3b82f6'
      });

      gp.on('down', (e: any) => {
        const scrCoords = b.getMousePosition(e);
        setSelectedGhostPoint({ x: p.x, y: p.y, scrX: scrCoords[0], scrY: scrCoords[1] });
      });
    });

    // Restore selected points references for tools
    selectedPointsRef.current = state.selectedPointIds
      .map(id => b.objects[id])
      .filter(Boolean)

    boardInstanceRef.current = b
    setBoard(b)
  }

  const getCurrentElements = () => {
    const currentHist = historyRef.current;
    const currentIdx = historyIndexRef.current;
    const current = currentHist[currentIdx] || { elements: [], selectedPointIds: [] };

    return (current.elements || []).map(el => {
      if (el.type === 'point' && board && board.objects[el.id]) {
        const pObj = board.objects[el.id];
        const nx = typeof pObj.X === 'function' ? pObj.X() : (pObj.coords ? pObj.coords.usrCoords[1] : el.parents[0]);
        const ny = typeof pObj.Y === 'function' ? pObj.Y() : (pObj.coords ? pObj.coords.usrCoords[2] : el.parents[1]);
        return {
          ...el,
          parents: [Math.round(nx * 100) / 100, Math.round(ny * 100) / 100]
        };
      }
      if (el.type === 'text') {
        const inputEl = document.getElementById(`inp_${el.id}`) as HTMLInputElement;
        if (inputEl) {
          return { ...el, text: inputEl.value };
        }
      }
      return el;
    });
  };

  const saveHistory = (newElements: any[], overrideSelectedPoints?: any[]) => {
    const selectedPoints = overrideSelectedPoints || selectedPointsRef.current
    const newState: HistoryState = {
      elements: newElements,
      selectedPointIds: selectedPoints.map(p => p.id)
    }
    const newHistory = historyRef.current.slice(0, historyIndexRef.current + 1)
    newHistory.push(newState)
    const newIndex = newHistory.length - 1

    historyRef.current = newHistory
    historyIndexRef.current = newIndex
    setHistory(newHistory)
    setHistoryIndex(newIndex)
  }

  const handleUndo = () => {
    if (historyIndexRef.current > 0) {
      const prevIndex = historyIndexRef.current - 1
      historyIndexRef.current = prevIndex
      setHistoryIndex(prevIndex)
      initBoardWithState(historyRef.current[prevIndex])
    }
  }

  const handleRedo = () => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      const nextIndex = historyIndexRef.current + 1
      historyIndexRef.current = nextIndex
      setHistoryIndex(nextIndex)
      initBoardWithState(historyRef.current[nextIndex])
    }
  }

  // Board interactions
  useEffect(() => {
    if (!board || !isReadyRef.current) return

    const handleDown = (e: any) => {
      if (selectedGhostPoint) {
        setSelectedGhostPoint(null);
      }

      const isRightClick = e.button === 2 || e.type === 'contextmenu'
      const usrCoords = board.getUsrCoordsOfMouse(e)
      const scrCoords = board.getMousePosition(e)

      if (isRightClick) {
        // Find if clicked on a point
        for (const el in board.objects) {
          if (board.objects[el].elType === 'point' && board.objects[el].hasPoint(scrCoords[0], scrCoords[1])) {
            const p = board.objects[el]
            setEditingPoint({ id: p.id, x: p.coords.usrCoords[1].toFixed(2), y: p.coords.usrCoords[2].toFixed(2), name: p.name || '' })
            return
          }
        }
        return
      }

      if (activeTool === 'select') {
        dragStartSnapshotRef.current = JSON.stringify(getCurrentElements())
        isDraggingRef.current = true
        return
      }

      const rx = Math.round(usrCoords[0] * 100) / 100
      const ry = Math.round(usrCoords[1] * 100) / 100

      const currentElements = getCurrentElements()

      if (activeTool === 'point') {
        let clickedPoint: any = null
        for (const el in board.objects) {
          if (board.objects[el].elType === 'point' && board.objects[el].hasPoint(scrCoords[0], scrCoords[1])) {
            if (currentElements.some((ce: any) => ce.id === board.objects[el].id)) {
              clickedPoint = board.objects[el]
              break
            }
          }
        }
        if (clickedPoint) return // Do not create a new point over an existing user point

        const nextName = getNextPointName(currentElements, rx, ry);
        const attrs = { size: 4, name: nextName, withLabel: true, showInfobox: true, highlight: true }
        const p = board.create('point', [rx, ry], attrs)
        saveHistory([...currentElements, { type: 'point', parents: [rx, ry], id: p.id, attributes: attrs }])
      } else if (['segment', 'line', 'circle', 'triangle', 'square', 'rectangle', 'rhombus', 'parallelogram'].includes(activeTool)) {
        let clickedPoint: any = null
        for (const el in board.objects) {
          if (board.objects[el].elType === 'point' && board.objects[el].hasPoint(scrCoords[0], scrCoords[1])) {
            if (currentElements.some((ce: any) => ce.id === board.objects[el].id)) {
              clickedPoint = board.objects[el]
              break
            }
          }
        }

        let addedNewPoint = false
        let pointAttrs: any = null
        if (!clickedPoint) {
          const nextName = getNextPointName(currentElements, rx, ry);
          pointAttrs = { size: 4, name: nextName, withLabel: true, showInfobox: true, highlight: true }
          clickedPoint = board.create('point', [rx, ry], pointAttrs)
          addedNewPoint = true
        }

        selectedPointsRef.current.push(clickedPoint)

        let nextElements = [...currentElements]
        if (addedNewPoint) {
          nextElements.push({ type: 'point', parents: [rx, ry], id: clickedPoint.id, attributes: pointAttrs })
        }

        const requiredPoints = (activeTool === 'segment' || activeTool === 'line' || activeTool === 'circle' || activeTool === 'square') ? 2 : 3

        if (selectedPointsRef.current.length === requiredPoints) {
          const pts = selectedPointsRef.current

          if (activeTool === 'segment') {
            const lineAttrs = { strokeColor: '#3b82f6', strokeWidth: 2 }
            board.create('segment', [pts[0], pts[1]], lineAttrs)
            nextElements.push({ type: 'segment', parents: [pts[0].id, pts[1].id], attributes: lineAttrs })
          } else if (activeTool === 'line') {
            const lineAttrs = { straightFirst: true, straightLast: true, strokeColor: '#3b82f6', strokeWidth: 2 }
            board.create('line', [pts[0], pts[1]], lineAttrs)
            nextElements.push({ type: 'line', parents: [pts[0].id, pts[1].id], attributes: lineAttrs })
          } else if (activeTool === 'circle') {
            const circleAttrs = { strokeColor: '#ef4444', strokeWidth: 2, fillColor: '#ef4444', fillOpacity: 0.1 }
            board.create('circle', [pts[0], pts[1]], circleAttrs)
            nextElements.push({ type: 'circle', parents: [pts[0].id, pts[1].id], attributes: circleAttrs })
          } else if (activeTool === 'triangle') {
            const polyAttrs = { fillColor: '#3b82f6', fillOpacity: 0.1, borders: { strokeColor: '#3b82f6', strokeWidth: 2 } }
            board.create('polygon', [pts[0], pts[1], pts[2]], polyAttrs)
            nextElements.push({ type: 'polygon', subtype: 'triangle', parents: [pts[0].id, pts[1].id, pts[2].id], attributes: polyAttrs })
          } else if (activeTool === 'square') {
            const p1 = pts[0], p2 = pts[1]
            const p1X = Math.round((typeof p1.X === 'function' ? p1.X() : p1.coords.usrCoords[1]) * 100) / 100
            const p1Y = Math.round((typeof p1.Y === 'function' ? p1.Y() : p1.coords.usrCoords[2]) * 100) / 100
            const p2X = Math.round((typeof p2.X === 'function' ? p2.X() : p2.coords.usrCoords[1]) * 100) / 100
            const p2Y = Math.round((typeof p2.Y === 'function' ? p2.Y() : p2.coords.usrCoords[2]) * 100) / 100

            const { p3x, p3y, p4x, p4y } = calculateSquareVertices(p1X, p1Y, p2X, p2Y)

            const name3 = getNextPointName(nextElements, p3x, p3y)
            const p3Id = generateElementId('p')
            const p3Attrs = { size: 4, name: name3, withLabel: true, showInfobox: true, highlight: true }
            nextElements.push({ type: 'point', parents: [p3x, p3y], id: p3Id, attributes: p3Attrs })

            const name4 = getNextPointName(nextElements, p4x, p4y)
            const p4Id = generateElementId('p')
            const p4Attrs = { size: 4, name: name4, withLabel: true, showInfobox: true, highlight: true }
            nextElements.push({ type: 'point', parents: [p4x, p4y], id: p4Id, attributes: p4Attrs })

            const polyAttrs = { fillColor: '#3b82f6', fillOpacity: 0.1, borders: { strokeColor: '#3b82f6', strokeWidth: 2 } }
            nextElements.push({ type: 'polygon', subtype: 'square', parents: [p1.id, p2.id, p3Id, p4Id], attributes: polyAttrs })
          } else if (activeTool === 'rectangle') {
            const p1 = pts[0], p2 = pts[1], p3Raw = pts[2]
            const p1X = Math.round((typeof p1.X === 'function' ? p1.X() : p1.coords.usrCoords[1]) * 100) / 100
            const p1Y = Math.round((typeof p1.Y === 'function' ? p1.Y() : p1.coords.usrCoords[2]) * 100) / 100
            const p2X = Math.round((typeof p2.X === 'function' ? p2.X() : p2.coords.usrCoords[1]) * 100) / 100
            const p2Y = Math.round((typeof p2.Y === 'function' ? p2.Y() : p2.coords.usrCoords[2]) * 100) / 100
            const p3RawX = Math.round((typeof p3Raw.X === 'function' ? p3Raw.X() : p3Raw.coords.usrCoords[1]) * 100) / 100
            const p3RawY = Math.round((typeof p3Raw.Y === 'function' ? p3Raw.Y() : p3Raw.coords.usrCoords[2]) * 100) / 100

            const { p3x, p3y, p4x, p4y } = calculateRectangleVertices(p1X, p1Y, p2X, p2Y, p3RawX, p3RawY)

            const p3Id = p3Raw.id || generateElementId('p')
            const p3Idx = nextElements.findIndex(e => e.id === p3Id)
            if (p3Idx !== -1) {
              nextElements[p3Idx] = { ...nextElements[p3Idx], parents: [p3x, p3y] }
            }

            const name4 = getNextPointName(nextElements, p4x, p4y)
            const p4Id = generateElementId('p')
            const p4Attrs = { size: 4, name: name4, withLabel: true, showInfobox: true, highlight: true }
            nextElements.push({ type: 'point', parents: [p4x, p4y], id: p4Id, attributes: p4Attrs })

            const polyAttrs = { fillColor: '#3b82f6', fillOpacity: 0.1, borders: { strokeColor: '#3b82f6', strokeWidth: 2 } }
            nextElements.push({ type: 'polygon', subtype: 'rectangle', parents: [p1.id, p2.id, p3Id, p4Id], attributes: polyAttrs })
          } else if (activeTool === 'rhombus') {
            const p1 = pts[0], p2 = pts[1], p3Raw = pts[2]
            const p1X = Math.round((typeof p1.X === 'function' ? p1.X() : p1.coords.usrCoords[1]) * 100) / 100
            const p1Y = Math.round((typeof p1.Y === 'function' ? p1.Y() : p1.coords.usrCoords[2]) * 100) / 100
            const p2X = Math.round((typeof p2.X === 'function' ? p2.X() : p2.coords.usrCoords[1]) * 100) / 100
            const p2Y = Math.round((typeof p2.Y === 'function' ? p2.Y() : p2.coords.usrCoords[2]) * 100) / 100
            const p3RawX = Math.round((typeof p3Raw.X === 'function' ? p3Raw.X() : p3Raw.coords.usrCoords[1]) * 100) / 100
            const p3RawY = Math.round((typeof p3Raw.Y === 'function' ? p3Raw.Y() : p3Raw.coords.usrCoords[2]) * 100) / 100

            const { p3x, p3y, p4x, p4y } = calculateRhombusVertices(p1X, p1Y, p2X, p2Y, p3RawX, p3RawY)

            const p3Id = p3Raw.id
            const p3Idx = nextElements.findIndex(e => e.id === p3Id)
            if (p3Idx !== -1) {
              nextElements[p3Idx] = { ...nextElements[p3Idx], parents: [p3x, p3y] }
            }

            const name4 = getNextPointName(nextElements, p4x, p4y)
            const p4Id = generateElementId('p')
            const p4Attrs = { size: 4, name: name4, withLabel: true, showInfobox: true, highlight: true }
            nextElements.push({ type: 'point', parents: [p4x, p4y], id: p4Id, attributes: p4Attrs })

            const polyAttrs = { fillColor: '#3b82f6', fillOpacity: 0.1, borders: { strokeColor: '#3b82f6', strokeWidth: 2 } }
            nextElements.push({ type: 'polygon', subtype: 'rhombus', parents: [p1.id, p2.id, p3Id, p4Id], attributes: polyAttrs })
          } else if (activeTool === 'parallelogram') {
            const p1 = pts[0], p2 = pts[1], p3 = pts[2]
            const p1X = Math.round((typeof p1.X === 'function' ? p1.X() : p1.coords.usrCoords[1]) * 100) / 100
            const p1Y = Math.round((typeof p1.Y === 'function' ? p1.Y() : p1.coords.usrCoords[2]) * 100) / 100
            const p2X = Math.round((typeof p2.X === 'function' ? p2.X() : p2.coords.usrCoords[1]) * 100) / 100
            const p2Y = Math.round((typeof p2.Y === 'function' ? p2.Y() : p2.coords.usrCoords[2]) * 100) / 100
            const p3X = Math.round((typeof p3.X === 'function' ? p3.X() : p3.coords.usrCoords[1]) * 100) / 100
            const p3Y = Math.round((typeof p3.Y === 'function' ? p3.Y() : p3.coords.usrCoords[2]) * 100) / 100

            const { p4x, p4y } = calculateParallelogramVertices(p1X, p1Y, p2X, p2Y, p3X, p3Y)
            const name4 = getNextPointName(nextElements, p4x, p4y)
            const p4Id = generateElementId('p')
            const p4Attrs = { size: 4, name: name4, withLabel: true, showInfobox: true, highlight: true }
            nextElements.push({ type: 'point', parents: [p4x, p4y], id: p4Id, attributes: p4Attrs })

            const polyAttrs = { fillColor: '#3b82f6', fillOpacity: 0.1, borders: { strokeColor: '#3b82f6', strokeWidth: 2 } }
            nextElements.push({ type: 'polygon', subtype: 'parallelogram', parents: [p1.id, p2.id, p3.id, p4Id], attributes: polyAttrs })
          }

          selectedPointsRef.current = []
          saveHistory(nextElements, [])
          initBoardWithState({ elements: nextElements, selectedPointIds: [] })
          setActiveTool('select')
        } else {
          saveHistory(nextElements)
        }
      }
    }

    const handleUp = () => {
      if (activeTool === 'select' && isDraggingRef.current) {
        isDraggingRef.current = false
        const currentElements = getCurrentElements()
        const newSnapshot = JSON.stringify(currentElements)
        if (dragStartSnapshotRef.current && newSnapshot !== dragStartSnapshotRef.current) {
          saveHistory(currentElements)
        }
        dragStartSnapshotRef.current = null
      }
    }

    board.on('down', handleDown)
    board.on('up', handleUp)

    // Prevent default context menu
    const div = boardRef.current
    const preventContext = (e: Event) => e.preventDefault()
    if (div) {
      div.addEventListener('contextmenu', preventContext)
    }

    return () => {
      board.off('down', handleDown)
      board.off('up', handleUp)
      if (div) div.removeEventListener('contextmenu', preventContext)
    }
  }, [board, activeTool])

  const handleEditCoordinateSave = () => {
    if (!editingPoint) return
    const nx = parseFloat(editingPoint.x)
    const ny = parseFloat(editingPoint.y)

    if (isNaN(nx) || isNaN(ny)) {
      setEditingPoint(null)
      return
    }

    const currentElements = getCurrentElements()
    let nextElements = currentElements.map(el => {
      if (el.id === editingPoint.id) {
        return { ...el, parents: [nx, ny], attributes: { ...el.attributes, name: editingPoint.name, withLabel: !!editingPoint.name } }
      }
      return el
    })

    nextElements = enforcePolygonConstraints(nextElements, editingPoint.id)

    setEditingPoint(null)
    saveHistory(nextElements)
    initBoardWithState({ elements: nextElements, selectedPointIds: historyRef.current[historyIndexRef.current].selectedPointIds })
  }

  const handleDeletePoint = () => {
    if (!editingPoint) return
    const id = editingPoint.id

    const currentElements = getCurrentElements()
    const nextElements = currentElements.filter(el => {
      if (el.id === id) return false;
      if (el.parents && el.parents.includes(id)) return false;
      return true;
    });

    setEditingPoint(null)
    const nextSelected = historyRef.current[historyIndexRef.current].selectedPointIds.filter(pid => pid !== id)
    saveHistory(nextElements, nextSelected)
    initBoardWithState({ elements: nextElements, selectedPointIds: nextSelected })
  }

  const handleDeleteText = (id: string) => {
    const currentElements = getCurrentElements();
    const nextElements = currentElements.filter(el => el.id !== id);

    const currentHist = historyRef.current;
    const currentIdx = historyIndexRef.current;
    const current = currentHist[currentIdx] || { elements: [], selectedPointIds: [] };

    const newState: HistoryState = {
      elements: nextElements,
      selectedPointIds: current.selectedPointIds.filter(pid => pid !== id)
    };

    const newHistory = currentHist.slice(0, currentIdx + 1);
    newHistory.push(newState);
    const newIndex = newHistory.length - 1;

    historyRef.current = newHistory;
    historyIndexRef.current = newIndex;
    setHistory(newHistory);
    setHistoryIndex(newIndex);

    initBoardWithState(newState);
  };

  useEffect(() => {
    (window as any).__jxg_update_text = (id: string, val: string) => {
      const current = historyRef.current[historyIndexRef.current];
      if (current && current.elements) {
        const el = current.elements.find((e: any) => e.id === id);
        if (el) {
          el.text = val;
        }
      }
    };

    (window as any).__jxg_delete_text = (id: string) => {
      handleDeleteText(id);
    };

    return () => {
      delete (window as any).__jxg_update_text;
      delete (window as any).__jxg_delete_text;
    };
  }, []);

  const handlePinGhostPoint = (x: number, y: number) => {
    const currentElements = getCurrentElements();
    const nextName = getNextPointName(currentElements, x, y);
    const attrs = { size: 4, name: nextName, withLabel: true, showInfobox: true, highlight: true };
    const nextElements = [...currentElements, { type: 'point', parents: [x, y], id: `p-${Date.now()}`, attributes: attrs }];

    saveHistory(nextElements);
    setSelectedGhostPoint(null);
    initBoardWithState({ elements: nextElements, selectedPointIds: historyRef.current[historyIndexRef.current].selectedPointIds });
  };

  const handleToggleAxes = () => {
    if (!showGrid) return;
    const nextVal = !showAxes;
    setShowAxes(nextVal);
    showAxesRef.current = nextVal;
    if (board && board.defaultAxes) {
      if (board.defaultAxes.x) {
        (board.defaultAxes.x as any).setAttribute({ visible: nextVal });
        if (nextVal) (board.defaultAxes.x as any).showElement?.();
        else (board.defaultAxes.x as any).hideElement?.();
      }
      if (board.defaultAxes.y) {
        (board.defaultAxes.y as any).setAttribute({ visible: nextVal });
        if (nextVal) (board.defaultAxes.y as any).showElement?.();
        else (board.defaultAxes.y as any).hideElement?.();
      }
      board.fullUpdate();
    }
  };

  const handleToggleGrid = () => {
    const nextGrid = !showGrid;
    setShowGrid(nextGrid);
    showGridRef.current = nextGrid;

    if (!nextGrid) {
      setShowAxes(false);
      showAxesRef.current = false;
    }

    if (board) {
      if (board.grids) {
        if (Array.isArray(board.grids)) {
          board.grids.forEach((g: any) => {
            g?.setAttribute?.({ visible: nextGrid });
            if (nextGrid) g?.showElement?.();
            else g?.hideElement?.();
          });
        } else {
          Object.values(board.grids).forEach((g: any) => {
            (g as any)?.setAttribute?.({ visible: nextGrid });
            if (nextGrid) (g as any)?.showElement?.();
            else (g as any)?.hideElement?.();
          });
        }
      }
      if (board.objectsList) {
        board.objectsList.forEach((obj: any) => {
          if (obj.elType === 'grid') {
            obj.setAttribute({ visible: nextGrid });
            if (nextGrid) obj.showElement?.();
            else obj.hideElement?.();
          }
        });
      }
      if (!nextGrid && board.defaultAxes) {
        if (board.defaultAxes.x) {
          (board.defaultAxes.x as any).setAttribute({ visible: false });
          (board.defaultAxes.x as any).hideElement?.();
        }
        if (board.defaultAxes.y) {
          (board.defaultAxes.y as any).setAttribute({ visible: false });
          (board.defaultAxes.y as any).hideElement?.();
        }
      }
      board.fullUpdate();
    }
  };

  const handleConfirm = () => {
    const currentElements = getCurrentElements().filter(el => {
      if (el.type === 'text' && !el.text?.trim()) {
        return false;
      }
      return true;
    });

    const finalGrid = showGrid;
    const finalAxes = finalGrid && showAxes;

    const jsxGraphData = {
      boundingbox: [-5, 5, 5, -5],
      axis: finalAxes,
      grid: finalGrid,
      elements: currentElements
    }
    onConfirm(jsxGraphData, width.trim(), height.trim())
  }

  const handleAddTextBox = () => {
    const currentElements = getCurrentElements();

    let centerX = 0;
    let centerY = 0;
    if (board) {
      const box = board.getBoundingBox(); // [minX, maxY, maxX, minY]
      centerX = Math.round(((box[0] + box[2]) / 2) * 10) / 10;
      centerY = Math.round(((box[1] + box[3]) / 2) * 10) / 10;
    }

    const newId = `txt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newTextEl = {
      type: 'text',
      id: newId,
      parents: [centerX, centerY],
      text: '',
      attributes: { fontSize: 14, strokeColor: '#1e293b' }
    };

    const nextElements = [...currentElements, newTextEl];
    saveHistory(nextElements);
    initBoardWithState({ elements: nextElements, selectedPointIds: historyRef.current[historyIndexRef.current].selectedPointIds });
    handleToolClick('select');

    setTimeout(() => {
      const inp = document.getElementById(`inp_${newId}`) as HTMLInputElement;
      if (inp) {
        inp.focus();
      }
    }, 100);
  };

  const handleToolClick = (tool: ToolType) => {
    if (activeTool === 'function' && tool !== 'function') {
      if (mfRef.current) {
        mfRef.current.blur();
      }
      if ((window as any).mathVirtualKeyboard) {
        (window as any).mathVirtualKeyboard.hide();
      }
    }
    setActiveTool(tool)
    selectedPointsRef.current = [] // reset selection when changing tool
  }

  const cleanLatex = (str: string) => {
    let s = str;
    // Fix brackets
    s = s.replace(/\\left\(/g, '(').replace(/\\right\)/g, ')');
    s = s.replace(/\\left\[/g, '[').replace(/\\right\]/g, ']');
    s = s.replace(/\\left|\\right/g, '');

    // Operators
    s = s.replace(/\\cdot/g, '*').replace(/\\times/g, '*').replace(/\\ast/g, '*').replace(/\\star/g, '*');

    // Math Functions
    s = s.replace(/\\sin/g, 'sin');
    s = s.replace(/\\cos/g, 'cos');
    s = s.replace(/\\tan/g, 'tan');
    s = s.replace(/\\ln/g, 'log');
    s = s.replace(/\\log/g, 'log10');

    // Fractions & Sqrt (loop for simple nesting)
    let prev = '';
    while (s !== prev) {
      prev = s;
      s = s.replace(/\\frac{([^{}]+)}{([^{}]+)}/g, '($1)/($2)');
      s = s.replace(/\\sqrt{([^{}]+)}/g, 'sqrt($1)');
    }
    s = s.replace(/\\frac(\d)(\d)/g, '($1)/($2)'); // Catch \frac12
    s = s.replace(/\\frac{(\d)}(\d)/g, '($1)/($2)');
    s = s.replace(/\\frac(\d){(\d)}/g, '($1)/($2)');

    // Exponents
    s = s.replace(/\^{([^{}]+)}/g, '^($1)');

    // Remove spaces
    s = s.replace(/\s+/g, '');

    // Implicit multiplication: number or closing paren followed by letter or opening paren
    s = s.replace(/(\d|\))([a-zA-Z\(])/g, '$1*$2');

    // Remove remaining backslashes and curly braces
    s = s.replace(/\\[a-zA-Z]+/g, '');
    s = s.replace(/\\/g, '');
    s = s.replace(/[{}]/g, '');

    return s;
  }

  const handleAddFunctionGraph = () => {
    if (!board || !mfRef.current) return;
    try {
      let latex = mfRef.current.value;
      if (!latex) return;

      let parsedFunc = cleanLatex(latex);
      let isVertical = false;

      // Handle 'y =' or 'x ='
      if (parsedFunc.includes('=')) {
        const parts = parsedFunc.split('=');
        const left = parts[0].trim();
        const right = parts.slice(1).join('=').trim();
        if (left === 'x') {
          isVertical = true;
          parsedFunc = right;
        } else {
          parsedFunc = right;
        }
      }

      const attrs = { strokeColor: '#10b981', strokeWidth: 2 };

      if (editingFunctionId) {
        // Update existing function graph
        const currentElements = getCurrentElements();
        const nextElements = currentElements.map(el => {
          if (el.id === editingFunctionId) {
            return { ...el, func: latex, parsedFunc, isVertical };
          }
          return el;
        });

        setEditingFunctionId(null);
        if (mfRef.current) mfRef.current.value = '';
        setFuncInput('');

        saveHistory(nextElements);
        initBoardWithState({ elements: nextElements, selectedPointIds: historyRef.current[historyIndexRef.current].selectedPointIds });
      } else {
        let fg;
        if (isVertical) {
          const num = parseFloat(parsedFunc);
          if (!isNaN(num) && num.toString() === parsedFunc.trim()) {
            fg = board.create('line', [[num, 0], [num, 1]], attrs);
          } else {
            let fn: any;
            if (board.jc) {
              fn = board.jc.snippet(parsedFunc, true, 'y');
            } else {
              const safeFuncStr = parsedFunc.replace(/\^/g, '**');
              fn = new Function('y', `return ${safeFuncStr}`);
            }
            fg = board.create('curve', [
              (y: number) => fn(y),
              (y: number) => y,
              () => board.getBoundingBox()[3],
              () => board.getBoundingBox()[1]
            ], attrs);
          }
        } else {
          let fn: any;
          if (board.jc) {
            fn = board.jc.snippet(parsedFunc, true, 'x');
          } else {
            const safeFuncStr = parsedFunc.replace(/\^/g, '**');
            fn = new Function('x', `return ${safeFuncStr}`);
          }

          // Test evaluate to check if it's valid
          const testVal = fn(1);
          if (typeof testVal !== 'number' || isNaN(testVal)) {
            throw new Error("Invalid function evaluation");
          }

          fg = board.create('functiongraph', [fn], attrs);
        }

        const currentElements = getCurrentElements();
        const nextElements = [...currentElements, { type: 'functiongraph', id: fg.id, func: latex, parsedFunc, isVertical, attributes: attrs }];
        saveHistory(nextElements);
        initBoardWithState({ elements: nextElements, selectedPointIds: historyRef.current[historyIndexRef.current].selectedPointIds });

        if (mfRef.current) mfRef.current.value = '';
        setFuncInput('');
        handleToolClick('select');
      }
    } catch (err) {
      console.warn("Invalid function syntax:", err);
      setErrorModal("Công thức không hợp lệ. Vui lòng nhập hàm số theo biến x (VD: y=x^2) hoặc đường thẳng dọc (VD: x=2).");
    }
  }

  const handleEditFunction = (el: any) => {
    setEditingFunctionId(el.id);
    if (mfRef.current) {
      mfRef.current.value = el.func;
    }
    setFuncInput(el.func);
  }

  const handleDeleteFunction = (id: string) => {
    const currentElements = getCurrentElements();
    const nextElements = currentElements.filter(el => el.id !== id);

    if (editingFunctionId === id) {
      setEditingFunctionId(null);
      if (mfRef.current) mfRef.current.value = '';
      setFuncInput('');
    }

    saveHistory(nextElements);
    initBoardWithState({ elements: nextElements, selectedPointIds: historyRef.current[historyIndexRef.current].selectedPointIds });
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[1000] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`bg-white rounded-2xl w-full ${activeTool === 'function' ? 'max-w-7xl' : 'max-w-6xl'} h-[90vh] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 transition-all duration-300`}>

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-slate-50">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <CircleDot className="w-5 h-5 text-primary" />
            </div>
            Vẽ hình với JSXGraph
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handleUndo}
              disabled={historyIndex === 0}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200 disabled:opacity-50 disabled:hover:bg-transparent rounded-lg transition-colors flex items-center gap-1 text-sm font-medium"
              title="Hoàn tác (Ctrl+Z)"
            >
              <Undo className="w-4 h-4" /> Hoàn tác
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex === history.length - 1}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200 disabled:opacity-50 disabled:hover:bg-transparent rounded-lg transition-colors flex items-center gap-1 text-sm font-medium"
              title="Tiến lại"
            >
              <Redo className="w-4 h-4" /> Tiến lại
            </button>
            <div className="w-px h-6 bg-slate-200 mx-2"></div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 flex min-h-0 bg-slate-100 p-4 gap-4">
          {/* Toolbar */}
          {/* Toolbar */}
          <div className="w-52 bg-white rounded-xl border border-border p-2 flex flex-col shadow-sm shrink-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-1" style={{ maxHeight: 'calc(85vh - 160px)' }}>
              {/* Group: Cơ bản */}
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 pt-1 mb-0.5">Cơ bản</div>
              <button
                onClick={() => handleToolClick('select')}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${activeTool === 'select' ? 'bg-primary/10 text-primary font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <MousePointer2 className="w-3.5 h-3.5" /> Chọn & Kéo
              </button>
              <button
                onClick={() => handleToolClick('point')}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${activeTool === 'point' ? 'bg-primary/10 text-primary font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <CircleDot className="w-3.5 h-3.5" /> Thêm điểm
              </button>
              <button
                onClick={handleAddTextBox}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors text-slate-600 hover:bg-slate-50 hover:text-primary cursor-pointer border border-transparent hover:border-slate-200"
                title="Thêm ô nhập chữ vào giữa hình vẽ"
              >
                <Type className="w-3.5 h-3.5 text-primary" /> Thêm ô text
              </button>

              <div className="my-1 border-t border-slate-100" />

              {/* Group: Đường & Đoạn */}
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 pt-1 mb-0.5">Đường & Đoạn</div>
              <button
                onClick={() => handleToolClick('segment')}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${activeTool === 'segment' ? 'bg-primary/10 text-primary font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <Minus className="w-3.5 h-3.5" /> Đoạn thẳng
              </button>
              <button
                onClick={() => handleToolClick('line')}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${activeTool === 'line' ? 'bg-primary/10 text-primary font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <Slash className="w-3.5 h-3.5" /> Đường thẳng
              </button>

              <div className="my-1 border-t border-slate-100" />

              {/* Group: Hình học */}
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 pt-1 mb-0.5">Hình học</div>
              <button
                onClick={() => handleToolClick('triangle')}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${activeTool === 'triangle' ? 'bg-primary/10 text-primary font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <Triangle className="w-3.5 h-3.5" /> Tam giác
              </button>
              <button
                onClick={() => handleToolClick('square')}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${activeTool === 'square' ? 'bg-primary/10 text-primary font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <Square className="w-3.5 h-3.5" /> Hình vuông
              </button>
              <button
                onClick={() => handleToolClick('rectangle')}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${activeTool === 'rectangle' ? 'bg-primary/10 text-primary font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <RectangleHorizontal className="w-3.5 h-3.5" /> Hình chữ nhật
              </button>
              <button
                onClick={() => handleToolClick('rhombus')}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${activeTool === 'rhombus' ? 'bg-primary/10 text-primary font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <Diamond className="w-3.5 h-3.5" /> Hình thoi
              </button>
              <button
                onClick={() => handleToolClick('parallelogram')}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${activeTool === 'parallelogram' ? 'bg-primary/10 text-primary font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <Parallelogram className="w-3.5 h-3.5" /> Hình bình hành
              </button>
              <button
                onClick={() => handleToolClick('circle')}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${activeTool === 'circle' ? 'bg-primary/10 text-primary font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <Circle className="w-3.5 h-3.5" /> Hình tròn
              </button>

              <div className="my-1 border-t border-slate-100" />

              {/* Group: Hàm số */}
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 pt-1 mb-0.5">Hàm số</div>
              <button
                onClick={() => handleToolClick('function')}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${activeTool === 'function' ? 'bg-primary/10 text-primary font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <FunctionSquare className="w-3.5 h-3.5" /> Đồ thị hàm
              </button>

              <div className="my-1 border-t border-slate-100" />

              {/* Group: Hiển thị */}
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 pt-1 mb-0.5">Hiển thị</div>
              <button
                type="button"
                onClick={handleToggleGrid}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${showGrid ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:bg-slate-50'
                  }`}
                title={showGrid ? "Ẩn lưới ô vuông (sẽ tự động ẩn trục tọa độ)" : "Hiện lưới ô vuông"}
              >
                <span className="flex items-center gap-2">
                  <Grid className="w-3.5 h-3.5 text-slate-500" /> Lưới ô vuông
                </span>
                <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${showGrid ? 'bg-primary border-primary text-white' : 'border-slate-300 bg-white'
                  }`}>
                  {showGrid && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                </span>
              </button>

              <button
                type="button"
                disabled={!showGrid}
                onClick={handleToggleAxes}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${!showGrid
                    ? 'opacity-50 cursor-not-allowed bg-slate-50 text-slate-400 border border-transparent'
                    : showAxes
                      ? 'bg-slate-100 text-slate-800 cursor-pointer'
                      : 'text-slate-500 hover:bg-slate-50 cursor-pointer'
                  }`}
                title={
                  !showGrid
                    ? 'Cần bật Lưới ô vuông để sử dụng Trục tọa độ'
                    : showAxes
                      ? 'Ẩn trục tọa độ'
                      : 'Hiện trục tọa độ'
                }
              >
                <span className="flex items-center gap-2">
                  <Compass className={`w-3.5 h-3.5 ${!showGrid ? 'text-slate-300' : 'text-slate-500'}`} /> Trục tọa độ
                </span>
                <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${!showGrid
                    ? 'border-slate-200 bg-slate-100'
                    : showAxes
                      ? 'bg-primary border-primary text-white'
                      : 'border-slate-300 bg-white'
                  }`}>
                  {showGrid && showAxes && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                </span>
              </button>
            </div>

            <div className="mt-2 p-2 bg-blue-50 text-blue-800 rounded-lg text-[11px] font-medium border border-blue-100 leading-relaxed shrink-0">
              {activeTool === 'point' && "Click vào bảng để tạo điểm mới."}
              {activeTool === 'segment' && "Click 2 điểm liên tiếp để vẽ đoạn thẳng."}
              {activeTool === 'line' && "Click 2 điểm liên tiếp để vẽ đường thẳng vô hạn."}
              {activeTool === 'triangle' && "Click 3 điểm liên tiếp để vẽ tam giác."}
              {activeTool === 'square' && "Click 2 điểm cạnh đáy để vẽ hình vuông chuẩn (không méo góc)."}
              {activeTool === 'rectangle' && "Click 2 điểm cạnh đáy & 1 điểm đỉnh để vẽ hình chữ nhật."}
              {activeTool === 'rhombus' && "Click 2 điểm cạnh đáy & 1 điểm đỉnh để vẽ hình thoi chuẩn."}
              {activeTool === 'parallelogram' && "Click 3 điểm để vẽ hình bình hành chuẩn 2 cặp cạnh song song."}
              {activeTool === 'circle' && "Click tâm đường tròn, sau đó click một điểm trên viền."}
              {activeTool === 'function' && "Nhập công thức hàm số rồi nhấn Vẽ để thêm đồ thị."}
              {activeTool === 'select' && "Kéo thả để di chuyển các đỉnh. Click chuột phải vào điểm để sửa tọa độ & tên."}
            </div>
          </div>

          {/* Function Tool Panel */}
          <div className={`w-80 bg-white rounded-xl border border-border shadow-sm flex-col p-3 shrink-0 animate-in slide-in-from-left-4 ${activeTool === 'function' ? 'flex' : 'hidden'}`}>
            <div className="text-sm font-semibold text-slate-700 mb-3 px-1">Nhập hàm số</div>
            <style>{`
                math-field::part(menu-toggle) {
                  display: none !important;
                }
                math-field::part(virtual-keyboard-toggle) {
                  display: none !important;
                }
              `}</style>
            <div className="flex flex-col gap-2">
              <div
                className="flex-1 min-w-0"
                style={{ fontSize: '1.2rem' }}
                onKeyDown={(e) => e.stopPropagation()}
                onFocus={() => {
                  if ((window as any).mathVirtualKeyboard) {
                    (window as any).mathVirtualKeyboard.show();
                  }
                }}
                onBlur={(e) => {
                  if (e.relatedTarget && (e.relatedTarget as HTMLElement).closest && (e.relatedTarget as HTMLElement).closest('math-virtual-keyboard')) {
                    return;
                  }
                  if ((window as any).mathVirtualKeyboard) {
                    (window as any).mathVirtualKeyboard.hide();
                  }
                }}
              >
                <math-field
                  ref={mfRef}
                  onInput={(e: any) => setFuncInput(e.target.value)}
                  math-virtual-keyboard-policy="manual"
                  style={{ width: '100%', padding: '4px', border: '1px solid #e2e8f0', borderRadius: '0.5rem', outline: 'none' }}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddFunctionGraph}
                  className="flex-1 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 shadow-sm transition-colors"
                >
                  {editingFunctionId ? 'Cập nhật' : 'Vẽ đồ thị'}
                </button>
                {editingFunctionId && (
                  <button
                    onClick={() => {
                      setEditingFunctionId(null);
                      if (mfRef.current) mfRef.current.value = '';
                      setFuncInput('');
                    }}
                    className="px-3 py-2 bg-slate-100 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-200 shadow-sm transition-colors"
                  >
                    Hủy
                  </button>
                )}
              </div>
            </div>

            {/* Function List */}
            {(history[historyIndex]?.elements || []).some(el => el.type === 'functiongraph') && (
              <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-slate-100 overflow-y-auto">
                <div className="text-xs font-semibold text-slate-500 mb-1 px-1">Các hàm số đã vẽ</div>
                {(history[historyIndex]?.elements || []).filter(el => el.type === 'functiongraph').map(el => (
                  <div key={el.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100 group">
                    <div className="flex-1 min-w-0 overflow-hidden pointer-events-none" style={{ fontSize: '1.1rem' }}>
                      <math-field readonly="true" style={{ width: '100%', outline: 'none', background: 'transparent', border: 'none' }}>
                        {el.func}
                      </math-field>
                    </div>
                    <button
                      onClick={() => handleEditFunction(el)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                      title="Sửa biểu thức"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteFunction(el.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                      title="Xóa biểu thức"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Canvas */}
          <div className="flex-1 bg-white rounded-xl border border-border shadow-sm flex items-center justify-center p-4 relative min-w-0">
            <div
              id="jxgbox-editor"
              ref={boardRef}
              className="jxgbox w-full h-full rounded-lg border border-slate-200"
              onContextMenu={e => e.preventDefault()}
            />

            {/* Ghost Point Popover */}
            {selectedGhostPoint && (
              <div
                className="absolute z-[1200] bg-white rounded-lg shadow-xl border border-slate-200 p-2 flex flex-col gap-2 animate-in zoom-in-95 pointer-events-auto"
                style={{
                  left: boardRef.current ? Math.min(selectedGhostPoint.scrX + 16 + 10, boardRef.current.clientWidth + 16 - 180) : selectedGhostPoint.scrX + 26,
                  top: boardRef.current ? Math.max(16, Math.min(selectedGhostPoint.scrY + 16 - 10, boardRef.current.clientHeight + 16 - 150)) : selectedGhostPoint.scrY + 6
                }}
              >
                <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-1">
                  <span className="text-xs font-semibold text-slate-700">Giao điểm</span>
                  <button onClick={() => setSelectedGhostPoint(null)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <div className="text-sm font-mono text-slate-600 bg-slate-50 px-2 py-1 rounded text-center font-medium">
                  ({selectedGhostPoint.x.toFixed(2)}, {selectedGhostPoint.y.toFixed(2)})
                </div>
                <button
                  onClick={() => handlePinGhostPoint(selectedGhostPoint.x, selectedGhostPoint.y)}
                  className="flex items-center justify-center gap-1 w-full bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium py-1.5 px-2 rounded transition-colors"
                >
                  <Pin className="w-3 h-3" /> Lưu điểm
                </button>
              </div>
            )}

            {/* Edit Point Modal */}
            {editingPoint && (
              <div
                className="fixed inset-0 z-[1100] flex items-center justify-center bg-slate-900/20 backdrop-blur-[2px]"
                onContextMenu={e => e.preventDefault()}
              >
                <div className="bg-white rounded-xl shadow-2xl border border-border p-4 w-64 animate-in zoom-in-95">
                  <h4 className="font-semibold text-slate-800 mb-3 text-sm flex items-center justify-between">
                    Chỉnh sửa điểm
                    <button onClick={() => setEditingPoint(null)} className="text-slate-400 hover:text-slate-600">
                      <X className="w-4 h-4" />
                    </button>
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-slate-500 mb-1 block">Tên điểm</label>
                      <input
                        type="text"
                        value={editingPoint.name}
                        onChange={e => setEditingPoint({ ...editingPoint, name: e.target.value })}
                        className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        placeholder="Ví dụ: A, B..."
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500 mb-1 block">Trục X</label>
                      <input
                        type="number"
                        step="any"
                        value={editingPoint.x}
                        onChange={e => setEditingPoint({ ...editingPoint, x: e.target.value })}
                        className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500 mb-1 block">Trục Y</label>
                      <input
                        type="number"
                        step="any"
                        value={editingPoint.y}
                        onChange={e => setEditingPoint({ ...editingPoint, y: e.target.value })}
                        className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={handleEditCoordinateSave}
                        className="flex-1 bg-primary text-white font-medium text-sm py-2 rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
                      >
                        Lưu thay đổi
                      </button>
                      <button
                        onClick={handleDeletePoint}
                        className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors shadow-sm"
                        title="Xóa điểm"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Error Modal */}
        {errorModal && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" onContextMenu={e => e.preventDefault()}>
            <div className="bg-white rounded-xl shadow-2xl border border-border p-5 w-80 animate-in zoom-in-95 flex flex-col gap-3">
              <h4 className="font-semibold text-rose-600 text-base">Lỗi cú pháp</h4>
              <p className="text-sm text-slate-600 leading-relaxed">{errorModal}</p>
              <div className="flex justify-end mt-2">
                <button
                  onClick={() => setErrorModal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-border bg-slate-50">
          {/* Dimension Controls */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-semibold text-slate-500">Rộng:</label>
              <input
                type="text"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                placeholder="100%"
                className="w-16 px-2 py-1 text-xs border border-slate-200 rounded-lg bg-white outline-none focus:border-primary"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-semibold text-slate-500">Cao:</label>
              <input
                type="text"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="300"
                className="w-16 px-2 py-1 text-xs border border-slate-200 rounded-lg bg-white outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 bg-white border border-slate-200 rounded-xl transition-colors shadow-sm cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              onClick={handleConfirm}
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary/95 rounded-xl transition-colors shadow-sm cursor-pointer"
            >
              <Check className="w-4 h-4" /> Lưu hình vẽ
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
