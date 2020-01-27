import { Injectable, InjectionToken, Inject } from "@angular/core"
import { isEqual, formatDistance, format, parse } from "date-fns"


// https://date-fns.org/v1.29.0/docs/format
export type DateFormat = "relative-to" | "relative-from" |
    "long" | "short" |
    "long+time" | "long+time-long" |
    "short+time" | "short+time-long" |
    "time-long" | "time-short" | string

const FORMATS: { [K in DateFormat]?: string } = {
    "long": "yyyy. MMMM. d.",
    "long+time": "yyyy. MMMM. d. HH:mm",
    "long+time-short": "yyyy. MMMM. d. HH:mm",
    "long+time-long": "yyyy. MMMM. d. HH:mm:ss",
    "short": "yyyy. MM. dd.",
    "short+time": "yyyy. MM. dd. HH:mm",
    "short+time-short": "yyyy. MM. dd. HH:mm",
    "short+time-long": "yyyy. MM. dd. HH:mm:ss",
    "time": "HH:mm",
    "time-short": "HH:mm",
    "time-long": "HH:mm:ss",
}


export const LOCALE_DATE = new InjectionToken("Locale.date")


@Injectable({ providedIn: "root" })
export class LocaleService {
    public readonly weekStartsOn = 1

    public constructor(@Inject(LOCALE_DATE) public readonly dateLocale: any) { }

    public formatDate(date: Date, dateFormat: DateFormat): string {
        try {
            switch (dateFormat) {
                case "relative-to": return formatDistance(date, new Date(), { locale: this.dateLocale, addSuffix: true })
                case "relative-from": return formatDistance(date, new Date(), { locale: this.dateLocale })
                default: return format(date, FORMATS[dateFormat] || dateFormat, { locale: this.dateLocale })
            }
        } catch (e) {
            return (e as Error).message
        }
    }

    public getDateFormat(format: DateFormat): string {
        return FORMATS[format] || format
    }

    public parseDate(format: DateFormat, date: string): Date {
        let fmt = this.getDateFormat(format)
        return parse(date, fmt, new Date(), { weekStartsOn: this.weekStartsOn, locale: this.dateLocale })
    }
}
