import { Component, Inject, InjectionToken, Optional } from "@angular/core"
import { Portal } from "@angular/cdk/portal"

import { DialogEvent } from "./dialog.service"
import { LayerRef } from "../layer/layer-ref"
import { LayerService } from "../layer/layer.service"


export interface _ButtonOption {
    role: "ok" | "cancel" | "yes" | "no" | "close" | string
    label: string
    color?: string
    variant?: string
}


export type ButtonOption = _ButtonOption | { role: "spacer" }
export type ButtonList = ButtonOption[]


export const DIALOG_TITLE = new InjectionToken<string>("dialog.title")
export const DIALOG_MESSAGE = new InjectionToken<string>("dialog.message")
export const DIALOG_BUTTONS = new InjectionToken<ButtonList>("dialog.buttons")
export const DIALOG_CONTENT = new InjectionToken<Portal<any>>("dialog.content")


// export const CLOSE_ROLES = ["close", "cancel"]


@Component({
    selector: ".nz-dialog",
    templateUrl: "./dialog.template.pug"
})
export class DialogComponent {

    public constructor(
        @Inject(LayerRef) protected layerRef: LayerRef<DialogEvent>,
        @Inject(LayerService) protected layerSvc: LayerService,
        @Inject(DIALOG_TITLE) @Optional() public title: string,
        @Inject(DIALOG_BUTTONS) @Optional() public buttons: ButtonList,
        @Inject(DIALOG_CONTENT) @Optional() protected content: Portal<any>) {
    }

    public close() {
        return this.layerRef.close()
    }

    public _handleButtonClick(event: Event, role: string) {
        let e = new DialogEvent("button-action", role)
        this.layerRef.emit(e)

        if (!e.isDefaultPrevented()) {
            this.close()
        }
    }
}
