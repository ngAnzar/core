import { Component, Inject, ElementRef, OnInit, OnDestroy, NgZone } from "@angular/core"
import { FocusMonitor, FocusOrigin } from "@angular/cdk/a11y"
import "hammerjs"


import { Destruct } from "../../util"
import { PointerEventService } from "../../common.module/services/pointer-event.service"
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
        @Inject(PointerEventService) protected readonly pointerEvents: PointerEventService,
        @Inject(NgZone) protected readonly zone: NgZone) {
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

        // this.zone.runOutsideAngular(() => {
        //     this.hammer = new Hammer(trigger, {})
        //     this.hammer.on("touch", (event) => {
        //         console.log(event)
        //     })
        // })


        this.destruct.subscription(this.pointerEvents.down(trigger)).subscribe(event => {
            if (event.defaultPrevented) {
                return;
            }

            this.hideFocus();
            const bound = this.el.nativeElement.getBoundingClientRect()
            if (event.type === "mousedown") {
                this.service.launch(this.el, {
                    x: event.clientX - bound.left,
                    y: event.clientY - bound.top
                })
            } else if (event.type === "touchstart") {
                const touches = event.changedTouches
                for (let i = 0; i < touches.length; i++) {
                    this.service.launch(this.el, {
                        x: touches[i].clientX - bound.left,
                        y: touches[i].clientY - bound.top
                    })
                }
            }
        })
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
