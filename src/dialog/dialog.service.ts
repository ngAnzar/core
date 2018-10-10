import "./dialog.styl"

import { Injectable, Inject, Injector, InjectionToken, StaticProvider } from "@angular/core"
import { Portal, ComponentType, ComponentPortal } from "@angular/cdk/portal"
import { Observable } from "rxjs"

import {
    DialogComponent, ButtonOption, ButtonList,
    DIALOG_TITLE, DIALOG_BUTTONS, DIALOG_CONTENT, DIALOG_MESSAGE
} from "./dialog.component"
import { MessageDialog } from "./message.dialog"
import { LayerService } from "../layer/layer.service"
import { ModalLayer } from "../layer/layer-behavior"
import { LayerRef, ComponentLayerRef } from "../layer/layer-ref"
import { LayerEvent } from "../layer/layer-ref"
import { LayerOptions } from "../layer/layer-options"


export const BUTTON_CANCEL: ButtonOption = { role: "cancel", label: "Mégse" }
export const BUTTON_OK: ButtonOption = { role: "ok", label: "OK", color: "confirm" }
export const BUTTON_DELETE: ButtonOption = { role: "delete", label: "Törlés", color: "critical" }
export const BUTTON_SEPARATOR: ButtonOption = { role: "spacer" }
export const BUTTON_ERROR: ButtonOption = { role: "ok", label: "OK", color: "critical" }
export const BUTTON_SAVE: ButtonOption = { role: "save", color: "confirm", label: "Mentés", type: "submit" }


export class DialogEvent<D = any> extends LayerEvent<D> {
    public constructor(
        type: string,
        public readonly button: string,
        data?: D) {
        super(type, data)
    }
}


export type DialogRef = ComponentLayerRef<DialogComponent, DialogEvent>


@Injectable({ providedIn: "root" })
export class DialogService {
    public constructor(
        @Inject(LayerService) protected layerService: LayerService) {
    }

    public show(title: string, buttons: ButtonOption[], component: ComponentType<any>, options?: LayerOptions, provides: StaticProvider[] = []) {
        return this._show(
            [...this._getProvides(title, null, buttons, component), ...provides],
            options
        )
    }

    public alert(title: string, message: string, options?: LayerOptions): DialogRef {
        return this._show(
            this._getProvides(title, message, [BUTTON_CANCEL, BUTTON_SEPARATOR, BUTTON_OK], MessageDialog),
            options
        )
    }

    public error(title: string, message: string, options?: LayerOptions): DialogRef {
        return this._show(
            this._getProvides(title, message, [BUTTON_SEPARATOR, BUTTON_ERROR], MessageDialog),
            options
        )
    }

    public deleteLowRisk(what: string, options?: LayerOptions): DialogRef {
        return this._show(
            this._getProvides(`${what} törlés megerősítése`, `Biztosan törölni szeretné?`, [BUTTON_CANCEL, BUTTON_SEPARATOR, BUTTON_DELETE], MessageDialog),
            options
        )
    }

    public deleteHighRisk() {

    }

    private _show(provides: StaticProvider[], options: LayerOptions = {}): DialogRef {
        if (!("elevation" in options)) {
            options.elevation = 10
        }
        let ref = this.layerService.createFromComponent(DialogComponent, new ModalLayer(options), null, provides) as DialogRef
        ref.show()
        return ref
    }

    // public show(layer: LayerRef<DialogEvent>, options: DialogOptions): LayerRef<DialogEvent> {
    //     let cmp = layer.showComponent(DialogComponent)
    //     cmp.instance.buttons = options.buttons

    //     // if (injector) {
    //     //     let channel: DialogChannel<DialogEvent, DialogEvent> = injector.get(DialogChannel) as any
    //     //     if (channel) {
    //     //         return channel.output
    //     //     }
    //     // }

    //     // TODO: valahpgy kinyerni a dialog componenst
    //     return layer
    // }

    private _getProvides(title?: string, message?: string, buttons?: ButtonList, content?: ComponentType<any>): StaticProvider[] {
        let res: StaticProvider[] = []

        if (title) {
            res.push({ provide: DIALOG_TITLE, useValue: title })
        }
        if (message) {
            res.push({ provide: DIALOG_MESSAGE, useValue: message })
        }
        if (buttons && buttons.length) {
            res.push({ provide: DIALOG_BUTTONS, useValue: buttons })
        }
        if (content) {
            res.push({
                provide: DIALOG_CONTENT,
                deps: [Injector],
                useFactory: (injector: Injector) => {
                    return new ComponentPortal(content, null, injector)
                }
            })
        }

        return res
    }
}
