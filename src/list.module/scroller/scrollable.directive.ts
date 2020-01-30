import { Directive, Inject, ElementRef, NgZone } from "@angular/core"

import { RectMutationService, Rect, getBoundingClientRect } from "../../layout.module"
import { ScrollerService } from "./scroller.service"


@Directive({
    selector: "[scrollable]",
    host: {
        "[style.position]": "'relative'",
        // "[style.will-change]": "'transform'", // TODO: csak akkor kell hozzáadni, ha animálom
    }
})
export class ScrollableDirective {
    public constructor(
        @Inject(NgZone) zone: NgZone,
        @Inject(ElementRef) public readonly el: ElementRef<HTMLElement>,
        @Inject(ScrollerService) service: ScrollerService,
        @Inject(RectMutationService) rectMutation: RectMutationService) {
        service.scrollable = this

        const nativeEl = el.nativeElement

        zone.runOutsideAngular(() => {
            service.destruct.subscription(service.vpRender.scroll).subscribe(event => {
                const pos = event.position
                // nativeEl.style.transform = `translate3d(-${pos.left}px, -${pos.top}px, 0)`
                nativeEl.style.transform = `translate(-${pos.left}px, -${pos.top}px)`
            })

            // service.destruct.subscription(service.vpImmediate.scroll).subscribe(event => {
            //     const pos = event.position
            //     nativeEl.style.transform = `translate(-${pos.left}px, -${pos.top}px)`
            // })

            service.destruct.subscription(rectMutation.watchDimension(el)).subscribe(dim => {
                service.vpImmediate.update({
                    scrollWidth: dim.width,
                    scrollHeight: dim.height
                })
            })
        })
    }

    public getElementRect(el: Node) {
        let selfRect = getBoundingClientRect(this.el.nativeElement)
        let elRect = getBoundingClientRect(el)

        return new Rect(elRect.left - selfRect.left, elRect.top - selfRect.top, elRect.width, elRect.height)
    }
}
