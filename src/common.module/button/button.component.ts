import { Component, ElementRef, Inject, Input, Output, EventEmitter, HostListener, OnDestroy, OnInit } from "@angular/core"
import { FocusMonitor, FocusOrigin } from "@angular/cdk/a11y"

import { RippleService, BoundedRippleRef } from "../../animation.module"
import { AnzarComponent } from "../abstract-component"


export interface ButtonEvent {
    source: ButtonComponent
}


@Component({
    selector: ".nz-button, .nz-icon-button, .nz-fab",
    templateUrl: "./button.pug",
    host: {
        "(click)": "_preventEvent($event)",
        "(mousedown)": "_preventEvent($event)",
        "(mouseup)": "_preventEvent($event)"
    }
})
export class ButtonComponent extends AnzarComponent implements OnDestroy, OnInit {
    @Output() public action: EventEmitter<ButtonEvent> = new EventEmitter<ButtonEvent>()

    protected boundedRipple: BoundedRippleRef

    constructor(
        @Inject(ElementRef) protected readonly el: ElementRef<HTMLButtonElement>,
        @Inject(FocusMonitor) protected focusMonitor: FocusMonitor,
        @Inject(RippleService) protected rippleService: RippleService) {
        super()

        this.boundedRipple = rippleService.attach(el, el)
        this.destruct.disposable(this.boundedRipple)
    }

    public ngOnInit() {
        this.destruct.subscription(this.focusMonitor.monitor(this.el.nativeElement)).subscribe((origin) => {
            this.boundedRipple.handleFocus(origin)
            this.focusOrigin = origin
        })
        this.destruct.any(() => {
            this.focusMonitor.stopMonitoring(this.el.nativeElement)
        })
    }

    protected _preventEvent(event: Event) {
        if (this.disabled) {
            event.stopImmediatePropagation()
            event.preventDefault()
        }
    }
}
