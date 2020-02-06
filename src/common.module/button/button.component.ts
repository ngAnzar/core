import { Component, ElementRef, Inject, Input, Output, EventEmitter, OnDestroy, OnInit, HostBinding, HostListener, ChangeDetectionStrategy, ChangeDetectorRef } from "@angular/core"
import { FocusMonitor } from "@angular/cdk/a11y"
import { ENTER } from "@angular/cdk/keycodes"

import { AnzarComponent } from "../abstract-component"


@Component({
    selector: ".nz-button",
    templateUrl: "./button.pug"
})
export class ButtonComponent extends AnzarComponent implements OnDestroy, OnInit {
    // @Output() public action: EventEmitter<any> = new EventEmitter<any>()

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
            if (this._focusOrigin !== origin) {
                if (origin) {
                    this.el.nativeElement.setAttribute("focused", origin)
                } else {
                    this.el.nativeElement.removeAttribute("focused")
                }
                this.focusOrigin = origin
            }
        })
        this.destruct.any(() => {
            this.focusMonitor.stopMonitoring(this.el.nativeElement)
        })
    }

    @HostListener("keydown", ["$event"])
    protected _keyDown(event: KeyboardEvent) {
        if (event.keyCode === ENTER
            && !event.shiftKey
            && !event.ctrlKey
            && !event.altKey
            && !event.metaKey
            && !event.defaultPrevented
            && !this.disabled) {
            event.preventDefault()
            event.stopImmediatePropagation()
            this.el.nativeElement.click()
        }
    }

    @HostListener("tap", ["$event"])
    protected _handleTap(event: Event) {
        if (event.defaultPrevented) {
            return
        }
        if (this.disabled) {
            event.stopImmediatePropagation()
        } else {
            if (this.type === "submit") {
                const form = this.el.nativeElement.closest("form") as HTMLFormElement
                if (form) {
                    const submitEvent = new CustomEvent("submit", { "bubbles": true, "cancelable": true })
                    form.dispatchEvent(submitEvent)
                }
            }
            event.stopPropagation()
        }
    }
}
