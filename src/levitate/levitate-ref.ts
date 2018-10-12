import { Levitating, Anchor, Constraint, LevitatingPosition, MagicCarpet } from "./levitate-compute"


export class LevitateRef {
    public readonly position: Readonly<LevitatingPosition>
    protected mc: MagicCarpet = new MagicCarpet(this)

    public constructor(public readonly levitate: Levitating,
        public readonly connect?: Anchor,
        public readonly constraint: Constraint = { ref: "viewport" }) {
    }

    public compute(): LevitatingPosition {
        this.mc.updateRects()
        return this.mc.levitate()
    }

    public apply(pos: Readonly<LevitatingPosition>) {
        (this as any).position = pos
        // TODO: renderer vagy valami
        let levitate = this.levitate.ref

        for (let k in pos) {
            if ((pos as any)[k] != null) {
                (levitate.style as any)[k] = `${(pos as any)[k]}px`
            }
        }

        // this.levitate.ref.style.right = `${pos.right}px`
        // this.levitate.ref.style.bottom = `${pos.bottom}px`
    }

    public update(): Readonly<LevitatingPosition> {
        let pos = this.compute()
        if (!this.position
            || this.position.left !== pos.left
            || this.position.top !== pos.top
            || this.position.maxWidth !== pos.maxWidth
            || this.position.maxHeight !== pos.maxHeight) {
            this.apply(pos)
        }
        return this.position
    }

    public dispose(): void {
        if (this.mc) {
            this.mc.dispose()
            delete this.mc
        }
    }
}
