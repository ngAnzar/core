import { Renderer2 } from "@angular/core"


import { Destruct, IDisposable } from "../../util"
import { RippleOptions } from "./ripple-options"


const YOYO_SCALE_1 = 0.7
const YOYO_SCALE_2 = 0.8


export class RippleRef implements IDisposable {
    public readonly destruct = new Destruct()

    protected rippleEl: HTMLElement

    public disabled: boolean
    protected destroyed: boolean

    constructor(public readonly config: RippleOptions,
        protected readonly container: HTMLElement,
        protected renderer: Renderer2) {

    }

    public async play(): Promise<void> {
        if (this.disabled) {
            return
        }

        if (!this.config.yoyo) {
            await this.showAnim()
            await this.hideAnim()
            this.dispose()
        } else {
            this.showAnim()
            let fristScale = true

            return new Promise<void>((resolve, reject) => {
                setInterval(() => {
                    if (this.rippleEl) {
                        fristScale = !fristScale
                        window.getComputedStyle(this.rippleEl).getPropertyValue("opacity")
                        this.rippleEl.style.transform = `scale(${fristScale ? YOYO_SCALE_1 : YOYO_SCALE_2})`
                    } else {
                        resolve()
                    }
                }, this.config.duration)
            })

        }
    }

    public async showAnim(): Promise<void> {
        const bounds = this.container.getBoundingClientRect()

        if (this.config.centered) {
            this.config.x = bounds.width / 2
            this.config.y = bounds.height / 2
        }

        if (!this.config.radius) {
            this.config.radius = this.maxPossibleRadius(this.config.x, this.config.y, bounds)
        }

        if (!this.config.duration) {
            this.config.duration = 600
        }

        this.rippleEl = this.createElement()
        this.renderer.appendChild(this.container, this.rippleEl)
        // enforce style recalculation
        window.getComputedStyle(this.rippleEl).getPropertyValue("opacity")

        this.rippleEl.style.transform = this.config.yoyo ? `scale(${YOYO_SCALE_1})` : "scale(1)"

        this.destruct.element(this.rippleEl)

        return new Promise<void>((resolve, reject) => {
            setTimeout(resolve, this.config.duration)
        })
    }

    public async hideAnim(): Promise<void> {
        if (this.rippleEl) {
            //this.rippleEl.style.opacity = "0"
            this.rippleEl.style.transitionDuration = `${this.config.duration / 2}ms`
        }

        return new Promise<void>((resolve, reject) => {
            setTimeout(resolve, this.config.duration / 2)
        })
    }

    protected createElement(): HTMLElement {
        const el = this.renderer.createElement("span") as HTMLElement

        el.classList.add("nz-ripple-effect")
        el.style.display = "block"
        el.style.position = "absolute"
        el.style.borderRadius = "50%"
        el.style.pointerEvents = "none"
        el.style.left = `${this.config.x - this.config.radius}px`
        el.style.top = `${this.config.y - this.config.radius}px`
        el.style.width = `${this.config.radius * 2}px`
        el.style.height = `${this.config.radius * 2}px`
        el.style.opacity = "0.2"

        el.style.transform = "scale(0)"
        el.style.transition = `opacity, transform 0ms cubic-bezier(0, 0, 0.2, 1)`
        el.style.transitionDuration = `${this.config.duration}ms`

        return el
    }

    public dispose() {
        this.destruct.run()
    }

    protected maxPossibleRadius(x: number, y: number, rect: ClientRect) {
        const distX = Math.max(x, Math.abs(rect.width - x));
        const distY = Math.max(y, Math.abs(rect.height - y));
        return Math.sqrt(distX * distX + distY * distY);
    }
}
