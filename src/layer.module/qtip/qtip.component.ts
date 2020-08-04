import { Component, Inject, ChangeDetectionStrategy, ChangeDetectorRef, InjectionToken } from "@angular/core"

export const QTIP_TEXT = new InjectionToken("QTIP_TEXT")


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

    public constructor(
        @Inject(ChangeDetectorRef) protected readonly cdr: ChangeDetectorRef,
        @Inject(QTIP_TEXT) public _text: string) {
    }
}
