import { Component, Inject, Optional, ElementRef, ViewChild, AfterViewInit } from "@angular/core"
import { NgControl, NgModel, FormControl } from "@angular/forms"
import { parse } from "date-fns"

import { Destruct } from "../../../util"
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

    @ViewChild("input") public readonly input: HTMLInputElement

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
                this.dpRef = this.datePicker.show({
                    position: {
                        anchor: {
                            ref: this.el.nativeElement,
                            align: "bottom center"
                        },
                        align: "top center"
                    },
                    type: "date"
                })
            }
        }
    }
    public get opened(): boolean { return this._opened }
    private _opened: boolean

    public constructor(
        @Inject(NgControl) @Optional() ngControl: NgControl,
        @Inject(NgModel) @Optional() ngModel: NgModel,
        @Inject(ElementRef) el: ElementRef,
        @Inject(LocaleService) protected readonly locale: LocaleService,
        @Inject(DatePickerService) protected readonly datePicker: DatePickerService) {
        super(ngControl, ngModel, el)


        this.imaskOptions = {
            mask: locale.getDateFormat("short"),
            lazy: false,

            format: (date: Date) => {
                console.log("format", date)
                return locale.formatDate(date, "short")
            },
            parse: (value: string) => {
                console.log("parse", value)
                return parse(value, locale.getDateFormat("short"), new Date())
            },
            blocks: MASK_BLOCKS
        }

        // this.destruct.subscription(this.model.valueChanges).subscribe(v => {

        // })

    }

    public writeValue(obj: Date): void {
        // this.model.setValue(obj ? this.locale.formatDate(obj, "short") : "")
    }

    public _handleFocus(x: boolean) {
        this.opened = !!x

        console.log("_handleFocus", x)
        super._handleFocus(x)
    }

    public _onComplete(value: string) {

        console.log("_onComplete", value, this.locale.parseDate("short", value))
    }

    public ngAfterViewInit() {
        console.log("vinit", this.input)
    }

    public ngOnDestroy() {
        super.ngOnDestroy()
        this.destruct.run()
    }

    // public writeValue(obj: Date): void {
    //     // XXX: i don't know why working with this hack
    //     setTimeout(() => {
    //         (this.el.nativeElement as HTMLInputElement).value = format(obj, "YYYY-MM-DD")
    //     }, 5)
    // }
}
