import { Component, OnInit, EventEmitter } from "@angular/core"
import { FormControl } from "@angular/forms"

import { GridFilter, ColumnGridFilter } from "./abstract"
import { textOperators } from "./operators"


@Component({
    selector: "nz-grid-filter[type='text']",
    templateUrl: "./text.template.pug",
    providers: [
        { provide: GridFilter, useExisting: GridFilterText },
        { provide: ColumnGridFilter, useExisting: GridFilterText }
    ]
})
export class GridFilterText extends ColumnGridFilter {
    public readonly operator = new FormControl("contains")
    public readonly value = new FormControl()
    public readonly operators = textOperators

    public operatorText: string
    public valueText: string

    protected get filter() {
        if (this.operator.value && this.value.value) {
            return {
                [this.operator.value]: this.value.value
            }
        } else {
            return null
        }
    }

    public applyFilter() {
        let op = textOperators.getSync(this.operator.value)
        this.operatorText = op ? ` ${op.label} ` : null
        this.valueText = this.value.value

        this._publishValue(this.filter)
        this.hideLayer()
    }

    public _writeValue(value: any) {
        if (value) {
            let operator = Object.keys(value)[0]
            this.operator.setValue(operator)
            this.value.setValue(value[operator])
        } else {
            this.operator.setValue("contains")
            this.value.setValue(null)
        }
    }
}
