import { Directive, Input, Inject, ElementRef } from "@angular/core"

import { Destructible } from "../../util"
import { SlideableComponent } from "./slideable.component"


export type SlideableDirection = "left" | "right"


@Directive({
    selector: "[nzSlideableBack]"
})
export class SlideableBackDirective extends Destructible {
    @Input("nzSlideableBack") public direction: SlideableDirection

    public constructor(
        @Inject(ElementRef) private readonly el: ElementRef<HTMLElement>,
        @Inject(SlideableComponent) private readonly cmp: SlideableComponent) {
        super()

        this.destruct.subscription(cmp.begin).subscribe(direction => {
            el.nativeElement.style.display = this.direction === direction ? "flex" : "none"
        })

        this.destruct.subscription(cmp.end).subscribe(direction => {
            if (this.direction === direction) {
                this.cmp.resetScroll()
            }
        })
    }
}
