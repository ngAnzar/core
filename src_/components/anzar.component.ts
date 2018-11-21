import { ElementRef, Input } from "@angular/core"
import { FocusOrigin } from "@angular/cdk/a11y"


export type ColorOptions = "primary" | "accent" | "warn" | "error" | "success" | string | undefined


export abstract class AnzarComponent {
    constructor(protected el: ElementRef<HTMLElement>) {
    }

    // @Input()
    public set color(val: ColorOptions) {
        this._color = val
    }
    public get color(): ColorOptions {
        return this._color
    }
    private _color: ColorOptions

    @Input()
    public set disabled(val: any) {
        this._disabled = `${val}` === "disabled" || `${val}` === "true" || val === true
    }
    public get disabled() {
        return this._disabled
    }
    private _disabled: boolean

    @Input()
    public set focused(val: FocusOrigin) {
        this._focused = val
        // if (val) {
        //     this.el.nativeElement.setAttribute("focused", val)
        // } else {
        //     this.el.nativeElement.removeAttribute("focused", val)
        // }
    }
    public get focused() {
        return this._focused
    }
    private _focused: FocusOrigin
}
