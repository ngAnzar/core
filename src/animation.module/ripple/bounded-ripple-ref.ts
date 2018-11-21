import { ElementRef } from "@angular/core"
import { FocusOrigin } from "@angular/cdk/a11y"
import { fromEvent } from "rxjs"

import { Destruct, IDisposable } from "../../util"
import { RippleRef } from "./ripple-ref"
import { RippleService } from "./ripple.service"


export class BoundedRippleRef implements IDisposable {
    public readonly destruct = new Destruct(() => {
        delete this.service
        delete this.trigger
        delete this.container
    })
    private _focus: RippleRef

    constructor(protected service: RippleService,
        protected trigger: ElementRef<HTMLElement>,
        protected container: ElementRef<HTMLElement>) {

        this.destruct.subscription(fromEvent(this.trigger.nativeElement, "mousedown")).subscribe(this._onMouseDown)
        this.destruct.subscription(fromEvent(this.trigger.nativeElement, "touchstart")).subscribe(this._onTouchStart)
    }

    public dispose() {
        this.destruct.run()
    }

    public handleFocus = (origin: FocusOrigin) => {
        if (origin === "keyboard" || origin === "program") {
            if (!this._focus) {
                this._focus = this.service.launch(this.container, {
                    centered: true,
                    yoyo: true
                })
                this._focus.destruct.any(() => {
                    this._focus = null
                })
                this.destruct.disposable(this._focus)
            }
        } else if (this._focus) {
            this._focus.dispose()
        }
    }

    protected _onMouseDown = (event: MouseEvent) => {
        if (event.defaultPrevented) {
            return
        }

        if (this._focus) {
            this._focus.dispose()
        }

        const bound = this.container.nativeElement.getBoundingClientRect()
        this.service.launch(this.container, {
            x: event.clientX - bound.left,
            y: event.clientY - bound.top
        })
    }

    protected _onTouchStart = (event: TouchEvent) => {
        if (event.defaultPrevented) {
            return
        }

        if (this._focus) {
            this._focus.dispose()
        }

        const touches = event.changedTouches
        const bound = this.container.nativeElement.getBoundingClientRect()

        for (let i = 0; i < touches.length; i++) {
            this.service.launch(this.container, {
                x: touches[i].clientX - bound.left,
                y: touches[i].clientY - bound.top
            })
        }
    }
}
