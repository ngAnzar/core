import { Directive, Inject, Input } from "@angular/core"

import { InputMask } from "./input-mask.service"


@Directive({
    selector: "input[nzInputMask]",
    exportAs: "nzInputMask",
    providers: [InputMask]
})
export class InputMaskDirective {
    @Input("nzInputMask")
    public set options(val: any) { this.mask.options = val }
    public get options(): any { return this.mask.options }

    public constructor(
        @Inject(InputMask) public readonly mask: InputMask) {
        console.log({ mask })
    }
}
