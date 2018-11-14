import { Component, Inject, OnDestroy, InjectionToken, ViewChild, AfterViewInit, ElementRef } from "@angular/core"
import { Observable } from "rxjs"
import { finalize } from "rxjs/operators"

import { Destruct } from "../util"
import { LayerRef } from "../layer/layer-ref"
import { ProgressEvent } from "../progress.module"

import { ToastOptions } from "./toast.service"

export interface _BaseOptions extends ToastOptions {
    success: string
    failure: string
}

export interface _Indeterminate extends _BaseOptions {
    indeterminate: true,
    progress: Observable<any>
}

export interface _Determinate extends _BaseOptions {
    indeterminate: false,
    progress: Observable<ProgressEvent>
}

export type ToastProgressOptions = _Indeterminate | _Determinate

export const PROGRESS_OPTIONS = new InjectionToken<Observable<ToastProgressOptions>>("PROGRESS_OPTIONS")


@Component({
    selector: ".-nz-toast",
    styles: [`
        .-nz-toast {
            background-color: #212121;
            color: #FFF;
            display: inline-flex;
            flex-direction: row;
            align-items: center;
        }
    `],
    templateUrl: "./toast-progress.template.pug"
})
export class ToastProgressComponent implements OnDestroy, AfterViewInit {
    @ViewChild("success") public readonly successEl: ElementRef
    @ViewChild("success") public readonly failureEl: ElementRef

    public readonly destruct = new Destruct()

    public constructor(
        @Inject(LayerRef) protected readonly layerRef: LayerRef,
        @Inject(PROGRESS_OPTIONS) protected readonly options: ToastProgressOptions) {

        if (options.progress) {
            (options.progress as any).subscribe(() => {
                layerRef.hide()
            })
        }
    }

    public ngAfterViewInit() {

    }

    public ngOnDestroy() {
        this.destruct.run()
    }
}
