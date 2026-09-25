import { FC, ReactNode } from "react"
import { TouchableOpacity, View, ViewStyle, TextStyle } from "react-native"

import { Button } from "@/components/Button"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { useCourseData } from "@/data/CourseDataContext"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { useHeader } from "@/utils/useHeader"

interface CourseDetailScreenProps extends AppStackScreenProps<"CourseDetail"> {}

export const CourseDetailScreen: FC<CourseDetailScreenProps> = function CourseDetailScreen({
  route,
  navigation,
}) {
  const { code } = route.params
  const { themed, theme } = useAppTheme()
  const { getCourse, isFavorite, toggleFavorite } = useCourseData()
  const course = getCourse(code)

  useHeader(
    {
      title: code,
      leftIcon: "back",
      onLeftPress: () => navigation.goBack(),
    },
    [code],
  )

  if (!course) {
    return (
      <Screen preset="fixed" safeAreaEdges={["top", "bottom"]} contentContainerStyle={$missing}>
        <Text text={`Course "${code}" was not found in the dataset.`} />
        <Button text="Go back" onPress={() => navigation.goBack()} style={$goBackButton} />
      </Screen>
    )
  }

  const credits =
    course.minCredits === course.maxCredits
      ? `${course.minCredits} credit${course.minCredits === 1 ? "" : "s"}`
      : `${course.minCredits}–${course.maxCredits} credits`

  return (
    <Screen preset="scroll" safeAreaEdges={["bottom"]} contentContainerStyle={$content}>
      <View style={themed($section)}>
        <Text preset="heading" text={course.code} />
        <Text preset="subheading" text={course.title} style={themed($titleSpacing)} />

        <TouchableOpacity onPress={() => toggleFavorite(course.code)} style={themed($favoriteRow)}>
          <Text
            text={isFavorite(course.code) ? "★" : "☆"}
            size="lg"
            style={{ color: isFavorite(course.code) ? theme.colors.tint : theme.colors.textDim }}
          />
          <Text
            text={isFavorite(course.code) ? "Saved to favorites" : "Add to favorites"}
            size="xs"
            style={themed($favoriteLabel)}
          />
        </TouchableOpacity>
      </View>

      <View style={themed($metaRow)}>
        <MetaPill label={credits} />
        <MetaPill label={course.departmentName} />
        <MetaPill label={course.careerType} />
        {course.status !== "ACTIVE" && <MetaPill label={course.status} warn />}
      </View>

      {course.description ? (
        <Section title="Description">
          <Text text={course.description} size="sm" style={themed($bodyText)} />
        </Section>
      ) : null}

      <Section title="Offered in">
        <View style={$termWrap}>
          {course.terms.map((t) => (
            <Text key={t.term_code} text={t.term_name} size="xxs" style={themed($termPill)} />
          ))}
        </View>
      </Section>

      <Section title="Prerequisites">
        {course.prerequisiteText ? (
          <>
            <Text text={course.prerequisiteText} size="sm" style={themed($bodyText)} />
            <Button
              text={
                course.prereqCodes.length > 0
                  ? "Explore prerequisite tree"
                  : "No linked courses to explore"
              }
              disabled={course.prereqCodes.length === 0}
              preset="filled"
              style={themed($exploreButton)}
              onPress={() => navigation.navigate("PrerequisiteExplorer", { code: course.code })}
            />
          </>
        ) : (
          <Text text="No prerequisites." size="sm" style={themed($bodyText)} />
        )}
      </Section>

      {course.corequisite ? (
        <Section title="Corequisite">
          <Text text={course.corequisite} size="sm" style={themed($bodyText)} />
        </Section>
      ) : null}

      {course.exclusion ? (
        <Section title="Exclusion">
          <Text text={course.exclusion} size="sm" style={themed($bodyText)} />
        </Section>
      ) : null}
    </Screen>
  )
}

function Section(props: { title: string; children: ReactNode }) {
  const { themed } = useAppTheme()
  return (
    <View style={themed($section)}>
      <Text text={props.title} preset="formLabel" style={themed($sectionTitle)} />
      {props.children}
    </View>
  )
}

function MetaPill(props: { label: string; warn?: boolean }) {
  const { themed } = useAppTheme()
  return (
    <Text text={props.label} size="xxs" style={themed(props.warn ? $metaPillWarn : $metaPill)} />
  )
}

const $content: ViewStyle = { paddingBottom: 48 }

const $missing: ViewStyle = {
  flex: 1,
  alignItems: "center",
  justifyContent: "center",
  padding: 24,
}

const $goBackButton: ViewStyle = {
  marginTop: 16,
}

const $section: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.md,
  paddingTop: spacing.md,
})

const $sectionTitle: ThemedStyle<TextStyle> = ({ spacing, colors }) => ({
  marginBottom: spacing.xxs,
  color: colors.textDim,
  textTransform: "uppercase",
})

const $titleSpacing: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginTop: spacing.xxxs,
})

const $bodyText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  lineHeight: 22,
})

const $favoriteRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.xs,
  marginTop: spacing.sm,
})

const $favoriteLabel: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $metaRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  flexWrap: "wrap",
  gap: spacing.xs,
  paddingHorizontal: spacing.md,
  paddingTop: spacing.sm,
})

const $metaPill: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.text,
  backgroundColor: colors.palette.neutral200,
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xxs,
  borderRadius: 12,
  overflow: "hidden",
})

const $metaPillWarn: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.error,
  backgroundColor: colors.errorBackground,
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xxs,
  borderRadius: 12,
  overflow: "hidden",
})

const $termWrap: ViewStyle = {
  flexDirection: "row",
  flexWrap: "wrap",
  gap: 8,
}

const $termPill: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  borderWidth: 1,
  borderColor: colors.border,
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xxs,
  borderRadius: 12,
  overflow: "hidden",
})

const $exploreButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.sm,
})
