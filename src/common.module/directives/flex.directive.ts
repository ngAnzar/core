import { Directive, AfterContentInit, Inject, Attribute, ElementRef, Input, OnDestroy } from "@angular/core"


export abstract class BoxDirective implements AfterContentInit, OnDestroy {
    public abstract readonly gapMargin: string
    public abstract readonly gapMarginOpposite: string
    public readonly gap: number

    protected mutationObserver: MutationObserver

    public constructor(
        @Inject(ElementRef) protected readonly el: ElementRef<HTMLElement>,
        @Attribute("gap") gap: string) {
        this.gap = parseInt(gap || "", 10) || 0
    }

    public ngAfterContentInit() {
        if (this.gap) {
            this.updateGap()
            this.mutationObserver = new MutationObserver(mutationsList => {
                // console.log(mutationsList)
                // TODO: optimalizálni, hogy csak a szükséges elemeket módosítsa
                this.updateGap()
            })
            this.mutationObserver.observe(this.el.nativeElement, { childList: true, attributes: true, attributeFilter: ["class", "style"] })
        }
    }

    protected updateGap() {
        const childNodes = this.el.nativeElement.childNodes
        const childLength = childNodes.length
        let isFirst = true

        for (let i = 0; i < childLength; i++) {
            const child = childNodes[i] as HTMLElement
            if (child.nodeType === 1) {
                const computedStyle = window.getComputedStyle(child)
                const style = child.style as any

                style[this.gapMarginOpposite] = "0"

                // TODO: ...
                // if (computedStyle.visibility === "hidden" || computedStyle.display === "none") {
                //     style[this.gapMargin] = "0"
                //     continue
                // }

                if (isFirst) {
                    isFirst = false
                    continue
                }

                style[this.gapMargin] = `${this.gap}px`
            }
        }
    }

    public ngOnDestroy() {
        if (this.mutationObserver) {
            this.mutationObserver.disconnect()
            delete this.mutationObserver
        }
    }
}


@Directive({
    selector: ".nz-vbox, .nz-inline-vbox"
})
export class VboxDirective extends BoxDirective {
    public readonly gapMargin: string = "marginTop"
    public readonly gapMarginOpposite: string = "marginBottom"
}


@Directive({
    selector: ".nz-hbox, .nz-inline-hbox"
})
export class HboxDirective extends BoxDirective {
    public readonly gapMargin: string = "marginLeft"
    public readonly gapMarginOpposite: string = "marginRight"
}


@Directive({
    selector: "[flex]",
    host: {
        "[style.flex]": "flex",
        "[style.textAlign]": "textAlign", // FF: automatically add text-align: -moz-center
    }
})
export class FlexibleDirective {
    @Input() public flex: string
    @Input() public textAlign: string = "left"
}
