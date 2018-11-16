import "./dialog.styl"

import { Injectable, Inject, StaticProvider } from "@angular/core"
import { ComponentType } from "@angular/cdk/portal"


import { LayerService } from "../layer/layer.service"
import { ModalLayer } from "../layer/layer-behavior"
import { ComponentLayerRef, LayerEvent } from "../layer/layer-ref"
import { LayerOptions } from "../layer/layer-options"
import {
    LayerMessageComponent, getProviders, ButtonOption,
    BUTTON_CANCEL, BUTTON_SEPARATOR, BUTTON_OK, BUTTON_ERROR, BUTTON_DELETE
} from "../_shared"

import { DialogComponent } from "./dialog.component"


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
            [...getProviders({ title, buttons, content: component }), ...provides],
            options
        )
    }

    public alert(title: string, message: string, options?: LayerOptions): DialogRef {
        return this._show(
            getProviders({ title, message, content: LayerMessageComponent, buttons: [BUTTON_CANCEL, BUTTON_SEPARATOR, BUTTON_OK] }),
            options
        )
    }

    public error(title: string, message: string, options?: LayerOptions): DialogRef {
        return this._show(
            getProviders({ title, message, content: LayerMessageComponent, buttons: [BUTTON_SEPARATOR, BUTTON_ERROR] }),
            options
        )
    }

    public deleteLowRisk(what: string, options?: LayerOptions): DialogRef {
        return this._show(
            getProviders({
                title: `${what} törlés megerősítése`,
                message: `Biztosan törölni szeretné?`,
                content: LayerMessageComponent,
                buttons: [BUTTON_CANCEL, BUTTON_SEPARATOR, BUTTON_DELETE]
            }),
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
}
