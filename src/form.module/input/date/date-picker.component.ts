import { Component, Inject, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, Input, Output } from "@angular/core"
import { DomSanitizer, SafeStyle } from "@angular/platform-browser"
import { Observable, Subject } from "rxjs"
import { startOfWeek, startOfMonth, endOfWeek, endOfMonth, addDays, isToday, isSameDay, isSameMonth, addMonths, subMonths } from "date-fns"

import { LocaleService } from "../../../common.module"


@Component({
    selector: "nz-date-picker",
    templateUrl: "./date-picker.template.pug",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DatePickerComponent implements OnInit {
    // 0 - sunday, 1 - monday
    public weekStartsOn: number = 1
    public dayNames: string[] = []
    public days: Date[]

    @Input()
    public set selected(val: Date) {
        if (!this._selected || !val || !isSameDay(this._selected, val)) {
            this._selected = val
            this.displayed = val;
            (this.changed as Subject<Date>).next(val)
            this.cdr.detectChanges()
        }
    }
    public get selected(): Date { return this._selected }
    private _selected: Date

    @Input()
    public set displayed(val: Date) {
        if (!this._displayed || !val || !isSameMonth(this._displayed, val)) {
            this._displayed = val
            this.days = this._createDays()

            let rc = this.days.length / 7 + 1
            this.gridTemplate = this.snitizer.bypassSecurityTrustStyle(`repeat(${rc}, 1fr) / repeat(7, 1fr)`)
            this.cdr.detectChanges()
        }
    }
    public get displayed(): Date { return this._displayed }
    private _displayed: Date

    @Output() public changed: Observable<Date> = new Subject()

    public gridTemplate: SafeStyle

    public constructor(
        @Inject(DomSanitizer) protected snitizer: DomSanitizer,
        @Inject(ChangeDetectorRef) protected readonly cdr: ChangeDetectorRef,
        @Inject(LocaleService) protected readonly locale: LocaleService,
    ) {

        this.dayNames = this._createDayNames()
    }

    public ngOnInit() {
        this.selected = new Date()
    }

    public isToday(d: Date) {
        return isToday(d)
    }

    public isSelected(d: Date) {
        return isSameDay(this._selected, d)
    }

    public isSameMonth(d: Date) {
        return isSameMonth(this._displayed, d)
    }

    public decMonth() {
        this.displayed = subMonths(this._displayed, 1)
    }

    public incMonth() {
        this.displayed = addMonths(this._displayed, 1)
    }

    private _createDayNames(): string[] {
        let result: string[] = []
        let start = startOfWeek(new Date(), { weekStartsOn: this.weekStartsOn as any })

        result.push(this.locale.formatDate(start, "dd"))

        for (let i = 1; i < 7; i++) {
            result.push(this.locale.formatDate(addDays(start, i), "dd"))
        }

        return result
    }

    private _createDays(): Date[] {
        let start = startOfWeek(startOfMonth(this.displayed), { weekStartsOn: this.weekStartsOn as any })
        let end = endOfWeek(endOfMonth(this.displayed), { weekStartsOn: this.weekStartsOn as any })
        let current = start
        let result: Date[] = []

        while (current <= end) {
            result.push(current)
            current = addDays(current, 1)
        }

        return result
    }
}

