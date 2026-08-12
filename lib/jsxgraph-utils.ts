export function normalizeAiGeometryJson(parsed: any) {
  if (!parsed || typeof parsed !== 'object') {
    return { boundingbox: [-5, 5, 5, -5], axis: true, grid: true, elements: [] }
  }

  const elements: any[] = []
  const existingPointIds = new Set<string>()

  // 1. Process top-level points array if present
  if (Array.isArray(parsed.points)) {
    parsed.points.forEach((p: any) => {
      const id = (p.id || p.label || p.name || `P_${elements.length + 1}`).toString()
      const label = p.label || p.name || id
      const x = Number(p.x ?? p.X ?? 0)
      const y = Number(p.y ?? p.Y ?? 0)
      elements.push({
        type: 'point',
        id,
        label,
        name: label,
        x,
        y,
        parents: [x, y]
      })
      existingPointIds.add(id)
      existingPointIds.add(label)
    })
  }

  // 2. Process elements array
  if (Array.isArray(parsed.elements)) {
    parsed.elements.forEach((el: any) => {
      const normType = (el.type || '').toString().toLowerCase()
      if (normType === 'point') {
        const id = (el.id || el.label || el.name || `P_${elements.length + 1}`).toString()
        const label = el.label || el.name || id
        const x = Number(el.x ?? el.X ?? 0)
        const y = Number(el.y ?? el.Y ?? 0)
        if (!existingPointIds.has(id)) {
          elements.push({
            type: 'point',
            id,
            label,
            name: label,
            x,
            y,
            parents: [x, y]
          })
          existingPointIds.add(id)
          existingPointIds.add(label)
        }
      } else if (normType === 'line' || normType === 'segment') {
        const from = (el.from || el.fromId || el.start || el.startId || '').toString()
        const to = (el.to || el.toId || el.end || el.endId || '').toString()
        if (from && to) {
          elements.push({
            type: 'segment',
            from,
            to,
            parents: [from, to]
          })
        }
      } else if (normType === 'circle') {
        const center = (el.center || el.centerId || el.centerPoint || '').toString()
        const radius = el.radius ?? el.rad ?? el.pointOnCircle
        if (center) {
          elements.push({
            type: 'circle',
            center,
            radius,
            parents: [center, radius]
          })
        }
      } else if (normType === 'functiongraph' || normType === 'function_graph' || normType === 'parabola' || normType === 'function') {
        const parsedFunc = el.parsedFunc || el.func || el.formula || el.expression || el.parsedFunction || ''
        elements.push({
          ...el,
          type: 'functiongraph',
          parsedFunc
        })
      } else {
        // Keep other types as-is (e.g. rightAngle, polygon, etc.)
        elements.push(el)
      }
    })
  }

  // 3. Post-pass: Ensure all referenced points in segments, circles, polygons exist
  elements.forEach((el: any) => {
    const normType = (el.type || '').toString().toLowerCase()
    const checkAndAddMissingPoint = (pointId?: string) => {
      if (!pointId) return
      const pid = pointId.toString().trim()
      if (!pid || existingPointIds.has(pid)) return
      // Add missing point with default coordinates
      elements.unshift({
        type: 'point',
        id: pid,
        label: pid,
        name: pid,
        x: 0,
        y: 0,
        parents: [0, 0]
      })
      existingPointIds.add(pid)
    }

    if (normType === 'segment' || normType === 'line') {
      const from = el.from || el.fromId || el.start || el.startId || (Array.isArray(el.parents) ? el.parents[0] : undefined)
      const to = el.to || el.toId || el.end || el.endId || (Array.isArray(el.parents) ? el.parents[1] : undefined)
      checkAndAddMissingPoint(from)
      checkAndAddMissingPoint(to)
    } else if (normType === 'circle') {
      const center = el.center || el.centerId || el.centerPoint || (Array.isArray(el.parents) ? el.parents[0] : undefined)
      const radOrPoint = el.radius ?? el.rad ?? el.pointOnCircle ?? el.pointId ?? (Array.isArray(el.parents) ? el.parents[1] : undefined)
      checkAndAddMissingPoint(center)
      if (typeof radOrPoint === 'string' && isNaN(Number(radOrPoint))) {
        checkAndAddMissingPoint(radOrPoint)
      }
    } else if (normType === 'polygon') {
      const points = el.points || el.vertices || el.parents
      if (Array.isArray(points)) {
        points.forEach((pt: any) => {
          if (typeof pt === 'string') checkAndAddMissingPoint(pt)
          else if (pt && typeof pt === 'object' && pt.id) checkAndAddMissingPoint(pt.id)
        })
      }
    }
  })

  return {
    boundingbox: parsed.boundingbox || [-5, 5, 5, -5],
    axis: parsed.axis !== false,
    grid: parsed.grid !== false,
    elements
  }
}
