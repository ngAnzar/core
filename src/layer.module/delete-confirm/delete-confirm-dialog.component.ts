import { Component, Inject, HostListener } from "@angular/core"

import { LAYER_MESSAGE, LAYER_BUTTONS } from "../_shared"
import { LayerRef } from "../layer/layer-ref"
import { DialogEvent } from "../dialog/dialog.service"


@Component({
    selector: "nz-delete-confirm-dialog",
    templateUrl: "./delete-confirm-dialog.component.pug"
})
export class DeleteConfirmDialogComponent {
    private decision: string

    public constructor(
        @Inject(LAYER_MESSAGE) public message: string,
        @Inject(LAYER_BUTTONS) public button: string,
        @Inject(LayerRef) public readonly layerRef: LayerRef<DialogEvent>) {
        this.layerRef.subscribe(event => {
            if (event.type === "hiding") {
                if (this.decision) {
                    this.layerRef.emit(new DialogEvent("button", this.decision))
                } else {
                    this.layerRef.emit(new DialogEvent("button", "cancel"))
                }
            }
        })
    }

    @HostListener("keydown", ["$event"])
    public onKeyDown(event: KeyboardEvent) {
        event.preventDefault()
    }

    @HostListener("keyup", ["$event"])
    public onKeyUp(event: KeyboardEvent) {
        event.preventDefault()
    }

    public handleButtonClick(role: string) {
        this.decision = role
        this.layerRef.hide()
    }
}
