import { Rect, Point, Margin } from "../rect-mutation.service"

import { LevitateRef } from "./levitate-ref"


export type Align = "top" | "right" | "bottom" | "left" | "center"
export type HAlign = "left" | "right" | "center"
export type VAlign = "top" | "bottom" | "center"

export type SidePosition = { side: HAlign | VAlign, offset: number }
export type Rects = {
    levitate: Rect,
    anchor: Rect,
    constraint: Rect
}
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


export class MagicCarpet {
    public constructor(public ref: LevitateRef) {
    }

    // public updateRects() {
    //     let levEl = this.ref.levitate.ref
    //     levEl.style.maxWidth = "none"
    //     levEl.style.maxHeight = "none"
    // }

    // private _setRect(k: "levitate" | "connect" | "constraint") {
    //     let p: Anchor | Levitating | Constraint = (this.ref as any)[k]
    //     let kk = `${k}Rect`

    //     if (p) {
    //         let rect
    //         if (p.ref === "viewport") {
    //             rect = Rect.viewport()
    //         } else if (p.ref instanceof HTMLElement) {
    //             rect = Rect.fromElement(p.ref)
    //         } else if (p.ref instanceof Rect) {
    //             rect = p.ref
    //         } else {
    //             throw new Error(`Invalid value of 'ref' in '${k}' config`)
    //         }
    //         if (p.margin) {
    //             rect = rect.applyMargin(p.margin)
    //         }
    //         (this as any)[kk] = rect
    //     } else {
    //         (this as any)[kk] = null
    //     }
    // }

    public levitate(rects: Rects): LevitatingPosition {
        let lA = this.ref.levitate.align || "center"
        let lV = this.ref.levitate.valign || "center"
        let pA
        let pV

        if (this.ref.anchor) {
            let cA = this.ref.anchor.align || "center"
            let cV = this.ref.anchor.valign || "center"
            pA = calcPlacementH[`${lA}-${cA}`](rects.levitate, rects.anchor, rects.constraint)
            pV = calcPlacementV[`${lV}-${cV}`](rects.levitate, rects.anchor, rects.constraint)
        } else if (this.ref.constraint) {
            pA = calcPlacementH[`${lA}-${lA}`](rects.levitate, rects.constraint, rects.constraint)
            pV = calcPlacementV[`${lV}-${lV}`](rects.levitate, rects.constraint, rects.constraint)
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

        let result = possibilities.find((item) => {
            return rects.levitate.isInside(item.rect)
        })

        result = result || possibilities.sort((a, b) => {
            return b.rect.area - a.rect.area
        })[0]

        // console.log(rects, result)

        // let result = this.levitateRect.copy()
        // result.top = best.rect.top
        // result.left = best.rect.left
        // result = best.rect.constraint(result)

        return getLevitatingPosition(result.placements[0], result.placements[1], rects.levitate, result.rect, rects.anchor)
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
        maxWidth: Math.round(constraint.width),
        maxHeight: Math.round(constraint.height),
        left: Math.round(rect.left),
        top: Math.round(rect.top)
    }

    return res
}
