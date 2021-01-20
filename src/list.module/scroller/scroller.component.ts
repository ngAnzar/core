import { Component, Inject, ElementRef, HostListener, Input, OnInit, OnDestroy, HostBinding, Optional, SkipSelf, ChangeDetectionStrategy, NgZone } from "@angular/core"
import { coerceBooleanProperty } from "@angular/cdk/coercion"

import { RectMutationService, ExheaderComponent } from "../../layout.module"
import { NzTouchEvent } from "../../common.module"
import { ScrollerService, ScrollPosition, ScrollOrient } from "./scroller.service"


@Component({
    selector: ".nz-scroller",
    templateUrl: "./scroller.template.pug",
    providers: [
        ScrollerService
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScrollerComponent implements OnInit, OnDestroy {
    @Input()
    @HostBinding("attr.orient")
    public orient: ScrollOrient = "vertical"

    @Input()
    public set hideScrollbar(val: boolean) {
        val = coerceBooleanProperty(val)
        if (this._hideScrollbar !== val) {
            this._hideScrollbar = val
        }
    }
    public get hideScrollbar(): boolean { return this._hideScrollbar }
    private _hideScrollbar: boolean = false

    @Input() public scrollbarHService: ScrollerService
    @Input() public scrollbarVService: ScrollerService

    public constructor(
        @Inject(ElementRef) public readonly el: ElementRef<HTMLElement>,
        @Inject(NgZone) public readonly zone: NgZone,
        @Inject(ScrollerService) public readonly service: ScrollerService,
        @Inject(RectMutationService) rectMutation: RectMutationService,
        @Inject(ExheaderComponent) @Optional() private readonly exheader: ExheaderComponent,
        @Inject(ScrollerComponent) @Optional() @SkipSelf() public readonly parent: ScrollerComponent) {
        this.scrollbarHService = service
        this.scrollbarVService = service

        zone.runOutsideAngular(() => {
            this.service.destruct.subscription(rectMutation.watchDimension(this.el)).subscribe(dim => {
                this.service.vpImmediate.update(dim)
                if (document.activeElement && el.nativeElement.contains(document.activeElement)) {
                    service.scrollIntoViewport(document.activeElement)
                }
            })

            el.nativeElement.addEventListener("focus", this._focusHandler, true)
            el.nativeElement.addEventListener("wheel", this.onMouseScroll)
        })
    }

    public ngOnInit() {
        this.service.orient = this.orient

        if (this.parent) {
            if (this.parent.orient !== this.orient) {
                this.hideScrollbar = true

                if (this.orient === "horizontal") {
                    this.parent.scrollbarHService = this.service
                } else if (this.orient === "vertical") {
                    this.parent.scrollbarVService = this.service
                }
            }
        }
    }

    @HostListener("scroll")
    public onScroll() {
        this.el.nativeElement.scrollTo(0, 0)
    }

    public onMouseScroll = (event: WheelEvent) => {
        if (event.defaultPrevented) {
            return
        }
        if (this.orient === "horizontal" && !this.service.horizontalOverflow) {
            return
        }
        if (this.orient === "vertical" && !this.service.verticalOverflow) {
            return
        }
        if (!this.service.lockMethod("wheel")) {
            return
        }

        let deltaMultipler = event.deltaMode === WheelEvent.DOM_DELTA_PIXEL
            ? 1
            : event.deltaMode === WheelEvent.DOM_DELTA_LINE
                ? 30
                : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
                    ? event.shiftKey
                        ? this.el.nativeElement.offsetWidth
                        : this.el.nativeElement.offsetHeight
                    : 0

        let deltaX = 0
        let deltaY = 0

        if (event.shiftKey) {
            deltaX = event.deltaX * deltaMultipler
        } else {
            deltaY = event.deltaY * deltaMultipler
        }

        const pos = this.service.vpImmediate.scrollPosition
        this.service.scrollTo({
            top: pos.top + deltaY,
            left: pos.left + deltaX
        }, { smooth: true, velocity: 1 })

        const newPos = this.service.vpImmediate.scrollPosition
        if (pos.top !== newPos.top || pos.left !== newPos.left) {
            event.preventDefault()
        }

        this.service.releaseMethod("wheel")
    }

    private _panning: PanHelper

    @HostListener("pan", ["$event"])
    public onPan(event: NzTouchEvent) {
        if (this._panning) {
            if (event.pointerType !== "touch") {
                return
            }
            event.preventDefault()

            if (this._panning.orient !== event.orient) {
                if (this._panning.ended) {
                    this._panning = new PanHelper(this.service, event)
                } else {
                    return
                }
            }
        } else {
            if (event.defaultPrevented || event.pointerType !== "touch") {
                console.log("defaultPrevented", "isFinal", event.isFinal, this._panning)
                return
            }
            if (event.orient === "horizontal" && !this.service.horizontalOverflow) {
                return
            }
            if (event.orient === "vertical" && !this.service.verticalOverflow) {
                return
            }
            if (!this.service.lockMethod("pan")) {
                return
            }
            event.preventDefault()
            this._panning = new PanHelper(this.service, event)
        }

        if (this.exheader) {
            this.exheader.disablePan = this.service.vpRender.scrollPercent.top !== 0
        }

        this._panning.feed(event)

        if (event.isFinal) {
            this._panning.scrollTo(() => {
                this.service.releaseMethod("pan")
            })
            this._panning = null
        } else {
            this._panning.scrollTo()
        }
    }


    private _focusHandler = () => {
        const activeElement = document.activeElement
        const formField = activeElement.closest(".nz-form-field")
        this.service.scrollIntoViewport(formField || activeElement)
    }

    public ngOnDestroy() {
        this.el.nativeElement.removeEventListener("focus", this._focusHandler, true)
        this.el.nativeElement.removeEventListener("wheel", this.onMouseScroll)
    }

    // TODO: stop scroll when tap
    // private _stopSwipeScroll = (event: Event) => {
    //     if (this.service.methodIsLocked("pan")) {
    //         this.service.vpImmediate.scrollPosition = this.service.vpRender.scrollPosition
    //         this.service.scrollTo(this.service.vpRender.scrollPosition, { smooth: false })
    //     }
    // }
}


class PanHelper {
    // public readonly pointerStart: TouchPoint

    public readonly orient: ScrollOrient
    public distance: number
    public position: number
    public velocity: number

    public scrollStart: ScrollPosition
    public ended: Date

    public constructor(public readonly service: ScrollerService, event: NzTouchEvent) {
        this.scrollStart = service.vpRender.scrollPosition
        this.orient = event.orient
    }

    public feed(event: NzTouchEvent) {
        let start: number
        let velocity: number
        let axis: "x" | "y"
        let hw: "height" | "width"

        if (this.orient === "horizontal") {
            start = this.scrollStart.left
            axis = "x"
            hw = "width"
            this.distance = event.distanceX
        } else {
            start = this.scrollStart.top
            axis = "y"
            hw = "height"
            this.distance = event.distanceY
        }

        if (event.isFinal) {
            this.ended = new Date()

            let velocities = event.movement
                .slice(-10)
                .reduce((result, v, i, a) => {
                    const pv = a[i - 1]
                    if (pv) {
                        const duration = v[0].t - pv[0].t
                        result.push((v[0][axis] - pv[0][axis]) / duration)
                    }
                    return result
                }, [] as Array<number>)

            console.log("velocities", velocities)
            velocity = velocities.reduce((a, b) => a + b, 0) / velocities.length

            if (Math.abs(velocity) >= 0.7) {
                this.distance += this.service.vpImmediate[hw] * velocity
            }
        } else {
            velocity = 0.5
        }
        this.velocity = velocity
        this.position = start - this.distance
    }

    public scrollTo(done?: () => void) {
        this.service.scrollTo(
            { [this.orient === "horizontal" ? "left" : "top"]: this.position },
            { smooth: true, velocity: Math.abs(this.velocity), done }
        )
    }
}
