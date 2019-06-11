import {
    Directive, Input, Inject, TemplateRef, ViewContainerRef, OnInit,
    OnDestroy, EmbeddedViewRef, ChangeDetectorRef, DoCheck, Optional, ViewRef
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

    private _elCachedRect: Rect[] = []

    public readonly rendered: Items<T> = new Items([], new NzRange(-1, -1), 0)

    protected destruct = new Destruct(() => {
        function d(view: ViewRef) {
            !view.destroyed && view.destroy()
        }

        /*
        console.log("vcr.length", this._vcr.length)
        for (let i = 0, l = this._vcr.length; i < l; i++) {
            console.log("D", i)
            d(this._vcr.get(i))
        }
        */
        this._vcr.clear()

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
        @Inject(ScrollerService) protected _scroller: ScrollerService,
        @Inject(ScrollableDirective) protected _scrollable: ScrollableDirective) {

    }

    public ngOnInit() {
        this.destruct.subscription(this.nzVirtualForOf.storage.invalidated).subscribe(this._update)

        this.destruct.subscription(this._scroller.vpImmediate.scroll).pipe(startWith(0)).subscribe(event => {
            let vr = this._getVisibleNzRange()
            console.log(vr)
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
                let v = this._getViewForItem(change.index, change.item, range)
                v.detectChanges()
                this._elCachedRect[change.index] = this._getRectByView(v)
            } else if (change.kind === ListDiffKind.UPDATE) {
                delete this._elCachedRect[change.index]
                let elIdx = this.itemIndexToElIndex(change.index)
                let view: EmbeddedView<T>
                if (elIdx >= 0) {
                    view = this._vcr.get(elIdx) as EmbeddedView<T>
                    this._updateContext(view.context, change.index, change.item, range)
                } else {
                    view = this._getViewForItem(change.index, change.item, range)
                }
                view.detectChanges()
                this._elCachedRect[change.index] = this._getRectByView(view)
            } else if (change.kind === ListDiffKind.DELETE) {
                let elIdx = this.itemIndexToElIndex(change.index)
                if (elIdx >= 0) {
                    let view = this._vcr.get(elIdx) as EmbeddedView<T>
                    this._updateContext(view.context, -1, null, range)
                    this._vcr.remove(elIdx)

                    // this._vcr.detach(elIdx)
                    // view.detectChanges()
                    // this.reusable.push(view)
                }
            }
        }

        if (changes.length) {
            (this as any).rendered = this._collectRendered()
            if (this.fixedItemHeight <= 0) {
                // let ss = this._spacerSize()
                // console.log({ ss })
                // this._scrollable.el.nativeElement.style.paddingTop = `${this._spacerSize()}px`
                this._updateElsPositions()
                this._scrollable.el.nativeElement.style.height = `${this._maxHeight}px`
            }
        }
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
        return new Items(contexts.sort((a, b) => a.index - b.index).map(item => item.$implicit), new NzRange(begin, end))
    }

    protected _spacerSize() {
        let size = 0
        for (let i = 0, l = this.rendered.range.begin; i < l; i++) {
            let rect = this._elCachedRect[i]
            if (rect) {
                size += rect.height
            }
        }
        return size
    }

    private _maxHeight: number = 0
    protected _updateElsPositions() {
        let ss = this._spacerSize()
        let begin = this.rendered.range.begin
        let end = this.rendered.range.end
        for (let i = begin, l = end; i < l; i++) {
            let elIdx = this.itemIndexToElIndex(i)
            let view = this._vcr.get(elIdx) as EmbeddedView<T>
            let el = this._getHtmlEl(view)
            el.style.transform = `translateY(${ss}px)`
            ss += this._getRectByView(view).height
        }

        this._maxHeight = Math.max(this._maxHeight, ss)
    }

    protected _update = () => {
        if (!this.destruct.done) {
            this._cdr.detectChanges()
        }
    }

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
        const viewport = this._scroller.vpImmediate
        let begin: number = -1
        let end: number = -1

        if (this._fixedItemHeight > 0) {
            begin = Math.floor(viewport.visible.top / this._fixedItemHeight)
            end = begin + Math.ceil(viewport.visible.height / this._fixedItemHeight)
            return new NzRange(begin, end)
        } else {
            let items: Array<EmbeddedViewRef<VirtualForContext<T>>> = []
            for (let i = 0, l = this._vcr.length; i < l; i++) {
                let v = this._vcr.get(i) as EmbeddedViewRef<VirtualForContext<T>>
                if (v && v.context && v.context.index !== -1) {
                    items.push(v)
                }
            }
            items.sort((a, b) => a.context.index - b.context.index)

            let visible = false
            let visibleRect = this._scroller.vpImmediate.visible
            for (let item of items) {
                let rect = this._getRectByView(item)

                if (visibleRect.isIntersect(rect)) {
                    visible = true
                    if (begin === -1) {
                        begin = item.context.index
                    }
                    end = item.context.index
                } else if (visible) {
                    // reach end of visible range
                    break
                }
            }

            return new NzRange(begin, end)
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

    protected _getRectByView(vr: EmbeddedViewRef<VirtualForContext<T>>): Rect {
        let idx = vr.context.index
        if (this._elCachedRect[idx]) {
            return this._elCachedRect[idx]
        } else {
            let el = this._getHtmlEl(vr)
            if (el) {
                let rect = this._scroller.getElementImmediateRect(el)
                return this._elCachedRect[idx] = rect
            } else {
                return null
            }
        }
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
