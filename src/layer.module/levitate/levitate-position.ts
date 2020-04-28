import { Rect, Align, MarginParsed } from "../../util"
import { ConcretePosition } from "./levitate-options"


const MARGIN0: MarginParsed = { top: 0, right: 0, bottom: 0, left: 0 }


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
        const opRect = Rect.fromElement(el.offsetParent as HTMLElement)
        // const crect = this._localConstraint(opRect)

        // console.log(this.rect, opRect, crect)
        // let offsetParentRect: Rect

        // TODO: get offsetParent, and make constraint bounds relative to it

        if (concrete.x !== true) {
            if (origin.horizontal === "right") {
                style.left = ""
                style.right = `${opRect.width - this.rect.right}px`
            } else {
                style.right = ""
                style.left = `${this.rect.left}px`
            }
        }

        if (concrete.y !== true) {
            if (origin.vertical === "bottom") {
                style.top = ""
                style.bottom = `${opRect.height - this.rect.bottom}px`
            } else {
                style.bottom = ""
                style.top = `${this.rect.top}px`
            }
        }

        style.maxWidth = `${this.maxWidth}px`
        style.maxHeight = `${this.maxHeight}px`
    }

    private _localConstraint(opRect: Rect): Rect {
        const margin = this.constraint.margin ? this.constraint.margin : MARGIN0
        return new Rect(
            this.constraint.left - opRect.left + margin.left,
            this.constraint.top - opRect.top + margin.top,
            Math.min(this.constraint.width, opRect.width) - margin.right,
            Math.min(this.constraint.height, opRect.height) - margin.bottom
        )
    }
}
