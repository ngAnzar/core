import { Component, Inject, ElementRef, OnInit, OnDestroy } from "@angular/core"
import { EventManager } from "@angular/platform-browser"
import { FocusMonitor, FocusOrigin } from "@angular/cdk/a11y"


import { Destruct } from "../../util"
import { RippleService } from "./ripple.service"
import { RippleRef } from "./ripple-ref"



@Component({
    selector: ".nz-ripple",
    template: ""
})
export class RippleComponent implements OnInit, OnDestroy {
    public readonly destruct = new Destruct(() => {
        if (this.hammer) {
            this.hammer.destroy()
            delete this.hammer
        }
    })

    protected _focus: RippleRef;

    protected hammer: HammerManager

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

        this.destruct.any(this.eventMgr.addEventListener(trigger, "tap", (event: any) => {
            let detail = event.detail.events[0]

            this.hideFocus();
            const bound = this.el.nativeElement.getBoundingClientRect()
            this.service.launch(this.el, {
                x: detail.clientX - bound.left,
                y: detail.clientY - bound.top
            })
            // if (event.type === "mousedown") {

            // } else if (event.type === "touchstart") {
            //     const touches = event.changedTouches
            //     for (let i = 0; i < touches.length; i++) {
            //         this.service.launch(this.el, {
            //             x: touches[i].clientX - bound.left,
            //             y: touches[i].clientY - bound.top
            //         })
            //     }
            // }
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
