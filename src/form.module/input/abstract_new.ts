import { Inject, Optional, Input, Output, HostBinding, Host } from "@angular/core"
import { AbstractControl, ControlValueAccessor, NgControl, NgModel, FormControl, AbstractControlDirective } from "@angular/forms"
import { Observable } from "rxjs"

import { AnzarComponent } from "../../common.module/abstract-component"


export class InputModel<T> extends AbstractControlDirective implements ControlValueAccessor {
    public readonly control: AbstractControl

    public constructor(
        @Inject(NgControl) @Optional() ngControl: NgControl,
        @Inject(NgModel) @Optional() ngModel: NgModel) {
        super()

        if (ngModel) {
            this.control = ngModel.control
        } else if (ngControl) {
            this.control = ngControl.control
        } else {
            this.control = new FormControl()
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
    public abstract readonly isTextlike: boolean

    @Input("value")
    public set value(val: T) { this.model.value = val }
    public get value(): T { return this.model.value }

    @Output("value")
    public get valueChanges(): Observable<T> { return this.model.valueChanges }


    @Input()
    @HostBinding("attr.tabindex")
    public set tabIndex(val: number) { this._tabIndex = val }
    public get tabIndex(): number { return this._tabIndex }
    private _tabIndex: number = 0


    @Input()
    @HostBinding("attr.id")
    public set id(val: string) { this._id = val }
    public get id(): string { return this._id || (this._uid ? this._uid : (this._uid = `nz-input-${++UID_COUNTER}`)) }
    private _id: string
    private _uid: string

    public constructor(@Inject(InputModel) public readonly model: InputModel<T>) {
        super()
    }
}


import { Component } from "@angular/core"


@Component({
    providers: [
        { provide: InputModel, useClass: InputModel }
    ]
})
export class TextInputComponent {

}
