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
