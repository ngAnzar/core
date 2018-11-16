import { Margin, Rect, Align, AlignInput } from "../../layout.module"
import { Anchor, Constraint } from "../levitate/levitate-options"


export interface LevitateOptions {
    align?: Align | AlignInput
    margin?: Margin

    anchor?: Anchor
    constraint?: Constraint
}


export type BackdropType = "filled" | "empty"


export interface BackdropOptions {
    type: BackdropType
    crop?: HTMLElement | Rect
    hideOnClick?: boolean
}


export interface LayerOptions {
    position?: LevitateOptions
    backdrop?: BackdropOptions
    minWidth?: number
    minHeight?: number
    elevation?: number
}


export interface DropdownLayerOptions extends LayerOptions {
    initialWidth?: number
    initialHeight?: number
}
