import React from 'react'
import { Components } from 'react-markdown'

export const markdownComponents: Components = {
  table: ({ node, ...props }) => (
    <div className="overflow-x-auto my-4 rounded-lg border border-slate-200 dark:border-slate-700">
      <table className="w-full border-collapse text-sm" {...props} />
    </div>
  ),
  thead: ({ node, ...props }) => (
    <thead className="bg-slate-50 dark:bg-slate-800/50" {...props} />
  ),
  th: ({ node, ...props }) => (
    <th className="border-b border-r border-slate-200 dark:border-slate-700 px-4 py-3 text-left font-semibold text-slate-800 dark:text-slate-200 last:border-r-0" {...props} />
  ),
  td: ({ node, ...props }) => (
    <td className="border-b border-r border-slate-200 dark:border-slate-700 px-4 py-3 text-slate-600 dark:text-slate-400 last:border-r-0 last-row:border-b-0 group-last/tr:border-b-0" {...props} />
  ),
  tr: ({ node, ...props }) => (
    <tr className="group/tr hover:bg-slate-50/50 dark:hover:bg-slate-800/25 transition-colors" {...props} />
  )
}
