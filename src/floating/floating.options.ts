
export type Align = "TOP" | "BOTTOM" | "LEFT" | "RIGHT" | "CENTER";


export interface Anchor {
    ref: any // window, component, element, element-id
    align: Align
    valign: Align
}


export class FloatingOptions {
    width?: number
    height?: number
    maxWidth?: number
    maxHeight?: number
    minWidth?: number
    minHeight?: number

    floating: Anchor

    placement?: Anchor

    attach?: Anchor
}
