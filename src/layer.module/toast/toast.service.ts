import { Injectable, Inject, StaticProvider } from "@angular/core"
import { ComponentType } from "@angular/cdk/portal"
import { throwError, of, NEVER, Observable, Subject } from "rxjs"
import { catchError, tap, shareReplay } from "rxjs/operators"

import { LayerService } from "../layer/layer.service"
import { LayerRef, ComponentLayerRef } from "../layer/layer-ref"
import { getProviders, LayerMessageComponent } from "../_shared"
import { ProgressEvent } from "../../animation.module"
import { FileDownloadEvent } from "../../common.module"

import { ToastLayer } from "./toast-behavior"
import { ToastComponent } from "./toast.component"
import { ToastProgressComponent } from "./toast-progress.component"
import { ToastOptions, ToastProgressOptions, TOAST_AUTO_HIDE_MIN, TOAST_DEFAULT_ALIGN } from "./toast-options"


function defaultOptions(options: ToastOptions): ToastOptions {
    options = options || {} as ToastOptions
    options.align = options.align || TOAST_DEFAULT_ALIGN
    if (typeof options.autohide === "number" && options.autohide > 0) {
        options.autohide = Math.max(TOAST_AUTO_HIDE_MIN, options.autohide)
    } else {
        delete options.autohide
    }
    return options
}


export interface SaveHandlerOptions extends ToastOptions {
    beginMsg?: string
    successMsg?: string
}


export interface FileDownloadOptions extends ToastOptions {
    beginMsg?: string
    message?: string
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
            getProviders({ message, options, buttons: options.buttons, content: LayerMessageComponent }),
            options,
            ToastComponent
        )
    }

    public error(message: string) {
        let options: ToastProgressOptions = {
            align: "top right",
            progress: throwError(new Error(message))
        }
        return this.progress(options)
    }

    public progress(options: ToastProgressOptions) {
        return this._show(
            getProviders({ options, buttons: options.buttons }),
            options,
            ToastProgressComponent
        )
    }

    public handleSave<T>(options: SaveHandlerOptions): (src: T) => T {
        const progress = new Subject<ProgressEvent>()

        this.progress({
            progress: progress.pipe(shareReplay(1)),
            ...options
        })

        if (options.beginMsg) {
            progress.next({ message: options.beginMsg })
        }

        return (src) => {
            return (src as any).pipe(
                catchError(err => {
                    progress.error({ percent: 1, message: err.message })
                    return NEVER
                }),
                tap(v => {
                    if (options.successMsg) {
                        progress.next({ percent: 1, message: options.successMsg })
                    }
                    progress.complete()
                })
            )
        }
        // return switchMap((value: T) => {
        //     console.log("toast switch map", value)
        //     return of(value)
        // })
    }

    public handleFileDownload<T extends Observable<FileDownloadEvent>>(options: FileDownloadOptions): (src: T) => T {
        const progress = new Subject<ProgressEvent>()

        this.progress({
            progress: progress.pipe(shareReplay(1)),
            ...options
        })

        if (options.beginMsg) {
            progress.next({ message: options.beginMsg })
        }

        return ((src: T) => {
            return src.pipe(
                catchError(err => {
                    progress.error({ percent: 1, message: err.message })
                    return NEVER
                }),
                tap(v => {
                    switch (v.state) {
                        case "starting":
                            progress.next({ message: options.message || v.filename })
                            break

                        case "progress":
                        case "done":
                            if (v.total) {
                                progress.next({
                                    message: options.message || v.filename,
                                    total: v.total,
                                    current: v.current,
                                    percent: v.percent
                                })
                            }
                            break
                    }
                })
            )
        }) as any
    }

    public catchError() {
        return catchError((err: Error) => {
            if (err.message) {
                this.error(err.message)
            } else {
                this.error(String(err))
            }
            return NEVER
        })
    }

    protected _show<T>(provides: StaticProvider[], options: ToastOptions = {} as any, cmp?: ComponentType<T>): ComponentLayerRef<T> {
        let ref = this.layerService.createFromComponent(cmp, this._behavior(options), null, provides)
        return this.queue.add(ref) as ComponentLayerRef<T>
    }

    protected _behavior(options: ToastOptions): ToastLayer {
        options = defaultOptions(options)
        return new ToastLayer({
            elevation: 10,
            position: {
                align: options.align,
                constraint: {
                    ref: options.constraint || "viewport",
                    margin: -20
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
