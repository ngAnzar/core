import { Component, ElementRef, Inject, Input, Output, EventEmitter, HostListener, OnDestroy, OnInit } from "@angular/core"
import { FocusMonitor, FocusOrigin } from "@angular/cdk/a11y"

import { AnzarComponent } from "../anzar.component"
import { RippleService, BoundedRipple } from "../../ripple/ripple.service"


export interface ButtonEvent {
    source: ButtonComponent
}


@Component({
    selector: ".nz-button, .nz-icon-button, .nz-fab",
    templateUrl: "./button.pug",
    providers: [RippleService],
    host: {
        "(click)": "_preventEvent($event)",
        "(mousedown)": "_preventEvent($event)",
        "(mouseup)": "_preventEvent($event)"
    }
})
export class ButtonComponent extends AnzarComponent implements OnDestroy, OnInit {
    @Output() public action: EventEmitter<ButtonEvent> = new EventEmitter<ButtonEvent>()

    protected boundedRipple: BoundedRipple


    constructor(@Inject(ElementRef) el: ElementRef<HTMLButtonElement>,
        @Inject(FocusMonitor) protected focusMonitor: FocusMonitor,
        @Inject(RippleService) protected rippleService: RippleService) {
        super(el)

        this.boundedRipple = rippleService.attach(el, el)
    }


    public ngOnInit() {
        this.focusMonitor.monitor(this.el.nativeElement).subscribe((origin) => {
            this.boundedRipple.handleFocus(origin)
            this.focused = origin
        })
    }

    public ngOnDestroy() {
        this.focusMonitor.stopMonitoring(this.el.nativeElement)
        this.rippleService.dispose()
    }

    protected _preventEvent(event: Event) {
        if (this.disabled) {
            event.stopImmediatePropagation()
            event.preventDefault()
        }
    }
}
