import { Component, EventEmitter, Output, Input } from "@angular/core"
import { merge } from "rxjs"
import { debounceTime, shareReplay, map } from "rxjs/operators"

import { Destructible, Time } from "../../../util"


@Component({
    selector: "nz-time-picker",
    templateUrl: "./time-picker.component.pug"
})
export class TimePickerComponent extends Destructible {
    public set hour(val: number) {
        if (this._hour !== val) {
            this._hour = val
            this.hourChange.next(val)
        }
    }
    public get hour(): number { return this._hour }
    private _hour: number = 0
    public readonly hourChange = this.destruct.subject(new EventEmitter<number>())

    public set minute(val: number) {
        if (this._minute !== val) {
            this._minute = val
            this.minuteChange.next(val)
        }
    }
    public get minute(): number { return this._minute }
    private _minute: number = 0
    public readonly minuteChange = this.destruct.subject(new EventEmitter<number>())

    public set second(val: number) {
        if (this._second !== val) {
            this._second = val
            this.secondChange.next(val)
        }
    }
    public get second(): number { return this._second }
    private _second: number = 0
    public readonly secondChange = this.destruct.subject(new EventEmitter<number>())

    @Input()
    public set value(val: Time | Date | string) {
        let time = Time.coerce(val)

        if (!this._value || !val || time.compare(this._value) !== 0) {
            this._value = time
            if (time) {
                this.hour = time.hours || 0
                this.minute = time.minutes || 0
                this.second = time.seconds || 0
            } else {
                this.hour = 0
                this.minute = 0
                this.second = 0
            }
        }
    }
    public get value(): Time | Date | string { return this._value }
    private _value: Time

    @Output("value") public readonly valueChange = this.destruct
        .subscription(merge(this.hourChange, this.minuteChange, this.secondChange))
        .pipe(
            debounceTime(10),
            map(() => {
                let val = `${zero(this.hour)}:${zero(this.minute)}:${zero(this.second)}`
                return new Time(val)
            }),
            shareReplay(1)
        )
}

function zero(num: number): string {
    if (isNaN(num)) {
        num = 0
    }
    return `${num < 10 ? '0' : ''}${num}`
}
