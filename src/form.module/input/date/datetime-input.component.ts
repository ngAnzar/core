import { Component, HostBinding, Inject, ElementRef, Input, ViewChild, ChangeDetectorRef, ChangeDetectionStrategy } from "@angular/core"
import { NG_VALIDATORS } from "@angular/forms"
import { coerceBooleanProperty } from "@angular/cdk/coercion"
import { parse, format, getDaysInMonth } from "date-fns"
import { map } from "rxjs/operators"

import { LocaleService } from "../../../common.module"
import { ComponentLayerRef } from "../../../layer.module"
import { InputComponent, INPUT_MODEL, InputModel } from "../abstract"
import { InputMask } from "../input-mask.service"
import { DatetimePickerComponent } from "./datetime-picker.component"
import { MASK_BLOCKS } from "./mask-blocks"
import { DatetimePickerService } from "./datetime-picker.service"
import { InvalidDateValidator } from "./invalid-date.validator"



@Component({
    selector: ".nz-datetime-input",
    templateUrl: "./datetime-input.template.pug",
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        ...INPUT_MODEL,
        InputMask,
        InvalidDateValidator,
        { provide: NG_VALIDATORS, useExisting: InvalidDateValidator, multi: true }
    ]
})
export class DatetimeInputComponent extends InputComponent<Date> {
    @ViewChild("input", { read: ElementRef, static: true }) public readonly input: ElementRef<HTMLInputElement>

    @HostBinding("attr.tabindex")
    public readonly tabIndexAttr = -1

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

    public displayFormat: string = this.locale.getDateFormat("short+time-short")
    public valueFormat: string = "yyyy-MM-dd HH:mm:ss"

    public set opened(val: boolean) {
        if (this._opened !== val) {
            this._opened = val

            if (val) {
                this.input.nativeElement.focus()
            }

            if (val && !this._withoutPicker) {
                if (!this.pickerRef) {
                    this.pickerRef = this._showPicker()
                    this._updatePickerValue(this.model.value)
                }
            } else if (this.pickerRef) {
                this.pickerRef.hide()
                delete this.pickerRef
            }
        }
    }
    public get opened(): boolean { return this._opened }
    private _opened: boolean
    private pickerRef: ComponentLayerRef<DatetimePickerComponent>

    private _year: number
    private _month: number
    private _day: number
    private _hour: number
    private _minute: number

    public constructor(
        @Inject(InputModel) model: InputModel<Date>,
        @Inject(InputMask) private readonly mask: InputMask,
        @Inject(ElementRef) private el: ElementRef<HTMLElement>,
        @Inject(LocaleService) protected readonly locale: LocaleService,
        @Inject(DatetimePickerService) private readonly picker: DatetimePickerService,
        @Inject(ChangeDetectorRef) private readonly cdr: ChangeDetectorRef,
        @Inject(InvalidDateValidator) private readonly dtValidator: InvalidDateValidator) {
        super(model)

        this.monitorFocus(el.nativeElement, true)

        this.destruct.subscription(this.focused).subscribe(event => {
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
                    this._hour = toNumber(blockVals["HH"])
                    this._minute = toNumber(blockVals["mm"])

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
                    this.model.emitValue(value)
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

    protected _renderValue(obj: Date | string) {
        let value = ""
        if (obj instanceof Date) {
            value = format(obj, this.displayFormat)
        } else if (typeof obj === "string" && obj.length) {
            this._renderValue(this.parseString(obj))
            return
        }

        this.mask.value = value
        !this.destruct.done && this.cdr.detectChanges()
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

    private _showPicker(): ComponentLayerRef<DatetimePickerComponent> {
        const ref = this.picker.show({
            position: {
                anchor: {
                    ref: this.el.nativeElement,
                    align: "bottom left",
                    margin: "6 0 6 0"
                },
                align: "top left"
            },
            crop: this.el.nativeElement
        })
        ref.show()
        const cmp = ref.component.instance

        this.destruct.subscription(cmp.valueChange).subscribe(value => {
            if (value) {
                this._renderValue(value)
                this.model.emitValue(value)
            }
        })

        const outletEl = ref.outlet.nativeElement
        this.monitorFocus(outletEl, true)

        let s = ref.subscribe((event) => {
            if (event.type === "hiding") {
                this.model.focusMonitor.stopMonitoring(outletEl)
                this.opened = false
                s.unsubscribe()
            }
        })

        return ref
    }

    private _updatePickerValue(value: Date) {
        if (this.pickerRef && value && !isNaN(value.getTime())) {
            this.pickerRef.component.instance.writeValue(value)
        }
    }

    private _createPartialValue(): Date {
        const today = new Date()
        const year = this._year || today.getFullYear()
        const month = this._month === null ? today.getMonth() : this._month - 1
        return new Date(
            year,
            month,
            this._day || Math.min(getDaysInMonth(new Date(year, month)), today.getDate()),
            this._hour || 0,
            this._minute || 0)
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
}


function toNumber(val: string): number | null {
    if (/^\d+$/.test(val)) {
        return Number(val)
    } else {
        return null
    }
}
