import { Rect, Align } from "../../layout.module"
import { ConcretePosition } from "./levitate-options"


export class LevitatePosition {
    public constructor(
        public readonly rect: Rect,
        public readonly constraint: Rect,
        public readonly maxWidth: number,
        public readonly maxHeight: number) { }

    public get transformOrigin(): string {
        return `${this.rect.origin.horizontal} ${this.rect.origin.vertical}`
    }

    public get origin(): Align {
        return this.rect.origin
    }

    public applyToElement(el: HTMLElement, concrete: ConcretePosition) {
        const style = el.style
        const origin = this.rect.origin

        if (concrete.x !== true) {
            if (origin.horizontal === "right") {
                const m = this.constraint.margin ? this.constraint.margin.right : 0
                style.left = ""
                style.right = `${this.constraint.right - this.rect.right - m}px`
            } else {
                style.right = ""
                style.left = `${this.rect.left}px`
            }
        }

        if (concrete.y !== true) {
            if (origin.vertical === "bottom") {
                const m = this.constraint.margin ? this.constraint.margin.bottom : 0
                style.top = ""
                style.bottom = `${this.constraint.bottom - this.rect.bottom - m}px`
            } else {
                style.bottom = ""
                style.top = `${this.rect.top}px`
            }
        }

        style.maxWidth = `${this.maxWidth}px`
        style.maxHeight = `${this.maxHeight}px`
    }
}
