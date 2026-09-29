const fs = require('fs')
const path = require('path')

const file = path.join(__dirname, '../components/assignments/edit-sheet-modal.tsx')
let c = fs.readFileSync(file, 'utf8')

// Chuẩn hóa toàn bộ component definition
const badPart = `export function EditSheetModal({
  open,
  sheetId,
  initialTitle = '',
  initialDescription = '',
  items = [],
  onClose,
  onSuccess,
}: EditSheetModalProps) {
  const { t } = useI18n()
  const { t } = useI18n()
  open,
  sheetId,
  initialTitle = '',
  initialDescription = '',
  items = [],
  onClose,
  onSuccess,
}: EditSheetModalProps) {`

const goodPart = `export function EditSheetModal({
  open,
  sheetId,
  initialTitle = '',
  initialDescription = '',
  items = [],
  onClose,
  onSuccess,
}: EditSheetModalProps) {
  const { t } = useI18n()`

c = c.replace(/\r\n/g, '\n')
const badNorm = badPart.replace(/\r\n/g, '\n')
const goodNorm = goodPart.replace(/\r\n/g, '\n')

c = c.replace(badNorm, goodNorm)
fs.writeFileSync(file, c, 'utf8')
console.log('Fixed clean signature in EditSheetModal')
