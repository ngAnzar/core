import { Component, Inject, ViewChild, ElementRef, AfterViewInit, HostListener } from "@angular/core"
import { merge } from "rxjs"
import { tap, debounceTime } from "rxjs/operators"

import { ScrollerService, ScrollablePosition, ScrollVpEvent } from "./scroller.service"
import { RectMutationService, Dimension, Rect } from "../../layout.module"



@Component({
    selector: ".nz-scroller",
    templateUrl: "./scroller.template.pug",
    providers: [
        { provide: ScrollerService, useClass: ScrollerService }
    ]
})
export class ScrollerComponent implements AfterViewInit {
    @ViewChild("scrollable") protected readonly scrollable: ElementRef<HTMLElement>

    private containerDim: Rect
    private scrollableDim: Dimension
    private scrollPos: ScrollablePosition

    public constructor(
        @Inject(ElementRef) public readonly el: ElementRef<HTMLElement>,
        @Inject(ScrollerService) public readonly service: ScrollerService,
        @Inject(RectMutationService) public readonly rectMutation: RectMutationService) {
    }

    public ngAfterViewInit() {
        const scrollWatcher = this.service.destruct.subscription(this.service.scrollVp)
            .pipe(tap(this._scroll))

        const dimWatchers = merge(
            this.service.destruct.subscription(this.rectMutation.watch(this.el))
                .pipe(tap(dim => this.containerDim = dim)),
            this.service.destruct.subscription(this.rectMutation.watchDimension(this.scrollable))
                .pipe(tap(dim => this.scrollableDim = dim)))

        const allWatch = merge(scrollWatcher, dimWatchers)

        this.service.destruct.subscription(allWatch)
            .pipe(debounceTime(5))
            .subscribe(this._updateScroll)
    }

    protected _updateScroll = () => {
        if (!this.scrollableDim || !this.containerDim) {
            return
        }

        this.service.viewport = {
            top: this.containerDim.top,
            left: this.containerDim.left,
            width: this.containerDim.width,
            height: this.containerDim.height,
            scrollWidth: this.scrollableDim.width,
            scrollHeight: this.scrollableDim.height
        }

        const pos = this.service.pxPosition
        this.scrollable.nativeElement.style.transform = `translate(-${pos.left}px, -${pos.top}px)`
    }

    protected _scroll = (event: ScrollVpEvent) => {
        this.scrollPos = this.service.position
        this._updateScroll()
        event.ack()
        // setTimeout(event.ack.bind(event), 10)
    }

    @HostListener("wheel", ["$event"])
    public onMouseScroll(event: WheelEvent) {
        if (event.deltaY) {
            let deltaX = 0
            let deltaY = 0
            if (event.shiftKey) {
                deltaX = (event.deltaY < 0 ? -1 : 1) * 90
            } else {
                deltaY = (event.deltaY < 0 ? -1 : 1) * 90
            }

            const pos = this.service.pxPosition
            this.service.scroll({
                px: {
                    left: pos.left + deltaX,
                    top: pos.top + deltaY
                }
            })
        }
    }
}
