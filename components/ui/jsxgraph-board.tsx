'use client'

import React, { useEffect, useRef, useState } from 'react'
import JXG from 'jsxgraph'
import './jsxgraph.css'

interface JsxGraphBoardProps {
  shapeCode: string
  jsxGraphData: any
  width?: string | number
  height?: string | number
  className?: string
  readOnly?: boolean
}

export function JsxGraphBoard({ shapeCode, jsxGraphData, width = '100%', height = 400, className = '', readOnly = true }: JsxGraphBoardProps) {
  const boardRef = useRef<HTMLDivElement>(null)
  const boardId = `box-${shapeCode}-${Math.random().toString(36).substr(2, 9)}`
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let board: any = null
    let cleanup: (() => void) | null = null;

    try {
      if (boardRef.current && jsxGraphData) {
        // Init board
        const boundingbox = jsxGraphData.boundingbox || [-5, 5, 5, -5]
        const axis = jsxGraphData.axis !== undefined ? jsxGraphData.axis : true
        const grid = jsxGraphData.grid !== undefined ? jsxGraphData.grid : true

        board = JXG.JSXGraph.initBoard(boardRef.current.id, {
          boundingbox: boundingbox,
          axis: axis,
          grid: grid,
          keepaspectratio: true,
          showNavigation: true,
          showCopyright: false,
          showInfobox: true,
          pan: { enabled: true, needShift: true, needTwoFingers: false },
          zoom: { wheel: true, needShift: false }
        })

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

        // Custom right-click panning
        let isPanning = false;
        let lastX = 0, lastY = 0;
        
        board.on('down', (e: any) => {
          if (e.button === 2) {
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

        // Reconstruct elements
        if (jsxGraphData.elements && Array.isArray(jsxGraphData.elements)) {
          const newPointMap: any = {}
          jsxGraphData.elements.forEach((el: any) => {
            const { type, parents, attributes, id } = el
            const attrs = { ...(attributes || {}) }
            if (id) attrs.id = id
            if (readOnly) {
              attrs.fixed = true
              attrs.showInfobox = true
              attrs.highlight = true
            }

            if (type === 'point' && parents) {
              const p = board.create('point', parents, attrs)
              newPointMap[id] = p
            } else if ((type === 'segment' || type === 'line') && parents && !el.isVertical) {
              const resolvedParents = parents.map((p: any) => newPointMap[p] || p)
              board.create(type, resolvedParents, attrs)
            } else if (type === 'circle' && parents) {
              const resolvedParents = parents.map((p: any) => newPointMap[p] || p)
              board.create('circle', resolvedParents, attrs)
            } else if (type === 'functiongraph') {
              let fg;
              if (el.isVertical) {
                const num = parseFloat(el.parsedFunc);
                fg = board.create('line', [[num, 0], [num, 1]], attrs);
              } else {
                fg = board.create('functiongraph', [el.parsedFunc || el.func], attrs);
              }
              if (el.id && fg) fg.id = el.id;
            }
          })

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

          const existingPoints = jsxGraphData.elements.filter((el: any) => el.type === 'point');
          const finalGhostPoints = intersections.filter(p => {
            return !existingPoints.some((ep: any) => Math.abs(ep.parents[0] - p.x) < 0.05 && Math.abs(ep.parents[1] - p.y) < 0.05);
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
        className="jxgbox border border-slate-200 rounded-xl bg-white shadow-sm"
        style={{ width, height }}
        onContextMenu={e => e.preventDefault()}
      />
    </div>
  )
}
