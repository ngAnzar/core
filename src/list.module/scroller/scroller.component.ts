import { Component, Inject, ElementRef, HostListener, Input, ContentChild } from "@angular/core"
import { coerceBooleanProperty } from "@angular/cdk/coercion"

import { ScrollerService } from "./scroller.service"
import { RectMutationService } from "../../layout.module"
import { ScrollPosition } from "./scroller.service";
import { ScrollableDirective } from "./scrollable.directive"


@Component({
    selector: ".nz-scroller",
    templateUrl: "./scroller.template.pug",
    providers: [
        ScrollerService
    ]
})
export class ScrollerComponent {
    @ContentChild(ScrollableDirective) protected readonly scrollable: ScrollableDirective

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
        if (!this.service.lockMethod("pan")) {
            return
        }

        let velocity = 5
        let modifierX = 1
        let modifierY = 1

        if (event.isFinal) {
            // velocity = Math.abs(event.velocity)
            // if (event.additionalEvent === "panup" || event.additionalEvent === "pandown") {
            //     modifierY = Math.max(1, velocity * 2)
            // } else {
            //     modifierX = Math.max(1, velocity * 2)
            // }
            velocity = 1
        }

        this.service.velocityX = this.service.velocityY = velocity

        let top = this._panStartPos.top - (event.deltaY * modifierY)
        let left = this._panStartPos.left - (event.deltaX * modifierX)

        this.service.scrollPosition = { top, left }

        if (event.isFinal) {
            this.service.releaseMethod("pan")
        }
    }
}
