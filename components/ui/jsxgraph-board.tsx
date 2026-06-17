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
          jsxGraphData.elements.forEach((el: any) => {
            const { type, parents, attributes, id } = el
            if (type && parents) {
              const attrs = { ...(attributes || {}) }
              if (id) attrs.id = id
              if (readOnly) {
                attrs.fixed = true
                attrs.showInfobox = true
                attrs.highlight = true
              }
              
              const resolvedParents = parents.map((p: any) => {
                if (typeof p === 'string' && board.objects[p]) {
                  return board.objects[p]
                }
                return p
              })
              
              board.create(type, resolvedParents, attrs)
            }
          })
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
