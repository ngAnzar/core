import { Component, Input, Inject, Optional, Renderer2, OnDestroy, EventEmitter, ElementRef, Injectable, OnInit, Injector } from "@angular/core"
import { NgControl, NgModel, ControlValueAccessor, NG_VALUE_ACCESSOR, AbstractControlDirective, AbstractControl } from "@angular/forms"

import { Observable } from "rxjs"
import * as autosize from "autosize"


let UID_COUNTER = 0


export abstract class InputComponent<T> extends AbstractControlDirective implements OnDestroy, ControlValueAccessor {
    abstract readonly type: string

    protected _uid: string = `nz-input-${++UID_COUNTER}`

    public readonly control: AbstractControl

    public get statusChanges(): Observable<any> {
        if (this.control) {
            return this.control.statusChanges
        } else if (!this._statusChanges) {
            this._statusChanges = new EventEmitter()
        }
        return this._statusChanges
    }
    private _statusChanges?: Observable<any>

    public get valueChanges(): Observable<T> {
        if (this.control) {
            return this.control.valueChanges
        } else if (!this._valueChanges) {
            this._valueChanges = new EventEmitter()
        }
        return this._valueChanges
    }
    private _valueChanges?: Observable<T>

    protected _onTouchedHandler: any
    protected _onChangeHandler: any

    public get value(): T {
        if (this.control) {
            return this.control.value
        } else {
            return this._value
        }
    }
    public set value(val: T) {
        if (this.control) {
            (this.control as any).viewToModelUpdate(val)
        } else {
            this._value = val
        }
        this.writeValue(val)
        this._handleInput(val)
    }
    protected _value: T

    @Input()
    public get id(): string { return this._id || this._uid }
    public set id(value: string) { this._id = value }
    protected _id: string

    @Input()
    public get tabIndex(): number { return this._tabIndex }
    public set tabIndex(value: number) { this._tabIndex = value }
    protected _tabIndex: number = 0

    public get focused(): boolean { return this._focused }
    protected _focused: boolean = false

    public constructor(
        @Inject(NgControl) @Optional() ngControl: NgControl,
        @Inject(NgModel) @Optional() ngModel: NgModel,
        @Inject(Renderer2) protected _renderer: Renderer2,
        @Inject(ElementRef) protected el: ElementRef) {
        super()
        this.control = (ngControl || ngModel) as any
    }

    protected _handleFocus(focused: boolean): void {
        if (this._focused !== focused) {
            this._focused = focused;
            (this.statusChanges as EventEmitter<any>).next("")
            if (!focused && this._onTouchedHandler) {
                this._onTouchedHandler()
            }
        }
    }

    protected _handleInput(value: T | null) {
        this._value = value
        if (this._onChangeHandler) {
            this._onChangeHandler(value)
        }
        if (!this.control) {
            (this.valueChanges as EventEmitter<T>).next(value)
        }
    }

    abstract writeValue(obj: T): void

    registerOnChange(fn: any): void {
        this._onChangeHandler = fn
    }

    registerOnTouched(fn: any): void {
        this._onTouchedHandler = fn
    }

    setDisabledState(isDisabled: boolean): void {
        if (this._renderer) {
            this._renderer.setProperty(this.el.nativeElement, "disabled", isDisabled)
        }
    }

    ngOnDestroy() {
        if (this._statusChanges) {
            (this._statusChanges as EventEmitter<any>).complete()
            delete this._statusChanges
        }
        if (this._valueChanges) {
            (this._valueChanges as EventEmitter<any>).complete()
            delete this._valueChanges
        }
        delete this._onTouchedHandler
        delete this._renderer
    }
}


class InputValueAccessor implements ControlValueAccessor {
    constructor(@Inject(Injector) protected injector: Injector) { }
    private _input?: InputComponent<any>
    protected get input(): InputComponent<any> {
        if (!this._input) {
            this._input = this.injector.get(InputComponent)
        }
        return this._input
    }
    writeValue(obj: any): void {
        this.input.writeValue(obj)
    }
    registerOnChange(fn: any): void {
        this.input.registerOnChange(fn)
    }
    registerOnTouched(fn: any): void {
        this.input.registerOnTouched(fn)
    }
    setDisabledState(isDisabled: boolean): void {
        this.input.setDisabledState(isDisabled)
    }
}


export const INPUT_VALUE_ACCESSOR = {
    provide: NG_VALUE_ACCESSOR,
    useClass: InputValueAccessor,
    multi: true
}


@Component({
    selector: "input.nz-input:not([type]), input[type='password'].nz-input, input[type='text'].nz-input, input[type='email'].nz-input",
    template: "",
    host: {
        "[attr.id]": "id",
        "(focus)": "_handleFocus(true)",
        "(blur)": "_handleFocus(false)",
        "(input)": "_handleInput($event.target.value)"
    },
    providers: [
        { provide: InputComponent, useExisting: TextFieldComponent },
        INPUT_VALUE_ACCESSOR
    ]
})
export class TextFieldComponent extends InputComponent<string> {
    public get type(): string { return "text" }

    writeValue(value: any): void {
        const normalizedValue = value == null ? "" : value
        if (this._renderer) {
            this._renderer.setProperty(this.el.nativeElement, "value", normalizedValue)
        }
    }

    protected _handleInput(value: string | null) {
        if (!value || value.length === 0) {
            value = null
        }
        return super._handleInput(value)
    }
}


@Component({
    selector: "textarea.nz-input",
    template: "",
    host: {
        "[attr.id]": "id",
        "(focus)": "_handleFocus(true)",
        "(blur)": "_handleFocus(false)",
        "(input)": "_handleInput($event.target.value)"
    },
    providers: [
        { provide: InputComponent, useExisting: TextareaComponent },
        INPUT_VALUE_ACCESSOR
    ]
})
export class TextareaComponent extends InputComponent<string> implements OnDestroy, OnInit {
    public get type(): string { return "text" }

    writeValue(value: any): void {
        const normalizedValue = value == null ? "" : value
        if (this._renderer) {
            this._renderer.setProperty(this.el.nativeElement, "value", normalizedValue)
        }
    }

    public ngOnInit() {
        autosize(this.el.nativeElement)
    }

    public ngOnDestroy() {
        autosize.destroy(this.el.nativeElement)
        super.ngOnDestroy()
    }

    protected _handleInput(value: string | null) {
        if (!value || value.length === 0) {
            value = null
        }
        return super._handleInput(value)
    }
}
