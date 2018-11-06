import { Input, Output } from "@angular/core"
import { Observable, of } from "rxjs"

import { InputModel } from "./input-model"


export abstract class InputBase<T> {
    protected abstract readonly valueModel: InputModel<T>

    @Input()
    public set value(val: T) { this.valueModel.set(val) }
    public get value(): T { return this.valueModel.get() }

    @Output()
    public get valueChange(): Observable<T> { return this.valueModel.valueChange }

    @Output()
    public readonly statusChange: Observable<void> // merge(this.valueChange, this.validationChange, this.focusChange)

    public getSubmitValue(): Observable<T> { return of(this.valueModel.get()) }
}
