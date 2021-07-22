import { Directive, Inject, Injectable, EmbeddedViewRef, Input, OnDestroy } from "@angular/core"
import { Observable, Subject, merge } from "rxjs"
import { map, startWith, shareReplay, filter, switchMap } from "rxjs/operators"

import { __zone_symbol__, NzRange, RectProps, Destructible, Rect } from "../../util"
import { ScrollerService, Viewport } from "../scroller/scroller.service"
import { ScrollableDirective } from "../scroller/scrollable.directive"
import { VirtualForContext } from "./virtual-for.directive"
import { withPrevious, skipWhenRangeIsEq, buffer, ItemIndexes } from "./utils"



const RESIZE_OBSERVER = __zone_symbol__("ResizeObserver")
const INTERSECTION_OBSERVER = __zone_symbol__("IntersectionObserver")

const _ResizeObserver = (window as any)[RESIZE_OBSERVER]
const _IntersectionObserver = window[INTERSECTION_OBSERVER]


@Injectable()
export abstract class VirtualForVisibleRange extends Destructible {
    protected readonly _update = new Subject()
    protected readonly _reset = new Subject()
    // protected readonly _visibleRange = new Subject<NzRange>()
    protected isPaused: number = 0
    public abstract readonly extraCount: number

    public readonly visibleRange$: Observable<NzRange> = this._update.pipe(
        filter(v => this.isPaused === 0),
        // buffer(),
        map(_ => this.getVisibleRange(this.scroller.vpImmediate)),
        withPrevious(this._reset),
        switchMap(skipWhenRangeIsEq),
        shareReplay(1)
    )


    public constructor(public readonly scroller: ScrollerService) {
        super()
        this.destruct
            .subscription(merge(scroller.vpRender.scroll, scroller.vpImmediate.change))
            .pipe(startWith(null))
            .subscribe(this._update)
    }

    public update() {
        this._update.next(undefined)
    }

    protected pause() {
        this.isPaused += 1
    }

    protected resume() {
        this.isPaused = Math.max(0, this.isPaused - 1)
        this._update.next(undefined)
    }

    public abstract getItemRect(idx: number): RectProps
    public abstract onItemUpdate(index: number, view: EmbeddedViewRef<VirtualForContext<any>>): void
    public abstract onItemRemove(index: number, view: EmbeddedViewRef<VirtualForContext<any>>): void
    public abstract onBeforeRender(range: NzRange): void
    public abstract onRender(range: NzRange): void
    public abstract getVisibleRange(viewport: Viewport): NzRange
    public abstract reset(): void
}


@Injectable()
export class VisibleRange_FixedHeight extends VirtualForVisibleRange {
    public set itemHeight(val: number) {
        if (this._itemHeight !== val) {
            this._itemHeight = val
            this._update.next(undefined)
        }
    }
    public get itemHeight(): number { return this._itemHeight }
    private _itemHeight: number

    public set itemsPerRow(val: number) {
        if (this._itemsPerRow !== val) {
            this._itemsPerRow = val
            this._update.next(undefined)
        }
    }
    public get itemsPerRow(): number { return this._itemsPerRow }
    private _itemsPerRow: number = 1

    public get extraCount() { return this.itemsPerRow * Math.ceil(10 / this.itemsPerRow) }

    public getItemRect(index: number) {
        return new Rect(0, this._itemHeight * Math.floor(index / this._itemsPerRow), this.scroller.vpImmediate.scrollWidth, this._itemHeight)
    }

    public onItemUpdate(index: number, view: EmbeddedViewRef<VirtualForContext<any>>): void {
    }

    public onItemRemove(index: number, view: EmbeddedViewRef<VirtualForContext<any>>): void {
    }

    public onBeforeRender(range: NzRange): void {
    }

    public onRender(range: NzRange): void {
    }

    public getVisibleRange(viewport: Viewport): NzRange {
        let begin: number = Math.floor(viewport.visible.top / this._itemHeight) * this._itemsPerRow
        let end: number = begin + Math.ceil(viewport.visible.height / this._itemHeight) * this._itemsPerRow - 1
        return new NzRange(begin, end)
    }

    public reset(): void {
        this._reset.next(undefined)
    }
}


@Injectable()
export abstract class VisibleRange_Layout {
    public abstract updateRects(rects: RectProps[], from: number): void
    public abstract getElRect(el: HTMLElement, prevElRect: RectProps, width: number, height: number, vtop: number, vleft: number): RectProps

    protected _rectLike(x: number, y: number, w: number, h: number): RectProps {
        return {
            width: w,
            height: h,
            x: x,
            y: y,
            left: x,
            top: y,
            right: x + w,
            bottom: y + h,
        }
    }
}


@Injectable()
export class VisibleRange_Layout_Column extends VisibleRange_Layout {
    public updateRects(rects: RectProps[], from: number) {
        const prev = rects[from - 1]
        let top = prev ? prev.bottom : 0

        for (let i = from; i < rects.length; i++) {
            const rect = rects[i]
            if (rect) {
                rect.top = rect.y = top
                rect.bottom = top + rect.height
                top = rect.bottom
            }
        }
    }

    public getElRect(el: HTMLElement, prevElRect: RectProps, width: number, height: number, vtop: number, vleft: number): RectProps {
        const marginTop = parseInt(el.style.marginTop, 10) || 0
        const marginBottom = parseInt(el.style.marginBottom, 10) || 0
        return this._rectLike(0, prevElRect ? prevElRect.top + prevElRect.height : 0, width, height + marginTop + marginBottom)
    }
}


@Injectable()
export class VisibleRange_Layout_Grid extends VisibleRange_Layout {
    public updateRects(rects: RectProps[], from: number) {
        const prev = rects[from - 1]
        let prevX = prev ? prev.x : 0
        let prevY = prev ? prev.y : 0
        let top = prev ? prev.top : 0
        let maxRowHeight = prev ? prev.height : 0

        for (let i = from; i < rects.length; i++) {
            const rect = rects[i]
            if (rect) {
                let rectX = rect.x
                let rectY = rect.y

                // same row, maybe?
                if (prevY === rect.y && prevX !== rect.x) {
                    rect.top = rect.y = top
                    rect.bottom = top + rect.height
                    maxRowHeight = Math.max(maxRowHeight, rect.height)
                } else {
                    top = prevY + maxRowHeight
                    rect.top = rect.y = top
                    rect.bottom = top + rect.height
                }

                prevX = rectX
                prevY = rectY
            }
        }
    }

    public getElRect(el: HTMLElement, prevElRect: RectProps, width: number, height: number, vtop: number, vleft: number): RectProps {
        const marginTop = parseInt(el.style.marginTop, 10) || 0
        const marginBottom = parseInt(el.style.marginBottom, 10) || 0
        return this._rectLike(el.offsetLeft + vleft, el.offsetTop + vtop, width, height + marginTop + marginBottom)
    }
}


@Injectable()
export class VisibleRange_VaryHeight_Intersection extends VirtualForVisibleRange {
    public set extraHeight(val: number) {
        if (this._extraHeight !== val) {
            this._extraHeight = val
            this._updateVirtualScroll()
        }
    }
    public get extraHeight(): number { return this._extraHeight }
    private _extraHeight: number = 0


    protected readonly rendered = new ItemIndexes()
    protected readonly elements: Map<Element, number> = new Map()
    protected readonly rects: RectProps[] = []
    protected minHeight: number = 0

    protected readonly resize = _ResizeObserver ? new _ResizeObserver(this._onResize.bind(this)) : null
    protected readonly intersection = new _IntersectionObserver(this._onIntersection.bind(this), {
        root: this.scrollable.el.nativeElement.parentElement,
        threshold: 0
    })

    public get extraCount() { return 10 }

    public constructor(
        scroller: ScrollerService,
        protected readonly scrollable: ScrollableDirective,
        protected readonly layout: VisibleRange_Layout) {
        super(scroller)
    }

    public getItemRect(index: number) {
        return this.rects[index]
    }

    public onItemUpdate(index: number, view: EmbeddedViewRef<VirtualForContext<any>>): void {
        this.rendered.add(index)
        const el = getViewEl(view)
        if (el) {
            if (!this.elements.has(el)) {
                this.elements.set(el, index)
                this.intersection.observe(el)
                this.resize?.observe(el)
            } else {
                this.elements.set(el, index)
            }
        }
    }

    public onItemRemove(index: number, view: EmbeddedViewRef<VirtualForContext<any>>): void {
        this.rendered.del(index)
        const el = getViewEl(view)

        if (this.elements.has(el)) {
            this.elements.delete(el)
            this.intersection.unobserve(el)
            this.resize?.unobserve(el)
        }
    }

    public onBeforeRender(range: NzRange): void {
        this.pause()
    }

    public onRender(range: NzRange): void {
        this.resume()
        // console.log("onRender", JSON.parse(JSON.stringify(this.rects)))
    }

    public getVisibleRange(viewport: Viewport): NzRange {
        let begin = -1
        let end = -1
        const visibleRect = viewport.visible
        const vrTop = visibleRect.top
        const vrBottom = visibleRect.bottom

        let debug: any = []

        for (let i = 0, l = this.rects.length; i < l; i++) {
            const rect = this.rects[i]
            debug.push({ index: i, top: rect?.top, bottom: rect?.bottom, vrTop, vrBottom })
            if (rect && rect.top <= vrBottom && rect.bottom >= vrTop) {
                if (begin === -1) {
                    begin = end = i
                } else {
                    end = i
                }
            } else if (begin !== -1) {
                // console.log(this.rendered.min, this.rendered.max, debug)
                return new NzRange(begin, end)
            }
        }

        return new NzRange(begin, end)
    }

    public reset(): void {
        this.rects.length = 0
        this.minHeight = 0
        this.isPaused = 0
        this.rendered.reset()
        this._updateVirtualScroll()
        this._reset.next(undefined)
    }

    protected _onResize(entries: any[]) {
        let minIndex = Infinity

        for (const entry of entries) {
            if (this.elements.has(entry.target) && document.contains(entry.target)) {
                const elIdx = this.elements.get(entry.target)
                minIndex = Math.min(minIndex, elIdx)
                if (entry.borderBoxSize && entry.borderBoxSize.length > 0) {
                    const box = entry.borderBoxSize[0]
                    this._cacheRect(entry.target, elIdx, box.inlineSize, box.blockSize)
                } else {
                    this._cacheRect(entry.target, elIdx, entry.target.offsetWidth, entry.target.offsetHeight)
                }
            }
        }

        // if (changed) {
        this.layout.updateRects(this.rects, minIndex)
        this._updateVirtualScroll()
        this.update()
        // }
    }

    protected _onIntersection(entries: IntersectionObserverEntry[]) {
        let minIndex = Infinity

        for (const entry of entries) {
            if (this.elements.has(entry.target as any)) {
                const elIdx = this.elements.get(entry.target as any)
                minIndex = Math.min(minIndex, elIdx)
                // if (!entry.isIntersecting) {
                //     this.visible.del(elIdx)
                // } else {
                //     this.visible.add(elIdx)
                // }
                this._cacheRect(entry.target as any, elIdx, entry.boundingClientRect.width, entry.boundingClientRect.height)
            }
        }

        // if (changed) {
        this.layout.updateRects(this.rects, minIndex)
        this._updateVirtualScroll()
        this.update()
        // }
    }

    private _cacheRect(el: HTMLElement, index: number, width: number, height: number) {
        const prev = this.rects[index - 1]
        this.rects[index] = this.layout.getElRect(el, prev, width, height, this.scroller.vpImmediate.virtualOffsetTop || 0, this.scroller.vpImmediate.virtualOffsetLeft || 0)
    }

    protected _updateVirtualScroll() {
        let paddingTop: number = 0
        let minHeight: number = 0

        if (this.rendered.min != null) {
            const rect = this.rects[this.rendered.min]
            if (rect) {
                paddingTop = rect.top
            }
        }

        if (this.rendered.max != null) {
            const rect = this.rects[this.rendered.max]
            if (rect) {
                minHeight = rect.bottom + this.extraHeight
                minHeight = this.minHeight = Math.max(this.minHeight, minHeight)
            }
        }

        this.scrollable.scroller.service.vpImmediate.update({
            virtualHeight: minHeight,
            virtualOffsetTop: paddingTop
        })
    }
}



@Directive()
export abstract class DirectiveBase implements OnDestroy {
    public constructor(@Inject(VirtualForVisibleRange) public readonly strategy: VirtualForVisibleRange) {
    }

    public ngOnDestroy() {
        this.strategy.ngOnDestroy()
    }
}


@Directive({
    selector: "[nzVirtualFor][fixedItemHeight]",
    providers: [
        {
            provide: VirtualForVisibleRange,
            deps: [ScrollerService],
            useFactory: function (scroller: ScrollerService) {
                return new VisibleRange_FixedHeight(scroller)
            }
        }
    ]
})
export class VF_FixedItemHeight extends DirectiveBase {
    @Input()
    public set fixedItemHeight(val: number) { (this.strategy as VisibleRange_FixedHeight).itemHeight = val }
    public get fixedItemHeight(): number { return (this.strategy as VisibleRange_FixedHeight).itemHeight }

    @Input()
    public set itemsPerRow(val: number) { (this.strategy as VisibleRange_FixedHeight).itemsPerRow = val }
    public get itemsPerRow(): number { return (this.strategy as VisibleRange_FixedHeight).itemsPerRow }
}


@Directive({
    selector: "[nzVirtualFor]:not([fixedItemHeight])",
    providers: [
        {
            provide: VirtualForVisibleRange,
            deps: [ScrollerService, ScrollableDirective, VisibleRange_Layout],
            useFactory: function (scroller: ScrollerService, scrollable: ScrollableDirective, layout: VisibleRange_Layout) {
                return new VisibleRange_VaryHeight_Intersection(scroller, scrollable, layout)
            }
        }
    ]
})
export class VF_VaryingItemHeight extends DirectiveBase {
    @Input()
    public set extraHeight(val: number) { (this.strategy as VisibleRange_VaryHeight_Intersection).extraHeight = val }
    public get extraHeight(): number { return (this.strategy as VisibleRange_VaryHeight_Intersection).extraHeight }
}


@Directive({
    selector: "[nzVirtualFor]:not([layout])",
    providers: [{ provide: VisibleRange_Layout, useClass: VisibleRange_Layout_Column }]
})
export class VF_Layout_Column { }


@Directive({
    selector: "[nzVirtualFor][layout='grid']",
    providers: [{ provide: VisibleRange_Layout, useClass: VisibleRange_Layout_Grid }]
})
export class VF_Layout_Grid { }


function getViewEl(view: EmbeddedViewRef<VirtualForContext<any>>): HTMLElement | null {
    for (const el of view.rootNodes) {
        // Node.ELEMENT_NODE
        if ((el as HTMLElement).nodeType === 1) {
            return el
        }
    }
    return null
}

/*

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

*/
