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
}

export function JsxGraphBoard({ shapeCode, jsxGraphData, width = '100%', height = 400, className = '' }: JsxGraphBoardProps) {
  const boardRef = useRef<HTMLDivElement>(null)
  const boardId = `box-${shapeCode}-${Math.random().toString(36).substr(2, 9)}`
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let board: any = null

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
          showNavigation: false,
          showCopyright: false,
        })

        // Reconstruct elements
        if (jsxGraphData.elements && Array.isArray(jsxGraphData.elements)) {
          jsxGraphData.elements.forEach((el: any) => {
            const { type, parents, attributes, id } = el
            if (type && parents) {
              const attrs = { ...(attributes || {}) }
              if (id) attrs.id = id
              
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
      }
    } catch (err: any) {
      console.error('Lỗi khi khởi tạo JSXGraph:', err)
      setError(err.message || 'Lỗi hiển thị hình vẽ')
    }

    return () => {
      if (board) {
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
      />
    </div>
  )
}
