import { Injectable, ElementRef, Inject, NgZone } from "@angular/core"

import { RippleOptions } from "./ripple-options"
import { RippleRef } from "./ripple-ref"


@Injectable({
    providedIn: "root"
})
export class RippleService {
    protected ripples: RippleRef[] = []

    constructor(@Inject(NgZone) private readonly zone: NgZone) {

    }

    public launch(container: ElementRef, config: RippleOptions): RippleRef {
        const ripple = new RippleRef(config, container.nativeElement, this.zone)
        this.ripples.push(ripple)
        ripple.destruct.any(() => {
            let i = this.ripples.indexOf(ripple)
            if (i > -1) {
                this.ripples.splice(i, 1)
            }
        })
        ripple.play()
        return ripple
    }

    public dispose() {
        while (this.ripples.length) {
            this.ripples.shift().dispose()
        }
    }
}
