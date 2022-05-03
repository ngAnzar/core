import { Component, Input, Inject, ElementRef, Directive, ViewChild, HostBinding, ChangeDetectionStrategy, ChangeDetectorRef } from "@angular/core"
import { Validator, AbstractControl, ValidationErrors, NG_VALIDATORS } from "@angular/forms"
import { coerceBooleanProperty } from "@angular/cdk/coercion"
import { map, takeUntil } from "rxjs/operators"
import { setHours, setMinutes, setSeconds, setMilliseconds } from "date-fns"


import { Time } from "../../../util"
import { LocaleService } from "../../../common.module"
import { ComponentLayerRef } from "../../../layer.module"
import { InputComponent, INPUT_MODEL, InputModel, INPUT_MODEL_VALUE_CMP } from "../abstract"
import { MASK_BLOCKS } from "./mask-blocks"
import { TimePickerComponent } from "./time-picker.component"
import { TimePickerService } from "./time-picker.service"
import { InputMask } from "../input-mask.service"
import { InvalidDateValidator } from "./invalid-date.validator"


const MIDNIGHT = new Time("24:00:00")
const ZEROTIME = new Time("00:00:00")

@Directive({
    selector: ".nz-time-input[min],.nz-time-input[max]",
    providers: [
        { provide: NG_VALIDATORS, useExisting: TimeValidator, multi: true }
    ]
})
export class TimeValidator implements Validator {
    @Input()
    public set min(val: Time | string | Date) {
        val = Time.coerce(val)
        if (!this._min || !val || this._min.compare(val) !== 0) {
            this._min = val
            if (this._onChange) {
                this._onChange()
            }
        }
    }
    public get min(): Time | string | Date { return this._min }
    private _min: Time

    @Input()
    public set max(val: Time | string | Date) {
        val = Time.coerce(val)
        if (!this._max || !val || this._max.compare(val) !== 0) {
            this._max = val
            if (this._onChange) {
                this._onChange()
            }
        }
    }
    public get max(): Time | string | Date { return this._max }
    private _max: Time

    private _onChange: () => void

    public validate(ctrl: AbstractControl): ValidationErrors | null {
        let value = ctrl.value as Time
        if (!value || !value.isValid) {
            return null
        }

        if (this._min && this._min.isValid) {
            if (this._min.compare(value) === 1) {
                return { timeMin: true }
            }

            if (this._max && this._max.isValid) {
                if (this._min.compare(this._max) === 1) {
                    if (MIDNIGHT.compare(value) >= 0) {
                        return null
                    }
                }
            }
        }

        if (this._max && this._max.isValid) {
            if (this._max.compare(value) === -1) {
                return { timeMax: true }
            }
        }

        return null
    }

    public registerOnValidatorChange(fn: () => void) {
        this._onChange = fn
    }
}


function cmpValue(a: any, b: any) {
    if (a && b) {
        a = Time.coerce(a)
        b = Time.coerce(b)
        return a.compare(b) === 0
    } else {
        return a === b
    }
}


@Component({
    selector: ".nz-time-input",
    templateUrl: "./time-input.component.pug",
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        ...INPUT_MODEL,
        InputMask,
        InvalidDateValidator,
        { provide: NG_VALIDATORS, useExisting: InvalidDateValidator, multi: true },
        { provide: INPUT_MODEL_VALUE_CMP, useValue: cmpValue }
    ]
})
export class TimeInputComponent extends InputComponent<Time> {
    @ViewChild("input", { read: ElementRef, static: true }) public readonly input: ElementRef<HTMLInputElement>

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

    public displayFormat: string = this.locale.getDateFormat("time-short")
    public valueFormat: string = this.locale.getDateFormat("time-short")
    public imaskOptions: any

    public set opened(val: boolean) {
        if (this.timePicker.isVisible !== val) {
            if (val && this.input) {
                this.input.nativeElement.focus()
            }

            if (val && !this._withoutPicker) {
                this._showPicker()
            } else {
                this.timePicker.hide()
            }
        }
    }
    public get opened(): boolean { return this.timePicker.isVisible }
    private tpRef: ComponentLayerRef<TimePickerComponent>

    private _hour: number
    private _minute: number
    private _second: number

    public constructor(
        @Inject(InputModel) model: InputModel<Time>,
        @Inject(InputMask) private readonly mask: InputMask,
        @Inject(ElementRef) private readonly el: ElementRef<HTMLElement>,
        @Inject(LocaleService) protected readonly locale: LocaleService,
        @Inject(TimePickerService) private readonly timePicker: TimePickerService,
        @Inject(ChangeDetectorRef) private readonly cdr: ChangeDetectorRef,
        @Inject(InvalidDateValidator) private readonly dtValidator: InvalidDateValidator) {
        super(model)

        this.monitorFocus(el.nativeElement)

        this.destruct.subscription(this.focused).subscribe(event => {
            if (!event.curr) {
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

                    this._hour = toNumber(blockVals["HH"])
                    this._minute = toNumber(blockVals["mm"])
                    this._second = toNumber(blockVals["ss"])

                    const value = mask.value
                    if (!/_/g.test(value)) {
                        return Time.coerce(value)
                    } else {
                        return mask.unmaskedValue ? mask.unmaskedValue : null
                    }
                })
            )
            .subscribe(value => {
                let isValid = value === null
                if (value instanceof Time && value.isValid) {
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

    public ngAfterViewInit() {
        this.mask.connect(this.input.nativeElement, {
            mask: this.displayFormat.replace(/([\s-\.:\/\\])(?=\w)/g, "$1`"),
            lazy: false,
            overwrite: true,
            autofix: true,
            blocks: MASK_BLOCKS
        })
    }

    protected _renderValue(obj: Time | Date | string): void {
        let time = Time.coerce(obj)
        let value = ""


        if (time && time.isValid) {
            value = time.format(this.displayFormat)
        }

        if (!(this.model.value instanceof Time) && this.model.value !== time) {
            const pristine = this.model.control.pristine
            this.model.control.setValue(time, { emitModelToViewChange: false })
            if (pristine) {
                this.model.control.markAsPristine()
            }
        }
        this.mask.value = value
        !this.destruct.done && this.cdr.detectChanges()
    }

    private _showPicker() {
        this.timePicker
            .toggle({ anchor: { ref: this.el.nativeElement, align: "bottom left", margin: "6 0" }, align: "top left" }, this.value)
            .pipe(takeUntil(this.destruct.on))
            .subscribe(event => {
                if (event.type === "create") {
                    this.monitorFocus(event.layerRef.container)
                } else if (event.type === "value") {
                    const time = event.value as Time
                    if (time.isValid) {
                        this.model.emitValue(time)
                        this._renderValue(time)
                    }
                } else if (event.type === "hide") {
                    this.stopFocusMonitor(event.layerRef.container)
                }
            })
    }

    private _updatePickerValue(time: Time) {
        if (this.tpRef && time) {
            this.tpRef.component.instance.writeValue(time)
        }
    }

    private _createPartialValue(): Time {
        let date = new Date()
        let hasValue = false

        if (this._hour !== null) {
            date = setHours(date, this._hour)
            hasValue = true
        }

        if (this._minute !== null) {
            date = setMinutes(date, this._minute)
            hasValue = true
        }

        if (this._second !== null) {
            date = setSeconds(date, this._second)
            hasValue = true
        }

        if (!hasValue) {
            return null
        }

        date = setMilliseconds(date, 0)

        return Time.coerce(date)
    }
}


function toNumber(val: string): number | null {
    if (/^\d+$/.test(val)) {
        return Number(val)
    } else {
        return null
    }
}
