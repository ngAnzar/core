import { Directive, Input } from "@angular/core"
import { coerceBooleanProperty } from "@angular/cdk/coercion"

import { InputComponent, INPUT_VALUE_ACCESSOR } from "../input/input.component"
import { RadioComponent } from "./radio.component"


@Directive({
    selector: ".nz-radio-group",
    exportAs: "radioGroup",
    providers: [
        { provide: InputComponent, useExisting: RadioGroupDirective },
        INPUT_VALUE_ACCESSOR
    ]
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

    protected radios: RadioComponent<T>[] = []

    public addRadio(radio: RadioComponent<T>) {
        radio.name = this.name

        if (this.radios.indexOf(radio) === -1) {
            this.radios.push(radio)
        }
    }

    public delRadio(radio: RadioComponent<T>) {
        let idx = this.radios.indexOf(radio)
        if (idx !== -1) {
            this.radios.splice(idx, 1)
        }
    }

    public setChecked(radio: RadioComponent<T>) {
        for (const r of this.radios) {
            r.checked = r === radio
            this._value = radio.trueValue
        }
    }

    public writeValue(value: any) {
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
