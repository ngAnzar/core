import { Component, Inject, ViewChild, ElementRef, AfterViewInit, HostListener, Input } from "@angular/core"
import { coerceBooleanProperty } from "@angular/cdk/coercion"
import { tap, debounceTime, race } from "rxjs/operators"

import { ScrollerService } from "./scroller.service"
import { RectMutationService, Dimension, Rect } from "../../layout.module"
import { ScrollEvent, ScrollPosition } from "./scroller.service";




@Component({
    selector: ".nz-scroller",
    templateUrl: "./scroller.template.pug",
    providers: [
        ScrollerService
    ]
})
export class ScrollerComponent implements AfterViewInit {
    @ViewChild("scrollable") protected readonly scrollable: ElementRef<HTMLElement>

    @Input()
    public set hideScrollbar(val: boolean) {
        val = coerceBooleanProperty(val)
        if (this._hideScrollbar !== val) {
            this._hideScrollbar = val
        }
    }
    public get hideScrollbar(): boolean { return this._hideScrollbar }
    private _hideScrollbar: boolean = false

    private _containerDim: Rect
    private _scrollableDim: Dimension

    public constructor(
        @Inject(ElementRef) public readonly el: ElementRef<HTMLElement>,
        @Inject(ScrollerService) public readonly service: ScrollerService,
        @Inject(RectMutationService) public readonly rectMutation: RectMutationService) {
    }

    public ngAfterViewInit() {
        this.service.destruct.subscription(this.service.vpRender.scroll)
            .subscribe(this._scroll)

        this.service.destruct.subscription(this.rectMutation.watch(this.el))
            .pipe(tap(v => this._containerDim = v))
            .subscribe(this._updateScroll)

        this.service.destruct.subscription(this.rectMutation.watchDimension(this.scrollable))
            .pipe(tap(v => this._scrollableDim = v))
            .subscribe(this._updateScroll)
    }

    protected _updateScroll = () => {
        if (!this._scrollableDim || !this._containerDim) {
            return
        }

        this.service.vpImmediate.update({
            top: this._containerDim.top,
            left: this._containerDim.left,
            width: this._containerDim.width,
            height: this._containerDim.height,
            scrollWidth: this._scrollableDim.width,
            scrollHeight: this._scrollableDim.height
        })
    }

    protected _scroll = (event: ScrollEvent) => {
        const pos = this.service.vpRender.scrollPosition
        this.scrollable.nativeElement.style.transform = `translate(-${pos.left}px, -${pos.top}px)`
    }

    @HostListener("wheel", ["$event"])
    public onMouseScroll(event: WheelEvent) {
        if (!this.service.lockMethod("wheel")) {
            return
        }

        if (event.deltaY) {
            let deltaX = 0
            let deltaY = 0
            if (event.shiftKey) {
                deltaX = (event.deltaY < 0 ? -1 : 1) * 90
            } else {
                deltaY = (event.deltaY < 0 ? -1 : 1) * 90
            }

            this.service.velocityX = 1
            this.service.velocityY = 1

            const pos = this.service.scrollPosition
            this.service.scrollPosition = {
                top: pos.top + deltaY,
                left: pos.left + deltaX
            }
        }

        this.service.releaseMethod("wheel")
    }

    private _panStartPos: ScrollPosition

    @HostListener("panstart", ["$event"])
    public onPanStart(event: any) {
        if (this.service.lockMethod("pan")) {
            this._panStartPos = this.service.scrollPosition
        }
    }

    @HostListener("pan", ["$event"])
    public onPan(event: any) {
        console.log(event.type, event.additionalEvent, { dx: event.deltaX, dy: event.deltaY })
        if (!this.service.lockMethod("pan")) {
            return
        }

        let velocity = 5
        let modifierX = 1
        let modifierY = 1

        if (event.isFinal) {
            velocity = Math.abs(event.velocity)
            if (event.additionalEvent === "panup" || event.additionalEvent === "pandown") {
                modifierY = Math.max(1, velocity * 5)
            } else {
                modifierX = Math.max(1, velocity * 5)
            }
            velocity = 2
        }

        this.service.velocityX = this.service.velocityY = velocity

        let top = this._panStartPos.top - (event.deltaY * modifierY)
        let left = this._panStartPos.left - (event.deltaX * modifierX)

        console.log({ top, left })
        this.service.scrollPosition = { top, left }

        if (event.isFinal) {
            this.service.releaseMethod("pan")
        }
    }
}
