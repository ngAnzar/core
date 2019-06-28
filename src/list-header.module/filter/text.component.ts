import { Component, OnInit, EventEmitter } from "@angular/core"
import { FormControl } from "@angular/forms"

import { ListFilter, ColumnFilter } from "./abstract"
import { textOperators } from "./operators"


@Component({
    selector: "nz-list-filter[type='text']",
    templateUrl: "./text.template.pug",
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
        // if (this.operator.value && this.value.value) {
        //     return {
        //         [this.operator.value]: this.value.value
        //     }
        // } else {
        //     return null
        // }
    }

    public applyFilter() {
        // let op = textOperators.getSync(this.operator.value)
        // this.operatorText = op ? ` ${op.label} ` : null
        this.valueText = this.value.value

        this._publishValue(this.filter)
        this.hideLayer()
    }

    public _writeValue(value: any) {
        if (value) {
            this.value.setValue(value)
        } else {
            this.operator.setValue("contains")
            this.value.setValue(null)
        }
    }
}
