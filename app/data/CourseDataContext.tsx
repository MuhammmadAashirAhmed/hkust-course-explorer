import {
  createContext,
  FC,
  PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react"

import { load, save } from "@/utils/storage"

import coursesJson from "./generated/courses.json"
import metaJson from "./generated/meta.json"
import { Course, CourseDataMeta, Department, Term } from "./types"

const FAVORITES_KEY = "CourseExplorer.favoriteCodes"

const courses = coursesJson as Course[]
const meta = metaJson as CourseDataMeta

export interface CourseFilters {
  /** Case-insensitive text matched against course code and title. */
  search: string
  /** Department code, or "" for all departments. */
  departmentCode: string
  /** Term code, or "" for all terms/semesters. */
  termCode: string
}

export const EMPTY_FILTERS: CourseFilters = { search: "", departmentCode: "", termCode: "" }

export type CourseDataContextType = {
  /** Every course in the dataset, sorted by code. */
  allCourses: Course[]
  departments: Department[]
  terms: Term[]
  courseCount: number
  /** O(1) lookup by course code, e.g. "COMP 2011". Undefined if not found. */
  getCourse: (code: string) => Course | undefined
  /** Applies the search text + department/term filters over allCourses. */
  filterCourses: (filters: CourseFilters) => Course[]
  favoriteCodes: Set<string>
  isFavorite: (code: string) => boolean
  toggleFavorite: (code: string) => void
}

export const CourseDataContext = createContext<CourseDataContextType | null>(null)

export const CourseDataProvider: FC<PropsWithChildren> = ({ children }) => {
  // Built once for the lifetime of the app: an index by course code (used by
  // the Prerequisite Explorer to resolve each prereq code to its full record)
  // and a lowercase "search blob" per course so filtering never re-derives it.
  const { byCode, searchBlobs } = useMemo(() => {
    const byCodeMap = new Map<string, Course>()
    const blobs = new Map<string, string>()
    for (const course of courses) {
      byCodeMap.set(course.code, course)
      blobs.set(course.code, `${course.code} ${course.title}`.toLowerCase())
    }
    return { byCode: byCodeMap, searchBlobs: blobs }
  }, [])

  const [favoriteCodes, setFavoriteCodes] = useState<Set<string>>(
    () => new Set(load<string[]>(FAVORITES_KEY) ?? []),
  )

  const getCourse = useCallback((code: string) => byCode.get(code), [byCode])

  const filterCourses = useCallback(
    (filters: CourseFilters) => {
      const search = filters.search.trim().toLowerCase()
      const searchTokens = search.length > 0 ? search.split(/\s+/) : []

      return courses.filter((course) => {
        if (filters.departmentCode && course.departmentCode !== filters.departmentCode) {
          return false
        }
        if (filters.termCode && !course.terms.some((t) => t.term_code === filters.termCode)) {
          return false
        }
        if (searchTokens.length > 0) {
          const blob = searchBlobs.get(course.code) ?? ""
          // Every whitespace-separated token must appear somewhere in "code + title",
          // so "comp 2011" and "2011 comp" both match "COMP 2011".
          if (!searchTokens.every((token) => blob.includes(token))) return false
        }
        return true
      })
    },
    [searchBlobs],
  )

  const isFavorite = useCallback((code: string) => favoriteCodes.has(code), [favoriteCodes])

  const toggleFavorite = useCallback((code: string) => {
    setFavoriteCodes((prev) => {
      const next = new Set(prev)
      if (next.has(code)) {
        next.delete(code)
      } else {
        next.add(code)
      }
      save(FAVORITES_KEY, Array.from(next))
      return next
    })
  }, [])

  const value: CourseDataContextType = {
    allCourses: courses,
    departments: meta.departments,
    terms: meta.terms,
    courseCount: meta.courseCount,
    getCourse,
    filterCourses,
    favoriteCodes,
    isFavorite,
    toggleFavorite,
  }

  return <CourseDataContext.Provider value={value}>{children}</CourseDataContext.Provider>
}

export const useCourseData = () => {
  const context = useContext(CourseDataContext)
  if (!context) throw new Error("useCourseData must be used within a CourseDataProvider")
  return context
}
