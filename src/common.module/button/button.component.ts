import { Component, ElementRef, Inject, Input, Output, EventEmitter, OnDestroy, OnInit, HostBinding, HostListener, ChangeDetectionStrategy, ChangeDetectorRef } from "@angular/core"
import { FocusMonitor } from "@angular/cdk/a11y"

import { AnzarComponent } from "../abstract-component"


@Component({
    selector: ".nz-button",
    templateUrl: "./button.pug"
})
export class ButtonComponent extends AnzarComponent implements OnDestroy, OnInit {
    @Output() public action: EventEmitter<any> = new EventEmitter<any>()

    @HostBinding("attr.type")
    @Input()
    public type: string = "button"

    // protected boundedRipple: BoundedRippleRef

    constructor(
        @Inject(ElementRef) protected readonly el: ElementRef<HTMLButtonElement>,
        @Inject(FocusMonitor) protected focusMonitor: FocusMonitor) {
        super()
    }

    public ngOnInit() {
        this.destruct.subscription(this.focusMonitor.monitor(this.el.nativeElement)).subscribe((origin) => {
            this.focusOrigin = origin
            if (origin) {
                this.el.nativeElement.setAttribute("focused", origin)
            } else {
                this.el.nativeElement.removeAttribute("focused")
            }
        })
        this.destruct.any(() => {
            this.focusMonitor.stopMonitoring(this.el.nativeElement)
        })
    }

    @HostListener("tap", ["$event"])
    protected _handleTap(event: Event) {
        if (event.defaultPrevented) {
            return
        }
        if (this.disabled) {
            event.stopImmediatePropagation()
        } else {
            event.stopPropagation()
            this.action.next()
        }
    }
}
