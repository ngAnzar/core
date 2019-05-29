import { Directive, Input, Inject, ElementRef } from "@angular/core"


import { RichtextService } from "./richtext.service"


@Directive({
    selector: "[nzRichtext]",
    exportAs: "nzRichtext"
})
export class RichtextDirective {
    @Input("nzRichtext")
    public set value(val: string) {
        if (this._value !== val) {
            this._value = val
        }
    }
    public get value(): string { return this._value }
    private _value: string

    public readonly el: HTMLElement

    public constructor(
        @Inject(ElementRef) el: ElementRef<HTMLElement>,
        @Inject(RichtextService) protected readonly svc: RichtextService) {
        this.el = el.nativeElement
    }
}
