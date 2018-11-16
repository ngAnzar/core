import { Directive, Pipe, PipeTransform, Input, Inject, ElementRef, AfterContentInit } from "@angular/core"
import { isEqual, distanceInWords, format } from "date-fns"
import * as hu from "date-fns/locale/hu"


// https://date-fns.org/v1.29.0/docs/format
export type DateFormat = "relative-to" | "relative-from" |
    "long" | "short" |
    "long+time" | "long+time-long" |
    "short+time" | "short+time-long" |
    "time-long" | "time-short" | string

const FORMATS: { [K in DateFormat]?: string } = {
    "long": "YYYY. MMMM. D.",
    "long+time": "YYYY. MMMM. D. H:m",
    "long+time-short": "YYYY. MMMM. D. H:m",
    "long+time-long": "YYYY. MMMM. D. HH:mm:ss",
    "short": "YYYY. MM. DD.",
    "short+time": "YYYY. MM. DD. H:m",
    "short+time-short": "YYYY. MM. DD. H:m",
    "short+time-long": "YYYY. MM. DD. HH:mm:ss",
    "time": "H:m",
    "time-short": "H:m",
    "time-long": "HH:mm:ss",
}

@Directive({
    selector: ".nz-date"
})
export class DateDirective implements AfterContentInit {
    @Input()
    public set date(value: Date) {
        if (!isEqual(this._date, value)) {
            this._date = value
            this.update()
        }
    }
    public get date(): Date { return this._date }
    protected _date: Date

    public get formatted(): string {
        switch (this.format) {
            case "relative-to": return distanceInWords(new Date(), this.date, { locale: hu })
            case "relative-from": return distanceInWords(new Date(), this.date, { locale: hu })
            default:
                if (FORMATS[this.format]) {
                    return format(this.date, FORMATS[this.format], { locale: hu })
                } else {
                    return format(this.date, this.format, { locale: hu })
                }
        }
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

    protected inited = false
    protected updater: any

    public constructor(@Inject(ElementRef) protected readonly el: ElementRef<HTMLElement>) {
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
        this.el.nativeElement.setAttribute("title", format(this.date, FORMATS["long+time-long"], { locale: hu }))
    }

    protected _updateContent() {
        let formatted = this.formatted
        if (this.el.nativeElement.innerHTML !== formatted) {
            this.el.nativeElement.innerHTML = formatted
        }
    }
}


@Pipe({
    name: "time"
})
export class TimePipe implements PipeTransform {
    public transform(value: Date): string {
        return format(value, "HH:mm")
    }
}
