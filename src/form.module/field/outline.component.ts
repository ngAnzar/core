import { Component, Input, Inject, ViewChild, ElementRef, AfterViewInit, OnDestroy } from "@angular/core"
import { Observable, Subscription } from "rxjs"


@Component({
    selector: ".nz-form-field-outline",
    templateUrl: "./outline.component.pug"
})
export class FormFieldOutlineComponent implements AfterViewInit, OnDestroy {
    @ViewChild("notchEl", { read: ElementRef }) public readonly notchEl: ElementRef<HTMLDivElement>

    @Input()
    public set notch(val: number | Observable<number>) {
        if (this._notchV !== val) {
            if (typeof val === "number") {
                this._notchV = val
            } else {
                this._notchV = val
                this._notchSub?.unsubscribe()
                if (val) {
                    this._notchSub = val.subscribe(this._setNotch.bind(this))
                }
            }
        }
    }

    private _pendingNotch: number
    private _notchV: number | Observable<number>
    private _notchSub: Subscription

    public ngAfterViewInit(): void {
        if (this._pendingNotch != null) {
            this._setNotch(this._pendingNotch)
            this._pendingNotch = null
        }
    }

    private _setNotch(val: number) {
        this.notchEl.nativeElement.style.width = (val ? val + 4 : 0) + "px"
    }

    public ngOnDestroy(): void {
        this._notchSub?.unsubscribe()
    }
}
