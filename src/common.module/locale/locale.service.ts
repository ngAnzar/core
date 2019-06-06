import { Injectable, InjectionToken, Inject } from "@angular/core"
import { isEqual, distanceInWords, format } from "date-fns"


// https://date-fns.org/v1.29.0/docs/format
export type DateFormat = "relative-to" | "relative-from" |
    "long" | "short" |
    "long+time" | "long+time-long" |
    "short+time" | "short+time-long" |
    "time-long" | "time-short" | string

const FORMATS: { [K in DateFormat]?: string } = {
    "long": "YYYY. MMMM. D.",
    "long+time": "YYYY. MMMM. D. HH:mm",
    "long+time-short": "YYYY. MMMM. D. HH:mm",
    "long+time-long": "YYYY. MMMM. D. HH:mm:ss",
    "short": "YYYY. MM. DD.",
    "short+time": "YYYY. MM. DD. HH:mm",
    "short+time-short": "YYYY. MM. DD. HH:mm",
    "short+time-long": "YYYY. MM. DD. HH:mm:ss",
    "time": "HH:mm",
    "time-short": "HH:mm",
    "time-long": "HH:mm:ss",
}


export const LOCALE_DATE = new InjectionToken("Locale.date")


@Injectable({ providedIn: "root" })
export class LocaleService {
    public constructor(@Inject(LOCALE_DATE) public readonly dateLocale: any) { }

    public formatDate(date: string | Date, dateFormat: DateFormat): string {
        switch (dateFormat) {
            case "relative-to": return distanceInWords(new Date(), date, { locale: this.dateLocale })
            case "relative-from": return distanceInWords(date, new Date(), { locale: this.dateLocale })
            default: return format(date, FORMATS[dateFormat] || dateFormat, { locale: this.dateLocale })
        }
    }
}
