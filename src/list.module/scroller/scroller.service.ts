import { OnDestroy, NgZone, Inject } from "@angular/core"
import { Observable, Subject, Subscription, merge } from "rxjs"
import { startWith } from "rxjs/operators"

import { Destruct, IDisposable } from "../../util"
import { Rect } from "../../layout.module"
import { ScrollableDirective } from "./scrollable.directive"


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

            this._scrollPercent = { top, left }

            this._recalcPosition();

            (this.scroll as Subject<ScrollEvent>)
                .next(this._lastEvent = new ScrollEvent(this._scrollPercent, this._scrollPosition, deltaTop, deltaLeft, directionX, directionY))
        }
    }
    public get scrollPercent(): ScrollPosition { return this._scrollPercent }
    protected _scrollPercent: ScrollPosition = { top: 0, left: 0 }


    public set scrollPosition(val: ScrollPosition) {
        const left = val ? val.left || 0 : 0
        const top = val ? val.top || 0 : 0

        this.scrollPercent = {
            top: top / (this.scrollHeight - this.height),
            left: left / (this.scrollWidth - this.width)
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
        this.visible.left = pxLeft;
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
            this.visible.height = this.height;
            // this._recalcPosition();
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
            if (this._lastEvent) {
                (this.scroll as Subject<ScrollEvent>).next(this._lastEvent)
            }
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



export class ScrollerService implements OnDestroy {
    public readonly destruct = new Destruct()
    public readonly vpImmediate: ImmediateViewport
    public readonly vpRender: RenderedViewport

    public set scrollPercent(val: ScrollPosition) { this.vpImmediate.scrollPercent = val }
    public get scrollPercent(): ScrollPosition { return this.vpImmediate.scrollPercent }

    public set scrollPosition(val: ScrollPosition) { this.vpImmediate.scrollPosition = val }
    public get scrollPosition(): ScrollPosition { return this.vpImmediate.scrollPosition }

    public get verticalOverflow(): number { return Math.max(0, this.vpImmediate.scrollHeight - this.vpImmediate.height) }
    public get horizontalOverflow(): number { return Math.max(0, this.vpImmediate.scrollWidth - this.vpImmediate.width) }

    public scrollable: ScrollableDirective

    public velocityX: number = 1 // pixel / ms
    public velocityY: number = 1 // pixel / ms
    private activeMethod: ScrollingMethod = null
    private rafId: any
    private _animationTick: (timestamp: number) => void

    public constructor(@Inject(NgZone) protected readonly zone: NgZone) {
        this.zone.runOutsideAngular(() => {
            (this as any).vpImmediate = this.destruct.disposable(new ImmediateViewport());
            (this as any).vpRender = this.destruct.disposable(new RenderedViewport(this.vpImmediate))

            const easeOutQuart = (t: number) => { return 1 - (--t) * t * t * t }
            const easeOutCubic = (t: number) => { return (--t) * t * t + 1 }

            let animBegin = 0
            let lastImmediatePos: ScrollPosition
            let lastRenderPos: ScrollPosition
            let animDuration = 400
            this._animationTick = (timestamp: number): void => {
                if (this.destruct.done) {
                    return
                }

                const tpos = (this.vpImmediate as any)._scrollPosition as ScrollPosition
                const rpos = (this.vpRender as any)._scrollPosition as ScrollPosition

                if (!lastRenderPos || !lastImmediatePos || lastImmediatePos.left !== tpos.left || lastImmediatePos.top !== tpos.top) {
                    lastImmediatePos = tpos
                    lastRenderPos = rpos
                    animBegin = timestamp
                }

                let topDiff = lastImmediatePos.top - lastRenderPos.top
                let leftDiff = lastImmediatePos.left - lastRenderPos.left

                if (topDiff !== 0 || leftDiff !== 0) {
                    let progress = (timestamp - animBegin) / animDuration * this.velocityY
                    if (progress <= 1.0) {
                        // let easing = easeOutQuart(progress)
                        let easing = easeOutCubic(progress)

                        this.vpRender.scrollPosition = {
                            top: lastRenderPos.top + topDiff * easing,
                            left: lastRenderPos.left + leftDiff * easing
                        }

                        this.rafId = requestAnimationFrame(this._animationTick)
                        return
                    } else {
                        this.vpRender.scrollPosition = {
                            top: lastRenderPos.top + topDiff,
                            left: lastRenderPos.left + leftDiff
                        }
                    }
                }

                if (this.rafId) {
                    cancelAnimationFrame(this.rafId)
                    delete this.rafId
                }
            }
        })

        this.destruct.any(() => {
            if (this.rafId) {
                cancelAnimationFrame(this.rafId)
                delete this.rafId
            }
        })

        this.destruct.subscription(merge(this.vpImmediate.change, this.vpImmediate.scroll)).subscribe(event => {
            if (this.horizontalOverflow || this.verticalOverflow) {
                if (!this.rafId) {
                    this.zone.runOutsideAngular(() => {
                        this.rafId = requestAnimationFrame(this._animationTick)
                    })
                }
            } else if (this.rafId) {
                cancelAnimationFrame(this.rafId)
                delete this.rafId
            }
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

    public scrollIntoViewport(el: HTMLElement): void {
        const visibleRect = this.vpImmediate.visible
        const elRect = this.getElementImmediateRect(el)
        let pos = { ...this.scrollPosition }

        console.log(visibleRect, elRect)

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

        this.scrollPosition = pos
    }

    public elementIsVisible(el: HTMLElement): boolean {
        const elRect = this.getElementRenderedRect(el)
        return this.vpRender.visible.contains(elRect)
    }

    public getElementRenderedRect(el: HTMLElement): Rect {
        return this.scrollable!.getElementRect(el)
    }

    public getElementImmediateRect(el: HTMLElement) {
        const renderedRect = this.scrollable!.getElementRect(el)
        const immediatePos = this.vpImmediate.scrollPosition
        const renderedPos = this.vpRender.scrollPosition
        const topDiff = immediatePos.top - renderedPos.top
        const leftDiff = immediatePos.left - renderedPos.left

        renderedRect.top -= topDiff
        renderedRect.left -= leftDiff
        return renderedRect
    }


    public ngOnDestroy() {
        this.destruct.run()
    }
}
