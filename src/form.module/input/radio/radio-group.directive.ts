import { Directive, Input } from "@angular/core"
import { coerceBooleanProperty } from "@angular/cdk/coercion"

import { InputComponent, INPUT_MODEL, InputModel } from "../abstract"
import { RadioComponent } from "./radio.component"


@Directive({
    selector: ".nz-radio-group",
    exportAs: "radioGroup",
    providers: INPUT_MODEL
})
export class RadioGroupDirective<T = any> extends InputComponent<T> {
    public get type(): string { return "radio-group" }

    @Input()
    public set name(val: string) {
        if (this._name !== val) {
            this._name = val
            this._applyProperty("name", val)
        }
    }
    public get name(): string { return this._name }
    protected _name: string

    protected radios: RadioComponent<T>[] = []

    public addRadio(radio: RadioComponent<T>) {
        radio.name = this.name

        if (this.radios.indexOf(radio) === -1) {
            this.radios.push(radio)
        }

        this._renderValue(this.model.value)
    }

    public delRadio(radio: RadioComponent<T>) {
        let idx = this.radios.indexOf(radio)
        if (idx !== -1) {
            this.radios.splice(idx, 1)
        }

        this._renderValue(this.model.value)
    }

    public setChecked(radio: RadioComponent<T>) {
        for (const r of this.radios) {
            if (r.checked = (r === radio)) {
                this.model.emitValue(radio.trueValue)
            }
        }
    }

    protected _renderValue(value: any) {
        for (const radio of this.radios) {
            if (radio.trueValue === value) {
                radio.checked = true
            }
        }
    }

    protected _applyProperty(name: string, value: any) {
        for (const radio of this.radios) {
            (radio as any)[name] = value
        }
    }
}
