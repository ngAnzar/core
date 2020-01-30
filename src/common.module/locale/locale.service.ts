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

    // {...} primary group
    // <...> separator
    // [...] blocks to compare
    // public readonly dateRangeFormat = "{[yyyy. ][MM. ][dd. ][HH:mm]}< — >[yyyy. ][MM. ][dd. ][HH:mm]"

    public constructor(@Inject(LOCALE_DATE) public readonly dateLocale: any) {
        this.formatDateRange(new Date(), new Date())
    }

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

    // private _rangeFormatCache: { [key: string]: (begin: Date, end: Date) => string } = {}
    public formatDateRange(begin: Date, end: Date, onlyDate: boolean = true): string {
        if (!end) {
            if (onlyDate) {
                return this.formatDate(begin, "yyyy. MM. dd.")
            } else {
                return this.formatDate(begin, "yyyy. MM. dd. HH:mm")
            }
        }

        let firstFormat: string[] = ["yyyy. MM. dd."]
        let secondFormat: string[] = []

        if (begin.getFullYear() !== end.getFullYear()) {
            secondFormat.push("yyyy.")
            secondFormat.push("MM.")
            secondFormat.push("dd.")
        } else if (begin.getMonth() !== end.getMonth()) {
            secondFormat.push("MM.")
            secondFormat.push("dd.")
        } else if (begin.getDate() !== end.getDate()) {
            secondFormat.push("dd.")
        }

        if (!onlyDate) {
            if (begin.getHours() || begin.getMinutes()) {
                firstFormat.push("HH:mm")
                secondFormat.push("HH:mm")
            }
        }

        if (secondFormat.length === 0) {
            return this.formatDate(begin, firstFormat.join(" "))
        } else {
            return `${this.formatDate(begin, firstFormat.join(" "))} — ${this.formatDate(end, secondFormat.join(" "))}`
        }

        // format = format || this.dateRangeFormat
        // const formatter = this._rangeFormatCache[format]
        //     || (this._rangeFormatCache[format] = _compileRangeFormat(format))
        // return formatter(begin, end)
    }

    public getDateFormat(format: DateFormat): string {
        return FORMATS[format] || format
    }

    public parseDate(format: DateFormat, date: string): Date {
        let fmt = this.getDateFormat(format)
        return parse(date, fmt, new Date(), { weekStartsOn: this.weekStartsOn, locale: this.dateLocale })
    }
}


// function _compileRangeFormat(format: string): (begin: Date, end: Date) => string {
//     let primaryBegin = format.indexOf("{")
//     let primaryEnd = format.indexOf("}")
//     if (primaryBegin === -1 || primaryEnd === -1) {
//         throw Error("Missing primary group from date range format")
//     }

//     const primary = _rfExtractParts(format.substring(primaryBegin, primaryEnd))
//     format = format.substring(0, primaryBegin) + "%P!" + format.substring(primaryEnd, format.length)
//     let separator: string
//     format = format.replace(/\<(.*?)\>/, (m, g1) => {
//         separator = g1
//         return "%S!"
//     })
//     const secondary = _rfExtractParts(format.replace(/%.!/, ""))



//     return (begin: Date, end: Date) => {
//         return ""
//     }
// }

// function _rfExtractParts(input: string) {
//     const re = /\[([^\]]+)\]/g
//     let match: RegExpExecArray
//     // let beginIdx = input.indexOf("[")
//     // let endIdx = input.lastIndexOf("]")
//     // let inputParts = input.substring(beginIdx, endIdx)
//     let parts: string[]

//     // console.log({beginIdx, endIdx, inputParts})

//     while ((match = re.exec(input))) {
//         parts.push(match[1])
//     }
//     return parts
// }
