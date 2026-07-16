import { ClipboardList } from 'lucide-react'

export default function CommunityRepoPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Kho bài tập cộng đồng</h2>
      </div>
      
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="bg-muted p-6 rounded-full mb-6">
          <ClipboardList className="h-16 w-16 text-muted-foreground" />
        </div>
        <h3 className="text-2xl font-semibold mb-2">Tính năng Đang Phát Triển</h3>
        <p className="text-muted-foreground max-w-md">
          Tính năng chia sẻ và tìm kiếm bài tập từ cộng đồng các giáo viên đang được phát triển và sẽ sớm ra mắt trong các bản cập nhật sắp tới.
        </p>
      </div>
    </div>
  )
}
