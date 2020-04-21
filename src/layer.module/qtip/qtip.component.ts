import { Component, Inject, ChangeDetectionStrategy, ChangeDetectorRef } from "@angular/core"



@Component({
    selector: "nz-qtip",
    template: "{{ _text }}",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class QtipComponent {
    public set text(val: string) {
        if (this._text !== val) {
            this._text = val
            this.cdr.markForCheck()
        }
    }
    public get text(): string { return this._text }
    public _text: string

    public constructor(@Inject(ChangeDetectorRef) protected readonly cdr: ChangeDetectorRef) {

    }
}
