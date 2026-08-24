'use client'

import React, { useEffect, useRef, useState } from 'react'
import JXG from 'jsxgraph'
import './jsxgraph.css'

export const escapeHtml = (str: string) =>
  (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

interface JsxGraphBoardProps {
  shapeCode?: string
  jsxGraphData: any
  width?: string | number
  height?: string | number
  className?: string
  readOnly?: boolean
  onChange?: (updatedJsxGraphData: any) => void
}

export function JsxGraphBoard({ shapeCode = 'board', jsxGraphData, width = '100%', height = 300, className = '', readOnly = true, onChange }: JsxGraphBoardProps) {
  const boardRef = useRef<HTMLDivElement>(null)
  const boardId = `box-${shapeCode}-${Math.random().toString(36).substr(2, 9)}`
  const [error, setError] = useState<string | null>(null)
  const onChangeRef = useRef(onChange)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    let board: any = null
    let cleanup: (() => void) | null = null;

    try {
      if (boardRef.current && jsxGraphData) {
        // Init board
        const boundingbox = jsxGraphData.boundingbox || [-5, 5, 5, -5]

        const showGrid = jsxGraphData.grid !== false
        const showAxis = showGrid && (jsxGraphData.axis !== false)

        board = JXG.JSXGraph.initBoard(boardRef.current.id, {
          boundingbox: boundingbox,
          axis: true,
          grid: { majorStep: 1 },
          defaultAxes: {
            x: { ticks: { ticksDistance: 1, insertTicks: false, label: { autoPosition: true } } },
            y: { ticks: { ticksDistance: 1, insertTicks: false, label: { autoPosition: true } } }
          },
          keepaspectratio: true,
          resize: { enabled: true, throttle: 200 },
          showNavigation: !readOnly,
          showCopyright: false,
          showInfobox: !readOnly,
          pan: { enabled: !readOnly, needShift: true, needTwoFingers: false },
          zoom: { enabled: !readOnly, wheel: !readOnly, needShift: false }
        } as any)

        if (board.defaultAxes) {
          if (board.defaultAxes.x) {
            (board.defaultAxes.x as any).setAttribute({ visible: showAxis });
            if (showAxis) (board.defaultAxes.x as any).showElement?.();
            else (board.defaultAxes.x as any).hideElement?.();
          }
          if (board.defaultAxes.y) {
            (board.defaultAxes.y as any).setAttribute({ visible: showAxis });
            if (showAxis) (board.defaultAxes.y as any).showElement?.();
            else (board.defaultAxes.y as any).hideElement?.();
          }
        }
        if (board.grids) {
          if (Array.isArray(board.grids)) {
            board.grids.forEach((g: any) => {
              g?.setAttribute?.({ visible: showGrid });
              if (showGrid) g?.showElement?.();
              else g?.hideElement?.();
            });
          } else {
            Object.values(board.grids).forEach((g: any) => {
              (g as any)?.setAttribute?.({ visible: showGrid });
              if (showGrid) (g as any)?.showElement?.();
              else (g as any)?.hideElement?.();
            });
          }
        }
        if (board.objectsList) {
          board.objectsList.forEach((obj: any) => {
            if (obj.elType === 'grid') {
              obj.setAttribute({ visible: showGrid });
              if (showGrid) obj.showElement?.();
              else obj.hideElement?.();
            }
          });
        }

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

        // Custom right-click panning & point dragging synchronization
        let isPanning = false;
        let lastX = 0, lastY = 0;
        const newPointMap: any = {}

        board.on('down', (e: any) => {
          if (!readOnly && e.button === 2) {
            isPanning = true;
            lastX = e.clientX || e.touches?.[0]?.clientX || 0;
            lastY = e.clientY || e.touches?.[0]?.clientY || 0;
          }
        });

        board.on('move', (e: any) => {
          if (isPanning) {
            const cx = e.clientX || e.touches?.[0]?.clientX || 0;
            const cy = e.clientY || e.touches?.[0]?.clientY || 0;
            const dx = cx - lastX;
            const dy = cy - lastY;
            lastX = cx;
            lastY = cy;

            if (board) {
              board.moveOrigin(board.origin.scrCoords[1] + dx, board.origin.scrCoords[2] + dy);
            }
          }
        });

        board.on('up', (e: any) => {
          if (e.button === 2) {
            isPanning = false;
          }
          if (!readOnly && onChangeRef.current && jsxGraphData?.elements) {
            const updatedElements = jsxGraphData.elements.map((el: any) => {
              const normType = (el.type || '').toString().toLowerCase()
              if (normType === 'point') {
                const keys = [el.id, el.label, el.name].filter(Boolean)
                let p: any = null
                for (const k of keys) {
                  if (newPointMap[k]) { p = newPointMap[k]; break; }
                }
                if (p && typeof p.X === 'function' && typeof p.Y === 'function') {
                  const newX = Math.round(p.X() * 100) / 100
                  const newY = Math.round(p.Y() * 100) / 100
                  return { ...el, x: newX, y: newY, X: newX, Y: newY }
                }
              } else if (normType === 'text') {
                const txtObj = board.objects[el.id]
                if (txtObj && typeof txtObj.X === 'function' && typeof txtObj.Y === 'function') {
                  const newX = Math.round(txtObj.X() * 100) / 100
                  const newY = Math.round(txtObj.Y() * 100) / 100
                  return { ...el, x: newX, y: newY, parents: [newX, newY] }
                }
              }
              return el
            })

            onChangeRef.current({
              ...jsxGraphData,
              elements: updatedElements
            })
          }
        });

        // Prevent context menu aggressively using capture phase on document
        const currentBoardRef = boardRef.current;
        const preventContext = (e: Event) => {
          const mouseEvent = e as MouseEvent;
          if (currentBoardRef && mouseEvent.clientX !== undefined) {
            const rect = currentBoardRef.getBoundingClientRect();
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

        // Reconstruct elements (Sort points first so references like centerId/pointId exist in newPointMap)
        if (jsxGraphData.elements && Array.isArray(jsxGraphData.elements)) {
          // Pre-pass: Check if point coordinates are on a large/pixel scale (> 15) and scale them down to standard Cartesian bounds
          const allPoints: { el: any; x: number; y: number }[] = []
          jsxGraphData.elements.forEach((el: any) => {
            const normType = (el.type || '').toString().toLowerCase()
            if (normType === 'point') {
              let px = el.x ?? el.X ?? (Array.isArray(el.parents) && typeof el.parents[0] === 'number' ? el.parents[0] : undefined)
              let py = el.y ?? el.Y ?? (Array.isArray(el.parents) && typeof el.parents[1] === 'number' ? el.parents[1] : undefined)
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
            const spanX = maxX - minX
            const spanY = maxY - minY
            const maxSpan = Math.max(spanX, spanY)
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
                p.el.X = newX
                p.el.Y = newY
                if (Array.isArray(p.el.parents) && typeof p.el.parents[0] === 'number') {
                  p.el.parents = [newX, newY]
                }
              })

              jsxGraphData.elements.forEach((el: any) => {
                if ((el.type || '').toString().toLowerCase() === 'circle') {
                  if (typeof el.radius === 'number') {
                    el.radius = Math.round(el.radius * scaleFactor * 10) / 10
                  }
                  if (typeof el.rad === 'number') {
                    el.rad = Math.round(el.rad * scaleFactor * 10) / 10
                  }
                }
              })
            }
          }

          const pointCoords: { x: number; y: number }[] = []

          const sortedElements = [...jsxGraphData.elements].sort((a: any, b: any) => {
            const typeA = (a.type || '').toString().toLowerCase()
            const typeB = (b.type || '').toString().toLowerCase()
            if (typeA === 'point' && typeB !== 'point') return -1
            if (typeA !== 'point' && typeB === 'point') return 1
            return 0
          })

          sortedElements.forEach((el: any) => {
            let { type, parents, attributes, id } = el
            const normType = (type || '').toString().toLowerCase()
            const attrs = { ...(attributes || {}) }
            if (id) attrs.id = id
            if (el.label) attrs.name = el.label
            if (readOnly) {
              attrs.fixed = true
              attrs.showInfobox = false
              attrs.highlight = false
            }

            try {
              // Normalize parents & properties for AI-generated format (CanvasElementResponse)
              if (!parents) {
                if (normType === 'point' && (el.x !== undefined || el.X !== undefined) && (el.y !== undefined || el.Y !== undefined)) {
                  const px = Number(el.x ?? el.X)
                  const py = Number(el.y ?? el.Y)
                  parents = [px, py]
                } else if (normType === 'segment' || normType === 'line') {
                  const from = el.fromId || el.startId || el.from || el.start
                  const to = el.toId || el.endId || el.to || el.end
                  if (from && to) parents = [from, to]
                } else if (normType === 'circle') {
                  const centerKey = el.centerId || el.center || el.centerPoint
                  const radOrPoint = el.radius ?? el.rad ?? el.pointId ?? el.point ?? el.pointOnCircle
                  if (centerKey && radOrPoint !== undefined && radOrPoint !== null) {
                    parents = [centerKey, radOrPoint]
                  }
                }
              }

              if (normType === 'point' && parents) {
                const p = board.create('point', parents, attrs)
                const keys = [id, el.label, attrs.name, el.name].filter(Boolean)
                keys.forEach((k: string) => { newPointMap[k] = p })

                if (typeof parents[0] === 'number' && typeof parents[1] === 'number') {
                  pointCoords.push({ x: Number(parents[0]), y: Number(parents[1]) })
                }
              } else if ((normType === 'segment' || normType === 'line') && !el.isVertical) {
                const fromKey = el.fromId || el.startId || el.from || el.start || (parents ? parents[0] : null)
                const toKey = el.toId || el.endId || el.to || el.end || (parents ? parents[1] : null)
                let p1 = newPointMap[fromKey]
                if (!p1 && typeof fromKey === 'string') {
                  const foundKey = Object.keys(newPointMap).find(k => k.toLowerCase() === fromKey.toLowerCase())
                  if (foundKey) p1 = newPointMap[foundKey]
                }
                let p2 = newPointMap[toKey]
                if (!p2 && typeof toKey === 'string') {
                  const foundKey = Object.keys(newPointMap).find(k => k.toLowerCase() === toKey.toLowerCase())
                  if (foundKey) p2 = newPointMap[foundKey]
                }
                if (p1 && p2) {
                  board.create(normType, [p1, p2], attrs)
                }
              } else if (normType === 'circle') {
                const centerKey = el.centerId || el.center || el.centerPoint || (parents ? parents[0] : null)
                let radOrPoint = el.radius ?? el.rad ?? el.radiusValue ?? el.pointId ?? el.point ?? el.pointOnCircle ?? (parents ? parents[1] : null)

                // 1. Resolve Center Point
                let centerPoint = newPointMap[centerKey]
                if (!centerPoint && typeof centerKey === 'string') {
                  const foundKey = Object.keys(newPointMap).find(k => k.toLowerCase() === centerKey.toLowerCase() || k.toLowerCase().includes(centerKey.toLowerCase()))
                  if (foundKey) centerPoint = newPointMap[foundKey]
                }
                if (!centerPoint && Object.keys(newPointMap).length > 0) {
                  const firstKey = Object.keys(newPointMap)[0]
                  centerPoint = newPointMap[firstKey]
                }

                // 2. Resolve Target (Radius number or Point on Circle)
                let target: any = null
                if (typeof radOrPoint === 'number') {
                  target = radOrPoint
                } else if (typeof radOrPoint === 'string') {
                  if (!isNaN(Number(radOrPoint))) {
                    target = Number(radOrPoint)
                  } else {
                    target = newPointMap[radOrPoint]
                    if (!target) {
                      const foundKey = Object.keys(newPointMap).find(k => k.toLowerCase() === radOrPoint.toLowerCase() || k.toLowerCase().includes(radOrPoint.toLowerCase()))
                      if (foundKey) target = newPointMap[foundKey]
                    }
                  }
                }

                // Fallback: If no radius/point found, pick any other point in map
                if (!target && Object.keys(newPointMap).length > 1) {
                  const otherKey = Object.keys(newPointMap).find(k => newPointMap[k] !== centerPoint)
                  if (otherKey) target = newPointMap[otherKey]
                }

                if (centerPoint && target !== undefined && target !== null) {
                  const circleAttrs = {
                    strokeColor: '#2563eb',
                    strokeWidth: 2,
                    fillColor: '#3b82f6',
                    fillOpacity: 0.05,
                    ...attrs
                  }
                  board.create('circle', [centerPoint, target], circleAttrs)

                  // Add circle bounds to pointCoords for auto-fit
                  if (typeof centerPoint.X === 'function' && typeof centerPoint.Y === 'function') {
                    const cx = centerPoint.X()
                    const cy = centerPoint.Y()
                    let r = 3
                    if (typeof target === 'number') {
                      r = target
                    } else if (target && typeof target.X === 'function' && typeof target.Y === 'function') {
                      r = Math.hypot(target.X() - cx, target.Y() - cy)
                    }
                    pointCoords.push({ x: cx - r, y: cy - r })
                    pointCoords.push({ x: cx + r, y: cy + r })
                  }
                }
              } else if (normType === 'functiongraph') {
                let fg;
                const rawExpr = el.parsedFunc || el.func || el.formula || el.expression;
                if (rawExpr) {
                  if (el.isVertical) {
                    const num = parseFloat(rawExpr);
                    fg = board.create('line', [[num, 0], [num, 1]], attrs);
                  } else {
                    const jsExpr = rawExpr
                      .toString()
                      .replace(/\^/g, '**')
                      .replace(/(\d)([a-zA-Z])/g, '$1*$2')
                      .replace(/([a-zA-Z])(\d)/g, '$1*$2');

                    const funcAttrs = {
                      strokeColor: '#10b981',
                      strokeWidth: 2.5,
                      ...attrs
                    };
                    let fn: any;
                    try {
                      if (board.jc) {
                        fn = board.jc.snippet(jsExpr, true, 'x');
                      } else {
                        const isSafeMathExpr = /^[0-9xX\+\-\*\/\^\(\)\.\,\sMath\w]+$/.test(jsExpr)
                          && !jsExpr.includes('window')
                          && !jsExpr.includes('document')
                          && !jsExpr.includes('eval')
                          && !jsExpr.includes('fetch');
                        if (isSafeMathExpr) {
                          fn = new Function('x', `return ${jsExpr}`);
                        } else {
                          fn = jsExpr;
                        }
                      }
                    } catch {
                      fn = jsExpr;
                    }
                    fg = board.create('functiongraph', [fn], funcAttrs);
                  }
                  if (el.id && fg) {
                    fg.id = el.id;
                    board.objects[el.id] = fg;
                  }
                }
              } else if (normType === 'text') {
                let x = el.x ?? el.X ?? (Array.isArray(el.parents) && typeof el.parents[0] === 'number' ? el.parents[0] : 0)
                let y = el.y ?? el.Y ?? (Array.isArray(el.parents) && typeof el.parents[1] === 'number' ? el.parents[1] : 0)
                x = Number(x) || 0
                y = Number(y) || 0
                const textContent = el.text ?? el.content ?? (Array.isArray(el.parents) && typeof el.parents[2] === 'string' ? el.parents[2] : '') ?? el.label ?? el.attributes?.text ?? ''
                const escapedText = escapeHtml(String(textContent))

                const textAttrs = {
                  id: el.id,
                  fontSize: el.attributes?.fontSize || 14,
                  strokeColor: el.attributes?.strokeColor || el.attributes?.color || '#1e293b',
                  fixed: readOnly,
                  highlight: !readOnly,
                  anchorX: 'left',
                  anchorY: 'middle',
                  display: 'html',
                  parse: false,
                  useMathJax: false,
                  useKatex: false,
                  ...attrs
                }
                board.create('text', [x, y, () => escapedText], textAttrs)
                pointCoords.push({ x, y })
              }
            } catch (elementErr) {
              console.error(`[JsxGraphBoard] Error creating element (${el.type || 'unknown'}):`, elementErr, el)
            }
          })

          // Auto-adjust bounding box if points exist while keeping 1:1 aspect ratio (no distortion)
          if (pointCoords.length > 0) {
            const xs = pointCoords.map(p => p.x)
            const ys = pointCoords.map(p => p.y)
            let minX = Math.min(...xs)
            let maxX = Math.max(...xs)
            let minY = Math.min(...ys)
            let maxY = Math.max(...ys)

            if (minX === maxX) { minX -= 2; maxX += 2; }
            if (minY === maxY) { minY -= 2; maxY += 2; }

            const padX = Math.max((maxX - minX) * 0.2, 1.5)
            const padY = Math.max((maxY - minY) * 0.2, 1.5)

            let spanX = (maxX - minX) + 2 * padX
            let spanY = (maxY - minY) + 2 * padY
            const centerX = (minX + maxX) / 2
            const centerY = (minY + maxY) / 2

            // Balance spanX and spanY according to actual container aspect ratio
            if (boardRef.current) {
              const rect = boardRef.current.getBoundingClientRect()
              if (rect.width > 0 && rect.height > 0) {
                const containerAspect = rect.width / rect.height
                if (spanX / spanY < containerAspect) {
                  spanX = spanY * containerAspect
                } else {
                  spanY = spanX / containerAspect
                }
              }
            }

            const finalMinX = centerX - spanX / 2
            const finalMaxX = centerX + spanX / 2
            const finalMinY = centerY - spanY / 2
            const finalMaxY = centerY + spanY / 2

            board.setBoundingBox([finalMinX, finalMaxY, finalMaxX, finalMinY], true)
          }

          // Find and draw ghost points
          const box = board.getBoundingBox();
          const minX = box[0], maxY = box[1], maxX = box[2], minY = box[3];
          const intersections: { x: number, y: number }[] = [];
          const steps = 500;
          const dx = (maxX - minX) / steps;

          const bisection = (f: (x: number) => number, x0: number, x1: number): number | null => {
            let a = x0, b = x1;
            let fa = f(a), fb = f(b);
            if (isNaN(fa) || isNaN(fb) || !isFinite(fa) || !isFinite(fb)) return null;
            if (fa * fb > 0) return null;
            for (let i = 0; i < 40; i++) {
              const m = (a + b) / 2;
              const fm = f(m);
              if (isNaN(fm) || !isFinite(fm)) return null;
              if (Math.abs(fm) < 1e-10) return m;
              if (fa * fm <= 0) {
                b = m; fb = fm;
              } else {
                a = m; fa = fm;
              }
            }
            return (a + b) / 2;
          }

          const addPoint = (x: number, y: number) => {
            if (isNaN(x) || isNaN(y) || !isFinite(x) || !isFinite(y)) return;
            if (x >= minX - 1 && x <= maxX + 1 && y >= minY - 1 && y <= maxY + 1) {
              if (!intersections.some(p => Math.abs(p.x - x) < 1e-3 && Math.abs(p.y - y) < 1e-3)) {
                intersections.push({ x, y });
              }
            }
          }

          const funcGraphs: any[] = [];
          const vLines: number[] = [];

          jsxGraphData.elements.forEach((el: any) => {
            if (el.type === 'functiongraph') {
              const obj = board.objects[el.id];
              if (obj) {
                if (el.isVertical) {
                  vLines.push(parseFloat(el.parsedFunc));
                } else {
                  funcGraphs.push(obj);
                }
              }
            }
          });

          if (minX <= 0 && 0 <= maxX) {
            funcGraphs.forEach(g => {
              const y = g.Y(0);
              if (Math.abs(y) < 1e6) addPoint(0, y);
            });
          }

          funcGraphs.forEach(g => {
            const f = (x: number) => g.Y(x);
            for (let i = 0; i < steps; i++) {
              const x0 = minX + i * dx;
              const x1 = minX + (i + 1) * dx;
              if (f(x0) * f(x1) <= 0) {
                const root = bisection(f, x0, x1);
                if (root !== null && Math.abs(f(root)) < 1e-2) addPoint(root, 0);
              }
            }
          });

          for (let i = 0; i < funcGraphs.length; i++) {
            for (let j = i + 1; j < funcGraphs.length; j++) {
              const g1 = funcGraphs[i];
              const g2 = funcGraphs[j];
              const f = (x: number) => g1.Y(x) - g2.Y(x);
              for (let k = 0; k < steps; k++) {
                const x0 = minX + k * dx;
                const x1 = minX + (k + 1) * dx;
                if (f(x0) * f(x1) <= 0) {
                  const root = bisection(f, x0, x1);
                  if (root !== null && Math.abs(f(root)) < 1e-2) addPoint(root, g1.Y(root));
                }
              }
            }
          }

          vLines.forEach(vx => {
            addPoint(vx, 0);
            funcGraphs.forEach(g => {
              addPoint(vx, g.Y(vx));
            });
          });

          const existingPoints = jsxGraphData.elements.filter((el: any) => (el.type || '').toString().toLowerCase() === 'point');
          const finalGhostPoints = intersections.filter(p => {
            return !existingPoints.some((ep: any) => {
              const epx = ep.x ?? ep.X ?? (Array.isArray(ep.parents) ? ep.parents[0] : undefined);
              const epy = ep.y ?? ep.Y ?? (Array.isArray(ep.parents) ? ep.parents[1] : undefined);
              if (epx === undefined || epy === undefined || isNaN(Number(epx)) || isNaN(Number(epy))) return false;
              return Math.abs(Number(epx) - p.x) < 0.05 && Math.abs(Number(epy) - p.y) < 0.05;
            });
          });

          finalGhostPoints.forEach(p => {
            board.create('point', [p.x, p.y], {
              name: `(${p.x.toFixed(2)}, ${p.y.toFixed(2)})`,
              withLabel: false,
              size: 3,
              fillColor: '#94a3b8',
              strokeColor: '#e2e8f0',
              strokeWidth: 1,
              fixed: true,
              showInfobox: true,
              highlightFillColor: '#3b82f6',
              highlightStrokeColor: '#3b82f6'
            });
          });
        }

        cleanup = () => {
          document.removeEventListener('contextmenu', preventContext, true);
          if (board) {
            JXG.JSXGraph.freeBoard(board)
          }
        }
      }
    } catch (err: any) {
      console.error('Lỗi khi khởi tạo JSXGraph:', err)
      setError(err.message || 'Lỗi hiển thị hình vẽ')
    }

    return () => {
      if (cleanup) {
        cleanup()
      } else if (board) {
        JXG.JSXGraph.freeBoard(board)
      }
    }
  }, [jsxGraphData])

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-rose-50 border border-rose-200 text-rose-600 rounded-xl p-4 ${className}`} style={{ width, height }}>
        <p className="text-sm font-medium">Không thể hiển thị hình vẽ: {error}</p>
      </div>
    )
  }

  return (
    <div className={`relative flex justify-center my-4 ${className}`}>
      <div
        id={boardId}
        ref={boardRef}
        className={`jxgbox border border-slate-200 rounded-xl bg-white shadow-sm ${readOnly ? 'max-w-[500px] w-full' : ''
          }`}
        style={{ width, height }}
        onContextMenu={e => e.preventDefault()}
      />
    </div>
  )
}
