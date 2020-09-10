import { Component, Inject, ElementRef, OnInit, OnDestroy } from "@angular/core"
import { EventManager } from "@angular/platform-browser"
import { FocusMonitor } from "@angular/cdk/a11y"

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
    }

    public ngOnInit() {
        const trigger = this.el.nativeElement.parentElement

        // TODO: hide only on tapend
        this.destruct.any(this.eventMgr.addEventListener(trigger, "tap", (event: NzTouchEvent) => {
            this.service.launch(this.el, {
                mouse: { x: event.clientX, y: event.clientY }
            })
        }) as any)
    }

    public ngOnDestroy() {
        this.destruct.run()
    }
}
