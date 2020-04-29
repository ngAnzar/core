import { Component, HostListener, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, ElementRef, Inject } from "@angular/core"
import { Subject } from "rxjs"

import { Destructible, Point, __zone_symbol__ } from "../../util"
import type { NzTouchEvent } from "../../common.module"
import type { SlideableDirection } from "./slideable.directive"

const SET_TIMEOUT = __zone_symbol__("setTimeout")


/**
 * .nz-slideable
 *      div CONTENT
 *      div(nzSlideableBack="left")
 *      div(nzSlideableBack="right")
 */


@Component({
    selector: ".nz-slideable",
    templateUrl: "./slideable.component.pug",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SlideableComponent extends Destructible {
    @ViewChild("content", { static: true, read: ElementRef }) public readonly contentEl: ElementRef<HTMLElement>

    public readonly begin = this.destruct.subject(new Subject<SlideableDirection>())
    public readonly end = this.destruct.subject(new Subject<SlideableDirection>())

    public set backIsVisible(val: boolean) {
        if (this._backIsVisible !== val) {
            this._backIsVisible = val
            this.cdr.markForCheck()
        }
    }
    public get backIsVisible(): boolean { return this._backIsVisible }
    public _backIsVisible: boolean = false

    private _panStart: number
    private _panDirection: SlideableDirection

    public constructor(@Inject(ChangeDetectorRef) private readonly cdr: ChangeDetectorRef) {
        super()
    }

    @HostListener("pan", ["$event"])
    public _onPan(event: NzTouchEvent) {
        if (event.defaultPrevented || event.orient !== "horizontal") {
            return
        }

        event.preventDefault()

        if (event.isFinal) {
            this.end.next(this._panDirection)
            delete this._panStart
            delete this._panDirection
        } else {
            if (!this._panStart) {
                this._panStart = event.clientX
                this._panDirection = event.direction as any
                this.begin.next(this._panDirection)
                this.backIsVisible = true
            }

            const distance = event.clientX - this._panStart
            this.contentEl.nativeElement.style.transform = `translate(${distance}px, 0)`
        }
    }

    public scrollOut(direction: SlideableDirection) {
        this._animatePosition(direction === "left" ? "-100%" : "100%", true)
    }

    public resetScroll() {
        this._animatePosition("0%", false)
    }

    public _animatePosition(translate: string, visibleAfter: boolean) {
        const el = this.contentEl.nativeElement
        el.style.transition = "transform 150ms cubic-bezier(0.5, 1, 0.89, 1)"
        el.style.transform = `translate(${translate}, 0)`

        window[SET_TIMEOUT](() => {
            el.style.transition = "none"
            this.backIsVisible = visibleAfter
        }, 160)
    }
}
