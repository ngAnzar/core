import { Component, ViewChild, ElementRef, Inject, Input, ChangeDetectionStrategy, OnInit } from "@angular/core"
import { coerceBooleanProperty } from "@angular/cdk/coercion"

import { Destructible, __zone_symbol__ } from "../../util"
import { NzTouchEvent, TouchEventService } from "../../common.module"

const SET_TIMEOUT = __zone_symbol__("setTimeout")


@Component({
    selector: ".nz-exheader",
    templateUrl: "./exheader.component.pug",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExheaderComponent extends Destructible {
    @ViewChild("header", { read: ElementRef, static: true }) public readonly headerEl: ElementRef<HTMLElement>
    @ViewChild("content", { read: ElementRef, static: true }) public readonly contentEl: ElementRef<HTMLElement>

    @Input()
    public set disabled(val: boolean) {
        val = coerceBooleanProperty(val)
        if (this._disabled !== val) {
            this._disabled = val
        }
    }
    public get disabled(): boolean { return this._disabled }
    private _disabled: boolean

    @Input() public headerMinHeight: number = 48
    public get headerMaxHeight() { return this.headerEl.nativeElement.scrollHeight }

    @Input()
    public set elevated(val: boolean) {
        val = coerceBooleanProperty(val)
        if (this._elevated !== val) {
            this._elevated = val
        }
    }
    public get elevated(): boolean { return this._elevated }
    private _elevated: boolean

    public set expanded(val: boolean) {
        if (this._expanded !== val) {
            this._expanded = val
            this._animateHeight(val ? this.headerMaxHeight : this.headerMinHeight)
        }
    }
    public get expanded(): boolean { return this._expanded }
    private _expanded: boolean = false

    public disablePan: boolean = false

    private _panStartPos: number
    private _headerStartHeight: number
    private _disablePan: boolean = false
    private _lastPercent: number
    private _isSelf: boolean = false

    public constructor(
        @Inject(ElementRef) el: ElementRef<HTMLElement>,
        @Inject(TouchEventService) touchEventSvc: TouchEventService) {
        super()

        this.destruct.any(touchEventSvc.addEventListener(el.nativeElement, "pan", this.onPan, true))
        this.destruct.any(touchEventSvc.addEventListener(el.nativeElement, "pan", this.onPanSelf, false))
    }

    private onPan = (event: NzTouchEvent) => {
        if (event.defaultPrevented || event.pointerType !== "touch") {
            return
        }
        if (event.orient === "horizontal") {
            return
        }

        if (!this._disablePan && !this.disablePan) {
            this._initResize(event)

            if (!this._isSelf) {
                this._doResize(event)
            }
        }

        this._finalEvent(event)
    }

    private onPanSelf = (event: NzTouchEvent) => {
        if (event.defaultPrevented || event.pointerType !== "touch") {
            return
        }
        if (event.orient === "horizontal") {
            return
        }

        this._initResize(event)
        this._isSelf = true
        this._doResize(event)
        this._finalEvent(event)
    }

    private _initResize(event: NzTouchEvent) {
        if (this._panStartPos == null) {
            this._panStartPos = event.clientY
            this._headerStartHeight = this.headerEl.nativeElement.offsetHeight
            this._lastPercent = 0
            this._isSelf = false
        }
    }

    private _doResize(event: NzTouchEvent) {
        if (event.isFinal) {
            const percent = this._lastPercent
            const expanded = this.expanded
            this._expanded = null

            if (expanded) {
                if (percent <= 0.8) {
                    this.expanded = false
                } else {
                    this.expanded = true
                }
            } else if (percent >= 0.2) {
                this.expanded = true
            } else {
                this.expanded = false
            }

            event.preventDefault()
        } else {
            const headerMaxHeight = this.headerEl.nativeElement.scrollHeight
            const headerMinHeight = this.headerMinHeight
            const distance = event.clientY - this._panStartPos

            let newHeight = this._headerStartHeight + distance

            this._lastPercent = (newHeight - headerMinHeight) / (headerMaxHeight - headerMinHeight)
            if (newHeight >= headerMinHeight && newHeight <= headerMaxHeight) {
                this.headerEl.nativeElement.style.height = `${newHeight}px`
                event.preventDefault()
            }
        }
    }

    private _finalEvent(event: NzTouchEvent) {
        if (event.isFinal) {
            delete this._panStartPos
            delete this._headerStartHeight
            delete this._disablePan
        }
    }

    private _animateHeight(height: number) {
        const el = this.headerEl.nativeElement
        el.style.transition = "height 150ms cubic-bezier(0.5, 1, 0.89, 1)"
        el.style.height = `${height}px`
        window[SET_TIMEOUT](() => el.style.transition = "none", 160)
    }
}
