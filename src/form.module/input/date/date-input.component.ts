import { Component, Inject, ElementRef, ViewChild, AfterViewInit, ChangeDetectorRef, ChangeDetectionStrategy, Input, HostBinding } from "@angular/core"
import { NG_VALIDATORS } from "@angular/forms"
import { coerceBooleanProperty } from "@angular/cdk/coercion"
import { take, map } from "rxjs/operators"
import { parse, isDate, format, startOfDay, getDaysInMonth } from "date-fns"


import { setTzToUTC } from "../../../util"
import { LocaleService } from "../../../common.module"
import { ComponentLayerRef } from "../../../layer.module"
import { InputComponent, INPUT_MODEL, InputModel } from "../abstract"
import { InputMask } from "../input-mask.service"
import { DatePickerService } from "./date-picker.service"
import { DatePickerComponent } from "./date-picker.component"
import { MASK_BLOCKS } from "./mask-blocks"
import { InvalidDateValidator } from "./invalid-date.validator"


@Component({
    selector: ".nz-date-input",
    templateUrl: "./date-input.component.pug",
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        ...INPUT_MODEL,
        InputMask,
        InvalidDateValidator,
        { provide: NG_VALIDATORS, useExisting: InvalidDateValidator, multi: true }
    ]
})
export class DateInputComponent extends InputComponent<Date> implements AfterViewInit {
    @ViewChild("input", { read: ElementRef, static: true }) public readonly input: ElementRef<HTMLInputElement>

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

    @HostBinding("attr.tabindex")
    public readonly tabIndexAttr = -1

    protected dpRef: ComponentLayerRef<DatePickerComponent>

    public set opened(val: boolean) {
        if (this._opened !== val) {
            this._opened = val

            if (val && this.input) {
                this.input.nativeElement.focus()
            }

            if (val && !this._withoutPicker) {
                if (!this.dpRef) {
                    this.dpRef = this._showPicker()
                }
            } else if (this.dpRef) {
                this.dpRef.hide()
                delete this.dpRef
            }
        }
    }
    public get opened(): boolean { return this._opened }
    private _opened: boolean

    public displayFormat: string = this.locale.getDateFormat("short")
    public valueFormat: string = "yyyy-MM-dd"

    private _year: number
    private _month: number
    private _day: number

    public constructor(
        @Inject(InputModel) model: InputModel<Date>,
        @Inject(InputMask) private readonly mask: InputMask,
        @Inject(ElementRef) protected readonly el: ElementRef,
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
                    isValid = true
                } else {
                    this.model.emitValue(value = this._createPartialValue())
                }
                this._updatePickerValue(value)

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
            this.model.emitValue(obj, false)
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

    private _showPicker(): ComponentLayerRef<DatePickerComponent> {
        let date: Date = this.value ? isDate(this.value) ? this.value as any : this.parseString(this.value as any) : null
        const ref = this.datePicker.show({
            position: {
                anchor: {
                    ref: this.el.nativeElement,
                    align: "bottom left",
                    margin: "6 0 6 0"
                },
                align: "top left"
            },
            type: "date",
            initial: date,
            value: date,
            min: this.min,
            max: this.max
        })
        ref.show()
        const cmp = ref.component.instance

        this.destruct.subscription(cmp.valueChange).pipe(take(1)).subscribe(value => {
            if (value) {
                value = setTzToUTC(startOfDay(value))
                this._renderValue(value)
                this.model.emitValue(value)
            }
        })

        let s = ref.subscribe((event) => {
            if (event.type === "hiding") {
                this.opened = false
                s.unsubscribe()
            }
        })

        return ref
    }

    private _updatePickerValue(value: Date) {
        if (this.dpRef && value && !isNaN(value.getTime())) {
            this.dpRef.component.instance.writeValue(value)
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
