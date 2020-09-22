import { Directive, Input, OnChanges, SimpleChanges, Inject, ElementRef } from "@angular/core"
import { BreakPoint } from "@angular/flex-layout"


import { CssService } from "../../common.module"
import { replaceClass, FlexDirectiveBase, Breakpoints, ValueChange } from "./helper"


const FLEX_ALISASES: { [key: string]: string } = {
    "start": "flex-start",
    "end": "flex-end",
}

// GENERATOR ["xs", "sm", "md", "lg", "xl", "lt-sm", "lt-md", "lt-lg", "lt-xl", "gt-xs", "gt-sm", "gt-md", "gt-lg"].map(v => `nzLayout.${v}`).join(", ")

const inputs = [
    "nzLayout",
    "nzLayout.xs", "nzLayout.sm", "nzLayout.md", "nzLayout.lg", "nzLayout.xl",
    "nzLayout.lt-sm", "nzLayout.lt-md", "nzLayout.lt-lg", "nzLayout.lt-xl",
    "nzLayout.gt-xs", "nzLayout.gt-sm", "nzLayout.gt-md", "nzLayout.gt-lg",
    "nzLayoutGap",
    "nzLayoutGap.xs", "nzLayoutGap.sm", "nzLayoutGap.md", "nzLayoutGap.lg", "nzLayoutGap.xl",
    "nzLayoutGap.lt-sm", "nzLayoutGap.lt-md", "nzLayoutGap.lt-lg", "nzLayoutGap.lt-xl",
    "nzLayoutGap.gt-xs", "nzLayoutGap.gt-sm", "nzLayoutGap.gt-md", "nzLayoutGap.gt-lg",
    "nzLayoutAlign",
    "nzLayoutAlign.xs", "nzLayoutAlign.sm", "nzLayoutAlign.md", "nzLayoutAlign.lg", "nzLayoutAlign.xl",
    "nzLayoutAlign.lt-sm", "nzLayoutAlign.lt-md", "nzLayoutAlign.lt-lg", "nzLayoutAlign.lt-xl",
    "nzLayoutAlign.gt-xs", "nzLayoutAlign.gt-sm", "nzLayoutAlign.gt-md", "nzLayoutAlign.gt-lg",
    "nzLayoutOnlyDecorated"
]


@Directive({
    selector: `[nzLayout]:not(ng-container),
        [nzLayout.xs]:not(ng-container), [nzLayout.sm]:not(ng-container), [nzLayout.md]:not(ng-container), [nzLayout.lg]:not(ng-container), [nzLayout.xl]:not(ng-container),
        [nzLayout.lt-sm]:not(ng-container), [nzLayout.lt-md]:not(ng-container), [nzLayout.lt-lg]:not(ng-container), [nzLayout.lt-xl]:not(ng-container),
        [nzLayout.gt-xs]:not(ng-container), [nzLayout.gt-sm]:not(ng-container), [nzLayout.gt-md]:not(ng-container), [nzLayout.gt-lg]:not(ng-container)
    `,
    inputs
})
export class FlexLayoutDirective extends FlexDirectiveBase<"nzLayout" | "nzLayoutGap" | "nzLayoutAlign" | "nzLayoutOnlyDecorated"> {

    public readonly nzLayoutOnlyDecorated: boolean

    public constructor(
        @Inject(ElementRef) protected readonly el: ElementRef<HTMLElement>,
        @Inject(CssService) protected readonly css: CssService,
    ) {
        super(inputs)
    }

    public ngOnChanges(changes: SimpleChanges) {
        super.ngOnChanges(changes)

        for (const breakPoint of this.css.breakpoints) {
            const group = this.values[breakPoint.alias as Breakpoints]
            if (group) {
                this._update(breakPoint, group.nzLayout, group.nzLayoutAlign, group.nzLayoutGap)
            }
        }

        // for (const media in this.values) {
        //     let first = true
        //     let byMedia = this.values[media as Breakpoints]
        //     for (const k in byMedia) {
        //         first = byMedia[k ].
        //     }
        // }
    }

    protected _update(bp: BreakPoint, layout?: ValueChange, align?: ValueChange, gap?: ValueChange) {
        if (layout) {
            if (!layout.parsed) {
                const value = layout.value as string
                layout.parsed = {
                    inline: value.indexOf("inline") > -1,
                    row: value.indexOf("row") > -1,
                    wrap: value.indexOf("wrap") > -1,
                }
            }
            const { inline, row, wrap } = layout.parsed
            const prefix = `nz-layout-flex-l-${bp.alias}-`
            const cls = `${prefix}${row ? 'row' : 'col'}${inline ? '-inline' : ''}${wrap ? '-wrap' : ''}`
            this.css.insertRule("." + cls, {
                display: inline ? "inline-flex" : "flex",
                flexDirection: row ? "row" : "column",
                flexWrap: wrap ? "wrap" : "nowrap",
                overflow: "hidden"
            }, bp.alias)
            replaceClass(this.el.nativeElement, prefix, cls, layout.first)
        }

        if (align) {
            if (!align.parsed) {
                let [flexJustify, flexAlign] = align.value.split(/\s+/)
                align.parsed = {
                    justifyContent: FLEX_ALISASES[flexJustify] || flexJustify,
                    alignItems: FLEX_ALISASES[flexAlign] || flexAlign,
                    alignContent: FLEX_ALISASES[flexAlign] || flexAlign,
                }
            }

            const { justifyContent, alignItems, alignContent } = align.parsed
            const prefix = `nz-layout-flex-a-${bp.alias}-`
            const cls = `${prefix}${alignItems}-${justifyContent}`
            this.css.insertRule("." + cls, {
                justifyContent,
                alignItems,
                alignContent,
            }, bp.alias)
            replaceClass(this.el.nativeElement, prefix, cls, align.first)
        }

        // TODO: detect browser can support gap property
        if (gap) {
            let gapLayout: ValueChange

            for (const breakpoint of this.css.breakpoints) {
                if (breakpoint.priority <= bp.priority) {
                    const bpGroup = this.values[breakpoint.alias as Breakpoints]
                    if (bpGroup && bpGroup.nzLayout) {
                        gapLayout = bpGroup.nzLayout
                    }
                }
            }

            if (!gapLayout) {
                throw new Error("Not found layout for gap")
            }

            const row = gapLayout.parsed ? gapLayout.parsed.row : gapLayout.value.indexOf("row") > -1
            const prefix = `nz-layout-flex-g-${bp.alias}-${row ? 'row' : 'col'}`
            const cls = `${prefix}${gap.value.replace("%", "")}`
            const childSelector = this.nzLayoutOnlyDecorated ? ".nz-layoutchild" : "*"

            if (row) {
                this.css.insertRule(`.${cls} > ${childSelector}`, {
                    marginLeft: gap.value
                })

                this.css.insertRule(`.${cls} > ${childSelector}:first-of-type, .${cls} > ${childSelector}.nz-hidden + ${childSelector}`, {
                    marginLeft: "0"
                })

                this.css.insertRule(`.${cls} > ${childSelector}:not(.nz-hidden) ~ ${childSelector}`, {
                    marginLeft: `${gap.value} !important`
                })
            } else {
                this.css.insertRule(`.${cls} > ${childSelector}`, {
                    marginTop: gap.value
                })

                this.css.insertRule(`.${cls} > ${childSelector}:first-of-type, .${cls} > ${childSelector}.nz-hidden + ${childSelector}`, {
                    marginTop: "0"
                })

                this.css.insertRule(`.${cls} > ${childSelector}:not(.nz-hidden) ~ ${childSelector}`, {
                    marginTop: `${gap.value} !important`
                })
            }

            replaceClass(this.el.nativeElement, prefix, cls, gap.first)
        }
    }

    // public ngOnChanges(changes: SimpleChanges) {
    //     let applyCls = false
    //     if ("align" in changes) {
    //         let [justify, align] = changes.align.currentValue.split(/\s+/);
    //         (this as { justifyContent: string }).justifyContent = FLEX_ALISASES[justify] || justify;
    //         (this as { alignItems: string }).alignItems = FLEX_ALISASES[align] || align;
    //         (this as { alignContent: string }).alignContent = FLEX_ALISASES[align] || align
    //         applyCls = true
    //     }

    //     if ("type" in changes) {
    //         let type = changes.type.currentValue;
    //         (this as { isInline: boolean }).isInline = type.indexOf("inline") > -1;
    //         (this as { isRow: boolean }).isRow = type.indexOf("row") > -1;
    //         (this as { isWrapped: boolean }).isWrapped = type.indexOf("wrap") > -1
    //         applyCls = true
    //     }

    //     if (applyCls) {
    //         const cls = `nz-layout-flex-${this.isRow ? 'row' : 'column'}${this.isInline ? '-inline' : ''}-${this.justifyContent}-${this.alignItems}`
    //         this.css.insertRule("." + cls, {
    //             display: this.isInline ? "inline-flex" : "flex",
    //             flexDirection: this.isRow ? "row" : "column",
    //             flexWrap: this.isWrapped ? "wrap" : "nowrap",
    //             justifyContent: this.justifyContent,
    //             alignItems: this.alignItems,
    //             alignContent: this.alignContent,
    //             overflow: "hidden"
    //         })

    //         replaceClass(this.el.nativeElement, "nz-layout-", cls, changes.type.firstChange)
    //     }

    //     applyCls = false
    //     if ("onlyDecoratedChild" in changes) {
    //         this.onlyDecoratedChild = !!changes.onlyDecoratedChild.currentValue
    //         applyCls = true
    //     }

    //     if ("gap" in changes) {
    //         this.gap = changes.gap.currentValue as string
    //         applyCls = true

    //     }

    //     if (applyCls) {
    //         const clsPrefix = `nz-layout-flex-gap-${this.isRow ? 'row' : 'column'}-${this.onlyDecoratedChild ? "oc" : "ac"}-${this.gap.replace("%", "")}`
    //         const childSelector = this.onlyDecoratedChild ? ".nz-layoutchild" : "*"

    //         if (this.isRow) {
    //             this.css.insertRule(`.${clsPrefix} > ${childSelector}`, {
    //                 marginLeft: this.gap
    //             })

    //             this.css.insertRule(`.${clsPrefix} > ${childSelector}:first-of-type, .${clsPrefix} > ${childSelector}.nz-hidden + ${childSelector}`, {
    //                 marginLeft: "0"
    //             })

    //             this.css.insertRule(`.${clsPrefix} > ${childSelector}:not(.nz-hidden) ~ ${childSelector}`, {
    //                 marginLeft: `${this.gap} !important`
    //             })
    //         } else {
    //             this.css.insertRule(`.${clsPrefix} > ${childSelector}`, {
    //                 marginTop: this.gap
    //             })

    //             this.css.insertRule(`.${clsPrefix} > ${childSelector}:first-of-type, .${clsPrefix} > ${childSelector}.nz-hidden + ${childSelector}`, {
    //                 marginTop: "0"
    //             })

    //             this.css.insertRule(`.${clsPrefix} > ${childSelector}:not(.nz-hidden) ~ ${childSelector}`, {
    //                 marginTop: `${this.gap} !important`
    //             })
    //         }

    //         replaceClass(this.el.nativeElement, "nz-layout-flex-gap", clsPrefix, changes.gap.firstChange)
    //     }
    // }
}


@Directive({
    selector: `ng-container[nzLayout],
        ng-container[nzLayout.xs], ng-container[nzLayout.sm], ng-container[nzLayout.md], ng-container[nzLayout.lg], ng-container[nzLayout.xl],
        ng-container[nzLayout.lt-sm], ng-container[nzLayout.lt-md], ng-container[nzLayout.lt-lg], ng-container[nzLayout.lt-xl],
        ng-container[nzLayout.gt-xs], ng-container[nzLayout.gt-sm], ng-container[nzLayout.gt-md], ng-container[nzLayout.gt-lg]
    `,
    inputs
})
export class FlexParentLayoutDirective extends FlexLayoutDirective {
    public constructor(
        @Inject(ElementRef) el: ElementRef<HTMLElement>,
        @Inject(CssService) css: CssService) {
        super({ nativeElement: el.nativeElement.parentNode as HTMLElement }, css)
    }
}





// const inputs = ["nzLayoutGap", "nzLayoutGap.lt-md"]


// @Directive({
//     selector: "[almafa]",
//     inputs
// })
// export class XTest extends FlexDirectiveBase<"nzLayout" | "nzLayoutGap" | "nzLayoutAlign"> {
//     public constructor() {
//         super(inputs)
//     }

//     public ngOnChanges(changes: SimpleChanges) {
//         super.ngOnChanges(changes)
//         console.log(this.values)
//     }
// }
