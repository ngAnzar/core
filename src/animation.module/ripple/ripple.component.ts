import { Component, Inject, ElementRef, OnInit, OnDestroy } from "@angular/core"
import { EventManager } from "@angular/platform-browser"
import { FocusMonitor, FocusOrigin } from "@angular/cdk/a11y"

import { NzTouchEvent } from "../../common.module"
import { Destruct } from "../../util"
import { RippleService } from "./ripple.service"
import { RippleRef } from "./ripple-ref"



@Component({
    selector: ".nz-ripple",
    template: ""
})
export class RippleComponent implements OnInit, OnDestroy {
    public readonly destruct = new Destruct()

    protected _focus: RippleRef

    public constructor(
        @Inject(ElementRef) protected readonly el: ElementRef<HTMLElement>,
        @Inject(RippleService) protected readonly service: RippleService,
        @Inject(FocusMonitor) protected readonly focusMonitor: FocusMonitor,
        @Inject(EventManager) protected readonly eventMgr: EventManager) {
        this.destruct.any(this.hideFocus)
    }

    public ngOnInit() {
        const trigger = this.el.nativeElement.parentElement

        this.destruct.subscription(this.focusMonitor.monitor(trigger)).subscribe(origin => {
            if (origin === "keyboard" || origin === "program") {
                this.showFocus()
            } else {
                this.hideFocus()
            }
        })

        // TODO: hide only on tapend
        this.destruct.any(this.eventMgr.addEventListener(trigger, "tap", (event: NzTouchEvent) => {
            this.hideFocus()
            const bound = this.el.nativeElement.getBoundingClientRect()
            this.service.launch(this.el, {
                x: event.clientX - bound.left,
                y: event.clientY - bound.top
            })
        }) as any)
    }

    public ngOnDestroy() {
        this.destruct.run()
    }

    private showFocus() {
        if (!this._focus) {
            this._focus = this.service.launch(this.el, {
                centered: true,
                yoyo: true
            })
        }
    }

    private hideFocus = () => {
        if (this._focus) {
            this._focus.dispose()
            this._focus = null
        }
    }
}
