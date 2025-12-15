import { FocusOrigin } from "@angular/cdk/a11y"
import { coerceBooleanProperty } from "@angular/cdk/coercion"
import {
    Directive,
    EventEmitter,
    HostBinding,
    Inject,
    Injectable,
    InjectionToken,
    Injector,
    Input,
    OnDestroy,
    OnInit,
    Optional,
    Output,
    Provider,
    Self
} from "@angular/core"
import {
    AbstractControl,
    AbstractControlDirective,
    ControlContainer,
    ControlValueAccessor,
    FormControl,
    NG_VALUE_ACCESSOR,
    NgControl,
    NgModel
} from "@angular/forms"

import { Observable, Subject } from "rxjs"
import { filter, map, shareReplay } from "rxjs/operators"

import isPlainObject from "is-plain-object"

import { ProgressEvent } from "../../animation.module"
import { FocusGroup } from "../../common.module"
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

@Injectable()
export class InputModel<T> extends AbstractControlDirective {
    public readonly inputChanges = new Subject<T>()
    public readonly renderValueChanges = new Subject<T>()
    // public disabledChanges = new Subject<boolean>()
    public readonly focusChanges = this.focusGroup.changes
    public readonly touchChanges = this.focusChanges.pipe(map(v => v.prev && !v.curr))
    private readonly _progress = new Subject<ProgressEvent>()
    public readonly progress = this._progress.pipe(shareReplay(1))

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
            return (this._control = new FormControl())
        }
    }
    private _control: FormControl

    public set value(value: T) {
        this.control.setValue(value)
    }
    public get value(): T {
        return this.control.value
    }
    public get isEmpty(): boolean {
        if (this._isEmpty != null) {
            return this._isEmpty
        }
        const val = this.value as any
        return val == null || val.length === 0 || (isPlainObject(val) && Object.keys(val).length === 0)
    }
    public set isEmpty(val: boolean) {
        this._isEmpty = val
    }
    private _isEmpty: boolean

    public set disabled(val: boolean) {
        if (this.control.disabled !== val) {
            if (val) {
                this.control.disable()
            } else {
                this.control.enable()
            }
        }
    }
    public get disabled(): boolean {
        return this.control.disabled
    }

    public set readonly(val: boolean) {
        if (this._readonly !== val) {
            this._readonly = val
            if (this.control) {
                ;(this.control.statusChanges as EventEmitter<string>).next("readonly")
            }
        }
    }
    public get readonly(): boolean {
        return this._readonly
    }
    private _readonly: boolean

    public get focused(): FocusOrigin | null {
        return this.focusGroup.currentOrigin
    }

    public constructor(
        @Inject(NgControl) @Optional() @Self() private readonly ngControl: NgControl,
        @Inject(NgModel) @Optional() @Self() private readonly ngModel: NgModel,
        @Inject(FocusGroup) public readonly focusGroup: FocusGroup,
        @Inject(INPUT_MODEL_VALUE_CMP) public readonly cmp: ValueComparator<T>
    ) {
        super()
    }

    public emitValue(value: T, pristine?: boolean): void {
        if (this.control && !this.control.disabled) {
            const oldValue = this.value

            if (!this.cmp(oldValue, value)) {
                this.control.setValue(value, { emitModelToViewChange: false })
                this.inputChanges.next(value)
                this.control.markAsDirty({ onlySelf: true })
            }

            // if (pristine || (this.untouched && this.focused === null)) {
            //     this.control.markAsPristine()
            // }
            if (pristine) {
                this.control.markAsPristine()
            }
        }
    }

    public emitProgress(event: ProgressEvent): void {
        this._progress.next(event)
    }
}

@Injectable()
export class InputModelVA<T> implements ControlValueAccessor {
    constructor(@Inject(Injector) private _injector: Injector) {}
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
        provide: FocusGroup,
        useClass: FocusGroup
    },
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

@Directive()
export abstract class InputComponent<T> implements OnDestroy, OnInit {
    public readonly destruct = new Destruct()

    // public abstract readonly isTextlike: boolean

    @Input("value")
    public set value(val: T) {
        this.model.value = val
        this.model.renderValueChanges.next(val)
    }
    public get value(): T {
        return this.model.value
    }

    @Output("value")
    public get valueChanges(): Observable<T> {
        return this.model.valueChanges
    }

    @HostBinding("class.nz-has-value")
    public get hasValue(): boolean {
        return !this.model.isEmpty
    }

    @Input()
    @HostBinding("attr.tabindex")
    public set tabIndex(val: number) {
        if (this._tabIndex !== val) {
            this._tabIndex = val
        }
    }
    public get tabIndex(): number {
        return this._tabIndex
    }
    protected _tabIndex: number = 0

    @Input("disableInput")
    public set disabled(val: boolean) {
        if (this._inited) {
            this.model.disabled = val
        } else {
            this._pendingDisabled = val
        }
    }
    public get disabled(): boolean {
        return this.model.disabled
    }

    @HostBinding("attr.disabled")
    public get disabledAttr(): string {
        return this.disabled ? "" : null
    }

    @Input()
    @HostBinding("attr.id")
    public set id(val: string) {
        this._id = val
    }
    public get id(): string {
        return this._id || (this._uid ? this._uid : (this._uid = `nz-input-${++UID_COUNTER}`))
    }
    private _id: string
    private _uid: string

    @Input()
    public set readonly(val: boolean) {
        val = coerceBooleanProperty(val)
        if (this._inited) {
            this.model.readonly = val
        } else {
            this._pendingReadonly = val
        }
    }
    public get readonly(): boolean {
        return this.model.disabled || this.model.readonly
    }

    @HostBinding("attr.readonly")
    public get readonlyAttr(): string {
        return this.model.readonly ? "" : null
    }

    @Output() public readonly changes = this.model.valueChanges
    @Output() public readonly focused = this.model.focusChanges

    protected _inited = false

    public readonly focusOrigin = this.model.focusGroup.changes.pipe(map(evt => evt.curr))
    private _pendingDisabled: boolean
    private _pendingReadonly: boolean

    public constructor(@Inject(InputModel) public readonly model: InputModel<T>) {
        this.destruct.subscription(model.renderValueChanges).subscribe((value: T) => {
            if (this._inited) {
                this._renderValue(value)
            }
        })
    }

    public ngOnInit() {
        this._inited = true

        if (this._pendingDisabled != null) {
            this.disabled = this._pendingDisabled
        }

        if (this._pendingReadonly != null) {
            this.readonly = this._pendingReadonly
        }

        this._renderValue(this.model.value)
    }

    protected abstract _renderValue(value: T): void

    protected monitorFocus(el: HTMLElement): void {
        this.model.focusGroup.watch(el)
    }

    protected stopFocusMonitor(el: HTMLElement) {
        this.model.focusGroup.unwatch(el)
    }

    public ngOnDestroy() {
        this.destruct.run()
    }
}

@Injectable()
export class InputGroupModel<T> extends InputModel<T> {
    public get control(): AbstractControl {
        return this.cc.control
    }

    public constructor(
        @Inject(ControlContainer) @Self() private cc: ControlContainer,
        @Inject(FocusGroup) focusGroup: FocusGroup,
        @Inject(INPUT_MODEL_VALUE_CMP) @Optional() cmp: ValueComparator<T>
    ) {
        super(null, null, focusGroup, cmp || (() => false))
    }
}
