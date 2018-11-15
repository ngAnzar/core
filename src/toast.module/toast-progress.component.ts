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


export type TPState = "progress" | "success" | "failure"


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

    public set state(val: TPState) {
        if (this._state !== val) {
            this._state = val
            this.autohide = val === "success"
            this.cdr.detectChanges()
        }
    }
    public get state(): TPState { return this._state }
    private _state: TPState = "progress"

    public get spinnerColor(): string {
        return this.state === "progress"
            ? "disabled"
            : this.state === "success"
                ? "confirm"
                : "critical"
    }

    protected set autohide(val: boolean) {
        if (this._autohide !== val) {
            if (this._autohideTimer) {
                clearTimeout(this._autohideTimer)
            }

            if (this._autohide = val) {
                this._autohideTimer = setTimeout(this.layerRef.hide.bind(this.layerRef), 3000)
            }
        }
    }
    private _autohide: boolean = false
    private _autohideTimer: any

    protected progress: Observable<ProgressEvent>

    public constructor(
        @Inject(LayerRef) protected readonly layerRef: LayerRef,
        @Inject(PROGRESS_OPTIONS) protected readonly options: ToastProgressOptions,
        @Inject(ChangeDetectorRef) protected readonly cdr: ChangeDetectorRef,
        @Inject(RectMutationService) protected readonly rectMutation: RectMutationService) {

        if (options.progress) {
            this.progress = options.progress.pipe(
                tap(val => {
                    this.state = "success"
                }),
                catchError(err => {
                    this.state = "failure"
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
        const infoContainer = this.infoEl.nativeElement
        const infoTextMeasure = infoContainer.childNodes[0] as HTMLElement
        this.destruct.subscription(this.rectMutation.watchDimension(infoTextMeasure)).subscribe(dim => {
            // infoContainer.style.width = dim.width ? `${dim.width + 8}px` : "0px"
        })
    }

    public ngOnDestroy() {
        this.destruct.run()
    }
}
