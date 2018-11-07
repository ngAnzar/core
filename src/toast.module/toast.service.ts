import { Injectable, Inject, TemplateRef, ViewContainerRef } from "@angular/core"
import { ComponentType } from "@angular/cdk/portal"

import { LayerContainer, TemplateLayerRef, ComponentLayerRef } from "../layer.module"
import { ButtonList } from "../dialog/dialog.component"
import { ToastLayer } from "../layer/layer-behavior"


const AUTO_HIDE = 4000


export interface ToastOptions {
    // "left top", "center", "bottom center", ...
    align: string
    autoHide?: number
    buttons?: ButtonList
}


function defaultOptions(options: ToastOptions): ToastOptions {
    options = options || {} as ToastOptions
    options.align = options.align || "bottom center"
    if (options.autoHide == null) {
        options.autoHide = AUTO_HIDE
    }
    return options
}


/**
 * toast.info("Some message", {align: "right top", buttons: [BUTTON_OK]})
 */

@Injectable()
export class ToastService {
    public constructor(@Inject(LayerContainer) protected lc: LayerContainer) {

    }

    public showTemplate<T>(tpl: TemplateRef<T>, vcr: ViewContainerRef, options?: ToastOptions, context?: T): TemplateLayerRef<T> {
        const behavior = this._behavior(options)
        const outlet = this.lc.getNewOutlet(true)
        return this._show(new TemplateLayerRef(behavior, outlet, null, vcr, tpl, context))
    }

    public showComponent<T>(cmp: ComponentType<T>, options?: ToastOptions, vcr?: ViewContainerRef): ComponentLayerRef<T> {
        const behavior = this._behavior(options)
        const outlet = this.lc.getNewOutlet(true)
        return this._show(new ComponentLayerRef(behavior, outlet, null, vcr, cmp))
    }

    public info(msg: string, options: ToastOptions) {

    }

    protected _show<T>(ref: T): T {

        return ref
    }

    protected _behavior(options: ToastOptions): ToastLayer {
        options = defaultOptions(options)
        return new ToastLayer({
            elevation: 10,
            position: {
            }
        })
    }
}
