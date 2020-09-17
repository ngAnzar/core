import { Directive, Inject, ElementRef, Input, OnChanges, SimpleChanges, SimpleChange } from "@angular/core"

import { CssService } from "../../common.module"
import { replaceClass } from "./helper"


const PREDEFINED: { [key: string]: [string, string, string] } = {
    "none": ["0", "0", "auto"],
    "grow": ["1", "1", "100%"],
    "initial": ["0", "1", "auto"],
    "nogrow": ["0", "1", "auto"],
    "noshrink": ["1", "0", "auto"],
}


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
            const parts = PREDEFINED[flex] || flex.split(/\s+/g);
            (this as { grow: string }).grow = parts[0];
            (this as { shrink: string }).shrink = parts[1] == null ? parts[0] : parts[1];
            (this as { basis: string }).basis = parts[2] == null ? "100%" : parts[2]

            const cls = `nz-flex-child-${this.grow}-${this.shrink}-${this.basis.replace('%', '')}`
            this.css.insertRule("." + cls, {
                flexGrow: this.grow,
                flexShrink: this.shrink,
                flexBasis: this.basis,
                maxWidth: "100%",
                maxHeight: "100%",
            })

            replaceClass(this.el.nativeElement, "nz-flex-child", cls, changes.flex.firstChange)
        }
    }
}
