import { Inject, Optional } from "@angular/core"
import { AbstractControl, ControlValueAccessor, NgControl, NgModel, FormControl } from "@angular/forms"
import { AnzarComponent } from "../../common.module/abstract-component"


export class InputModel<T> implements ControlValueAccessor {
    protected readonly control: FormControl

    public constructor(
        @Inject(NgControl) @Optional() ngControl: NgControl,
        @Inject(NgModel) @Optional() ngModel: NgModel) {

        if (ngModel) {
            this.control = ngModel.control
        } else if (ngControl) {
            this.control = ngControl.control
        }

    }

    public set value(val: T) {

    }

    public get value(): T {
        return null
    }

    public writeValue(obj: T): void {
        this.value = obj
    }

    public registerOnChange(fn: any): void {

    }

    public registerOnTouched(fn: any): void {

    }

    public setDisabledState(isDisabled: boolean): void {

    }
}


let UID_COUNTER = 0

export abstract class InputComponent<T> extends AnzarComponent {
    public abstract readonly canUnderline: boolean

    public set value(val: T) { this.model.value = val }
    public get value(): T { return this.model.value }


    protected _uid: string = `nz-input-${++UID_COUNTER}`

    public constructor(@Inject(InputModel) public readonly model: InputModel<T>) {
        super()
    }
}
