/**
 * Shapes for the preprocessed course dataset.
 * See scripts/preprocess-courses.js for how these are derived from the raw
 * ~28MB courses.json dump.
 */

export interface CourseTermOffering {
  term_code: string
  term_name: string
  term_num: number
}

export interface Course {
  /** Unique id, e.g. "COMP 2011". Same as `${prefix} ${number}`. */
  code: string
  prefix: string
  number: string
  title: string
  departmentCode: string
  departmentName: string
  schoolCode: string
  careerType: string
  minCredits: number
  maxCredits: number
  description: string
  /** Raw prerequisite text exactly as published, e.g. "COMP 2011 AND MATH 2111". */
  prerequisiteText: string
  /**
   * Course codes extracted from `prerequisiteText` that exist elsewhere in this
   * dataset. This is a best-effort extraction (see preprocess-courses.js), not a
   * full AND/OR boolean parse: a course listing "(A OR B) AND C" simply yields
   * prereqCodes = [A, B, C], and the Prerequisite Explorer presents them as "what
   * feeds into this course" rather than claiming to know the exact boolean logic.
   */
  prereqCodes: string[]
  corequisite: string
  exclusion: string
  status: string
  /** Every term this course was offered in, most recent first. */
  terms: CourseTermOffering[]
}

export interface Department {
  code: string
  name: string
}

export interface Term {
  term_code: string
  term_name: string
  term_num: number
}

export interface CourseDataMeta {
  departments: Department[]
  terms: Term[]
  courseCount: number
  rawRowCount: number
  generatedAt: string
}
