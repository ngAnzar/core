import { Component, Inject, Optional, Renderer2, ElementRef, Attribute, OnDestroy } from "@angular/core"
import { FormControl, NgControl, NgModel } from "@angular/forms"
import { FocusMonitor } from "@angular/cdk/a11y"

import { setHours, setMinutes, setSeconds, setMilliseconds } from "date-fns"

import { Destruct } from "../../../util"
import { InputComponent, INPUT_VALUE_ACCESSOR } from "../abstract"


@Component({
    selector: ".nz-datetime-input",
    templateUrl: "./datetime-input.template.pug",
    host: {
        "[attr.tabindex]": "tabIndex"
    },
    providers: [
        { provide: InputComponent, useExisting: DatetimeInputComponent },
        INPUT_VALUE_ACCESSOR
    ]
})
export class DatetimeInputComponent extends InputComponent<Date> implements OnDestroy {
    public get type(): string { return "text" }

    public readonly tabIndex: number

    protected dateValue = new FormControl()
    protected timeValue = new FormControl()

    public readonly destruct = new Destruct()

    public constructor(
        @Inject(NgControl) @Optional() ngControl: NgControl,
        @Inject(NgModel) @Optional() ngModel: NgModel,
        // @Inject(Renderer2) _renderer: Renderer2,
        @Inject(ElementRef) el: ElementRef,
        @Inject(FocusMonitor) focusMonitor: FocusMonitor,
        @Attribute("tabindex") tabIndex: string) {
        super(ngControl, ngModel, el)

        this.tabIndex = Number(tabIndex) || 0

        this.destruct.subscription(this.dateValue.valueChanges).subscribe(this.composeDate)
        this.destruct.subscription(this.timeValue.valueChanges).subscribe(this.composeDate)

        this.destruct.subscription(focusMonitor.monitor(el.nativeElement, true)).subscribe(origin => {
            this._handleFocus(origin !== null)
            if (origin === null) {
                if (!this.value) {
                    this.dateValue.setValue(null)
                    this.timeValue.setValue(null)
                }
            }
        })
    }

    public writeValue(obj: Date): void {
        this.dateValue.setValue(obj)
        this.timeValue.setValue(obj)
    }

    public ngOnDestroy() {
        super.ngOnDestroy()
        this.destruct.run()
    }

    protected composeDate = () => {
        let date: Date = this.dateValue.value
        let time: Date = this.timeValue.value

        if (date && time) {
            let result = setHours(date, time.getHours())
            result = setMinutes(result, time.getMinutes())
            result = setSeconds(result, time.getSeconds())
            result = setMilliseconds(result, time.getMilliseconds())
            this.value = result
        }
    }
}
