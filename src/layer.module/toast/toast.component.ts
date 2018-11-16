import { Component, Inject, Optional, TemplateRef } from "@angular/core"
import { ComponentType } from "@angular/cdk/portal"

import { DIALOG_BUTTONS, DIALOG_CONTENT, ButtonList } from "../dialog/dialog.component"
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
    // protected readonly tpl: TemplateRef<any>
    // protected readonly cmp: ComponentType<any>

    public constructor(
        @Inject(LayerRef) protected readonly layerLef: LayerRef,
        @Inject(DIALOG_BUTTONS) @Optional() protected readonly buttons: ButtonList,
        @Inject(DIALOG_CONTENT) protected readonly content: TemplateRef<any> | ComponentType<any>) {

        // setTimeout(() => { layerLef.close() }, 5000)
        // if (content instanceof TemplateRef) {
        //     this.tpl = content
        // } else {
        //     this.cmp = content
        // }
    }
}
