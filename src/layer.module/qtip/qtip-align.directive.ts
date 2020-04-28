import { Directive, Input } from "@angular/core"

import { Align, AlignInput, parseAlign, OPPOSITE_ALIGN } from "../../util"


@Directive({
    selector: "[nzQtipAlign]"
})
export class QtipAlignDirective {
    @Input("nzQtipAlign")
    public set align(val: AlignInput) {
        if (this._align !== val) {
            this._align = val
            const parsed = parseAlign(val);

            (this as any).targetAlign = parsed;
            (this as any).levitateAlign = {
                horizontal: OPPOSITE_ALIGN[parsed.horizontal],
                vertical: OPPOSITE_ALIGN[parsed.vertical]
            }
        }
    }
    protected _align: AlignInput

    public readonly targetAlign: Align
    public readonly levitateAlign: Align
}
