import { Component, Input, Output, EventEmitter, ChangeDetectorRef, ChangeDetectionStrategy, Inject } from "@angular/core"
import { differenceInSeconds, startOfDay, isSameDay } from "date-fns"

import { Time, setTzToUTC } from "../../../util"


@Component({
    selector: "nz-datetime-picker",
    templateUrl: "./datetime-picker.component.pug",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DatetimePickerComponent {
    @Input()
    public set value(val: Date) {
        if (!this._value || !val || differenceInSeconds(this._value, val) !== 0) {
            this._value = val
            this.date = val
            this.time = val
            this.valueChange.next(val)
            this.cdr.detectChanges()
        }
    }
    public get value(): Date { return this._value }
    private _value: Date

    @Output("value") public readonly valueChange = new EventEmitter<Date>()

    public set date(val: Date) {
        val = val ? setTzToUTC(startOfDay(val)) : null
        if (!this._date || !val || !isSameDay(this._date, val)) {
            this._date = val
            this._emitValue()
        }
    }
    public get date(): Date { return this._date }
    private _date: Date

    public set time(val: Time | Date | string) {
        val = Time.coerce(val)
        if (!this._time || !val || this._time.compare(val) !== 0) {
            this._time = val
            this._emitValue()
        }
    }
    public get time(): Time | Date | string { return this._time }
    private _time: Time

    protected get displayDate() {
        return (this._date && !isNaN(this._date.getTime()) ? this._date : null) || this._today
    }

    private _today = new Date()

    public constructor(
        @Inject(ChangeDetectorRef) private readonly cdr: ChangeDetectorRef) {
    }

    private _emitValue() {
        if (this._date && this._time && this._time.isValid && !isNaN(this._date.getTime())) {
            this.value = new Date(
                this._date.getFullYear(), this._date.getMonth(), this._date.getDate(),
                this._time.hours, this._time.minutes, this._time.seconds)
        }
    }
}
