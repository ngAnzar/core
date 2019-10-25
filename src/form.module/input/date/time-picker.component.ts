import { Component, EventEmitter, Output, Input, Inject, ChangeDetectorRef } from "@angular/core"
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

    public constructor(@Inject(ChangeDetectorRef) private readonly cdr: ChangeDetectorRef) {
        super()
    }

    public writeValue(value: Time | Date) {
        let time = Time.coerce(value)

        if (!this._value || !value || time.compare(this._value) !== 0) {
            this._value = time
            if (time) {
                this._hour = time.hours || 0
                this._minute = time.minutes || 0
                this._second = time.seconds || 0
            } else {
                this._hour = 0
                this._minute = 0
                this._second = 0
            }
            this.cdr.detectChanges()
        }
    }
}

function zero(num: number): string {
    if (isNaN(num)) {
        num = 0
    }
    return `${num < 10 ? '0' : ''}${num}`
}
