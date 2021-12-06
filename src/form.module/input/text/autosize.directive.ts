import { Directive, Input, OnDestroy, HostListener, Inject, ElementRef, OnChanges, SimpleChanges } from "@angular/core"
import { coerceBooleanProperty } from "@angular/cdk/coercion"
import { rawRequestAnimationFrame } from "../../../util"


const COPY_CSS_PROPS: Array<keyof CSSStyleDeclaration> = [
    "font", "fontSize", "fontFamily", "fontStyle", "fontWeight", "fontVariant", "letterSpacing",
    "paddingLeft", "paddingRight"]


@Directive({
    selector: "input[autosize]"
})
export class AutosizeDirective implements OnDestroy, OnChanges {
    @Input()
    public set autosize(val: boolean) {
        val = coerceBooleanProperty(val)
        if (this._autosize !== val) {
            this._autosize = val
            if (val) {
                this.initAutosize()
            } else {
                this.destructAutosize()
            }
        }
    }
    public get autosize(): boolean { return this._autosize }
    private _autosize: boolean

    @Input() public autosizeExtra: number = 0

    private _lastInputValue: string
    private measureEl: HTMLElement

    public constructor(@Inject(ElementRef) private readonly el: ElementRef<HTMLInputElement>) {

    }

    public ngOnChanges(changes: SimpleChanges) {
        if ("autosizeExtra" in changes) {
            this.resize()
        }
    }

    public initAutosize() {
        if (!this.measureEl) {
            const el = document.createElement("div")
            const inputStyle = getComputedStyle(this.el.nativeElement)
            for (const p of COPY_CSS_PROPS) {
                (el.style as any)[p] = inputStyle[p]

            }
            el.style.visibility = "hidden"
            el.style.position = "absolute"
            el.style.left = "-20000px"
            el.style.top = "-20000px"
            el.style.whiteSpace = "pre"
            el.innerHTML = this._lastInputValue = this.el.nativeElement.value

            this.measureEl = el
            document.body.appendChild(el)
            this.resize()

            rawRequestAnimationFrame(this.checkValue)
        }
    }

    public destructAutosize() {
        if (this.measureEl && this.measureEl.parentNode) {
            this.measureEl.parentNode.removeChild(this.measureEl)
            this.measureEl = null
        }
        this._autosize = false
    }

    @HostListener("input")
    public onInput() {
        this.resize()
    }

    @HostListener("change")
    public onChange() {
        this.resize()
    }

    private resize() {
        if (this._autosize && this.measureEl) {
            const inputEl = this.el.nativeElement
            this.measureEl.innerHTML = this._lastInputValue = inputEl.value
            inputEl.style.width = `${Math.round(this.measureEl.offsetWidth + this.autosizeExtra)}px`
        }
    }

    public ngOnDestroy() {
        this.destructAutosize()
    }

    private checkValue = () => {
        const input = this.el.nativeElement
        if (this._autosize && input) {
            if (this._lastInputValue !== input.value) {
                this._lastInputValue = input.value
                this.resize()
            }
            rawRequestAnimationFrame(this.checkValue)
        }
    }
}
