import { Component, Input } from "@angular/core"
import { format, setHours, setMinutes, setSeconds, setMilliseconds } from "date-fns"

import { InputComponent, INPUT_VALUE_ACCESSOR } from "../input/input.component"


@Component({
    selector: "input[type=time].nz-input",
    templateUrl: "./time-input.template.pug",
    host: {
        "[attr.id]": "id",
        "[class.nz-has-value]": "!!value",
        "(focus)": "_handleFocus(true)",
        "(blur)": "_handleFocus(false)",
        "(input)": "_handleInput($event.target.value)"
    },
    providers: [
        { provide: InputComponent, useExisting: TimeInputComponent },
        INPUT_VALUE_ACCESSOR
    ]
})
export class TimeInputComponent extends InputComponent<Date> {
    public get type(): string { return "text" }

    @Input()
    public set date(value: Date) {
        value = value || new Date()
        if (this._rawValue) {
            this._date = value
            this.value = this._composeDate()
        } else {
            this.value = null
        }
    }
    public get date(): Date {
        return this._date || new Date()
    }
    protected _date: Date
    protected _rawValue: { hours: number, minutes: number, seconds: number }

    public writeValue(obj: Date): void {
        (this.el.nativeElement as HTMLInputElement).value = format(obj, "HH:mm")
    }

    public _handleInput(val: any) {
        if (typeof val === "string") {
            this._rawValue = this._parseTime(val)
            val = this._composeDate()
        }
        super._handleInput(val)
    }

    protected _composeDate(): Date {
        let base = this.date
        base = setHours(base, this._rawValue ? this._rawValue.hours || 0 : 0)
        base = setMinutes(base, this._rawValue ? this._rawValue.minutes || 0 : 0)
        base = setSeconds(base, this._rawValue ? this._rawValue.seconds || 0 : 0)
        return setMilliseconds(base, 0)
    }

    protected _parseTime(val: string) {
        let components = String(val).split(/\s*:\s*/)
        return {
            hours: Number(components[0]),
            minutes: Number(components[1]),
            seconds: Number(components[2])
        }
    }
}
