import { Component, Inject, ElementRef, ViewChild, AfterViewInit, ChangeDetectorRef, Input, HostBinding } from "@angular/core"
import { coerceBooleanProperty } from "@angular/cdk/coercion"
import { take } from "rxjs/operators"
import { parse, isDate, format, startOfDay } from "date-fns"
import { IMaskDirective } from "angular-imask"

import { Destruct, setTzToUTC } from "../../../util"
import { LocaleService } from "../../../common.module"
import { ComponentLayerRef } from "../../../layer.module"
import { InputComponent, INPUT_MODEL, InputModel, FocusChangeEvent } from "../abstract"
import { DatePickerService } from "./date-picker.service"
import { DatePickerComponent } from "./date-picker.component"
import { MASK_BLOCKS } from "./mask-blocks"


@Component({
    selector: ".nz-date-input",
    templateUrl: "./date-input.component.pug",
    providers: INPUT_MODEL
})
export class DateInputComponent extends InputComponent<Date> implements AfterViewInit {
    @ViewChild("input", { read: ElementRef }) public readonly input: ElementRef<HTMLInputElement>
    @ViewChild("input", { read: IMaskDirective }) public readonly inputMask: IMaskDirective<any>

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

    public imaskOptions: any

    protected dpRef: ComponentLayerRef<DatePickerComponent>

    public set opened(val: boolean) {
        if (this._opened !== val) {
            this._opened = val
            if (this.dpRef) {
                this.dpRef.hide()
                delete this.dpRef
            }

            if (val && !this._withoutPicker) {
                let date: Date = this.value ? isDate(this.value) ? this.value as any : this.parseString(this.value as any) : null

                this.dpRef = this.datePicker.show({
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

                let s = this.dpRef.component.instance.valueChange.pipe(take(1)).subscribe(date => {
                    date = setTzToUTC(startOfDay(date))
                    this._renderValue(date)
                    this.model.emitValue(date)
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

    public constructor(
        @Inject(InputModel) model: InputModel<Date>,
        @Inject(ElementRef) protected readonly el: ElementRef,
        @Inject(LocaleService) protected readonly locale: LocaleService,
        @Inject(DatePickerService) protected readonly datePicker: DatePickerService,
        @Inject(ChangeDetectorRef) protected readonly cdr: ChangeDetectorRef) {
        super(model)

        this.monitorFocus(el.nativeElement, true)

        this.destruct.subscription(model.focusChanges).subscribe(this._handleFocus.bind(this))

        this.imaskOptions = {
            mask: this.displayFormat,
            lazy: true,
            blocks: MASK_BLOCKS
        }
    }

    protected _renderValue(obj: Date | string): void {
        if (!this.input) {
            return
        }

        let value = ""
        if (obj instanceof Date) {
            value = format(obj, this.displayFormat)
        } else if (typeof obj === "string" && obj.length) {
            this._renderValue(this.parseString(obj))
            return
        }

        this.input.nativeElement.value = value
        this.inputMask.maskRef && this.inputMask.maskRef.updateValue()
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

    public _handleFocus(event: FocusChangeEvent) {
        const focused = event.current
        this.opened = !!focused
        this.imaskOptions.lazy = !focused

        this.inputMask.maskRef.updateOptions(this.imaskOptions)

        if (!focused) {
            let inputVal: Date = parse(this.inputMask.maskRef.value, this.displayFormat, new Date())
            if (isNaN(inputVal.getTime())) {
                this._renderValue(null)
                this.model.emitValue(null)
            }
        }
    }

    public _onAccept() {
        let inputVal: Date = parse(this.inputMask.maskRef.value, this.displayFormat, new Date())
        if (isNaN(inputVal.getTime())) {
            this.model.emitValue(null)
        }
    }

    public _onComplete(value: string) {
        let inputVal: Date = parse(value, this.displayFormat, new Date())
        // this.opened = false
        this.model.emitValue(setTzToUTC(startOfDay(inputVal)))
    }

    public ngAfterViewInit() {
        this._renderValue(this.model.value)
    }
}
