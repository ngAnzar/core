import { Component, Inject, Optional, AfterViewChecked, ElementRef } from "@angular/core"
import { Portal, ComponentPortal } from "@angular/cdk/portal"

import { LayerService } from "../layer/layer.service"
import { LayerRef } from "../layer/layer-ref"
import { LAYER_TITLE, LAYER_BUTTONS, LAYER_CONTENT, ButtonList } from "../_shared"
import { DialogEvent } from "./dialog.service"


@Component({
    selector: ".nz-dialog",
    templateUrl: "./dialog.template.pug"
})
export class DialogComponent implements AfterViewChecked {
    public constructor(
        @Inject(ElementRef) protected el: ElementRef<HTMLElement>,
        @Inject(LayerRef) protected layerRef: LayerRef<DialogEvent>,
        @Inject(LayerService) protected layerSvc: LayerService,
        @Inject(LAYER_TITLE) @Optional() public title: string,
        @Inject(LAYER_BUTTONS) @Optional() public buttons: ButtonList,
        @Inject(LAYER_CONTENT) @Optional() protected content: Portal<any>) {
    }

    public close() {
        (this.content as ComponentPortal<DialogComponent>).component
        return this.layerRef.close()
    }

    public _handleButtonClick(event: Event, role: string) {
        let e = new DialogEvent("button", role)
        this.layerRef.emit(e)

        if (!e.isDefaultPrevented()) {
            this.close()
        }
    }

    public ngAfterViewChecked() {
        // if (this.layerRef.behavior) {
        //     this.layerRef.behavior.levitate.update()
        // }
    }
}
