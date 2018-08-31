import { Component, ElementRef, Inject, Input, Output, EventEmitter, HostListener, OnDestroy, OnInit } from "@angular/core"
import { FocusMonitor, FocusOrigin } from "@angular/cdk/a11y"

import { AnzarComponent } from "../anzar.component"


export interface ButtonEvent {
    button: ButtonComponent
}


@Component({
    selector: ".nz-button, .nz-icon-button, .nz-fab",
    templateUrl: "./button.pug"
})
export class ButtonComponent extends AnzarComponent implements OnDestroy, OnInit {
    @Output() public action: EventEmitter<ButtonEvent> = new EventEmitter<ButtonEvent>()


    constructor(@Inject(ElementRef) el: ElementRef<HTMLButtonElement>,
        @Inject(FocusMonitor) protected focusMonitor: FocusMonitor) {
        super(el)
    }


    public ngOnInit() {
        this.focusMonitor.monitor(this.el.nativeElement).subscribe((origin) => {
            this.focused = origin
        })
    }

    public ngOnDestroy() {
        this.focusMonitor.stopMonitoring(this.el.nativeElement)
    }

    @HostListener("mouseup", ["$event"])
    protected onMouseUp(event: Event) {
        if (!this.disabled) {
            this.action.emit({ button: this })
        } else {
            event.stopImmediatePropagation()
            event.preventDefault()
        }
    }
}
