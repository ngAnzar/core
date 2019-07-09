
/**
 * can parse iso-8601 time format
 */
export class Time {
    public readonly hours: number
    public readonly minutes: number
    public readonly seconds: number
    public readonly milliseconds: number
    // minutes
    public readonly tzOffset: number
    public readonly isValid: boolean

    public constructor(value: string) {
        if (value) {
            const [time, tz] = value.split(/[zZ+-]/)
            Object.assign(this, parse(time))

            if (tz != null) {
                let parsedTz = parse(tz)
                this.tzOffset = parsedTz.hours * 60 + parsedTz.minutes
            } else {
                this.tzOffset = null
            }

            this.isValid = this.hours >= 0 && this.hours <= 24
                && this.minutes >= 0 && this.minutes <= 59
                && this.seconds >= 0 && this.seconds <= 59
                && (this.tzOffset == null || (this.tzOffset >= -1440 && this.tzOffset <= 1440))
        } else {
            this.hours = this.minutes = this.seconds = this.milliseconds = 0
            this.isValid = false
        }
    }

    public format(format: string): string {
        return format.replace(/(.*?)(HH?|mm?|ss?|S{1,6}|X)(.*?)/g, (match, g1, g2, g3) => {
            return `${g1 || ''}${this._formatted(g2)}${g3 || ''}`
        })
    }

    private _formatted(format: string): string {
        switch (format) {
            case "H":
                return "" + this.hours
            case "HH":
                return zeroPad(this.hours)
            case "m":
                return "" + this.minutes
            case "mm":
                return zeroPad(this.minutes)
            case "s":
                return "" + this.seconds
            case "ss":
                return zeroPad(this.seconds)
            case "S":
            case "SS":
            case "SSS":
            case "SSSS":
            case "SSSSS":
            case "SSSSSS":
                return this.milliseconds.toFixed(format.length).substr(2)

            case "X":
                if (this.tzOffset == null) {
                    return ""
                } else if (this.tzOffset) {
                    let h = Math.floor(this.tzOffset / 60)
                    let m = this.tzOffset - h * 60
                    return `${this.tzOffset > 0 ? '+' : '-'}${h}${m}`
                } else {
                    return "Z"
                }
        }
        throw new Error(`Invalid format string: ${format}`)
    }

    public setOnDate(date: Date): Date {
        let tzOffset = date.getTimezoneOffset()
        let result = new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
            this.hours,
            this.minutes,
            this.seconds,
            this.milliseconds
        )
        if (this.tzOffset !== tzOffset && this.tzOffset != null) {
            let rt = result.getTime()
            result = new Date(rt - (tzOffset - (tzOffset - this.tzOffset)))
        }
        return result
    }

    public get length(): number {
        return this.hours * 60 * 60
            + this.minutes * 60
            + this.seconds
            + this.milliseconds
    }

    public toString(): string {
        return this.format("HH:mm:ss.SSSX")
        // let result = `${zeroPad(this.hours)}:${zeroPad(this.minutes)}:${zeroPad(this.seconds)}`

        // if (this.milliseconds) {
        //     result += `.${this.milliseconds}`
        // }

        // if (this.tzOffset != null) {
        //     if (this.tzOffset) {
        //         let h = Math.floor(this.tzOffset / 60)
        //         result += `${h}${this.tzOffset - h * 60}`
        //     } else {
        //         result += "Z"
        //     }
        // }

        // return result
    }

    public toJSON(): string {
        return this.toString()
    }
}

function parse(value: string): Partial<Time> {
    const match = value.match(/^(\d{2})(?::?(\d{2}))?(?::?(\d{2}))?(?:\.(\d+))?$/)
    return {
        hours: match && Number(match[1] || 0),
        minutes: match && Number(match[2] || 0),
        seconds: match && Number(match[3] || 0),
        milliseconds: match && Number(match[4] ? `0.${match[4]}` : 0),
    }
}

function zeroPad(number: number): string {
    return `${number < 10 ? '0' : ''}${number}`
}
