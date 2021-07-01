import {
    Directive, Input, Inject, TemplateRef, ViewContainerRef, OnInit,
    OnDestroy, EmbeddedViewRef, ChangeDetectorRef, DoCheck, ViewRef, Output, EventEmitter, NgZone
} from "@angular/core"
import { merge, Observable, Subject, Subscription, EMPTY, of, NEVER, Subscriber, timer } from "rxjs"
import { startWith, tap, map, switchMap, shareReplay, filter, debounceTime, finalize, take, share, mapTo, takeUntil, debounce, pairwise } from "rxjs/operators"

import { DataSourceDirective, Model, Items, PrimaryKey } from "../../data.module"
import { Destruct, NzRange, ListDiffKind, ListDiffItem, __zone_symbol__, RectProps } from "../../util"
import { ScrollerService } from "../scroller/scroller.service"
import { ScrollableDirective } from "../scroller/scrollable.directive"
import { VirtualForVisibleRange } from "./visible-range"
import { withPrevious, skipWhenRangeIsEq } from "./utils"


const requestAnimationFrame = __zone_symbol__("requestAnimationFrame")
const cancelAnimationFrame = __zone_symbol__("cancelAnimationFrame")


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
    prev: T
}


export interface RenderedEvent<T> {
    changes: ListDiffItem<T>[],
    renderedRange: NzRange,
    currentRange: NzRange
}


export type EmbeddedView<T> = EmbeddedViewRef<VirtualForContext<T>>


const EMPTY_ITEMS = new Items([], new NzRange(0, 0), 0)


@Directive({
    selector: "[nzVirtualFor][nzVirtualForOf]",
    exportAs: "nzVirtualFor"
})
export class VirtualForDirective<T extends Model> implements OnInit, OnDestroy {
    @Input()
    public set nzVirtualForOf(value: DataSourceDirective<T>) {
        this._nzVirtualForOf = value

        if (this._srcSubInvalidate) {
            this._srcSubInvalidate.unsubscribe()
        }
        if (this._srcSubItems) {
            this._srcSubItems.unsubscribe()
        }
        if (this._srcSubChange) {
            this._srcSubChange.unsubscribe()
        }
        if (value) {
            this._srcSubInvalidate = this.destruct
                .subscription(value.storage.invalidated)
                .pipe(startWith(null), debounceTime(100))
                .subscribe(this._reset as any)

            this._srcSubItems = this.destruct
                .subscription(value.storage.items)
                .subscribe(this._itemsChanged)

            this._srcSubChange = this.destruct
                .subscription(value.storage.source.changed)
                .pipe(filter(v => !v.reset))
                .subscribe(this._refresh)
        } else {
            delete this._srcSubInvalidate
            delete this._srcSubItems
            delete this._srcSubChange
        }
    }
    public get nzVirtualForOf(): DataSourceDirective<T> {
        return this._nzVirtualForOf
    }
    protected _nzVirtualForOf: DataSourceDirective<T>

    private _srcSubInvalidate: Subscription
    private _srcSubItems: Subscription
    private _srcSubChange: Subscription

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

    private _itemsChanged = new Subject()

    private _refresh = new Subject()

    private _reset = new Subject()
    private reset$ = this.destruct.subscription(this._reset).pipe(
        tap(this.visibleRangeStrategy.reset.bind(this.visibleRangeStrategy)),
        tap(() => {
            let sp = this._scroller.scrollPercent
            if (sp.top !== 0 || sp.left !== 0) {
                this._scroller.scrollTo({ top: 0, left: 0 }, { smooth: false })
            }
        }),
        share()
    )

    private visibleRange$ = this.reset$.pipe(
        switchMap(() => this.visibleRangeStrategy.visibleRange$),
        map(vr => {
            if (vr.begin == null || vr.begin === -1) {
                return new NzRange(0, this.itemsPerRequest)
            } else {
                return vr
            }
        }),
        shareReplay(1)
    )

    private renderRange$ = this.visibleRange$.pipe(
        map(vr => {
            return new NzRange(
                Math.max(0, vr.begin - this.visibleRangeStrategy.extraCount),
                vr.end + this.visibleRangeStrategy.extraCount)
        }),
        shareReplay(1)
    )

    private requestRange$ = merge(
        this.renderRange$.pipe(
            withPrevious(this.reset$),
            map(([rrOld, rrNew]) => {
                let nextPage: number

                if (!rrOld || rrOld.end <= rrNew.end) {
                    nextPage = Math.floor((rrOld ? rrOld.end : 0) / this.itemsPerRequest) + 1
                } else {
                    nextPage = Math.max(1, Math.floor(rrOld.begin / this.itemsPerRequest) - 1)
                }

                return new NzRange(
                    Math.max(0, nextPage - 1) * this.itemsPerRequest,
                    nextPage * this.itemsPerRequest)
            }),
        ),
        this._refresh.pipe(
            switchMap(v => this.renderRange$.pipe(take(1))),
            map(rr => {
                let currentPage = Math.floor((rr ? rr.begin : 0) / this.itemsPerRequest)
                return new NzRange(
                    currentPage * this.itemsPerRequest,
                    (currentPage + 1) * this.itemsPerRequest,
                )
            })
        )
    ).pipe(shareReplay(1))

    private items$: Observable<Items<T>> = merge(
        this.requestRange$.pipe(
            switchMap(rr => {
                if (this._nzVirtualForOf && this._nzVirtualForOf.loadRange(rr)) {
                    return EMPTY
                }
                return of(null)
            })
        ),
        this._itemsChanged
    )
        .pipe(
            switchMap(_ => this.renderRange$),
            map(rr => {
                return this._nzVirtualForOf ? this._nzVirtualForOf.getRange(rr) : EMPTY_ITEMS
            })
        )

    @Output("rendered")
    public readonly render$ = this.destruct.subscription(this.items$).pipe(
        map(current => {
            let prev = new Items([], null)
            let minIdx = -1
            let maxIdx = -1
            for (let i = 0, l = this._vcr.length; i < l; i++) {
                const view = this._vcr.get(i) as EmbeddedView<T>
                const ctx = view.context
                if (ctx.index !== -1) {
                    prev.push(ctx.$implicit)
                    if (minIdx === -1) {
                        minIdx = maxIdx = ctx.index
                    } else {
                        maxIdx = ctx.index
                    }
                }
            }

            (prev as { range: NzRange }).range = new NzRange(minIdx === -1 ? 0 : minIdx, maxIdx === -1 ? 0 : maxIdx);
            (prev as { total: number }).total = prev.length

            return [prev, current]
        }),
        map(vals => {
            const [prev, current] = vals
            return {
                changes: current.compare(prev || EMPTY_ITEMS, null),
                renderedRange: prev ? prev.range : new NzRange(0, 0),
                currentRange: current.range
            }
        }),
        tap(result => {
            if (result.changes.length > 0) {
                this.visibleRangeStrategy.onBeforeRender(result.currentRange)
                this._applyChanges(result.changes, result.renderedRange, result.currentRange)
                this.visibleRangeStrategy.onRender(result.currentRange)
            }
        }),
        shareReplay(1)
    )

    public constructor(
        @Inject(ViewContainerRef) private readonly _vcr: ViewContainerRef,
        @Inject(TemplateRef) private readonly _tpl: TemplateRef<VirtualForContext<T>>,
        @Inject(ChangeDetectorRef) private readonly _cdr: ChangeDetectorRef,
        @Inject(ScrollerService) private readonly _scroller: ScrollerService,
        @Inject(ScrollableDirective) private readonly _scrollable: ScrollableDirective,
        @Inject(VirtualForVisibleRange) private readonly visibleRangeStrategy: VirtualForVisibleRange) {
    }

    public ngOnInit() {
        this.destruct.subscription(this.render$).subscribe()
        this.destruct.subscription(this.reset$).subscribe(this.visibleRangeStrategy.update.bind(this.visibleRangeStrategy))
    }

    public ngOnDestroy() {
        this.destruct.run()
    }

    public scrollIntoViewport(item: T | PrimaryKey) {
        this._getItemRect(typeof item === "string" || typeof item === "number" ? item : item.pk)
            .pipe(takeUntil(this.destruct.on), take(1))
            .subscribe(rect => {
                this._scroller.scrollIntoViewport(rect)
            })
    }

    private _itemRectCache: any = {}
    private _getItemRect(pk: PrimaryKey): Observable<RectProps> {
        if (this._itemRectCache[pk]) {
            return this._itemRectCache[pk]
        } else {
            return this._itemRectCache[pk] = this._nzVirtualForOf.getPosition(pk).pipe(
                switchMap(position => {
                    if (position === null || position < 0) {
                        return EMPTY
                    }

                    return new Observable<RectProps>((subscriber: Subscriber<RectProps>) => {
                        let rafId: any = null
                        const emitRect = () => {
                            const rect = this.visibleRangeStrategy.getItemRect(position)
                            if (rect) {
                                subscriber.next(rect)
                                subscriber.complete()
                            } else {
                                this._scroller.scrollBy(
                                    { top: this._scroller.vpImmediate.height },
                                    {
                                        smooth: true, velocity: 0.5, done: () => {
                                            rafId = window[requestAnimationFrame](emitRect)
                                        }
                                    })
                            }
                        }

                        emitRect()
                        return () => {
                            rafId && window[cancelAnimationFrame](rafId)
                        }
                    })
                }),
                tap(_ => {
                    delete this._itemRectCache[pk]
                }),
                shareReplay(1)
            )
        }
    }

    private _applyChanges(changes: Array<ListDiffItem<T>>, renderedRange: NzRange, currentRange: NzRange) {
        let vcrOffset = Math.max(currentRange.begin - this._vcr.length, currentRange.begin)
        let delOffset = Math.max(renderedRange.begin - this._vcr.length, renderedRange.begin)
        let vcrIdx: number
        let view: EmbeddedView<T>


        for (const change of changes) {
            vcrIdx = change.index - vcrOffset

            if (change.kind === ListDiffKind.CREATE) {
                // console.log("CREATE", change.index, vcrIdx, change.item, this._vcr)
                view = this._getViewForItem(change.index, change.item, currentRange, vcrIdx)
                // view.context.prev = vcrIdx > 0 ? (this._vcr.get(vcrIdx - 1) as EmbeddedView<T>)?.context.$implicit : null
                view.context.prev = change.index > 0 ? this._nzVirtualForOf.storage.data[change.index - 1] : null
                view.detectChanges()
                this.visibleRangeStrategy.onItemUpdate(change.index, view)
            } else if (change.kind === ListDiffKind.UPDATE) {
                // console.log("UPDATE", change.index, vcrIdx)
                view = this._vcr.get(vcrIdx) as EmbeddedView<T>
                if (view) {
                    this._updateContext(view.context, change.index, change.item, currentRange)
                } else {
                    view = this._getViewForItem(change.index, change.item, currentRange, vcrIdx)
                }
                // view.context.prev = vcrIdx > 0 ? (this._vcr.get(vcrIdx - 1) as EmbeddedView<T>)?.context.$implicit : null
                view.context.prev = change.index > 0 ? this._nzVirtualForOf.storage.data[change.index - 1] : null
                view.detectChanges()
                this.visibleRangeStrategy.onItemUpdate(change.index, view)
            } else if (change.kind === ListDiffKind.DELETE) {
                vcrIdx = change.index - delOffset
                // console.log("DELETE", change.index, vcrIdx, delOffset)
                view = this._vcr.get(vcrIdx) as EmbeddedView<T>
                if (view) {
                    this.visibleRangeStrategy.onItemRemove(change.index, view)
                    view.context.index = -1
                    this._vcr.detach(vcrIdx)
                    this.reusable.push(view)
                    delOffset++
                }
            }
        }
    }

    private _getViewForItem(index: number, item: T, range: NzRange, pos: number): EmbeddedView<T> {
        let v = this.reusable.shift()
        if (v) {
            this._updateContext(v.context, index, item, range)
            v.reattach()
            return this._vcr.insert(v, pos) as EmbeddedView<T>
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
        ctx.prev = null
        return ctx
    }
}





function removeNode(node: Node) {
    node.parentNode && node.parentNode.removeChild(node)
}
