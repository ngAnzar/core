import { Component, ElementRef, Inject, Input, Output, EventEmitter, OnDestroy, OnInit, HostBinding } from "@angular/core"
import { FocusMonitor } from "@angular/cdk/a11y"

import { AnzarComponent } from "../abstract-component"


export interface ButtonEvent {
    source: ButtonComponent
}


@Component({
    selector: ".nz-button, .nz-fab",
    templateUrl: "./button.pug",
    host: {
        "(click)": "_preventEvent($event)",
        "(mousedown)": "_preventEvent($event)",
        "(mouseup)": "_preventEvent($event)"
    }
})
export class ButtonComponent extends AnzarComponent implements OnDestroy, OnInit {
    @Output() public action: EventEmitter<ButtonEvent> = new EventEmitter<ButtonEvent>()

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

    protected _preventEvent(event: Event) {
        if (this.disabled) {
            event.stopImmediatePropagation()
            event.preventDefault()
        }
    }
}
