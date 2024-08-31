import {
    Component, ContentChild, ContentChildren, QueryList, AfterContentInit, NgZone,
    ChangeDetectionStrategy, ChangeDetectorRef, ElementRef, Inject, OnDestroy, Input, HostBinding, InjectionToken, Optional, HostListener
} from "@angular/core"
import { merge } from "rxjs"
import { startWith, debounceTime, tap } from "rxjs/operators"

import { Destruct, Destructible } from "../../util"
import { InputModel } from "../input/abstract"
import { ErrorMessageDirective } from "../error/error-message.directive"
import { FocusGroup } from "../../common.module"


export const FORM_FIELD_DEFAULT_VARIANT = new InjectionToken<FormFieldVariant>("FORM_FIELD_DEFAULT_VARIANT")


export class FormFieldVariant {
    private _attrValue: string

    public constructor(
        public readonly underline: boolean,
        public readonly outline: boolean,
        public readonly transparent: boolean,
        public readonly slim: boolean,
        public readonly small?: boolean) {
        if (this.underline && this.outline) {
            this.underline = false
        }

        if (!this.underline && !this.outline) {
            this.underline = true
        }
    }

    public get attrValue(): string {
        if (this._attrValue == null) {
            let parts = []

            if (this.small) {
                parts.push("small")
            }
            if (this.outline) {
                parts.push("outline")
            }
            if (this.underline) {
                parts.push("underline")
            }
            if (this.transparent) {
                parts.push("transparent")
            }
            if (this.slim) {
                parts.push("slim")
            }
            return this._attrValue = parts.join(" ")
        } else {
            return this._attrValue
        }
    }
}


const DEFAULT_VARIANT = new FormFieldVariant(true, false, false, false)
// const UNDERLINE_VARIANT = new FormFieldVariant(false, true, true, false)


@Component({
    selector: ".nz-form-field",
    templateUrl: "./form-field.component.pug",
    host: {
        "[class.nz-focused]": "!!focusGroup.currentOrigin",
        "[class.ng-invalid]": "_inputModel.invalid && (isTouched || _inputModel.touched || _inputModel.dirty)",
        "[attr.disabled]": "_inputModel.disabled ? '' : null"
    },
    providers: [FocusGroup],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FormFieldComponent extends Destructible implements AfterContentInit, OnDestroy {

    public readonly showUnderline: boolean

    @ContentChild(InputModel, { static: true }) public _inputModel: InputModel<any>
    @ContentChildren(ErrorMessageDirective) public messages: QueryList<ErrorMessageDirective>

    @Input()
    public set variant(val: string) {
        if (this._variant !== val) {
            this._variant = val
            const parts = val ? val.split(/\s+/g) : []
            this._variantParsed = new FormFieldVariant(
                parts.includes("underline"),
                parts.includes("outline"),
                parts.includes("transparent"),
                parts.includes("slim"),
                parts.includes("small"),
            )
        }
    }
    public get variant(): string { return this._variant }
    private _variant: string
    private _variantParsed = DEFAULT_VARIANT

    @HostBinding("attr.variant")
    public get variantAttr(): string {
        return this._variantParsed?.attrValue
    }

    public get isUnderline(): boolean { return this._variantParsed.underline || false }
    public get isOutline(): boolean { return this._variantParsed.outline || false }
    public get isTransparent(): boolean { return this._variantParsed.transparent || false }
    public get isSlim(): boolean { return this._variantParsed.slim || false }

    isTouched: boolean = false

    public constructor(
        @Inject(ElementRef) public readonly el: ElementRef<HTMLElement>,
        @Inject(ChangeDetectorRef) private readonly cdr: ChangeDetectorRef,
        @Inject(FocusGroup) public readonly focusGroup: FocusGroup,
        @Inject(FORM_FIELD_DEFAULT_VARIANT) @Optional() defaultVariant?: FormFieldVariant) {
        super()

        if (defaultVariant) {
            this._variantParsed = defaultVariant
        }
    }

    public ngAfterContentInit(): void {
        const q1 = this._inputModel.statusChanges.pipe(debounceTime(100))
        const focus = this.focusGroup.changes.pipe(tap(event => {
            if (event.curr === null && event.prev !== null) {
                this.isTouched = true
            }
        }))

        this.destruct.subscription(merge(q1, focus))
            .subscribe(this.cdr.detectChanges.bind(this.cdr))
    }
}
