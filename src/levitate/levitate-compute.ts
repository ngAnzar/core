import { LevitateRef } from "./levitate-ref"


export type Align = "top" | "right" | "bottom" | "left" | "center"
export type HAlign = "left" | "right" | "center"
export type VAlign = "top" | "bottom" | "center"

export type SidePosition = { side: HAlign | VAlign, offset: number }
export type Margin = { top?: number, right?: number, bottom?: number, left?: number } | number
// export type Margin = { inside: Offset, outside: Offset }

export interface LevitatingPosition {
    top?: number
    left?: number
    right?: number
    bottom?: number
    maxWidth?: number
    maxHeight?: number

    connection?: {
        levitated: SidePosition
        connected: SidePosition
    }
}


export interface Grow {
    from: Point
    direction: {
        horizontal: HAlign
        vertical: VAlign
    }
}


export interface Anchor {
    ref: HTMLElement | Rect | "viewport"
    align: Align
    valign: Align
    margin?: Margin
}


export interface Levitating extends Anchor {
    ref: HTMLElement
    width?: number
    height?: number
    maxWidth?: number
    maxHeight?: number
    minWidth?: number
    minHeight?: number
}


export interface Constraint {
    ref: HTMLElement | "viewport"
    margin?: Margin
}


export class Point {
    public constructor(public top: number, public left: number) {
    }
}


export class Rect {
    [key: string]: number | any

    public static from(el: HTMLElement) {
        let r = el.getBoundingClientRect()
        return new Rect(
            r.top + window.pageYOffset,
            r.left + window.pageXOffset,
            r.width,
            r.height)
    }

    public get right(): number { return this.left + this.width }
    public set right(val: number) {
        this.width = Math.max(0, val - this.left)
    }

    public get bottom(): number { return this.top + this.height }
    public set bottom(val: number) {
        this.height = Math.max(0, val - this.top)
    }

    public get center(): Point { return new Point(this.top + this.height / 2, this.left + this.width / 2) }
    public set center(val: Point) {
        this.left = val.left - this.width / 2
        this.top = val.top - this.height / 2
    }

    public get area(): number { return this.width * this.height }

    public constructor(public top: number,
        public left: number,
        public width: number,
        public height: number) {
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
                Math.max(this.top, other.top),
                Math.max(this.left, other.left),
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
            this.top + m.top,
            this.left + m.left,
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
            && other.left === this.left
            && other.top === this.top
            && other.width === this.width
            && other.height === this.height
    }

    public merge(other: Rect): Rect {
        let r = new Rect(
            Math.min(this.top, other.top),
            Math.min(this.left, other.left),
            0,
            0
        )
        r.right = Math.max(this.right, other.right)
        r.bottom = Math.max(this.bottom, other.bottom)
        return r
    }

    public copy(): Rect {
        return new Rect(this.top, this.left, this.width, this.height)
    }
}


function drawRect(rect: Rect, color: string) {
    let r = document.createElement("div")
    r.style.position = "absolute"
    r.style.border = `1px solid ${color}`
    r.style.top = `${rect.top}px`
    r.style.width = `${rect.width}px`
    r.style.height = `${rect.height}px`
    r.style.left = `${rect.left}px`
    r.innerHTML = `${rect.width} x ${rect.height}`
    document.body.appendChild(r)
}


export class MagicCarpet {
    public readonly levitateRect: Rect
    public readonly connectRect?: Rect
    public readonly constraintRect?: Rect

    public constructor(public ref: LevitateRef) {
    }

    public updateRects() {
        let levEl = this.ref.levitate.ref
        levEl.style.maxWidth = "none"
        levEl.style.maxHeight = "none";

        this._setRect("levitate")
        this._setRect("connect")
        this._setRect("constraint")

        // (this as any).levitatingRect = Rect.from(this.ref.levitate.ref)
        // if (this.ref.connect) {
        //     (this as any).connectRect = Rect.from(this.ref.connect.ref)
        //     if (this.ref.connect.margin) {
        //         (this as any).connectRect = this.connectRect.applyMargin(this.ref.connect.margin)
        //     }
        // } else {
        //     (this as any).connectRect = null
        // }
        // if (this.ref.constraint) {
        //     let rect: Rect
        //     if (this.ref.constraint.ref === "viewport") {
        //         rect = new Rect(window.pageYOffset, window.pageXOffset, window.innerWidth, window.innerHeight)
        //     } else {
        //         rect = Rect.from(this.ref.constraint.ref)
        //     }
        //     if (this.ref.constraint.margin) {
        //         rect = rect.applyMargin(this.ref.constraint.margin)
        //     }
        //     (this as any).constraintRect = rect
        // } else {
        //     throw new Error("Missing constraint")
        // }
    }

    private _setRect(k: "levitate" | "connect" | "constraint") {
        let p: Anchor | Levitating | Constraint = (this.ref as any)[k]
        let kk = `${k}Rect`

        if (p) {
            let rect
            if (p.ref === "viewport") {
                rect = new Rect(window.pageYOffset, window.pageXOffset, window.innerWidth, window.innerHeight)
            } else if (p.ref instanceof HTMLElement) {
                rect = Rect.from(p.ref)
            } else if (p.ref instanceof Rect) {
                rect = p.ref
            } else {
                throw new Error(`Invalid value of 'ref' in '${k}' config`)
            }
            if (p.margin) {
                rect = rect.applyMargin(p.margin)
            }
            (this as any)[kk] = rect
        } else {
            (this as any)[kk] = null
        }
    }

    public levitate(): LevitatingPosition {
        let lA = this.ref.levitate.align || "center"
        let lV = this.ref.levitate.valign || "center"
        let pA
        let pV

        if (this.connectRect) {
            let cA = this.ref.connect.align || "center"
            let cV = this.ref.connect.valign || "center"
            pA = calcPlacementH[`${lA}-${cA}`](this.levitateRect, this.connectRect, this.constraintRect)
            pV = calcPlacementV[`${lV}-${cV}`](this.levitateRect, this.connectRect, this.constraintRect)
        } else if (this.constraintRect) {
            pA = calcPlacementH[`${lA}-${lA}`](this.levitateRect, this.constraintRect, this.constraintRect)
            pV = calcPlacementV[`${lV}-${lV}`](this.levitateRect, this.constraintRect, this.constraintRect)
        }

        let possibilities: Array<{ placements: Placement[], rect: Rect }> = []
        for (let a of pA) {
            for (let b of pV) {
                let r = a.rect.intersection(b.rect)
                if (r) {
                    possibilities.push({
                        placements: [a, b],
                        rect: r
                    })
                }
            }
        }

        let best = possibilities.sort((a, b) => {
            return b.rect.area - a.rect.area
        })[0]

        // let result = this.levitateRect.copy()
        // result.top = best.rect.top
        // result.left = best.rect.left
        // result = best.rect.constraint(result)

        return getLevitatingPosition(best.placements[0], best.placements[1], this.levitateRect, best.rect, this.connectRect)
    }

    public dispose(): void {
        delete this.ref
    }
}


type Placement = {
    rect: Rect,
    levitate: Align
    target: Align
    orient: "H" | "V"
}


type Calculator = (levitate: Readonly<Rect>, target: Readonly<Rect>, constraint: Readonly<Rect>) => Placement[]
type Calculators = { [key: string]: Calculator }


function placementCalculator(levitateAlign: Align, targetAlign: Align, orient: "H" | "V", opposit?: Calculator): Calculator {
    return function (levitate: Readonly<Rect>, target: Readonly<Rect>, constraint: Readonly<Rect>): Placement[] {
        let placement = constraint.copy()
        placement[levitateAlign] = target[targetAlign]

        let res: Placement[] = [{
            rect: constraint.constraint(placement),
            levitate: levitateAlign,
            target: targetAlign,
            orient: orient
        }]
        if (opposit) {
            res = res.concat(opposit(levitate, target, constraint))
        }

        return res.sort((a, b) => {
            if (a.rect.width < levitate.width) {
                return 1
            }
            return 0
        })
    }
}


// levitateAlign-targetAlign
const calcPlacementH: Calculators = {}
const calcPlacementV: Calculators = {}
const aligns: Align[] = ["top", "right", "bottom", "left", "center"]
const opposite: { [key in Align]: Align } = {
    top: "bottom",
    right: "left",
    bottom: "top",
    left: "right",
    center: null
}

for (let a1 of aligns) {
    for (let a2 of aligns) {
        let o1 = opposite[a1]
        let o2 = opposite[a2]

        calcPlacementH[`${a1}-${a2}`] = placementCalculator(a1, a2, "H",
            o1 && o2 ? placementCalculator(o1, o2, "H") : null)
        calcPlacementV[`${a1}-${a2}`] = placementCalculator(a1, a2, "V",
            o1 && o2 ? placementCalculator(o1, o2, "V") : null)
    }
}


function getLevitatingPosition(pA: Placement, pV: Placement, levitate: Rect, constraint: Rect, connect?: Rect): LevitatingPosition {
    let rect = levitate.copy()
    rect[pA.levitate] = constraint[pA.levitate]
    rect[pV.levitate] = constraint[pV.levitate]
    rect = constraint.constraint(rect)

    let res: LevitatingPosition & { [key: string]: number } = {
        maxWidth: Math.round(rect.width),
        maxHeight: Math.round(rect.height),
        left: Math.round(rect.left),
        top: Math.round(rect.top)
    }

    return res
}

