import { Component, EventEmitter, Output, Input, Inject, ChangeDetectorRef } from "@angular/core"
import { merge, Subject } from "rxjs"
import { debounceTime, shareReplay, map } from "rxjs/operators"

import { Destructible, Time } from "../../../util"
import { PickerPopup } from "./abstract"
import { LayerRef } from "../../../layer.module"


@Component({
    selector: "nz-time-picker",
    host: {
        "[style.width]": "(_showButtons ? 200 : 16 * 2 + 28 * 2 + 8 * 2 + 25) + 'px'"
    },
    templateUrl: "./time-picker.component.pug"
})
export class TimePickerComponent extends Destructible implements PickerPopup<Time | Date | String> {
    @Input()
    public set showButtons(val: boolean) {
        if (this._showButtons !== val) {
            this._showButtons = val
            this.cdr.markForCheck()
        }
    }
    public get showButtons(): boolean { return this._showButtons }
    private _showButtons: boolean = false


    public set hour(val: number) {
        if (this._hour !== val) {
            this._hour = val
            this.hourChange.next(val)
        }
    }
    public get hour(): number { return this._hour }
    private _hour: number = 0
    public readonly hourChange = this.destruct.subject(new EventEmitter<number>())

    public set minute(val: number) {
        if (this._minute !== val) {
            this._minute = val
            this.minuteChange.next(val)
        }
    }
    public get minute(): number { return this._minute }
    private _minute: number = 0
    public readonly minuteChange = this.destruct.subject(new EventEmitter<number>())

    public set second(val: number) {
        if (this._second !== val) {
            this._second = val
            this.secondChange.next(val)
        }
    }
    public get second(): number { return this._second }
    private _second: number = 0
    public readonly secondChange = this.destruct.subject(new EventEmitter<number>())

    public get value(): Time | Date | string { return this._value }
    private _value: Time

    @Output("value") public readonly valueChange = new Subject<Time>()

    public constructor(
        @Inject(ChangeDetectorRef) private readonly cdr: ChangeDetectorRef,
        @Inject(LayerRef) private readonly layerRef: LayerRef) {
        super()

        this.destruct
            .subscription(merge(this.hourChange, this.minuteChange, this.secondChange))
            .pipe(
                debounceTime(10),
                map(() => {
                    let val = `${zero(this.hour)}:${zero(this.minute)}:${zero(this.second)}`
                    return new Time(val)
                })
            )
            .subscribe(value => {
                this.writeValue(value)
                if (!this.showButtons) {
                    this.valueChange.next(value)
                }
            })
    }

    public writeValue(value: Time | Date) {
        let time = Time.coerce(value)

        if (!this._value || !value || time.compare(this._value) !== 0) {
            this._value = time
            if (time) {
                this._hour = time.hours || 0
                this._minute = time.minutes || 0
                this._second = time.seconds || 0
            } else {
                this._hour = 0
                this._minute = 0
                this._second = 0
            }
            this.cdr.detectChanges()
        }
    }

    public onCommitValue() {
        this.valueChange.next(this._value)
        this.layerRef.hide()
    }

    public cancel() {
        this.layerRef.hide()
    }

}

function zero(num: number): string {
    if (isNaN(num)) {
        num = 0
    }
    return `${num < 10 ? '0' : ''}${num}`
}
