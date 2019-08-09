import {
    Directive, Input, Inject, TemplateRef, ViewContainerRef, OnInit,
    OnDestroy, EmbeddedViewRef, ChangeDetectorRef, DoCheck, ViewRef
} from "@angular/core"
import { merge, Observable, Subject, Subscription, EMPTY, of } from "rxjs"
import { startWith, tap, map, switchMap, pairwise, shareReplay, filter, debounceTime, finalize } from "rxjs/operators"

import { DataSourceDirective, Model, Items } from "../data.module"
import { Destruct, NzRange, ListDiffKind, ListDiffItem } from "../util"
import { ScrollerService } from "./scroller/scroller.service"
import { ScrollableDirective } from "./scroller/scrollable.directive"
import { VirtualForVisibleItems } from "./virtual-for-strategy.directive"


export const enum ScrollingDirection {
    FORWARD = 1,
    BACKWARD = 2
}


export interface VirtualForContext<T> {
    $implicit: T
    index: number
    begin: number
    end: number
    first: boolean
    last: boolean
}


export type EmbeddedView<T> = EmbeddedViewRef<VirtualForContext<T>>;


const EMPTY_ITEMS = new Items([], new NzRange(0, 0), 0)


@Directive({
    selector: "[nzVirtualFor][nzVirtualForOf]",
    exportAs: "nzVirtualFor"
})
export class VirtualForDirective<T extends Model> implements OnInit, OnDestroy, DoCheck {
    @Input()
    public set nzVirtualForOf(value: DataSourceDirective<T>) {
        this._nzVirtualForOf = value
        if (this._srcSub) {
            this._srcSub.unsubscribe()
        }
        if (value) {
            this._srcSub = this.destruct.subscription(value.storage.invalidated).subscribe(this._reset as any)
        }
    }
    public get nzVirtualForOf(): DataSourceDirective<T> {
        return this._nzVirtualForOf
    }
    protected _nzVirtualForOf: DataSourceDirective<T>
    private _srcSub: Subscription

    @Input()
    public set itemsPerRequest(value: number) { this._itemsPerRequest = parseInt(value as any, 10) }
    public get itemsPerRequest(): number { return this._itemsPerRequest }
    protected _itemsPerRequest: number = 30


    protected destruct = new Destruct(() => {
        function d(view: ViewRef) {
            !view.destroyed && view.destroy()
        }

        this._vcr.clear()

        for (let i = 0, l = this.reusable.length; i < l; i++) {
            d(this.reusable[i])
        }
        this.reusable.length = 0
    })

    protected reusable: EmbeddedView<T>[] = []


    private _reset = new Subject()
    private reset$ = this.destruct.subscription(this._reset).pipe(
        // tap(this._clear.bind(this)),
        tap(this.visibleItems.clearCache.bind(this.visibleItems)),
        tap(() => {
            let sp = this._scroller.scrollPercent
            if (sp.top !== 0 || sp.left !== 0) {
                this._scroller.scrollPercent = { top: 0, left: 0 }
            }
        })
    )

    private _scroll = new Subject()
    private scroll$ = this.destruct.subscription(merge(this._scroll, this.reset$, this.visibleItems.changes)).pipe(
        debounceTime(10),
        map(this.visibleItems.getVisibleRange.bind(this.visibleItems)),
        map((vr: NzRange) => {
            if (vr.begin === -1) {
                return new NzRange(0, this.itemsPerRequest)
            } else {
                return vr
            }
        }),
        withPrevious(this.reset$),
        switchMap(skipWhenRangeIsEq),
        shareReplay(1)
    )

    private renderRange$ = this.destruct.subscription(this.scroll$).pipe(
        map(vr => {
            let offset = vr.begin === -1 || vr.begin === vr.end ? this.itemsPerRequest : Math.round(this.itemsPerRequest / 2)
            return new NzRange(
                Math.max(0, vr.begin - offset),
                vr.end + offset
            )
        }),
        withPrevious(this.reset$),
        switchMap(skipWhenRangeIsEq),
        shareReplay(1)
    )

    private requestRange$ = this.destruct.subscription(this.renderRange$).pipe(
        map(rr => {
            return new NzRange(
                Math.floor(rr.begin / this.itemsPerRequest) * this.itemsPerRequest,
                Math.ceil(rr.end / this.itemsPerRequest) * this.itemsPerRequest,
            )
        }),
        withPrevious(this.reset$),
        switchMap(skipWhenRangeIsEq),
        shareReplay(1)
    )

    private items$ = this.destruct.subscription(this.requestRange$).pipe(
        switchMap(r => {
            return this.nzVirtualForOf.getRange(r).pipe(
                map(items => items.getRange(r))
            )
        }),
        shareReplay(1)
    )

    private render$ = this.destruct.subscription(this.items$).pipe(
        withPrevious(),
        // withPrevious(this.reset$),
        map(vals => {
            const [prev, current] = vals
            return {
                changes: current.compare(prev || EMPTY_ITEMS, null),
                renderedRange: prev ? prev.range : new NzRange(0, 0),
                currentRange: current.range
            }
        }),
        filter(result => result.changes.length > 0),
        tap(result => this._applyChanges(result.changes, result.renderedRange, result.currentRange)),
        tap(() => this.ngDoCheck()),
        // tap(() => this._cdr.markForCheck()),
        tap(result => this.visibleItems.onRender(result.renderedRange)),
    )

    private _suspend = new Subject()




    public constructor(
        @Inject(ViewContainerRef) private readonly _vcr: ViewContainerRef,
        @Inject(TemplateRef) private readonly _tpl: TemplateRef<VirtualForContext<T>>,
        @Inject(ChangeDetectorRef) private readonly _cdr: ChangeDetectorRef,
        @Inject(ScrollerService) private readonly _scroller: ScrollerService,
        @Inject(ScrollableDirective) private readonly _scrollable: ScrollableDirective,
        @Inject(VirtualForVisibleItems) private readonly visibleItems: VirtualForVisibleItems) {
    }

    public ngOnInit() {
        this.destruct.subscription(this.render$).subscribe()

        this.destruct.subscription(this._scroller.vpImmediate.scroll)
            .pipe(startWith(0))
            .subscribe(this._scroll)
    }

    public ngDoCheck() {
        for (let i = 0, l = this._vcr.length; i < l; i++) {
            let v: EmbeddedView<T> = this._vcr.get(i) as any
            if (v && v.context && v.context.index !== -1) {
                v.detectChanges()
            }
        }
    }

    public ngOnDestroy() {
        this.destruct.run()
    }

    private _applyChanges(changes: Array<ListDiffItem<T>>, renderedRange: NzRange, currentRange: NzRange) {
        // console.log("_applyChanges", changes)
        let vcrOffset = Math.max(currentRange.begin - this._vcr.length, currentRange.begin)
        let delOffset = Math.max(renderedRange.begin - this._vcr.length, renderedRange.begin)
        let vcrIdx: number
        let view: EmbeddedView<T>


        for (let change of changes) {
            vcrIdx = change.index - vcrOffset

            if (change.kind === ListDiffKind.CREATE) {
                // console.log("CREATE", change.index, vcrIdx, change.item)
                view = this._getViewForItem(change.index, change.item, currentRange, vcrIdx)
                view.detectChanges()
            } else if (change.kind === ListDiffKind.UPDATE) {
                // console.log("UPDATE", change.index, vcrIdx)
                view = this._vcr.get(vcrIdx) as EmbeddedView<T>
                if (view) {
                    this._updateContext(view.context, change.index, change.item, currentRange)
                } else {
                    view = this._getViewForItem(change.index, change.item, currentRange, vcrIdx)
                }
                view.detectChanges()
            } else if (change.kind === ListDiffKind.DELETE) {
                vcrIdx = change.index - delOffset
                // console.log("DELETE", change.index, vcrIdx, delOffset)
                view = this._vcr.get(vcrIdx) as EmbeddedView<T>
                if (view) {
                    this.visibleItems.cacheItemRect(view)
                    view.context.index = -1
                    this._vcr.detach(vcrIdx)
                    this.reusable.push(view)
                    delOffset++
                }
            }
        }
    }

    // private _clear() {
    //     this.reusable.length = 0
    //     for (let i = this._vcr.length - 1; i >= 0; i--) {
    //         let v: EmbeddedView<T> = this._vcr.get(i) as any
    //         v.context.index = -1
    //         this._vcr.detach(i)
    //         this.reusable.push(v)
    //     }
    // }

    private _getViewForItem(index: number, item: T, range: NzRange, pos: number): EmbeddedView<T> {
        let v = this.reusable.shift()
        if (v) {
            this._updateContext(v.context, index, item, range)
            v.reattach()
            this._vcr.insert(v)
            return this._vcr.move(v, pos) as EmbeddedView<T>
        } else {
            return this._vcr.createEmbeddedView(this._tpl, this._updateContext({} as VirtualForContext<T>, index, item, range), pos)
        }
    }

    private _updateContext(ctx: VirtualForContext<T>, index: number, item: T, range: NzRange): VirtualForContext<T> {
        ctx.$implicit = item
        ctx.index = index
        ctx.begin = range.begin
        ctx.end = range.end
        ctx.first = index === range.begin
        ctx.last = index === range.end
        return ctx
    }
}


function skipWhenRangeIsEq(ranges: [NzRange, NzRange]): Observable<NzRange> {
    const [a, b] = ranges
    if (a && a.isEq(b)) {
        return EMPTY
    } else {
        return of(b)
    }
}


function withPrevious<T>(reset?: Observable<any>): (src: Observable<T>) => Observable<[T, T]> {
    let lastValue: any = null
    let resetSub = reset ? reset.subscribe(() => lastValue = null) : null

    return (src: Observable<T>) => src.pipe(
        map((val: T) => {
            let tmp = lastValue
            lastValue = val
            return [tmp as T, val as T]
        }),
        finalize<[T, T]>(resetSub ? resetSub.unsubscribe.bind(resetSub) : () => null)
    )
}
