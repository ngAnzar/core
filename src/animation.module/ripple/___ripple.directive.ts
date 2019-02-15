import { Directive, Input, Inject, ElementRef, OnDestroy, OnInit } from "@angular/core"

import { RippleService } from "./ripple.service"
import { BoundedRippleRef } from "./bounded-ripple-ref"
import { RippleOptions } from "./ripple-options"


@Directive({
    selector: ".nz-ripple",
    providers: [RippleService]
})
export class RippleDirective implements OnInit, OnDestroy {
    @Input() public centered: boolean = false
    @Input() public radius: number = 0

    protected boundRipple: BoundedRippleRef

    public constructor(
        @Inject(ElementRef) protected el: ElementRef<HTMLElement>,
        @Inject(RippleService) protected rippleService: RippleService) {
    }

    public launch(config: RippleOptions) {
        this.rippleService.launch(this.el, config)
    }

    public ngOnInit() {
        this.boundRipple = this.rippleService.attach(
            { nativeElement: this.el.nativeElement.parentElement },
            this.el)
    }

    public ngOnDestroy() {
        if (this.boundRipple) {
            this.boundRipple.dispose()
        }
        this.rippleService.dispose()
    }
}
