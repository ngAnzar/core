import { Directive, Inject, ElementRef, NgZone, SkipSelf, OnInit } from "@angular/core"
import { debounceTime } from "rxjs/operators"

import { Rect, getBoundingClientRect, __zone_symbol__ } from "../../util"
import { RectMutationService } from "../../layout.module"
import { ScrollerComponent } from "./scroller.component"


const RAF = __zone_symbol__("requestAnimationFrame")


@Directive({
    selector: "[scrollable]",
    host: {
        "[style.position]": "'relative'",
        // "[style.transition]": "'transform 300ms'",
        // "[style.will-change]": "'transform'", // TODO: csak akkor kell hozzáadni, ha animálom
    }
})
export class ScrollableDirective implements OnInit {
    public constructor(
        @Inject(NgZone) private readonly zone: NgZone,
        @Inject(ElementRef) public readonly el: ElementRef<HTMLElement>,
        @Inject(ScrollerComponent) @SkipSelf() public readonly scroller: ScrollerComponent,
        @Inject(RectMutationService) private readonly rectMutation: RectMutationService) {
    }

    public ngOnInit() {
        const nativeEl = this.el.nativeElement
        const service = this.scroller.service

        service.scrollable = this

        this.zone.runOutsideAngular(() => {
            service.destruct.subscription(service.vpRender.scroll).subscribe(event => {
                const pos = event.position
                nativeEl.style.willChange = "transform"
                nativeEl.style.transform = `translate3d(-${pos.left}px, -${pos.top}px, 0)`
                nativeEl.style.willChange = null
            })

            service.destruct.subscription(this.rectMutation.watchDimension(nativeEl)).subscribe(dim => {
                service.vpImmediate.update({
                    scrollWidth: dim.width,
                    scrollHeight: dim.height
                })
            })

            if (this.scroller.orient === "horizontal") {
                service.destruct.subscription(this.rectMutation.watchScrollDimension(nativeEl)).pipe(debounceTime(200)).subscribe(dim => {
                    if (nativeEl.parentElement.offsetWidth <= dim.width) {
                        nativeEl.style.minWidth = `${dim.width}px`
                    } else {
                        nativeEl.style.minWidth = `100%`
                    }
                })
            }
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
