import { Injectable, Inject, Injector, StaticProvider } from "@angular/core"
import { ComponentType, ComponentPortal } from "@angular/cdk/portal"
import { Observable } from "rxjs"

import { LayerService, LayerRef, TemplateLayerRef, ComponentLayerRef } from "../layer.module"
import { ButtonList, DIALOG_BUTTONS, DIALOG_CONTENT, DIALOG_MESSAGE } from "../dialog/dialog.component"
import { Align, AlignInput } from "../rect-mutation.service"
import { ProgressEvent } from "../progress.module"

import { ToastLayer } from "./toast-behavior"
import { ToastComponent } from "./toast.component"
import { ToastMessageComponent } from "./toast-message.component"
import { ToastProgressComponent, ToastProgressOptions, PROGRESS_OPTIONS } from "./toast-progress.component"



const AUTO_HIDE = 4000


export interface ToastOptions {
    // "left top", "center", "bottom center", ...
    align: Align | AlignInput
    autoHide?: number
    buttons?: ButtonList
    constraint?: HTMLElement | "viewport"
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
    protected queue = new ToastQueue()

    public constructor(@Inject(LayerService) protected layerService: LayerService) {

    }

    // public showTemplate<T>(tpl: TemplateRef<T>, vcr: ViewContainerRef, options?: ToastOptions, context?: T): TemplateLayerRef<T> {
    //     const behavior = this._behavior(options)
    //     const outlet = this.lc.getNewOutlet(true)
    //     return this._show(new TemplateLayerRef(behavior, outlet, null, vcr, tpl, context))
    // }

    // public showComponent<T>(cmp: ComponentType<T>, options?: ToastOptions, vcr?: ViewContainerRef): ComponentLayerRef<T> {
    //     const behavior = this._behavior(options)
    //     const outlet = this.lc.getNewOutlet(true)
    //     return this._show(new ComponentLayerRef(behavior, outlet, null, vcr, cmp))
    // }

    // public showComponent<T>(cmp: ComponentType<T>, options?: ToastOptions, provides?: StaticProvider[], vcr?: ViewContainerRef): ComponentLayerRef<T> {

    // }

    public info(msg: string, options: ToastOptions) {
        return this._show(
            this._provides(msg, options.buttons, ToastMessageComponent),
            options
        )
    }

    public save(options: ToastProgressOptions) {
        return this._show(
            [
                ...this._provides(null, options.buttons),
                { provide: PROGRESS_OPTIONS, useValue: options }
            ],
            options,
            ToastProgressComponent
        )
    }


    protected _show(provides: StaticProvider[], options: ToastOptions = {} as any, cmp?: ComponentType<any>): LayerRef {
        let ref = this.layerService.createFromComponent(cmp || ToastComponent, this._behavior(options), null, provides)
        return this.queue.add(ref)
    }

    protected _behavior(options: ToastOptions): ToastLayer {
        options = defaultOptions(options)
        return new ToastLayer({
            elevation: 10,
            position: {
                align: options.align,
                anchor: {
                    ref: options.constraint || "viewport",
                    align: options.align,
                    margin: 20
                },
                constraint: {
                    ref: options.constraint || "viewport"
                }
            }
        })
    }

    protected _provides(message?: string, buttons?: ButtonList, content?: ComponentType<any>): StaticProvider[] {
        let res: StaticProvider[] = []

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

        let next: LayerRef
        do {
            next = this.items.shift()
        } while (next && next.destruct.done)

        if (!next) {
            return
        }

        const ds = next.destruct.on.subscribe(() => {
            if (this.visible === next) {
                delete this.visible
                this.play()
            }
            ds.unsubscribe()
        })

        next.show()
    }
}
