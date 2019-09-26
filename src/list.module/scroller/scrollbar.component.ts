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

    public set position(val: number) {
        if (this._position !== val) {
            this._position = val
            this._layout()
        }
    }
    public get position(): number { return this._position }
    private _position: number = 0

    public set width(val: number) {
        if (this._width !== val) {
            this._width = val
            this._layout()
        }
    }
    public get width(): number { return this._width }
    private _width: number

    public set height(val: number) {
        if (this._height !== val) {
            this._height = val
            this.el.style.height = `${val}px`
            this._layout()
        }
    }
    public get height(): number { return this._height }
    private _height: number

    public get isVisible(): boolean {
        return this._height != null && this._width != null && this._canScroll
    }

    public readonly size: number = 15
    public readonly btnVisible: boolean = false

    public readonly destruct = new Destruct()
    protected _canScroll: boolean = false
    public scrollRatio: number = 0
    public readonly el: HTMLElement

    public constructor(
        @Inject(ElementRef) el: ElementRef<HTMLElement>,
        @Inject(ScrollerService) public readonly scroller: ScrollerService,
        @Inject(DragEventService) public readonly dragEvent: DragEventService,
        @Inject(NgZone) zone: NgZone,
        @Attribute("orient") public readonly orient: ScrollOrient) {

        this.el = el.nativeElement

        zone.runOutsideAngular(() => {

            this.destruct.subscription(scroller.vpImmediate.change).subscribe(viewport => {
                let canScroll = true
                if (this.orient === "horizontal") {
                    this.width = viewport.width
                    this.height = this.size
                    canScroll = viewport.width < viewport.scrollWidth
                } else {
                    this.width = this.size
                    this.height = viewport.height
                    canScroll = viewport.height < viewport.scrollHeight
                }

                if (this._canScroll !== canScroll) {
                    this._canScroll = canScroll
                }

                this._layout()
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
                        // this.scroller.velocityX = this.scroller.velocityY = 1
                        if (this.orient === "horizontal") {
                            scroller.scrollTo({
                                top: scrollerBeginPosition.top,
                                left: scrollerBeginPosition.left + (event.current.x - event.begin.x) * this.scrollRatio
                            }, { smooth: false })
                        } else {
                            scroller.scrollTo({
                                top: scrollerBeginPosition.top + (event.current.y - event.begin.y) * this.scrollRatio,
                                left: scrollerBeginPosition.left
                            }, { smooth: false })
                        }
                        break

                    case "end":
                        this.scroller.releaseMethod("drag")
                        break
                }
            })

        })

    }

    // TODO: remove detect changes...
    protected _layout() {
        if (this.isVisible) {
            this.el.style.width = `${this.width}px`
            this.el.style.height = `${this.height}px`
            this.el.style.display = `block`

            let barWidth, barHeight, barTop, barLeft, btnWidth, btnHeight


            if (this.orient === "horizontal") {
                const trackWidth = this.btnVisible ? Math.max(0, this.width - this.size * 2) : this.width
                barWidth = Math.min(trackWidth, this.width * 0.5)

                barLeft = (this.btnVisible ? this.size : 0) + (trackWidth - barWidth) * this.position

                btnWidth = this.size
                this.scrollRatio = this.scroller.vpImmediate.scrollWidth / (trackWidth - barWidth)
            } else {
                const trackHeight = this.btnVisible ? Math.max(0, this.height - this.size * 2) : this.height
                barHeight = Math.min(trackHeight, this.height * 0.5)

                barTop = (this.btnVisible ? this.size : 0) + (trackHeight - barHeight) * this.position

                btnHeight = this.size
                this.scrollRatio = this.scroller.vpImmediate.scrollHeight / (trackHeight - barHeight)
            }

            let bs = this.bar.nativeElement.style
            bs.width = `${barWidth}px`
            bs.height = `${barHeight}px`
            bs.top = `${barTop}px`
            bs.left = `${barLeft}px`

        } else {
            this.el.style.display = `none`
        }
    }

    public ngOnDestroy() {
        this.destruct.run()
    }
}


// type Writeable<T> = { -readonly [P in keyof T]-?: T[P] }
