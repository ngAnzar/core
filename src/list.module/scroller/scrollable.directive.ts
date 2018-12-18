import { Directive, Inject, ElementRef } from "@angular/core"
import { fromEvent } from "rxjs"

import { RectMutationService } from "../../layout.module"
import { ScrollerService } from "./scroller.service"


export abstract class Scrollable {
    // public abstract scroll(hPercent: number, vPercent: number): void
}


@Directive({
    selector: "[nzScrollable='native']",
    providers: [
        { provide: Scrollable, useExisting: ScrollableNativeDirective }
    ]
})
export class ScrollableNativeDirective extends Scrollable {
    public constructor(
        @Inject(ElementRef) el: ElementRef<HTMLElement>,
        @Inject(ScrollerService) public readonly scroller: ScrollerService,
        @Inject(RectMutationService) rectMutation: RectMutationService) {
        super()

        const nativeEl = el.nativeElement

        scroller.destruct.subscription(rectMutation.watchDimension(nativeEl)).subscribe(dim => {
            scroller.viewport = {
                width: dim.width,
                height: dim.height,
                scrollHeight: nativeEl.scrollHeight,
                scrollWidth: nativeEl.scrollWidth
            }
        })

        scroller.init({
            left: nativeEl.scrollLeft,
            top: nativeEl.scrollTop,
        })

        scroller.destruct.subscription(fromEvent(nativeEl, "scroll")).subscribe(event => {
            scroller.position = {
                left: nativeEl.scrollLeft,
                top: nativeEl.scrollTop,
            }
        })
    }
}


// @Directive({
//     selector: "[nzScrollable='translate']",
//     providers: [
//         { provide: Scrollable, useExisting: ScrollableTranslateDirective }
//     ]
// })
// export class ScrollableTranslateDirective extends Scrollable {
// }
