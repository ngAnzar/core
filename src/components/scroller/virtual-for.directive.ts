import { Directive, Input, Inject, TemplateRef, ViewContainerRef, OnInit, OnDestroy, EmbeddedViewRef, ChangeDetectorRef, DoCheck, Optional } from "@angular/core"
import { Observable, Subject, timer } from "rxjs"
import { startWith, take, debounce } from "rxjs/operators"

import { DataStorage, Range, Model, ItemsWithChanges, Items, ListDiffKind } from "../../data"
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
export class VirtualForDirective<T extends Model<any>> implements OnInit, OnDestroy, DoCheck {
    @Input()
    public set nzVirtualForOf(value: DataStorage<T>) {
        this._nzVirtualForOf = value
    }
    public get nzVirtualForOf(): DataStorage<T> {
        return this._nzVirtualForOf
    }
    protected _nzVirtualForOf: DataStorage<T>

    @Input()
    public set itemsPerRequest(value: number) { this._itemsPerRequest = parseInt(value as any, 10) }
    public get itemsPerRequest(): number { return this._itemsPerRequest }
    protected _itemsPerRequest: number = 30

    @Input()
    public set fixedItemHeight(value: number) { this._fixedItemHeight = parseInt(value as any, 10) }
    public get fixedItemHeight(): number { return this._fixedItemHeight }
    protected _fixedItemHeight?: number

    public get rendered(): Items<T> {
        let contexts: Array<VirtualForContext<T>> = []
        let begin: number = -1
        let end: number = -1

        for (let i = 0, l = this._vcr.length; i < l; i++) {
            let v: EmbeddedView<T> = this._vcr.get(i) as any
            if (v && v.context && v.context.index !== -1) {
                contexts.push(v.context)
                if (begin === -1) {
                    begin = v.context.index
                    end = v.context.index
                } else {
                    begin = Math.min(begin, v.context.index)
                    end = Math.max(end, v.context.index)
                }
            }
        }
        return new Items(contexts.sort((a, b) => a.index - b.index).map(item => item.$implicit), new Range(begin, end))
    }

    // @Input()
    // set nzVirtualForTemplate(value: TemplateRef<VirtualForContext<T>>) {
    //     if (value) {
    //         this._tpl = value
    //     }
    // }

    protected subscriptions: Subscriptions = new Subscriptions()

    protected reusable: EmbeddedView<T>[] = []
    private _visibleRange: Range

    public constructor(@Inject(ViewContainerRef) protected _vcr: ViewContainerRef,
        @Inject(TemplateRef) protected _tpl: TemplateRef<VirtualForContext<T>>,
        @Inject(ChangeDetectorRef) protected _cdr: ChangeDetectorRef,
        @Inject(ScrollerComponent) protected _scroller: ScrollerComponent,
        @Inject(LevitateRef) @Optional() protected _levitateRef: LevitateRef) {
    }

    public ngOnInit() {
        this._update()

        // let prevVisibleRange: Range = new Range(-1, -1)
        // let lastSuccessVisibleRange: Range = prevVisibleRange
        // let lastSuccessScrollPosition: number

        this.subscriptions.add(this._scroller.primaryScrolling).subscribe(event => {
            let vr = this._getVisibleRange()
            this._setVisibleRange(vr)

            // console.log("scroll...")
            // let vr = this._getVisibleRange()

            // if (vr.begin === -1) {
            //     this._scroller.primaryScroll = lastSuccessScrollPosition
            //     this.visiblingRange = vr = lastSuccessVisibleRange
            // } else {
            //     lastSuccessScrollPosition = this._scroller.primaryScroll
            //     lastSuccessVisibleRange = vr
            //     this.visiblingRange = vr
            // }

            // if (prevVisibleRange.begin <= vr.begin) {
            //     this.scrollingDirection = ScrollingDirection.FORWARD
            // } else {
            //     this.scrollingDirection = ScrollingDirection.BACKWARD
            // }

            // let dirty = !prevVisibleRange.isEq(this.visiblingRange)

            // if (dirty) {
            //     prevVisibleRange = this.visiblingRange
            //     this._updateRenderingRange(vr)
            //     this._cdr.markForCheck()
            // }
        })
    }

    public ngOnDestroy() {
        this.subscriptions.unsubscribe()
        this._clear()
    }

    public ngDoCheck() {
        // this._updateNeede.next()

        // this._updateRenderingRange(this._getVisibleRange())

        // if (this.changes) {
        //     this._updateContent(this.changes)
        //     delete this.changes
        // }

        // this._fixRendering()
    }

    protected _updateContent(range: Range, items: ItemsWithChanges<T>) {
        let changes = items.compare(this.rendered)

        for (let change of changes) {
            if (change.kind === ListDiffKind.CREATE) {
                let view = this._getViewForItem(change.index, change.item, range)
                view.detectChanges()
            } else if (change.kind === ListDiffKind.UPDATE) {
                let elIdx = this.itemIndexToElIndex(change.index)
                if (elIdx >= 0) {
                    let view: EmbeddedView<T> = this._vcr.get(elIdx) as EmbeddedView<T>
                    this._updateContext(view.context, change.index, change.item, range)
                } else {
                    let view = this._getViewForItem(change.index, change.item, range)
                    view.detectChanges()
                }
            } else if (change.kind === ListDiffKind.DELETE) {
                let elIdx = this.itemIndexToElIndex(change.index)
                if (elIdx >= 0) {
                    let view = this._vcr.get(elIdx) as EmbeddedView<T>
                    this._vcr.detach(elIdx)
                    view.context.index = -1
                    this.reusable.push(view)
                }
            }
        }

        // this._updateRenderedRange()
        if (changes.length) {
            this._cdr.markForCheck()
            if (this._levitateRef) {
                // if (this._scroller.overflowSecondary) {
                //     this._levitateRef.update()
                // }

                // console.log("_levitateRef.update...")
                // this._levitateRef.update()
            }
        }
    }

    protected _update() {
        let r = this.renderingRange
        this.nzVirtualForOf.getRange(r).subscribe(items => {
            this._updateContent(r, items)
        })
    }

    // protected _fixRendering() {
    //     if (this.renderingRange) {
    //         let items: T[] = []
    //         let changes: Array<CollectionChangeItem<T>> = []

    //         for (let i = this.renderingRange.begin, l = this.renderingRange.end; i < l; i++) {
    //             let v: EmbeddedView<T> = this._vcr.get(this.itemIndexToElIndex(i)) as EmbeddedView<T>
    //             if (!v || v.context.index === -1) {
    //                 let item = this.nzVirtualForOf.get(i)
    //                 if (item) {
    //                     items.push(item)
    //                     changes.push({ kind: "A", index: i, item: item })
    //                 }
    //             }
    //         }

    //         if (items.length) {
    //             this._updateContent({
    //                 changes: changes,
    //                 items: items
    //             })
    //         }
    //     }

    // }

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

    protected _getViewForItem(index: number, item: T, range: Range): EmbeddedView<T> {
        let v = this.reusable.pop()
        if (v) {
            this._updateContext(v.context, index, item, range)
            this._vcr.insert(v)
        } else {
            v = this._vcr.createEmbeddedView(this._tpl, this._updateContext({} as VirtualForContext<T>, index, item, range))
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

    protected _updateContext(ctx: VirtualForContext<T>, index: number, item: T, range: Range): VirtualForContext<T> {
        ctx.$implicit = item
        ctx.index = index
        ctx.begin = range.begin
        ctx.end = range.end
        ctx.first = index === range.begin
        ctx.last = index === range.end
        return ctx
    }

    public get visibleRange(): Range {
        if (!this._visibleRange) {
            this._visibleRange = this._getVisibleRange()
        }
        return this._visibleRange
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
                        begin = vr.context.index
                    }
                    end = vr.context.index
                }
            }

            return new Range(
                this.elIndexToItemIndex(begin) || 0,
                this.elIndexToItemIndex(end) || 0)
        }
    }

    protected _setVisibleRange(vr: Range): void {
        if (!this._visibleRange || !this._visibleRange.isEq(vr)) {
            this._visibleRange = vr
            // this._updateNeede.next()
            this._update()
        }
    }

    public get renderingRange(): Range {
        let vr = this.visibleRange
        let offset = vr.begin === -1 || vr.begin === vr.end ? this.itemsPerRequest : Math.round(this.itemsPerRequest / 2)
        return new Range(
            Math.max(0, vr.begin - offset),
            vr.end + offset
        )
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
}
