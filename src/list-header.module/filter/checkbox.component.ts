import { Component, Input, OnDestroy } from "@angular/core"
import { FormControl } from "@angular/forms"

import { ListFilter, ColumnFilter } from "./abstract"


export type CheckboxData = { value: any, label: string }


@Component({
    selector: "nz-list-filter[type='checkbox']",
    templateUrl: "./checkbox.component.pug",
    providers: [
        { provide: ListFilter, useExisting: ListFilterCheckbox },
        { provide: ColumnFilter, useExisting: ListFilterCheckbox }
    ]
})
export class ListFilterCheckbox extends ColumnFilter implements OnDestroy {
    @Input() public values: CheckboxData[]

    public readonly value = new FormControl()

    public chipText: string

    protected get filter() {
        return this.value.value
    }

    public applyValue() {
        const value = this.value.value as any[]
        this.chipText = this._chipText(value)

        if (value && value.length) {
            this._publishValue({ "in": value })
        } else {
            this._publishValue(null)
        }

        this.hideLayer()
    }

    public _writeValue(value: any) {
        if (typeof value === "number" || typeof value === "string") {
            this.value.setValue([value])
        } else if (Array.isArray(value)) {
            this.value.setValue(value)
        } else if (value && value.in) {
            this.value.setValue(value.in)
        } else {
            this.value.setValue(null)
        }
    }

    private _chipText(value: any[]): string {
        let labels: string[] = []
        for (const val of this.values) {
            if (value && value.indexOf(val.value) !== -1) {
                labels.push(val.label)
            }
        }
        return labels.join(", ")
    }
}
