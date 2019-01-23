import { Directive, Pipe, PipeTransform, Input, Inject, ElementRef, AfterContentInit } from "@angular/core"
import { isEqual, format, differenceInSeconds } from "date-fns"

import { LocaleService, DateFormat } from "./locale.service"


@Directive({
    selector: "[nzDate]",
    exportAs: "nzDate"
})
export class DateDirective implements AfterContentInit {
    @Input("nzDate")
    public set date(value: Date) {
        if (!isEqual(this._date, value)) {
            this._date = value
            this.update()
        }
    }
    public get date(): Date { return this._date }
    protected _date: Date

    public get formatted(): string {
        if (this._format === "relative-to" || this._format === "relative-from") {
            if (this._relativeMax && Math.abs(differenceInSeconds(new Date(), this._date)) >= this._relativeMax) {
                return this.locale.formatDate(this._date, this._relativeAltFormat)
            }
        }

        return this.locale.formatDate(this._date, this._format)
    }

    @Input()
    public set format(val: DateFormat) {
        if (this._format !== val) {
            this._format = val
            this.update()
        }
    }
    public get format(): DateFormat { return this._format }
    protected _format: DateFormat = "short"

    @Input()
    public set relativeMax(val: number) {
        if (this._relativeMax !== val) {
            this._relativeMax = val
            this.update()
        }
    }
    public get relativeMax(): number { return this._relativeMax }
    private _relativeMax: number

    @Input()
    public set relativeAltFormat(val: DateFormat) {
        if (this._relativeAltFormat !== val) {
            this._relativeAltFormat = val
            this.update()
        }
    }
    public get relativeAltFormat(): DateFormat { return this._relativeAltFormat }
    private _relativeAltFormat: DateFormat = "short+time"

    protected inited = false
    protected updater: any

    public constructor(
        @Inject(ElementRef) protected readonly el: ElementRef<HTMLElement>,
        @Inject(LocaleService) protected readonly locale: LocaleService) {
    }

    public ngAfterContentInit() {
        this.inited = true
        this.update()
    }

    protected update = () => {
        if (!this.inited) {
            return
        }

        if (this.format === "relative-to" || this.format === "relative-from") {
            if (!this.updater) {
                this.updater = setInterval(this.update, 1000)
            }
        } else if (this.updater) {
            clearInterval(this.updater)
            delete this.updater
        }

        this._updateContent()
        this.el.nativeElement.setAttribute("title", this.locale.formatDate(this._date, "long+time-long"))
    }

    protected _updateContent() {
        let formatted = this.formatted
        if (this.el.nativeElement.innerHTML !== formatted) {
            this.el.nativeElement.innerHTML = formatted
        }
    }
}
