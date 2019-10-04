import { Component, Inject, ElementRef, HostListener, Input, ContentChild, OnInit, HostBinding } from "@angular/core"
import { coerceBooleanProperty } from "@angular/cdk/coercion"

import { RectMutationService } from "../../layout.module"
import { NzTouchEvent } from "../../common.module"
import { ScrollerService, ScrollPosition, ScrollOrient } from "./scroller.service"
import { ScrollableDirective } from "./scrollable.directive"


@Component({
    selector: ".nz-scroller",
    templateUrl: "./scroller.template.pug",
    providers: [
        ScrollerService
    ]
})
export class ScrollerComponent implements OnInit {
    @ContentChild(ScrollableDirective, { static: true }) protected readonly scrollable: ScrollableDirective

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

    public constructor(
        @Inject(ElementRef) public readonly el: ElementRef<HTMLElement>,
        @Inject(ScrollerService) public readonly service: ScrollerService,
        @Inject(RectMutationService) rectMutation: RectMutationService) {

        this.service.destruct.subscription(rectMutation.watchDimension(this.el)).subscribe(dim => {
            this.service.vpImmediate.update(dim)
        })

        // el.nativeElement.addEventListener("touchstart", this._stopSwipeScroll, true)
        // this.service.destruct.any(() => {
        //     el.nativeElement.removeEventListener("touchstart", this._stopSwipeScroll, true)
        // })
    }

    public ngOnInit() {
        this.service.orient = this.orient
    }

    @HostListener("wheel", ["$event"])
    public onMouseScroll(event: WheelEvent) {
        if (!this.service.lockMethod("wheel") || event.defaultPrevented) {
            return
        }

        if (this.service.verticalOverflow) {
            event.preventDefault()
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

        this.service.releaseMethod("wheel")
    }

    private _panStartPos: ScrollPosition

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
        if (!this.service.lockMethod("pan")) {
            return
        }
        if (!this._panStartPos) {
            this._panStartPos = this.service.scrollPosition
        }
        event.preventDefault()

        if (event.isFinal) {
            delete this._panStartPos

            const done = () => {
                this.service.releaseMethod("pan")
            }

            if (event.orient === "horizontal" && event.velocityX >= 0.7) {
                let left = event.direction === "left"
                    ? this.service.scrollPosition.left + this.service.vpImmediate.width * event.velocityX
                    : this.service.scrollPosition.left - this.service.vpImmediate.width * event.velocityX
                this.service.scrollTo({ left }, { smooth: true, velocity: event.velocityX, done })
            } else if (event.orient === "vertical" && event.velocityY >= 0.7) {
                let top = event.direction === "top"
                    ? this.service.scrollPosition.top + this.service.vpImmediate.height * event.velocityY
                    : this.service.scrollPosition.top - this.service.vpImmediate.height * event.velocityY
                this.service.scrollTo({ top }, { smooth: true, velocity: event.velocityY, done })
            } else {
                done()
            }
        } else {
            if (event.orient === "horizontal") {
                let left = this._panStartPos.left - event.distanceX
                this.service.scrollTo({ left }, { smooth: true, velocity: event.velocityX })
            } else {
                let top = this._panStartPos.top - event.distanceY
                this.service.scrollTo({ top }, { smooth: true, velocity: event.velocityY })
            }
        }
    }

    // TODO: stop scroll when tap
    private _stopSwipeScroll = (event: Event) => {
        // if (this.service.methodIsLocked("pan")) {
        //     event.preventDefault()
        //     event.stopImmediatePropagation()
        //     this.service.vpImmediate.scrollPosition = this.service.vpRender.scrollPosition
        //     this.service.scrollTo(this.service.vpRender.scrollPosition, { smooth: false })
        // }
    }
}
