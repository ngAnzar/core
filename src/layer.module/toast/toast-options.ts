import { Observable } from "rxjs"

import { ProgressEvent } from "../../animation.module"
import { Align, AlignInput } from "../../layout.module"
import { ButtonList } from "../_shared"
import { LayerRef } from "../../layer.module"


export const TOAST_AUTO_HIDE_MIN = 4000
export const TOAST_DEFAULT_ALIGN: AlignInput = "top right"
export type DetailsHandler = () => LayerRef


export interface ToastOptions {
    // "left top", "center", "bottom center", ...
    align: Align | AlignInput
    autohide?: number
    buttons?: ButtonList
    constraint?: HTMLElement | "viewport"
    details?: DetailsHandler
}


export interface ToastProgressOptions extends ToastOptions {
    progress: Observable<ProgressEvent>
}
