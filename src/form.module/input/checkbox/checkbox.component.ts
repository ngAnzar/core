import {
    Component, ViewChild, ElementRef, AfterViewInit, Inject, Renderer2, Input, Attribute,
    Optional, ChangeDetectionStrategy, ChangeDetectorRef, Output, EventEmitter, SkipSelf, OnDestroy
} from "@angular/core"
import { NgControl, NgModel } from "@angular/forms"
import { coerceBooleanProperty } from "@angular/cdk/coercion"
import "@angular/cdk/a11y-prebuilt.css"
import { Observable } from "rxjs"

import { InputComponent, INPUT_VALUE_ACCESSOR } from "../abstract"
import { CheckboxGroupDirective } from "./checkbox-group.directive"
// import { LabelDirective } from "../../directives/label.directive"


export type LabelPosition = "before" | "after"


export interface CheckboxChangeEvent<T> {
    source: CheckboxComponent<T>
    checked: boolean
    indeterminate?: boolean
}


@Component({
    selector: ".nz-checkbox",
    templateUrl: "./checkbox.template.pug",
    host: {
        "[class.nz-checkbox-checked]": "checked",
        "(click)": "_handleClick($event)"
    },
    providers: [
        { provide: InputComponent, useExisting: CheckboxComponent },
        INPUT_VALUE_ACCESSOR
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CheckboxComponent<T = boolean> extends InputComponent<T> implements AfterViewInit, OnDestroy {
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
        this._trueValue = val
        this.writeValue(this._rawValue)
    }
    public get trueValue(): T { return this._trueValue }
    protected _trueValue: T

    @Input("false-value")
    public set falseValue(val: T) {
        this._falseValue = val
        this.writeValue(this._rawValue)
    }
    public get falseValue(): T { return this._falseValue }
    protected _falseValue: T = false as any

    @Output()
    public readonly change: Observable<CheckboxChangeEvent<T>> = new EventEmitter()

    @Input()
    public set checked(val: boolean) {
        val = coerceBooleanProperty(val)
        if (this._checked !== val) {
            this._checked = val;
            (this.change as EventEmitter<CheckboxChangeEvent<T>>).emit({ source: this, checked: this.checked });
            this.value = (val ? (this.trueValue == null ? true : this.trueValue) : this.falseValue) as any

            if (this.group) {
                this.group.onCheckedChange()
            }

            this.cdr.markForCheck()
        }
    }
    public get checked(): boolean { return this._checked }
    protected _checked: boolean = false

    public set tabIndex(val: number) {
        if (this._tabIndex !== val) {
            this._tabIndex = val
            this.cdr.markForCheck()
        }
    }
    public get tabIndex(): number { return this._tabIndex }
    protected _tabIndex: number

    protected _rawValue: any

    public constructor(
        @Inject(NgControl) @Optional() ngControl: NgControl,
        @Inject(NgModel) @Optional() ngModel: NgModel,
        // @Inject(Renderer2) _renderer: Renderer2,
        @Inject(ElementRef) el: ElementRef,
        @Inject(ChangeDetectorRef) protected cdr: ChangeDetectorRef,
        @Attribute('tabindex') tabIndex: string,
        @Inject(CheckboxGroupDirective) @Optional() @SkipSelf() public readonly group: CheckboxGroupDirective) {
        super(ngControl, ngModel, el)
        this.tabIndex = parseInt(tabIndex, 10)

        if (group) {
            group.addCheckbox(this)
        }
    }

    public get type(): string { return "checkbox" }


    public writeValue(obj: any): void {
        this._rawValue = obj
        this.checked = (this.trueValue == null ? Boolean(obj) : this.trueValue === obj)
    }

    public ngAfterViewInit() {
        // console.log(this.input)
    }

    protected _changeHandler(event: Event) {
        event.stopPropagation()
    }

    protected _handleClick(event: Event) {
        if (!this.noninteractive) {
            this.checked = !this.checked
        }
    }

    public ngOnDestroy() {
        super.ngOnDestroy()
        if (this.group) {
            this.group.delCheckbox(this)
        }
    }
}


export type TristateCheckboxValue = { checked: boolean, indeterminate: boolean } | null

@Component({
    selector: ".nz-tristate-checkbox",
    host: {
        "class": "nz-checkbox",
        "[class.nz-checkbox-indeterminate]": "indeterminate",
        "[class.nz-checkbox-checked]": "checked",
        "(click)": "_handleClick($event)"
    },
    templateUrl: "./checkbox.template.pug"
})
export class TristateCheckboxComponent extends CheckboxComponent<TristateCheckboxValue> {
    @Input()
    public set indeterminate(val: boolean) {
        val = coerceBooleanProperty(val)
        if (this._indeterminate !== val) {
            this._indeterminate = val
            this._value = { checked: this.checked, indeterminate: this.indeterminate };
            this.cdr.markForCheck();
            (this.change as EventEmitter<CheckboxChangeEvent<TristateCheckboxValue>>).emit({ source: this, checked: this.checked, indeterminate: this.indeterminate })
        }
    }
    public get indeterminate(): boolean { return this._indeterminate }
    protected _indeterminate: boolean

    protected _handleClick(event: Event) {
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
    }
}
