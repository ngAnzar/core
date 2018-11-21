import { OnDestroy, EventEmitter, Input, Inject, Optional, ElementRef, Injector } from "@angular/core"
import { AbstractControlDirective, ControlValueAccessor, AbstractControl, NgModel, NgControl, NG_VALUE_ACCESSOR } from "@angular/forms"
import { Observable } from "rxjs"


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
        // this.writeValue(val)
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
        // @Inject(Renderer2) protected _renderer: Renderer2,
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
        this.el.nativeElement.disabled = isDisabled
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
