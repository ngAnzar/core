import { Directive, Inject, ElementRef, Input, OnDestroy, OnChanges, SimpleChanges, OnInit } from "@angular/core"
import { Subscription } from "rxjs"

import { FastDOM } from "../util"
import { Dimension, RectMutationService } from "./rect-mutation.service"


@Directive({
    selector: "[nzSyncHeightFrom]",
    exportAs: "nzSyncHeightFrom"
})
export class SyncHeightFromDirective implements OnDestroy {
    private _sub: Subscription
    private _elements: Array<HTMLElement> = []
    private _lastDim: Dimension

    public constructor(
        @Inject(ElementRef) el: ElementRef<HTMLElement>,
        @Inject(RectMutationService) mutation: RectMutationService) {

        this._sub = mutation.watchDimension(el).subscribe(dim => {
            this._lastDim = dim
            // TODO: rxjs way (scheduler)
            FastDOM.mutate(() => {
                for (const k of this._elements) {
                    k.style.height = `${dim.height}px`
                }
            })
        })
    }

    public addElement(el: HTMLElement) {
        if (this._elements.indexOf(el) === -1) {
            this._elements.push(el)
            if (this._lastDim) {
                FastDOM.mutate(() => {
                    el.style.height = `${this._lastDim.height}px`
                })
            }
        }
    }

    public delElement(el: HTMLElement) {
        const idx = this._elements.indexOf(el)
        if (idx > -1) {
            this._elements.splice(idx)
        }
    }

    public ngOnDestroy() {
        this._elements.length
        this._sub.unsubscribe()
    }
}


@Directive({
    selector: "[nzSyncHeightTo]",
})
export class SyncHeightToDirective implements OnChanges, OnDestroy {
    @Input("nzSyncHeightTo") public src: SyncHeightFromDirective

    public constructor(
        @Inject(ElementRef) private readonly el: ElementRef<HTMLElement>) {
    }

    public ngOnChanges(changes: SimpleChanges) {
        if ("src" in changes) {
            changes.src.currentValue?.addElement(this.el.nativeElement)
        }
    }

    public ngOnDestroy() {
        this.src?.delElement(this.el.nativeElement)
    }
}
