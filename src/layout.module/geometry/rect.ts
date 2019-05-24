import { Point } from "./point"
import { Align, AlignInput, HAlign, VAlign, parseAlign, Margin, MarginParsed, parseMargin } from "./align"

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

    public get centerHorizontal(): number { return this.left + this.width / 2 }
    public set centerHorizontal(val: number) { this.left = val - this.width / 2 }

    public get centerVertical(): number { return this.top + this.height / 2 }
    public set centerVertical(val: number) { this.top = val - this.height / 2 }

    public get area(): number { return this.width * this.height }

    public readonly origin: Align
    public readonly margin: MarginParsed

    public constructor(x: number, y: number, public width: number, public height: number,
        origin: Align | AlignInput = DEFAULT_ALIGN) {
        this.setOrigin(origin, x, y)
    }

    public contains(other: Rect): boolean {
        return this.left <= other.left && this.top <= other.top
            && this.right >= other.right && this.bottom >= other.bottom
    }

    public isIntersect(other: Rect): boolean {
        return !(this.left > other.right || other.left > this.right
            || this.top > other.bottom || other.top > this.bottom)
    }

    public intersection(other: Rect): Rect | null {
        if (this.isIntersect(other)) {
            let res = new Rect(
                Math.max(this.x, other.x),
                Math.max(this.y, other.y),
                Math.min(this.width, other.width),
                Math.min(this.height, other.height),
                this.origin);
            (res as any).margin = this.margin
            return res
        }
        return null
    }

    public applyInset(margin: Margin) {
        let m = parseMargin(margin)
        m.bottom *= -1
        m.top *= -1
        m.right *= -1
        m.left *= -1
        return this.applyMargin(m)
    }

    public applyMargin(margin: Margin): Rect {
        let m = parseMargin(margin)
        if (this.margin) {
            m.bottom += this.margin.bottom
            m.top += this.margin.top
            m.right += this.margin.right
            m.left += this.margin.left
        }

        let res = this.copy()
        res.width += (m.left + m.right)
        res.height += (m.top + m.bottom)
        res.left -= m.left
        res.top -= m.top;
        (res as any).margin = m
        return res
    }

    // public insetBy(value: Inset): Rect {
    //     return new Rect(
    //         this.top + (value.top || 0),
    //         this.left + (value.left || 0),
    //         this.width - ((value.left || 0) + (value.right || 0)),
    //         this.height - ((value.top || 0) + (value.bottom || 0))
    //     )
    // }

    public constraint(other: Rect): Rect {
        if (this.contains(other)) {
            return other
        } else {
            // console.log("constraint", other, "into", this)
            let r = other.copy()

            if (this.top > r.top) {
                r.top = this.top
            }
            if (this.left > r.left) {
                r.left = this.left
            }
            if (this.right < r.right) {
                r.right = this.right
            }
            if (this.bottom < r.bottom) {
                r.bottom = this.bottom
            }

            return r
        }
    }

    public isEq(other: Rect): boolean {
        return other instanceof Rect
            && other.x === this.x
            && other.y === this.y
            && other.width === this.width
            && other.height === this.height
    }

    public merge(other: Rect): Rect {
        let r = new Rect(
            Math.min(this.x, other.x),
            Math.min(this.y, other.y),
            0,
            0,
            this.origin
        )
        r.right = Math.max(this.right, other.right)
        r.bottom = Math.max(this.bottom, other.bottom)
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

        if (!this.origin || this.origin.horizontal !== align.horizontal) {
            installHAlign(this as any, align.horizontal)
        }

        if (!this.origin || this.origin.vertical !== align.vertical) {
            installVAlign(this as any, align.vertical)
        }

        (this as any).origin = align

        if (x != null) {
            this._x = x
        }

        if (y != null) {
            this._y = y
        }
    }
}


type setter = (val: number) => void
type getter = () => number
type WritableRect = { _x: number, _y: number, width: number, height: number, left: number, top: number }


function installHAlign(rect: WritableRect, align: HAlign) {
    let setLeft: setter, getLeft: getter, setRight: setter, getRight: getter
    const left = rect.left

    switch (align) {
        case "left":
            setLeft = (val: number) => { rect._x = val }
            getLeft = () => { return rect._x }
            setRight = (val: number) => { rect.width = Math.max(0, val - rect._x) }
            getRight = (): number => { return rect._x + rect.width }
            if (left != null) {
                rect._x = left
            }
            break

        case "right":
            setLeft = (val: number) => { rect.width = Math.max(0, rect._x - val) }
            getLeft = () => { return rect._x - rect.width }
            setRight = (val: number) => { rect._x = val }
            getRight = (): number => { return rect._x }
            if (left != null) {
                rect._x = left + rect.width
            }
            break

        case "center":
            setLeft = (val: number) => { rect._x = val + rect.width / 2 }
            getLeft = () => { return rect._x - rect.width / 2 }
            setRight = (val: number) => { rect._x = val - rect.width / 2 }
            getRight = (): number => { return rect._x + rect.width / 2 }
            if (left != null) {
                rect._x = left + rect.width / 2
            }
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
    const top = rect.top

    switch (align) {
        case "top":
            setTop = (val: number) => { rect._y = val }
            getTop = () => { return rect._y }
            setBottom = (val: number) => { rect.height = Math.max(0, val - rect._y) }
            getBottom = (): number => { return rect._y + rect.height }
            if (top != null) {
                rect._y = top
            }
            break

        case "bottom":
            setTop = (val: number) => { rect.height = Math.max(0, rect._y - val) }
            getTop = () => { return rect._y - rect.height }
            setBottom = (val: number) => { rect._y = val }
            getBottom = (): number => { return rect._y }
            if (top != null) {
                rect._y = top + rect.height
            }
            break

        case "center":
            setTop = (val: number) => { rect._y = val + rect.height / 2 }
            getTop = () => { return rect._y - rect.height / 2 }
            setBottom = (val: number) => { rect._y = val - rect.height / 2 }
            getBottom = (): number => { return rect._y + rect.height / 2 }
            if (top != null) {
                rect._y = top + rect.height / 2
            }
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
