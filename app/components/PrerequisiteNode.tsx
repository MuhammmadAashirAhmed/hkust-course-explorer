import { memo, useState } from "react"
import { TouchableOpacity, View, ViewStyle, TextStyle } from "react-native"

import { useCourseData } from "@/data/CourseDataContext"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

import { Icon } from "./Icon"
import { Text } from "./Text"

interface PrerequisiteNodeProps {
  /** Course code this node represents, e.g. "COMP 2011". */
  code: string
  /** Codes of every ancestor already shown above this node in the current branch. */
  ancestorPath: string[]
  depth: number
  onNavigateToCourse: (code: string) => void
}

/**
 * One row of the prerequisite tree. Expands in place to reveal its own
 * prerequisites on tap, recursively rendering itself for each child.
 *
 * Cycle handling: a course is only allowed to expand if its code is not
 * already present in `ancestorPath` (the chain of nodes above it in this
 * branch). If it is, the row still renders but is marked "already shown
 * above" and cannot be expanded again, which is what stops infinite
 * recursion on cycles like the real UCMP 6030 <-> UCMP 6040 pair in this
 * dataset, and on any course that lists itself as advisory background.
 */
export const PrerequisiteNode = memo(function PrerequisiteNode(props: PrerequisiteNodeProps) {
  const { code, ancestorPath, depth, onNavigateToCourse } = props
  const { themed, theme } = useAppTheme()
  const { getCourse } = useCourseData()
  const [expanded, setExpanded] = useState(depth === 0)

  const course = getCourse(code)
  const isCycle = ancestorPath.includes(code)
  const prereqCodes = course?.prereqCodes ?? []
  const hasChildren = prereqCodes.length > 0 && !isCycle

  return (
    <View>
      <View style={[themed($row), { paddingStart: theme.spacing.md + depth * theme.spacing.md }]}>
        <TouchableOpacity
          onPress={() => hasChildren && setExpanded((v) => !v)}
          disabled={!hasChildren}
          hitSlop={8}
          style={$chevronTouch}
        >
          {hasChildren ? (
            <Icon
              icon="caretRight"
              size={14}
              color={theme.colors.textDim}
              style={{ transform: [{ rotate: expanded ? "90deg" : "0deg" }] }}
            />
          ) : (
            <View style={$chevronSpacer} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={$labelTouch}
          onPress={() => course && onNavigateToCourse(course.code)}
          disabled={!course}
        >
          <Text
            text={course ? course.code : code}
            weight="bold"
            size="xs"
            style={themed(course ? $codeText : $missingText)}
          />
          {course && (
            <Text text={course.title} size="xxs" numberOfLines={1} style={themed($titleText)} />
          )}
          {isCycle && (
            <Text
              text="Already shown above, not expanded again"
              size="xxs"
              style={themed($cycleNote)}
            />
          )}
          {!course && (
            <Text
              text="Referenced but not found in this dataset"
              size="xxs"
              style={themed($cycleNote)}
            />
          )}
        </TouchableOpacity>
      </View>

      {expanded && hasChildren && (
        <View>
          {prereqCodes.map((childCode) => (
            <PrerequisiteNode
              key={childCode}
              code={childCode}
              ancestorPath={[...ancestorPath, code]}
              depth={depth + 1}
              onNavigateToCourse={onNavigateToCourse}
            />
          ))}
        </View>
      )}
    </View>
  )
})

const $row: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  flexDirection: "row",
  alignItems: "flex-start",
  paddingVertical: spacing.xs,
  paddingEnd: spacing.md,
  borderBottomWidth: 1,
  borderBottomColor: colors.separator,
})

const $chevronTouch: ViewStyle = {
  width: 24,
  alignItems: "center",
  justifyContent: "center",
  paddingTop: 2,
}

const $chevronSpacer: ViewStyle = { width: 14, height: 14 }

const $labelTouch: ViewStyle = { flex: 1 }

const $codeText: ThemedStyle<TextStyle> = ({ colors }) => ({ color: colors.text })

const $missingText: ThemedStyle<TextStyle> = ({ colors }) => ({ color: colors.textDim })

const $titleText: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  marginTop: spacing.xxxs,
})

const $cycleNote: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.tint,
  marginTop: spacing.xxxs,
  fontStyle: "italic",
})
