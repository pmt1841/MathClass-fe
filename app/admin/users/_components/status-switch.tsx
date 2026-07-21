import { Switch } from '@/components/ui/switch'

interface StatusSwitchProps {
  userId: number
  isActive: boolean
  isCurrentUser: boolean
  isPending: boolean
  onToggle: (userId: number, currentIsActive: boolean) => void
}

export function StatusSwitch({
  userId,
  isActive,
  isCurrentUser,
  isPending,
  onToggle,
}: StatusSwitchProps) {
  return (
    <div className="flex items-center space-x-2">
      <Switch
        id={`status-switch-${userId}`}
        checked={isActive}
        disabled={isPending || isCurrentUser}
        onCheckedChange={() => onToggle(userId, isActive)}
        aria-label={isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
      />
      <span className="text-sm text-muted-foreground select-none">
        {isActive ? 'Khóa' : 'Mở khóa'}
      </span>
    </div>
  )
}
