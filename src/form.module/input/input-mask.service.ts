import { EventEmitter } from "@angular/core"
import IMask from "imask"

import { Destructible } from "../../util"


export class InputMask<T extends IMask.AnyMaskedOptions = IMask.AnyMaskedOptions> extends Destructible {
    public readonly imask: IMask.InputMask<T>

    public readonly accept = this.destruct.subject(new EventEmitter<InputMask<T>>())
    public readonly complete = this.destruct.subject(new EventEmitter<InputMask<T>>())

    public set options(val: T) {
        this._options = (val || {} as any)
        if (this.imask) {
            this.imask.updateOptions(this._options)
        }
    }
    public get options(): T { return this._options }
    private _options: T = {} as any

    public set value(val: string) {
        if (this.imask) {
            this.imask.value = val
        } else {
            this._pendingValue = val
        }
    }
    public get value() { return this.imask && this.imask.value }

    public set typedValue(val: any) { this.imask && (this.imask.typedValue = val) }
    public get typedValue() { return this.imask && this.imask.typedValue }

    public set unmaskedValue(val: string) { this.imask && (this.imask.unmaskedValue = val) }
    public get unmaskedValue() { return this.imask && this.imask.unmaskedValue }

    public get blockValues(): { [key: string]: string } {
        let result = {} as any
        let inputBlocks = this.imask.masked.state._blocks.filter((block: any) => block._isRawInput !== false)
        let maskedBlocks = (this.imask.masked as any)._maskedBlocks as { [key: string]: any }
        let i = 0

        for (const k in maskedBlocks) {
            result[k] = inputBlocks[i]._value
            i++
        }

        return result
    }

    private _pendingValue: any

    // private readonly _el: HTMLInputElement

    public constructor() {
        super()
        this.destruct.any(() => {
            if (this.imask) {
                this.imask.destroy()
                delete (this as any).imask
            }
        })
    }

    public connect(el: HTMLInputElement, options?: T) {
        if (options) {
            this._options = options
        }

        // (this as any)._el = el

        if (this.imask) {
            this.imask.destroy()
        }

        (this as any).imask = IMask(el, this._options)
        this.imask.on("accept", this.accept.next.bind(this.accept, this))
        this.imask.on("complete", this.complete.next.bind(this.complete, this))

        if (this._pendingValue != null) {
            this.imask.value = this._pendingValue
            delete this._pendingValue
        }
    }

    public updateOptions(val: Partial<T>) {
        this.options = { ...this._options, ...val }
    }
}
