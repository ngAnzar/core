import { Directive, forwardRef, Inject, Input, ViewContainerRef, EmbeddedViewRef, OnDestroy, NgZone } from "@angular/core"
import { Subject } from "rxjs"

import { ScrollerService, Viewport } from "./scroller/scroller.service"
import { ScrollableDirective } from "./scroller/scrollable.directive"
import { NzRange, __zone_symbol__ } from "../util"
import { Rect } from "../layout.module"
import { VirtualForContext } from "./virtual-for.directive"


const SET_TIMEOUT: "setTimeout" = __zone_symbol__("setTimeout")


export abstract class VirtualForVisibleItems {
    public readonly changes = new Subject()

    public abstract getVisibleRange(viewport: Viewport): NzRange
    public abstract clearCache(): void
    public abstract cacheItemRect(view: EmbeddedViewRef<VirtualForContext<any>>): void
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

    public constructor() {
        super()
    }

    public getVisibleRange(viewport: Viewport): NzRange {
        let begin: number = Math.floor(viewport.visible.top / this._fixedItemHeight)
        let end: number = begin + Math.ceil(viewport.visible.height / this._fixedItemHeight)
        return new NzRange(begin, end)
    }

    public clearCache(): void {

    }

    public cacheItemRect(view: EmbeddedViewRef<VirtualForContext<any>>): void {

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


const ResizeObserver: any = (window as any).ResizeObserver


@Directive({
    selector: "[nzVirtualFor]:not([fixedItemHeight])",
    providers: [
        { provide: VirtualForVisibleItems, useExisting: forwardRef(() => VirtualForVaryingItemsRO) }
    ]
})
class VirtualForVaryingItemsRO extends VirtualForVisibleItems implements OnDestroy {
    @Input()
    public extraHeight: number = 0

    private rects: Rect[] = []
    private els: Map<HTMLElement, number> = new Map()
    private observer: any
    private minVisibleIdx: number
    private paddingTop: number = 0
    private minHeight: number = 0

    public constructor(
        @Inject(ScrollableDirective) private readonly scrollable: ScrollableDirective,
        @Inject(ViewContainerRef) private readonly vcr: ViewContainerRef,
        @Inject(NgZone) zone: NgZone) {
        super()

        zone.runOutsideAngular(() => {
            this.observer = new ResizeObserver(this._onDimChange.bind(this))
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

    public clearCache(): void {
        this.rects.length = 0
    }

    public cacheItemRect(view: EmbeddedViewRef<VirtualForContext<any>>) {
    }

    public onRender(range: NzRange): void {
        let minVisibleIdx = -1
        for (let i = 0, l = this.vcr.length; i < l; i++) {
            const view = this.vcr.get(i) as EmbeddedViewRef<VirtualForContext<any>>
            const idx = view.context ? view.context.index : -1
            const el = getViewEl(view)
            if (idx !== -1) {
                if (minVisibleIdx === -1) {
                    minVisibleIdx = idx
                } else {
                    minVisibleIdx = Math.min(minVisibleIdx, idx)
                }
                if (!this.els.has(el)) {
                    this.els.set(el, idx)
                    this.observer.observe(el)
                } else {
                    this.els.set(el, idx)
                }
            } else if (el) {
                this.els.delete(el)
            }
        }

        this.minVisibleIdx = minVisibleIdx
    }

    public ngOnDestroy() {
        this.observer.disconnect()
    }

    private _lastMinHeight: any
    private _onDimChange(entries: any) {
        for (const entry of entries) {
            const el = entry.target as HTMLElement
            const width = entry.contentRect.width
            const height = entry.contentRect.height
            const idx = this.els.get(el)
            if (idx >= 0 && width && height) {
                const marginTop = parseInt(el.style.marginTop, 10) || 0
                const marginBottom = parseInt(el.style.marginBottom, 10) || 0
                this.rects[idx] = new Rect(0, 0, width, height + marginTop + marginBottom)
            }
        }

        let top = 0
        for (let i = 0, l = this.rects.length; i < l; i++) {
            const rect = this.rects[i]
            if (rect) {
                rect.top = top
                top += rect.height
            }
        }

        window[SET_TIMEOUT](() => {
            const lastRect = this.rects[this.rects.length - 1]
            if (lastRect) {
                this._updatePaddingTop()

                let minHeight = (lastRect ? lastRect.bottom : 0) + this.extraHeight + this.paddingTop
                if (this.minHeight !== minHeight) {
                    const containerEl = this.scrollable.el.nativeElement
                    this.minHeight = minHeight
                    containerEl.style.minHeight = `${minHeight}px`
                }
            }
        }, 1)
    }

    private _updatePaddingTop() {
        if (this.minVisibleIdx !== -1) {
            let begin = this.rects[this.minVisibleIdx]
            if (begin) {
                if (this.paddingTop !== begin.top) {
                    const containerEl = this.scrollable.el.nativeElement
                    this.paddingTop = begin.top
                    containerEl.style.paddingTop = `${begin.top}px`
                }
            }
        }
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

export const VirtualForVaryingItems = ResizeObserver ? VirtualForVaryingItemsRO : VirtualForVaryingItemsPlain
