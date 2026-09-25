import { memo } from "react"
import { TouchableOpacity, View, ViewStyle, TextStyle } from "react-native"

import { Course } from "@/data/types"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

import { Icon } from "./Icon"
import { Text } from "./Text"

interface CourseRowProps {
  course: Course
  onPress: (code: string) => void
  isFavorite?: boolean
  onToggleFavorite?: (code: string) => void
}

/**
 * A single row in the course catalogue / search results / favorites list.
 * Memoized since it renders inside a virtualized list of thousands of rows.
 */
export const CourseRow = memo(function CourseRow(props: CourseRowProps) {
  const { course, onPress, isFavorite, onToggleFavorite } = props
  const { themed, theme } = useAppTheme()

  return (
    <TouchableOpacity
      style={themed($container)}
      onPress={() => onPress(course.code)}
      activeOpacity={0.7}
    >
      <View style={$textColumn}>
        <View style={$codeRow}>
          <Text text={course.code} weight="bold" size="sm" />
          <Text text={`${course.minCredits} cr`} size="xxs" style={themed($creditPill)} />
        </View>
        <Text text={course.title} size="xs" numberOfLines={2} style={themed($title)} />
        <Text text={course.departmentName} size="xxs" style={themed($department)} />
      </View>

      {onToggleFavorite && (
        <TouchableOpacity
          hitSlop={10}
          onPress={() => onToggleFavorite(course.code)}
          style={$favoriteButton}
        >
          <Text
            text={isFavorite ? "★" : "☆"}
            size="lg"
            style={{ color: isFavorite ? theme.colors.tint : theme.colors.textDim }}
          />
        </TouchableOpacity>
      )}

      <Icon icon="caretRight" size={16} color={theme.colors.textDim} />
    </TouchableOpacity>
  )
})

const $textColumn: ViewStyle = {
  flex: 1,
}

const $codeRow: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: 8,
}

const $container: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  flexDirection: "row",
  alignItems: "center",
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.sm,
  borderBottomWidth: 1,
  borderBottomColor: colors.separator,
  gap: spacing.xs,
})

const $title: ThemedStyle<TextStyle> = ({ spacing, colors }) => ({
  marginTop: spacing.xxxs,
  color: colors.text,
})

const $department: ThemedStyle<TextStyle> = ({ spacing, colors }) => ({
  marginTop: spacing.xxxs,
  color: colors.textDim,
})

const $creditPill: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $favoriteButton: ViewStyle = {
  paddingHorizontal: 4,
}
