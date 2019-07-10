import { Directive, Inject, TemplateRef, Input } from "@angular/core"


@Directive({
    selector: "[nzErrorMessage]"
})
export class ErrorMessageDirective {
    @Input("nzErrorMessage") public readonly condition: string

    // public constructor(@Inject(TemplateRef) public readonly tpl: TemplateRef<any>) { }
}
