import { FC, useMemo, useState } from "react"
import { TouchableOpacity, View, ViewStyle, TextStyle } from "react-native"
import { FlashList } from "@shopify/flash-list"

import { CourseRow } from "@/components/CourseRow"
import { EmptyState } from "@/components/EmptyState"
import { FilterPickerModal } from "@/components/FilterPickerModal"
import { Icon } from "@/components/Icon"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { TextField } from "@/components/TextField"
import { useCourseData } from "@/data/CourseDataContext"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { useDebouncedValue } from "@/utils/useDebouncedValue"
import { useSafeAreaInsetsStyle } from "@/utils/useSafeAreaInsetsStyle"

interface CourseListScreenProps extends AppStackScreenProps<"CourseList"> {}

export const CourseListScreen: FC<CourseListScreenProps> = function CourseListScreen({
  navigation,
}) {
  const { themed, theme } = useAppTheme()
  const { departments, terms, courseCount, filterCourses, isFavorite, toggleFavorite } =
    useCourseData()

  const [searchInput, setSearchInput] = useState("")
  const debouncedSearch = useDebouncedValue(searchInput, 150)
  const [departmentCode, setDepartmentCode] = useState("")
  const [termCode, setTermCode] = useState("")
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [pickerOpen, setPickerOpen] = useState<"department" | "term" | null>(null)

  const $topInsets = useSafeAreaInsetsStyle(["top"])

  const results = useMemo(() => {
    const filtered = filterCourses({ search: debouncedSearch, departmentCode, termCode })
    if (!favoritesOnly) return filtered
    return filtered.filter((c) => isFavorite(c.code))
  }, [filterCourses, debouncedSearch, departmentCode, termCode, favoritesOnly, isFavorite])

  const departmentLabel = departmentCode
    ? (departments.find((d) => d.code === departmentCode)?.name ?? departmentCode)
    : "All departments"
  const termLabel = termCode
    ? (terms.find((t) => t.term_code === termCode)?.term_name ?? termCode)
    : "All semesters"

  const hasActiveFilters = !!(departmentCode || termCode || favoritesOnly || debouncedSearch)

  return (
    <Screen preset="fixed" contentContainerStyle={$screen} safeAreaEdges={[]}>
      <View style={themed([$header, $topInsets])}>
        <Text preset="heading" text="Course Explorer" />
        <Text
          text={`${courseCount.toLocaleString()} HKUST courses, all offline`}
          size="xs"
          style={themed($subheading)}
        />

        <TextField
          value={searchInput}
          onChangeText={setSearchInput}
          placeholder="Search by course code or title"
          autoCorrect={false}
          autoCapitalize="characters"
          containerStyle={themed($searchField)}
          LeftAccessory={() => (
            <Icon icon="view" size={18} color={theme.colors.textDim} containerStyle={$searchIcon} />
          )}
          RightAccessory={
            searchInput
              ? () => (
                  <TouchableOpacity onPress={() => setSearchInput("")} hitSlop={10}>
                    <Icon icon="x" size={16} color={theme.colors.textDim} />
                  </TouchableOpacity>
                )
              : undefined
          }
        />

        <View style={$filterRow}>
          <FilterChip
            label={departmentLabel}
            active={!!departmentCode}
            onPress={() => setPickerOpen("department")}
          />
          <FilterChip label={termLabel} active={!!termCode} onPress={() => setPickerOpen("term")} />
          <FilterChip
            label="★ Favorites"
            active={favoritesOnly}
            onPress={() => setFavoritesOnly((v) => !v)}
          />
        </View>

        <Text
          text={`${results.length.toLocaleString()} result${results.length === 1 ? "" : "s"}`}
          size="xxs"
          style={themed($resultCount)}
        />
      </View>

      <FlashList
        data={results}
        keyExtractor={(item) => item.code}
        renderItem={({ item }) => (
          <CourseRow
            course={item}
            isFavorite={isFavorite(item.code)}
            onToggleFavorite={toggleFavorite}
            onPress={(code) => navigation.navigate("CourseDetail", { code })}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            preset="generic"
            heading={hasActiveFilters ? "No courses match" : "No courses"}
            content={
              hasActiveFilters
                ? "Try a different search term or clear a filter."
                : "The dataset appears to be empty."
            }
            style={$emptyState}
          />
        }
        contentContainerStyle={{ paddingBottom: theme.spacing.xl }}
      />

      <FilterPickerModal
        visible={pickerOpen === "department"}
        title="Department"
        allLabel="All departments"
        options={departments.map((d) => ({ value: d.code, label: `${d.code} — ${d.name}` }))}
        selectedValue={departmentCode}
        onSelect={setDepartmentCode}
        onClose={() => setPickerOpen(null)}
      />
      <FilterPickerModal
        visible={pickerOpen === "term"}
        title="Semester"
        allLabel="All semesters"
        options={terms.map((t) => ({ value: t.term_code, label: t.term_name }))}
        selectedValue={termCode}
        onSelect={setTermCode}
        onClose={() => setPickerOpen(null)}
      />
    </Screen>
  )
}

function FilterChip(props: { label: string; active: boolean; onPress: () => void }) {
  const { themed } = useAppTheme()
  return (
    <TouchableOpacity onPress={props.onPress} style={themed([$chip, props.active && $chipActive])}>
      <Text
        text={props.label}
        size="xxs"
        weight={props.active ? "bold" : "normal"}
        numberOfLines={1}
        style={themed(props.active ? $chipTextActive : $chipText)}
      />
    </TouchableOpacity>
  )
}

const $screen: ViewStyle = { flex: 1 }

const $header: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  paddingHorizontal: spacing.md,
  paddingTop: spacing.sm,
  paddingBottom: spacing.xs,
  backgroundColor: colors.background,
})

const $subheading: ThemedStyle<TextStyle> = ({ spacing, colors }) => ({
  marginTop: spacing.xxxs,
  marginBottom: spacing.sm,
  color: colors.textDim,
})

const $searchField: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.xs,
})

const $searchIcon: ViewStyle = {
  marginStart: 10,
  justifyContent: "center",
}

const $filterRow: ViewStyle = {
  flexDirection: "row",
  gap: 8,
  flexWrap: "wrap",
}

const $chip: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xxs,
  borderRadius: 16,
  borderWidth: 1,
  borderColor: colors.border,
  backgroundColor: colors.palette.neutral100,
  maxWidth: 180,
})

const $chipActive: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.tint,
  borderColor: colors.tint,
})

const $chipText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
})

const $chipTextActive: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.neutral100,
})

const $resultCount: ThemedStyle<TextStyle> = ({ spacing, colors }) => ({
  marginTop: spacing.xs,
  color: colors.textDim,
})

const $emptyState: ViewStyle = {
  marginTop: 48,
}
