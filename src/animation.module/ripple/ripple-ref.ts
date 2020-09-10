import { NgZone } from "@angular/core"


import { Destructible, FastDOM, rawSetTimeout } from "../../util"
import { RippleOptions } from "./ripple-options"


const YOYO_SCALE_1 = 0.7
const YOYO_SCALE_2 = 0.8


export class RippleRef extends Destructible {
    public disabled: boolean

    constructor(public readonly config: RippleOptions,
        protected readonly container: HTMLElement,
        private readonly zone: NgZone) {
        super()
    }

    public play() {
        if (this.disabled) {
            return
        }

        this.zone.runOutsideAngular(() => {
            const rippleEl = this.init()

            FastDOM.mutate(() => {
                rippleEl.style.opacity = "1"
                rippleEl.style.transform = "scale(1.1)"
                rawSetTimeout(this.dispose.bind(this), this.config.duration + 40)
            })

            rawSetTimeout(() => {
                FastDOM.mutate(() => {
                    rippleEl.style.opacity = "0"
                })
            }, this.config.duration / 2)
        })
    }

    public yoyo() {

    }

    protected init(): HTMLElement {
        // const bounds = this.container.getBoundingClientRect()
        let containerWidth
        let containerHeight

        if (this.config.mouse) {
            const bounds = this.container.getBoundingClientRect()
            containerWidth = bounds.width
            containerHeight = bounds.height
            this.config.x = this.config.mouse.x - bounds.left
            this.config.y = this.config.mouse.y - bounds.top
        } else {
            containerWidth = this.container.offsetWidth
            containerHeight = this.container.offsetHeight
            if (this.config.centered) {
                this.config.x = containerWidth / 2
                this.config.y = containerHeight / 2
            }
        }

        if (!this.config.radius) {
            this.config.radius = maxPossibleRadius(this.config.x, this.config.y, containerWidth, containerHeight)
        }

        if (!this.config.duration) {
            this.config.duration = 600
        }

        const el = this.createElement()
        this.destruct.element(el)
        this.container.appendChild(el)
        return el
    }

    protected createElement(): HTMLElement {
        const el = document.createElement("span") as HTMLElement

        el.classList.add("nz-ripple-effect")
        el.style.display = "block"
        el.style.position = "absolute"
        el.style.borderRadius = "50%"
        el.style.pointerEvents = "none"
        el.style.left = `${this.config.x - this.config.radius}px`
        el.style.top = `${this.config.y - this.config.radius}px`
        el.style.width = `${this.config.radius * 2}px`
        el.style.height = `${this.config.radius * 2}px`
        el.style.opacity = "0"
        el.style.transform = "scale(0)"
        el.style.transition = `opacity ${this.config.duration / 2}ms, transform ${this.config.duration}ms cubic-bezier(0, 0, 0.2, 1)`

        return el
    }


}


function maxPossibleRadius(x: number, y: number, w: number, h: number) {
    const distX = Math.max(x, Math.abs(w - x))
    const distY = Math.max(y, Math.abs(h - y))
    return Math.sqrt(distX * distX + distY * distY)
}
