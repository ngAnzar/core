import { Observable } from "rxjs"
import { Margin, Rect, Align, AlignInput } from "../../layout.module"
import { Anchor, Constraint } from "../levitate/levitate-options"
import { LayerRef } from "./layer-ref"


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
    rounded?: number
    // Can close layer with backButton (esc, or back button on mobile device)
    closeable?: boolean
    trapFocus?: boolean
    alwaysOnTop?: boolean
}


export interface DropdownLayerOptions extends LayerOptions {
    initialWidth?: number
    initialHeight?: number
    menuLike?: boolean
}


export interface ClosingGuarded {
    canClose(layerRef: LayerRef): Observable<boolean>
}
