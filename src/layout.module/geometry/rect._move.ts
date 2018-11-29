import { Point } from "./point"
import { Align, AlignInput, HAlign, VAlign, parseAlign } from "./align"

export type Margin = { top?: number, right?: number, bottom?: number, left?: number }

const DEFAULT_ALIGN: Align = { horizontal: "left", vertical: "top" }


export class Rect {
    [key: string]: number | any

    public static fromElement(el: HTMLElement) {
        let r = el.getBoundingClientRect()
        return new Rect(r.left, r.top, r.width, r.height)
    }

    public static viewport() {
        return new Rect(window.pageXOffset, window.pageYOffset, window.innerWidth, window.innerHeight)
    }

    public top: number
    public left: number
    public right: number
    public bottom: number

    public get center(): Point { return new Point(this.left + this.width / 2, this.top + this.height / 2) }
    public set center(val: Point) {
        this.left = val.left - this.width / 2
        this.top = val.top - this.height / 2
    }

    public get x(): number { return this._x }
    public get y(): number { return this._y }

    public get area(): number { return this.width * this.height }

    public readonly origin: Align
    public readonly margin: Margin

    public constructor(x: number, y: number, public width: number, public height: number,
        origin: Align | AlignInput = DEFAULT_ALIGN) {
        this.setOrigin(origin, x, y)
    }

    public contains(other: Rect): boolean {
        // console.log("contains", this.left, "<=", other.left, "&&",
        //     this.top, "<=", other.top, "&&",
        //     this.right, ">=", other.right, "&&",
        //     this.bottom, ">=", other.bottom, "&&",
        // )
        return this.left <= other.left && this.top <= other.top
            && this.right >= other.right && this.bottom >= other.bottom
    }

    public isIntersect(other: Rect): boolean {
        return !(this.left > other.right || other.left > this.right
            || this.top > other.bottom || other.top > this.bottom)
    }

    public intersection(other: Rect): Rect | null {
        if (this.isIntersect(other)) {
            let res = this.copy()
            res.width = Math.min(this.width, other.width)
            res.height = Math.min(this.height, other.height)
            res.left = Math.max(this.left, other.left)
            res.top = Math.max(this.top, other.top);
            (res as any).margin = this.margin
            return res
        }
        return null
    }

    public applyMargin(margin: Margin | number): Rect {
        let m: { top: number, right: number, bottom: number, left: number } = {} as any

        if (typeof margin === "number") {
            m.top = m.right = m.bottom = m.left = margin
        } else {
            m.top = margin.top || 0
            m.right = margin.right || 0
            m.bottom = margin.bottom || 0
            m.left = margin.left || 0
        }

        let res = this.copy()
        res.width -= (m.left + m.right)
        res.height -= (m.top + m.bottom)
        res.left += m.left
        res.top += m.top;
        (res as any).margin = m
        return res
    }

    public constraint(other: Rect): Rect {
        if (this.contains(other)) {
            return other
        } else {
            let r = other.copy()

            if (this.top > r.top) {
                r.top = this.top
            }
            if (this.left > r.left) {
                r.left = this.left
            }
            if (this.right < r.right) {
                r.width = Math.max(0, r.width - (r.right - this.right))
            }
            if (this.bottom < r.bottom) {
                r.height = Math.max(0, r.height - (r.bottom - this.bottom))
            }

            return r
        }
    }

    public isEq(other: Rect): boolean {
        return other instanceof Rect
            && other.left === this.left
            && other.left === this.left
            && other.width === this.width
            && other.height === this.height
    }

    public merge(other: Rect): Rect {
        let left = Math.min(this.left, other.left)
        let right = Math.max(this.right, other.right)
        let top = Math.min(this.top, other.top)
        let bottom = Math.max(this.bottom, other.bottom)
        let r = new Rect(
            left,
            top,
            right - left,
            bottom - top,
            DEFAULT_ALIGN
        )
        r.setOrigin(this.origin)
        return r
    }

    public copy(): Rect {
        const cls = this.constructor as any
        let res = new cls(this.x, this.y, this.width, this.height, this.origin);
        (res as any).margin = this.margin
        return res

    }

    public setOrigin(origin: AlignInput | Align, x?: number, y?: number) {
        const align = parseAlign(origin)
        const top = this.top
        const left = this.left
        let changed = false

        // if (!(this as any).___) {
        //     (this as any).___ = Math.random().toString(36)
        // }

        // if (this.origin) {
        //     console.log((this as any).___, { x: this.x, y: this.y, w: this.width, h: this.height }, this.origin)
        // }

        if (!this.origin || this.origin.horizontal !== align.horizontal) {
            installHAlign(this as any, align.horizontal)
            changed = true
        }

        if (!this.origin || this.origin.vertical !== align.vertical) {
            installVAlign(this as any, align.vertical)
            changed = true
        }

        (this as any).origin = align

        if (x != null) {
            this._x = x
        } else if (changed && left != null) {
            this.left = left
        }

        if (y != null) {
            this._y = y
        } else if (changed && top != null) {
            this.top = top
        }

        // if (this.origin && changed) {
        //     console.log((this as any).___, { x: this.x, y: this.y, w: this.width, h: this.height }, this.origin)
        // }
    }
}


type setter = (val: number) => void
type getter = () => number
type WritableRect = { _x: number, _y: number, width: number, height: number }


function installHAlign(rect: WritableRect, align: HAlign) {
    let setLeft: setter, getLeft: getter, setRight: setter, getRight: getter

    switch (align) {
        case "left":
            setLeft = (val: number) => { rect._x = val }
            getLeft = () => { return rect._x }
            setRight = (val: number) => { rect._x = val - rect.width }
            getRight = (): number => { return rect._x + rect.width }
            break

        case "right":
            setLeft = (val: number) => { rect._x = val + rect.width }
            getLeft = () => { return rect._x - rect.width }
            setRight = (val: number) => { rect._x = val }
            getRight = (): number => { return rect._x }
            break

        case "center":
            setLeft = (val: number) => { rect._x = val + rect.width / 2 }
            getLeft = () => { return rect._x - rect.width / 2 }
            setRight = (val: number) => { rect._x = val - rect.width / 2 }
            getRight = (): number => { return rect._x + rect.width / 2 }
            break
    }

    Object.defineProperty(rect, "left", {
        get: getLeft,
        set: setLeft,
        enumerable: false,
        configurable: false
    })

    Object.defineProperty(rect, "right", {
        get: getRight,
        set: setRight,
        enumerable: false,
        configurable: false
    })
}

function installVAlign(rect: WritableRect, align: VAlign) {
    let setTop: setter, getTop: getter, setBottom: setter, getBottom: getter

    switch (align) {
        case "top":
            setTop = (val: number) => { rect._y = val }
            getTop = () => { return rect._y }
            setBottom = (val: number) => { rect._y = val - rect.height }
            getBottom = (): number => { return rect._y + rect.height }
            break

        case "bottom":
            setTop = (val: number) => { rect._y = val + rect.height }
            getTop = () => { return rect._y - rect.height }
            setBottom = (val: number) => { rect._y = val }
            getBottom = (): number => { return rect._y }
            break

        case "center":
            setTop = (val: number) => { rect._y = val + rect.height / 2 }
            getTop = () => { return rect._y - rect.height / 2 }
            setBottom = (val: number) => { rect._y = val - rect.height / 2 }
            getBottom = (): number => { return rect._y + rect.height / 2 }
            break
    }

    Object.defineProperty(rect, "top", {
        get: getTop,
        set: setTop,
        enumerable: false,
        configurable: false
    })

    Object.defineProperty(rect, "bottom", {
        get: getBottom,
        set: setBottom,
        enumerable: false,
        configurable: false
    })
}
