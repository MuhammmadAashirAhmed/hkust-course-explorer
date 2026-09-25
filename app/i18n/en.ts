/**
 * Static UI chrome translations. The course catalogue itself (titles,
 * descriptions, departments) is real HKUST data and is not translated.
 *
 * This app only ships English, the boilerplate's multi-locale scaffolding
 * (ar/es/fr/hi/ja/ko + a per-locale demo namespace) was removed since it
 * was unused surface area unrelated to the technical test.
 */
const en = {
  common: {
    ok: "OK!",
    cancel: "Cancel",
    back: "Back",
  },
  errorScreen: {
    title: "Something went wrong!",
    friendlySubtitle:
      "This is the screen you will see in production when an error is thrown. You'll want to customize this message and probably the layout as well.",
    reset: "RESET APP",
    traceTitle: "Error from %{name} stack",
  },
  emptyStateComponent: {
    generic: {
      heading: "So empty... so sad",
      content: "No data found yet. Try clicking the button to refresh or reload the app.",
      button: "Let's try this again",
    },
  },
}

export default en
export type Translations = typeof en
