import { Component, HostBinding, Inject, ElementRef, Input, ViewChild } from "@angular/core"
import { coerceBooleanProperty } from "@angular/cdk/coercion"
import { IMaskDirective } from "angular-imask"
import { parse, startOfDay, format } from "date-fns"

import { setTzToUTC } from "../../../util"
import { LocaleService } from "../../../common.module"
import { ComponentLayerRef } from "../../../layer.module"
import { InputComponent, INPUT_MODEL, InputModel, FocusChangeEvent } from "../abstract"
import { DatetimePickerComponent } from "./datetime-picker.component"
import { MASK_BLOCKS } from "./mask-blocks"
import { DatetimePickerService } from "./datetime-picker.service"


@Component({
    selector: ".nz-datetime-input",
    templateUrl: "./datetime-input.template.pug",
    providers: INPUT_MODEL
})
export class DatetimeInputComponent extends InputComponent<Date> {
    @ViewChild("input", { read: ElementRef, static: true }) public readonly input: ElementRef<HTMLInputElement>
    @ViewChild("input", { read: IMaskDirective, static: true }) public readonly inputMask: IMaskDirective<any>

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
    public imaskOptions: any

    public set opened(val: boolean) {
        if (this._opened !== val) {
            this._opened = val

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

    public constructor(
        @Inject(InputModel) model: InputModel<Date>,
        @Inject(ElementRef) private el: ElementRef<HTMLElement>,
        @Inject(LocaleService) protected readonly locale: LocaleService,
        @Inject(DatetimePickerService) private readonly picker: DatetimePickerService) {
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

    protected _renderValue(obj: Date | string) {
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

    protected _handleFocus(event: FocusChangeEvent) {
        const focused = event.current
        this.opened = !!focused
        this.imaskOptions.lazy = !focused
        this.inputMask.maskRef.updateOptions(this.imaskOptions)

        if (!focused) {
            if (!this.model.value) {
                this._renderValue(null)
            }
        }
    }

    public _onAccept() {
        const value = this.inputMask.maskRef.value
        if (!/_/g.test(value)) {
            this.model.emitValue(null)
        }
    }

    public _onComplete(value: string) {
        let inputVal: Date = parse(value, this.displayFormat, new Date())
        this.model.emitValue(inputVal)
        this._updatePickerValue(inputVal)
    }

    public ngAfterViewInit() {
        this._renderValue(this.model.value)
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
            const cmp = this.pickerRef.component.instance
            cmp.value = value
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
}
