import { Directive, Input, OnChanges, SimpleChanges, Inject, ElementRef } from "@angular/core"
import { noop } from "rxjs"

import { CssService } from "../common.module"
import { FastDOM } from "../util"


@Directive({
    selector: "[nzHide]"
})
export class HideDirective implements OnChanges {
    @Input("nzHide") public readonly hide: boolean

    private readonly cls = this.css.insertRule(".nz-hidden", { display: "none" }).substr(1)

    public constructor(
        @Inject(ElementRef) private readonly el: ElementRef<HTMLElement>,
        @Inject(CssService) private readonly css: CssService) {
    }

    public ngOnChanges(changes: SimpleChanges) {
        if ("hide" in changes) {
            if (changes.hide.currentValue) {
                if (changes.hide.firstChange) {
                    this.el.nativeElement.classList.add(this.cls)
                } else {
                    FastDOM.mutate(() => {
                        this.el.nativeElement.classList.add(this.cls)
                    })
                }
            } else {
                if (changes.hide.firstChange) {
                    this.el.nativeElement.classList.remove(this.cls)
                } else {
                    FastDOM.mutate(() => {
                        this.el.nativeElement.classList.remove(this.cls)
                    })
                }
            }
        }
    }
}
