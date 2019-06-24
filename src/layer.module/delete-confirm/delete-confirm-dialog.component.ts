import { Component, Inject } from "@angular/core"

import { LAYER_MESSAGE } from "../_shared"
import { LayerRef } from "../layer/layer-ref"
import { DialogEvent } from "../dialog/dialog.service"


@Component({
    selector: "nz-delete-confirm-dialog",
    templateUrl: "./delete-confirm-dialog.component.pug"
})
export class DeleteConfirmDialogComponent {
    public constructor(
        @Inject(LAYER_MESSAGE) public message: string,
        @Inject(LayerRef) public readonly layerRef: LayerRef<DialogEvent>) { }

    public handleButtonClick(role: string) {
        this.layerRef.emit(new DialogEvent("button", role))
        this.layerRef.hide()
    }
}
