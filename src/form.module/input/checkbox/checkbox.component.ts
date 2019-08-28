import {
    Component, ViewChild, ElementRef, Inject, Input,
    Optional, ChangeDetectionStrategy, ChangeDetectorRef, SkipSelf, OnDestroy
} from "@angular/core"
import { coerceBooleanProperty } from "@angular/cdk/coercion"
import "@angular/cdk/a11y-prebuilt.css"
import { Subject, merge } from "rxjs"
import { debounceTime, map, takeUntil } from "rxjs/operators"

import { InputComponent, INPUT_MODEL, InputModel } from "../abstract"
import { CheckboxGroupDirective } from "./checkbox-group.directive"
// import { LabelDirective } from "../../directives/label.directive"


export type LabelPosition = "before" | "after"


export interface CheckboxState {
    checked: boolean,
    indeterminate: boolean
}


export interface CheckboxChangeEvent<T> extends CheckboxState {
    source: CheckboxComponent<T>
}



@Component({
    selector: ".nz-checkbox",
    templateUrl: "./checkbox.template.pug",
    host: {
        "[class.nz-checkbox-checked]": "checked",
        "[class.nz-checkbox-indeterminate]": "indeterminate",
        "(tap)": "_handleTap($event)"
    },
    providers: INPUT_MODEL,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CheckboxComponent<T = boolean> extends InputComponent<T> implements OnDestroy {
    @ViewChild("input") protected readonly input: ElementRef<HTMLInputElement>
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
            if (this.group) {
                this.group.addCheckbox(this)
            }
            this._values$.next()
        }
    }
    public get trueValue(): T { return this._trueValue }
    protected _trueValue: T

    @Input("false-value")
    public set falseValue(val: T) {
        if (this._falseValue !== val) {
            this._falseValue = val
            this._values$.next()
        }
    }
    public get falseValue(): T { return this._falseValue }
    protected _falseValue: T

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
        if (this._checked !== val) {
            this._checked = val
            this._checked$.next()
        }
    }
    public get checked(): boolean { return this._checked }
    protected _checked: boolean = false
    private _checked$ = new Subject()

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
                this.cdr.detectChanges()
            })
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
        this._checked = false
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
        } else if (value && "checked" in value && "indeterminate" in value) {
            return value
        } else {
            return { checked: false, indeterminate: false }
        }
    }

    private _getValue(): any {
        if (this._checked && this._indeterminate) {
            if (this._indeterminateValue != null) {
                return this._indeterminateValue
            } else {
                return { checked: true, indeterminate: true }
            }
        } else if (this._checked) {
            if (this._trueValue != null) {
                return this._trueValue
            } else {
                return true
            }
        } else {
            if (this._falseValue != null) {
                return this._falseValue
            } else {
                return false
            }
        }
    }
}


// export type TristateCheckboxValue = { checked: boolean, indeterminate: boolean } | null;

// @Component({
//     selector: ".nz-tristate-checkbox",
//     host: {
//         "class": "nz-checkbox",
//         "[class.nz-checkbox-indeterminate]": "indeterminate",
//         "[class.nz-checkbox-checked]": "checked",
//         "(tap)": "_handleTap($event)"
//     },
//     templateUrl: "./checkbox.template.pug",
//     providers: INPUT_MODEL,
//     changeDetection: ChangeDetectionStrategy.OnPush
// })
// export class TristateCheckboxComponent extends CheckboxComponent<TristateCheckboxValue> {
    // @Input()
    // public set indeterminate(val: boolean) {
    //     val = coerceBooleanProperty(val)
    //     if (this._indeterminate !== val) {
    //         this._indeterminate = val
    //         this.model.emitValue({ checked: this.checked, indeterminate: this.indeterminate })
    //         this.cdr.markForCheck()
    //     }
    // }
    // public get indeterminate(): boolean { return this._indeterminate }
    // protected _indeterminate: boolean

//     protected _handleTap(event: Event) {
//         if (event.defaultPrevented || !this.noninteractive) {
//             return
//         }

//         event.preventDefault()

        // if (this.checked) {
        //     if (this.indeterminate) {
        //         this.indeterminate = false
        //     } else {
        //         this.checked = false
        //     }
        // } else {
        //     this.checked = true
        //     this.indeterminate = true
        // }
//     }
// }
