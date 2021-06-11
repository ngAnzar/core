import {
    Component, ViewChild, ElementRef, Inject, Input,
    Optional, ChangeDetectionStrategy, ChangeDetectorRef, SkipSelf, OnDestroy, OnInit
} from "@angular/core"
import { coerceBooleanProperty } from "@angular/cdk/coercion"
import "@angular/cdk/a11y-prebuilt.css"
import { Subject, merge, BehaviorSubject } from "rxjs"
import { debounceTime, map, takeUntil, startWith } from "rxjs/operators"

import { InputComponent, INPUT_MODEL, InputModel, INPUT_MODEL_VALUE_CMP } from "../abstract"
import { CheckboxGroupDirective } from "./checkbox-group.directive"
import { isPlainObject } from "is-plain-object"
// import { LabelDirective } from "../../directives/label.directive"


export type LabelPosition = "before" | "after"


export interface CheckboxState {
    checked: boolean,
    indeterminate: boolean
}


export interface CheckboxChangeEvent<T> extends CheckboxState {
    source: CheckboxComponent<T>
}


function cmpValue(a: any, b: any) {
    if (isPlainObject(a)) {
        return isPlainObject(b) && a.checked === b.checked && a.indeterminate === b.indeterminate
    } else {
        return a === b
    }
}


@Component({
    selector: ".nz-checkbox",
    templateUrl: "./checkbox.template.pug",
    host: {
        "[class.nz-checkbox-checked]": "checked",
        "[class.nz-checkbox-indeterminate]": "indeterminate",
        "(tap)": "_handleTap($event)"
    },
    providers: [
        ...INPUT_MODEL,
        { provide: INPUT_MODEL_VALUE_CMP, useValue: cmpValue }
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CheckboxComponent<T = boolean> extends InputComponent<T> implements OnDestroy, OnInit {
    @ViewChild("input", { static: true }) protected readonly input: ElementRef<HTMLInputElement>
    @Input()
    public set noninteractive(val: boolean) {
        val = coerceBooleanProperty(val)
        if (this._noninteractive !== val) {
            this._noninteractive = val
        }
    }
    public get noninteractive(): boolean { return this._noninteractive }
    private _noninteractive: boolean = false

    @Input("true-value")
    public set trueValue(val: T) {
        if (this._trueValue !== val) {
            this._trueValue = val
            this._values$.next()
        }
    }
    public get trueValue(): T { return this._trueValue }
    protected _trueValue: T = true as any

    @Input("false-value")
    public set falseValue(val: T) {
        if (this._falseValue !== val) {
            this._falseValue = val
            this._values$.next()
        }
    }
    public get falseValue(): T { return this._falseValue }
    protected _falseValue: T = false as any

    @Input("indeterminate-value")
    public set indeterminateValue(val: T) {
        if (this._indeterminateValue !== val) {
            this._indeterminateValue = val
            this._values$.next()
        }
    }
    public get indeterminateValue(): T { return this._indeterminateValue }
    protected _indeterminateValue: T
    private _values$ = new Subject()


    @Input()
    public set checked(val: boolean) {
        val = coerceBooleanProperty(val)
        if (this._checked$.value !== val) {
            this._checked$.next(val)
        }
    }
    public get checked(): boolean { return this._checked$.value }
    private _checked$ = new BehaviorSubject<boolean>(false)

    @Input()
    public set indeterminate(val: boolean) {
        val = coerceBooleanProperty(val)
        if (this._indeterminate !== val) {
            this._indeterminate = val
            this._indeterminate$.next()
        }
    }
    public get indeterminate(): boolean { return this._indeterminate }
    protected _indeterminate: boolean = false
    private _indeterminate$ = new Subject()

    protected _rawValue: any

    public constructor(
        @Inject(InputModel) model: InputModel<T>,
        @Inject(ElementRef) protected readonly el: ElementRef,
        @Inject(ChangeDetectorRef) protected cdr: ChangeDetectorRef,
        @Inject(CheckboxGroupDirective) @Optional() @SkipSelf() public readonly group: CheckboxGroupDirective<any>) {
        super(model)

        this.monitorFocus(el.nativeElement, true)
    }

    public ngOnInit() {
        if (this.group) {
            this.group.addCheckbox(this)
        }

        merge(this._checked$, this._indeterminate$, this._values$)
            .pipe(
                map(_ => {
                    const val = this._getValue()
                    this.model.emitValue(val)
                    if (this.group) {
                        this.group.updateValue(this)
                    }
                    return val
                }),
                debounceTime(30),
                takeUntil(this.destruct.on)
            )
            .subscribe(val => {
                this._renderValue(val)
                this.cdr.markForCheck()
            })

        this.destruct.subscription(this.model.valueChanges).subscribe(value => {
            this._renderValue(value)
        })

        super.ngOnInit()
    }

    protected _renderValue(obj: any): void {
        let state = this._determineStateFromValue(obj)
        this.checked = state.checked
        this.indeterminate = state.indeterminate
    }

    protected _handleTap(event: Event) {
        if (event.defaultPrevented || this.noninteractive || this.disabled) {
            return
        }
        event.preventDefault()
        this.model.control.markAsTouched()

        if (this.indeterminateValue != null) {
            if (this.checked) {
                if (this.indeterminate) {
                    this.indeterminate = false
                } else {
                    this.checked = false
                }
            } else {
                this.checked = true
                this.indeterminate = true
            }
        } else {
            this.checked = !this.checked
        }
    }

    public ngOnDestroy() {
        // this.checked = false
        if (this.group) {
            this.group.updateValue(this)
            this.group.delCheckbox(this)
        }
        super.ngOnDestroy()
    }

    private _determineStateFromValue(value: any): CheckboxState {
        if (typeof value === "boolean") {
            return { checked: value, indeterminate: false }
        } else if (this.trueValue != null && this.trueValue === value) {
            return { checked: true, indeterminate: false }
        } else if (this.falseValue != null && this.falseValue === value) {
            return { checked: false, indeterminate: false }
        } else if (this.indeterminateValue != null && this.indeterminateValue === value) {
            return { checked: true, indeterminate: true }
        } else if (isPlainObject(value) && value && "checked" in value && "indeterminate" in value) {
            return value
        } else {
            return { checked: false, indeterminate: false }
        }
    }

    private _getValue(): any {
        if (this.checked && this._indeterminate) {
            if (this._indeterminateValue != null) {
                return this._indeterminateValue
            } else {
                return { checked: true, indeterminate: true }
            }
        } else if (this.checked) {
            return this._trueValue
        } else {
            return this._falseValue
        }
    }
}
