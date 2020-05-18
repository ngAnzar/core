import { Directive, Inject, ElementRef, NgZone } from "@angular/core"

import { Rect, getBoundingClientRect, __zone_symbol__ } from "../../util"
import { RectMutationService } from "../../layout.module"
import { ScrollerService } from "./scroller.service"


const RAF = __zone_symbol__("requestAnimationFrame")


@Directive({
    selector: "[scrollable]",
    host: {
        "[style.position]": "'relative'",
        // "[style.transition]": "'transform 300ms'",
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
                nativeEl.style.willChange = "transform"
                nativeEl.style.transform = `translate3d(-${pos.left}px, -${pos.top}px, 0)`
                nativeEl.style.willChange = null
            })

            // service.destruct.subscription(service.vpImmediate.scroll).subscribe(event => {
            //     const pos = event.position
            //     nativeEl.style.transform = `translate3d(-${pos.left}px, -${pos.top}px, 0)`
            // })

            service.destruct.subscription(rectMutation.watchDimension(el)).subscribe(dim => {
                service.vpImmediate.update({
                    scrollWidth: dim.width,
                    scrollHeight: dim.height
                })
            })

            service.destruct.subscription(rectMutation.watchScrollDimension(el)).subscribe(dim => {
                if (nativeEl.parentElement.offsetWidth <= dim.width) {
                    nativeEl.style.minWidth = `${dim.width}px`
                } else {
                    nativeEl.style.minWidth = `100%`
                }
            })
        })
    }

    public getElementRect(el: Node) {
        if (!document.contains(el)) {
            return null
        }

        if (el.nodeType === 1) {
            return this._getRect(el as HTMLElement)
            // return this._getRect(el as HTMLElement)
        } else {
            let selfRect = getBoundingClientRect(this.el.nativeElement)
            let elRect = getBoundingClientRect(el)
            return new Rect(elRect.left - selfRect.left, elRect.top - selfRect.top, elRect.width, elRect.height)
        }
    }

    private _getRect(el: HTMLElement) {
        let w = el.offsetWidth
        let h = el.offsetHeight
        let x = 0
        let y = 0
        let node = el
        let root = this.el.nativeElement

        while (node && node !== root) {
            x += node.offsetLeft
            y += node.offsetTop
            node = node.offsetParent as HTMLElement
        }

        return new Rect(x, y, w, h)
    }
}
