

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
