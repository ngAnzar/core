import { Input, Output, HostBinding, EventEmitter, OnDestroy } from "@angular/core"
import { FocusOrigin } from "@angular/cdk/a11y"
import { coerceBooleanProperty } from "@angular/cdk/coercion"
import { Observable } from "rxjs"


import { Destruct } from "../util"


export type ColorOptions = "primary" | "accent" | "warn" | "error" | "success" | string | undefined


export abstract class AnzarComponent implements OnDestroy {
    public readonly destruct = new Destruct()

    @Input()
    public set color(val: ColorOptions) {
        if (this._color !== val) {
            (this.colorChange as EventEmitter<ColorOptions>).emit(this._color = val)
        }
    }
    public get color(): ColorOptions { return this._color }
    protected _color: ColorOptions

    @Input()
    public set variant(val: string) {
        if (this._variant !== val) {
            (this.variantChange as EventEmitter<string>).emit(this._variant = val)
        }
    }
    public get variant(): string { return this._variant }
    protected _variant: string


    @Input()
    public set disabled(val: any) {
        val = coerceBooleanProperty(val)
        if (this._disabled !== val) {
            (this.disabledChange as EventEmitter<boolean>).emit(this._disabled = val)
        }
    }
    public get disabled() { return this._disabled }
    protected _disabled: boolean

    @Input()
    public set focused(val: boolean) {
        val = coerceBooleanProperty(val)
        if (this._focused !== val) {
            this._focusOrigin = val && !this._focusOrigin
                ? "program"
                : !val ? null : this._focusOrigin;
            (this.focusedChange as EventEmitter<boolean>).emit(this._focused = val)
        }
    }
    public get focused() { return this._focused }
    protected _focused: boolean

    public set focusOrigin(val: FocusOrigin) {
        if (this._focusOrigin !== val) {
            this._focusOrigin = val
            this.focused = val !== null
        }
    }
    public get focusOrigin(): FocusOrigin { return this._focusOrigin }
    protected _focusOrigin: FocusOrigin

    @Output("color")
    public readonly colorChange: Observable<ColorOptions> = this.destruct.subject(new EventEmitter())

    @Output("variant")
    public readonly variantChange: Observable<string> = this.destruct.subject(new EventEmitter())

    @Output("disabled")
    public readonly disabledChange: Observable<boolean> = this.destruct.subject(new EventEmitter())

    @Output("focused")
    public readonly focusedChange: Observable<boolean> = this.destruct.subject(new EventEmitter())

    @HostBinding("attr.disabled")
    private get _disabledAttr(): string { return this._disabled ? "" : null }

    @HostBinding("attr.color")
    private get _colorAttr(): string { return this._color ? this._color : null }

    @HostBinding("attr.variant")
    private get _variantAttr(): string { return this._variant ? this._variant : null }

    @HostBinding("attr.focused")
    private get _focusedAttr(): string { return this._focused ? this._focusOrigin : null }

    public ngOnDestroy() {
        this.destruct.run()
    }
}
