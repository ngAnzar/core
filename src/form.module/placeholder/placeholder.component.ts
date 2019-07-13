import { Component, Inject, ContentChild, AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy, HostBinding, Input } from "@angular/core"
import { merge } from "rxjs"
import { startWith, debounceTime } from "rxjs/operators"

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
    @HostBinding("class.hide-label")
    public set hideLabel(val: boolean) {
        if (this._hideLabel !== val) {
            this._hideLabel = val
            this.cdr.detectChanges()
        }
    }
    public get hideLabel(): boolean { return this._hideLabel }
    private _hideLabel: boolean = false

    public constructor(@Inject(ChangeDetectorRef) protected readonly cdr: ChangeDetectorRef) {
    }

    public ngAfterContentInit() {
        if (this._inputModel) {
            this.destruct.subscription(merge(this._inputModel.statusChanges, this._inputModel.valueChanges, this._inputModel.focusChanges))
                .pipe(startWith(null), debounceTime(10))
                .subscribe(event => {
                    this.hideLabel = !this._inputModel.isEmpty || this._inputModel.focused !== null
                })
        }
    }

    public ngOnDestroy() {
        this.destruct.run()
    }
}
