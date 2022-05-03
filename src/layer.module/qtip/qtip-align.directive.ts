import { Directive, Input } from "@angular/core"

import { Align, AlignInput, parseAlign, OPPOSITE_ALIGN, HAlign, VAlign } from "../../util"

const LEVITATE_HALIGN: { [key: string]: HAlign } = {
    "left": "right",
    "right": "left",
    "center": "center"
}

const LEVITATE_VALIGN: { [key: string]: VAlign } = {
    "top": "top",
    "bottom": "bottom",
    "center": "center"
}


@Directive({
    selector: "[nzQtipAlign]"
})
export class QtipAlignDirective {
    @Input("nzQtipAlign")
    public set align(val: AlignInput) {
        if (this._align !== val) {
            this._align = val
            const parsed = parseAlign(val);

            (this as any).targetAlign = parsed

            if (parsed.horizontal === "center") {
                (this as any).levitateAlign = {
                    horizontal: parsed.horizontal,
                    vertical: OPPOSITE_ALIGN[parsed.vertical]
                }
            } else if (parsed.vertical === "center") {
                (this as any).levitateAlign = {
                    horizontal: OPPOSITE_ALIGN[parsed.horizontal],
                    vertical: parsed.vertical
                }
            } else {
                (this as any).levitateAlign = {
                    horizontal: LEVITATE_HALIGN[parsed.horizontal],
                    vertical: LEVITATE_VALIGN[parsed.vertical]
                }
            }


        }
    }
    protected _align: AlignInput

    public readonly targetAlign: Align
    public readonly levitateAlign: Align
}
