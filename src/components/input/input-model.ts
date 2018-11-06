import { EventEmitter, Inject, Optional, Host } from "@angular/core"
import { NgControl, NgModel, AbstractControl } from "@angular/forms"

import { Observable } from "rxjs"


export abstract class InputModel<T> {
    public set(val: T) {
        if (!this._value || !val || !this.isEq(this._value, val)) {
            (this.valueChange as EventEmitter<T>).emit(this._value = val)
            this.isEmpty = this._valueIsEmpty(val)
        }
    }
    public get(): T {
        return this._value
    }
    protected _value: T

    public readonly valueChange: Observable<T> = new EventEmitter<T>()


    public set isEmpty(val: boolean) {
        val = !!val
        if (this._isEmpty !== val) {
            (this.isEmptyChange as EventEmitter<boolean>).emit(this._isEmpty = val)
        }
    }
    public get isEmpty(): boolean {
        return this._isEmpty
    }
    protected _isEmpty: boolean = true
    public readonly isEmptyChange: Observable<boolean> = new EventEmitter<boolean>()

    protected model: AbstractControl

    public constructor(
        @Inject(NgControl) @Optional() @Host() control: NgControl,
        @Inject(NgModel) @Optional() @Host() model: NgModel) {
        this.model = control || model
    }

    public isEq(v1: T, v2: T) {
        return v1 === v2
    }

    protected abstract _valueIsEmpty(value: T): boolean
}
