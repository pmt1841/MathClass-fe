#!/usr/bin/env node
/**
 * MathClass i18n Automation & AST Extraction Pipeline [MAT-404]
 * 
 * Capabilities:
 * 1. AST Parser: Extracts natural language keys, variables {var}, and context from t(...) calls using TypeScript Compiler API.
 * 2. Prune / Dead Key Detection: Identifies unused keys. Prunes with --prune flag, warns otherwise.
 * 3. AI Localization: Incremental translation for missing English keys via Gemini / OpenAI API.
 * 4. CI/CD Safety: --check flag for PR verification (exits with code 1 if keys are missing).
 * 5. Deterministic sorting and atomic file writes.
 */

import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

// ==========================================
// Configuration & Types
// ==========================================

interface ExtractedKey {
  rawKey: string       // Text passed to t()
  context?: string     // Context property if provided
  dictionaryKey: string // Key stored in dictionary (e.g. "Lớp##education" or "Đánh giá năng lực")
  file: string         // File where key was found
  line: number         // Line number
}

interface ScanResult {
  keys: Map<string, ExtractedKey>
  legacyKeysReferenced: Set<string> // Keys with dots that might reference nested objects
}

interface TranslationItem {
  key: string
  text: string
  context?: string
}

// Protected legacy namespace keys that should never be pruned automatically
const PROTECTED_NAMESPACES = new Set([
  'common',
  'sidebar',
  'header',
  'dashboard',
  'classes',
  'assignments',
  'library',
  'credits',
  'creditTasks',
  'reports',
  'settings',
  'auth',
  'bugReport'
])

// ==========================================
// CLI Arguments Parsing
// ==========================================

const args = process.argv.slice(2)
const isCheckMode = args.includes('--check')
const isSafeMode = args.includes('--safe') || args.includes('--no-prune')
const isPruneMode = args.includes('--prune') || (!isSafeMode && !isCheckMode)
const isDryRun = args.includes('--dry-run')
const isVerbose = args.includes('--verbose')

function getArgValue(flag: string): string | undefined {
  const index = args.indexOf(flag)
  if (index !== -1 && index + 1 < args.length) {
    return args[index + 1]
  }
  return undefined
}

// Find dictionaries directory
function resolveDictDir(): string {
  const customDir = getArgValue('--dir') || getArgValue('--dict-dir')
  if (customDir) return path.resolve(process.cwd(), customDir)

  const candidates = [
    path.resolve(process.cwd(), 'dictionaries'),
    path.resolve(process.cwd(), 'messages'),
    path.resolve(process.cwd(), 'src/messages')
  ]

  for (const dir of candidates) {
    if (fs.existsSync(dir)) return dir
  }

  // Default to ./dictionaries
  return path.resolve(process.cwd(), 'dictionaries')
}

const DICT_DIR = resolveDictDir()
const VI_JSON_PATH = path.join(DICT_DIR, 'vi.json')
const EN_JSON_PATH = path.join(DICT_DIR, 'en.json')

// Scan directories
const DEFAULT_SCAN_DIRS = ['app', 'components', 'lib', 'hooks', 'src']
const SCAN_EXTENSIONS = new Set(['.ts', '.tsx'])
const IGNORED_DIRS = new Set([
  'node_modules',
  '.next',
  '.git',
  'dist',
  'build',
  'coverage',
  'e2e',
  '__tests__',
  'test',
  'scripts'
])

// ==========================================
// Raw Codebase Scanner for Smart Safe Prune
// ==========================================

const RAW_SCAN_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.json'])
const RAW_SCAN_IGNORED_DIRS = new Set([
  'node_modules',
  '.next',
  '.git',
  '.idea',
  '.agents',
  '.gemini',
  '.antigravity',
  '.github',
  'dist',
  'build',
  'coverage',
  'dictionaries'
])

export interface RawFileEntry {
  file: string
  content: string
}

export function getCodebaseRawFiles(rootDir: string = process.cwd()): RawFileEntry[] {
  const results: RawFileEntry[] = []
  const selfScriptPath = path.resolve(__dirname, 'i18n-sync.ts')

  function walk(dir: string) {
    if (!fs.existsSync(dir)) return
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      if (RAW_SCAN_IGNORED_DIRS.has(entry.name)) continue
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        walk(fullPath)
      } else if (entry.isFile()) {
        if (
          entry.name === 'package-lock.json' ||
          entry.name.endsWith('.tsbuildinfo') ||
          path.resolve(fullPath) === selfScriptPath
        ) {
          continue
        }
        const ext = path.extname(entry.name)
        if (RAW_SCAN_EXTENSIONS.has(ext)) {
          try {
            const content = fs.readFileSync(fullPath, 'utf-8')
            results.push({
              file: path.relative(rootDir, fullPath),
              content
            })
          } catch {
            // Ignore unreadable files
          }
        }
      }
    }
  }

  walk(rootDir)
  return results
}

// ==========================================
// AST Code Scanner
// ==========================================

function getFilesToScan(dir: string): string[] {
  const results: string[] = []
  if (!fs.existsSync(dir)) return results

  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (!IGNORED_DIRS.has(entry.name)) {
        results.push(...getFilesToScan(fullPath))
      }
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name)
      if (SCAN_EXTENSIONS.has(ext)) {
        results.push(fullPath)
      }
    }
  }
  return results
}

export function scanSourceFile(filePath: string, code: string): ExtractedKey[] {
  const sourceFile = ts.createSourceFile(
    filePath,
    code,
    ts.ScriptTarget.Latest,
    true
  )

  const extracted: ExtractedKey[] = []

  function visit(node: ts.Node) {
    if (ts.isCallExpression(node)) {
      // Check if function call is `t(...)` or `*.t(...)`
      let isTCall = false
      if (ts.isIdentifier(node.expression) && node.expression.text === 't') {
        isTCall = true
      } else if (
        ts.isPropertyAccessExpression(node.expression) &&
        node.expression.name.text === 't'
      ) {
        isTCall = true
      }

      if (isTCall && node.arguments.length > 0) {
        const firstArg = node.arguments[0]
        let rawKey: string | null = null

        if (ts.isStringLiteral(firstArg) || ts.isNoSubstitutionTemplateLiteral(firstArg)) {
          rawKey = firstArg.text
        }

        if (rawKey) {
          let contextVal: string | undefined = undefined

          // Check second argument for options: e.g. { context: 'education' }
          if (node.arguments.length > 1) {
            const secondArg = node.arguments[1]
            if (ts.isObjectLiteralExpression(secondArg)) {
              for (const prop of secondArg.properties) {
                if (
                  ts.isPropertyAssignment(prop) &&
                  (ts.isIdentifier(prop.name) || ts.isStringLiteral(prop.name)) &&
                  prop.name.text === 'context'
                ) {
                  if (
                    ts.isStringLiteral(prop.initializer) ||
                    ts.isNoSubstitutionTemplateLiteral(prop.initializer)
                  ) {
                    contextVal = prop.initializer.text
                  }
                }
              }
            }
          }

          const dictionaryKey = contextVal ? `${rawKey}##${contextVal}` : rawKey
          const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart())

          extracted.push({
            rawKey,
            context: contextVal,
            dictionaryKey,
            file: path.relative(process.cwd(), filePath),
            line: line + 1
          })
        }
      }
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return extracted
}

export function scanCodebase(): ScanResult {
  const keys = new Map<string, ExtractedKey>()
  const legacyKeysReferenced = new Set<string>()

  const scanDirs = DEFAULT_SCAN_DIRS
    .map(d => path.resolve(process.cwd(), d))
    .filter(d => fs.existsSync(d))

  const allFiles: string[] = []
  for (const dir of scanDirs) {
    allFiles.push(...getFilesToScan(dir))
  }

  for (const file of allFiles) {
    const code = fs.readFileSync(file, 'utf-8')
    const fileKeys = scanSourceFile(file, code)

    for (const item of fileKeys) {
      // If key looks like a legacy dotted path (e.g. "assignments.assign")
      if (
        item.rawKey.includes('.') &&
        !item.rawKey.includes(' ') &&
        !item.context &&
        PROTECTED_NAMESPACES.has(item.rawKey.split('.')[0])
      ) {
        legacyKeysReferenced.add(item.rawKey)
      } else {
        keys.set(item.dictionaryKey, item)
      }
    }
  }

  return { keys, legacyKeysReferenced }
}

// ==========================================
// Dictionary Utilities
// ==========================================

function readJsonFile(filePath: string): Record<string, any> {
  if (!fs.existsSync(filePath)) return {}
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(content)
  } catch (err: any) {
    console.error(`[ERROR] Failed to parse JSON file at ${filePath}:`, err.message)
    return {}
  }
}

function writeJsonAtomic(filePath: string, data: Record<string, any>): void {
  const content = JSON.stringify(data, null, 2) + '\n'
  const tempPath = `${filePath}.tmp.${Date.now()}`

  // Validate JSON stringification
  JSON.parse(content)

  fs.writeFileSync(tempPath, content, 'utf-8')
  fs.renameSync(tempPath, filePath)
}

function sortDictionary(dict: Record<string, any>): Record<string, any> {
  const sorted: Record<string, any> = {}
  
  // 1. First sort nested namespace keys (legacy)
  const nestedKeys = Object.keys(dict).filter(
    k => typeof dict[k] === 'object' && dict[k] !== null && !Array.isArray(dict[k])
  ).sort((a, b) => a.localeCompare(b))

  for (const k of nestedKeys) {
    const nestedObj = dict[k]
    const sortedSubObj: Record<string, any> = {}
    Object.keys(nestedObj)
      .sort((a, b) => a.localeCompare(b))
      .forEach(subK => {
        sortedSubObj[subK] = nestedObj[subK]
      })
    sorted[k] = sortedSubObj
  }

  // 2. Then sort flat natural language keys
  const flatKeys = Object.keys(dict).filter(
    k => typeof dict[k] !== 'object' || dict[k] === null
  ).sort((a, b) => a.localeCompare(b, 'vi'))

  for (const k of flatKeys) {
    sorted[k] = dict[k]
  }

  return sorted
}

// ==========================================
// AI Translation Engine (Gemini / OpenAI)
// ==========================================

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

const SYSTEM_PROMPT = `You are an expert localization engineer and translator specializing in EdTech and Mathematics Education software (K-12 and College Math).
Your task is to accurately translate user interface strings from Vietnamese to English.

CRITICAL RULES:
1. Preserve interpolation placeholders EXACTLY as given:
   Examples: {code}, {count}, {name}, {{code}}, {{name}}. Do not alter braces or variable names.
2. Respect the context provided in the input item (e.g., context: "education" vs context: "geometry" for homonyms like "Lớp").
3. Maintain natural, concise, professional software UI/UX tone for teachers and students.
4. Output MUST BE valid JSON strictly matching the format: { "KEY": "TRANSLATED_STRING" }.
5. Do NOT include markdown code blocks, explanations, or any extra text outside the JSON object.`

const BUILTIN_GLOSSARY: Record<string, string> = {
  // Common UI
  "Có": "Yes",
  "Không": "No",
  "Lỗi": "Error",
  "Tập tin": "File",
  "Đã tải lên": "Uploaded",
  "Đang tải lên...": "Uploading...",
  "file": "file",
  "Lưu nháp": "Save draft",
  "Bạn không có quyền truy cập trang này": "You do not have permission to access this page",
  "Đã lưu nháp bài tập thành công!": "Assignment draft saved successfully!",
  "Có lỗi xảy ra khi lưu nháp": "An error occurred while saving draft",
  "Không thể lưu nháp bài tập": "Cannot save assignment draft",
  "Không lấy được ID bài tập sau khi tạo.": "Could not retrieve assignment ID after creation.",
  "Đã đăng bài tập thành công!": "Assignment published successfully!",
  "Tạo bài tập mới": "Create new assignment",
  "Quay lại danh sách": "Back to list",
  "Không thể tải dữ liệu bài tập hoặc bạn không có quyền truy cập": "Cannot load assignment data or you do not have permission",
  "Đã cập nhật bài tập thành công!": "Assignment updated successfully!",
  "Có lỗi xảy ra khi cập nhật": "An error occurred while updating",
  "Không thể cập nhật bài tập": "Cannot update assignment",
  "Quay lại lớp học": "Back to class",
  "Vui lòng chọn Provider trước khi tải danh sách Model.": "Please select a Provider before fetching Model list.",
  "⚡ Tải danh sách Model thành công!": "⚡ Model list fetched successfully!",
  "Đã tìm thấy {count} models từ Provider API.": "Found {count} models from Provider API.",
  "Không tìm thấy Model": "Model not found",
  "Provider API không trả về danh sách model hoặc chưa cấu hình API Key.": "Provider API did not return model list or API Key is unconfigured.",
  "Tải danh sách Model thất bại": "Failed to fetch Model list",
  "AI đang tiếp tục soạn đề bài toán ở chế độ nền. Bạn có thể mở lại bất cứ lúc nào.": "AI is generating math problems in background. You can reopen anytime.",
  "Đã dừng tác vụ và hoàn lại credit.": "Task stopped and credits refunded.",
  "Đã dừng tác vụ đang xử lý (không hoàn credit).": "Task stopped (credits not refunded).",
  "Đã dừng tác vụ sinh đề AI": "AI question generation task stopped",
  "Lỗi khi hủy tác vụ": "Error cancelling task",
  "Đã xóa dữ liệu và làm mới": "Data cleared and refreshed",
  "Vui lòng nhập nội dung yêu cầu bài toán": "Please enter math problem requirements",
  "Đã thay thế nội dung bài tập!": "Assignment content replaced!",
  "Đã bổ sung bài toán vào trình soạn thảo!": "Math problem added to editor!",
  "Tiêu đề phiếu bài tập": "Worksheet Title",
  "Mô tả (Tùy chọn)": "Description (Optional)",

  // Validation messages
  "Email là bắt buộc": "Email is required",
  "Email không hợp lệ": "Invalid email address",
  "Mật khẩu là bắt buộc": "Password is required",
  "Vui lòng xác nhận mật khẩu": "Please confirm your password",
  "Mật khẩu xác nhận không khớp": "Passwords do not match",
  "Mật khẩu không khớp.": "Passwords do not match.",
  "Mật khẩu không khớp": "Passwords do not match",
  "Họ và tên phải có ít nhất 2 ký tự": "Full name must be at least 2 characters",
  "Họ và tên chỉ được chứa chữ cái và khoảng trắng": "Full name can only contain letters and spaces",
  "Số điện thoại phải có đúng 10 chữ số": "Phone number must have exactly 10 digits",
  "Mật khẩu phải có ít nhất 8 ký tự": "Password must be at least 8 characters",
  "Mật khẩu phải có ít nhất 8 ký tự.": "Password must be at least 8 characters.",
  "Mật khẩu không được vượt quá 24 ký tự.": "Password must not exceed 24 characters.",
  "Mật khẩu phải chứa ít nhất một chữ hoa": "Password must contain at least one uppercase letter",
  "Mật khẩu phải chứa ít nhất một chữ thường": "Password must contain at least one lowercase letter",
  "Mật khẩu phải chứa ít nhất một chữ số": "Password must contain at least one number",
  "Mật khẩu phải chứa ít nhất một ký tự đặc biệt": "Password must contain at least one special character",
  "Họ tên không được để trống": "Full name cannot be empty",
  "Họ tên quá dài": "Full name is too long",
  "Số điện thoại không được để trống": "Phone number cannot be empty",
  "Số điện thoại không hợp lệ": "Invalid phone number",
  "Vui lòng chọn loại lỗi bạn gặp phải": "Please select the error type you encountered",
  "Vui lòng nhập mã OTP xác thực 6 số đã gửi về email": "Please enter the 6-digit OTP verification code sent to your email",
  "Bạn chỉ được phép đính kèm tối đa 3 ảnh": "You are only allowed to attach a maximum of 3 images",
  "Vui lòng điền tên lớp học": "Please enter class name",
  "Số học sinh phải là số nguyên": "Number of students must be an integer",
  "Số học sinh tối đa phải lớn hơn 0": "Maximum number of students must be greater than 0",
  "Tiêu đề bài tập không được để trống": "Assignment title cannot be empty",
  "Nội dung bài tập không được để trống": "Assignment content cannot be empty",
  "Chưa nhập tiêu đề": "No title entered",
  "Vui lòng nhập tên hiển thị cho System Prompt": "Please enter a display name for the System Prompt",
  "Vui lòng nhập nội dung System Prompt": "Please enter the System Prompt content",
  "Giáo viên": "Teacher",
  "Học sinh": "Student",
  "Quản trị viên": "Administrator"
}

async function translateSingleViaGoogleFree(text: string): Promise<string> {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=vi&tl=en&dt=t&q=${encodeURIComponent(text)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Google translate status ${res.status}`)
  const data = await res.json()
  if (Array.isArray(data) && Array.isArray(data[0])) {
    return data[0].map((item: any) => item[0]).filter(Boolean).join('')
  }
  throw new Error('Unexpected translation response structure')
}

async function callTranslationAi(items: TranslationItem[]): Promise<Record<string, string>> {
  const results: Record<string, string> = {}
  const remainingItems: TranslationItem[] = []

  // 1. Check built-in glossary first
  for (const item of items) {
    if (BUILTIN_GLOSSARY[item.text]) {
      results[item.key] = BUILTIN_GLOSSARY[item.text]
    } else {
      remainingItems.push(item)
    }
  }

  if (remainingItems.length === 0) {
    return results
  }

  const apiKey =
    process.env.TRANSLATION_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.OPENAI_API_KEY

  // 2. If no AI API Key is provided, use Free Google Translate Engine
  if (!apiKey) {
    console.log(
      `🌐 Using Free Translation Engine for ${remainingItems.length} items (no API key required)...`
    )
    for (const item of remainingItems) {
      try {
        const translated = await translateSingleViaGoogleFree(item.text)
        results[item.key] = translated
        if (isVerbose) console.log(`   ✓ "${item.text}" -> "${translated}"`)
        await sleep(60) // polite delay
      } catch (err: any) {
        console.warn(`[WARN] Free translate failed for "${item.text}": ${err.message}`)
        results[item.key] = item.text
      }
    }
    return results
  }

  const isGemini = apiKey.startsWith('AIza') || Boolean(process.env.GEMINI_API_KEY)
  const userContent = JSON.stringify(items, null, 2)

  let lastError: Error | null = null
  const MAX_RETRIES = 3

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (isVerbose) {
        console.log(`[AI] Requesting translation for ${items.length} items (Attempt ${attempt}/${MAX_RETRIES})...`)
      }

      let jsonText = ''

      if (isGemini) {
        // Google Gemini API call
        const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash'
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
        
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  { text: `${SYSTEM_PROMPT}\n\nItems to translate (JSON array):\n${userContent}` }
                ]
              }
            ],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.1
            }
          })
        })

        if (!response.ok) {
          const errText = await response.text()
          throw new Error(`Gemini API HTTP ${response.status}: ${errText}`)
        }

        const data = await response.json()
        jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
      } else {
        // OpenAI API call
        const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: `Translate these items:\n${userContent}` }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.1
          })
        })

        if (!response.ok) {
          const errText = await response.text()
          throw new Error(`OpenAI API HTTP ${response.status}: ${errText}`)
        }

        const data = await response.json()
        jsonText = data.choices?.[0]?.message?.content || '{}'
      }

      // Parse and validate result
      // Clean potential markdown blocks if returned
      const cleanJson = jsonText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()
      const parsed = JSON.parse(cleanJson)

      if (typeof parsed === 'object' && parsed !== null) {
        return parsed
      }
      throw new Error('AI returned non-object response')
    } catch (err: any) {
      lastError = err
      console.warn(`[AI-RETRY] Attempt ${attempt} failed: ${err.message}`)
      if (attempt < MAX_RETRIES) {
        await sleep(1000 * Math.pow(2, attempt - 1))
      }
    }
  }

  throw new Error(`AI Localization failed after ${MAX_RETRIES} attempts: ${lastError?.message}`)
}

// ==========================================
// Main Workflow
// ==========================================

async function main() {
  console.log('🚀 [i18n-sync] Starting AST Extraction & Localization Pipeline [MAT-404]...')
  console.log(`📂 Dictionaries directory: ${DICT_DIR}`)

  // 1. Scan Codebase
  const { keys: extractedKeys, legacyKeysReferenced } = scanCodebase()
  console.log(`🔍 AST Scan completed: Found ${extractedKeys.size} natural language keys and ${legacyKeysReferenced.size} legacy referenced keys.`)

  // 2. Read Existing Dictionaries
  let viDict = readJsonFile(VI_JSON_PATH)
  let enDict = readJsonFile(EN_JSON_PATH)

  // 3. Smart Safe Prune Analysis
  const existingFlatKeys = Object.keys(viDict).filter(
    k => typeof viDict[k] !== 'object' && !PROTECTED_NAMESPACES.has(k)
  )

  const orphanCandidates: string[] = []
  for (const existingKey of existingFlatKeys) {
    if (!extractedKeys.has(existingKey)) {
      orphanCandidates.push(existingKey)
    }
  }

  if (orphanCandidates.length > 0) {
    if (isCheckMode) {
      console.log(`\nℹ️  [CI/CD CHECK] Found ${orphanCandidates.length} keys not in AST t(...). No changes made.`)
    } else if (isSafeMode) {
      console.log(`\n🛡️  [SAFE MODE] Found ${orphanCandidates.length} candidate keys not in AST t(...). Auto-prune is disabled (--safe). Retaining all.`)
    } else {
      console.log(`\n🔎 [SMART SAFE PRUNE] Analyzing ${orphanCandidates.length} candidate keys across codebase (.ts, .tsx, .js, .json)...`)
      const rawFiles = getCodebaseRawFiles()
      if (isVerbose) {
        console.log(`   Indexed ${rawFiles.length} project files for raw string matching.`)
      }

      const retainedKeys: { key: string; foundIn: string }[] = []
      const prunedKeys: string[] = []

      for (const candidateKey of orphanCandidates) {
        const rawSearchStr = candidateKey.includes('##') ? candidateKey.split('##')[0] : candidateKey
        let foundInFile: string | null = null

        for (const fileObj of rawFiles) {
          if (fileObj.content.includes(rawSearchStr)) {
            foundInFile = fileObj.file
            break
          }
        }

        if (foundInFile) {
          retainedKeys.push({ key: candidateKey, foundIn: foundInFile })
        } else {
          prunedKeys.push(candidateKey)
        }
      }

      console.log(`\n📊 Smart Safe Prune Analysis Results:`)
      console.log(`   - ✋ Retained: ${retainedKeys.length} keys (found in code/scripts/dynamic usage)`)
      console.log(`   - 🧹 Safe Pruned: ${prunedKeys.length} keys (not found anywhere in codebase)`)

      if (retainedKeys.length > 0) {
        console.log(`\n✋ [RETAIN] Preserved dynamic/indirect keys in codebase:`)
        for (const item of retainedKeys.slice(0, 10)) {
          console.log(`   * "${item.key}" -> found in ${item.foundIn}`)
        }
        if (retainedKeys.length > 10) {
          console.log(`   ...and ${retainedKeys.length - 10} more retained keys.`)
        }
      }

      if (prunedKeys.length > 0) {
        console.log(`\n🧹 [PRUNE] Removing ${prunedKeys.length} truly dead keys from dictionaries...`)
        for (const deadKey of prunedKeys) {
          delete viDict[deadKey]
          delete enDict[deadKey]
          if (isVerbose) console.log(`   - Deleted: "${deadKey}"`)
        }
        if (!isVerbose) {
          for (const deadKey of prunedKeys.slice(0, 10)) {
            console.log(`   - Deleted: "${deadKey}"`)
          }
          if (prunedKeys.length > 10) {
            console.log(`   ...and ${prunedKeys.length - 10} more deleted keys.`)
          }
        }
      }
    }
  }

  // 4. Update Vietnamese Dictionary
  // Vietnamese values are guaranteed to exist for all extracted keys
  let viAddedCount = 0
  for (const [dictKey, item] of extractedKeys) {
    if (viDict[dictKey] === undefined) {
      // In Vietnamese, store the natural text (or specific text without context suffix)
      viDict[dictKey] = item.rawKey
      viAddedCount++
    }
  }

  // 5. Detect Missing English Translations
  const missingEnItems: TranslationItem[] = []
  for (const [dictKey, item] of extractedKeys) {
    if (!enDict[dictKey] || enDict[dictKey].trim() === '') {
      missingEnItems.push({
        key: dictKey,
        text: item.rawKey,
        context: item.context
      })
    }
  }

  console.log(`\n📊 Localization Status:`)
  console.log(`   - Total natural keys: ${extractedKeys.size}`)
  console.log(`   - New keys added to vi.json: ${viAddedCount}`)
  console.log(`   - Keys missing in en.json: ${missingEnItems.length}`)

  // 6. Check Mode (CI/CD Quality Gate)
  if (isCheckMode) {
    if (missingEnItems.length > 0) {
      console.error(`\n❌ [CI/CD CHECK FAILED] There are ${missingEnItems.length} untranslated keys in en.json:`)
      for (const missing of missingEnItems) {
        console.error(`   - Key: "${missing.key}" (File: ${extractedKeys.get(missing.key)?.file})`)
      }
      console.error('\nRun "npm run i18n:sync" locally to automatically translate them via AI.')
      process.exit(1)
    } else {
      console.log('\n✅ [CI/CD CHECK PASSED] All keys are synchronized and translated.')
      process.exit(0)
    }
  }

  // 7. Sync Mode: Call AI Translation for missing keys
  if (missingEnItems.length > 0) {
    console.log(`\n🤖 Translating ${missingEnItems.length} new keys with AI Localization Pipeline...`)
    
    // Batch translation in groups of 40 to avoid token limits
    const BATCH_SIZE = 40
    for (let i = 0; i < missingEnItems.length; i += BATCH_SIZE) {
      const batch = missingEnItems.slice(i, i + BATCH_SIZE)
      console.log(`   Translating batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(missingEnItems.length / BATCH_SIZE)} (${batch.length} items)...`)
      
      const translatedMap = await callTranslationAi(batch)
      for (const [key, translatedText] of Object.entries(translatedMap)) {
        enDict[key] = translatedText
        if (isVerbose) console.log(`   ✓ "${key}" -> "${translatedText}"`)
      }
    }
  } else {
    console.log('\n✨ All English translations are already up to date.')
  }

  // 8. Deterministic Sort & Safe Atomic Write
  if (!isDryRun) {
    console.log('\n💾 Writing updated dictionaries with sorted keys...')
    const sortedVi = sortDictionary(viDict)
    const sortedEn = sortDictionary(enDict)

    writeJsonAtomic(VI_JSON_PATH, sortedVi)
    writeJsonAtomic(EN_JSON_PATH, sortedEn)
    console.log(`✅ Successfully updated:`)
    console.log(`   - ${path.relative(process.cwd(), VI_JSON_PATH)}`)
    console.log(`   - ${path.relative(process.cwd(), EN_JSON_PATH)}`)
  } else {
    console.log('\n[DRY RUN] Skipping file writes.')
  }

  console.log('\n🎉 [i18n-sync] Completed successfully!\n')
}

// Run CLI
main().catch(err => {
  console.error('\n❌ [FATAL ERROR]:', err)
  process.exit(1)
})

