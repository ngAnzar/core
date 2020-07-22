import { Directive, forwardRef, Inject, Input, ViewContainerRef, EmbeddedViewRef, OnDestroy, NgZone, Injectable, FactoryProvider } from "@angular/core"
import { Subject } from "rxjs"

import { Viewport, ScrollerService } from "./scroller/scroller.service"
import { ScrollableDirective } from "./scroller/scrollable.directive"
import { NzRange, __zone_symbol__, Rect, RectProps } from "../util"
import { VirtualForContext } from "./virtual-for.directive"


const SET_TIMEOUT = __zone_symbol__("setTimeout")
const RAF = __zone_symbol__("requestAnimationFrame")
const RESIZE_OBSERVER = __zone_symbol__("ResizeObserver")
const INTERSECTION_OBSERVER = __zone_symbol__("IntersectionObserver")


export abstract class VirtualForVisibleItems {
    public readonly changes = new Subject()

    public abstract getVisibleRange(viewport: Viewport): NzRange
    public abstract clearCache(): void

    public abstract getItemRect(index: number): RectProps

    // public abstract cacheItemRect(view: EmbeddedViewRef<VirtualForContext<any>>): void

    public abstract onItemUpdate(index: number, view: EmbeddedViewRef<VirtualForContext<any>>): void
    public abstract onItemRemove(index: number, view: EmbeddedViewRef<VirtualForContext<any>>): void
    public abstract onRender(range: NzRange): void
}


@Directive({
    selector: "[nzVirtualFor][fixedItemHeight]",
    providers: [
        { provide: VirtualForVisibleItems, useExisting: forwardRef(() => VirtualForFixedItems) }
    ]
})
export class VirtualForFixedItems extends VirtualForVisibleItems {
    @Input()
    public set fixedItemHeight(val: number) {
        val = Number(val)
        if (this._fixedItemHeight !== val) {
            this._fixedItemHeight = val
            this.changes.next()
        }
    }
    public get fixedItemHeight(): number { return this._fixedItemHeight }
    private _fixedItemHeight: number

    public constructor(@Inject(ScrollableDirective) private readonly scrollable: ScrollableDirective,) {
        super()
    }

    public getVisibleRange(viewport: Viewport): NzRange {
        let begin: number = Math.floor(viewport.visible.top / this._fixedItemHeight)
        let end: number = begin + Math.ceil(viewport.visible.height / this._fixedItemHeight)
        return new NzRange(begin, end)
    }

    public clearCache(): void {

    }

    public getItemRect(index: number) {
        return new Rect(0, this._fixedItemHeight * index, this.scrollable.el.nativeElement.offsetWidth, this._fixedItemHeight)
    }

    // public cacheItemRect(view: EmbeddedViewRef<VirtualForContext<any>>): void {

    // }

    public onItemUpdate(index: number, view: EmbeddedViewRef<VirtualForContext<any>>): void {

    }

    public onItemRemove(index: number, view: EmbeddedViewRef<VirtualForContext<any>>): void {

    }

    public onRender(range: NzRange): void {

    }
}



@Directive({
    selector: "[nzVirtualFor]:not([fixedItemHeight])",
    providers: [
        { provide: VirtualForVisibleItems, useExisting: forwardRef(() => VirtualForVaryingItemsPlain) }
    ]
})
class VirtualForVaryingItemsPlain extends VirtualForVisibleItems {
    private _cache: Rect[] = []
    private _minHeight: number = 0

    @Input()
    public extraHeight: number = 0

    public constructor(
        @Inject(ScrollableDirective) private readonly scrollable: ScrollableDirective,
        @Inject(ViewContainerRef) private readonly vcr: ViewContainerRef) {
        super()
    }

    public getVisibleRange(viewport: Viewport): NzRange {
        let begin: number = -1
        let end: number = -1
        let rendered = this._renderedSize()

        let range = this._getVisibleRangeFormCache(viewport, rendered.begin)
        if (!range && rendered.begin !== 0) {
            range = this._getVisibleRangeFormCache(viewport, 0)
        }

        if (range) {
            return range
        } else {
            return new NzRange(begin, end)
        }
    }

    public cacheItemRect(view: EmbeddedViewRef<VirtualForContext<any>>) {
        let idx = view.context ? view.context.index : -1
        if (idx !== -1) {
            let el = getViewEl(view)
            if (el) {
                const rect = this.scrollable.getElementRect(el)
                const marginBottom = parseInt(el.style.marginBottom, 10) || 0
                const marginTop = parseInt(el.style.marginTop, 10) || 0
                rect.height = rect.height + marginTop + marginBottom
                return this._cache[idx] = rect
            } else {
                this._cache[idx] = null
            }
        }
        return null
    }

    public getItemRect(index: number) {
        return this._cache[index]
    }

    public onItemUpdate(index: number, view: EmbeddedViewRef<VirtualForContext<any>>): void {
        this.cacheItemRect(view)
    }

    public onItemRemove(index: number, view: EmbeddedViewRef<VirtualForContext<any>>): void {
        this.cacheItemRect(view)
    }

    public onRender(range: NzRange): void {
        const rendered = this._renderedSize()
        const topPadding = this._calcTopPadding(rendered.begin)

        this._minHeight = Math.max(this._minHeight, rendered.size + topPadding + this.extraHeight)
        // this._minHeight = rendered.size + topPadding + this.extraHeight

        let containerEl = this.scrollable.el.nativeElement
        containerEl.style.paddingTop = `${topPadding}px`
        containerEl.style.minHeight = `${this._minHeight}px`
    }

    public clearCache(): void {
        this._cache.length = 0
        this._minHeight = 0
    }

    private _getVisibleRangeFormCache(viewport: Viewport, startFrom: number) {
        let begin: number = -1
        let end: number = -1
        let visibleRect = viewport.visible

        for (const items = this._cache, l = items.length; startFrom < l; startFrom++) {
            const item = items[startFrom]

            if (item) {
                if (visibleRect.isIntersect(item)) {
                    if (begin === -1) {
                        begin = startFrom
                    }
                    end = startFrom
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

    private _calcTopPadding(firstRenderedIndex: number) {
        let size = 0
        for (let i = 0, l = firstRenderedIndex; i < l; i++) {
            let rect = this._cache[i]
            if (rect) {
                size += rect.height
            }
        }
        return size
    }

    private _renderedSize(): { begin: number, size: number } {
        let size = 0
        let begin: number = Infinity

        for (let i = 0, l = this.vcr.length; i < l; i++) {
            let v = this.vcr.get(i) as EmbeddedViewRef<VirtualForContext<any>>
            if (v && v.context && v.context.index !== -1) {
                let rect = this.cacheItemRect(v)
                if (rect) {
                    size += rect.height
                    begin = Math.min(begin, v.context.index)
                }
            }
        }

        if (!isFinite(begin)) {
            begin = 0
        }

        return { begin, size }
    }
}


// const ResizeObserver: any = (window as any).ResizeObserver

@Directive({
    selector: "[nzVirtualFor]:not([fixedItemHeight])",
    providers: [
        { provide: VirtualForVisibleItems, useExisting: forwardRef(() => VirtualForVaryingItems) }
    ]
})
export class VirtualForVaryingItems extends VirtualForVisibleItems implements OnDestroy {
    @Input()
    public extraHeight: number = 0

    private rects: RectProps[] = []
    private els: Map<HTMLElement, number> = new Map()
    private observer: any
    private minVisibleIdx: number = 0
    private paddingTop: number = 0
    private minHeight: number = 0

    public constructor(
        @Inject(ScrollableDirective) private readonly scrollable: ScrollableDirective,
        @Inject(ViewContainerRef) private readonly vcr: ViewContainerRef,
        @Inject(NgZone) zone: NgZone) {
        super()

        zone.runOutsideAngular(() => {
            this.observer = new (window as any)[RESIZE_OBSERVER](this._onDimChange.bind(this))
        })
    }

    public getVisibleRange(viewport: Viewport): NzRange {
        let begin = -1
        let end = -1
        // const visibleRect = viewport.visible.copy()
        // visibleRect.top -= this.paddingTop
        const visibleRect = viewport.visible

        for (let i = 0, l = this.rects.length; i < l; i++) {
            const rect = this.rects[i]
            if (rect && visibleRect.isIntersect(rect)) {
                if (begin === -1) {
                    begin = end = i
                } else {
                    end = i
                }
            } else if (begin !== -1) {
                return new NzRange(begin, end)
            }
        }

        return new NzRange(begin, end)
    }

    public getItemRect(index: number) {
        return this.rects[index]
    }

    public clearCache(): void {
        this.rects.length = 0
        this._updateVirtualScroll(0, 0)
        // this._setPaddingTop(0)
        // this._setMinHeight(0)
    }

    public onItemUpdate(index: number, view: EmbeddedViewRef<VirtualForContext<any>>): void {
        const el = getViewEl(view)
        this._watch(el, index)
    }

    public onItemRemove(index: number, view: EmbeddedViewRef<VirtualForContext<any>>): void {
        const el = getViewEl(view)
        this._unwatch(el, index)
        this._updateContainer()
    }

    public onRender(range: NzRange): void {
        let minIndex = -1
        for (const [el, index] of this.els.entries()) {
            if (minIndex === -1) {
                minIndex = index
            } else {
                minIndex = Math.min(minIndex, index)
            }
            this._cacheRect(el, index)
        }
        this.minVisibleIdx = minIndex
        this._updateContainer()
    }

    private _watch(el: HTMLElement, index: number) {
        if (el) {
            if (!this.els.has(el)) {
                this.els.set(el, index)
                this.observer.observe(el)
            } else {
                this.els.set(el, index)
            }
            // this._cacheRect(el, index)
        }
    }

    private _unwatch(el: HTMLElement, index: number) {
        if (this.els.has(el)) {
            this.els.delete(el)
            this.observer.unobserve(el)
            this.rects.length >= index && this._cacheRect(el, index)
        }
    }

    private _cacheRect(el: HTMLElement, index: number, contentRect: ClientRect = null): RectProps {
        if (!contentRect) {
            contentRect = el.getBoundingClientRect()
        } else {
        }

        const width = contentRect.width
        const height = contentRect.height
        const prev = this.rects[index - 1]
        const top = prev ? prev.bottom : 0
        if (width && height) {
            const marginTop = parseInt(el.style.marginTop, 10) || 0
            const marginBottom = parseInt(el.style.marginBottom, 10) || 0
            return this.rects[index] = this._rectLike(0, top, width, height + marginTop + marginBottom)
        } else {
            return this.rects[index] = this._rectLike(0, top, 0, 0)
        }
    }

    private _rectLike(x: number, y: number, w: number, h: number): RectProps {
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

    public ngOnDestroy() {
        this.observer.disconnect()
    }

    private _lastMinHeight: any
    private _onDimChange(entries: any) {
        let minIndex = this.rects.length
        for (const entry of entries) {
            const el = entry.target
            const idx = this.els.get(el)
            if (idx >= 0) {
                minIndex = Math.max(minIndex, idx)
                this._cacheRect(entry.target, idx, entry.contentRect)
            }
        }

        let rect = this.rects[minIndex - 1]
        let top = rect ? rect.bottom : 0
        for (let idx = minIndex; idx < this.rects.length; idx++) {
            let rect = this.rects[idx]
            if (rect) {
                rect.top = top
            }
            top = rect.bottom
        }

        // window[SET_TIMEOUT](this._updateContainer, 1)
        this._updateContainer()
    }

    private _updateContainer = () => {
        if (this.minVisibleIdx !== -1) {
            let paddingTop: number
            let minHeight: number

            const firstRect = this.rects[this.minVisibleIdx]
            if (firstRect) {
                paddingTop = firstRect.top
            }

            const lastRect = this.rects[this.rects.length - 1]
            if (lastRect) {
                minHeight = lastRect.bottom + this.extraHeight
            }

            this._updateVirtualScroll(paddingTop, minHeight)
        }
    }

    private _updateVirtualScroll(paddingTop: number, minHeight: number) {
        let params: any = {}
        if (paddingTop != null) {
            params.virtualOffsetTop = paddingTop
        }
        if (minHeight != null) {
            params.virtualHeight = minHeight
        }
        // console.log(params)
        this.scrollable.scroller.service.vpImmediate.update(params)
    }

    // private _setPaddingTop(val: number) {
    //     this.scrollable.scroller.service.vpImmediate.update({
    //         virtualOffsetTop: val
    //     })
    //     // if (this.paddingTop !== val) {
    //     //     this.paddingTop = val
    //     //     this.scrollable.el.nativeElement.style.paddingTop = `${val}px`
    //     // }
    // }

    // private _setMinHeight(val: number) {
    //     this.scrollable.scroller.service.vpImmediate.update({
    //         virtualHeight: val
    //     })
    //     // val = Math.max(val, this.minHeight)
    //     // if (this.minHeight !== val) {
    //     //     this.minHeight = val
    //     //     this.scrollable.el.nativeElement.style.minHeight = `${val}px`
    //     // }
    // }
}


class ItemIndexes {
    public readonly items: Set<number> = new Set()
    public readonly min: number
    public readonly max: number

    public constructor() {

    }

    public add(value: number) {
        this.items.add(value)
        this._updateMinMax()
    }

    public del(value: number) {
        this.items.delete(value)
        this._updateMinMax()
    }

    public reset() {
        this.items.clear();
        (this as { min: number }).min = null;
        (this as { max: number }).max = null
    }

    private _updateMinMax() {
        let min = null
        let max = null

        for (const value of this.items) {
            if (min === null) {
                min = max = value
            } else {
                min = Math.min(min, value)
                max = Math.max(max, value)
            }
        }

        (this as { min: number }).min = min;
        (this as { max: number }).max = max
    }
}


@Directive({
    selector: "[nzVirtualFor]:not([fixedItemHeight])",
    providers: [
        { provide: VirtualForVisibleItems, useExisting: forwardRef(() => VirtualForVaryingItemsIntersection) }
    ]
})
export class VirtualForVaryingItemsIntersection extends VirtualForVisibleItems implements OnDestroy {
    @Input()
    public extraHeight: number = 0

    private readonly intersection: IntersectionObserver
    private readonly resize: any
    private readonly els: Map<HTMLElement, number> = new Map()
    private readonly rects: RectProps[] = []
    private readonly visible: ItemIndexes = new ItemIndexes()
    private readonly rendered: ItemIndexes = new ItemIndexes()
    private minHeight: number = 0
    private visibleRange: NzRange = new NzRange(-1, -1)
    private pendingVisibleRange: NzRange

    public constructor(
        @Inject(ScrollableDirective) private readonly scrollable: ScrollableDirective,
        @Inject(ViewContainerRef) private readonly vcr: ViewContainerRef,
        @Inject(NgZone) zone: NgZone) {
        super()

        this.intersection = new window[INTERSECTION_OBSERVER](this._onIntersection.bind(this), {
            root: scrollable.el.nativeElement.parentNode as any,
            threshold: 0
        })

        this.resize = new (window as any)[RESIZE_OBSERVER](this._onDimChange.bind(this))
    }

    // public getVisibleRange(viewport: Viewport): NzRange {
    //     return this.visibleRange
    // }

    public getVisibleRange(viewport: Viewport): NzRange {
        let begin = -1
        let end = -1
        // const visibleRect = viewport.visible.copy()
        // visibleRect.top -= this.paddingTop
        const visibleRect = viewport.visible


        for (let i = 0, l = this.rects.length; i < l; i++) {
            const rect = this.rects[i]
            if (rect && visibleRect.isIntersect(rect)) {
                if (begin === -1) {
                    begin = end = i
                } else {
                    end = i
                }
            } else if (begin !== -1) {
                return new NzRange(begin, end)
            }
        }

        return new NzRange(begin, end)
    }

    public clearCache(): void {
        this.rects.length = 0
        this.minHeight = 0
        this.visible.reset()
        this.rendered.reset()
    }

    public getItemRect(index: number): RectProps {
        return this.rects[index]
    }
    public onItemUpdate(index: number, view: EmbeddedViewRef<VirtualForContext<any>>): void {
        const el = getViewEl(view)
        this._watch(el, index)
    }

    public onItemRemove(index: number, view: EmbeddedViewRef<VirtualForContext<any>>): void {
        const el = getViewEl(view)
        this._unwatch(el, index)
        this._updateVirtualScroll()
    }

    public onRender(range: NzRange): void {
        // console.log("onRender")
        // if (this.pendingVisibleRange) {
        //     this.visibleRange = this.pendingVisibleRange
        //     delete this.pendingVisibleRange
        // }
        // throw new Error("Method not implemented.")
    }

    private _onIntersection(changes: IntersectionObserverEntry[]) {
        for (const change of changes) {
            // console.log(change.target, document.contains(change.target), change.isIntersecting)
            if (this.els.has(change.target as any)) {
                const elIdx = this.els.get(change.target as any)
                if (!change.isIntersecting) {
                    this.visible.del(elIdx)
                } else {
                    this.visible.add(elIdx)
                }
                this._cacheRect(change.target as any, elIdx, change.boundingClientRect)
            }
        }

        this.pendingVisibleRange = new NzRange(this.visible.min || -1, this.visible.max || -1)

        // console.log("_onIntersection", changes)
        // console.log(this.vis)
        // console.log(this.rects)

        // if (this.visibleIndexes.length) {
        //     let minIdx = this.visibleIndexes[0]
        //     let maxIdx = this.visibleIndexes[0]
        //     for (const i of this.visibleIndexes) {
        //         minIdx = Math.min(minIdx, i)
        //         maxIdx = Math.max(maxIdx, i)
        //     }

        //     let changed = this.minVisibleIndex !== minIdx || this.maxVisibleIndex !== maxIdx
        //     this.minVisibleIndex = minIdx
        //     this.maxVisibleIndex = maxIdx
        //     // changed && this.changes.next()
        // } else {
        //     this.minVisibleIndex = this.maxVisibleIndex = -1
        // }

        // let paddingTop = 0
        // for (let i = 0; i < this.minVisibleIndex; i++) {
        //     let rect = this.rects[i]
        //     if (rect) {
        //         paddingTop += rect.height
        //     }
        // }
        // // this._updateVirtualScroll()

        // console.log("visible", this.visible.min, this.visible.max)
    }

    private _onDimChange(entries: any[]) {
        for (const entry of entries) {
            if (this.els.has(entry.target) && document.contains(entry.target)) {
                const elIdx = this.els.get(entry.target)
                if (entry.borderBoxSize && entry.borderBoxSize.length > 0) {
                    const box = entry.borderBoxSize[0]
                    this._cacheRect(entry.target, elIdx, { width: box.inlineSize, height: box.blockSize })
                } else {
                    this._cacheRect(entry.target, elIdx, entry.contentRect)
                }
            }
        }

        this._updateVirtualScroll()
    }

    private _watch(el: HTMLElement, index: number) {
        this.rendered.add(index)
        if (el) {
            if (!this.els.has(el)) {
                this.els.set(el, index)
                this.intersection.observe(el)
                this.resize.observe(el)
            } else {
                this.els.set(el, index)
            }
        }
    }

    private _unwatch(el: HTMLElement, index: number) {
        this.rendered.del(index)
        if (this.els.has(el)) {
            this.els.delete(el)
            this.intersection.unobserve(el)
            this.resize.unobserve(el)
            this.rects.length >= index && this._cacheRect(el, index)
        }
    }

    private _cacheRect(el: HTMLElement, index: number, contentRect: { width: number, height: number } = null): RectProps {
        if (!contentRect) {
            contentRect = el.getBoundingClientRect()
        }

        const width = contentRect.width
        const height = contentRect.height
        const prev = this.rects[index - 1]
        const top = prev ? prev.bottom : 0
        if (width && height) {
            const marginTop = parseInt(el.style.marginTop, 10) || 0
            const marginBottom = parseInt(el.style.marginBottom, 10) || 0
            return this.rects[index] = this._rectLike(0, top, width, height + marginTop + marginBottom)
        } else {
            return this.rects[index] = this._rectLike(0, top, 0, 0)
        }
    }

    private _rectLike(x: number, y: number, w: number, h: number): RectProps {
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

    private _updateVirtualScroll() {
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

        // console.log("rendered", { minHeight }, this.rendered.min, this.rendered.max)

        this.scrollable.scroller.service.vpImmediate.update({
            virtualHeight: minHeight,
            virtualOffsetTop: paddingTop
        })
    }

    // private _setPaddingTop(val: number) {
    //     if (this.paddingTop !== val) {
    //         this.paddingTop = val
    //         this.scrollable.el.nativeElement.style.paddingTop = `${val}px`
    //     }
    // }

    // private _setMinHeight(val: number) {
    //     // val = Math.max(val, this.minHeight)
    //     if (this.minHeight !== val) {
    //         this.minHeight = val
    //         this.scrollable.el.nativeElement.style.minHeight = `${val}px`
    //     }
    // }

    public ngOnDestroy() {
        this.intersection.disconnect()
        this.resize.disconnect()
    }
}


function getViewEl(view: EmbeddedViewRef<VirtualForContext<any>>): HTMLElement | null {
    for (const el of view.rootNodes) {
        // Node.ELEMENT_NODE
        if ((el as HTMLElement).nodeType === 1) {
            return el
        }
    }
    return null
}

// TODO: try IntersectionObserver

// export const VirtualForVaryingItems = ResizeObserver ? VirtualForVaryingItemsRO : VirtualForVaryingItemsPlain

// TODO: refactor, AOT is not happy with above syntaxt
// export const VirtualForVaryingItems = VirtualForVaryingItemsRO
