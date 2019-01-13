import {
    Component, Inject, Input, HostBinding, Attribute,
    ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy
} from "@angular/core"

import { Destruct } from "../../util"
import { DragService } from "../../common.module"
import { ScrollerService, ScrollOrient } from "./scroller.service"


@Component({
    selector: ".nz-scrollbar",
    templateUrl: "./scrollbar.template.pug",
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        DragService
    ]
})
export class ScrollbarComponent implements OnDestroy {
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
        return this._height != null && this._width != null && this._position != null
    }

    @HostBinding("style.display")
    public get cssDisplay(): string { return this.isVisible ? "block" : "none" }

    public readonly size: number = 12

    public readonly barWidth: number
    public readonly barHeight: number
    public readonly barLeft: number
    public readonly barTop: number

    public readonly btnVisible: boolean = false
    public readonly btnWidth: number
    public readonly btnHeight: number

    public readonly destruct = new Destruct()

    public constructor(
        @Inject(ScrollerService) public readonly scroller: ScrollerService,
        @Inject(DragService) public readonly drag: DragService,
        @Inject(ChangeDetectorRef) public readonly cdr: ChangeDetectorRef,
        @Attribute("orient") public readonly orient: ScrollOrient) {

        this.destruct.subscription(scroller.viewportChanges).subscribe(viewport => {
            if (this.orient === "horizontal") {
                this.width = viewport.width
                this.height = this.size
            } else {
                this.width = this.size
                this.height = viewport.height
            }
        })
    }

    protected _layout() {
        if (this.isVisible) {
            const self = this as Writeable<ScrollbarComponent>
            if (this.orient === "horizontal") {
                const trackWidth = self.btnVisible ? Math.max(0, this.width - self.size * 2) : this.width
                self.barWidth = Math.min(trackWidth, this.width * 0.5)
                self.barHeight = this.size

                self.barTop = 0
                self.barLeft = this.size + (trackWidth - self.barWidth) * this.position

                self.btnWidth = this.size
                self.btnHeight = this.size
            } else {
                const trackHeight = self.btnVisible ? Math.max(0, this.height - self.size * 2) : this.height
                self.barWidth = this.size
                self.barHeight = Math.min(trackHeight, this.height * 0.5)

                self.barTop = this.size + (trackHeight - self.barHeight) * this.position
                self.barLeft = 0

                self.btnWidth = this.size
                self.btnHeight = this.size
            }
        }
        this.cdr.markForCheck()
    }

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
