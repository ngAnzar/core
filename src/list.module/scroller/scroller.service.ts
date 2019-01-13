import { EventEmitter, OnDestroy } from "@angular/core"
import { Observable } from "rxjs"
import { filter, share } from "rxjs/operators"

import { Rect } from "../../layout.module"
import { Destruct } from "../../util"

export type ScrollOrient = "horizontal" | "vertical"


export interface ScrollableViewport {
    width: number
    height: number
    scrollWidth: number
    scrollHeight: number
}


export interface ScrollablePosition {
    readonly top: number
    readonly left: number
}


export type ScrollBy = { percent: ScrollablePosition } | { px: ScrollablePosition }


export class ScrollEvent implements ScrollablePosition {
    public constructor(
        public readonly scroller: ScrollerService,
        public readonly top: number,
        public readonly left: number,
        public readonly orient: ScrollOrient,
        public readonly direction: number) {
    }
}


export class ScrollerService implements OnDestroy {
    public orient: ScrollOrient = "horizontal"
    public readonly destruct = new Destruct()

    public set viewport(val: ScrollableViewport) {
        let old = this._viewport
        if (!old || !val
            || old.width !== val.width
            || old.height !== val.height
            || old.scrollHeight !== val.scrollHeight
            || old.scrollWidth !== val.scrollHeight) {
            this._viewport = val;
            (this.viewportChanges as EventEmitter<ScrollableViewport>).emit(val)
        }
    }
    public get viewport(): ScrollableViewport { return this._viewport }
    private _viewport: ScrollableViewport = { width: 0, height: 0, scrollWidth: 0, scrollHeight: 0 }
    public readonly viewportChanges: Observable<ScrollableViewport> = this.destruct.subject(new EventEmitter())


    public set position(val: ScrollablePosition) {
        if (val) {
            const old = this._position
            let direction: number
            let orient: ScrollOrient

            if (old) {
                let leftChanged = old.left !== val.left
                let topChanged = old.top !== val.top


                if (leftChanged && topChanged) {
                    orient = this.orient === "horizontal" && leftChanged
                        ? "horizontal"
                        : this.orient === "vertical" && topChanged
                            ? "vertical"
                            : leftChanged
                                ? "horizontal"
                                : "vertical"

                    if (orient === "horizontal") {
                        direction = old.left <= val.left ? 1 : -1
                    } else {
                        direction = old.top <= val.top ? 1 : -1
                    }
                }
            }

            (this.scrollChanges as EventEmitter<ScrollEvent>)
                .emit(new ScrollEvent(this, val.top, val.left, orient, direction))
        }
    }
    public get position(): ScrollablePosition { return this._position }
    private _position: ScrollablePosition = { left: 0, top: 0 }

    public readonly scrollChanges: Observable<ScrollEvent> = this.destruct.subject(new EventEmitter())
    public readonly primaryScroll: Observable<ScrollEvent> = this.scrollChanges
        .pipe(filter(event => event.orient === this.orient), share())


    public init(pos: ScrollablePosition) {
        this._position = pos
    }

    public scroll(opt: ScrollBy) {
        if ("percent" in opt) {
            this.position = {
                left: opt.percent.left == null ? this.position.left : this.viewport.scrollWidth * opt.percent.left,
                top: opt.percent.top == null ? this.position.top : this.viewport.scrollHeight * opt.percent.top
            }
        } else if ("px" in opt) {
            this.position = {
                left: opt.px.left == null ? this.position.left : opt.px.left,
                top: opt.px.top == null ? this.position.top : opt.px.top
            }
        }
    }

    public scrollIntoViewport(el: HTMLElement): void {

    }

    public elementIsVisible(el: HTMLElement): boolean {
        throw new Error("not implementd")
        // let rect = Rect.fromElement(el)
        // return this._viewport && this._viewport.rect.isIntersect(rect)
    }

    public ngOnDestroy() {
        this.destruct.run()
    }
}
