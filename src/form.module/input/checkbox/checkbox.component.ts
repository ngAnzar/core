import {
    Component, ViewChild, ElementRef, AfterViewInit, Inject, Renderer2, Input, Attribute,
    Optional, ChangeDetectionStrategy, ChangeDetectorRef, Output, EventEmitter, SkipSelf, OnDestroy
} from "@angular/core"
import { NgControl, NgModel } from "@angular/forms"
import { coerceBooleanProperty } from "@angular/cdk/coercion"
import "@angular/cdk/a11y-prebuilt.css"
import { Observable } from "rxjs"

import { InputComponent, INPUT_MODEL, InputModel } from "../abstract"
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
        "(tap)": "_handleTap($event)"
    },
    providers: INPUT_MODEL,
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
        this._renderValue(this._rawValue)
    }
    public get trueValue(): T { return this._trueValue }
    protected _trueValue: T

    @Input("false-value")
    public set falseValue(val: T) {
        this._falseValue = val
        this._renderValue(this._rawValue)
    }
    public get falseValue(): T { return this._falseValue }
    protected _falseValue: T = false as any

    @Input()
    public set checked(val: boolean) {
        val = coerceBooleanProperty(val)
        if (this._checked !== val) {
            this._checked = val

            this.model.emitValue((val ? (this.trueValue == null ? true : this.trueValue) : this.falseValue) as any)

            if (this.group) {
                this.group.onCheckedChange()
            }

            this.cdr.markForCheck()
        }
    }
    public get checked(): boolean { return this._checked }
    protected _checked: boolean = false

    protected _rawValue: any

    public constructor(
        @Inject(InputModel) model: InputModel<T>,
        @Inject(ElementRef) protected readonly el: ElementRef,
        @Inject(ChangeDetectorRef) protected cdr: ChangeDetectorRef,
        @Inject(CheckboxGroupDirective) @Optional() @SkipSelf() public readonly group: CheckboxGroupDirective<any>) {
        super(model)

        this.monitorFocus(el.nativeElement, true)

        if (group) {
            group.addCheckbox(this)
        }
    }

    public get type(): string { return "checkbox" }


    protected _renderValue(obj: any): void {
        this._rawValue = obj
        this.checked = (this.trueValue == null ? Boolean(obj) : this.trueValue === obj)
    }

    public ngAfterViewInit() {
        // console.log(this.input)
    }

    protected _handleTap(event: Event) {
        if (event.defaultPrevented || this.noninteractive) {
            return
        }
        this.checked = !this.checked
    }

    public ngOnDestroy() {
        super.ngOnDestroy()
        if (this.group) {
            this.group.delCheckbox(this)
        }
    }
}


export type TristateCheckboxValue = { checked: boolean, indeterminate: boolean } | null;

@Component({
    selector: ".nz-tristate-checkbox",
    host: {
        "class": "nz-checkbox",
        "[class.nz-checkbox-indeterminate]": "indeterminate",
        "[class.nz-checkbox-checked]": "checked",
        "(tap)": "_handleTap($event)"
    },
    templateUrl: "./checkbox.template.pug",
    providers: INPUT_MODEL,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TristateCheckboxComponent extends CheckboxComponent<TristateCheckboxValue> {
    @Input()
    public set indeterminate(val: boolean) {
        val = coerceBooleanProperty(val)
        if (this._indeterminate !== val) {
            this._indeterminate = val
            this.model.emitValue({ checked: this.checked, indeterminate: this.indeterminate })
            this.cdr.markForCheck()
        }
    }
    public get indeterminate(): boolean { return this._indeterminate }
    protected _indeterminate: boolean

    protected _handleTap(event: Event) {
        if (event.defaultPrevented || !this.noninteractive) {
            return
        }

        event.preventDefault()

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
