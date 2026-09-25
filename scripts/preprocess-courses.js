/**
 * Preprocesses the raw courses.json (~28MB, one row per course-per-term-offering)
 * into a smaller, deduplicated dataset that ships inside the app bundle.
 *
 * What it does:
 * 1. Groups the flat rows by "PREFIX NUMBER" (e.g. "COMP 2011"), since the same
 *    course is repeated once per term it was offered in.
 * 2. Keeps only the fields the app actually renders, dropping heavy/unused ones
 *    (cilos, attributes, background, colist, equivalence, reference, timestamp,
 *    vector/vector_display, previous/alternate).
 * 3. Picks the most recent offering (highest term_num) as the "canonical" row for
 *    title/description/credits/prerequisite text, since these rarely change but
 *    when they do, the latest is most relevant to a current student.
 * 4. Extracts a best-effort list of prerequisite course codes from the free-form
 *    prerequisite text via regex, cross-checked against the known course codes in
 *    the dataset. This is intentionally a "reasonable extraction", not a full
 *    boolean-logic (AND/OR) parser, per the brief.
 * 5. Writes two files into app/data/generated/:
 *    - courses.json: the trimmed, deduplicated course records
 *    - meta.json: sorted department and term lists for filter UI, plus counts
 *
 * Run with: node scripts/preprocess-courses.js
 */
const fs = require("fs")
const path = require("path")

const SRC = path.join(__dirname, "..", "courses.json")
const OUT_DIR = path.join(__dirname, "..", "app", "data", "generated")
const OUT_COURSES = path.join(OUT_DIR, "courses.json")
const OUT_META = path.join(OUT_DIR, "meta.json")

// Matches course codes like "COMP 2011", "COMP2011", "MATH1022P", "IEDA 2520"
const CODE_REGEX = /\b([A-Z]{2,4})\s*-?\s*(\d{4}[A-Z]?)\b/g

function normalizeCode(prefix, number) {
  return `${prefix} ${number}`
}

function extractPrereqCodes(text, ownCode, knownCodes) {
  if (!text) return []
  const found = new Set()
  let match
  CODE_REGEX.lastIndex = 0
  while ((match = CODE_REGEX.exec(text)) !== null) {
    const code = normalizeCode(match[1], match[2])
    if (code === ownCode) continue
    if (knownCodes.has(code)) {
      found.add(code)
    }
  }
  return Array.from(found)
}

function main() {
  console.log("Reading", SRC)
  const raw = JSON.parse(fs.readFileSync(SRC, "utf8"))
  console.log(`Loaded ${raw.length} raw rows`)

  // First pass: collect every known course code so prereq extraction only
  // links to courses that actually exist in this dataset.
  const knownCodes = new Set()
  for (const row of raw) {
    if (!row.prefix || !row.number) continue
    knownCodes.add(normalizeCode(row.prefix, row.number))
  }

  // Second pass: group rows by course code.
  const groups = new Map()
  for (const row of raw) {
    if (!row.prefix || !row.number) continue
    const code = normalizeCode(row.prefix, row.number)
    if (!groups.has(code)) groups.set(code, [])
    groups.get(code).push(row)
  }

  const departmentSet = new Map() // code -> nickname/name
  const termSet = new Map() // term_code -> { term_code, term_name, term_num, academic_year }

  const courses = []
  for (const [code, rows] of groups) {
    // Most recent offering wins for descriptive fields.
    rows.sort((a, b) => (b.term_num || 0) - (a.term_num || 0))
    const latest = rows[0]

    const terms = rows
      .map((r) => ({
        term_code: r.term_code,
        term_name: r.term_name,
        term_num: r.term_num,
      }))
      .sort((a, b) => (b.term_num || 0) - (a.term_num || 0))

    const prereqCodes = extractPrereqCodes(latest.prerequisite, code, knownCodes)

    departmentSet.set(latest.department_code, latest.department_nickname || latest.department_code)
    for (const r of rows) {
      if (!termSet.has(r.term_code)) {
        termSet.set(r.term_code, {
          term_code: r.term_code,
          term_name: r.term_name,
          term_num: r.term_num,
        })
      }
    }

    courses.push({
      code, // "COMP 2011" - unique id used throughout the app
      prefix: latest.prefix,
      number: latest.number,
      title: latest.title,
      departmentCode: latest.department_code,
      departmentName: latest.department_nickname || latest.department_code,
      schoolCode: latest.school_code,
      careerType: latest.career_type,
      minCredits: latest.min_credits,
      maxCredits: latest.max_credits,
      description: latest.description || "",
      prerequisiteText: latest.prerequisite || "",
      prereqCodes,
      corequisite: latest.corequisite || "",
      exclusion: latest.exclusion || "",
      status: latest.status,
      terms, // every term this course was offered in, most recent first
    })
  }

  courses.sort((a, b) => a.code.localeCompare(b.code))

  const departments = Array.from(departmentSet.entries())
    .map(([code, name]) => ({ code, name }))
    .sort((a, b) => a.code.localeCompare(b.code))

  const terms = Array.from(termSet.values()).sort((a, b) => (b.term_num || 0) - (a.term_num || 0))

  fs.mkdirSync(OUT_DIR, { recursive: true })
  fs.writeFileSync(OUT_COURSES, JSON.stringify(courses))
  fs.writeFileSync(
    OUT_META,
    JSON.stringify(
      {
        departments,
        terms,
        courseCount: courses.length,
        rawRowCount: raw.length,
        generatedAt: new Date().toISOString(),
      },
      null,
      2,
    ),
  )

  const withPrereqs = courses.filter((c) => c.prereqCodes.length > 0).length
  const withRawPrereqText = courses.filter((c) => c.prerequisiteText).length

  console.log(`Wrote ${courses.length} unique courses -> ${OUT_COURSES}`)
  console.log(`Wrote ${departments.length} departments, ${terms.length} terms -> ${OUT_META}`)
  console.log(
    `Courses with extracted prereq codes: ${withPrereqs} (of ${withRawPrereqText} with prereq text)`,
  )
  console.log(`Output size: ${(fs.statSync(OUT_COURSES).size / 1024 / 1024).toFixed(2)} MB`)
}

main()
