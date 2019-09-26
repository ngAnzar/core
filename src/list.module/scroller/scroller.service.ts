import { OnDestroy, NgZone, Inject } from "@angular/core"
import { Observable, Subject, Subscription, merge } from "rxjs"
import { startWith } from "rxjs/operators"

import { Destruct, IDisposable } from "../../util"
import { Rect } from "../../layout.module"
import { ScrollableDirective } from "./scrollable.directive"


const Zone = (window as any).Zone
const __zone_symbol__ =
    (typeof Zone !== "undefined") && (Zone as any)["__symbol__"] || function (v: string): string {
        return "__zone_symbol__" + v;
    };
const RAF: "requestAnimationFrame" = __zone_symbol__("requestAnimationFrame");


export type ScrollOrient = "horizontal" | "vertical"


export interface ScrollPosition {
    readonly top: number;
    readonly left: number;
}


export type ScrollingMethod = "drag" | "wheel" | "pan"


export class ScrollEvent {
    public constructor(
        public readonly percent: ScrollPosition,
        public readonly position: ScrollPosition,
        public readonly deltaTop: number,
        public readonly deltaLeft: number,
        public readonly directionX: number,
        public readonly directionY: number) {
    }
}


export interface ViewportDimensions {
    readonly scrollWidth: number
    readonly scrollHeight: number
    readonly width: number
    readonly height: number
    readonly top: number
    readonly left: number
}


export abstract class Viewport implements ViewportDimensions, IDisposable {
    public abstract readonly scrollWidth: number
    public abstract readonly scrollHeight: number
    public abstract readonly width: number
    public abstract readonly height: number
    public abstract readonly top: number
    public abstract readonly left: number
    public abstract readonly visible: Rect

    public readonly scroll: Observable<ScrollEvent> = new Subject<ScrollEvent>()
    protected _lastEvent: ScrollEvent

    public set scrollPercent(val: ScrollPosition) {
        const old = this._scrollPercent

        const oldLeft = old ? old.left : 0
        const oldTop = old ? old.top : 0
        const left = val ? constrainPercent(val.left) : 0
        const top = val ? constrainPercent(val.top) : 0
        const directionX = oldLeft > left ? -1 : oldLeft === left ? 0 : 1
        const directionY = oldTop > top ? -1 : oldTop === top ? 0 : 1

        if (directionX || directionY) {
            const deltaTop = oldTop - top
            const deltaLeft = oldLeft - left

            if (deltaTop || deltaLeft) {
                this._scrollPercent = { top, left }

                this._recalcPosition();

                (this.scroll as Subject<ScrollEvent>)
                    .next(this._lastEvent = new ScrollEvent(this._scrollPercent, this._scrollPosition, deltaTop, deltaLeft, directionX, directionY))
            }
        }
    }
    public get scrollPercent(): ScrollPosition { return this._scrollPercent }
    protected _scrollPercent: ScrollPosition = { top: 0, left: 0 }


    public set scrollPosition(val: ScrollPosition) {
        const maxTop = Math.max(0, this.scrollHeight - this.height)
        const maxLeft = Math.max(0, this.scrollWidth - this.width)
        const top = Math.min(val ? Math.round(val.top) || 0 : 0, maxTop)
        const left = Math.min(val ? Math.round(val.left) || 0 : 0, maxLeft)

        this.scrollPercent = {
            top: (top / (this.scrollHeight - this.height)) || 0,
            left: (left / (this.scrollWidth - this.width)) || 0
        }
    }
    public get scrollPosition(): ScrollPosition { return this._scrollPosition }
    protected _scrollPosition: ScrollPosition = { top: 0, left: 0 }

    public dispose() {
        (this.scroll as Subject<any>).complete()
        delete (this as any).scroll
    }

    public abstract update(dim: ViewportDimensions): boolean

    protected _recalcPosition() {
        const percent = this._scrollPercent
        const pxTop = Math.round(((this.scrollHeight - this.height) * percent.top)) || 0
        const pxLeft = Math.round(((this.scrollWidth - this.width) * percent.left)) || 0

        this._scrollPosition = {
            top: pxTop,
            left: pxLeft
        }
        this.visible.top = pxTop
        this.visible.left = pxLeft
    }
}


export class ImmediateViewport extends Viewport {
    public readonly scrollWidth: number = 0
    public readonly scrollHeight: number = 0
    public readonly width: number = 0
    public readonly height: number = 0
    public readonly top: number = 0
    public readonly left: number = 0
    public readonly visible: Rect = new Rect(0, 0, 0, 0)

    public readonly change: Observable<Viewport> = new Subject<Viewport>()

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
            this._recalcPosition();
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

        this.vpChange = main.change.pipe(startWith()).subscribe(() => {
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
    private animation: Animation

    public constructor(@Inject(NgZone) protected readonly zone: NgZone) {
        this.zone.runOutsideAngular(() => {
            (this as any).vpImmediate = this.destruct.disposable(new ImmediateViewport());
            (this as any).vpRender = this.destruct.disposable(new RenderedViewport(this.vpImmediate))

            this.animation = new Animation((x, y) => {
                this.vpRender.scrollPosition = {
                    top: y,
                    left: x
                }
            })
            this.destruct.disposable(this.animation)
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
        const scrollPos = this.vpImmediate.scrollPosition
        let target: ScrollPosition = {
            top: pos.top != null ? pos.top : scrollPos.top,
            left: pos.left != null ? pos.left : scrollPos.left,
        }
        this.vpImmediate.scrollPosition = target
        target = this.vpImmediate.scrollPosition
        if (options.smooth) {
            const rendered = this.vpRender.scrollPosition
            this.animation.update({
                fromX: rendered.left,
                fromY: rendered.top,
                toX: target.left,
                toY: target.top,
                velocity: options.velocity
            })
            if (options.done) {
                this.animation.didDone(options.done)
            }
        } else {
            this.animation.stop()
            this.vpRender.scrollPosition = target
            if (options.done) {
                options.done()
            }
        }
    }

    public scrollIntoViewport(el: Node): void {
        const visibleRect = this.vpImmediate.visible
        const elRect = this.getElementImmediateRect(el)
        let pos = { ...this.scrollPosition }

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

        this.scrollTo(pos, { smooth: true, velocity: 1 })
    }

    public elementIsVisible(el: HTMLElement): boolean {
        const elRect = this.getElementImmediateRect(el)
        return this.vpImmediate.visible.isIntersect(elRect)
    }

    public getElementRenderedRect(el: HTMLElement): Rect {
        return this.scrollable!.getElementRect(el)
    }

    public getElementImmediateRect(el: Node) {
        const renderedRect = this.scrollable!.getElementRect(el)
        return renderedRect
    }


    public ngOnDestroy() {
        this.destruct.run()
    }
}


interface AnimProps {
    fromX: number
    toX: number
    fromY: number
    toY: number
    velocity: number
}


class Animation implements AnimProps, IDisposable {
    public readonly fromX: number
    public readonly toX: number
    public readonly fromY: number
    public readonly toY: number
    public readonly velocity: number

    private beginTime: number
    private rafId: any
    private _pending: Partial<AnimProps>
    private _lastFrameTime: number
    private _doneListeners: Array<() => void> = []

    public constructor(private onTick: (x: number, y: number) => void) {

    }

    public didDone(cb: () => void) {
        this._doneListeners.push(cb)
    }

    public update(props: Partial<AnimProps>) {
        this._pending = props
        this.play()
    }

    private _update(): boolean {
        if (this._pending) {
            const pending = this._pending
            delete this._pending
            let changed = false
            for (const k in pending) {
                if (pending.hasOwnProperty(k)) {
                    const value = (pending as any)[k]
                    const selfValue = (this as any)[k]
                    if (value !== selfValue) {
                        (this as any)[k] = value
                        changed = true
                    }
                }
            }
            return changed
        }
        return false
    }

    private tick = (timestamp: number) => {
        const changed = this._update()

        if (this.beginTime == null || changed) {
            this.beginTime = this._lastFrameTime
        }

        this._lastFrameTime = timestamp
        const x = this.calc(timestamp, this.fromX, this.toX)
        const y = this.calc(timestamp, this.fromY, this.toY)

        this.onTick(x.value, y.value)

        if (!changed && x.progress === 1.0 && y.progress === 1.0) {
            this.stop()
        } else {
            this.rafId = window[RAF](this.tick)
        }
    }

    private calc(timestamp: number, from: number, to: number): { progress: number, value: number } {
        const diff = to - from
        if (diff !== 0) {
            const duration = Math.max(1, Math.abs(diff) * this.velocity)
            const progress = Math.min(1.0, (timestamp - this.beginTime) / duration)
            const value = from + diff * easeOutCubic(progress)
            // const value = progress <= 1.0 ? from + diff * progress : to
            return { progress, value }
        } else {
            return { progress: 1.0, value: to }
        }
    }

    public play() {
        if (!this.rafId) {
            this.rafId = window[RAF](this.tick)
        }
    }

    public stop() {
        if (this.rafId) {
            cancelAnimationFrame(this.rafId)
            delete this.rafId
            delete this.beginTime

            for (const cb of this._doneListeners) {
                cb()
            }
            this._doneListeners.length = 0
        }
    }

    public dispose() {
        this.stop()
    }
}


function easeOutQuart(t: number) {
    return 1 - (--t) * t * t * t
}

function easeOutCubic(t: number) {
    return (--t) * t * t + 1
}
