import { Component, Inject, ElementRef, OnInit, OnDestroy } from "@angular/core"

import { RippleService } from "./ripple.service"
import { BoundedRippleRef } from "./bounded-ripple-ref"


@Component({
    selector: ".nz-ripple",
    template: "",
    providers: [RippleService]
})
export class RippleComponent implements OnInit, OnDestroy {
    protected boundRipple: BoundedRippleRef

    public constructor(
        @Inject(ElementRef) protected readonly el: ElementRef<HTMLElement>,
        @Inject(RippleService) protected readonly rippleService: RippleService) {

    }

    public ngOnInit() {
        this.boundRipple = this.rippleService.attach(
            { nativeElement: this.el.nativeElement.parentElement },
            this.el)
    }

    public ngOnDestroy() {
        this.boundRipple.dispose()
        this.rippleService.dispose()
    }
}
