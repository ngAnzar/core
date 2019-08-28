import { Directive, Input, AfterContentInit } from "@angular/core"
import { coerceBooleanProperty } from "@angular/cdk/coercion"

import { InputComponent, INPUT_MODEL } from "../abstract"
import { CheckboxComponent } from "./checkbox.component"


@Directive({
    selector: ".nz-checkbox-group",
    exportAs: "checkboxGroup",
    providers: INPUT_MODEL
})
export class CheckboxGroupDirective<T = string> extends InputComponent<T[]> {
    @Input()
    public set name(val: string) {
        if (this._name !== val) {
            this._name = val
            this._applyProperty("name", val)
        }
    }
    public get name(): string { return this._name }
    protected _name: string

    @Input()
    public set disabled(val: boolean) {
        val = coerceBooleanProperty(val)
        if (this._disabled !== val) {
            this._disabled = val
            this._applyProperty("disabled", val)
        }
    }
    public get disabled(): boolean { return this._disabled }
    protected _disabled: boolean

    protected checkboxes: CheckboxComponent<T>[] = []
    protected _selectedValues: T[] = []

    public addCheckbox(checkbox: CheckboxComponent<T>) {
        if (this.checkboxes.indexOf(checkbox) === -1) {
            this.checkboxes.push(checkbox)
        }
        const value = this.model.value || []
        checkbox.checked = value.indexOf(checkbox.trueValue) !== -1
    }

    public delCheckbox(checkbox: CheckboxComponent<T>) {
        let idx = this.checkboxes.indexOf(checkbox)
        if (idx !== -1) {
            this.checkboxes.splice(idx, 1)
        }
    }

    public updateValue(checkbox: CheckboxComponent<T>) {
        const value = this.model.value || []
        let changed = false
        let idx = value.indexOf(checkbox.trueValue)
        if (checkbox.checked) {
            if (idx === -1) {
                changed = true
                value.push(checkbox.trueValue)
            }
        } else if (idx !== -1) {
            changed = true
            value.splice(idx, 1)
        }
        if (changed) {
            this.model.emitValue(value)
        }
    }

    protected _renderValue(value: any) {
        value = Array.isArray(value) ? value : []
        for (const chkbox of this.checkboxes) {
            chkbox.checked = value.indexOf(chkbox.trueValue) !== -1
        }
    }

    protected _applyProperty(name: string, value: any) {
        for (const chkbox of this.checkboxes) {
            (chkbox as any)[name] = value
        }
    }
}
