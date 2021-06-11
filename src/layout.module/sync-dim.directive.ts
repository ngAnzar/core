import { Directive, Inject, ElementRef, Input, OnDestroy, OnChanges, SimpleChanges, OnInit } from "@angular/core"
import { Subscription } from "rxjs"

import { FastDOM } from "../util"
import { Dimension, RectMutationService } from "./rect-mutation.service"


type DimProp = "width" | "height"


@Directive()
abstract class SyncDimFromDirective implements OnDestroy {
    abstract readonly property: DimProp

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
                    k.style[this.property] = `${dim[this.property]}px`
                }
            })
        })
    }

    public addElement(el: HTMLElement) {
        if (this._elements.indexOf(el) === -1) {
            this._elements.push(el)
            if (this._lastDim) {
                FastDOM.mutate(() => {
                    el.style[this.property] = `${this._lastDim[this.property]}px`
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
    selector: "[nzSyncHeightFrom]",
    exportAs: "nzSyncHeightFrom"
})
export class SyncHeightFromDirective extends SyncDimFromDirective {
    readonly property: DimProp = "height"
}


@Directive({
    selector: "[nzSyncWidthFrom]",
    exportAs: "nzSyncWidthFrom"
})
export class SyncWidthFromDirective extends SyncDimFromDirective {
    readonly property: DimProp = "width"
}


@Directive()
abstract class SyncDomToDirective implements OnChanges, OnDestroy {
    abstract src: SyncDimFromDirective

    public constructor(
        @Inject(ElementRef) private readonly el: ElementRef<HTMLElement>) {
    }

    public ngOnChanges(changes: SimpleChanges) {
        if ("src" in changes) {
            changes.src?.currentValue?.addElement(this.el.nativeElement)
        }
    }

    public ngOnDestroy() {
        this.src?.delElement(this.el.nativeElement)
    }
}


@Directive({
    selector: "[nzSyncHeightTo]",
})
export class SyncHeightToDirective extends SyncDomToDirective {
    @Input("nzSyncHeightTo") public src: SyncDimFromDirective
}


@Directive({
    selector: "[nzSyncWidthTo]",
})
export class SyncWidthToDirective extends SyncDomToDirective {
    @Input("nzSyncWidthTo") public src: SyncDimFromDirective
}
