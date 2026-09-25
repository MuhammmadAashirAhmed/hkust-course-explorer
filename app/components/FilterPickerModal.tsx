import { FlatList, Modal, Pressable, TouchableOpacity, View, ViewStyle } from "react-native"

import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

import { Icon } from "./Icon"
import { Text } from "./Text"

export interface FilterOption {
  value: string
  label: string
}

interface FilterPickerModalProps {
  visible: boolean
  title: string
  /** First entry is always injected as the "All" option. */
  options: FilterOption[]
  selectedValue: string
  allLabel: string
  onSelect: (value: string) => void
  onClose: () => void
}

/**
 * A simple full-height modal list picker, used for the department and
 * semester filters. Kept deliberately plain (no extra picker dependency)
 * since the app only needs single-select from a scrollable list.
 */
export function FilterPickerModal(props: FilterPickerModalProps) {
  const { visible, title, options, selectedValue, allLabel, onSelect, onClose } = props
  const { themed, theme } = useAppTheme()

  const data: FilterOption[] = [{ value: "", label: allLabel }, ...options]

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={themed($backdrop)} onPress={onClose} />
      <View style={themed($sheet)}>
        <View style={themed($header)}>
          <Text preset="subheading" text={title} />
          <TouchableOpacity onPress={onClose} hitSlop={12}>
            <Icon icon="x" size={20} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
        <FlatList
          data={data}
          keyExtractor={(item) => item.value || "__all__"}
          initialNumToRender={20}
          renderItem={({ item }) => {
            const selected = item.value === selectedValue
            return (
              <TouchableOpacity
                style={themed([$row, selected && $rowSelected])}
                onPress={() => {
                  onSelect(item.value)
                  onClose()
                }}
              >
                <Text text={item.label} weight={selected ? "bold" : "normal"} />
                {selected && <Icon icon="check" size={18} color={theme.colors.tint} />}
              </TouchableOpacity>
            )
          }}
        />
      </View>
    </Modal>
  )
}

const $backdrop: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
  backgroundColor: "rgba(0,0,0,0.4)",
})

const $sheet: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  maxHeight: "75%",
  backgroundColor: colors.background,
  borderTopLeftRadius: spacing.md,
  borderTopRightRadius: spacing.md,
  paddingTop: spacing.sm,
  paddingBottom: spacing.lg,
})

const $header: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  paddingHorizontal: spacing.md,
  paddingBottom: spacing.sm,
  borderBottomWidth: 1,
  borderBottomColor: colors.separator,
})

const $row: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.sm,
  borderBottomWidth: 1,
  borderBottomColor: colors.separator,
})

const $rowSelected: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.palette.neutral200,
})
