import {
    Component, ChangeDetectionStrategy, Output, Input, Inject, Optional, OnDestroy,
    Renderer2, ChangeDetectorRef, ElementRef, EventEmitter, Attribute, SkipSelf, ViewChild, OnInit
} from "@angular/core"
import { NgControl, NgModel } from "@angular/forms"
import { coerceBooleanProperty } from "@angular/cdk/coercion"
import "@angular/cdk/a11y-prebuilt.css"
import { Observable } from "rxjs"

import { InputComponent, INPUT_MODEL, InputModel } from "../abstract"
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
        "(tap)": "_handleTap($event)"
    },
    providers: INPUT_MODEL,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RadioComponent<T = any> extends InputComponent<T> implements OnDestroy, OnInit {
    @ViewChild("input") public readonly input: ElementRef<HTMLInputElement>

    @Input()
    public set checked(val: boolean) {
        val = coerceBooleanProperty(val)
        if (this._checked !== val) {
            this._checked = val

            const value = val ? this.trueValue : this.falseValue
            this.model.emitValue(value)

            if (val && this.group) {
                this.group.setChecked(this)
            }

            this.cdr.markForCheck()
        }
    }
    public get checked(): boolean { return this._checked }
    protected _checked: boolean = false

    @Input("true-value") public trueValue: T
    @Input("false-value") public falseValue: T = null

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
        @Inject(InputModel) model: InputModel<T>,
        @Inject(ElementRef) el: ElementRef,
        @Inject(ChangeDetectorRef) protected cdr: ChangeDetectorRef,
        @Inject(RadioGroupDirective) @Optional() @SkipSelf() public readonly group: RadioGroupDirective) {
        super(model)
        this.monitorFocus(el.nativeElement)
    }

    public ngOnInit() {
        super.ngOnInit()

        if (this.group) {
            this.group.addRadio(this)
        }
    }

    protected _renderValue(value: any | null) {
        if (this.trueValue != null) {
            this.checked = this.trueValue === value
        } else {
            this.checked = !!value
        }
    }

    protected _handleTap(event: Event) {
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
