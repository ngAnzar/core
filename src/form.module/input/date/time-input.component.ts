import { Component, Input, Inject, ElementRef, HostListener, Directive } from "@angular/core"
import { Validator, AbstractControl, ValidationErrors, NG_VALIDATORS } from "@angular/forms"
import { format, setHours, setMinutes, setSeconds, setMilliseconds, addMinutes } from "date-fns"

import { Time } from "../../../util"
import { InputComponent, INPUT_MODEL, InputModel, FocusChangeEvent } from "../abstract"


const MIDNIGHT = new Time("24:00:00")


@Directive({
    selector: "input[type=time][min].nz-input,input[type=time][max].nz-input",
    providers: [
        { provide: NG_VALIDATORS, useExisting: TimeValidator, multi: true }
    ]
})
export class TimeValidator implements Validator {
    @Input()
    public set min(val: Time | string | Date) {
        val = coerceTime(val)
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
        val = coerceTime(val)
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

        console.log("validate", this.min, this.max)
        return null
    }

    public registerOnValidatorChange(fn: () => void) {
        this._onChange = fn
    }
}


@Component({
    selector: "input[type=time].nz-input",
    template: "",
    providers: INPUT_MODEL
})
export class TimeInputComponent extends InputComponent<Time> {
    public constructor(
        @Inject(InputModel) model: InputModel<Time>,
        @Inject(ElementRef) private el: ElementRef<HTMLElement>) {
        super(model)

        this.monitorFocus(el.nativeElement)
        this.destruct.subscription(this.focused).subscribe(this._handleFocus.bind(this))
    }

    protected _renderValue(obj: Time | Date | string): void {
        let value = ""

        if (obj) {
            if (obj instanceof Date) {
                value = format(obj, "HH:mm")
                return this._renderValue(value)
            } else if (obj instanceof Time) {
                value = obj.format("HH:mm")
            } else if (typeof obj === "string") {
                let time = new Time(obj)
                if (time.isValid) {
                    this.model.emitValue(time, this.model.pristine)
                    return this._renderValue(time)
                }
            }
        }

        (this.el.nativeElement as HTMLInputElement).value = value
    }

    @HostListener("input", ["$event"])
    protected _handleInput(event: Event) {
        let value = (event.target as HTMLInputElement).value
        let time = new Time(value)
        if (time.isValid) {
            this.model.emitValue(time)
        } else {
            this.model.emitValue(null)
        }
    }

    protected _handleFocus(event: FocusChangeEvent) {
        if (!event.current) {
            let value = this.model.value
            if (!value) {
                (this.el.nativeElement as HTMLInputElement).value = ""
            }
        }
    }
}


function coerceTime(val: Time | Date | string): Time | null {
    if (val instanceof Time) {
        return val
    } else if (val instanceof Date) {

        return new Time(format(val, "HH:mm:ss.SSS"))
    } else if (typeof val === "string") {
        return new Time(val)
    } else {
        return null
    }
}
