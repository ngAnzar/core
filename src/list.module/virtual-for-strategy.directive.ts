import { Directive, forwardRef, Inject, Input, ViewContainerRef, EmbeddedViewRef } from "@angular/core"
import { Subject } from "rxjs"

import { ScrollerService } from "./scroller/scroller.service"
import { ScrollableDirective } from "./scroller/scrollable.directive"
import { NzRange } from "../util"
import { Rect } from "../layout.module"
import { VirtualForContext } from "./virtual-for.directive"


export abstract class VirtualForVisibleItems {
    public readonly changes = new Subject()

    public abstract getVisibleRange(): NzRange
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

    public constructor(@Inject(ScrollerService) private readonly scroller: ScrollerService) {
        super()
    }

    public getVisibleRange(): NzRange {
        const viewport = this.scroller.vpImmediate
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
        { provide: VirtualForVisibleItems, useExisting: forwardRef(() => VirtualForVaryingItems) }
    ]
})
export class VirtualForVaryingItems extends VirtualForVisibleItems {
    private _cache: Rect[] = []
    private _minHeight: number = 0

    public constructor(
        @Inject(ScrollerService) private readonly scroller: ScrollerService,
        @Inject(ScrollableDirective) private readonly scrollable: ScrollableDirective,
        @Inject(ViewContainerRef) private readonly vcr: ViewContainerRef) {
        super()
    }

    public getVisibleRange(): NzRange {
        let begin: number = -1
        let end: number = -1
        let rendered = this._renderedSize()

        let range = this._getVisibleRangeFormCache(rendered.begin)
        if (!range && rendered.begin !== 0) {
            range = this._getVisibleRangeFormCache(0)
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
                return this._cache[idx] = this.scrollable.getElementRect(el)
            } else {
                this._cache[idx] = null
            }
        }
        return null
    }

    public onRender(range: NzRange): void {
        const rendered = this._renderedSize()
        const topPadding = this._calcTopPadding(rendered.begin)

        this._minHeight = Math.max(this._minHeight, rendered.size + topPadding)

        let containerEl = this.scrollable.el.nativeElement
        containerEl.style.paddingTop = `${topPadding}px`
        containerEl.style.minHeight = `${this._minHeight}px`
    }

    public clearCache(): void {
        this._cache.length = 0
        this._minHeight = 0
    }

    private _getVisibleRangeFormCache(startFrom: number) {
        let begin: number = -1
        let end: number = -1
        let visibleRect = this.scroller.vpImmediate.visible

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


function getViewEl(view: EmbeddedViewRef<VirtualForContext<any>>): HTMLElement | null {
    for (const el of view.rootNodes) {
        // Node.ELEMENT_NODE
        if ((el as HTMLElement).nodeType === 1) {
            return el
        }
    }
    return null
}
