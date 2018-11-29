import {
    Directive, Input, Inject, TemplateRef, ViewContainerRef, OnInit,
    OnDestroy, EmbeddedViewRef, ChangeDetectorRef, DoCheck, Optional, ViewRef
} from "@angular/core"
import { startWith } from "rxjs/operators"

import { DataStorage, Model, Items } from "../data.module"
import { Destruct, NzRange, ListDiffKind } from "../util"
import { ScrollableDirective } from "./scrollable.directive"


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
export class VirtualForDirective<T extends Model> implements OnInit, OnDestroy, DoCheck {
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
        return new Items(contexts.sort((a, b) => a.index - b.index).map(item => item.$implicit), new NzRange(begin, end))
    }

    // @Input()
    // set nzVirtualForTemplate(value: TemplateRef<VirtualForContext<T>>) {
    //     if (value) {
    //         this._tpl = value
    //     }
    // }

    // protected s: Subscriptions = new Subscriptions()
    protected destruct = new Destruct(() => {
        function d(view: ViewRef) {
            !view.destroyed && view.destroy()
        }

        for (let i = 0, l = this._vcr.length; i < l; i++) {
            d(this._vcr.get(i))
        }

        for (let i = 0, l = this.reusable.length; i < l; i++) {
            d(this.reusable[i])
        }
        this.reusable.length = 0
    })

    protected reusable: EmbeddedView<T>[] = []
    private _visibleNzRange: NzRange

    public constructor(@Inject(ViewContainerRef) protected _vcr: ViewContainerRef,
        @Inject(TemplateRef) protected _tpl: TemplateRef<VirtualForContext<T>>,
        @Inject(ChangeDetectorRef) protected _cdr: ChangeDetectorRef,
        @Inject(ScrollableDirective) protected _scroller: ScrollableDirective) {
    }

    public ngOnInit() {
        this.destruct.subscription(this.nzVirtualForOf.invalidated).pipe(startWith(0)).subscribe(this._update)

        this.destruct.subscription(this._scroller.primaryScrolling).subscribe(event => {
            let vr = this._getVisibleNzRange()
            this._setVisibleNzRange(vr)
        })
    }

    public ngOnDestroy() {
        this.destruct.run()
    }

    public ngDoCheck() {
        if (this.destruct.done) {
            return
        }

        let r = this.renderingNzRange
        let request = this._getRequestNzRange(r)
        this.nzVirtualForOf.getRange(request).subscribe(items => {
            let render = items.getRange(r)
            this._updateContent(render.range, render)
        })
    }

    protected _updateContent(range: NzRange, items: Items<T>) {
        let changes = items.compare(this.rendered)

        for (let change of changes) {
            if (change.kind === ListDiffKind.CREATE) {
                this._getViewForItem(change.index, change.item, range)
            } else if (change.kind === ListDiffKind.UPDATE) {
                let elIdx = this.itemIndexToElIndex(change.index)
                if (elIdx >= 0) {
                    let view: EmbeddedView<T> = this._vcr.get(elIdx) as EmbeddedView<T>
                    this._updateContext(view.context, change.index, change.item, range)
                } else {
                    this._getViewForItem(change.index, change.item, range)
                }
            } else if (change.kind === ListDiffKind.DELETE) {
                let elIdx = this.itemIndexToElIndex(change.index)
                if (elIdx >= 0) {
                    let view = this._vcr.get(elIdx) as EmbeddedView<T>
                    this._updateContext(view.context, -1, null, range)
                    this._vcr.detach(elIdx)
                    // view.detectChanges()
                    this.reusable.push(view)
                }
            }
        }

        for (let i = 0, l = this._vcr.length; i < l; i++) {
            let view = this._vcr.get(i) as EmbeddedView<T>
            if (view && !view.destroyed && view.context && view.context.index !== -1) {
                view.detectChanges()
            }
        }
    }

    protected _update = () => {
        if (!this.destruct.done) {
            this._cdr.detectChanges()
        }
    }

    // protected _fixRendering() {
    //     if (this.renderingNzRange) {
    //         let items: T[] = []
    //         let changes: Array<CollectionChangeItem<T>> = []

    //         for (let i = this.renderingNzRange.begin, l = this.renderingNzRange.end; i < l; i++) {
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



    protected _getViewForItem(index: number, item: T, range: NzRange): EmbeddedView<T> {
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

    protected _updateContext(ctx: VirtualForContext<T>, index: number, item: T, range: NzRange): VirtualForContext<T> {
        ctx.$implicit = item
        ctx.index = index
        ctx.begin = range.begin
        ctx.end = range.end
        ctx.first = index === range.begin
        ctx.last = index === range.end
        return ctx
    }

    public get visibleNzRange(): NzRange {
        if (!this._visibleNzRange) {
            this._visibleNzRange = this._getVisibleNzRange()
        }
        return this._visibleNzRange
    }

    protected _getVisibleNzRange(): NzRange {
        let viewport = this._scroller.viewport
        let begin: number = -1
        let end: number = -1

        if (this.fixedItemHeight > 0) {
            begin = Math.floor(viewport.top / this.fixedItemHeight)
            end = begin + Math.ceil(viewport.height / this.fixedItemHeight)
            return new NzRange(begin, end)
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

            return new NzRange(
                this.elIndexToItemIndex(begin) || 0,
                this.elIndexToItemIndex(end) || 0)
        }
    }

    protected _setVisibleNzRange(vr: NzRange): void {
        if (!this._visibleNzRange || !this._visibleNzRange.isEq(vr)) {
            this._visibleNzRange = vr
            this._update()
        }
    }

    public get renderingNzRange(): NzRange {
        let vr = this.visibleNzRange
        let offset = vr.begin === -1 || vr.begin === vr.end ? this.itemsPerRequest : Math.round(this.itemsPerRequest / 2)
        return new NzRange(
            Math.max(0, vr.begin - offset),
            vr.end + offset
        )
    }

    protected _getRequestNzRange(r: NzRange): NzRange {
        return new NzRange(
            Math.floor(r.begin / this.itemsPerRequest) * this.itemsPerRequest,
            Math.ceil(r.end / this.itemsPerRequest) * this.itemsPerRequest,
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
