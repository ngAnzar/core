

export interface _ButtonOption {
    role: "ok" | "cancel" | "yes" | "no" | "close" | string
    label: string
    color?: string
    variant?: string
    type?: "submit",
    disabled?: (component: any) => boolean
}


export type ButtonOption = _ButtonOption | { role: "spacer" }
export type ButtonList = ButtonOption[]


export const BUTTON_CANCEL: ButtonOption = { role: "cancel", label: "Mégse" }
export const BUTTON_OK: ButtonOption = { role: "ok", label: "OK", color: "confirm" }
export const BUTTON_DELETE: ButtonOption = { role: "delete", label: "Törlés", color: "critical" }
export const BUTTON_SEPARATOR: ButtonOption = { role: "spacer" }
export const BUTTON_ERROR: ButtonOption = { role: "ok", label: "OK", color: "critical" }
export const BUTTON_SAVE: ButtonOption = { role: "save", color: "confirm", label: "Mentés", type: "submit" }
