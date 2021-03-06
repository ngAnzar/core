import {
    Component, Inject, OnDestroy, InjectionToken, ViewChild, AfterViewInit, ElementRef,
    ChangeDetectionStrategy, ChangeDetectorRef, OnInit
} from "@angular/core"
import { Observable, of, interval } from "rxjs"
import { tap, catchError, share, finalize, switchMap, takeWhile, mapTo } from "rxjs/operators"

import { Destruct } from "../../util"
import { RectMutationService } from "../../layout.module"
import { ProgressEvent } from "../../animation.module"
import { LayerRef } from "../layer/layer-ref"

import { ToastBase } from "./toast-base"
import { ToastProgressOptions, TOAST_AUTO_HIDE_MIN, DetailsHandler } from "./toast-options"
import { LAYER_OPTIONS } from "../_shared"


export type TPState = "progress" | "success" | "failure"


@Component({
    selector: "nz-toast",
    templateUrl: "./toast-progress.template.pug",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToastProgressComponent extends ToastBase implements OnDestroy {
    public readonly destruct = new Destruct()

    public set infoText(val: string) {
        if (this._infoText !== val) {
            this._infoText = val
            this.cdr.markForCheck()
        }
    }
    public get infoText(): string { return this._infoText }
    private _infoText: string

    public set percent(val: number) {
        if (this._percent !== val) {
            this._percent = val
            this.cdr.markForCheck()
        }
    }
    public get percent(): number { return this._percent }
    private _percent: number

    public set state(val: TPState) {
        if (this._state !== val) {
            this._state = val
            this.autohide = val === "success" ? TOAST_AUTO_HIDE_MIN : 0
            this.cdr.markForCheck()
        }
    }
    public get state(): TPState { return this._state }
    private _state: TPState = "progress"

    public get spinnerColor(): string {
        return this.state === "progress"
            ? "common"
            : this.state === "success"
                ? "confirm"
                : "critical"
    }

    public _progress: Observable<ProgressEvent>

    public set detailsFactory(val: DetailsHandler) {
        if (this._detailsFactory !== val) {
            this._detailsFactory = val
            this.cdr.markForCheck()
        }
    }
    public get detailsFactory(): DetailsHandler { return this._detailsFactory }
    public _detailsFactory: DetailsHandler

    public get detailsVisible(): boolean { return this._detailsRef && this._detailsRef.isVisible }

    private _detailsRef: LayerRef

    public constructor(
        @Inject(LayerRef) protected readonly layerRef: LayerRef,
        @Inject(LAYER_OPTIONS) protected readonly options: ToastProgressOptions,
        @Inject(ChangeDetectorRef) protected readonly cdr: ChangeDetectorRef,
        @Inject(RectMutationService) protected readonly rectMutation: RectMutationService) {
        super()

        this.detailsFactory = this.options.details

        if (this.options.progress) {
            this._progress = this.options.progress.pipe(
                tap(val => {
                    this.state = val.percent >= 1 ? "success" : "progress"
                    this.percent = val.current && val.total ? Math.round(val.percent * 100) : null
                }),
                catchError(err => {
                    this.state = "failure"
                    return of({ percent: 1, message: err.message })
                }),
                finalize(() => {
                    if (this.state === "progress" && this.layerRef.isVisible) {
                        this.layerRef.hide()
                    }
                }),
                share()
            )

            this.destruct.subscription(this._progress).subscribe(event => {
                this.lengthenHide()
                this.infoText = event.message
                this.cdr.markForCheck()
            })
        }
    }

    public ngOnDestroy() {
        this.destruct.run()
    }

    public toggleDetails() {
        if (this._detailsRef && this._detailsRef.isVisible) {
            this._detailsRef.hide()
            delete this._detailsRef
        } else {
            const ref = this._detailsFactory()

            const s = ref.subscribe(event => {
                if (event.type === "hiding") {
                    s.unsubscribe()
                    delete this._detailsRef
                    this.cdr.markForCheck()
                }
            })

            if (this._detailsRef = ref) {
                ref.show()
            }
        }
    }

    public hide() {
        this.layerRef.hide()
    }
}
