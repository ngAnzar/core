import { Component, Inject, Optional, AfterViewChecked, ElementRef, OnDestroy } from "@angular/core"
import { Portal, ComponentPortal } from "@angular/cdk/portal"

import { DragService } from "../../common.module"
import { LayerService } from "../layer/layer.service"
import { LayerRef } from "../layer/layer-ref"
import { LAYER_TITLE, LAYER_BUTTONS, LAYER_CONTENT, LAYER_OPTIONS, ButtonList } from "../_shared"
import { DialogEvent } from "./dialog.service"


export interface DialogOptions {
    isPlainText?: boolean
}


@Component({
    selector: ".nz-dialog",
    templateUrl: "./dialog.template.pug",
    providers: [
        { provide: DragService, useClass: DragService }
    ]
})
export class DialogComponent implements AfterViewChecked {
    public constructor(
        @Inject(ElementRef) protected el: ElementRef<HTMLElement>,
        @Inject(LayerRef) protected layerRef: LayerRef<DialogEvent>,
        @Inject(LayerService) protected layerSvc: LayerService,
        @Inject(DragService) protected drag: DragService,
        @Inject(LAYER_TITLE) @Optional() public title: string,
        @Inject(LAYER_BUTTONS) @Optional() public buttons: ButtonList,
        @Inject(LAYER_CONTENT) @Optional() public _content: Portal<any>,
        @Inject(LAYER_OPTIONS) @Optional() protected options: DialogOptions) {
        this.options = this.options || {}
        this.drag.draggable = layerRef.container

        layerRef.destruct.subscription(this.drag.dragging).subscribe(event => {
            if (event.type === "begin") {
                layerRef.behavior.levitate.suspend()
            }
        })
    }

    public close() {
        (this._content as ComponentPortal<DialogComponent>).component
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
