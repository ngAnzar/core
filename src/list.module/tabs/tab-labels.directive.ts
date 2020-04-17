import { Directive, ElementRef, Inject, OnDestroy } from "@angular/core"

import { __zone_symbol__ } from "../../util"

const requestAnimationFrame = __zone_symbol__("requestAnimationFrame")
const cancelAnimationFrame = __zone_symbol__("cancelAnimationFrame")


@Directive({
    selector: ".nz-tab-labels"
})
export class TabLabelsDirective implements OnDestroy {
    private readonly rafId: any

    public constructor(@Inject(ElementRef) elRef: ElementRef<HTMLElement>) {
        const el = elRef.nativeElement
        let lastScrollWidth = 0
        this.rafId = window[requestAnimationFrame](() => {
            if (lastScrollWidth !== el.scrollWidth) {
                lastScrollWidth = el.scrollWidth
                el.style.minWidth = `${el.scrollWidth}px`
            }
        })
    }

    public ngOnDestroy() {
        window[cancelAnimationFrame](this.rafId)
    }
}
