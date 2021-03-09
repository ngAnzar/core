import { Component, Inject } from "@angular/core"
import { FormControl } from "@angular/forms"
import { format, parse } from "date-fns"

import { LocaleService } from "../../common.module"
import { ListFilter, ColumnFilter } from "./abstract"
import { ListFilterService } from "./list-filter.service"


@Component({
    selector: "nz-list-filter[type='number']",
    templateUrl: "./number.component.pug",
    providers: [
        { provide: ListFilter, useExisting: ListFilterNumber },
        { provide: ColumnFilter, useExisting: ListFilterNumber }
    ]
})
export class ListFilterNumber extends ColumnFilter {
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

    public readonly begin = new FormControl(null)
    public readonly end = new FormControl(null)

    public chipText: string

    public constructor(
        @Inject(ListFilterService) listFilterService: ListFilterService,
        @Inject(LocaleService) private readonly locale: LocaleService) {
        super(listFilterService)
    }

    public applyValue() {
        const isRange = !!(this.isRange && this.begin.value && this.end.value)
        this.isRange = isRange

        if (this.isRange) {
            this._publishValue({
                "and": [
                    { "gte": asNumber(this.begin.value) },
                    { "lte": asNumber(this.end.value) }]
            })
            this.chipText = `${this.begin.value} — ${this.end.value}`
        } else if (this.begin.value) {
            this._publishValue({
                "eq": asNumber(this.begin.value)
            })
            this.chipText = `${this.begin.value}`
        } else {
            this._publishValue(null)
            this.chipText = ""
        }

        this.hideLayer()
    }

    protected _writeValue(value: any): void {
        if (typeof value === "number" || typeof value === "string") {
            this.isRange = false
            this.begin.setValue(asNumber(value))
            return
        } else if (value) {
            if (value.eq) {
                this.isRange = false
                this.begin.setValue(asNumber(value.eq))
                return
            } else if (value.and) {
                this.isRange = true
                this.begin.setValue(asNumber(value.and[0].gte))
                this.end.setValue(asNumber(value.and[1].lte))
                return
            }
        }

        this.isRange = false
        this.begin.setValue(null)
        this.end.setValue(null)
    }
}


function asNumber(inp: string | Number): Number | null {
    let res = Number(inp)
    return isNaN(res) ? null : res
}
