import React from 'react'

export function TabButton({
  id,
  active,
  onClick,
  icon,
  label,
}: {
  id: string
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      id={id}
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3.5 text-sm font-semibold border-b-2 transition-all duration-200 ${
        active
          ? 'border-primary text-primary'
          : 'border-transparent text-muted-foreground hover:text-foreground hover:border-slate-200'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}
