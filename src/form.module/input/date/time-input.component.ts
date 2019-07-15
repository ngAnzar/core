import { Component, Input, Inject, ElementRef, HostListener } from "@angular/core"
import { format, setHours, setMinutes, setSeconds, setMilliseconds } from "date-fns"

import { Time } from "../../../util"
import { InputComponent, INPUT_MODEL, InputModel, FocusChangeEvent } from "../abstract"


@Component({
    selector: "input[type=time].nz-input",
    template: "",
    providers: INPUT_MODEL
})
export class TimeInputComponent extends InputComponent<Time> {
    // @Input()
    // public set date(value: Date) {
    //     value = value || new Date()
    //     if (this._rawValue) {
    //         this._date = value
    //         this.value = this._composeDate()
    //     } else {
    //         this.value = null
    //     }
    // }
    // public get date(): Date {
    //     return this._date || new Date()
    // }
    // protected _date: Date
    // protected _rawValue: { hours: number, minutes: number, seconds: number }

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
