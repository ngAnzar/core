import { Directive, Inject, ElementRef, Input, OnChanges, SimpleChanges, SimpleChange } from "@angular/core"

import { CssService } from "../../common.module"
import { FastDOM } from "../../util"
import { replaceClass } from "./helper"


const FLEX_NONE = ["0", "0", "auto"]
const FLEX_GROW = ["1", "1", "100%"]


@Directive({
    selector: "[nzFlex]"
})
export class FlexChildDirective implements OnChanges {
    @Input("nzFlex") public flex: string

    public readonly grow: string
    public readonly shrink: string
    public readonly basis: string

    public constructor(
        @Inject(ElementRef) private readonly el: ElementRef<HTMLElement>,
        @Inject(CssService) private readonly css: CssService) {
        el.nativeElement.classList.add("nz-layoutchild")
    }

    public ngOnChanges(changes: SimpleChanges) {
        if ("flex" in changes) {
            const flex = changes.flex.currentValue as string
            const parts = flex === "none"
                ? FLEX_NONE
                : flex === "grow"
                    ? FLEX_GROW
                    : flex.split(/\s+/g);
            (this as { grow: string }).grow = parts[0];
            (this as { shrink: string }).shrink = parts[1] || parts[0];
            (this as { basis: string }).basis = parts[2] || "100%"

            const cls = `nz-flex-child-${this.grow}-${this.shrink}-${this.basis.replace('%', '')}`
            this.css.insertRule("." + cls, {
                flexGrow: this.grow,
                flexShrink: this.shrink,
                flexBasis: this.basis
            })

            replaceClass(this.el.nativeElement, "nz-flex-child", cls, changes.flex.firstChange)
        }
    }
}
