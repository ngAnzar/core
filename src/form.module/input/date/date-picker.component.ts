import { Component, Inject, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, Input, Output, Optional } from "@angular/core"
import { DomSanitizer, SafeStyle } from "@angular/platform-browser"
import { Observable, Subject, merge, of, zip } from "rxjs"
import { shareReplay, takeUntil, map, switchMap, take, startWith } from "rxjs/operators"
import { startOfWeek, startOfMonth, endOfWeek, endOfMonth, addDays, isToday, isSameDay, isSameMonth, addMonths, subMonths, startOfDay, compareAsc } from "date-fns"

import { setTzToUTC, Destructible } from "../../../util"
import { LocaleService } from "../../../common.module"
import { DatePickerDayDataProvider } from "./date-picker-day-data"


export interface DayData {
    // this data displayed under the day number
    data?: string | number

    // button color attribute, only apply, when the date is not selected, and not disabled
    color?: string

    // button variant attribute, only apply, when the date is not selected, and not disabled
    variant?: string

    // disabled button
    disabled?: boolean

    // is today
    today?: boolean
}


const OTHER_MONTH_DATA: DayData = { color: "dark-base", variant: "icon" }
const SAME_MONTH_DATA: DayData = { color: "base", variant: "filled icon" }
const SELECTED_DATA: DayData = { color: "accent", variant: "filled icon" }


@Component({
    selector: "nz-date-picker",
    templateUrl: "./date-picker.component.pug",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DatePickerComponent extends Destructible implements OnInit {
    // 0 - sunday, 1 - monday
    public weekStartsOn: number = 1
    public dayNames: string[] = []

    public get value() { return this._value }
    private _value: Date

    @Input()
    public set displayed(val: Date) {
        if (this._setDateField("_displayed", val, isSameMonth)) {
            this._displayedChange.next(this._displayed)
        }
    }
    public get displayed(): Date { return this._displayed }
    private _displayed: Date
    private _displayedChange = this.destruct.subject(new Subject<Date>())
    public readonly displayed$ = this._displayedChange.pipe(shareReplay(1))

    @Input()
    public set min(val: Date) {
        if (this._setDateField("_min", val, isSameDay)) {
            this._minChanged.next(this._min)
        }
    }
    public get min(): Date { return this._min }
    private _min: Date
    private _minChanged = this.destruct.subject(new Subject<Date>())

    @Input()
    public set max(val: Date) {
        if (this._setDateField("_min", val, isSameDay)) {
            this._maxChanged.next(this._max)
        }
    }
    public get max(): Date { return this._max }
    private _max: Date
    private _maxChanged = this.destruct.subject(new Subject<Date>())

    @Output("value") public valueChange: Observable<Date> = this.destruct.subject(new Subject())
    private _renderValue = this.destruct.subject(new Subject<Date>())


    public readonly daysToRender$ = merge(this.displayed$, this._minChanged, this._maxChanged).pipe(
        map(day => {
            const monthStart = startOfMonth(day)
            const monthEnd = endOfMonth(day)
            let start = setTzToUTC(startOfWeek(monthStart, { weekStartsOn: this.weekStartsOn as any }))
            let end = setTzToUTC(endOfWeek(monthEnd, { weekStartsOn: this.weekStartsOn as any }))
            let current = start

            let weeks: Array<Array<Date>> = []
            let data: Array<Array<DayData>> = []

            let idx = 0
            while (current <= end) {
                const week = Math.floor(idx / 7)
                const day = idx % 7

                if (!weeks[week]) {
                    weeks[week] = [current]
                    data[week] = [OTHER_MONTH_DATA]
                } else {
                    weeks[week][day] = current
                    data[week][day] = OTHER_MONTH_DATA
                }

                current = addDays(current, 1)
                idx += 1
            }

            return { weeks, data, monthStart, monthEnd }
        }),
        shareReplay(1)
    )

    public readonly render$ = this.daysToRender$.pipe(
        switchMap(render => {
            let data$: Observable<{ [key: number]: DayData }> = this.dayDataProvider
                ? this.dayDataProvider.extraData(render.monthStart, render.monthEnd).pipe(startWith(null))
                : of(null)

            data$ = data$.pipe(shareReplay(1))
            let value$ = this._renderValue.pipe(startWith(this._value), shareReplay(1))

            return merge(data$, value$).pipe(
                switchMap(_ => zip(of(render), data$, value$).pipe(take(1)))
            )
        }),
        map(([render, externalData, value]) => {
            const today = new Date()

            for (let weekNumber = 0, wl = render.weeks.length; weekNumber < wl; weekNumber++) {
                const weekDays = render.weeks[weekNumber]
                for (let dayNumber = 0, dl = weekDays.length; dayNumber < dl; dayNumber++) {
                    const day = weekDays[dayNumber]
                    const sameMonth = isSameMonth(render.monthStart, day)
                    let dd: DayData = sameMonth
                        ? SAME_MONTH_DATA
                        : OTHER_MONTH_DATA

                    if (isSameDay(today, day)) {
                        dd = { ...dd, today: true }
                    }

                    if (this.isAllowed(day)) {
                        if (isSameDay(value, day)) {
                            dd = { ...dd, ...SELECTED_DATA }
                        } else if (sameMonth) {
                            const dayIndex = day.getDate()
                            if (externalData && externalData[dayIndex]) {
                                dd = { ...dd }
                                const ed = externalData[dayIndex]
                                dd.color = ed.color || dd.color
                                dd.variant = ed.variant || dd.variant
                                dd.data = ed.data || dd.data
                                dd.disabled = ed.disabled != null ? ed.disabled : false
                            }
                        }
                    } else {
                        dd = { ...dd, disabled: true }
                    }

                    render.data[weekNumber][dayNumber] = dd
                }
            }

            return render
        }),
        shareReplay(1)
    )

    public constructor(
        @Inject(DomSanitizer) protected snitizer: DomSanitizer,
        @Inject(ChangeDetectorRef) protected readonly cdr: ChangeDetectorRef,
        @Inject(LocaleService) protected readonly locale: LocaleService,
        @Inject(DatePickerDayDataProvider) @Optional() private readonly dayDataProvider: DatePickerDayDataProvider) {
        super()

        this.dayNames = this._createDayNames()

        // kell, hogy menjen a templateben is...
        this.destruct.subscription(this.render$).subscribe()
    }

    public ngOnInit() {
        this.displayed = new Date()
    }

    public writeValue(date: Date) {
        if (this._setDateField("_value", date, isSameDay)) {
            this.displayed = this._value
            this._renderValue.next(this._value)
        }
    }

    public _emitValue(date: Date) {
        this.writeValue(date);
        (this.valueChange as Subject<Date>).next(this._value)
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

    private _setDateField(name: "_value" | "_displayed" | "_min" | "_max", val: Date, isEq: (a: Date, b: Date) => boolean): boolean {
        if (val) {
            val = setTzToUTC(startOfDay(val))
        }

        if (!this[name] || !val || !isEq(this[name], val)) {
            this[name] = val
            return true
        }
        return false
    }
}

