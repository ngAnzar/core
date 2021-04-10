import { Component, Inject, ChangeDetectionStrategy, ChangeDetectorRef, InjectionToken } from "@angular/core"

export const QTIP_TEXT = new InjectionToken("QTIP_TEXT")


@Component({
    selector: "nz-qtip",
    host: {
        "[innerHtml]": "_htmlText"
    },
    template: "",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class QtipComponent {
    public set text(val: string) {
        if (this._text !== val) {
            this._text = val
            this._htmlText = val.replace(/\r?\n/g, "<br/>")
            this.cdr.markForCheck()
        }
    }
    public get text(): string { return this._text }
    public _text: string
    public _htmlText: any

    public constructor(
        @Inject(ChangeDetectorRef) protected readonly cdr: ChangeDetectorRef,
        @Inject(QTIP_TEXT) text: string) {
        this.text = text
    }
}
