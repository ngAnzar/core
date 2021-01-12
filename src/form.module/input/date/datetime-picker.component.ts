import { Component, Input, Output, EventEmitter, ChangeDetectorRef, ChangeDetectionStrategy, Inject, ViewChild } from "@angular/core"
import { differenceInSeconds, startOfDay, isSameDay, setYear, setMonth, setDate, setHours, setMinutes, setSeconds } from "date-fns"

import { Time } from "../../../util"
import { LayerRef } from "../../../layer.module"
import { DatePickerComponent } from "./date-picker.component"
import { TimePickerComponent } from "./time-picker.component"
import { PickerPopup } from "./abstract"


@Component({
    selector: "nz-datetime-picker",
    templateUrl: "./datetime-picker.component.pug",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DatetimePickerComponent implements PickerPopup<Date> {
    @ViewChild("dayPicker", { static: true, read: DatePickerComponent }) public readonly dayPicker: DatePickerComponent
    @ViewChild("timePicker", { static: true, read: TimePickerComponent }) public readonly timePicker: TimePickerComponent

    @Input()
    public set showButtons(val: boolean) {
        if (this._showButtons !== val) {
            this._showButtons = val
            this.cdr.markForCheck()
        }
    }
    public get showButtons(): boolean { return this._showButtons }
    private _showButtons: boolean = false

    public get value(): Date { return this._value }
    private _value: Date

    @Output("value") public readonly valueChange = new EventEmitter<Date>()

    public set date(val: Date) {
        val = val ? startOfDay(val) : null
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

    public get displayDate() {
        return (this._date && !isNaN(this._date.getTime()) ? this._date : null) || this._today
    }

    private _today = new Date()

    public constructor(
        @Inject(ChangeDetectorRef) private readonly cdr: ChangeDetectorRef,
        @Inject(LayerRef) private readonly layerRef: LayerRef) {
    }

    public writeValue(date: Date) {
        this._date = startOfDay(date)
        this._time = Time.coerce(date)
        this.dayPicker.writeValue(date)
        this.timePicker.writeValue(date)
    }

    private _emitValue() {
        let value = new Date()

        if (this._date && !isNaN(this._date.getTime())) {
            value = setYear(value, this._date.getFullYear())
            value = setMonth(value, this._date.getMonth())
            value = setDate(value, this._date.getDate())
        }

        if (this._time && this._time.isValid) {
            value = setHours(value, this._time.hours)
            value = setMinutes(value, this._time.minutes)
            value = setSeconds(value, this._time.seconds)
        }

        if (!this._value || differenceInSeconds(this._value, value) !== 0) {
            this._value = value
            if (!this.showButtons) {
                this.valueChange.next(this._value)
            }
        }
    }

    public onCommitValue() {
        this.valueChange.next(this._value)
    }

    public cancel() {
        this.layerRef.hide()
    }
}
