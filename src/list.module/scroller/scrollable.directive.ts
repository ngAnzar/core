import { Directive, ElementRef, Inject, Input, NgZone, OnInit, SkipSelf } from "@angular/core"

import { debounceTime } from "rxjs/operators"

import { RectMutationService } from "../../layout.module"
import { getBoundingClientRect, Rect } from "../../util"
import { ScrollerComponent } from "./scroller.component"

@Directive({
    selector: "[scrollable]",
    host: {
        "[style.position]": "'relative'",
        "[style.transform-style]": "'preserve-3d'"
        // "[style.transition]": "'transform 100ms cubic-bezier(0.215, 0.61, 0.355, 1)'",
        // "[style.will-change]": "'transform'", // TODO: csak akkor kell hozzáadni, ha animálom
    }
})
export class ScrollableDirective implements OnInit {
    @Input() public updateMinWidth: boolean = true

    public constructor(
        @Inject(NgZone) private readonly zone: NgZone,
        @Inject(ElementRef) public readonly el: ElementRef<HTMLElement>,
        @Inject(ScrollerComponent) @SkipSelf() public readonly scroller: ScrollerComponent,
        @Inject(RectMutationService) private readonly rectMutation: RectMutationService
    ) {}

    public ngOnInit() {
        const nativeEl = this.el.nativeElement
        const service = this.scroller.service

        service.scrollable = this

        this.zone.runOutsideAngular(() => {
            service.destruct.subscription(service.vpRender.scroll).subscribe(event => {
                const pos = event.position

                const left =
                    service.vpRender.virtualOffsetLeft != null
                        ? Math.max(0, pos.left - service.vpRender.virtualOffsetLeft)
                        : pos.left

                const top =
                    service.vpRender.virtualOffsetTop != null
                        ? Math.max(0, pos.top - service.vpRender.virtualOffsetTop)
                        : pos.top

                nativeEl.style.transform = `translate(-${Math.round(left)}px, -${Math.round(top)}px)`
            })

            service.destruct.subscription(this.rectMutation.watchDimension(nativeEl)).subscribe(dim => {
                service.vpImmediate.update({
                    scrollWidth: dim.width,
                    scrollHeight: dim.height
                })
            })

            if (this.scroller.orient === "horizontal") {
                if (this.updateMinWidth) {
                    service.destruct
                        .subscription(this.rectMutation.watchScrollDimension(nativeEl))
                        .pipe(debounceTime(200))
                        .subscribe(dim => {
                            if (nativeEl.parentElement.offsetWidth <= dim.width) {
                                nativeEl.style.minWidth = `${dim.width}px`
                            } else {
                                nativeEl.style.minWidth = `100%`
                            }
                        })
                } else {
                    nativeEl.style.minWidth = `100%`
                }
            }
        })
    }

    public getElementRect(el: Node) {
        if (!document.contains(el)) {
            return null
        }

        let result: Rect

        if (el.nodeType === 1) {
            result = this._getRect(el as HTMLElement)
            // return this._getRect(el as HTMLElement)
        } else {
            const selfRect = getBoundingClientRect(this.el.nativeElement)
            const elRect = getBoundingClientRect(el)
            result = new Rect(elRect.left - selfRect.left, elRect.top - selfRect.top, elRect.width, elRect.height)
        }

        const scroller = this.scroller.service

        if (scroller.vpRender.virtualOffsetTop != null) {
            result.top += scroller.vpRender.virtualOffsetTop
        }
        if (scroller.vpRender.virtualOffsetLeft != null) {
            result.left += scroller.vpRender.virtualOffsetLeft
        }

        return result
    }

    private _getRect(el: HTMLElement) {
        const w = el.offsetWidth
        const h = el.offsetHeight
        let x = 0
        let y = 0
        let node = el
        const root = this.el.nativeElement

        while (node && node !== root) {
            x += node.offsetLeft
            y += node.offsetTop
            node = node.offsetParent as HTMLElement
        }

        return new Rect(x, y, w, h)
    }
}
