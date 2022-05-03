import { Component, Inject, Input, OnDestroy } from "@angular/core"
import { FormControl } from "@angular/forms"
import { coerceBooleanProperty } from "@angular/cdk/coercion"

import { ListFilter, ColumnFilter } from "./abstract"
import { ListFilterService } from "./list-filter.service"


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
    @Input()
    public set excludeable(val: boolean) { this._excludeable = coerceBooleanProperty(val) }
    public get excludeable(): boolean { return this._excludeable }
    private _excludeable: boolean = false

    public readonly includes = new FormControl()
    public readonly excludes = new FormControl()

    public includesText: string
    public excludesText: string

    // protected get filter() {
    //     return this.value.value
    // }

    public constructor(@Inject(ListFilterService) service: ListFilterService) {
        super(service)

        this._mutualExclusive(this.includes, this.excludes)
        this._mutualExclusive(this.excludes, this.includes)
    }

    public applyValue() {

        const includes = this.includes.value as any[]
        const excludes = this.excludes.value as any[]
        this._chipText(includes, excludes)

        if (includes?.length && excludes?.length) {
            this._publishValue({ "and": [{ "in": includes }, { "not in": excludes }] })
        } else if (includes?.length) {
            this._publishValue({ "in": includes })
        } else if (excludes?.length) {
            this._publishValue({ "not in": excludes })
        } else {
            this._publishValue(null)
        }

        this.hideLayer()
    }

    public _writeValue(value: any) {
        if (typeof value === "number" || typeof value === "string") {
            this.includes.setValue([value])
            this.excludes.setValue(null)
        } else if (Array.isArray(value)) {
            this.includes.setValue(value)
            this.excludes.setValue(null)
        } else if (value && value.in) {
            this.includes.setValue(value.in)
            this.excludes.setValue(null)
        } else if (value && value["not in"]) {
            this.excludes.setValue(value["not in"])
            this.includes.setValue(null)
        } else if (value && value["and"]) {
            for (const cond of value["and"]) {
                if (cond["in"]) {
                    this.includes.setValue(cond["in"])
                } else if (cond["not in"]) {
                    this.excludes.setValue(cond["not in"])
                }
            }
        } else {
            this.includes.setValue(null)
            this.excludes.setValue(null)
        }
    }

    private _chipText(includes: any[], excludes: any[]) {
        let includeLabels: string[] = []
        let excludeLabels: string[] = []

        for (const val of this.values) {
            if (includes && includes.indexOf(val.value) !== -1) {
                includeLabels.push(val.label)
            }
        }

        if (includeLabels.length) {
            this.includesText = includeLabels.join(", ")
        } else {
            this.includesText = null
        }

        for (const val of this.values) {
            if (excludes && excludes.indexOf(val.value) !== -1) {
                excludeLabels.push(val.label)
            }
        }

        if (excludeLabels.length) {
            this.excludesText = excludeLabels.join(", ")
        } else {
            this.excludesText = null
        }
    }

    private _mutualExclusive(keep: FormControl, remove: FormControl) {
        this.destruct.subscription(keep.valueChanges).subscribe((values: any[]) => {
            let removeValues = remove.value as any[]

            if (removeValues && removeValues.length && values && values.length) {
                let newValues = removeValues.filter(v => !values.includes(v))
                if (newValues.length !== removeValues.length) {
                    remove.setValue(newValues)
                }
            }
        })
    }
}
