import JXG from 'jsxgraph'

export interface JsxGraphElement {
  type: string
  subtype?: string
  id: string
  name?: string
  label?: string
  parents?: any[]
  points?: any[]
  attributes?: Record<string, any>
  func?: string
  parsedFunc?: string
  isVertical?: boolean
  text?: string
  content?: string
  x?: number
  y?: number
  [key: string]: any
}

/**
 * Generate sequential geometric point names (A..Z, A1..Z1, A2..Z2, etc.)
 * Special case: point at (0, 0) defaults to 'O' if available.
 */
export function getNextPointName(elements: JsxGraphElement[], x?: number, y?: number): string {
  const existingNames = elements
    .filter(el => el.type === 'point' && el.attributes?.name)
    .map(el => el.attributes?.name as string)

  if (x !== undefined && y !== undefined && Math.abs(x) < 0.05 && Math.abs(y) < 0.05 && !existingNames.includes('O')) {
    return 'O'
  }

  let index = 0
  while (true) {
    let name = ''
    if (index < 26) {
      name = String.fromCharCode(65 + index) // A-Z
    } else {
      const letter = String.fromCharCode(65 + (index % 26))
      const num = Math.floor(index / 26)
      name = `${letter}${num}`
    }
    if (name === 'O') {
      index++
      continue
    }
    if (!existingNames.includes(name)) return name
    index++
  }
}

/**
 * Calculate the remaining 2 vertices (p3, p4) of a square given top/base edge (p1, p2)
 * Constructs downward (-Y) when drawing from left to right (p1 -> p2)
 */
export function calculateSquareVertices(p1X: number, p1Y: number, p2X: number, p2Y: number) {
  let dx = p2X - p1X
  let dy = p2Y - p1Y
  if (dx === 0 && dy === 0) {
    dx = 2
    dy = 0
  }
  const p3x = Math.round((p2X + dy) * 100) / 100
  const p3y = Math.round((p2Y - dx) * 100) / 100
  const p4x = Math.round((p1X + dy) * 100) / 100
  const p4y = Math.round((p1Y - dx) * 100) / 100
  return { p3x, p3y, p4x, p4y }
}

/**
 * Calculate the orthogonal vertices of a rectangle given base edge (p1, p2) and 3rd guide point
 */
export function calculateRectangleVertices(p1X: number, p1Y: number, p2X: number, p2Y: number, p3RawX: number, p3RawY: number) {
  const dx = p2X - p1X
  const dy = p2Y - p1Y
  const L = Math.hypot(dx, dy) || 1
  const ex = dx / L
  const ey = dy / L
  const vx = p3RawX - p2X
  const vy = p3RawY - p2Y
  // Normal vector pointing towards the side of p3Raw
  const dot1 = vx * (-ey) + vy * ex
  const dot2 = vx * ey + vy * (-ex)
  const [nx, ny] = dot1 >= dot2 ? [-ey, ex] : [ey, -ex]
  let h = Math.abs(vx * nx + vy * ny)
  if (h < 0.1) h = L * 0.6
  const p3x = Math.round((p2X + h * nx) * 100) / 100
  const p3y = Math.round((p2Y + h * ny) * 100) / 100
  const p4x = Math.round((p1X + h * nx) * 100) / 100
  const p4y = Math.round((p1Y + h * ny) * 100) / 100
  return { p3x, p3y, p4x, p4y }
}

/**
 * Calculate the vertices of a rhombus given base edge (p1, p2) and 3rd guide point
 */
export function calculateRhombusVertices(p1X: number, p1Y: number, p2X: number, p2Y: number, p3RawX: number, p3RawY: number) {
  const dx = p2X - p1X
  const dy = p2Y - p1Y
  const a = Math.hypot(dx, dy) || 1
  const vx = p3RawX - p2X
  const vy = p3RawY - p2Y
  const Lraw = Math.hypot(vx, vy) || 1
  const p3x = Math.round((p2X + (vx * a) / Lraw) * 100) / 100
  const p3y = Math.round((p2Y + (vy * a) / Lraw) * 100) / 100
  const p4x = Math.round((p1X + (p3x - p2X)) * 100) / 100
  const p4y = Math.round((p1Y + (p3y - p2Y)) * 100) / 100
  return { p3x, p3y, p4x, p4y }
}

/**
 * Calculate vertex D of a parallelogram given vertices A, B, C (D = A + C - B)
 */
export function calculateParallelogramVertices(p1X: number, p1Y: number, p2X: number, p2Y: number, p3X: number, p3Y: number) {
  const p4x = Math.round((p1X + p3X - p2X) * 100) / 100
  const p4y = Math.round((p1Y + p3Y - p2Y) * 100) / 100
  return { p4x, p4y }
}

/**
 * Real-time drag constraints for square (ABCD):
 * Center O = (A + C)/2 = (B + D)/2.
 * Vector rotation ensures vertices A, B, C, D maintain cyclic orientation without swapping.
 */
export function attachSquareConstraints(pA: any, pB: any, pC: any, pD: any, board: any) {
  let isUpdating = false

  pA.on('drag', () => {
    if (isUpdating) return
    isUpdating = true
    const ax = pA.X(), ay = pA.Y(), cx = pC.X(), cy = pC.Y()
    const ox = (ax + cx) / 2, oy = (ay + cy) / 2
    const dx = (ax - cx) / 2, dy = (ay - cy) / 2
    pB.setPosition(JXG.COORDS_BY_USER, [ox + dy, oy - dx])
    pD.setPosition(JXG.COORDS_BY_USER, [ox - dy, oy + dx])
    board.update()
    isUpdating = false
  })

  pC.on('drag', () => {
    if (isUpdating) return
    isUpdating = true
    const ax = pA.X(), ay = pA.Y(), cx = pC.X(), cy = pC.Y()
    const ox = (ax + cx) / 2, oy = (ay + cy) / 2
    const dx = (cx - ax) / 2, dy = (cy - ay) / 2
    pB.setPosition(JXG.COORDS_BY_USER, [ox - dy, oy + dx])
    pD.setPosition(JXG.COORDS_BY_USER, [ox + dy, oy - dx])
    board.update()
    isUpdating = false
  })

  pB.on('drag', () => {
    if (isUpdating) return
    isUpdating = true
    const bx = pB.X(), by = pB.Y(), dxVal = pD.X(), dyVal = pD.Y()
    const ox = (bx + dxVal) / 2, oy = (by + dyVal) / 2
    const dx = (bx - dxVal) / 2, dy = (by - dyVal) / 2
    pA.setPosition(JXG.COORDS_BY_USER, [ox - dy, oy + dx])
    pC.setPosition(JXG.COORDS_BY_USER, [ox + dy, oy - dx])
    board.update()
    isUpdating = false
  })

  pD.on('drag', () => {
    if (isUpdating) return
    isUpdating = true
    const bx = pB.X(), by = pB.Y(), dxVal = pD.X(), dyVal = pD.Y()
    const ox = (bx + dxVal) / 2, oy = (by + dyVal) / 2
    const dx = (dxVal - bx) / 2, dy = (dyVal - by) / 2
    pA.setPosition(JXG.COORDS_BY_USER, [ox + dy, oy - dx])
    pC.setPosition(JXG.COORDS_BY_USER, [ox - dy, oy + dx])
    board.update()
    isUpdating = false
  })
}

/**
 * Real-time drag constraints for rectangle (ABCD)
 */
export function attachRectangleConstraints(pA: any, pB: any, pC: any, pD: any, board: any) {
  let isUpdating = false

  pC.on('drag', () => {
    if (isUpdating) return
    isUpdating = true
    const ax = pA.X()
    const ay = pA.Y()
    const bx = pB.X()
    const by = pB.Y()
    const cx = pC.X()
    const cy = pC.Y()

    const dx = bx - ax
    const dy = by - ay
    const len = Math.hypot(dx, dy) || 1
    const ux = dx / len
    const uy = dy / len
    const vx = -uy
    const vy = ux

    const acx = cx - ax
    const acy = cy - ay
    const projU = acx * ux + acy * uy
    const projV = acx * vx + acy * vy

    pB.setPosition(JXG.COORDS_BY_USER, [ax + projU * ux, ay + projU * uy])
    pD.setPosition(JXG.COORDS_BY_USER, [ax + projV * vx, ay + projV * vy])
    pC.setPosition(JXG.COORDS_BY_USER, [ax + projU * ux + projV * vx, ay + projU * uy + projV * vy])
    board.update()
    isUpdating = false
  })

  pA.on('drag', () => {
    if (isUpdating) return
    isUpdating = true
    const cx = pC.X()
    const cy = pC.Y()
    const bx = pB.X()
    const by = pB.Y()
    const ax = pA.X()
    const ay = pA.Y()

    const dx = bx - cx
    const dy = by - cy
    const len = Math.hypot(dx, dy) || 1
    const ux = dx / len
    const uy = dy / len
    const vx = -uy
    const vy = ux

    const cax = ax - cx
    const cay = ay - cy
    const projU = cax * ux + cay * uy
    const projV = cax * vx + cay * vy

    pB.setPosition(JXG.COORDS_BY_USER, [cx + projU * ux, cy + projU * uy])
    pD.setPosition(JXG.COORDS_BY_USER, [cx + projV * vx, cy + projV * vy])
    pA.setPosition(JXG.COORDS_BY_USER, [cx + projU * ux + projV * vx, cy + projU * uy + projV * vy])
    board.update()
    isUpdating = false
  })

  pB.on('drag', () => {
    if (isUpdating) return
    isUpdating = true
    const dxVal = pD.X()
    const dyVal = pD.Y()
    const ax = pA.X()
    const ay = pA.Y()
    const bx = pB.X()
    const by = pB.Y()

    const ddx = ax - dxVal
    const ddy = ay - dyVal
    const len = Math.hypot(ddx, ddy) || 1
    const ux = ddx / len
    const uy = ddy / len
    const vx = -uy
    const vy = ux

    const dbx = bx - dxVal
    const dby = by - dyVal
    const projU = dbx * ux + dby * uy
    const projV = dbx * vx + dby * vy

    pA.setPosition(JXG.COORDS_BY_USER, [dxVal + projU * ux, dyVal + projU * uy])
    pC.setPosition(JXG.COORDS_BY_USER, [dxVal + projV * vx, dyVal + projV * vy])
    pB.setPosition(JXG.COORDS_BY_USER, [dxVal + projU * ux + projV * vx, dyVal + projU * uy + projV * vy])
    board.update()
    isUpdating = false
  })

  pD.on('drag', () => {
    if (isUpdating) return
    isUpdating = true
    const bx = pB.X()
    const by = pB.Y()
    const ax = pA.X()
    const ay = pA.Y()
    const dxVal = pD.X()
    const dyVal = pD.Y()

    const ddx = ax - bx
    const ddy = ay - by
    const len = Math.hypot(ddx, ddy) || 1
    const ux = ddx / len
    const uy = ddy / len
    const vx = -uy
    const vy = ux

    const bdx = dxVal - bx
    const bdy = dyVal - by
    const projU = bdx * ux + bdy * uy
    const projV = bdx * vx + bdy * vy

    pA.setPosition(JXG.COORDS_BY_USER, [bx + projU * ux, by + projU * uy])
    pC.setPosition(JXG.COORDS_BY_USER, [bx + projV * vx, by + projV * vy])
    pD.setPosition(JXG.COORDS_BY_USER, [bx + projU * ux + projV * vx, by + projU * uy + projV * vy])
    board.update()
    isUpdating = false
  })
}

/**
 * Real-time drag constraints for parallelogram (ABCD)
 */
export function attachParallelogramConstraints(pA: any, pB: any, pC: any, pD: any, board: any) {
  let isUpdating = false

  pA.on('drag', () => {
    if (isUpdating) return
    isUpdating = true
    pD.setPosition(JXG.COORDS_BY_USER, [pA.X() + pC.X() - pB.X(), pA.Y() + pC.Y() - pB.Y()])
    board.update()
    isUpdating = false
  })

  pB.on('drag', () => {
    if (isUpdating) return
    isUpdating = true
    pD.setPosition(JXG.COORDS_BY_USER, [pA.X() + pC.X() - pB.X(), pA.Y() + pC.Y() - pB.Y()])
    board.update()
    isUpdating = false
  })

  pC.on('drag', () => {
    if (isUpdating) return
    isUpdating = true
    pD.setPosition(JXG.COORDS_BY_USER, [pA.X() + pC.X() - pB.X(), pA.Y() + pC.Y() - pB.Y()])
    board.update()
    isUpdating = false
  })

  pD.on('drag', () => {
    if (isUpdating) return
    isUpdating = true
    pB.setPosition(JXG.COORDS_BY_USER, [pA.X() + pC.X() - pD.X(), pA.Y() + pC.Y() - pD.Y()])
    board.update()
    isUpdating = false
  })
}

/**
 * Real-time drag constraints for rhombus (ABCD)
 * Preserves the actual relative side of B/D to avoid jumping or inverting orientation
 */
export function attachRhombusConstraints(pA: any, pB: any, pC: any, pD: any, board: any) {
  let isUpdating = false

  const updateFromAC = () => {
    if (isUpdating) return
    isUpdating = true
    const ax = pA.X(), ay = pA.Y(), cx = pC.X(), cy = pC.Y()
    const bx = pB.X(), by = pB.Y()
    const ox = (ax + cx) / 2, oy = (ay + cy) / 2
    const vacX = cx - ax, vacY = cy - ay
    const lenAC = Math.hypot(vacX, vacY) || 1
    const ux = vacX / lenAC, uy = vacY / lenAC

    // Cross product z to maintain current side of B
    const cross = vacX * (by - ay) - vacY * (bx - ax)
    const side = cross >= 0 ? 1 : -1

    const halfLenBD = Math.hypot(bx - ox, by - oy) || lenAC * 0.6
    pB.setPosition(JXG.COORDS_BY_USER, [ox - side * halfLenBD * uy, oy + side * halfLenBD * ux])
    pD.setPosition(JXG.COORDS_BY_USER, [ox + side * halfLenBD * uy, oy - side * halfLenBD * ux])
    board.update()
    isUpdating = false
  }

  const updateFromBD = () => {
    if (isUpdating) return
    isUpdating = true
    const bx = pB.X(), by = pB.Y(), dx = pD.X(), dy = pD.Y()
    const ax = pA.X(), ay = pA.Y()
    const ox = (bx + dx) / 2, oy = (by + dy) / 2
    const vbdX = dx - bx, vbdY = dy - by
    const lenBD = Math.hypot(vbdX, vbdY) || 1
    const ux = vbdX / lenBD, uy = vbdY / lenBD

    // Cross product z to maintain current side of A
    const cross = vbdX * (ay - by) - vbdY * (ax - bx)
    const side = cross >= 0 ? 1 : -1

    const halfLenAC = Math.hypot(ax - ox, ay - oy) || lenBD * 0.8
    pA.setPosition(JXG.COORDS_BY_USER, [ox - side * halfLenAC * uy, oy + side * halfLenAC * ux])
    pC.setPosition(JXG.COORDS_BY_USER, [ox + side * halfLenAC * uy, oy - side * halfLenAC * ux])
    board.update()
    isUpdating = false
  }

  pA.on('drag', updateFromAC)
  pC.on('drag', updateFromAC)
  pB.on('drag', updateFromBD)
  pD.on('drag', updateFromBD)
}

/**
 * Enforce polygon constraints on coordinate modal edit
 */
export function enforcePolygonConstraints(elements: JsxGraphElement[], modifiedPointId: string): JsxGraphElement[] {
  const poly = elements.find(
    el => el.type === 'polygon' && el.subtype && Array.isArray(el.parents) && el.parents.includes(modifiedPointId)
  )
  if (!poly) return elements

  const pointMap = new Map<string, JsxGraphElement>()
  elements.forEach(el => {
    if (el.type === 'point' && Array.isArray(el.parents)) {
      pointMap.set(el.id, { ...el, parents: [...el.parents] })
    }
  })

  const pIds = poly.parents
  if (!pIds || pIds.length < 4) return elements

  const pA = pointMap.get(pIds[0])
  const pB = pointMap.get(pIds[1])
  const pC = pointMap.get(pIds[2])
  const pD = pointMap.get(pIds[3])
  if (!pA?.parents || !pB?.parents || !pC?.parents || !pD?.parents) return elements

  if (poly.subtype === 'square') {
    if (modifiedPointId === pA.id) {
      const ox = (pA.parents[0] + pC.parents[0]) / 2, oy = (pA.parents[1] + pC.parents[1]) / 2
      const dx = (pA.parents[0] - pC.parents[0]) / 2, dy = (pA.parents[1] - pC.parents[1]) / 2
      pB.parents = [Math.round((ox + dy) * 100) / 100, Math.round((oy - dx) * 100) / 100]
      pD.parents = [Math.round((ox - dy) * 100) / 100, Math.round((oy + dx) * 100) / 100]
    } else if (modifiedPointId === pC.id) {
      const ox = (pA.parents[0] + pC.parents[0]) / 2, oy = (pA.parents[1] + pC.parents[1]) / 2
      const dx = (pC.parents[0] - pA.parents[0]) / 2, dy = (pC.parents[1] - pA.parents[1]) / 2
      pB.parents = [Math.round((ox - dy) * 100) / 100, Math.round((oy + dx) * 100) / 100]
      pD.parents = [Math.round((ox + dy) * 100) / 100, Math.round((oy - dx) * 100) / 100]
    } else if (modifiedPointId === pB.id) {
      const ox = (pB.parents[0] + pD.parents[0]) / 2, oy = (pB.parents[1] + pD.parents[1]) / 2
      const dx = (pB.parents[0] - pD.parents[0]) / 2, dy = (pB.parents[1] - pD.parents[1]) / 2
      pA.parents = [Math.round((ox - dy) * 100) / 100, Math.round((oy + dx) * 100) / 100]
      pC.parents = [Math.round((ox + dy) * 100) / 100, Math.round((oy - dx) * 100) / 100]
    } else if (modifiedPointId === pD.id) {
      const ox = (pB.parents[0] + pD.parents[0]) / 2, oy = (pB.parents[1] + pD.parents[1]) / 2
      const dx = (pD.parents[0] - pB.parents[0]) / 2, dy = (pD.parents[1] - pB.parents[1]) / 2
      pA.parents = [Math.round((ox + dy) * 100) / 100, Math.round((oy - dx) * 100) / 100]
      pC.parents = [Math.round((ox - dy) * 100) / 100, Math.round((oy + dx) * 100) / 100]
    }
  } else if (poly.subtype === 'rectangle') {
    const ax = pA.parents[0]
    const ay = pA.parents[1]
    const bx = pB.parents[0]
    const by = pB.parents[1]
    const cx = pC.parents[0]
    const cy = pC.parents[1]
    const dx = bx - ax
    const dy = by - ay
    const len = Math.hypot(dx, dy) || 1
    const ux = dx / len
    const uy = dy / len
    const vx = -uy
    const vy = ux
    const acx = cx - ax
    const acy = cy - ay
    const projU = acx * ux + acy * uy
    const projV = acx * vx + acy * vy
    pB.parents = [Math.round((ax + projU * ux) * 100) / 100, Math.round((ay + projU * uy) * 100) / 100]
    pD.parents = [Math.round((ax + projV * vx) * 100) / 100, Math.round((ay + projV * vy) * 100) / 100]
    pC.parents = [Math.round((ax + projU * ux + projV * vx) * 100) / 100, Math.round((ay + projU * uy + projV * vy) * 100) / 100]
  } else if (poly.subtype === 'parallelogram') {
    if (modifiedPointId === pIds[3]) {
      pB.parents = [
        Math.round((pA.parents[0] + pC.parents[0] - pD.parents[0]) * 100) / 100,
        Math.round((pA.parents[1] + pC.parents[1] - pD.parents[1]) * 100) / 100
      ]
    } else {
      pD.parents = [
        Math.round((pA.parents[0] + pC.parents[0] - pB.parents[0]) * 100) / 100,
        Math.round((pA.parents[1] + pC.parents[1] - pB.parents[1]) * 100) / 100
      ]
    }
  } else if (poly.subtype === 'rhombus') {
    if (modifiedPointId === pA.id || modifiedPointId === pC.id) {
      const ax = pA.parents[0], ay = pA.parents[1], cx = pC.parents[0], cy = pC.parents[1]
      const bx = pB.parents[0], by = pB.parents[1]
      const ox = (ax + cx) / 2, oy = (ay + cy) / 2
      const vacX = cx - ax, vacY = cy - ay
      const lenAC = Math.hypot(vacX, vacY) || 1
      const ux = vacX / lenAC, uy = vacY / lenAC
      const cross = vacX * (by - ay) - vacY * (bx - ax)
      const side = cross >= 0 ? 1 : -1
      const halfLenBD = Math.hypot(bx - ox, by - oy) || lenAC * 0.6
      pB.parents = [Math.round((ox - side * halfLenBD * uy) * 100) / 100, Math.round((oy + side * halfLenBD * ux) * 100) / 100]
      pD.parents = [Math.round((ox + side * halfLenBD * uy) * 100) / 100, Math.round((oy - side * halfLenBD * ux) * 100) / 100]
    } else if (modifiedPointId === pB.id || modifiedPointId === pD.id) {
      const bx = pB.parents[0], by = pB.parents[1], dx = pD.parents[0], dy = pD.parents[1]
      const ax = pA.parents[0], ay = pA.parents[1]
      const ox = (bx + dx) / 2, oy = (by + dy) / 2
      const vbdX = dx - bx, vbdY = dy - by
      const lenBD = Math.hypot(vbdX, vbdY) || 1
      const ux = vbdX / lenBD, uy = vbdY / lenBD
      const cross = vbdX * (ay - by) - vbdY * (ax - bx)
      const side = cross >= 0 ? 1 : -1
      const halfLenAC = Math.hypot(ax - ox, ay - oy) || lenBD * 0.8
      pA.parents = [Math.round((ox - side * halfLenAC * uy) * 100) / 100, Math.round((oy + side * halfLenAC * ux) * 100) / 100]
      pC.parents = [Math.round((ox + side * halfLenAC * uy) * 100) / 100, Math.round((oy - side * halfLenAC * ux) * 100) / 100]
    }
  }

  return elements.map(el => {
    if (el.type === 'point' && pointMap.has(el.id)) {
      return pointMap.get(el.id)!
    }
    return el
  })
}

/**
 * Numerical intersection finder for function curves and lines
 */
export function findIntersections(b: any, stateElements: JsxGraphElement[]): { x: number; y: number }[] {
  if (!b) return []
  const box = b.getBoundingBox()
  const minX = box[0]
  const maxY = box[1]
  const maxX = box[2]
  const minY = box[3]
  const intersections: { x: number; y: number }[] = []
  const steps = 500
  const dx = (maxX - minX) / steps

  const bisection = (f: (x: number) => number, x0: number, x1: number): number | null => {
    let a = x0
    let c = x1
    const fa = f(a)
    const fb = f(c)
    if (isNaN(fa) || isNaN(fb) || !isFinite(fa) || !isFinite(fb)) return null
    if (fa * fb > 0) return null
    for (let i = 0; i < 40; i++) {
      const m = (a + c) / 2
      const fm = f(m)
      if (isNaN(fm) || !isFinite(fm)) return null
      if (Math.abs(fm) < 1e-10) return m
      if (fa * fm <= 0) {
        c = m
      } else {
        a = m
      }
    }
    return (a + c) / 2
  }

  const addPoint = (x: number, y: number) => {
    if (isNaN(x) || isNaN(y) || !isFinite(x) || !isFinite(y)) return
    if (x >= minX - 1 && x <= maxX + 1 && y >= minY - 1 && y <= maxY + 1) {
      if (!intersections.some(p => Math.abs(p.x - x) < 1e-3 && Math.abs(p.y - y) < 1e-3)) {
        intersections.push({ x, y })
      }
    }
  }

  const funcGraphs: any[] = []
  const vLines: number[] = []

  stateElements.forEach(el => {
    if (el.type === 'functiongraph') {
      const obj = b.objects[el.id]
      if (obj) {
        if (el.isVertical && el.parsedFunc) {
          const num = parseFloat(el.parsedFunc)
          if (!isNaN(num) && num.toString() === el.parsedFunc.trim()) {
            vLines.push(num)
          }
        } else {
          funcGraphs.push(obj)
        }
      }
    }
  })

  if (minX <= 0 && 0 <= maxX) {
    funcGraphs.forEach(g => {
      const y = g.Y(0)
      if (Math.abs(y) < 1e6) addPoint(0, y)
    })
  }

  funcGraphs.forEach(g => {
    const f = (x: number) => g.Y(x)
    for (let i = 0; i < steps; i++) {
      const x0 = minX + i * dx
      const x1 = minX + (i + 1) * dx
      if (f(x0) * f(x1) <= 0) {
        const root = bisection(f, x0, x1)
        if (root !== null && Math.abs(f(root)) < 1e-2) addPoint(root, 0)
      }
    }
  })

  for (let i = 0; i < funcGraphs.length; i++) {
    for (let j = i + 1; j < funcGraphs.length; j++) {
      const g1 = funcGraphs[i]
      const g2 = funcGraphs[j]
      const f = (x: number) => g1.Y(x) - g2.Y(x)
      for (let k = 0; k < steps; k++) {
        const x0 = minX + k * dx
        const x1 = minX + (k + 1) * dx
        if (f(x0) * f(x1) <= 0) {
          const root = bisection(f, x0, x1)
          if (root !== null && Math.abs(f(root)) < 1e-2) addPoint(root, g1.Y(root))
        }
      }
    }
  }

  vLines.forEach(vx => {
    addPoint(vx, 0)
    funcGraphs.forEach(g => {
      addPoint(vx, g.Y(vx))
    })
  })

  const existingPoints = stateElements.filter(el => el.type === 'point')
  return intersections.filter(p => {
    return !existingPoints.some(
      ep => ep.parents && Math.abs(ep.parents[0] - p.x) < 0.05 && Math.abs(ep.parents[1] - p.y) < 0.05
    )
  })
}
