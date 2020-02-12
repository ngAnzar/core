import { Component, OnInit, EventEmitter } from "@angular/core"
import { FormControl } from "@angular/forms"

import { ListFilter, ColumnFilter } from "./abstract"
import { textOperators } from "./operators"


@Component({
    selector: "nz-list-filter[type='text']",
    templateUrl: "./text.component.pug",
    providers: [
        { provide: ListFilter, useExisting: ListFilterText },
        { provide: ColumnFilter, useExisting: ListFilterText }
    ]
})
export class ListFilterText extends ColumnFilter {
    public readonly operator = new FormControl("contains")
    public readonly value = new FormControl()
    public readonly operators = textOperators

    public operatorText: string
    public valueText: string

    protected get filter() {
        return this.value.value
    }

    public applyValue() {
        this.valueText = this.value.value

        if (this.operator.value && this.value.value) {
            this._publishValue({ [this.operator.value]: this.value.value })
        } else {
            this._publishValue(null)
        }

        this.hideLayer()
    }

    public _writeValue(value: any) {
        if (typeof value === "string") {
            this.value.setValue(value)
        } else if (value) {
            const keys = Object.keys(value)
            if (keys.length === 1) {
                this.operator.setValue(keys[0])
                this.value.setValue(value[keys[0]])
            } else {
                throw new Error("Invalid filter: " + JSON.stringify(value))
            }
        } else {
            this.operator.setValue("contains")
            this.value.setValue(null)
        }
    }
}
