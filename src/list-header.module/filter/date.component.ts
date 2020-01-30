import { Component, Inject } from "@angular/core"
import { FormControl } from "@angular/forms"
import { format, parse } from "date-fns"

import { LocaleService } from "../../common.module"
import { ListFilter, ColumnFilter } from "./abstract"
import { ListFilterService } from "./list-filter.service"


const DATE_FORMAT = "yyyy-MM-dd"


@Component({
    selector: "nz-list-filter[type='date']",
    templateUrl: "./date.component.pug",
    providers: [
        { provide: ListFilter, useExisting: ListFilterDate },
        { provide: ColumnFilter, useExisting: ListFilterDate }
    ]
})
export class ListFilterDate extends ColumnFilter {
    public set isRange(val: boolean) {
        if (this._isRange !== val) {
            this._isRange = val
            if (val) {
                this.end.setValue(this.begin.value)
            } else {
                this.end.setValue(null)
            }
        }
    }
    public get isRange(): boolean { return this._isRange }
    private _isRange: boolean

    public readonly begin = new FormControl(new Date())
    public readonly end = new FormControl(new Date())

    public chipText: string

    public constructor(
        @Inject(ListFilterService) listFilterService: ListFilterService,
        @Inject(LocaleService) private readonly locale: LocaleService) {
        super(listFilterService)
    }

    public applyFilter() {
        const isRange = !!(this.isRange && this.begin.value && this.end.value)
        this.isRange = isRange

        if (this.isRange) {
            this._publishValue({
                "and": [
                    { "gte": format(this.begin.value, DATE_FORMAT) },
                    { "lte": format(this.end.value, DATE_FORMAT) }]
            })
            this.chipText = this.locale.formatDateRange(this.begin.value, this.end.value)
        } else if (this.begin.value) {
            this._publishValue({
                "eq": format(this.begin.value, DATE_FORMAT)
            })
            this.chipText = this.locale.formatDate(this.begin.value, "short")
        } else {
            this._publishValue(null)
            this.chipText = ""
        }

        this.hideLayer()
    }

    protected _writeValue(value: any): void {
        console.log(value)
        if (value instanceof Date || typeof value === "string") {
            this.isRange = false
            this.begin.setValue(asDate(value))
            return
        } else if (value) {
            if (value.eq) {
                this.isRange = false
                this.begin.setValue(asDate(value.eq))
                return
            } else if (value.and) {
                this.isRange = true
                this.begin.setValue(asDate(value.and[0].gte))
                this.end.setValue(asDate(value.and[1].lte))
                return
            }
        }

        this.isRange = false
        this.begin.setValue(null)
        this.end.setValue(null)
    }
}


function asDate(inp: string | Date): Date {
    return typeof inp === "string"
        ? parse(inp, DATE_FORMAT, new Date())
        : inp
}
