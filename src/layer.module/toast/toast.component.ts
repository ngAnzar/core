import { Component, Inject, Optional } from "@angular/core"
import { Portal } from "@angular/cdk/portal"

import { LAYER_BUTTONS, LAYER_CONTENT, ButtonList } from "../_shared"
import { LayerRef } from "../layer/layer-ref"


@Component({
    selector: ".-nz-toast",
    styles: [`
        .-nz-toast {
            background-color: #212121;
            color: #FFF;
            display: inline-flex;
            flex-direction: row;
            align-items: center;
        }
    `],
    templateUrl: "./toast.template.pug"
})
export class ToastComponent {
    public constructor(
        @Inject(LayerRef) protected readonly layerLef: LayerRef,
        @Inject(LAYER_BUTTONS) @Optional() protected readonly buttons: ButtonList,
        @Inject(LAYER_CONTENT) protected readonly content: Portal<any>) {
    }
}
