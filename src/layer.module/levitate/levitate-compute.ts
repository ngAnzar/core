import { Rect, HAlign, VAlign } from "../../layout.module"

import { LevitateRef } from "./levitate-ref"
import { LevitatePosition } from "./levitate-position"


// export interface AnchorPosition {
//     align: Align | AlignInput,
//     offsetX?: number
//     offsetY?: number
// }

export type Rects = {
    levitate: Rect,
    anchor: Rect,
    constraint: Rect
}


function drawRect(r: Rect, color: string) {
    let div = document.createElement("div")
    div.style.position = "absolute"
    div.style.left = `${r.left}px`
    div.style.top = `${r.top}px`
    div.style.width = `${r.width}px`
    div.style.height = `${r.height}px`
    div.style.border = `1px solid ${color}`
    div.style.zIndex = `123456789`
    div.setAttribute("origin", `${r.origin.horizontal}:${r.origin.vertical}/X:${r.x} Y:${r.y}`)
    // div.innerHTML = ``
    document.body.appendChild(div)
}


export class MagicCarpet {
    public constructor(public ref: LevitateRef) {
    }

    public levitate(rects: Rects): LevitatePosition {
        const possibilities = this.getPlacements(rects)

        let result = possibilities.find((item) => {
            return rects.levitate.width <= item.rect.width && rects.levitate.height <= item.rect.height
        })

        result = result || possibilities.sort((a, b) => {
            return b.rect.area - a.rect.area
        })[0]

        return getLevitatePosition(result.placements[0], result.placements[1], rects.levitate, result.rect, rects.anchor)
    }

    public getPlacements(rects: Rects) {
        const lAlign = rects.levitate.origin
        let levitate = rects.levitate, anchor, constraint
        let primaryHAlign: string, primaryVAlign: string
        let oppositeHAlign: string, oppositeVAlign: string

        // TODO: jó megoldás az oppsoite oldal számításra

        if (this.ref.anchor) {
            const cAlign = rects.anchor.origin
            anchor = rects.anchor
            constraint = rects.constraint
            primaryHAlign = `${lAlign.horizontal}-${cAlign.horizontal}`
            primaryVAlign = `${lAlign.vertical}-${cAlign.vertical}`
        } else if (this.ref.constraint) {
            anchor = constraint = rects.constraint
            primaryHAlign = `${lAlign.horizontal}-${lAlign.horizontal}`
            primaryVAlign = `${lAlign.vertical}-${lAlign.vertical}`
        }

        let hPlacements = [
            calcPlacementH[primaryHAlign](levitate, anchor, constraint)
        ]

        let vPlacements = [
            calcPlacementH[primaryVAlign](levitate, anchor, constraint)
        ]

        let result = []
        for (let hPlacement of hPlacements) {
            for (let vPlacement of vPlacements) {
                let r = hPlacement.rect.intersection(vPlacement.rect)
                if (r) {
                    result.push({
                        placements: [hPlacement, vPlacement],
                        rect: r
                    })
                }
            }
        }
        return result
    }

    public dispose(): void {
        delete this.ref
    }
}





type Placement = {
    rect: Rect,
    levitate: HAlign | VAlign
    target: HAlign | VAlign
    orient: "H" | "V"
}


type Calculator = (levitate: Readonly<Rect>, target: Readonly<Rect>, constraint: Readonly<Rect>) => Placement
type Calculators = { [key: string]: Calculator }


function placementCalculator(levitateAlign: HAlign | VAlign, targetAlign: HAlign | VAlign, orient: "H" | "V"): Calculator {
    return function (levitate: Readonly<Rect>, target: Readonly<Rect>, constraint: Readonly<Rect>): Placement {
        let placement = constraint.copy()
        placement[levitateAlign] = target[targetAlign]

        return {
            rect: constraint.constraint(placement),
            levitate: levitateAlign,
            target: targetAlign,
            orient: orient
        }
    }
}


// levitateAlign-targetAlign
const calcPlacementH: Calculators = {}
const calcPlacementV: Calculators = {}
const aligns: Array<HAlign | VAlign> = ["top", "right", "bottom", "left", "center"]
const opposite: { [key: string]: HAlign | VAlign } = {
    top: "bottom",
    right: "left",
    bottom: "top",
    left: "right",
    center: null
}

for (let a1 of aligns) {
    for (let a2 of aligns) {
        calcPlacementH[`${a1}-${a2}`] = placementCalculator(a1, a2, "H")
        calcPlacementV[`${a1}-${a2}`] = placementCalculator(a1, a2, "V")
    }
}


function getLevitatePosition(pA: Placement, pV: Placement, levitate: Rect, constraint: Rect, connect?: Rect): LevitatePosition {
    // drawRect(levitate, "red")

    let rect = levitate.copy()
    rect.setOrigin({ horizontal: pA.levitate as HAlign, vertical: pV.levitate as VAlign })

    rect[pA.levitate] = constraint[pA.levitate]
    rect[pV.levitate] = constraint[pV.levitate]
    rect = constraint.constraint(rect)


    // drawRect(rect, "green")
    // drawRect(constraint, "black")
    // drawRect(connect, "purple")

    return new LevitatePosition(
        rect,
        constraint,
        Math.round(constraint.width),
        Math.round(constraint.height)
    )
}

