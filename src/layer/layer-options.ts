import { Anchor, Constraint, Align, Margin } from "../levitate/levitate-compute"
import { BackdropType } from "./layer-container"


export interface LevitateOptions {
    align?: Align
    valign?: Align
    margin?: Margin

    connect?: Anchor
    constraint?: Constraint
}


export interface BackdropOptions {
    type: BackdropType
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
