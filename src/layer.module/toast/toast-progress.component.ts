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


export type TPState = "progress" | "success" | "failure";


@Component({
    selector: "nz-toast",
    templateUrl: "./toast-progress.template.pug",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToastProgressComponent extends ToastBase implements OnDestroy, AfterViewInit, OnInit {
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
            this.autohide = val === "success" ? TOAST_AUTO_HIDE_MIN : 0
            this.cdr.detectChanges()
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

    protected progress: Observable<ProgressEvent>

    public set detailsFactory(val: DetailsHandler) {
        if (this._detailsFactory !== val) {
            this._detailsFactory = val
            this.cdr.detectChanges()
        }
    }
    public get detailsFactory(): DetailsHandler { return this._detailsFactory }
    private _detailsFactory: DetailsHandler

    public get detailsVisible(): boolean { return this._detailsRef && this._detailsRef.isVisible }

    private _detailsRef: LayerRef

    public constructor(
        @Inject(LayerRef) protected readonly layerRef: LayerRef,
        @Inject(LAYER_OPTIONS) protected readonly options: ToastProgressOptions,
        @Inject(ChangeDetectorRef) protected readonly cdr: ChangeDetectorRef,
        @Inject(RectMutationService) protected readonly rectMutation: RectMutationService) {
        super()
    }

    public ngOnInit() {
        this.detailsFactory = this.options.details

        if (this.options.progress) {
            this.progress = this.options.progress.pipe(
                tap(val => {
                    this.state = val.percent >= 1 ? "success" : "progress"
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

            this.destruct.subscription(this.progress).subscribe(event => {
                this.lengthenHide()
                this.infoText = event.message
            })
        }
    }

    public ngAfterViewInit() {
        // const infoContainer = this.infoEl.nativeElement
        // const infoTextMeasure = infoContainer.childNodes[0] as HTMLElement
        // this.destruct.subscription(this.rectMutation.watchDimension(infoTextMeasure)).subscribe(dim => {
        //     infoContainer.style.width = dim.width ? `${dim.width + (this.state === "success" ? 16 : 8)}px` : "0px"
        // })
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
                    this.cdr.detectChanges()
                }
            })

            if (this._detailsRef = ref) {
                ref.show()
            }
        }
    }
}
