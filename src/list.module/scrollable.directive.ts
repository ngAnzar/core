import { Directive, Inject, ElementRef, Input, EventEmitter, OnInit, OnDestroy, NgZone, ChangeDetectionStrategy, HostBinding } from "@angular/core"
import { coerceBooleanProperty } from "@angular/cdk/coercion"
import { Observable, fromEvent, merge } from "rxjs"
import { filter } from "rxjs/operators"

import PerfectScrollbar from "perfect-scrollbar"
import "perfect-scrollbar/css/perfect-scrollbar.css"

import { Destruct } from "../util"


export type ScrollOrient = "horizontal" | "vertical"


export interface Viewport {
    top: number
    left: number
    right: number
    bottom: number
    width: number
    height: number
}


@Directive({
    selector: "[nzScrollable]",
    host: {
        // TODO: remove
        "[style.position]": "'relative'",
        "[style.boxSizing]": "'border-box'",
    }
})
export class ScrollableDirective implements OnInit, OnDestroy {
    @Input("nzScrollable")
    public set orient(val: ScrollOrient) { this._orient = val }
    public get orient(): ScrollOrient { return this._orient }
    protected _orient: ScrollOrient = "vertical"

    @Input()
    public set wheelSpeed(val: number) {
        val = parseInt(`${val}`, 10)
        if (this._wheelSpeed !== val) {
            this._wheelSpeed = val
            this._emitOptionsChange({ wheelSpeed: val })
        }
    }
    public get wheelSpeed(): number { return this._wheelSpeed }
    protected _wheelSpeed: number = 2

    @Input()
    public set wheelPropagation(val: boolean) {
        val = coerceBooleanProperty(val)
        if (this._wheelPropagation !== val) {
            this._wheelPropagation = val
            this._emitOptionsChange({ wheelPropagation: val })
        }
    }
    public get wheelPropagation(): boolean { return this._wheelPropagation }
    protected _wheelPropagation: boolean = false

    // @Input("suppress-scroll-x")
    // public set suppressScrollX(val: boolean) {
    //     val = coerceBooleanProperty(val)
    //     if (this._suppressScrollX !== val) {
    //         this._suppressScrollX = val
    //         this._emitOptionsChange({ suppressScrollX: val })
    //     }
    // }
    // public get suppressScrollX(): boolean { return this._suppressScrollX }
    // protected _suppressScrollX: boolean = false

    // @Input("suppress-scroll-y")
    // public set suppressScrollY(val: boolean) {
    //     val = coerceBooleanProperty(val)
    //     if (this._suppressScrollY !== val) {
    //         this._suppressScrollY = val
    //         this._emitOptionsChange({ suppressScrollY: val })
    //     }
    // }
    // public get suppressScrollY(): boolean { return this._suppressScrollY }
    // protected _suppressScrollY: boolean = false

    @Input()
    public set reversed(val: boolean) { this._reversed = coerceBooleanProperty(val) }
    public get reversed(): boolean { return this._reversed }
    protected _reversed: boolean = false


    public get overflowX(): number { return Math.max(0, this.el.nativeElement.scrollWidth - this.el.nativeElement.offsetWidth) }
    public get overflowY(): number { return Math.max(0, this.el.nativeElement.scrollHeight - this.el.nativeElement.offsetHeight) }
    public get overflowPrimary(): number { return this.orient === "horizontal" ? this.overflowX : this.overflowY }
    public get overflowSecondary(): number { return this.orient === "horizontal" ? this.overflowY : this.overflowX }

    public set primaryScroll(value: number) {
        if (this.orient === "horizontal") {
            this.el.nativeElement.scrollLeft = value
        } else {
            this.el.nativeElement.scrollTop = value
        }
    }

    public get primaryScroll(): number {
        return this.orient === "horizontal" ? this.el.nativeElement.scrollLeft : this.el.nativeElement.scrollTop
    }

    public get viewport(): Viewport {
        return {
            width: this.el.nativeElement.offsetWidth,
            height: this.el.nativeElement.offsetHeight,
            left: this.el.nativeElement.scrollLeft,
            top: this.el.nativeElement.scrollTop,
            right: this.el.nativeElement.offsetWidth + this.el.nativeElement.scrollLeft,
            bottom: this.el.nativeElement.offsetHeight + this.el.nativeElement.scrollTop
        }
    }

    @HostBinding("style.overflowX")
    public get overflowXStyle(): string { return this.orient === "horizontal" ? "auto" : "hidden" }

    @HostBinding("style.overflowY")
    public get overflowYStyle(): string { return this.orient === "vertical" ? "auto" : "hidden" }

    public readonly optionsChanged: Observable<PerfectScrollbar.Options> = new EventEmitter()
    public readonly primaryScrolling: Observable<Event>

    protected perfectScrollbar: PerfectScrollbar
    public readonly destruct = new Destruct()

    public constructor(@Inject(ElementRef) protected el: ElementRef<HTMLElement>,
        @Inject(NgZone) protected ngZone: NgZone) {
        // this.subscriptions.add(this.optionsChanged).pipe(debounce(_ => timer(10))).subscribe(() => {
        //     if (this.perfectScrollbar) {
        //         this.perfectScrollbar.update()
        //     }
        // })
    }

    public elementIsVisible(vp: Viewport, el: HTMLElement): boolean {
        let rect = this._getItemRect(el)
        return !(vp.left > rect.right || vp.right < rect.left || vp.top > rect.bottom || vp.bottom < rect.top)
    }

    public ngOnInit() {
        // this.perfectScrollbar = new PerfectScrollbar(this.el.nativeElement, {
        //     wheelSpeed: this.wheelSpeed,
        //     wheelPropagation: this.wheelPropagation,
        //     minScrollbarLength: 50
        // })

        // this.ngZone.runOutsideAngular(() => {
        //     (this as any).primaryScrolling =
        //         merge(fromEvent(this.el.nativeElement, "ps-scroll-y"), fromEvent(this.el.nativeElement, "ps-scroll-x"))
        //             .pipe(filter(e => (this.orient === "horizontal" && e.type === "ps-scroll-x") ||
        //                 (this.orient === "vertical" && e.type === "ps-scroll-y")))
        // })

        this.ngZone.runOutsideAngular(() => {
            let element = this.el.nativeElement
            let lastLeft = element.scrollLeft;
            let lastTop = element.scrollTop;
            (this as any).primaryScrolling = fromEvent(element, "scroll").pipe(filter(event => {
                if (this.orient === "horizontal") {
                    if (lastLeft !== element.scrollLeft) {
                        return true
                    }
                } else if (this.orient === "vertical") {
                    if (lastTop !== element.scrollTop) {
                        return true
                    }
                }
                return false
            }))
        })
    }

    public ngOnDestroy() {
        // this.perfectScrollbar.destroy()
        delete this.perfectScrollbar
    }

    protected _emitOptionsChange(event: PerfectScrollbar.Options) {
        (this.optionsChanged as EventEmitter<PerfectScrollbar.Options>).emit(event)
    }

    protected _getItemRect(el: HTMLElement): { left: number, top: number, right: number, bottom: number } {
        let left = 0
        let top = 0
        let target = el

        while (target && target !== this.el.nativeElement) {
            left += target.offsetLeft
            top += target.offsetTop
            target = target.offsetParent as HTMLElement
        }

        return { left, top, right: left + el.offsetWidth, bottom: top + el.offsetHeight }
    }
}
