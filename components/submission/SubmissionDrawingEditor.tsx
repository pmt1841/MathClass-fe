'use client'

import React, { useState, useEffect } from 'react';
import { JsxGraphBoard } from '@/components/ui/jsxgraph-board';
import { useSubmissionDrawing } from '@/hooks/useSubmissionDrawing';
import { Loader2, Save, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface SubmissionDrawingEditorProps {
  submissionId: number;
  shapeCode: string;
  defaultBoardData?: any;
  isDraft: boolean;
}

export function SubmissionDrawingEditor({ 
  submissionId, 
  shapeCode, 
  defaultBoardData = null, 
  isDraft 
}: SubmissionDrawingEditorProps) {
  const { drawing, isLoading, isError, saveDrawingAsync, isSaving } = useSubmissionDrawing(submissionId);
  
  // boardData manages the geometry JSON locally before pushing to DB
  const [boardData, setBoardData] = useState<any>(defaultBoardData);

  useEffect(() => {
    // Override local boardData with DB data if it exists
    if (drawing?.jsxGraphData) {
      setBoardData(drawing.jsxGraphData);
    }
  }, [drawing]);

  const handleSave = async () => {
    try {
      // NOTE: In a fully functional environment, we'd need to extract the real-time elements
      // from the JsxGraphBoard. Assuming JsxGraphBoard fires some onChange to update `boardData`,
      // or we extract the data using a ref. For now, we save the active `boardData`.
      await saveDrawingAsync({
        shapeCode,
        jsxGraphData: boardData || { boundingbox: [-5, 5, 5, -5], axis: true, grid: true, elements: [] },
      });
      toast.success('Lưu hình vẽ thành công');
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || 'Có lỗi xảy ra khi lưu hình vẽ';
      toast.error(errorMsg);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-80 w-full border border-slate-200 rounded-xl bg-slate-50/50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Hình vẽ toán học</h3>
          <p className="text-sm text-slate-500">Mã hình: <span className="font-medium text-slate-700">{shapeCode}</span></p>
        </div>
        
        {isDraft ? (
          <button 
            onClick={handleSave} 
            disabled={isSaving} 
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isSaving ? 'Đang lưu...' : 'Lưu bản nháp'}
          </button>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-sm font-medium">
            <AlertCircle className="w-4 h-4" />
            Chỉ xem (Bài đã nộp)
          </div>
        )}
      </div>

      {isError && !drawing && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg text-sm">
          Chưa có dữ liệu hình vẽ cho bài nộp này. Hãy tương tác và nhấn Lưu để khởi tạo.
        </div>
      )}

      {/* JsxGraphBoard wrapper for dynamic updates */}
      <div className="relative">
        <JsxGraphBoard 
          shapeCode={shapeCode} 
          jsxGraphData={boardData} 
          readOnly={!isDraft} 
        />
        {isSaving && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center rounded-xl z-10">
            <div className="bg-white p-3 rounded-full shadow-lg">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
