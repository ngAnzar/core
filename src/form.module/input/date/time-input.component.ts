import { Component, Input, Inject, ElementRef, HostListener, Directive, ViewChild, HostBinding } from "@angular/core"
import { Validator, AbstractControl, ValidationErrors, NG_VALIDATORS } from "@angular/forms"
import { coerceBooleanProperty } from "@angular/cdk/coercion"
import { merge } from "rxjs"
import { debounceTime } from "rxjs/operators"
import { format } from "date-fns"
import { IMaskDirective } from "angular-imask"


import { Time } from "../../../util"
import { LocaleService } from "../../../common.module"
import { ComponentLayerRef } from "../../../layer.module"
import { InputComponent, INPUT_MODEL, InputModel, FocusChangeEvent } from "../abstract"
import { MASK_BLOCKS } from "./mask-blocks"
import { TimePickerComponent } from "./time-picker.component"
import { TimePickerService } from "./time-picker.service"


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


@Component({
    selector: ".nz-time-input",
    templateUrl: "./time-input.component.pug",
    providers: INPUT_MODEL
})
export class TimeInputComponent extends InputComponent<Time> {
    @ViewChild("input", { read: ElementRef }) public readonly input: ElementRef<HTMLInputElement>
    @ViewChild("input", { read: IMaskDirective }) public readonly inputMask: IMaskDirective<any>

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
        if (this._opened !== val) {
            this._opened = val

            if (val && !this._withoutPicker) {
                if (!this.tpRef) {
                    this.tpRef = this._showPicker()
                    this._updatePickerValue(this.model.value)
                }
            } else if (this.tpRef) {
                this.tpRef.hide()
                delete this.tpRef
            }
        }
    }
    public get opened(): boolean { return this._opened }
    private _opened: boolean
    private tpRef: ComponentLayerRef<TimePickerComponent>

    public constructor(
        @Inject(InputModel) model: InputModel<Time>,
        @Inject(ElementRef) private el: ElementRef<HTMLElement>,
        @Inject(LocaleService) protected readonly locale: LocaleService,
        @Inject(TimePickerService) private readonly timePicker: TimePickerService) {
        super(model)

        this.monitorFocus(el.nativeElement, true)

        this.destruct.subscription(this.focused).subscribe(this._handleFocus.bind(this))
        this.destruct.any(() => {
            this.opened = false
        })

        this.imaskOptions = {
            mask: this.displayFormat,
            lazy: true,
            blocks: MASK_BLOCKS
        }
    }

    protected _renderValue(obj: Time | Date | string): void {
        let value = Time.coerce(obj)

        if (value && value.isValid) {
            (this.input.nativeElement as HTMLInputElement).value = value.format(this.displayFormat)
            this._updatePickerValue(value)
        } else {
            (this.input.nativeElement as HTMLInputElement).value = ""
            this._updatePickerValue(ZEROTIME)
        }

        this.inputMask.maskRef && this.inputMask.maskRef.updateValue()
    }

    public _handleFocus(event: FocusChangeEvent) {
        const focused = event.current
        this.opened = !!focused
        this.imaskOptions.lazy = !focused

        this.inputMask.maskRef.updateOptions(this.imaskOptions)

        if (!focused) {
            if (!this.model.value) {
                this._renderValue(null)
                this.model.emitValue(null)
            }
        }
    }

    public _onAccept() {
        const value = this.inputMask.maskRef.value
        if (!/_/.test(value)) {
            const parts = value.split(/:/g)
            const set = (idx: number, name: string) => {
                if (parts[idx] != null && !/_/.test(parts[idx]) && this.tpRef) {
                    const cmp = this.tpRef.component.instance as any
                    cmp[name] = parseInt(parts[idx])
                }
            }
            set(0, "hour")
            set(1, "minute")
            set(2, "second")
        } else {
            this.model.emitValue(null)
        }
    }

    public _onComplete(value: string) {
        let time = Time.coerce(value)

        if (time.isValid) {
            this.model.emitValue(time)
            this._updatePickerValue(time)
        }
    }

    public ngAfterViewInit() {
        this._renderValue(this.model.value)
    }

    private _showPicker() {
        const ref = this.timePicker.show({
            position: {
                anchor: {
                    ref: this.el.nativeElement,
                    align: "bottom left",
                    margin: "6 0 6 0"
                },
                align: "top left"
            }
        })
        ref.show()
        const cmp = ref.component.instance

        this.destruct.subscription(cmp.valueChange)
            .pipe(debounceTime(10))
            .subscribe(time => {
                if (time.isValid) {
                    this.model.emitValue(time)
                    this._renderValue(time)
                }
            })

        return ref
    }

    private _updatePickerValue(time: Time) {
        if (this.tpRef && time) {
            const cmp = this.tpRef.component.instance
            cmp.hour = time.hours || 0
            cmp.minute = time.minutes || 0
            cmp.second = time.seconds || 0
        }
    }
}


// function coerceTime(val: Time | Date | string): Time | null {
//     if (val instanceof Time) {
//         return val
//     } else if (val instanceof Date) {
//         return new Time(format(val, "HH:mm:ss.SSS"))
//     } else if (typeof val === "string") {
//         return new Time(val)
//     } else {
//         return null
//     }
// }


