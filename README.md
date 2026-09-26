# HKUST Course Explorer

A React Native (Expo) app for browsing HKUST's course catalogue, filtering
by department and semester, searching by code or title, and exploring
prerequisite chains as a navigable tree. Built for the USThing App Team
2026-27 Fall technical test.

Everything runs from a local, bundled dataset. There is no backend,
network call, or authentication anywhere in the app.

## Setup and running the app

Requirements: Node 20+, Yarn, and either the Expo Go app on a phone or an
iOS/Android simulator.

```bash
yarn install
yarn start
```

This opens the Expo dev server. Scan the QR code with Expo Go (Android) or
the Camera app (iOS), or press `i` / `a` in the terminal to launch a
simulator. `yarn web` also runs it in a browser, though the primary target
is mobile.

**On a campus network like eduroam:** many university Wi-Fi networks
isolate devices from each other for security, so your phone cannot discover
your laptop's dev server even though both show as connected to the same
network. If the QR code does nothing or Expo Go's "Development servers"
list stays empty, use tunnel mode instead, which routes through the
internet instead of the local network:

```bash
yarn start --tunnel
```

The first run will ask to install `@expo/ngrok` (already listed as a dev
dependency here, so this should be quick).

The bundled dataset (`app/data/generated/`) is already checked in, so no
extra setup step is required before running the app. If you want to
regenerate it from the raw dataset yourself:

```bash
yarn data:build
```

This reads `courses.json` at the repo root (the ~28 MB dataset supplied for
the test) and rewrites `app/data/generated/courses.json` and
`app/data/generated/meta.json`.

## Platforms tested

Developed and typechecked/linted/tested in this environment (no physical
device or simulator was available here, see **Limitations** below).
The code targets iOS, Android, and web through Expo's standard React
Native APIs; nothing platform-specific was used.

## Architecture and state management

The project starts from the [Ignite](https://github.com/infinitered/ignite)
React Native boilerplate that USThing's template repo provided (React
Navigation, a themed component library, MMKV storage, i18n scaffolding). The
demo screens, the login/auth flow, and the podcast-API demo that ship with
that boilerplate were all removed, since this app needs none of them (no
backend or auth is required by the brief). What is kept is the component
library (`Text`, `Button`, `Screen`, `Card`, etc.) and the theme system, so
the app's own screens stay consistent with a design system rather than
hand-rolled styling.

State management is plain React: a single `CourseDataProvider`
(`app/data/CourseDataContext.tsx`) loads the bundled dataset once, builds a
couple of in-memory indexes, and exposes lookups/filtering/favorites through
a context hook (`useCourseData`). There is no Redux/MobX/Zustand: the app's
state is a search string, two filter dropdowns, and a set of favorite course
codes, and prop-drilling that through a single context is simpler than
introducing a state library for it.

Navigation is a single React Navigation native-stack with three screens:

- `CourseListScreen` — catalogue, search, filters, favorites
- `CourseDetailScreen` — one course's full info
- `PrerequisiteExplorerScreen` — the recursive prerequisite tree for one course

Favorites persist across launches via `react-native-mmkv` (already part of
the boilerplate), through the existing `app/utils/storage` helper.

## Dataset processing, search, and filtering

The raw `courses.json` is one row **per course, per term it was offered
in** (15,178 rows across 4 semesters). `scripts/preprocess-courses.js`
(`yarn data:build`) turns that into what the app actually needs:

1. **Dedupe** rows by `"PREFIX NUMBER"` (e.g. `"COMP 2011"`) into one record
   per course, keeping the list of terms it was offered in rather than
   repeating the whole record per term.
2. **Trim** fields the UI never renders (`cilos`, `attributes`, `background`,
   `colist`, `equivalence`, `reference`, `timestamp`, `vector*`,
   `previous`/`alternate`). The most recent offering's title/description/
   credits/prerequisite text is kept as canonical, since these rarely
   change but the latest is the most relevant to a student today.
3. **Extract prerequisite course codes** from the free-form prerequisite
   text with a regex (`/\b([A-Z]{2,4})\s*-?\s*(\d{4}[A-Z]?)\b/g`),
   cross-checked against every course code that actually exists in the
   dataset. This is intentionally a *reasonable extraction*, not a full
   AND/OR boolean parser: a prerequisite string like `"(A OR B) AND C"`
   yields `prereqCodes: [A, B, C]`, and the UI presents it as "these are the
   courses that feed into this one" rather than claiming to model the exact
   boolean logic (the brief explicitly says a full parser isn't expected).
   Free-form requirements with no linkable course code (an IELTS/HKDSE
   score, "approval from instructor", etc.) are preserved as the raw
   `prerequisiteText`, even when `prereqCodes` is empty.

This shrinks the shipped dataset from 28 MB to about 4 MB and 15,178 rows
to 4,030 unique courses, which is what actually gets bundled into the app
(`app/data/generated/courses.json`). The original, unmodified `courses.json`
stays in the repo root, both because the brief asks to include the supplied
dataset and so the preprocessing step is reproducible from source.

At runtime, `CourseDataProvider` builds two things once on startup:

- A `Map<code, Course>` for O(1) lookups (used constantly by the
  Prerequisite Explorer, which resolves each prerequisite code to a full
  course record as the user expands nodes).
- A lowercase `"code title"` search string per course.

Search and filtering (`filterCourses`) is a single `.filter()` pass over
the ~4,000 courses: department and semester are exact matches, and the
search box does a whitespace-tokenized substring match (every typed token
must appear somewhere in the course's code+title), so `"comp 2011"` and
`"2011 comp"` both match `COMP 2011`. At this dataset size a full linear
scan comfortably finishes in low single-digit milliseconds, so no separate
inverted-index or search library was needed. The search box debounces input
by 150ms (`useDebouncedValue`) purely to avoid re-filtering on every
keystroke while typing quickly.

The course list itself is rendered with `@shopify/flash-list` rather than a
plain `FlatList`, since it only mounts the rows currently on screen and
recycles views on scroll, which matters once there are ~4,000 possible rows
to browse.

## Prerequisite traversal

The Prerequisite Explorer (`app/screens/PrerequisiteExplorerScreen.tsx` +
`app/components/PrerequisiteNode.tsx`) renders the course itself as the root
node, and each node's `prereqCodes` as its children, recursively. Each node
is its own collapsed-by-default component (`PrerequisiteNode` renders itself
for each child), so expanding a subtree only fetches/renders what's asked
for rather than eagerly building the entire transitive tree up front.

Cycle handling: every node carries `ancestorPath`, the list of course codes
already shown above it in its own branch (not the whole tree, just this
branch). Before a node is allowed to expand, its own code is checked against
that path. If it's already there, the node still renders (so the user can
see the repeated course and tap into its detail page) but is marked
"already shown above" and cannot expand further, which stops runaway
recursion. This isn't a hypothetical: the dataset contains a real two-course
cycle, `UCMP 6030 <-> UCMP 6040`, each listing the other as a prerequisite,
and it's what this logic was built and checked against. A course listing
itself is handled the same way, as a same-branch self-reference.

Tapping a resolvable node's course code pushes that course's own
`CourseDetailScreen`, so a student can jump straight from "what feeds into
this course" to that course's full details, then explore its own
prerequisites from there.

## Assumptions, limitations, and optional features

- **No live environment to test in.** This was built and validated with
  `tsc --noEmit`, `eslint`, and the Jest suite, all passing, but there was
  no simulator or physical device available in the environment this was
  built in to actually launch the app. Please treat first-run behavior as
  unverified until you run it; a `.maestro` smoke flow
  (`SearchAndOpenCourse.yaml`) is included but likewise unrun.
- **Section/quota data is intentionally absent**, per USThing's Sept 24
  clarification email removing that requirement: the dataset doesn't carry
  section-level quota, enrollment, or waiting-list fields, so nothing in
  this app claims to show them.
- **Prerequisite extraction is code-level, not full boolean logic.** See
  the "Dataset processing" section above. The raw text is always shown
  alongside the extracted tree so nothing is hidden or misrepresented.
- **A course record is deduplicated per code, not per term.** If HKUST
  changed a course's title or prerequisites between semesters, only the
  most recent offering's text is shown; the "Offered in" list on the detail
  screen still shows every term it ran.
- **Favorites persist locally only** (MMKV, on-device), there's no account
  system to sync them anywhere, which matches "no backend required."
- **Going beyond the core requirements:** favorites/persistence (implemented,
  see above) and a department/semester filter UI beyond the minimum. Fuzzy
  search, a dependency-graph visualization, and deeper accessibility polish
  were considered but left out to keep the app small and finished rather
  than adding unfinished extras, per the brief's own guidance.
