import { Directive, OnChanges, SimpleChanges } from "@angular/core"


@Directive()
export abstract class DottedInputs implements OnChanges {
    public constructor(protected readonly inputs: string[]) {

    }

    public ngOnChanges(changes: SimpleChanges) {
        for (const k in changes) {
            if (this.inputs.indexOf(k) > -1) {
                const change = changes[k]
                this.onInputChange(k.split("."), change.currentValue, change.firstChange)
            }
        }
    }

    protected abstract onInputChange(path: string[], value: any, first: boolean): void
}
