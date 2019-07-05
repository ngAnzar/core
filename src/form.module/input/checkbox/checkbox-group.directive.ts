import { Directive, Input } from "@angular/core"
import { coerceBooleanProperty } from "@angular/cdk/coercion"

import { InputComponent, INPUT_MODEL } from "../abstract"
import { CheckboxComponent } from "./checkbox.component"


@Directive({
    selector: ".nz-checkbox-group",
    exportAs: "checkboxGroup",
    providers: INPUT_MODEL
})
export class CheckboxGroupDirective<T = string> extends InputComponent<T[]> {
    public get type(): string { return "checkbox-group" }

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
    }

    public delCheckbox(checkbox: CheckboxComponent<T>) {
        let idx = this.checkboxes.indexOf(checkbox)
        if (idx !== -1) {
            this.checkboxes.splice(idx, 1)
        }
        this.onCheckedChange()
    }

    public onCheckedChange() {
        let v: T[] = []
        for (const chk of this.checkboxes) {
            if (chk.checked) {
                v.push(chk.trueValue)
            }

        }

        this.model.emitValue(v)
    }

    protected _renderValue(value: any) {
        for (const chkbox of this.checkboxes) {
            if (chkbox.trueValue === value) {
                chkbox.checked = true
            }
        }
    }

    protected _applyProperty(name: string, value: any) {
        for (const chkbox of this.checkboxes) {
            (chkbox as any)[name] = value
        }
    }
}
