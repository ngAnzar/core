import { Component, Inject, ContentChild, AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy, HostBinding, Input } from "@angular/core"

import { Destruct } from "../../util"
import { InputComponent } from "../input/abstract"


@Component({
    selector: ".nz-placeholder",
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: "./placeholder.template.pug"
})
export class PlaceholderComponent implements AfterContentInit, OnDestroy {
    public readonly destruct = new Destruct();

    @ContentChild(InputComponent) protected _input: InputComponent<any>

    @Input()
    @HostBinding("class.hide-label")
    public set hideLabel(val: boolean) {
        if (this._hideLabel !== val) {
            this._hideLabel = val
            console.log("hideLabel", val)
            this.cdr.markForCheck()
        }
    }
    public get hideLabel(): boolean { return this._hideLabel }
    private _hideLabel: boolean

    public constructor(@Inject(ChangeDetectorRef) protected readonly cdr: ChangeDetectorRef) {
    }

    public ngAfterContentInit() {
        if (this._input) {
            this.destruct.subscription(this._input.statusChanges).subscribe(event => {
                this.hideLabel = !this._input.isEmpty
            })
        }
    }

    public ngOnDestroy() {
        this.destruct.run()
    }
}
