import { Injectable, Inject, StaticProvider } from "@angular/core"
import { ComponentType } from "@angular/cdk/portal"

import { LayerService } from "../layer/layer.service"
import { LayerRef } from "../layer/layer-ref"
import { getProviders, LayerMessageComponent } from "../_shared"

import { ToastLayer } from "./toast-behavior"
import { ToastComponent } from "./toast.component"
import { ToastProgressComponent } from "./toast-progress.component"
import { ToastOptions, ToastProgressOptions, TOAST_AUTO_HIDE_MIN, TOAST_DEFAULT_ALIGN } from "./toast-options"


function defaultOptions(options: ToastOptions): ToastOptions {
    options = options || {} as ToastOptions
    options.align = options.align || TOAST_DEFAULT_ALIGN
    if (options.autoHide == null) {
        options.autoHide = TOAST_AUTO_HIDE_MIN
    } else {
        options.autoHide = Math.max(TOAST_AUTO_HIDE_MIN, options.autoHide)
    }
    return options
}


/**
 * toast.info("Some message", {align: "right top", buttons: [BUTTON_OK]})
 */

@Injectable()
export class ToastService {
    protected queue = new ToastQueue()

    public constructor(@Inject(LayerService) protected layerService: LayerService) {

    }

    public info(message: string, options: ToastOptions) {
        return this._show(
            getProviders({ message, options, content: LayerMessageComponent }),
            options,
            ToastComponent
        )
    }

    public progress(options: ToastProgressOptions) {
        return this._show(
            getProviders({ options, buttons: options.buttons }),
            options,
            ToastProgressComponent
        )
    }


    protected _show(provides: StaticProvider[], options: ToastOptions = {} as any, cmp?: ComponentType<any>): LayerRef {
        let ref = this.layerService.createFromComponent(cmp, this._behavior(options), null, provides)
        return this.queue.add(ref)
    }

    protected _behavior(options: ToastOptions): ToastLayer {
        options = defaultOptions(options)
        return new ToastLayer({
            elevation: 10,
            position: {
                align: options.align,
                constraint: {
                    ref: options.constraint || "viewport",
                    margin: 20
                }
            }
        })
    }
}


class ToastQueue {
    private items: LayerRef[] = []
    private visible: LayerRef

    public add(ref: LayerRef): LayerRef {
        if (ref.destruct.done) {
            return null
        }

        this.items.push(ref)

        if (!this.visible) {
            this.play()
        }

        return ref
    }

    protected play() {
        if (this.items.length === 0) {
            return
        }

        const next = this.items[0]
        this.visible = next

        const ds = next.destruct.on.subscribe(() => {
            if (this.visible === next) {
                delete this.visible
                let idx = this.items.indexOf(next)
                if (idx > -1) {
                    this.items.splice(idx, 1)
                }
                this.play()
            }
            ds.unsubscribe()
        })

        next.show()
    }
}
