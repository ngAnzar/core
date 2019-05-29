import {
    Component, Inject, Input, HostBinding, Attribute, ViewChild,
    ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy, ElementRef, NgZone
} from "@angular/core"

import { Destruct } from "../../util"
import { DragService, DragEventService } from "../../common.module"
import { ScrollerService, ScrollOrient } from "./scroller.service"


@Component({
    selector: ".nz-scrollbar",
    templateUrl: "./scrollbar.template.pug",
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        { provide: DragService, useClass: DragService }
    ]
})
export class ScrollbarComponent implements OnDestroy {
    @ViewChild("btnUp") public readonly btnUp: ElementRef<HTMLElement>
    @ViewChild("btnDown") public readonly btnDown: ElementRef<HTMLElement>
    @ViewChild("bar") public readonly bar: ElementRef<HTMLElement>

    @Input()
    public set position(val: number) {
        if (this._position !== val) {
            this._position = val
            this._layout()
        }
    }
    public get position(): number { return this._position }
    private _position: number = 0

    @Input()
    @HostBinding("style.width.px")
    public set width(val: number) {
        if (this._width !== val) {
            this._width = val
            this._layout()
        }
    }
    public get width(): number { return this._width }
    private _width: number

    @Input()
    @HostBinding("style.height.px")
    public set height(val: number) {
        if (this._height !== val) {
            this._height = val
            this._layout()
        }
    }
    public get height(): number { return this._height }
    private _height: number

    public get isVisible(): boolean {
        return this._height != null && this._width != null && this._canScroll
    }

    @HostBinding("style.display")
    public get cssDisplay(): string { return this.isVisible ? "block" : "none" }

    public readonly size: number = 15

    public readonly barWidth: number
    public readonly barHeight: number
    public readonly barLeft: number
    public readonly barTop: number

    public readonly btnVisible: boolean = false
    public readonly btnWidth: number
    public readonly btnHeight: number

    public readonly destruct = new Destruct()
    protected _canScroll: boolean = false
    public scrollRatio: number = 0

    public constructor(
        @Inject(ElementRef) public readonly el: ElementRef<HTMLElement>,
        @Inject(ScrollerService) public readonly scroller: ScrollerService,
        @Inject(DragEventService) public readonly dragEvent: DragEventService,
        @Inject(ChangeDetectorRef) public readonly cdr: ChangeDetectorRef,
        @Inject(NgZone) zone: NgZone,
        @Attribute("orient") public readonly orient: ScrollOrient) {

        // zone.runOutsideAngular(() => {
        this.destruct.subscription(scroller.vpImmediate.change).subscribe(viewport => {
            let canScroll = true
            if (this.orient === "horizontal") {
                this.width = viewport.width - 10
                this.height = this.size
                canScroll = viewport.width < viewport.scrollWidth
            } else {
                this.width = this.size
                this.height = viewport.height - 10
                canScroll = viewport.height < viewport.scrollHeight
            }

            if (this._canScroll !== canScroll) {
                this._canScroll = canScroll
                this._layout()
            }
        })

        this.destruct.subscription(scroller.vpRender.scroll).subscribe(scroll => {
            if (this.orient === "horizontal") {
                this.position = scroll.percent.left
            } else {
                this.position = scroll.percent.top
            }
        })

        let scrollerBeginPosition = scroller.scrollPosition
        this.destruct.subscription(dragEvent.watch(el.nativeElement)).subscribe(event => {
            switch (event.type) {
                case "begin":
                    scrollerBeginPosition = scroller.scrollPosition
                    break

                case "drag":
                    if (!this.scroller.lockMethod("drag")) {
                        return
                    }
                    this.scroller.velocityX = this.scroller.velocityY = 1
                    if (this.orient === "horizontal") {
                        scroller.scrollPosition = {
                            top: scrollerBeginPosition.top,
                            left: scrollerBeginPosition.left + (event.current.x - event.begin.x) * this.scrollRatio
                        }
                    } else {
                        scroller.scrollPosition = {
                            top: scrollerBeginPosition.top + (event.current.y - event.begin.y) * this.scrollRatio,
                            left: scrollerBeginPosition.left
                        }
                    }
                    break

                case "end":
                    this.scroller.releaseMethod("drag")
                    break
            }
        })
        // })
    }

    // TODO: remove detect changes...
    protected _layout() {
        if (this.isVisible) {
            const self = this as Writeable<ScrollbarComponent>
            if (this.orient === "horizontal") {
                const trackWidth = self.btnVisible ? Math.max(0, this.width - self.size * 2) : this.width
                self.barWidth = Math.min(trackWidth, this.width * 0.5)

                self.barLeft = 5 + (self.btnVisible ? this.size : 0) + (trackWidth - self.barWidth) * this.position

                self.btnWidth = this.size
                self.scrollRatio = self.scroller.vpImmediate.scrollWidth / (trackWidth - self.barWidth)
            } else {
                const trackHeight = self.btnVisible ? Math.max(0, this.height - self.size * 2) : this.height
                self.barHeight = Math.min(trackHeight, this.height * 0.5)

                self.barTop = 5 + (self.btnVisible ? this.size : 0) + (trackHeight - self.barHeight) * this.position

                self.btnHeight = this.size
                self.scrollRatio = self.scroller.vpImmediate.scrollHeight / (trackHeight - self.barHeight)
            }
        }

        this.cdr.markForCheck()
    }

    public ngOnDestroy() {
        this.destruct.run()
    }
}


type Writeable<T> = { -readonly [P in keyof T]-?: T[P] }
