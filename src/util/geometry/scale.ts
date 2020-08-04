

export interface ScaleResult {
    x: number
    y: number
    width: number
    height: number
    scaleX: number
    scaleY: number
}
export type ScaleMethod = (srcW: number, srcH: number, dstW: number, dstH: number, minScale?: number, maxScale?: number) => ScaleResult
export type ScaleFn = (srcW: number, srcH: number, dstW: number, dstH: number, scaleConstraint: (s: number) => number) => ScaleResult

function fitcrop(srcW: number, srcH: number, dstW: number, dstH: number, scaleConstraint: (s: number) => number): ScaleResult {
    let scale = scaleConstraint(dstW / srcW)
    if (srcH * scale < dstH) {
        scale = scaleConstraint(dstH / srcH)
    }
    let res = center(srcW * scale, srcH * scale, dstW, dstH, scaleConstraint)
    res.scaleX = res.scaleY = scale
    return res
}


function resize(srcW: number, srcH: number, dstW: number, dstH: number, scaleConstraint: (s: number) => number): ScaleResult {
    let scale: number
    if (dstW && dstH) {
        scale = scaleConstraint(dstW / srcW)
        if (srcH * scale > dstH) {
            scale = scaleConstraint(dstH / srcH)
        }
    } else if (dstW) {
        scale = scaleConstraint(dstW / srcW)
    } else if (dstH) {
        scale = scaleConstraint(dstH / srcH)
    }
    let res = center(srcW * scale, srcH * scale, dstW, dstH, scaleConstraint)
    res.scaleX = res.scaleY = scale
    return res
}

function center(srcW: number, srcH: number, dstW: number, dstH: number, scaleConstraint: (s: number) => number): ScaleResult {
    return {
        x: (dstW - srcW) / 2,
        y: (dstH - srcH) / 2,
        width: srcW,
        height: srcH,
        scaleX: 1,
        scaleY: 1
    }
}

function createScaleMethod(scaleFn: ScaleFn): ScaleMethod {
    return (srcW: number, srcH: number, dstW: number, dstH: number, minScale: number, maxScale: number) => {
        let scaleConstraint: (s: number) => number
        if (minScale != null && maxScale != null) {
            scaleConstraint = (v) => Math.min(maxScale, Math.max(minScale, v))
        } else if (minScale != null) {
            scaleConstraint = (v) => Math.max(minScale, v)
        } else if (maxScale != null) {
            scaleConstraint = (v) => Math.min(maxScale, v)
        } else {
            scaleConstraint = (v) => v
        }
        return scaleFn(srcW, srcH, dstW, dstH, scaleConstraint)
    }
}


export const SCALE_METHODS = {
    "fitcrop": createScaleMethod(fitcrop),
    "center": createScaleMethod(center),
    "resize": createScaleMethod(resize),
}

export type ScaleMethods = keyof typeof SCALE_METHODS
