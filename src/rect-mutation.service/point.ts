export class Point {
    public get top(): number { return this.y }
    public set top(val: number) { this.y = val }

    public get left(): number { return this.x }
    public set left(val: number) { this.x = val }

    public constructor(public x: number, public y: number) {
    }
}
