import { Directive, HostListener, Input, ElementRef, Inject, OnInit } from "@angular/core"
import { FastDOM } from "../../util"

import { StackComponent } from "./stack.component"


export interface StackChildData {
    begin: number
    end?: number
    preview?: boolean
    selected?: boolean
}


@Directive({
    selector: ".nz-stack-child"
})
export class StackChildDirective implements OnInit {
    @Input("nzStackData")
    public set data(val: StackChildData) {
        if (this._data !== val) {
            this._data = val
            this._updateEl()
        }
    }
    public get data(): StackChildData { return this._data }
    private _data: StackChildData = {} as any

    @Input()
    public set translate(val: number) {
        if (this._translate !== val) {
            this._translate = val

            if (!isNaN(val)) {
                const style = this.el.nativeElement.style
                FastDOM.mutate(() => {
                    style.display = ""
                    style.visibility = "visible"
                    style.transform = `translate(${val}%, 0)`
                })
            }
        }
    }
    public get translate(): number { return this._translate }
    private _translate: number

    public constructor(
        @Inject(ElementRef) private readonly el: ElementRef<HTMLElement>,
        @Inject(StackComponent) private readonly stack: StackComponent) {
    }

    public ngOnInit() {
        if (this._data.begin != null) {
            this.el.nativeElement.style.transform = `translate(${this._data.begin}%, 0)`
        }
    }

    @HostListener("transitionend", ["$event"])
    public onTransitionEnd(event: Event) {
        if (this._data.preview || event.target !== this.el.nativeElement) {
            return
        }

        if (!this._data.selected) {
            const style = this.el.nativeElement.style
            FastDOM.mutate(() => {
                style.display = "none"
                style.width = ""
                style.height = ""
            })
        }
    }

    private _updateEl() {
        const el = this.el.nativeElement
        const style = el.style

        FastDOM.mutate(() => {
            style.display = ""
            style.visibility = "visible"
            style.transform = `translate(${this._data.begin}%, 0)`

            if (this.stack.dynamicHeight) {
                FastDOM.measure(() => {
                    let width: number

                    if (!this._data.selected) {
                        width = el.offsetWidth
                    }

                    FastDOM.mutate(() => {
                        if (this._data.selected) {
                            style.position = "relative"
                        } else {
                            style.position = "absolute"
                            style.width = `${width}px`
                        }
                    })
                })
            }

            if (this._data.end != null) {
                FastDOM.measure(() => {
                    window.getComputedStyle(el)

                    FastDOM.mutate(() => {
                        style.transform = `translate(${this._data.end}%, 0)`
                    })
                })
            }
        })
    }
}
