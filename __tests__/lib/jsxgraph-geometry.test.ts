import { describe, it, expect } from 'vitest'
import {
  getNextPointName,
  calculateSquareVertices,
  calculateRectangleVertices,
  calculateRhombusVertices,
  calculateParallelogramVertices,
  enforcePolygonConstraints,
  JsxGraphElement,
} from '@/lib/jsxgraph-geometry'

describe('lib/jsxgraph-geometry', () => {
  describe('getNextPointName', () => {
    it('returns "A" when elements list is empty', () => {
      const elements: JsxGraphElement[] = []
      expect(getNextPointName(elements)).toBe('A')
    })

    it('returns "O" when coordinate is at the origin (0, 0) and "O" is unused', () => {
      const elements: JsxGraphElement[] = []
      expect(getNextPointName(elements, 0, 0)).toBe('O')
      expect(getNextPointName(elements, 0.01, -0.02)).toBe('O')
    })

    it('skips existing point names and assigns next sequential letter', () => {
      const elements: JsxGraphElement[] = [
        { type: 'point', id: 'p1', attributes: { name: 'A' } },
        { type: 'point', id: 'p2', attributes: { name: 'B' } },
      ]
      expect(getNextPointName(elements)).toBe('C')
    })

    it('skips "O" for non-origin points unless explicitly at origin', () => {
      const existingNames = 'ABCDEFGHIJKLMN'.split('')
      const fullElements: JsxGraphElement[] = existingNames.map((name, i) => ({
        type: 'point',
        id: `p_${i}`,
        attributes: { name },
      }))

      expect(getNextPointName(fullElements, 2, 3)).toBe('P')
    })

    it('generates indexed names when A-Z are exhausted', () => {
      const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
      const fullElements: JsxGraphElement[] = alphabet.map((name, i) => ({
        type: 'point',
        id: `p_${i}`,
        attributes: { name },
      }))

      const nextName = getNextPointName(fullElements)
      expect(nextName).toBe('A1')
    })
  })

  describe('calculateSquareVertices', () => {
    it('calculates square vertices p3 and p4 given horizontal top edge', () => {
      const p1 = { x: 0, y: 4 }
      const p2 = { x: 4, y: 4 }
      const { p3x, p3y, p4x, p4y } = calculateSquareVertices(p1.x, p1.y, p2.x, p2.y)

      // Expected downward square: p3=(4, 0), p4=(0, 0)
      expect(p3x).toBe(4)
      expect(p3y).toBe(0)
      expect(p4x).toBe(0)
      expect(p4y).toBe(0)

      // Verify all 4 side lengths are equal
      const side1 = Math.hypot(p2.x - p1.x, p2.y - p1.y)
      const side2 = Math.hypot(p3x - p2.x, p3y - p2.y)
      const side3 = Math.hypot(p4x - p3x, p4y - p3y)
      const side4 = Math.hypot(p1.x - p4x, p1.y - p4y)
      expect(side1).toBe(4)
      expect(side2).toBe(4)
      expect(side3).toBe(4)
      expect(side4).toBe(4)
    })

    it('calculates rotated square correctly', () => {
      const p1 = { x: 0, y: 0 }
      const p2 = { x: 3, y: 4 } // edge length = 5
      const { p3x, p3y, p4x, p4y } = calculateSquareVertices(p1.x, p1.y, p2.x, p2.y)

      const side1 = Math.hypot(p2.x - p1.x, p2.y - p1.y)
      const side2 = Math.hypot(p3x - p2.x, p3y - p2.y)
      const side3 = Math.hypot(p4x - p3x, p4y - p3y)
      const side4 = Math.hypot(p1.x - p4x, p1.y - p4y)

      expect(side1).toBe(5)
      expect(side2).toBeCloseTo(5, 2)
      expect(side3).toBeCloseTo(5, 2)
      expect(side4).toBeCloseTo(5, 2)

      // Check perpendicularity: dot product of vector(p1->p2) and vector(p2->p3) == 0
      const dot = (p2.x - p1.x) * (p3x - p2.x) + (p2.y - p1.y) * (p3y - p2.y)
      expect(dot).toBeCloseTo(0, 2)
    })

    it('handles identical points (degenerate edge) with fallback offset', () => {
      const { p3x, p3y, p4x, p4y } = calculateSquareVertices(2, 2, 2, 2)
      expect(p3x).toBe(2)
      expect(p3y).toBe(0)
      expect(p4x).toBe(2)
      expect(p4y).toBe(0)
    })
  })

  describe('calculateRectangleVertices', () => {
    it('constructs an orthogonal rectangle with right angles and equal opposite sides', () => {
      const p1 = { x: 0, y: 0 }
      const p2 = { x: 6, y: 0 }
      const p3Guide = { x: 6, y: 4 }

      const { p3x, p3y, p4x, p4y } = calculateRectangleVertices(p1.x, p1.y, p2.x, p2.y, p3Guide.x, p3Guide.y)

      expect(p3x).toBe(6)
      expect(p3y).toBe(4)
      expect(p4x).toBe(0)
      expect(p4y).toBe(4)

      // Verify right angles
      const dot1 = (p2.x - p1.x) * (p3x - p2.x) + (p2.y - p1.y) * (p3y - p2.y)
      const dot2 = (p3x - p2.x) * (p4x - p3x) + (p3y - p2.y) * (p4y - p3y)
      expect(dot1).toBeCloseTo(0, 2)
      expect(dot2).toBeCloseTo(0, 2)
    })

    it('projects arbitrary guide point onto perpendicular axis', () => {
      const p1 = { x: 0, y: 0 }
      const p2 = { x: 4, y: 0 }
      const p3Arbitrary = { x: 99, y: -3 } // guide point below the line

      const { p3x, p3y, p4x, p4y } = calculateRectangleVertices(p1.x, p1.y, p2.x, p2.y, p3Arbitrary.x, p3Arbitrary.y)

      expect(p3x).toBe(4)
      expect(p3y).toBe(-3)
      expect(p4x).toBe(0)
      expect(p4y).toBe(-3)
    })
  })

  describe('calculateRhombusVertices', () => {
    it('creates a rhombus with all 4 sides having exact same length', () => {
      const p1 = { x: 0, y: 0 }
      const p2 = { x: 4, y: 0 } // side length = 4
      const p3Guide = { x: 6, y: 3 }

      const { p3x, p3y, p4x, p4y } = calculateRhombusVertices(p1.x, p1.y, p2.x, p2.y, p3Guide.x, p3Guide.y)

      const side1 = Math.hypot(p2.x - p1.x, p2.y - p1.y)
      const side2 = Math.hypot(p3x - p2.x, p3y - p2.y)
      const side3 = Math.hypot(p4x - p3x, p4y - p3y)
      const side4 = Math.hypot(p1.x - p4x, p1.y - p4y)

      expect(side1).toBe(4)
      expect(side2).toBeCloseTo(4, 2)
      expect(side3).toBeCloseTo(4, 2)
      expect(side4).toBeCloseTo(4, 2)

      // Opposite sides must be parallel: vector(p1->p2) == vector(p4->p3)
      expect(p3x - p4x).toBeCloseTo(p2.x - p1.x, 2)
      expect(p3y - p4y).toBeCloseTo(p2.y - p1.y, 2)
    })
  })

  describe('calculateParallelogramVertices', () => {
    it('calculates vertex D such that D = A + C - B', () => {
      const A = { x: 0, y: 0 }
      const B = { x: 5, y: 0 }
      const C = { x: 7, y: 3 }

      const { p4x, p4y } = calculateParallelogramVertices(A.x, A.y, B.x, B.y, C.x, C.y)

      expect(p4x).toBe(2) // 0 + 7 - 5 = 2
      expect(p4y).toBe(3) // 0 + 3 - 0 = 3

      // Vector AB must equal Vector DC
      expect(B.x - A.x).toBe(C.x - p4x)
      expect(B.y - A.y).toBe(C.y - p4y)

      // Vector AD must equal Vector BC
      expect(p4x - A.x).toBe(C.x - B.x)
      expect(p4y - A.y).toBe(C.y - B.y)
    })
  })

  describe('enforcePolygonConstraints', () => {
    it('preserves parallelogram rigidity when modifying point D', () => {
      const elements: JsxGraphElement[] = [
        { type: 'point', id: 'pA', parents: [0, 0] },
        { type: 'point', id: 'pB', parents: [5, 0] },
        { type: 'point', id: 'pC', parents: [7, 3] },
        { type: 'point', id: 'pD', parents: [2, 3] },
        { type: 'polygon', id: 'poly1', subtype: 'parallelogram', parents: ['pA', 'pB', 'pC', 'pD'] },
      ]

      // Modify pD to (3, 4) -> pB should adjust to A + C - D = (0+7-3, 0+3-4) = (4, -1)
      elements[3].parents = [3, 4]
      const updated = enforcePolygonConstraints(elements, 'pD')
      const pB = updated.find(e => e.id === 'pB')

      expect(pB?.parents?.[0]).toBe(4)
      expect(pB?.parents?.[1]).toBe(-1)
    })

    it('returns original elements if modified point is not part of a special polygon', () => {
      const elements: JsxGraphElement[] = [
        { type: 'point', id: 'pX', parents: [1, 1] },
        { type: 'point', id: 'pY', parents: [2, 2] },
      ]
      const updated = enforcePolygonConstraints(elements, 'pX')
      expect(updated).toEqual(elements)
    })
  })
})
