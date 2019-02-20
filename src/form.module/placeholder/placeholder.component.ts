import { Component, Inject, ContentChild, AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from "@angular/core"

import { Destruct } from "../../util"
import { InputComponent } from "../input/abstract"


@Component({
    selector: ".nz-placeholder",
    host: {
        "[class.hide-label]": `!_input.isEmpty`,
    },
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: "./placeholder.template.pug"
})
export class PlaceholderComponent implements AfterContentInit, OnDestroy {
    public readonly destruct = new Destruct();

    @ContentChild(InputComponent) protected _input: InputComponent<any>

    public constructor(@Inject(ChangeDetectorRef) protected readonly cdr: ChangeDetectorRef) {
    }

    public ngAfterContentInit() {
        this.destruct.subscription(this._input.statusChanges).subscribe(this.cdr.markForCheck.bind(this.cdr))
    }

    public ngOnDestroy() {
        this.destruct.run()
    }
}
