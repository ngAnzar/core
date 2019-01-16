import {
    Component, Inject, Input, HostBinding, Attribute, ViewChild,
    ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy, ElementRef
} from "@angular/core"

import { Destruct } from "../../util"
import { DragService, DragEventService } from "../../common.module"
import { Rect } from "../../layout.module"
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

    public constructor(
        @Inject(ElementRef) public readonly el: ElementRef<HTMLElement>,
        @Inject(ScrollerService) public readonly scroller: ScrollerService,
        @Inject(DragEventService) public readonly dragEvent: DragEventService,
        @Inject(ChangeDetectorRef) public readonly cdr: ChangeDetectorRef,
        @Attribute("orient") public readonly orient: ScrollOrient) {

        this.destruct.subscription(scroller.viewportChanges).subscribe(viewport => {
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
                this._layout()
            }
        })

        this.destruct.subscription(scroller.scrollChanges).subscribe(scroll => {
            if (this.orient === "horizontal") {
                this.position = scroll.left
            } else {
                this.position = scroll.top
            }
        })

        let scrollerBeginPosition = scroller.position
        let mouseOffset = 0
        this.destruct.subscription(dragEvent.watch(el.nativeElement)).subscribe(event => {
            switch (event.type) {
                case "begin":
                    scrollerBeginPosition = scroller.position

                    let barRect = this.bar.nativeElement.getBoundingClientRect()
                    if (this.orient === "horizontal") {
                        mouseOffset = barRect.left - event.current.left
                    } else {
                        mouseOffset = barRect.top - event.current.top
                    }
                    break

                case "drag":
                    let box = el.nativeElement.getBoundingClientRect()
                    if (this.orient === "horizontal") {
                        const width = (this.btnVisible ? Math.max(0, this.width - this.size * 2) : this.width) - this.barWidth
                        const left = (event.current.left - box.left) + mouseOffset
                        this.position = Math.min(1, Math.max(0, left / width))
                        scroller.position = {
                            left: this.position,
                            top: scrollerBeginPosition.top
                        }
                    } else {
                        const height = (this.btnVisible ? Math.max(0, this.height - this.size * 2) : this.height) - this.barHeight
                        const top = event.current.top - box.top + mouseOffset
                        this.position = Math.min(1, Math.max(0, top / height))
                        scroller.position = {
                            left: scrollerBeginPosition.left,
                            top: this.position
                        }
                    }
                    break
            }
        })
    }

    protected _layout() {
        if (this.isVisible) {
            const self = this as Writeable<ScrollbarComponent>
            if (this.orient === "horizontal") {
                const trackWidth = self.btnVisible ? Math.max(0, this.width - self.size * 2) : this.width
                self.barWidth = Math.min(trackWidth, this.width * 0.5)

                self.barTop = 0
                self.barLeft = (self.btnVisible ? this.size : 0) + (trackWidth - self.barWidth) * this.position

                self.btnWidth = this.size
            } else {
                const trackHeight = self.btnVisible ? Math.max(0, this.height - self.size * 2) : this.height
                self.barHeight = Math.min(trackHeight, this.height * 0.5)

                self.barTop = (self.btnVisible ? this.size : 0) + (trackHeight - self.barHeight) * this.position

                self.btnHeight = this.size
            }
        }
        this.cdr.markForCheck()
    }

    // protected _getBarPosition(): number {
    //     if (this.orient === "horizontal") {
    //         const width = (this.btnVisible ? Math.max(0, this.width - this.size * 2) : this.width) - this.barWidth
    //         return this.barLeft / width
    //     } else {
    //         const height = (this.btnVisible ? Math.max(0, this.height - this.size * 2) : this.height) - this.barHeight
    //         return this.barTop / height
    //     }
    // }

    // private _updateProp(name: string, newValue: any): void {
    //     const old = (this as any)[name]
    //     if (old !== newValue) {
    //         (this as any)[name] = newValue
    //         this.cdr.markForCheck()
    //     }
    // }

    public ngOnDestroy() {
        this.destruct.run()
    }
}


type Writeable<T> = { -readonly [P in keyof T]-?: T[P] }
