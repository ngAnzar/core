import { Directive, Input, Inject, ElementRef, OnDestroy, OnInit } from "@angular/core"

import { RippleConfig, RippleService, BoundedRipple } from "./ripple.service"


@Directive({
    selector: ".nz-ripple",
    providers: [RippleService]
})
export class RippleDirective implements OnInit, OnDestroy {
    @Input() public centered: boolean = false
    @Input() public radius: number = 0

    protected boundRipple: BoundedRipple

    public constructor(
        @Inject(ElementRef) protected el: ElementRef<HTMLElement>,
        @Inject(RippleService) protected rippleService: RippleService) {
    }

    public launch(config: RippleConfig) {
        this.rippleService.launch(this.el, config)
    }

    public ngOnInit() {
        console.log("ngOnInit")
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
