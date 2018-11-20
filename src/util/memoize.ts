import "reflect-metadata"


function initMemoizedProperty(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    Object.defineProperty(target, propertyKey, {
        get: function (this: any) {
            return this[propertyKey] = descriptor.get.call(this)
        },
        configurable: true,
        enumerable: descriptor.enumerable
    })
}


function initMemoizedFunction(target: any, propertyKey: string) {

}


export function memoize() {
    return (target: any, propertyKey: string, descriptor?: PropertyDescriptor) => {
        if (descriptor) {
            initMemoizedProperty(target, propertyKey, descriptor)
        } else {
            initMemoizedFunction(target, propertyKey)
        }
    }
}
