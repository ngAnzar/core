import { Component, Inject, ElementRef, ViewChild, AfterViewInit, ChangeDetectorRef, ChangeDetectionStrategy, Input, HostBinding, Directive } from "@angular/core"
import { NG_VALIDATORS, Validator, AbstractControl, ValidationErrors } from "@angular/forms"
import { coerceBooleanProperty } from "@angular/cdk/coercion"
import { take, map, takeUntil, takeWhile } from "rxjs/operators"
import { parse, isDate, format, startOfDay, getDaysInMonth, parseISO, isSameDay, isValid, differenceInDays } from "date-fns"


import { setTzToUTC } from "../../../util"
import { LocaleService } from "../../../common.module"
import { ComponentLayerRef } from "../../../layer.module"
import { InputComponent, INPUT_MODEL, InputModel, INPUT_MODEL_VALUE_CMP } from "../abstract"
import { InputMask } from "../input-mask.service"
import { DatePickerService } from "./date-picker.service"
import { DatePickerComponent } from "./date-picker.component"
import { MASK_BLOCKS } from "./mask-blocks"
import { InvalidDateValidator } from "./invalid-date.validator"


@Directive({
    selector: ".nz-date-input[min],.nz-date-input[max]",
    host: {
        "(tap)": "isButtonVariant && !readonly && !disabled && (opened=!opened)"
    },
    providers: [
        { provide: NG_VALIDATORS, useExisting: DateMinMaxValidator, multi: true }
    ]
})
export class DateMinMaxValidator implements Validator {
    @Input()
    public set min(val: string | Date) {
        val = this._corceDate(val)
        if (!this._min || !val || !isSameDay(this._min, val)) {
            this._min = val
            if (this._onChange) {
                this._onChange()
            }
        }
    }
    public get min(): string | Date { return this._min }
    private _min: Date

    @Input()
    public set max(val: string | Date) {
        val = this._corceDate(val)
        if (!this._max || !val || !isSameDay(this._max, val)) {
            this._max = val
            if (this._onChange) {
                this._onChange()
            }
        }
    }
    public get max(): string | Date { return this._max }
    private _max: Date

    private _onChange: () => void

    public validate(ctrl: AbstractControl): ValidationErrors | null {
        let value = ctrl.value as Date
        if (!value || !isValid(value)) {
            return null
        }

        if (this._min && isValid(this._min)) {
            if (differenceInDays(startOfDay(value), this._min) < 0) {
                return { dateMin: true }
            }
        }

        if (this._max && isValid(this._max)) {
            if (differenceInDays(startOfDay(value), this._max) > 0) {
                return { dateMax: true }
            }
        }

        return null
    }

    public registerOnValidatorChange(fn: () => void) {
        this._onChange = fn
    }

    private _corceDate(val: string | Date): Date {
        return val instanceof Date
            ? startOfDay(val)
            : startOfDay(parseISO(val))
    }
}


function cmpDate(a: Date, b: Date) {
    return a && b && isSameDay(a, b)
}


@Component({
    selector: ".nz-date-input",
    templateUrl: "./date-input.component.pug",
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        "[attr.variant]": "isButtonVariant ? 'button' : null"
    },
    providers: [
        ...INPUT_MODEL,
        InputMask,
        InvalidDateValidator,
        { provide: NG_VALIDATORS, useExisting: InvalidDateValidator, multi: true },
        { provide: INPUT_MODEL_VALUE_CMP, useValue: cmpDate }
    ]
})
export class DateInputComponent extends InputComponent<Date> implements AfterViewInit {
    @ViewChild("input", { read: ElementRef, static: false }) public readonly input: ElementRef<HTMLInputElement>

    @Input() public min: Date
    @Input() public max: Date

    @Input()
    public set withoutPicker(val: boolean) {
        val = coerceBooleanProperty(val)
        if (this._withoutPicker !== val) {
            this._withoutPicker = val
            if (val) {
                this.opened = false
            }
        }
    }
    public get withoutPicker(): boolean { return this._withoutPicker }
    private _withoutPicker: boolean = false

    public get isButtonVariant(): boolean { return this.datePicker.isDialogMode }

    @HostBinding("attr.tabindex")
    public readonly tabIndexAttr = -1

    // protected dpRef: ComponentLayerRef<DatePickerComponent>

    public set opened(val: boolean) {
        if (this.datePicker.isVisible !== val) {

            if (val && this.input) {
                this.input.nativeElement.focus()
            }

            if (val && !this._withoutPicker) {
                this._showPicker()
            } else {
                this.datePicker.hide()
            }
        }
    }
    public get opened(): boolean { return this.datePicker.isVisible }

    public displayFormat: string = this.locale.getDateFormat("short")
    public valueFormat: string = "yyyy-MM-dd"

    private _year: number
    private _month: number
    private _day: number

    public constructor(
        @Inject(InputModel) model: InputModel<Date>,
        @Inject(InputMask) private readonly mask: InputMask,
        @Inject(ElementRef) protected readonly el: ElementRef<HTMLElement>,
        @Inject(LocaleService) protected readonly locale: LocaleService,
        @Inject(DatePickerService) protected readonly datePicker: DatePickerService,
        @Inject(ChangeDetectorRef) protected readonly cdr: ChangeDetectorRef,
        @Inject(InvalidDateValidator) private readonly dtValidator: InvalidDateValidator) {
        super(model)

        this.monitorFocus(el.nativeElement, true)

        this.destruct.subscription(model.focusChanges).subscribe(event => {
            if (!event.current) {
                this.opened = false
            }
            this.cdr.detectChanges()
        })

        this.destruct.any(() => {
            this.opened = false
        })

        this.destruct.subscription(mask.accept)
            .pipe(
                map(mask => {
                    model.isEmpty = Boolean(!mask.unmaskedValue || mask.unmaskedValue.length === 0)

                    const blockVals = mask.blockValues

                    this._year = toNumber(blockVals["yyyy"])
                    this._month = toNumber(blockVals["MM"])
                    this._day = toNumber(blockVals["dd"])

                    const value = mask.value
                    if (!/_/g.test(value)) {
                        return this.locale.parseDate(this.displayFormat, value)
                    } else {
                        return mask.unmaskedValue ? mask.unmaskedValue : null
                    }
                })
            )
            .subscribe(value => {
                let isValid = value === null
                if (value instanceof Date && !isNaN(value.getTime())) {
                    this.model.emitValue(value = setTzToUTC(startOfDay(value)))
                    this._updatePickerValue(value)
                    isValid = true
                } else {
                    this.model.emitValue(null)
                    this._updatePickerValue(this._createPartialValue())
                }

                if (this.dtValidator.isValid !== isValid) {
                    this.dtValidator.isValid = isValid
                    this.model.control.updateValueAndValidity()
                }
            })

    }

    public ngAfterViewInit() {
        this.mask.connect(this.input.nativeElement, {
            mask: this.displayFormat.replace(/([\s-\.:\/\\])(?=\w)/g, "$1`"),
            lazy: false,
            overwrite: true,
            autofix: true,
            blocks: MASK_BLOCKS
        })
    }

    protected _renderValue(obj: Date | string): void {
        let value = ""
        if (obj instanceof Date) {
            obj = setTzToUTC(startOfDay(obj))
            value = format(obj, this.displayFormat)
            this.model.emitValue(obj)
        } else if (typeof obj === "string" && obj.length) {
            this._renderValue(this.parseString(obj))
            return
        }
        this.mask.value = value
        !this.destruct.done && this.cdr.detectChanges()
    }

    protected parseString(str: string) {
        let formats = [this.valueFormat, this.displayFormat]

        for (const fmt of formats) {
            let res = parse(str, fmt, new Date())
            if (!isNaN(res.getTime())) {
                return res
            }
        }

        return null
    }

    private _showPicker() {
        let date: Date = this.value ? isDate(this.value) ? this.value as any : this.parseString(this.value as any) : null

        const sub = this.datePicker
            .toggle({ anchor: { ref: this.el.nativeElement, align: "bottom left", margin: "6 0" }, align: "top left" }, date)
            .pipe(takeUntil(this.destruct.on))
            .subscribe(event => {
                if (event.type === "create") {
                    if (!date) {
                        event.instance.displayed = new Date()
                    }

                    if (this.min) {
                        event.instance.min = this.min
                    }

                    if (this.max) {
                        event.instance.max = this.max
                    }
                    this.monitorFocus(event.layerRef.container, true)
                } else if (event.type === "value") {
                    const value = setTzToUTC(startOfDay(event.value))
                    this._renderValue(value)
                    this.model.emitValue(value)
                    this.stopFocusMonitor(event.layerRef.container)
                    sub.unsubscribe()
                } else if (event.type === "hide") {
                    this.stopFocusMonitor(event.layerRef.container)
                }
            })
    }

    private _updatePickerValue(value: Date) {
        if (this.datePicker.instance && value && !isNaN(value.getTime())) {
            this.datePicker.instance.writeValue(value)
        }
    }

    private _createPartialValue(): Date {
        const today = new Date()
        const year = this._year || today.getFullYear()
        const month = this._month === null ? today.getMonth() : this._month - 1
        return setTzToUTC(new Date(
            year,
            month,
            this._day || Math.min(getDaysInMonth(new Date(year, month)), today.getDate())))
    }

    // public _onAccept() {
    //     let inputVal: Date = parse(this.inputMask.maskRef.value, this.displayFormat, new Date())
    //     if (isNaN(inputVal.getTime())) {
    //         this.model.emitValue(null)
    //     }
    // }

    // public _onComplete(value: string) {
    //     let inputVal: Date = parse(value, this.displayFormat, new Date())
    //     // this.opened = false
    //     this.model.emitValue(setTzToUTC(startOfDay(inputVal)))
    // }


}


function toNumber(val: string): number | null {
    if (/^\d+$/.test(val)) {
        return Number(val)
    } else {
        return null
    }
}
