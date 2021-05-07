import { Component, Input } from "@angular/core"

import { ButtonComponent } from "./button.component"


@Component({
    selector: ".nz-button[busy]",
    templateUrl: "./button-progress.pug",
    host: {
        "[attr.busy]": "_busy ? '' : null"
    }
})
export class ButtonProgressComponent extends ButtonComponent {
    @Input()
    public set busy(val: boolean) {
        if (this._busy !== val) {
            this._busy = val
        }
    }
    public get busy(): boolean { return this._busy }
    public _busy: boolean

    public get progressColor(): string {
        if (this.variant === "filled") {
            return `on-${this.color}`
        } else {
            return this.color
        }
    }

    protected _handleTap(event: Event) {
        if (!this.busy) {
            return super._handleTap(event)
        } else {
            event.stopImmediatePropagation()
        }
    }
}
