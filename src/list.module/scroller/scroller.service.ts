import { OnDestroy, NgZone, Inject, Injectable } from "@angular/core"
import { Observable, Subject, Subscription } from "rxjs"
import { startWith, debounceTime, map } from "rxjs/operators"

import { Destruct, IDisposable, Rect, RectProps } from "../../util"
import { Animation, easeOutCubic, easeLineral } from "../../animation.module"
import type { ScrollableDirective } from "./scrollable.directive"
import { merge } from "hammerjs"


export type ScrollOrient = "horizontal" | "vertical"


export interface ScrollPosition {
    readonly top: number
    readonly left: number
}


export type ScrollingMethod = "drag" | "wheel" | "pan"


export class ScrollEvent {
    public constructor(
        public readonly percent: ScrollPosition,
        public readonly position: ScrollPosition) {
    }
}


export interface ViewportDimensions {
    readonly scrollWidth: number
    readonly scrollHeight: number
    readonly width: number
    readonly height: number
    readonly top: number
    readonly left: number
    readonly virtualHeight: number
    readonly virtualWidth: number
    readonly virtualOffsetTop: number
    readonly virtualOffsetLeft: number
}


export abstract class Viewport implements ViewportDimensions, IDisposable {
    public abstract readonly scrollWidth: number
    public abstract readonly scrollHeight: number
    public abstract readonly width: number
    public abstract readonly height: number
    public abstract readonly top: number
    public abstract readonly left: number
    public abstract readonly visible: Rect

    public readonly virtualHeight: number
    public readonly virtualWidth: number
    public readonly virtualOffsetTop: number
    public readonly virtualOffsetLeft: number


    public readonly scroll: Observable<ScrollEvent> = new Subject<ScrollEvent>()
    protected _lastEvent: ScrollEvent

    public set scrollPercent(val: ScrollPosition) {
        const old = this._scrollPercent
        const left = val ? constrainPercent(val.left) : 0
        const top = val ? constrainPercent(val.top) : 0

        if (old.left !== left || old.top !== top) {
            const pxTop = Math.round(((this.scrollHeight - this.height) * top)) || 0
            const pxLeft = Math.round(((this.scrollWidth - this.width) * left)) || 0

            this.scrollPosition = {
                top: pxTop,
                left: pxLeft
            }
        }
    }
    public get scrollPercent(): ScrollPosition { return this._scrollPercent }
    protected _scrollPercent: ScrollPosition = { top: 0, left: 0 }


    public set scrollPosition(val: ScrollPosition) {
        const maxTop = Math.max(0, this.scrollHeight - this.height)
        const maxLeft = Math.max(0, this.scrollWidth - this.width)
        const top = val ? Math.max(0, Math.min(val.top || 0, maxTop)) : 0
        const left = val ? Math.max(0, Math.min(val.left || 0, maxLeft)) : 0

        const old = this._scrollPosition
        if (old.top !== top || old.left !== left) {
            this._scrollPercent = {
                top: (top / (this.scrollHeight - this.height)) || 0,
                left: (left / (this.scrollWidth - this.width)) || 0
            }

            this._scrollPosition = { top, left }

            this.visible.top = top
            this.visible.left = left;

            (this.scroll as Subject<ScrollEvent>).next(this._lastEvent = new ScrollEvent(this._scrollPercent, this._scrollPosition))
        }
    }
    public get scrollPosition(): ScrollPosition { return this._scrollPosition }
    protected _scrollPosition: ScrollPosition = { top: 0, left: 0 }

    public dispose() {
        (this.scroll as Subject<any>).complete()
        delete (this as any).scroll
    }

    public abstract update(dim: ViewportDimensions): boolean
}


export class ImmediateViewport extends Viewport {
    // public readonly scrollWidth: number = 0
    // public readonly scrollHeight: number = 0
    public readonly width: number = 0
    public readonly height: number = 0
    public readonly top: number = 0
    public readonly left: number = 0
    public readonly visible: Rect = new Rect(0, 0, 0, 0)

    public readonly change: Observable<Viewport> = new Subject<Viewport>()

    public set scrollWidth(val: number) { this._scrollWidth = val }
    public get scrollWidth(): number { return this.virtualWidth != null ? this.virtualWidth : this._scrollWidth }
    private _scrollWidth: number = 0

    public set scrollHeight(val: number) { this._scrollHeight = val }
    public get scrollHeight(): number { return this.virtualHeight != null ? this.virtualHeight : this._scrollHeight }
    private _scrollHeight: number = 0

    public update(dim: Partial<ViewportDimensions>): boolean {
        dim = dim || {} as any

        let changed = false
        for (const k in dim) {
            if (dim.hasOwnProperty(k) && (this as any)[k] !== (dim as any)[k]) {
                changed = true;
                (this as any)[k] = (dim as any)[k]
            }
        }

        if (changed) {
            this.visible.width = this.width
            this.visible.height = this.height
            // recalc min scroll position
            this.scrollPosition = this.scrollPosition;
            (this.change as Subject<Viewport>).next(this)
        }

        return changed
    }

    public dispose() {
        (this.change as Subject<any>).complete()
        delete (this as any).change
        super.dispose()
    }
}


export class RenderedViewport extends Viewport {
    public get scrollWidth(): number { return this.main.scrollWidth }
    public get scrollHeight(): number { return this.main.scrollHeight }
    public get width(): number { return this.main.width }
    public get height(): number { return this.main.height }
    public get top(): number { return this.main.top }
    public get left(): number { return this.main.left }
    public readonly visible: Rect = new Rect(0, 0, 0, 0)

    protected vpChange: Subscription

    public constructor(public readonly main: ImmediateViewport) {
        super()

        this.vpChange = main.change.pipe(startWith(null)).subscribe(() => {
            this.visible.width = main.width
            this.visible.height = main.height
        })
    }

    public update(dim: ViewportDimensions): boolean {
        throw new Error("can't update rendered viewport")
    }

    public dispose() {
        if (this.vpChange) {
            this.vpChange.unsubscribe()
            delete this.vpChange
        }
    }
}


function constrainPercent(num: number): number {
    return Math.min(1, Math.max(0, num))
}


export type ScrollOption = ({ smooth: true, velocity: number } | { smooth: false })
    & { done?: () => void }


@Injectable()
export class ScrollerService implements OnDestroy {
    public readonly destruct = new Destruct()
    public readonly vpImmediate: ImmediateViewport
    public readonly vpRender: RenderedViewport
    public orient: ScrollOrient

    public get scrollPercent(): ScrollPosition { return this.vpImmediate.scrollPercent }
    public get scrollPosition(): ScrollPosition { return this.vpImmediate.scrollPosition }
    public get verticalOverflow(): number { return Math.max(0, this.vpImmediate.scrollHeight - this.vpImmediate.height) }
    public get horizontalOverflow(): number { return Math.max(0, this.vpImmediate.scrollWidth - this.vpImmediate.width) }

    public scrollable: ScrollableDirective

    private activeMethod: ScrollingMethod = null
    private animation: ScrollerAnimation

    public constructor(@Inject(NgZone) protected readonly zone: NgZone) {
        this.zone.runOutsideAngular(() => {
            (this as any).vpImmediate = this.destruct.disposable(new ImmediateViewport());
            (this as any).vpRender = this.destruct.disposable(new RenderedViewport(this.vpImmediate))

            this.animation = new ScrollerAnimation((x, y, vx, vy) => {
                (this.vpRender as { virtualOffsetLeft: number }).virtualOffsetLeft = vx;
                (this.vpRender as { virtualOffsetTop: number }).virtualOffsetTop = vy
                this.vpRender.scrollPosition = {
                    top: y,
                    left: x
                }
            })
            this.destruct.disposable(this.animation)

            this.destruct.subscription(this.vpImmediate.change)
                .subscribe(() => {
                    this.scrollTo(this.vpImmediate.scrollPosition, { smooth: true, velocity: 1 })
                })
        })
    }

    public lockMethod(method: ScrollingMethod): boolean {
        if (!this.activeMethod) {
            this.activeMethod = method
            return true
        } else if (this.activeMethod === method) {
            return true
        }
        return false
    }

    public releaseMethod(method: ScrollingMethod): void {
        if (this.activeMethod && this.activeMethod === method) {
            this.activeMethod = null
        }
    }

    public methodIsLocked(method: ScrollingMethod): boolean {
        return this.activeMethod === method
    }

    public scrollTo(pos: Partial<ScrollPosition>, options: ScrollOption) {
        const target = this._scrollToTarget(pos)

        if (options.smooth) {
            const rendered = this.vpRender.scrollPosition
            this.animation.update({
                fromX: rendered.left,
                fromY: rendered.top,
                toX: target.left,
                toY: target.top,
                fromVX: this.vpRender.virtualOffsetLeft || 0,
                toVX: this.vpImmediate.virtualOffsetLeft || 0,
                fromVY: this.vpRender.virtualOffsetTop || 0,
                toVY: this.vpImmediate.virtualOffsetTop || 0,
                velocity: options.velocity
            })
            if (options.done) {
                this.animation.didDone(options.done)
            }
        } else {
            this.animation.stop();
            (this.vpRender as { virtualOffsetLeft: number }).virtualOffsetLeft = this.vpImmediate.virtualOffsetLeft;
            (this.vpRender as { virtualOffsetTop: number }).virtualOffsetTop = this.vpImmediate.virtualOffsetTop
            this.vpRender.scrollPosition = target
            if (options.done) {
                options.done()
            }
        }
    }

    private _scrollToTarget(desired: Partial<ScrollPosition>): ScrollPosition {
        const scrollPos = this.vpImmediate.scrollPosition
        let target: ScrollPosition = {
            top: desired.top != null ? desired.top : scrollPos.top,
            left: desired.left != null ? desired.left : scrollPos.left,
        }
        this.vpImmediate.scrollPosition = target
        return this.vpImmediate.scrollPosition
    }

    public scrollBy(pos: Partial<ScrollPosition>, options: ScrollOption) {
        const curr = this.vpImmediate.scrollPosition
        this.scrollTo({
            top: curr.top + (pos.top || 0),
            left: curr.left + (pos.left || 0),
        }, options)
    }

    public scrollIntoViewport(input: Node | RectProps | Array<Node | RectProps>, center: boolean = false): void {
        const visibleRect = this.vpImmediate.visible
        const elRect = this.convertToRectProps(input)
        let pos = { ...this.scrollPosition }

        if (!elRect) {
            return
        }

        let topSpace = elRect.top - visibleRect.top
        if (topSpace < 0) {
            pos.top -= Math.abs(topSpace)
        } else {
            let bottomSpace = visibleRect.bottom - elRect.bottom
            if (bottomSpace < 0) {
                pos.top -= bottomSpace
            }
        }

        let leftSpace = elRect.left - visibleRect.left
        if (leftSpace < 0) {
            pos.left -= Math.abs(leftSpace)
        } else {
            let rightSpace = visibleRect.right - elRect.right
            if (rightSpace < 0) {
                pos.left -= rightSpace
            }
        }

        if (center) {
            if (this.orient === "vertical") {
                if (elRect.height < visibleRect.height) {
                    pos.top = elRect.top - visibleRect.height / 2 + elRect.height / 2
                }
            } else {
                throw new Error("Not implemented")
            }
        }

        this.scrollTo(pos, { smooth: true, velocity: 0.5 })
    }

    public elementIsVisible(el: HTMLElement): boolean {
        const elRect = this.getElementImmediateRect(el)
        return this.vpImmediate.visible.isIntersect(elRect)
    }

    public getElementRenderedRect(el: HTMLElement): Rect {
        return this.scrollable?.getElementRect(el)
    }

    public getElementImmediateRect(el: Node) {
        const renderedRect = this.scrollable?.getElementRect(el)
        return renderedRect
    }


    public ngOnDestroy() {
        this.destruct.run()
    }

    private convertToRectProps(input: Node | RectProps | Array<Node | RectProps>): RectProps {
        if (Array.isArray(input)) {
            let converted: RectProps[] = input.map(this.convertToRectProps.bind(this))
            let rx = converted[0].x
            let ry = converted[0].y
            let rw = converted[0].width
            let rh = converted[0].height

            for (let i = 1; i < converted.length; i++) {
                const entry = converted[i]
                rx = Math.min(rx, entry.x)
                ry = Math.min(ry, entry.y)
                rw = Math.max(rw, entry.width)
                rh = Math.max(rh, entry.height)
            }
            return {
                top: ry,
                left: rx,
                right: rx + rw,
                bottom: ry + rh,
                x: rx,
                y: ry,
                width: rw,
                height: rh
            }
        } else if (input instanceof Node) {
            return this.getElementImmediateRect(input)
        } else {
            return input
        }
    }
}





interface AnimProps {
    fromX: number
    toX: number
    fromY: number
    toY: number
    fromVX: number
    toVX: number
    fromVY: number
    toVY: number
    velocity: number
}


class ScrollerAnimation extends Animation<AnimProps> implements AnimProps, IDisposable {
    public readonly fromX: number
    public readonly toX: number
    public readonly fromY: number
    public readonly toY: number
    public readonly fromVX: number
    public readonly toVX: number
    public readonly fromVY: number
    public readonly toVY: number
    public readonly velocity: number

    private _trans = this.transition(easeOutCubic, (diff) => Math.max(1, Math.abs(diff) * this.velocity))
    private _transV = this.transition(easeLineral)

    public constructor(private onTick: (x: number, y: number, vx: number, vy: number) => void) {
        super()
    }

    protected tick(timestamp: number): boolean {
        const x = this._trans(timestamp, this.fromX, this.toX)
        const y = this._trans(timestamp, this.fromY, this.toY)
        const vx = this._transV(timestamp, this.fromVX, this.toVX)
        const vy = this._transV(timestamp, this.fromVY, this.toVY)

        this.onTick(x.value, y.value, vx.value, vy.value)

        return !(x.progress === 1.0 && y.progress === 1.0 && vx.progress === 1.0 && vy.progress === 1.0 && !isNaN(x.value) && !isNaN(y.value))
    }
}
