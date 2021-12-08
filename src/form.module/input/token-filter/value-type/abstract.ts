import { Directive, TemplateRef, ViewChild } from "@angular/core"
import { AbstractControl } from "@angular/forms"


export interface TokenFilterValueInputCtx {
    $implicit: AbstractControl
    values: any[]
    remove(): void
    [key: string]: any
}


@Directive()
export abstract class TokenFilterValue {
    @ViewChild("inputTpl", { static: true, read: TemplateRef }) public inputTpl: TemplateRef<TokenFilterValueInputCtx>

    public updateContext(ctx: TokenFilterValueInputCtx) {
        return ctx
    }
}
