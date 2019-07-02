import {
    Directive, Input, Inject, TemplateRef, ViewContainerRef, OnInit,
    OnDestroy, EmbeddedViewRef, ChangeDetectorRef, DoCheck, Optional, ViewRef,
    DefaultIterableDiffer
} from "@angular/core"
import { startWith } from "rxjs/operators"

import { DataSourceDirective, Model, Items } from "../data.module"
import { Destruct, NzRange, ListDiffKind } from "../util"
// import { ScrollableDirective } from "./scrollable.directive"
import { ScrollerService } from "./scroller/scroller.service"
import { ScrollableDirective } from "./scroller/scrollable.directive"
import { Rect } from '../layout.module';


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


interface RenderedElement {
    // el: HTMLElement
    idx: number
    rect: Rect
    invalidated: boolean
}


export type EmbeddedView<T> = EmbeddedViewRef<VirtualForContext<T>>


@Directive({
    selector: "[nzVirtualFor][nzVirtualForOf]",
    exportAs: "nzVirtualFor"
})
export class VirtualForDirective<T extends Model> implements OnInit, OnDestroy, DoCheck {
    @Input()
    public set nzVirtualForOf(value: DataSourceDirective<T>) {
        this._nzVirtualForOf = value
    }
    public get nzVirtualForOf(): DataSourceDirective<T> {
        return this._nzVirtualForOf
    }
    protected _nzVirtualForOf: DataSourceDirective<T>

    @Input()
    public set itemsPerRequest(value: number) { this._itemsPerRequest = parseInt(value as any, 10) }
    public get itemsPerRequest(): number { return this._itemsPerRequest }
    protected _itemsPerRequest: number = 30

    @Input()
    public set fixedItemHeight(value: number) { this._fixedItemHeight = parseInt(value as any, 10) }
    public get fixedItemHeight(): number { return this._fixedItemHeight }
    protected _fixedItemHeight: number = 0

    private _cache: RenderedElement[] = []

    public readonly rendered: Items<T> = new Items([], new NzRange(0, 0), 0)

    protected destruct = new Destruct(() => {
        function d(view: ViewRef) {
            !view.destroyed && view.destroy()
        }

        this._vcr.clear()

        for (let i = 0, l = this.reusable.length; i < l; i++) {
            d(this.reusable[i])
        }
        this.reusable.length = 0
        this._cache.length = 0
    })

    protected reusable: EmbeddedView<T>[] = []
    private _visibleRange: NzRange
    private _maxHeight: number = 0
    private _pendingScroll: boolean
    private _scrollSuspended: boolean
    private _check: boolean = false

    public constructor(@Inject(ViewContainerRef) protected _vcr: ViewContainerRef,
        @Inject(TemplateRef) protected _tpl: TemplateRef<VirtualForContext<T>>,
        @Inject(ChangeDetectorRef) protected _cdr: ChangeDetectorRef,
        @Inject(ScrollerService) protected _scroller: ScrollerService,
        @Inject(ScrollableDirective) protected _scrollable: ScrollableDirective) {
    }

    public ngOnInit() {
        this.destruct.subscription(this.nzVirtualForOf.storage.invalidated).subscribe(() => {
            this._resetCache()
            this._clear()
            let sp = this._scroller.scrollPercent
            if (sp.top == 0 && sp.left == 0) {
                this.onScroll()
            } else {
                this._scroller.scrollPercent = { top: 0, left: 0 }
            }
        })
        this.destruct.subscription(this._scroller.vpImmediate.scroll).pipe(startWith(0)).subscribe(this.onScroll)
    }

    public ngDoCheck() {
        for (let i = 0, l = this._vcr.length; i < l; i++) {
            let v: EmbeddedView<T> = this._vcr.get(i) as any
            if (v && v.context && v.context.index !== -1) {
                v.detectChanges()
            }
        }
    }

    private onScroll = () => {
        if (this._scrollSuspended) {
            this._pendingScroll = true
            return
        }
        this._scrollSuspended = true

        let vr = this._getVisibleRange()

        if (vr.begin === -1) {
            vr = new NzRange(0, this.itemsPerRequest)
        }

        if (this._visibleRange && this._visibleRange.isEq(vr)) {
            this._scrollSuspended = false
            return
        }

        this._visibleRange = vr

        let r = this.renderingRange
        let request = this._getRequestRange(r)
        this.nzVirtualForOf.getRange(request).subscribe(items => {
            let render = items.getRange(r)
            this._updateContent(render.range, render)
        })
    }

    public ngOnDestroy() {
        this.destruct.run()
    }

    protected _updateContent(range: NzRange, items: Items<T>) {
        let changes = items.compare(this.rendered)

        if (changes.length === 0) {
            this._scrollSuspended = false
            return
        }

        let vcrOffset = Math.max(range.begin - this._vcr.length, range.begin)
        let delOffset = Math.max(this.rendered.range.begin - this._vcr.length, this.rendered.range.begin)
        let vcrIdx: number

        let view: EmbeddedView<T>
        let cached: RenderedElement

        for (let change of changes) {
            cached = this._cache[change.index]
            if (cached) {
                cached.invalidated = true
            }

            vcrIdx = change.index - vcrOffset

            if (change.kind === ListDiffKind.CREATE) {
                // console.log("CREATE", change.index, vcrIdx, change.item)
                view = this._getViewForItem(change.index, change.item, range, vcrIdx)
                view.detectChanges()
            } else if (change.kind === ListDiffKind.UPDATE) {
                // console.log("UPDATE", change.index, vcrIdx)
                view = this._vcr.get(vcrIdx) as EmbeddedView<T>
                if (view) {
                    this._updateContext(view.context, change.index, change.item, range)
                } else {
                    view = this._getViewForItem(change.index, change.item, range, vcrIdx)
                }
                view.detectChanges()
            } else if (change.kind === ListDiffKind.DELETE) {
                vcrIdx = change.index - delOffset
                // console.log("DELETE", change.index, vcrIdx, delOffset)
                view = this._vcr.get(vcrIdx) as EmbeddedView<T>
                if (view) {
                    this._cache[change.index] = this.renderedElement(view)
                    view.context.index = -1
                    this._vcr.detach(vcrIdx)
                    this.reusable.push(view)
                    delOffset++
                }
            }
        }

        (this as any).rendered = this._collectRendered()
        if (this.fixedItemHeight <= 0) {
            let ss = this._spacerSize()

            // console.log({ ss })
            // this._scroller.vpRender.translateY = ss
            this._scrollable.el.nativeElement.style.paddingTop = `${ss}px`
            // this._scrollable.el.nativeElement.style.paddingBottom = `200px`

            this._maxHeight = Math.max(this._maxHeight, ss + this._renderedSize())
            this._scrollable.el.nativeElement.style.minHeight = `${this._maxHeight}px`
            // this._updateElsPositions()
            // this._scrollable.el.nativeElement.style.height = `${this._maxHeight}px`
        }

        this._scrollSuspended = false
        if (this._pendingScroll) {
            this._pendingScroll = false
            // console.log("*************** PENDING SCROLL")
            this.onScroll()
        }

        this._check = true
        this._cdr.markForCheck()
    }

    protected _collectRendered(): Items<T> {
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

        if (begin === -1) {
            return new Items([], new NzRange(0, 0))
        }

        return new Items(contexts.sort((a, b) => a.index - b.index).map(item => item.$implicit), new NzRange(begin, end))
    }

    protected _spacerSize() {
        let size = 0
        for (let i = 0, l = this.rendered.range.begin; i < l; i++) {
            let rect = this._cache[i].rect
            if (rect) {
                size += rect.height
            }
        }
        return size
    }

    protected _renderedSize() {
        let rr = this.rendered.range
        let offset = Math.max(rr.begin - this._vcr.length, rr.begin)
        let begin = rr.begin - offset
        let end = rr.end - offset
        let height = 0
        for (let i = begin; i < end; i++) {
            let view = this._vcr.get(i) as EmbeddedView<T>
            if (view) {
                height += this.renderedElement(view).rect.height
            }
        }
        return height
    }

    protected _resetCache() {
        this._cache.length = 0
        this._maxHeight = 0
        this._visibleRange = null
        this._scrollSuspended = false
        this._pendingScroll = false
    }

    protected _clear() {
        this.reusable.length = 0
        for (let i = this._vcr.length - 1; i >= 0; i--) {
            let v: EmbeddedView<T> = this._vcr.get(i) as any
            v.context.index = -1
            this._vcr.detach(i)
            this.reusable.push(v)
        }
        (this as any).rendered = new Items([], new NzRange(0, 0))
    }

    protected _getViewForItem(index: number, item: T, range: NzRange, pos: number): EmbeddedView<T> {
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
        if (!this._visibleRange) {
            this._visibleRange = this._getVisibleRange()
        }
        return this._visibleRange
    }

    protected _getVisibleRange(): NzRange {
        const viewport = this._scroller.vpImmediate
        let begin: number = -1
        let end: number = -1

        if (this._fixedItemHeight > 0) {
            begin = Math.floor(viewport.visible.top / this._fixedItemHeight)
            end = begin + Math.ceil(viewport.visible.height / this._fixedItemHeight)
            return new NzRange(begin, end)
        } else {
            let items: RenderedElement[] = []
            for (let i = 0, l = this._vcr.length; i < l; i++) {
                let v = this._vcr.get(i) as EmbeddedViewRef<VirtualForContext<T>>
                if (v && v.context && v.context.index !== -1) {
                    items.push(this.renderedElement(v))
                }
            }
            items.sort((a, b) => a.idx - b.idx)

            let range = this._getVisibleRangeFormCache(items)
            if (!range) {
                range = this._getVisibleRangeFormCache(this._cache)
            }

            if (range) {
                return range
            } else {
                return new NzRange(begin, end)
            }
        }
    }

    protected _getVisibleRangeFormCache(items: RenderedElement[]) {
        let begin: number = -1
        let end: number = -1
        let visibleRect = this._scroller.vpImmediate.visible

        // console.log("visibleRect", visibleRect)

        for (const item of items) {
            if (item && item.rect) {
                if (visibleRect.isIntersect(item.rect)) {
                    if (begin === -1) {
                        begin = item.idx
                    }
                    end = item.idx
                } else if (begin !== -1) {
                    // reach end of visible range
                    break
                }
            }
        }

        if (begin === -1) {
            return null
        } else {
            return new NzRange(begin, end)
        }
    }

    public get renderingRange(): NzRange {
        let vr = this.visibleNzRange
        let offset = vr.begin === -1 || vr.begin === vr.end ? this.itemsPerRequest : Math.round(this.itemsPerRequest / 2)
        return new NzRange(
            Math.max(0, vr.begin - offset),
            vr.end + offset
        )
    }

    protected _getRequestRange(r: NzRange): NzRange {
        return new NzRange(
            Math.floor(r.begin / this.itemsPerRequest) * this.itemsPerRequest,
            Math.ceil(r.end / this.itemsPerRequest) * this.itemsPerRequest,
        )
    }

    protected _getHtmlEl(vr: EmbeddedViewRef<any>): HTMLElement | null {
        for (const el of vr.rootNodes) {
            // Node.ELEMENT_NODE
            if ((el as HTMLElement).nodeType === 1) {
                return el
            }
        }
        return null
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

    protected renderedElement(view: EmbeddedViewRef<VirtualForContext<T>>): RenderedElement {
        let idx = view.context ? view.context.index : -1
        if (idx === -1) {
            let el = this._getHtmlEl(view)
            return {
                // el: el,
                idx: idx,
                rect: el ? this._scrollable.getElementRect(el) : null,
                invalidated: false
            }
        } else if (this._cache[idx] && !this._cache[idx].invalidated) {
            return this._cache[idx]
        } else {
            let el = this._getHtmlEl(view)
            return this._cache[idx] = {
                // el: el,
                idx: idx,
                rect: el ? this._scrollable.getElementRect(el) : null,
                invalidated: false
            }
        }
    }
}
