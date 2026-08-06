# Đặc tả Frontend: Tag cho bài tập

## Feature

Bổ sung trải nghiệm gắn, hiển thị và lọc tag cho bài tập lẻ trong Kho bài tập.
Tag không áp dụng trực tiếp cho phiếu bài tập trong phạm vi này.

Ba nhóm tag:

- Khối lớp: `10`, `11`, `12`.
- Phân môn: `Đại số`, `Hình học`.
- Độ khó: `Dễ`, `Vừa`, `Khó`.

## Business Goal

- Giúp giáo viên nhận biết ngữ cảnh bài tập ngay khi quét danh sách kho bài.
- Giúp giáo viên tìm nhanh bài phù hợp theo khối, phân môn và độ khó.
- Đảm bảo giáo viên hiểu rõ điều kiện phải đủ tag trước khi chia sẻ bài vào Thư viện cộng đồng.
- Không làm phức tạp hoặc thay đổi luồng quản lý phiếu bài tập hiện có.

## Functional Requirements

- Card bài tập lẻ hiển thị các tag ở hàng đầu tiên, phía trên tên bài tập.
- Card phiếu bài tập không hiển thị tag riêng.
- Giáo viên có thể chỉnh tag qua popover trên card bài Private hoặc trong form tạo/sửa bài.
- Form tạo/sửa hiển thị ba select: Khối lớp, Phân môn, Độ khó; mỗi select cho phép `Chưa chọn`.
- Kho bài tập có nút `Lọc theo tag`, mở popover gồm ba select và nút `Xóa bộ lọc`.
- Filter và keyword kết hợp với nhau; thay đổi filter tải lại danh sách từ server.
- Frontend tải danh sách tag active từ `GET /api/tags`.
- Khi Public bị từ chối do thiếu tag, frontend hiển thị thông báo nghiệp vụ trả về từ BE.

## Business Rules

- Tags là tùy chọn khi giáo viên lưu bài Private hoặc nháp.
- Card bài có đủ tag hiển thị dạng pills ngắn: `10`, `Đại số`, `Vừa`.
- Card thiếu tag hiển thị pill viền nét đứt `Chưa phân loại`.
- Bài Public vẫn hiển thị tag nhưng không cho sửa tag ở card hoặc form.
- Thao tác sửa tag trên bài Public hiển thị toast: `Bài đang được chia sẻ trong Thư viện cộng đồng. Vui lòng chuyển về Riêng tư trước khi chỉnh sửa tag.`
- Để sửa tag Public, giáo viên phải chủ động chuyển bài về Private, sửa tag rồi Public lại.
- FE không tự đổi visibility khi giáo viên chỉnh tag.
- FE không tự suy đoán, tạo hoặc sửa tag; BE là nguồn dữ liệu và nơi thực thi validation cuối cùng.
- Các filter `gradeTagId`, `subjectTagId`, `difficultyTagId` kết hợp theo AND.

## Data Model

```ts
type TagType = 'GRADE' | 'SUBJECT' | 'DIFFICULTY'

interface AssignmentTag {
  id: number
  name: string
  type: TagType
}

interface Assignment {
  // Existing fields
  tags?: AssignmentTag[]
}

interface AssignmentFilter {
  gradeTagId?: number
  subjectTagId?: number
  difficultyTagId?: number
}
```

State UI giữ ba lựa chọn filter độc lập, không lưu tag catalogue vào global store. Query cache của React Query là nguồn dữ liệu dùng chung cho tag catalogue và danh sách assignments.

## API Contract

### Danh sách tag

`GET /api/tags`

`GET /api/tags?type=GRADE`

- Response: `AssignmentTag[]`.
- FE tải một lần khi mở form hoặc popover filter; cache theo query key `['tags']`.

### Tạo/cập nhật bài

Mở rộng payload hiện có:

```json
{
  "tagIds": [1, 4, 7]
}
```

- Form gửi toàn bộ `tagIds` đang chọn.
- Request sửa nhanh từ card chỉ gửi payload update an toàn theo contract BE; sau thành công invalidate query `['assignments']`.

### Lọc danh sách

`GET /api/assignments?gradeTagId=1&subjectTagId=4&difficultyTagId=7`

- Chỉ gửi parameter khi người dùng đã chọn giá trị tương ứng.
- Giữ toàn bộ parameter hiện có: keyword, status, classCode, page và size.

## Validation

- Select tag chỉ nhận tag ID trả về từ API.
- Mỗi nhóm chỉ chọn một giá trị; UI không cho chọn hai tag cùng type.
- Không bắt buộc tag khi lưu Private hoặc nháp.
- Khi người dùng cố Public thiếu tag, hiển thị lỗi BE: `Cần gắn đủ Khối lớp, Phân môn và Độ khó trước khi đăng lên Thư viện cộng đồng.`
- Nếu API lỗi tải tags, disable thao tác chọn/lọc tag và hiện toast có hành động thử lại.
- Nếu cập nhật tag thất bại, không cập nhật lạc quan; giữ giá trị UI trước đó và hiển thị lỗi.

## Implementation Constraints

- Duy trì Next.js, TypeScript, Tailwind, shadcn và React Query patterns hiện có.
- Không thay đổi layout/tương tác của `AssignmentSheet`.
- Reuse `assignmentService` cho API, không gọi axios trực tiếp từ component.
- Các component mới phải responsive; filter popover không làm vỡ toolbar ở mobile.
- Card dùng tag pills nhẹ, không dùng màu quá chói hoặc thêm icon không cần thiết.
- Không hardcode tag ID/tên tag; luôn dùng dữ liệu API.
- Không hiển thị action chỉnh tag cho học sinh hoặc card bài đã giao không thuộc kho giáo viên.

## Decisions After Implementation

- Filter dùng nút biểu tượng phễu mở popover. Mỗi nhóm tag hiển thị toàn bộ
  chips cùng màu với card; click chip để chọn/thay thế, click lại để bỏ chọn.
- Chips nằm phía trên tiêu đề bài lẻ: Khối lớp màu xanh dương, Phân môn indigo,
  Độ khó xanh lá/vàng/đỏ. Chỉ khi response không có tag mới hiện
  `Chưa phân loại`.
- Bấm chips hoặc `Chưa phân loại` trên card bài nguồn Private mở editor nhanh.
  Nút `Lưu tag` canh phải; FE tải chi tiết assignment trước khi PUT vì API
  update `ARCHIVED` yêu cầu title, description và content đầy đủ.
- Sau khi lưu tag thành công, invalidate React Query key `['assignments']` để
  pills đổi ngay, không cần reload.
- Khi Public thất bại do thiếu tag, switch rollback và hiển thị trường
  `error` do BE trả về thay vì toast chung.

## Acceptance Criteria

- Card bài lẻ có tag hiển thị pills ở phía trên tên bài; phiếu không có dòng tag riêng.
- Card bài chưa gắn tag hiển thị `Chưa phân loại`.
- Giáo viên Private chỉnh được tag trong popover card và form tạo/sửa; giao diện cập nhật sau lưu thành công.
- Bài Public khóa tag controls và hiển thị đúng thông báo khi giáo viên muốn sửa.
- Form gửi đúng `tagIds`; trang sửa load đúng tag đã chọn của bài.
- Filter theo từng nhóm, nhiều nhóm AND, xóa filter và kết hợp keyword đều gửi đúng API query parameters.
- Giao diện hoạt động trên desktop và mobile; toolbar không bị tràn.
- Hiển thị lỗi API tải/lưu tags rõ ràng, không làm mất dữ liệu đang chọn.
- Lint, type-check và test liên quan chạy thành công.

## Task Checklist

- [ ] Bổ sung type `TagType`, `AssignmentTag`, `AssignmentFilter` vào service/types.
- [ ] Thêm `getTags` vào `assignmentService` và React Query hook `useTags`.
- [ ] Mở rộng assignment query/hook với ba tag filters.
- [ ] Tạo `AssignmentTagPills` dùng chung cho card và các màn chi tiết cần thiết.
- [ ] Tạo `AssignmentTagEditorPopover` cho card Private, với loading/error/save states.
- [ ] Thêm section `Phân loại bài tập` vào sidebar form tạo/sửa.
- [ ] Load và map tag IDs khi mở trang sửa bài.
- [ ] Khóa controls tag và hiển thị message cho bài Public.
- [ ] Thêm `AssignmentTagFilterPopover` vào toolbar Kho bài tập.
- [ ] Reset page khi filter thay đổi; hỗ trợ `Xóa bộ lọc`.
- [ ] Viết test cho mapping payload, filter params, Public lock và states lỗi.
- [ ] Chạy `npm run lint`, type-check/build và kiểm tra responsive thủ công.
