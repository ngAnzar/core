import { Component, Inject, ContentChild, AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy, HostBinding, Input, ElementRef } from "@angular/core"
import { merge } from "rxjs"
import { startWith, debounceTime, takeUntil } from "rxjs/operators"

import { Destruct } from "../../util"
import { InputModel } from "../input/abstract"


@Component({
    selector: ".nz-placeholder",
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: "./placeholder.template.pug"
})
export class PlaceholderComponent implements AfterContentInit, OnDestroy {
    public readonly destruct = new Destruct();

    @ContentChild(InputModel) protected _inputModel: InputModel<any>

    @Input()
    public set hideLabel(val: boolean) {
        console.log("set hideLabel", this._hideLabel, "=>", val)
        if (this._hideLabel !== val) {
            this._hideLabel = val

            if (val) {
                this.el.nativeElement.classList.add("hide-label")
            } else {
                this.el.nativeElement.classList.remove("hide-label")
            }
        }
    }
    public get hideLabel(): boolean { return this._hideLabel }
    private _hideLabel: boolean = false

    public constructor(
        @Inject(ChangeDetectorRef) protected readonly cdr: ChangeDetectorRef,
        @Inject(ElementRef) private readonly el: ElementRef<HTMLElement>) {
    }

    public ngAfterContentInit() {
        console.log(this._inputModel)
        if (this._inputModel) {
            merge(this._inputModel.statusChanges, this._inputModel.valueChanges, this._inputModel.focusChanges, this._inputModel.inputChanges)
                .pipe(startWith(null), debounceTime(10), takeUntil(this.destruct.on))
                .subscribe(event => {
                    this.hideLabel = !this._inputModel.isEmpty || this._inputModel.focused !== null
                })
        }
    }

    public ngOnDestroy() {
        this.destruct.run()
    }
}
