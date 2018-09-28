import { Component, Inject, ElementRef, ViewChild, AfterViewInit } from "@angular/core"

import { RippleService, BoundedRipple } from "../../ripple/ripple.service"


@Component({
    selector: ".nz-list-item",
    templateUrl: "./list-item.template.pug",
    providers: [
        RippleService
    ]
})
export class ListItemComponent implements AfterViewInit {
    @ViewChild("ripple") protected readonly rippleContainer: ElementRef<any>

    protected boundedRipple: BoundedRipple

    public constructor(
        @Inject(RippleService) protected readonly rippleSvc: RippleService,
        @Inject(ElementRef) public readonly el: ElementRef<HTMLElement>) {
    }

    public ngAfterViewInit() {
        this.boundedRipple = this.rippleSvc.attach(this.el, this.rippleContainer)
    }
}
