import { Margin, Rect } from "../rect-mutation.service"
import { Anchor, Constraint } from "../levitate/levitate-compute"
import { HAlign, VAlign } from "../rect-mutation.service"


export interface LevitateOptions {
    align?: HAlign
    valign?: VAlign
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
