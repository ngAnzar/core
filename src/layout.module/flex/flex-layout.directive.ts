import { Directive, Input, OnChanges, SimpleChanges, Inject, ElementRef } from "@angular/core"

import { CssService } from "../../common.module"
import { replaceClass, FlexDirectiveBase } from "./helper"


const FLEX_ALISASES: { [key: string]: string } = {
    "start": "flex-start",
    "end": "flex-end",
}


@Directive({
    selector: "[nzLayout]:not(ng-container)"
})
export class FlexLayoutDirective implements OnChanges {
    @Input("nzLayout") public type: string

    @Input("nzLayoutGap") public gap: string

    @Input("nzLayoutAlign") public align: string

    @Input("nzLayoutOnlyDecorated") public onlyDecoratedChild: boolean = false

    public readonly isInline: boolean = false
    public readonly isWrapped: boolean = false
    public readonly isRow: boolean
    public readonly justifyContent: string = "flex-start"
    public readonly alignItems: string = "stretch"
    public readonly alignContent: string = "flex-start"

    public constructor(
        @Inject(ElementRef) protected readonly el: ElementRef<HTMLElement>,
        @Inject(CssService) public readonly css: CssService) {
    }

    public ngOnChanges(changes: SimpleChanges) {
        let applyCls = false
        if ("align" in changes) {
            let [justify, align] = changes.align.currentValue.split(/\s+/);
            (this as { justifyContent: string }).justifyContent = FLEX_ALISASES[justify] || justify;
            (this as { alignItems: string }).alignItems = FLEX_ALISASES[align] || align;
            (this as { alignContent: string }).alignContent = FLEX_ALISASES[align] || align
            applyCls = true
        }

        if ("type" in changes) {
            let type = changes.type.currentValue;
            (this as { isInline: boolean }).isInline = type.indexOf("inline") > -1;
            (this as { isRow: boolean }).isRow = type.indexOf("row") > -1;
            (this as { isWrapped: boolean }).isWrapped = type.indexOf("wrap") > -1
            applyCls = true
        }

        if (applyCls) {
            const cls = `nz-layout-flex-${this.isRow ? 'row' : 'column'}${this.isInline ? '-inline' : ''}${this.isWrapped ? '-wrap' : ''}-${this.justifyContent}-${this.alignItems}`
            this.css.insertRule("." + cls, {
                display: this.isInline ? "inline-flex" : "flex",
                flexDirection: this.isRow ? "row" : "column",
                flexWrap: this.isWrapped ? "wrap" : "nowrap",
                justifyContent: this.justifyContent,
                alignItems: this.alignItems,
                alignContent: this.alignContent,
                overflow: "hidden"
            })

            replaceClass(this.el.nativeElement, "nz-layout-", cls, changes.type.firstChange)
        }

        applyCls = false
        if ("onlyDecoratedChild" in changes) {
            this.onlyDecoratedChild = !!changes.onlyDecoratedChild.currentValue
            applyCls = true
        }

        if ("gap" in changes) {
            this.gap = changes.gap.currentValue as string
            applyCls = true

        }

        if (applyCls) {
            const clsPrefix = `nz-layout-flex-gap-${this.isRow ? 'row' : 'column'}-${this.onlyDecoratedChild ? "oc" : "ac"}-${this.gap.replace("%", "")}`
            const childSelector = this.onlyDecoratedChild ? ".nz-layoutchild" : "*"

            if (this.isRow) {
                this.css.insertRule(`.${clsPrefix} > ${childSelector}`, {
                    marginLeft: this.gap
                })

                this.css.insertRule(`.${clsPrefix} > ${childSelector}:first-of-type, .${clsPrefix} > ${childSelector}.nz-hidden + ${childSelector}`, {
                    marginLeft: "0"
                })

                this.css.insertRule(`.${clsPrefix} > ${childSelector}:not(.nz-hidden) ~ ${childSelector}`, {
                    marginLeft: `${this.gap} !important`
                })
            } else {
                this.css.insertRule(`.${clsPrefix} > ${childSelector}`, {
                    marginTop: this.gap
                })

                this.css.insertRule(`.${clsPrefix} > ${childSelector}:first-of-type, .${clsPrefix} > ${childSelector}.nz-hidden + ${childSelector}`, {
                    marginTop: "0"
                })

                this.css.insertRule(`.${clsPrefix} > ${childSelector}:not(.nz-hidden) ~ ${childSelector}`, {
                    marginTop: `${this.gap} !important`
                })
            }

            replaceClass(this.el.nativeElement, "nz-layout-flex-gap", clsPrefix, changes.gap.firstChange)
        }
    }
}


@Directive({
    selector: "ng-container[nzLayout]"
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
