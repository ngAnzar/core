import { Directive, TemplateRef, ViewChild } from "@angular/core"
import { AbstractControl } from "@angular/forms"

import { FocusChangeEvent } from "../../abstract"


export interface TokenFilterValueInputCtx {
    $implicit: AbstractControl
    values: any[]
    remove(): void
    focused(event: FocusChangeEvent): void
    [key: string]: any
}


@Directive()
export abstract class TokenFilterValue {
    @ViewChild("inputTpl", { static: true, read: TemplateRef }) public inputTpl: TemplateRef<TokenFilterValueInputCtx>

    public updateContext(ctx: TokenFilterValueInputCtx) {
        return ctx
    }
}
