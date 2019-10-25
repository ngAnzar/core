import { Component, Inject, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, Input, Output } from "@angular/core"
import { DomSanitizer, SafeStyle } from "@angular/platform-browser"
import { Observable, Subject } from "rxjs"
import { startOfWeek, startOfMonth, endOfWeek, endOfMonth, addDays, isToday, isSameDay, isSameMonth, addMonths, subMonths, startOfDay, compareAsc } from "date-fns"

import { setTzToUTC } from "../../../util"
import { LocaleService } from "../../../common.module"


@Component({
    selector: "nz-date-picker",
    templateUrl: "./date-picker.component.pug",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DatePickerComponent implements OnInit {
    // 0 - sunday, 1 - monday
    public weekStartsOn: number = 1
    public dayNames: string[] = []
    public days: Date[]

    public get value() { return this._value }
    private _value: Date
    // @Input()
    // public set value(val: Date) {
    //     if (this._setDateField("_value", val)) {
    //         if (this._value) {
    //             this.displayed = this._value
    //         }
    //         (this.valueChange as Subject<Date>).next(this._value)
    //         this.cdr.detectChanges()
    //     }
    // }
    // public get value(): Date { return this._value }
    // private _value: Date

    @Input()
    public set displayed(val: Date) {
        if (this._setDateField("_displayed", val)) {
            if (this._displayed) {
                this.days = this._createDays()
                let rc = this.days.length / 7 + 1
                this.gridTemplate = this.snitizer.bypassSecurityTrustStyle(`repeat(${rc}, 1fr) / repeat(7, 1fr)`)
                this.cdr.detectChanges()
            }
        }
    }
    public get displayed(): Date { return this._displayed }
    private _displayed: Date

    @Input()
    public set min(val: Date) {
        if (this._setDateField("_min", val)) {
            this.cdr.detectChanges()
        }
    }
    public get min(): Date { return this._min }
    private _min: Date

    @Input()
    public set max(val: Date) {
        if (this._setDateField("_min", val)) {
            this.cdr.detectChanges()
        }
    }
    public get max(): Date { return this._max }
    private _max: Date

    @Output("value") public valueChange: Observable<Date> = new Subject()

    public gridTemplate: SafeStyle

    public constructor(
        @Inject(DomSanitizer) protected snitizer: DomSanitizer,
        @Inject(ChangeDetectorRef) protected readonly cdr: ChangeDetectorRef,
        @Inject(LocaleService) protected readonly locale: LocaleService) {
        this.dayNames = this._createDayNames()
    }

    public ngOnInit() {
        this.displayed = new Date()
    }

    public writeValue(date: Date) {
        if (this._setDateField("_value", date)) {
            this.displayed = this._value
            this.cdr.detectChanges()
        }
    }

    public _emitValue(date: Date) {
        this.writeValue(date);
        (this.valueChange as Subject<Date>).next(this._value)
    }

    public isToday(d: Date) {
        return isToday(d)
    }

    public isSelected(d: Date) {
        return isSameDay(this._value, d)
    }

    public isSameMonth(d: Date) {
        return isSameMonth(this._displayed, d)
    }

    public isAllowed(d: Date): boolean {
        return (!this._min || compareAsc(d, this._min) >= 0)
            && (!this._max || compareAsc(this._max, d) >= 0)
    }

    public decMonth() {
        this.displayed = subMonths(this._displayed, 1)
    }

    public incMonth() {
        this.displayed = addMonths(this._displayed, 1)
    }

    public onWheel(event: WheelEvent) {
        if (event.deltaY < 0) {
            this.decMonth()
        } else {
            this.incMonth()
        }
    }

    private _createDayNames(): string[] {
        let result: string[] = []
        let start = startOfWeek(new Date(), { weekStartsOn: this.weekStartsOn as any })

        result.push(this.locale.formatDate(start, "EEEEEE"))

        for (let i = 1; i < 7; i++) {
            result.push(this.locale.formatDate(addDays(start, i), "EEEEEE"))
        }

        return result
    }

    private _createDays(): Date[] {
        let start = setTzToUTC(startOfWeek(startOfMonth(this.displayed), { weekStartsOn: this.weekStartsOn as any }))
        let end = setTzToUTC(endOfWeek(endOfMonth(this.displayed), { weekStartsOn: this.weekStartsOn as any }))
        let current = start
        let result: Date[] = []

        while (current <= end) {
            result.push(current)
            current = addDays(current, 1)
        }

        return result
    }

    private _setDateField(name: "_value" | "_displayed" | "_min" | "_max", val: Date): boolean {
        if (val) {
            val = setTzToUTC(startOfDay(val))
        }

        if (!this[name] || !val || !isSameDay(this[name], val)) {
            this[name] = val
            return true
        }
        return false
    }
}

