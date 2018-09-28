import { Directive, Input, Inject, TemplateRef, ViewContainerRef, OnInit, OnDestroy, EmbeddedViewRef, ChangeDetectorRef, DoCheck, Optional } from "@angular/core"
import { startWith } from "rxjs/operators"

import { CollectionChangeEvent, CollectionChangeItem } from "../../data/collection"
import { DataView } from "../../data/data-view"
import { Range } from "../../data/range"
import { Subscriptions } from "../../util/subscriptions"
import { LayerRef } from "../../layer.module"
import { LevitateRef } from "../../levitate/levitate-ref"
import { ScrollerComponent } from "./scroller.component"


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


export type EmbeddedView<T> = EmbeddedViewRef<VirtualForContext<T>>


@Directive({
    selector: "[nzVirtualFor][nzVirtualForOf]"
})
export class VirtualForDirective<T> implements OnInit, OnDestroy, DoCheck {
    @Input()
    public set nzVirtualForOf(value: DataView<T>) {
        this._nzVirtualForOf = value
    }
    public get nzVirtualForOf(): DataView<T> {
        return this._nzVirtualForOf
    }
    protected _nzVirtualForOf: DataView<T>

    @Input()
    public set itemsPerRequest(value: number) { this._itemsPerRequest = parseInt(value as any, 10) }
    public get itemsPerRequest(): number { return this._itemsPerRequest }
    protected _itemsPerRequest: number = 10

    @Input()
    public set fixedItemHeight(value: number) { this._fixedItemHeight = parseInt(value as any, 10) }
    public get fixedItemHeight(): number { return this._fixedItemHeight }
    protected _fixedItemHeight?: number

    // @Input()
    // set nzVirtualForTemplate(value: TemplateRef<VirtualForContext<T>>) {
    //     if (value) {
    //         this._tpl = value
    //     }
    // }

    protected subscriptions: Subscriptions = new Subscriptions()
    protected scrollingDirection: ScrollingDirection
    protected renderingRange: Range
    protected visiblingRange: Range
    protected changes: CollectionChangeEvent<T>

    protected reusable: EmbeddedView<T>[] = []

    public constructor(@Inject(ViewContainerRef) protected _vcr: ViewContainerRef,
        @Inject(TemplateRef) protected _tpl: TemplateRef<VirtualForContext<T>>,
        @Inject(ChangeDetectorRef) protected _cdr: ChangeDetectorRef,
        @Inject(ScrollerComponent) protected _scroller: ScrollerComponent,
        @Inject(LevitateRef) @Optional() protected _levitateRef: LevitateRef) {
    }

    public ngOnInit() {
        this.subscriptions.add(this.nzVirtualForOf.itemsChanged)
            .pipe(startWith({
                changes: this.nzVirtualForOf.items.map((item, index) => { return { kind: "A", index: index, item: item } }),
                items: this.nzVirtualForOf.items
            } as CollectionChangeEvent<any>))
            .subscribe(event => {
                // console.log("changes", event.changes)
                this.changes = event
                this._cdr.markForCheck()
            })

        let prevVisibleRange: Range = new Range(-1, -1)
        let lastSuccessVisibleRange: Range = prevVisibleRange
        let lastSuccessScrollPosition: number
        this.subscriptions.add(this._scroller.primaryScrolling).subscribe(event => {
            let vr = this._getVisibleRange()

            if (vr.begin === -1) {
                this._scroller.primaryScroll = lastSuccessScrollPosition
                this.visiblingRange = vr = lastSuccessVisibleRange
            } else {
                lastSuccessScrollPosition = this._scroller.primaryScroll
                lastSuccessVisibleRange = vr
                this.visiblingRange = vr
            }

            if (prevVisibleRange.begin <= vr.begin) {
                this.scrollingDirection = ScrollingDirection.FORWARD
            } else {
                this.scrollingDirection = ScrollingDirection.BACKWARD
            }

            let dirty = !prevVisibleRange.isEq(this.visiblingRange)

            if (dirty) {
                prevVisibleRange = this.visiblingRange
                this._updateRenderingRange(vr)
                this._cdr.markForCheck()
            }
        })
    }

    public ngOnDestroy() {
        this.subscriptions.unsubscribe()
    }

    public ngDoCheck() {
        if (this.changes) {
            this._updateContent(this.changes)
            delete this.changes
        }

        // this._fixRendering()
    }

    protected _updateContent(event: CollectionChangeEvent<T>) {
        for (let change of event.changes) {
            if (change.kind === "D") {
                let elIdx = this.itemIndexToElIndex(change.index)
                if (elIdx >= 0) {
                    this._reuseTemplate(this._vcr.get(elIdx) as EmbeddedView<T>)
                }
            }
        }

        for (let change of event.changes) {
            if (change.kind === "A") {
                let view = this._getViewForItem(change.index, change.item)
                view.detectChanges()
            } else if (change.kind === "U") {
                let elIdx = this.itemIndexToElIndex(change.index)
                if (elIdx >= 0) {
                    let view: EmbeddedView<T> = this._vcr.get(elIdx) as EmbeddedView<T>
                    this._updateContext(view.context, change.newIndex, change.item)
                } else {
                    let view = this._getViewForItem(change.newIndex, change.item)
                    view.detectChanges()
                }
            }
        }

        // this._updateRenderedRange()
        // this._cdr.markForCheck()

        // if (this._levitateRef) {
        //     this._levitateRef.update()
        // }
    }

    protected _fixRendering() {
        if (this.renderingRange) {
            let items: T[] = []
            let changes: Array<CollectionChangeItem<T>> = []

            for (let i = this.renderingRange.begin, l = this.renderingRange.end; i < l; i++) {
                let v: EmbeddedView<T> = this._vcr.get(this.itemIndexToElIndex(i)) as EmbeddedView<T>
                if (!v || v.context.index === -1) {
                    let item = this.nzVirtualForOf.get(i)
                    if (item) {
                        items.push(item)
                        changes.push({ kind: "A", index: i, item: item })
                    }
                }
            }

            if (items.length) {
                this._updateContent({
                    changes: changes,
                    items: items
                })
            }
        }

    }

    protected _clear() {
        let i = this._vcr.length
        while (i-- > 0) {
            this._vcr.get(i).destroy()
        }

        i = this.reusable.length
        while (i-- > 0) {
            this.reusable.pop().destroy()
        }
    }

    protected _getViewForItem(index: number, item: T): EmbeddedView<T> {
        // TODO: viewcache
        let v = this.reusable.pop()
        if (v) {
            this._updateContext(v.context, index, item)
            this._vcr.insert(v)
        } else {
            v = this._vcr.createEmbeddedView(this._tpl, this._updateContext({} as VirtualForContext<T>, index, item))
        }
        return v
    }

    // protected _itemContext(index: number, item: T): VirtualForContext<T> {
    //     return {
    //         $item: item,
    //         index: index,
    //         begin: 0,
    //         end: 20,
    //         first: index === 0,
    //         last: index === 20
    //     }
    // }

    protected _updateContext(ctx: VirtualForContext<T>, index: number, item: T): VirtualForContext<T> {
        ctx.$implicit = item
        ctx.index = index
        ctx.begin = 0
        ctx.end = 20
        ctx.first = index === ctx.begin
        ctx.last = index === ctx.end
        return ctx
    }

    protected _reuseTemplate(view: EmbeddedView<T>): void {
        let i: number = this._vcr.indexOf(view)
        this._vcr.detach(i)
        view.context.index = -1
    }

    protected _getVisibleRange(): Range {
        let viewport = this._scroller.viewport
        let begin: number = -1
        let end: number = -1

        if (this.fixedItemHeight > 0) {
            begin = Math.floor(viewport.top / this.fixedItemHeight)
            end = begin + Math.ceil(viewport.height / this.fixedItemHeight)
            return new Range(begin, end)
        } else {
            let checked: any[] = []

            for (let i = 0, l = this._vcr.length; i < l; i++) {
                let vr = this._vcr.get(i) as EmbeddedViewRef<VirtualForContext<T>>
                let el = this._getHtmlEl(vr)

                if (checked.indexOf(el) !== -1) {
                    continue
                }
                checked.push(el)

                if (el && this._scroller.elementIsVisible(viewport, el)) {
                    if (begin === -1) {
                        begin = i
                    }
                    end = i
                }
            }

            return new Range(
                this.elIndexToItemIndex(begin) || 0,
                this.elIndexToItemIndex(end) || 0)
        }
    }

    protected _getHtmlEl(vr: EmbeddedViewRef<any>): HTMLElement | null {
        for (let el of vr.rootNodes) {
            // Node.ELEMENT_NODE
            if ((el as HTMLElement).nodeType === 1) {
                return el
            }
        }
        return null
    }

    protected elIndexToItemIndex(elIndex: number): number {
        let v: EmbeddedView<T> = this._vcr.get(elIndex) as EmbeddedView<T>
        return v ? v.context.index : -1
    }

    protected itemIndexToElIndex(itemIndex: number): number {
        for (let i = 0, l = this._vcr.length; i < l; i++) {
            let v: EmbeddedView<T> = this._vcr.get(i) as EmbeddedView<T>
            if (v && v.context.index === itemIndex) {
                return i
            }
        }
        return -1
    }

    protected _updateRenderingRange(visibleRange: Range) {
        let offset = Math.round(this.itemsPerRequest / 2)
        this.renderingRange = new Range(
            Math.max(0, visibleRange.begin - offset),
            Math.min(this.nzVirtualForOf.maxIndex, visibleRange.end + offset)
        )
        // console.log("rendering", this.renderingRange)
        this.nzVirtualForOf.requestRange(this.renderingRange)
    }



    // caching
    // protected _reuseInvisibleTemplates(visibleRange: Range) {
    //     let offset = Math.round(this.itemsPerRequest / 2)
    //     let begin = visibleRange.begin - offset
    //     let end = visibleRange.end + offset

    //     if (this.scrollingDirection === ScrollingDirection.BACKWARD) {
    //         begin = visibleRange.begin - offset
    //         end = visibleRange.end + offset
    //     }

    //     let keepRange = new Range(begin, end)

    //     console.log("keep", keepRange)

    //     for (let i = 0, l = this._vcr.length; i < l; i++) {
    //         let v: EmbeddedView<T> = this._vcr.get(i) as EmbeddedView<T>

    //         if (v && v.context.index >= 0 && !keepRange.contains(v.context.index)) {
    //             console.log("reuse", v.context.index)
    //             this._reuseTemplate(this._vcr.detach(i) as EmbeddedView<T>)
    //         }
    //     }

    //     this._updateRenderedRange()
    // }

    // protected _updateRenderedRange() {
    //     let begin = -1
    //     let end = 0

    //     for (let i = 0, l = this._vcr.length; i < l; i++) {
    //         let view: EmbeddedView<T> = this._vcr.get(i) as EmbeddedView<T>
    //         if (view.context.index >= 0) {
    //             if (view && this.reusable.indexOf(view) === -1) {
    //                 if (begin === -1) {
    //                     begin = view.context.index
    //                 }
    //                 end = view.context.index
    //             }
    //         }
    //     }

    //     this.renderingRange = new Range(begin, end)
    //     console.log("rendered", this.renderingRange)
    // }
}
