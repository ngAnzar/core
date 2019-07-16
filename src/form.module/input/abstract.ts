import { Inject, Optional, Self, SkipSelf, Input, Output, HostBinding, Host, Injector, Provider, OnDestroy, InjectionToken, OnInit } from "@angular/core"
import { AbstractControl, ControlValueAccessor, NgControl, NgModel, FormControl, AbstractControlDirective, NG_VALUE_ACCESSOR, ControlContainer, FormGroupName, FormGroup } from "@angular/forms"
import { FocusOrigin, FocusMonitor } from "@angular/cdk/a11y"
import { Observable, Subject } from "rxjs"
import { map, filter } from "rxjs/operators"

import isPlainObject from "is-plain-object"

import { Destruct } from "../../util"


export type ValueComparator<T> = (a: T, b: T) => boolean
export const INPUT_MODEL_VALUE_CMP = new InjectionToken<ValueComparator<any>>("INPUT_MODEL_VALUE_CMP")
export function inputValueComparator<T>(a: T, b: T): boolean {
    if (_suppertedComparable(a) && _suppertedComparable(b)) {
        return a == b
    } else {
        return false
    }
}
function _suppertedComparable(a: any): boolean {
    switch (typeof a) {
        case "string":
        case "number":
        case "boolean":
            return true
        default:
            return a == null || a instanceof Date
    }
}


export interface FocusChangeEvent {
    prev: FocusOrigin | null
    current: FocusOrigin | null
}


export class InputModel<T> extends AbstractControlDirective {
    public inputChanges = new Subject<T>()
    public renderValueChanges = new Subject<T>()
    // public disabledChanges = new Subject<boolean>()
    public focusChanges = new Subject<FocusChangeEvent>()
    public touchChanges = this.focusChanges.pipe(map(v => v.prev && !v.current))

    public get path(): string[] | null {
        return this.ngControl ? this.ngControl.path : this.ngModel ? this.ngModel.path : null
    }

    public get control(): AbstractControl {
        if (this.ngModel) {
            return this.ngModel.control
        } else if (this.ngControl) {
            return this.ngControl.control
        } else if (this._control) {
            return this._control
        } else {
            return this._control = new FormControl()
        }
    }
    private _control: FormControl

    public set value(value: T) { this.control.setValue(value) }
    public get value(): T { return this.control.value }
    public get isEmpty(): boolean {
        const val = this.value as any
        return !val || val.length === 0 || (isPlainObject(val) && Object.keys(val).length === 0)
    }

    public set disabled(val: boolean) {
        if (this.control.disabled !== val) {
            if (val) {
                this.control.disable()
            } else {
                this.control.enable()
            }
        }
    }
    public get disabled(): boolean { return this.control.disabled }

    public set focused(val: FocusOrigin | null) {
        if (this._focused !== val) {
            let prev = this._focused
            this._focused = val
            this.focusChanges.next({ prev: prev, current: val })
        }
    }
    public get focused(): FocusOrigin | null { return this._focused }
    private _focused: FocusOrigin | null = null

    public constructor(
        @Inject(NgControl) @Optional() @Self() private readonly ngControl: NgControl,
        @Inject(NgModel) @Optional() @Self() private readonly ngModel: NgModel,
        @Inject(FocusMonitor) public readonly focusMonitor: FocusMonitor,
        @Inject(INPUT_MODEL_VALUE_CMP) public readonly cmp: ValueComparator<T>) {
        super()
    }

    public emitValue(value: T, pristine?: boolean): void {
        if (this.control && !this.control.disabled) {
            let oldValue = this.value
            this.control.setValue(value, { emitModelToViewChange: false })

            if (!this.cmp(oldValue, value)) {
                this.inputChanges.next(value)
            }

            if (pristine || (this.untouched && this.focused === null)) {
                this.control.markAsPristine()
            }
        }
    }
}


export class InputModelVA<T> implements ControlValueAccessor {
    constructor(@Inject(Injector) private _injector: Injector) { }
    private _model?: InputModel<T>
    protected get model(): InputModel<T> {
        if (!this._model) {
            this._model = this._injector.get(InputModel) as InputModel<T>
        }
        return this._model
    }

    public writeValue(obj: T): void {
        this.model.renderValueChanges.next(obj)
    }

    public registerOnChange(fn: (val: T) => void): void {
        this.model.inputChanges.subscribe(fn)
    }

    public registerOnTouched(fn: any): void {
        this.model.touchChanges.pipe(filter(v => v)).subscribe(fn)
    }

    public setDisabledState(isDisabled: boolean): void {
        this.model.disabled = isDisabled
    }
}


export const INPUT_MODEL: Provider[] = [
    {
        provide: NG_VALUE_ACCESSOR,
        useClass: InputModelVA,
        multi: true
    },
    {
        provide: InputModel,
        useClass: InputModel
    },
    {
        provide: INPUT_MODEL_VALUE_CMP,
        useValue: inputValueComparator
    }
]


let UID_COUNTER = 0

export abstract class InputComponent<T> implements OnDestroy, OnInit {
    public readonly destruct = new Destruct()

    // public abstract readonly isTextlike: boolean

    @Input("value")
    public set value(val: T) { this.model.value = val }
    public get value(): T { return this.model.value }

    @Output("value")
    public get valueChanges(): Observable<T> { return this.model.valueChanges }

    @HostBinding("class.nz-has-value")
    public get hasValue(): boolean { return !this.model.isEmpty }

    @Input()
    @HostBinding("attr.tabindex")
    public tabIndex: number = 0

    @Input("disableInput")
    public set disabled(val: boolean) { this.model.disabled = val }
    public get disabled(): boolean { return this.model.disabled }

    @HostBinding("attr.disabled")
    public get disabledAttr(): string { return this.disabled ? "" : null }

    @Input()
    @HostBinding("attr.id")
    public set id(val: string) { this._id = val }
    public get id(): string { return this._id || (this._uid ? this._uid : (this._uid = `nz-input-${++UID_COUNTER}`)) }
    private _id: string
    private _uid: string

    @Output() public readonly changes = this.model.valueChanges
    @Output() public readonly focused = this.model.focusChanges

    private _inited = false

    public constructor(@Inject(InputModel) protected readonly model: InputModel<T>) {
        this.destruct.subscription(model.renderValueChanges).subscribe((value: T) => {
            if (this._inited) {
                this._renderValue(value)
            }
        })
    }

    public ngOnInit() {
        this._inited = true
        this._renderValue(this.model.value)
    }

    protected abstract _renderValue(value: T): void

    protected monitorFocus(el: HTMLElement, checkChildren?: boolean): void {
        this.destruct.subscription(this.model.focusMonitor.monitor(el, checkChildren)).subscribe(f => {
            this.model.focused = f
        })
        this.destruct.any(() => this.model.focusMonitor.stopMonitoring(el))
    }

    public ngOnDestroy() {
        this.destruct.run()
    }
}



export class InputGroupModel<T> extends InputModel<T> {
    public get control(): AbstractControl {
        return this.cc.control
    }

    public constructor(
        @Inject(ControlContainer) @Self() private cc: ControlContainer,
        @Inject(FocusMonitor) focusMonitor: FocusMonitor,
        @Inject(INPUT_MODEL_VALUE_CMP) public readonly cmp: ValueComparator<T>) {
        super(null, null, focusMonitor, cmp)
    }
}
