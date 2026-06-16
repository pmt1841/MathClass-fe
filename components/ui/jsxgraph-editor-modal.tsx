'use client'

import React, { useState, useEffect, useRef } from 'react'
import { X, Check, MousePointer2, CircleDot, Minus, Circle, Undo, Redo } from 'lucide-react'
import JXG from 'jsxgraph'
import './jsxgraph.css'

interface JsxGraphEditorModalProps {
  open: boolean
  onClose: () => void
  onConfirm: (jsxGraphData: any) => void
}

type ToolType = 'select' | 'point' | 'line' | 'circle'

export function JsxGraphEditorModal({ open, onClose, onConfirm }: JsxGraphEditorModalProps) {
  const boardRef = useRef<HTMLDivElement>(null)
  const [board, setBoard] = useState<any>(null)
  const [activeTool, setActiveTool] = useState<ToolType>('point')
  
  // Undo / Redo States
  interface HistoryState {
    elements: any[]
    selectedPointIds: string[]
  }
  const [history, setHistory] = useState<HistoryState[]>([{ elements: [], selectedPointIds: [] }])
  const [historyIndex, setHistoryIndex] = useState(0)

  // Edit Coordinate Modal State
  const [editingPoint, setEditingPoint] = useState<{ id: string, x: string, y: string } | null>(null)

  const isReadyRef = useRef(false)
  const selectedPointsRef = useRef<any[]>([])

  // Init Board
  useEffect(() => {
    if (!open) {
      if (board) {
        JXG.JSXGraph.freeBoard(board)
        setBoard(null)
      }
      setHistory([{ elements: [], selectedPointIds: [] }])
      setHistoryIndex(0)
      selectedPointsRef.current = []
      isReadyRef.current = false
      setEditingPoint(null)
      return
    }

    setTimeout(() => {
      if (boardRef.current) {
        initBoardWithState({ elements: [], selectedPointIds: [] })
        isReadyRef.current = true
      }
    }, 100)

    return () => {
      if (board) {
        JXG.JSXGraph.freeBoard(board)
      }
    }
  }, [open])

  const initBoardWithState = (state: HistoryState) => {
    if (board) {
      JXG.JSXGraph.freeBoard(board)
    }
    
    if (!boardRef.current) return

    const b = JXG.JSXGraph.initBoard(boardRef.current.id, {
      boundingbox: [-5, 5, 5, -5],
      axis: true,
      grid: true,
      keepaspectratio: true,
      showNavigation: true,
      showCopyright: false,
    })

    const newPointMap: any = {}
    state.elements.forEach(el => {
      if (el.type === 'point') {
        const p = b.create('point', el.parents, { size: 4, name: '', withLabel: false, id: el.id })
        newPointMap[el.id] = p
      } else if (el.type === 'segment') {
        if (newPointMap[el.parents[0]] && newPointMap[el.parents[1]]) {
          b.create('segment', [newPointMap[el.parents[0]], newPointMap[el.parents[1]]], el.attributes || { strokeColor: '#3b82f6', strokeWidth: 2 })
        }
      } else if (el.type === 'circle') {
        if (newPointMap[el.parents[0]] && newPointMap[el.parents[1]]) {
          b.create('circle', [newPointMap[el.parents[0]], newPointMap[el.parents[1]]], el.attributes || { strokeColor: '#ef4444', strokeWidth: 2, fillColor: '#ef4444', fillOpacity: 0.1 })
        }
      }
    })

    setBoard(b)

    // Restore selected points references for tools
    selectedPointsRef.current = state.selectedPointIds
      .map(id => b.objects[id])
      .filter(Boolean)
  }

  const saveHistory = (newElements: any[], overrideSelectedPoints?: any[]) => {
    const selectedPoints = overrideSelectedPoints || selectedPointsRef.current
    const newState: HistoryState = {
      elements: newElements,
      selectedPointIds: selectedPoints.map(p => p.id)
    }
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(newState)
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1
      setHistoryIndex(prevIndex)
      initBoardWithState(history[prevIndex])
    }
  }

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1
      setHistoryIndex(nextIndex)
      initBoardWithState(history[nextIndex])
    }
  }

  // Board interactions
  useEffect(() => {
    if (!board || !isReadyRef.current) return

    const handleDown = (e: any) => {
      const isRightClick = e.button === 2 || e.type === 'contextmenu'
      const usrCoords = board.getUsrCoordsOfMouse(e)
      const scrCoords = board.getMousePosition(e)

      if (isRightClick) {
        // Find if clicked on a point
        for (const el in board.objects) {
          if (board.objects[el].elType === 'point' && board.objects[el].hasPoint(scrCoords[0], scrCoords[1])) {
            const p = board.objects[el]
            setEditingPoint({ id: p.id, x: p.coords.usrCoords[1].toFixed(2), y: p.coords.usrCoords[2].toFixed(2) })
            return
          }
        }
        return
      }

      if (activeTool === 'select') return

      const x = usrCoords[0]
      const y = usrCoords[1]
      
      const currentElements = history[historyIndex].elements

      if (activeTool === 'point') {
        const attrs = { size: 4, name: '', withLabel: false }
        const p = board.create('point', [x, y], attrs)
        saveHistory([...currentElements, { type: 'point', parents: [x, y], id: p.id, attributes: attrs }])
      } else if (activeTool === 'line' || activeTool === 'circle') {
        let clickedPoint: any = null
        for (const el in board.objects) {
          if (board.objects[el].elType === 'point' && board.objects[el].hasPoint(scrCoords[0], scrCoords[1])) {
            clickedPoint = board.objects[el]
            break
          }
        }

        let addedNewPoint = false
        const pointAttrs = { size: 4, name: '', withLabel: false }
        if (!clickedPoint) {
          clickedPoint = board.create('point', [x, y], pointAttrs)
          addedNewPoint = true
        }

        selectedPointsRef.current.push(clickedPoint)

        let nextElements = [...currentElements]
        if (addedNewPoint) {
          nextElements.push({ type: 'point', parents: [x, y], id: clickedPoint.id, attributes: pointAttrs })
        }

        if (selectedPointsRef.current.length === 2) {
          const p1 = selectedPointsRef.current[0]
          const p2 = selectedPointsRef.current[1]
          
          if (activeTool === 'line') {
            const lineAttrs = { strokeColor: '#3b82f6', strokeWidth: 2 }
            board.create('segment', [p1, p2], lineAttrs)
            nextElements.push({ type: 'segment', parents: [p1.id, p2.id], attributes: lineAttrs })
          } else if (activeTool === 'circle') {
            const circleAttrs = { strokeColor: '#ef4444', strokeWidth: 2, fillColor: '#ef4444', fillOpacity: 0.1 }
            board.create('circle', [p1, p2], circleAttrs)
            nextElements.push({ type: 'circle', parents: [p1.id, p2.id], attributes: circleAttrs })
          }
          
          const overriddenSelectedPoints = [...selectedPointsRef.current]
          selectedPointsRef.current = []
          saveHistory(nextElements, []) // Reset selected points in history when line finishes
        } else if (addedNewPoint) {
          saveHistory(nextElements)
        } else {
          // If we just selected an existing point as the first point, update history to save selectedPointIds
          saveHistory(nextElements)
        }
      }
    }

    const handleUp = () => {
      // Check if points were dragged (coords changed)
      if (activeTool === 'select') {
        const currentElements = history[historyIndex].elements
        let changed = false
        const nextElements = currentElements.map(el => {
          if (el.type === 'point') {
            const p = board.objects[el.id]
            if (p) {
              const nx = p.coords.usrCoords[1]
              const ny = p.coords.usrCoords[2]
              if (Math.abs(nx - el.parents[0]) > 0.001 || Math.abs(ny - el.parents[1]) > 0.001) {
                changed = true
                return { ...el, parents: [nx, ny] }
              }
            }
          }
          return el
        })
        if (changed) {
          saveHistory(nextElements)
        }
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
  }, [board, activeTool, history, historyIndex])

  const handleEditCoordinateSave = () => {
    if (!editingPoint) return
    const nx = parseFloat(editingPoint.x)
    const ny = parseFloat(editingPoint.y)
    
    if (isNaN(nx) || isNaN(ny)) {
      setEditingPoint(null)
      return
    }

    const currentElements = history[historyIndex].elements
    const nextElements = currentElements.map(el => {
      if (el.id === editingPoint.id) {
        return { ...el, parents: [nx, ny] }
      }
      return el
    })

    setEditingPoint(null)
    const newState: HistoryState = {
      elements: nextElements,
      selectedPointIds: history[historyIndex].selectedPointIds
    }
    
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(newState)
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
    
    initBoardWithState(newState)
  }

  const handleConfirm = () => {
    const jsxGraphData = {
      boundingbox: [-5, 5, 5, -5],
      axis: true,
      grid: true,
      elements: history[historyIndex].elements
    }
    onConfirm(jsxGraphData)
  }

  const handleToolClick = (tool: ToolType) => {
    setActiveTool(tool)
    selectedPointsRef.current = [] // reset selection when changing tool
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col h-[600px] animate-in zoom-in-95 duration-200">
        
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
          <div className="w-48 bg-white rounded-xl border border-border p-2 flex flex-col gap-1 shadow-sm">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2 pt-2">Công cụ</div>
            
            <button 
              onClick={() => handleToolClick('select')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTool === 'select' ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <MousePointer2 className="w-4 h-4" /> Chọn & Kéo
            </button>
            <button 
              onClick={() => handleToolClick('point')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTool === 'point' ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <CircleDot className="w-4 h-4" /> Thêm điểm
            </button>
            <button 
              onClick={() => handleToolClick('line')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTool === 'line' ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <Minus className="w-4 h-4" /> Đoạn thẳng
            </button>
            <button 
              onClick={() => handleToolClick('circle')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTool === 'circle' ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <Circle className="w-4 h-4" /> Đường tròn
            </button>

            <div className="mt-auto p-3 bg-blue-50 text-blue-800 rounded-lg text-xs font-medium border border-blue-100 leading-relaxed">
              {activeTool === 'point' && "Click vào bảng để tạo điểm mới."}
              {activeTool === 'line' && "Click 2 điểm liên tiếp để nối thành đoạn thẳng."}
              {activeTool === 'circle' && "Click tâm đường tròn, sau đó click một điểm trên viền."}
              {activeTool === 'select' && "Kéo thả để di chuyển. Click chuột phải vào điểm để sửa tọa độ."}
            </div>
          </div>

          {/* Canvas */}
          <div className="flex-1 bg-white rounded-xl border border-border shadow-sm flex items-center justify-center p-4 relative">
            <div 
              id="jxgbox-editor" 
              ref={boardRef} 
              className="jxgbox w-full h-full rounded-lg border border-slate-200" 
            />

            {/* Edit Point Modal */}
            {editingPoint && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl border border-border p-4 w-64 animate-in zoom-in-95">
                <h4 className="font-semibold text-slate-800 mb-3 text-sm flex items-center justify-between">
                  Chỉnh sửa tọa độ
                  <button onClick={() => setEditingPoint(null)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                </h4>
                <div className="space-y-3">
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
                  <button 
                    onClick={handleEditCoordinateSave}
                    className="w-full mt-2 bg-primary text-white font-medium text-sm py-2 rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Lưu thay đổi
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-border bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 bg-white border border-slate-200 rounded-xl transition-colors shadow-sm"
          >
            Hủy bỏ
          </button>
          <button
            onClick={handleConfirm}
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary/95 rounded-xl transition-colors shadow-sm"
          >
            <Check className="w-4 h-4" /> Lưu hình vẽ
          </button>
        </div>
      </div>
    </div>
  )
}
