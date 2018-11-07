import { Point } from "./point"

export type Margin = { top?: number, right?: number, bottom?: number, left?: number } | number
export type HAlign = "left" | "right" | "center"
export type VAlign = "top" | "bottom" | "center"
export type Align = HAlign | VAlign
export type _Align = { halign: HAlign, valign: VAlign }


const CENTER_ALIGN: _Align = { halign: "center", valign: "center" }


export function parseAlign(align: string): _Align {
    if (align === "center") {
        return CENTER_ALIGN
    } else {
        let parts = align.split(/\s+/)
        if (parts.length !== 2) {
            throw new Error(`Invalid align value: ${align}`)
        }

        let res = {} as _Align
        let i
        if ((i = parts.indexOf("left")) !== -1 || (i = parts.indexOf("right")) !== -1) {
            res.halign = parts.splice(i, 1)[0] as HAlign
        }
        if ((i = parts.indexOf("top")) !== -1 || (i = parts.indexOf("bottom")) !== -1) {
            res.valign = parts.splice(i, 1)[0] as VAlign
        }

        switch (parts.length as number) {
            case 0:
                return res

            case 1:
                if (parts.indexOf("center") !== -1) {
                    if (res.halign) {
                        res.valign = "center"
                    } else {
                        res.halign = "center"
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


// interface VAlignImpl {
//     setTop(rect: Rect, top: number): void
//     setBottom(rect: Rect, bottom: number): void
//     setHeight(rect: Rect, height: number): void
// }


// interface HAlignImpl {
//     setLeft(rect: Rect, left: number): void
//     setRight(rect: Rect, right: number): void
//     setWidth(rect: Rect, width: number): void
// }


// class VAlign_Top implements VAlignImpl {
//     public setTop(rect: any, top: number): void {
//         rect._y = top
//     }

//     public setBottom(rect: any, bottom: number): void {
//         rect._height = Math.max(0, bottom - rect.top)
//     }

//     public setHeight(rect: any, height: number): void {
//         rect._height = height
//     }
// }


// class VAlign_Bottom implements VAlignImpl {
//     public setTop(rect: any, top: number): void {
//         rect._height = Math.max(0, rect.bottom - top)
//     }

//     public setBottom(rect: any, bottom: number): void {
//         rect._height = Math.max(0, bottom - rect.top)
//     }

//     public setHeight(rect: any, height: number): void {
//         rect._height = height
//     }
// }


// class HAlign_Left implements HAlignImpl {

// }


// class HAlign_Right implements HAlignImpl {

// }


// class Center implements VAlignImpl, HAlignImpl {

// }


export class Rect {
    [key: string]: number | any

    public static fromElement(el: HTMLElement) {
        let r = el.getBoundingClientRect()
        return new Rect(r.left, r.top, r.width, r.height)
    }

    public static viewport() {
        return new Rect(window.pageXOffset, window.pageYOffset, window.innerWidth, window.innerHeight)
    }

    public get width(): number { return this._width }
    public set width(val: number) { this._width = val }

    public get height(): number { return this._height }
    public set height(val: number) { this._height = val }

    public get top(): number { return this.y }
    public set top(val: number) { this._y = val }

    public get left(): number { return this.x }
    public set left(val: number) { this._x = val }

    public get right(): number { return this.left + this.width }
    public set right(val: number) { this.width = Math.max(0, val - this.left) }

    public get bottom(): number { return this.top + this.height }
    public set bottom(val: number) { this.height = Math.max(0, val - this.top) }

    public get center(): Point { return new Point(this.left + this.width / 2, this.top + this.height / 2) }
    public set center(val: Point) {
        this.left = val.left - this.width / 2
        this.top = val.top - this.height / 2
    }

    public get x(): number { return this._x }
    public get y(): number { return this._y }

    public get area(): number { return this.width * this.height }

    public constructor(protected _x: number,
        protected _y: number,
        protected _width: number,
        protected _height: number,
        public readonly halign: HAlign = "left",
        public readonly valign: VAlign = "top") {
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
            return new Rect(
                Math.max(this.x, other.x),
                Math.max(this.y, other.y),
                Math.min(this.width, other.width),
                Math.min(this.height, other.height)
            )
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

        return new Rect(
            this.left + m.left,
            this.top + m.top,
            this.width - (m.left + m.right),
            this.height - (m.top + m.bottom)
        )
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
            0
        )
        r.right = Math.max(this.right, other.right)
        r.bottom = Math.max(this.bottom, other.bottom)
        return r
    }

    public copy(): Rect {
        return new Rect(this.x, this.y, this.width, this.height)
    }

    public asRelative(other: Rect): Rect {
        return new Rect(
            this.x - other.x,
            this.y - other.y,
            other.width,
            other.height
        )
    }
}
