import { FC } from "react"
import { ScrollView, View, ViewStyle, TextStyle } from "react-native"

import { PrerequisiteNode } from "@/components/PrerequisiteNode"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { useCourseData } from "@/data/CourseDataContext"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { useHeader } from "@/utils/useHeader"

interface PrerequisiteExplorerScreenProps extends AppStackScreenProps<"PrerequisiteExplorer"> {}

/**
 * Root screen for the required "Prerequisite Explorer" challenge. Renders the
 * course itself as the top-level node, then a recursive, expandable tree of
 * everything it depends on. See PrerequisiteNode for the cycle-safety logic.
 */
export const PrerequisiteExplorerScreen: FC<PrerequisiteExplorerScreenProps> =
  function PrerequisiteExplorerScreen({ route, navigation }) {
    const { code } = route.params
    const { themed } = useAppTheme()
    const { getCourse } = useCourseData()
    const course = getCourse(code)

    useHeader(
      {
        title: "Prerequisites",
        leftIcon: "back",
        onLeftPress: () => navigation.goBack(),
      },
      [code],
    )

    const navigateToCourse = (targetCode: string) => {
      // Replace rather than push, so repeatedly drilling into prerequisite
      // courses does not build an unbounded navigation stack.
      navigation.push("CourseDetail", { code: targetCode })
    }

    if (!course) {
      return (
        <Screen preset="fixed" safeAreaEdges={["bottom"]} contentContainerStyle={$missing}>
          <Text text={`Course "${code}" was not found in the dataset.`} />
        </Screen>
      )
    }

    return (
      <Screen preset="fixed" safeAreaEdges={["bottom"]} contentContainerStyle={$screen}>
        <View style={themed($intro)}>
          <Text text={course.code} preset="subheading" />
          <Text text={course.title} size="xs" style={themed($introSubtitle)} />
          <Text
            text="Tap a course to open its details. Tap the arrow to expand its own prerequisites."
            size="xxs"
            style={themed($introHint)}
          />
        </View>

        <ScrollView>
          <PrerequisiteNode
            code={course.code}
            ancestorPath={[]}
            depth={0}
            onNavigateToCourse={navigateToCourse}
          />
        </ScrollView>
      </Screen>
    )
  }

const $screen: ViewStyle = { flex: 1 }

const $missing: ViewStyle = {
  flex: 1,
  alignItems: "center",
  justifyContent: "center",
  padding: 24,
}

const $intro: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.sm,
  borderBottomWidth: 1,
  borderBottomColor: colors.separator,
})

const $introSubtitle: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  marginTop: spacing.xxxs,
})

const $introHint: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  marginTop: spacing.sm,
})
