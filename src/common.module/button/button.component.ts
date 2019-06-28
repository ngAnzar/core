import { Component, ElementRef, Inject, Input, Output, EventEmitter, OnDestroy, OnInit, HostBinding, HostListener } from "@angular/core"
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
        event.preventDefault()
        if (this.disabled) {
            event.stopImmediatePropagation()
        } else {
            this.action.next()
        }
    }
}
