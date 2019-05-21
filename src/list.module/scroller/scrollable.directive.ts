import { Directive, Inject, ElementRef, NgZone } from "@angular/core"

import { RectMutationService, Rect } from "../../layout.module"
import { ScrollerService } from "./scroller.service"


@Directive({
    selector: "[scrollable]",
    host: {
        "[style.position]": "'relative'"
    }
})
export class ScrollableDirective {
    public constructor(
        @Inject(NgZone) zone: NgZone,
        @Inject(ElementRef) protected readonly el: ElementRef<HTMLElement>,
        @Inject(ScrollerService) service: ScrollerService,
        @Inject(RectMutationService) rectMutation: RectMutationService) {
        service.scrollable = this

        const nativeEl = el.nativeElement

        zone.runOutsideAngular(() => {
            service.destruct.subscription(service.vpRender.scroll).subscribe(event => {
                const pos = event.position
                nativeEl.style.transform = `translate(-${pos.left}px, -${pos.top}px)`
            })

            service.destruct.subscription(rectMutation.watchDimension(el)).subscribe(dim => {
                service.vpImmediate.update({
                    scrollWidth: dim.width,
                    scrollHeight: dim.height
                })
            })
        })
    }

    public getElementRect(el: HTMLElement) {
        let top = 0
        let left = 0
        let end = this.el.nativeElement
        let current = el

        while (current && current !== end) {
            top += el.offsetTop
            left = el.offsetLeft
            current = current.offsetParent as HTMLElement
        }

        return new Rect(left, top, el.offsetWidth, el.offsetHeight)
    }
}
