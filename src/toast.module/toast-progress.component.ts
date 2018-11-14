import {
    Component, Inject, OnDestroy, InjectionToken, ViewChild, AfterViewInit, ElementRef,
    ChangeDetectionStrategy, ChangeDetectorRef
} from "@angular/core"
import { Observable, of } from "rxjs"
import { tap, catchError, share } from "rxjs/operators"

import { Destruct } from "../util"
import { LayerRef } from "../layer/layer-ref"
import { ProgressEvent } from "../progress.module"
import { RectMutationService } from "../rect-mutation.service"

import { ToastOptions } from "./toast.service"

export interface ToastProgressOptions extends ToastOptions {
    // success: string
    // failure: string
    progress: Observable<ProgressEvent>
}

// export interface _Indeterminate extends _BaseOptions {
//     indeterminate: true,
//     progress: Observable<any>
// }

// export interface _Determinate extends _BaseOptions {
//     indeterminate: false,
//     progress: Observable<ProgressEvent>
// }

// export type ToastProgressOptions = _Indeterminate | _Determinate

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
    templateUrl: "./toast-progress.template.pug",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToastProgressComponent implements OnDestroy, AfterViewInit {
    @ViewChild("info") public readonly infoEl: ElementRef<HTMLElement>

    public readonly destruct = new Destruct()

    public set infoText(val: string) {
        if (this._infoText !== val) {
            this._infoText = val
            this.cdr.detectChanges()
        }
    }
    public get infoText(): string { return this._infoText }
    private _infoText: string

    public set spinnerColor(val: string) {
        if (this._spinnerColor !== val) {
            this._spinnerColor = val
            this.cdr.detectChanges()
        }
    }
    public get spinnerColor(): string { return this._spinnerColor }
    private _spinnerColor: string = "disabled"

    // public set indeterminate(val: boolean) {
    //     if (this._indeterminate !== val) {
    //         this._indeterminate = val
    //     }
    // }
    // public get indeterminate(): boolean { return this._indeterminate }
    // private _indeterminate: boolean = true

    protected progress: Observable<ProgressEvent>

    public constructor(
        @Inject(LayerRef) protected readonly layerRef: LayerRef,
        @Inject(PROGRESS_OPTIONS) protected readonly options: ToastProgressOptions,
        @Inject(ChangeDetectorRef) protected readonly cdr: ChangeDetectorRef,
        @Inject(RectMutationService) protected readonly rectMutation: RectMutationService) {

        if (options.progress) {
            this.progress = options.progress.pipe(
                tap(val => {
                    this.spinnerColor = "confirm"
                }),
                catchError(err => {
                    this.spinnerColor = "critical"
                    return of({ percent: 1, message: err.message })
                }),
                share()
            )

            this.destruct.subscription(this.progress).subscribe(event => {
                this.infoText = event.message
            })
        }
    }

    public ngAfterViewInit() {
        this.destruct.subscription(this.rectMutation.watchDimension(this.infoEl)).subscribe(dim => {
            console.log(dim)
            // TODO: this.layerRef.resize()
        })
    }

    public ngOnDestroy() {
        this.destruct.run()
    }
}
