import { Component, Inject, Optional } from "@angular/core"
import { Portal } from "@angular/cdk/portal"

import { LAYER_BUTTONS, LAYER_CONTENT, LAYER_OPTIONS, ButtonList } from "../_shared"
import { LayerRef } from "../layer/layer-ref"
import { ToastBase } from "./toast-base"
import { ToastOptions } from "./toast-options"


@Component({
    selector: "nz-toast",
    templateUrl: "./toast.template.pug"
})
export class ToastComponent extends ToastBase {
    public constructor(
        @Inject(LayerRef) protected readonly layerRef: LayerRef,
        @Inject(LAYER_BUTTONS) @Optional() protected readonly buttons: ButtonList,
        @Inject(LAYER_CONTENT) protected readonly content: Portal<any>,
        @Inject(LAYER_OPTIONS) protected readonly options: ToastOptions) {
        super()

        if (options.autohide) {
            this.autohide = options.autohide
        }
    }
}
