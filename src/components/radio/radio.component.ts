import {
    Component, ChangeDetectionStrategy, Output, Input, Inject, Optional, OnDestroy,
    Renderer2, ChangeDetectorRef, ElementRef, EventEmitter, Attribute, SkipSelf, ViewChild
} from "@angular/core"
import { NgControl, NgModel } from "@angular/forms"
import { coerceBooleanProperty } from "@angular/cdk/coercion"
import "@angular/cdk/a11y-prebuilt.css"
import { Observable } from "rxjs"

import { InputComponent, INPUT_VALUE_ACCESSOR } from "../input/input.component"
import { RadioGroupDirective } from "./radio-group.directive"


export type LabelPosition = "before" | "after"

export interface RadioChangeEvent {
    source: RadioComponent
    checked: boolean
}


@Component({
    selector: ".nz-radio",
    templateUrl: "./radio.template.pug",
    host: {
        "[class.nz-radio-checked]": "checked",
        "(click)": "_handleClick($event)"
    },
    providers: [
        { provide: InputComponent, useExisting: RadioComponent },
        INPUT_VALUE_ACCESSOR
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RadioComponent<T = any> extends InputComponent<T> implements OnDestroy {
    @ViewChild("input") public readonly input: ElementRef<HTMLInputElement>

    @Output()
    public readonly change: Observable<RadioChangeEvent> = new EventEmitter()

    @Input()
    public set checked(val: boolean) {
        val = coerceBooleanProperty(val)
        if (this._checked !== val) {
            this._checked = val
            this._value = val ? this.trueValue : this.falseValue
            this.cdr.markForCheck();
            (this.change as EventEmitter<RadioChangeEvent>).emit({ source: this, checked: this.checked });
            (this.valueChanges as EventEmitter<T>).emit(this._value);

            if (val && this.group) {
                this.group.setChecked(this)
            }
        }
    }
    public get checked(): boolean { return this._checked }
    protected _checked: boolean = false

    @Input("true-value") public trueValue: T
    @Input("false-value") public falseValue: T = null

    public set tabIndex(val: number) {
        if (this._tabIndex !== val) {
            this._tabIndex = val
            this.cdr.markForCheck()
        }
    }
    public get tabIndex(): number { return this._tabIndex }
    protected _tabIndex: number

    @Input()
    public set name(val: string) {
        if (this._name !== val) {
            this._name = val
            this.cdr.markForCheck()
        }
    }
    public get name(): string { return this._name }
    protected _name: string

    public get type(): string { return "radio" }

    public constructor(
        @Inject(NgControl) @Optional() ngControl: NgControl,
        @Inject(NgModel) @Optional() ngModel: NgModel,
        @Inject(Renderer2) _renderer: Renderer2,
        @Inject(ElementRef) el: ElementRef,
        @Inject(ChangeDetectorRef) protected cdr: ChangeDetectorRef,
        @Attribute("tabindex") tabIndex: string,
        @Inject(RadioGroupDirective) @Optional() @SkipSelf() public readonly group: RadioGroupDirective) {
        super(ngControl, ngModel, _renderer, el)
        this.tabIndex = parseInt(tabIndex, 10)

        if (group) {
            group.addRadio(this)
        }
    }

    public writeValue(value: any | null) {
        if (this.trueValue != null) {
            this.checked = this.trueValue === value
        } else {
            this.checked = !!value
        }
    }

    protected _handleClick(event: Event) {
        this.checked = !this.checked
    }

    public _handleInputChange(event: Event) {
        this.checked = (event.target as any).checked
        event.stopPropagation()
    }

    public ngOnDestroy() {
        super.ngOnDestroy()
        if (this.group) {
            this.group.delRadio(this)
        }
    }
}
