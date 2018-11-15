import { Point } from "./point"

export type Margin = { top?: number, right?: number, bottom?: number, left?: number } | number
export type HAlign = "left" | "right" | "center"
export type VAlign = "top" | "bottom" | "center"
// export type Align = HAlign | VAlign
export type Align = { horizontal: HAlign, vertical: VAlign }
export type AlignInput = "top left" | "top right" | "top center" |
    "bottom left" | "bottom right" | "bottom center" |
    "left top" | "left bottom" | "left center" |
    "right top" | "right bottom" | "right center" |
    "center" | "center center"


const CENTER_ALIGN: Align = { horizontal: "center", vertical: "center" }


export function parseAlign(align: Align | AlignInput): Align {
    if (typeof align !== "string") {
        if ("horizontal" in align && "vertical" in align) {
            return align
        }
        throw new Error(`Invalid align value: ${align}`)
    }

    if (align === "center") {
        return CENTER_ALIGN
    } else {
        let parts = align.split(/\s+/)
        if (parts.length !== 2) {
            throw new Error(`Invalid align value: ${align}`)
        }

        let res = {} as Align
        let i
        if ((i = parts.indexOf("left")) !== -1 || (i = parts.indexOf("right")) !== -1) {
            res.horizontal = parts.splice(i, 1)[0] as HAlign
        }
        if ((i = parts.indexOf("top")) !== -1 || (i = parts.indexOf("bottom")) !== -1) {
            res.vertical = parts.splice(i, 1)[0] as VAlign
        }

        switch (parts.length as number) {
            case 0:
                return res

            case 1:
                if (parts.indexOf("center") !== -1) {
                    if (res.horizontal) {
                        res.vertical = "center"
                    } else {
                        res.horizontal = "center"
                    }
                    return res
                }
                break

            case 2:
                if (parts[0] === "center" && parts[1] === "center") {
                    return CENTER_ALIGN
                }
                break

        }
    }
    throw new Error(`Invalid align value: ${align}`)
}


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
    public readonly margin: { top?: number, right?: number, bottom?: number, left?: number }

    public constructor(x: number, y: number, public width: number, public height: number,
        origin: Align | AlignInput = DEFAULT_ALIGN) {
        this.setOrigin(origin, x, y)
    }

    public isInside(other: Rect): boolean {
        return this.left >= other.left && this.top >= other.top
            && this.right <= other.right && this.bottom <= other.bottom
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

    public applyMargin(margin: Margin): Rect {
        let m: { top: number, right: number, bottom: number, left: number } = {} as any

        if (typeof margin === "number") {
            m.top = m.right = m.bottom = m.left = margin
        } else {
            m.top = margin.top || 0
            m.right = margin.right || 0
            m.bottom = margin.bottom || 0
            m.left = margin.left || 0
        }

        let res = new Rect(
            this.left + m.left,
            this.top + m.top,
            this.width - (m.left + m.right),
            this.height - (m.top + m.bottom),
            this.origin);
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
        if (this.isInside(other)) {
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
        let res = new Rect(this.x, this.y, this.width, this.height, this.origin);
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
type WritableRect = { _x: number, _y: number, width: number, height: number }


function installHAlign(rect: WritableRect, align: HAlign) {
    let setLeft: setter, getLeft: getter, setRight: setter, getRight: getter

    switch (align) {
        case "left":
            setLeft = (val: number) => { rect._x = val }
            getLeft = () => { return rect._x }
            setRight = (val: number) => { rect.width = Math.max(0, val - rect._x) }
            getRight = (): number => { return rect._x + rect.width }
            break

        case "right":
            setLeft = (val: number) => { rect.width = Math.max(0, rect._x - val) }
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
            setBottom = (val: number) => { rect.height = Math.max(0, val - rect._y) }
            getBottom = (): number => { return rect._y + rect.height }
            break

        case "bottom":
            setTop = (val: number) => { rect.height = Math.max(0, rect._y - val) }
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
