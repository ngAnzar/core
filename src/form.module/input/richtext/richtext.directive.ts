import { Directive, Input, Output, Inject, ElementRef, EventEmitter } from "@angular/core"
import { Observable } from "rxjs"


import { RichtextService } from "./richtext.service"
import { RichtextStream } from "./richtext-stream"


@Directive({
    selector: "[nzRichtext]",
    exportAs: "nzRichtext",
    providers: [RichtextStream]
})
export class RichtextDirective {
    @Input("nzRichtext")
    public set value(val: string) {
        if (this._value !== val) {
            this.stream.value = val
            this._value = this.stream.value
        }
    }
    public get value(): string { return this._value }
    private _value: string

    @Output("change")
    public readonly changes: Observable<string> = new EventEmitter<string>()

    public constructor(
        @Inject(RichtextService) protected readonly svc: RichtextService,
        @Inject(RichtextStream) public readonly stream: RichtextStream) {
    }
}
