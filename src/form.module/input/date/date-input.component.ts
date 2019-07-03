import { Component, Inject, Optional, ElementRef, ViewChild, AfterViewInit, ChangeDetectorRef, Input } from "@angular/core"
import { NgControl, NgModel, FormControl } from "@angular/forms"
import { take } from "rxjs/operators"
import { parse, isDate, format, startOfDay } from "date-fns"
import { IMaskDirective } from "angular-imask"

import { Destruct, setTzToUTC } from "../../../util"
import { LocaleService } from "../../../common.module"
import { ComponentLayerRef } from "../../../layer.module"
import { InputComponent, INPUT_VALUE_ACCESSOR } from "../abstract"
import { DatePickerService } from "./date-picker.service"
import { DatePickerComponent } from "./date-picker.component"
import { MASK_BLOCKS } from "./mask-blocks"


@Component({
    selector: ".nz-date-input",
    templateUrl: "./date-input.template.pug",
    host: {
        "[attr.id]": "id",
        "[class.nz-has-value]": "!!value"
    },
    providers: [
        { provide: InputComponent, useExisting: DateInputComponent },
        INPUT_VALUE_ACCESSOR
    ]
})
export class DateInputComponent extends InputComponent<Date> implements AfterViewInit {
    public get type(): string { return "text" }

    @ViewChild("input", { read: ElementRef }) public readonly input: ElementRef<HTMLInputElement>
    @ViewChild("input", { read: IMaskDirective }) public readonly inputMask: IMaskDirective<any>

    @Input() public min: Date
    @Input() public max: Date

    public readonly destruct = new Destruct()
    public imaskOptions: any

    protected dpRef: ComponentLayerRef<DatePickerComponent>

    public set opened(val: boolean) {
        if (this._opened !== val) {
            this._opened = val
            if (this.dpRef) {
                this.dpRef.hide()
                delete this.dpRef
            }

            if (val) {
                let date: Date = this.value ? isDate(this.value) ? this.value as any : this.parseString(this.value as any) : null

                this.dpRef = this.datePicker.show({
                    position: {
                        anchor: {
                            ref: this.el.nativeElement,
                            align: "bottom center"
                        },
                        align: "top center"
                    },
                    type: "date",
                    initial: date,
                    value: date,
                    min: this.min,
                    max: this.max
                })

                let s = this.dpRef.component.instance.changed.pipe(take(1)).subscribe(date => {
                    date = setTzToUTC(startOfDay(date))
                    this.writeValue(date)
                    this._handleInput(date)
                })

                this.dpRef.destruct.on.pipe(take(1)).subscribe(d => {
                    s.unsubscribe()
                })
            }
        }
    }
    public get opened(): boolean { return this._opened }
    private _opened: boolean

    public displayFormat: string = this.locale.getDateFormat("short")
    public valueFormat: string = "yyyy-MM-dd"
    protected pendingValue: any

    public constructor(
        @Inject(NgControl) @Optional() ngControl: NgControl,
        @Inject(NgModel) @Optional() ngModel: NgModel,
        @Inject(ElementRef) el: ElementRef,
        @Inject(LocaleService) protected readonly locale: LocaleService,
        @Inject(DatePickerService) protected readonly datePicker: DatePickerService,
        @Inject(ChangeDetectorRef) protected readonly cdr: ChangeDetectorRef) {
        super(ngControl, ngModel, el)


        this.imaskOptions = {
            mask: this.displayFormat,
            lazy: true,
            blocks: MASK_BLOCKS
        }
    }

    public writeValue(obj: Date | string): void {
        if (!this.input) {
            this.pendingValue = obj
            return
        }

        const input = this.input.nativeElement
        if (obj instanceof Date) {
            input.value = format(obj, this.displayFormat)
        } else if (!obj || !obj.length) {
            input.value = ""
        } else {
            this.writeValue(this.parseString(obj))
            return
        }

        if (this.inputMask.maskRef) {
            this.inputMask.maskRef.updateValue()
        }
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

    public _handleFocus(focused: boolean) {
        this.opened = !!focused
        this.imaskOptions.lazy = !focused

        super._handleFocus(focused)

        this.inputMask.maskRef.updateOptions(this.imaskOptions)

        if (!focused) {
            let inputVal: Date = parse(this.inputMask.maskRef.value, this.displayFormat, new Date())
            if (isNaN(inputVal.getTime())) {
                this.writeValue(null)
                this._handleInput(null)
            }
        }
    }

    public _onAccept() {
        let inputVal: Date = parse(this.inputMask.maskRef.value, this.displayFormat, new Date())
        if (isNaN(inputVal.getTime())) {
            this._handleInput(null)
        }
    }

    public _onComplete(value: string) {
        let inputVal: Date = parse(value, this.displayFormat, new Date())
        this._handleInput(setTzToUTC(startOfDay(inputVal)))
    }

    public ngAfterViewInit() {
        if (this.pendingValue) {
            this.writeValue(this.pendingValue)
            delete this.pendingValue
        }
    }

    public ngOnDestroy() {
        super.ngOnDestroy()
        this.destruct.run()
    }
}
