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

    private _panStartPos: ScrollPosition
    private _pointerStartPos: ScrollPosition

    @HostListener("pan", ["$event"])
    public onPan(event: NzTouchEvent) {
        if (event.defaultPrevented || event.pointerType !== "touch") {
            return
        }
        if (event.orient === "horizontal" && !this.service.horizontalOverflow) {
            return
        }
        if (event.orient === "vertical" && !this.service.verticalOverflow) {
            return
        }
        if (event.orient !== this.orient) {
            return
        }
        if (!this.service.lockMethod("pan")) {
            return
        }
        if (!this._panStartPos) {
            this._panStartPos = this.service.vpRender.scrollPosition
            this._pointerStartPos = {
                top: event.clientY,
                left: event.clientX,
            }
        }

        event.preventDefault()

        if (this.exheader) {
            this.exheader.disablePan = this.service.vpRender.scrollPercent.top !== 0
        }

        if (event.isFinal) {
            delete this._panStartPos

            const done = () => {
                this.service.releaseMethod("pan")
            }

            const scrollPosition = this.service.vpRender.scrollPosition

            if (event.orient === "horizontal" && event.velocityX >= 0.7) {
                let left = event.direction === "left"
                    ? scrollPosition.left + this.service.vpImmediate.width * event.velocityX
                    : scrollPosition.left - this.service.vpImmediate.width * event.velocityX
                this.service.scrollTo({ left }, { smooth: true, velocity: event.velocityX, done })
            } else if (event.orient === "vertical" && event.velocityY >= 0.7) {
                let top = event.direction === "top"
                    ? scrollPosition.top + this.service.vpImmediate.height * event.velocityY
                    : scrollPosition.top - this.service.vpImmediate.height * event.velocityY
                this.service.scrollTo({ top }, { smooth: true, velocity: event.velocityY, done })
            } else {
                done()
            }
        } else {
            if (event.orient === "horizontal") {
                let left = this._panStartPos.left + (this._pointerStartPos.left - event.clientX)
                this.service.scrollTo({ left }, { smooth: true, velocity: event.velocityX })
            } else {
                let top = this._panStartPos.top + (this._pointerStartPos.top - event.clientY)
                this.service.scrollTo({ top }, { smooth: true, velocity: event.velocityY })
            }
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
